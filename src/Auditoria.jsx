import { useState, useEffect, useCallback } from "react";
import "./Auditoria.css";

// ── Helpers ─────────────────────────────────────────────────────────────────
function getAccionIcon(accion) {
  const a = accion.toLowerCase();
  if (a.includes("login"))       return "fa-sign-in-alt";
  if (a.includes("actualizar"))  return "fa-edit";
  if (a.includes("desarchivar")) return "fa-undo";
  if (a.includes("archivar"))    return "fa-archive";
  if (a.includes("exportar"))    return "fa-file-export";
  if (a.includes("eliminar"))    return "fa-trash-alt";
  if (a.includes("registro"))    return "fa-user-plus";
  return "fa-cog";
}

function getAccionColor(accion) {
  const a = accion.toLowerCase();
  if (a.includes("login"))       return "info";
  if (a.includes("actualizar"))  return "primary";
  if (a.includes("desarchivar")) return "success";
  if (a.includes("archivar"))    return "secondary";
  if (a.includes("exportar"))    return "warning";
  if (a.includes("eliminar"))    return "danger";
  if (a.includes("registro"))    return "purple";
  return "dark";
}

function getInitials(nombreCompleto = "") {
  return nombreCompleto
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function getRelativeTime(fechaStr) {
  const elapsed = Math.floor((Date.now() - new Date(fechaStr).getTime()) / 1000);
  if (elapsed < 60)          return "Hace un momento";
  if (elapsed < 3600)        return `Hace ${Math.floor(elapsed / 60)} min`;
  if (elapsed < 86400)       return `Hace ${Math.floor(elapsed / 3600)}h`;
  if (elapsed < 86400 * 7)   return `Hace ${Math.floor(elapsed / 86400)} días`;
  return new Date(fechaStr).toLocaleDateString("es-CO");
}

function formatDate(fechaStr) {
  return new Date(fechaStr).toLocaleDateString("es-CO");
}

function formatTime(fechaStr) {
  return new Date(fechaStr).toLocaleTimeString("es-CO");
}

function getDotClass(fechaStr) {
  const elapsed = Math.floor((Date.now() - new Date(fechaStr).getTime()) / 1000);
  if (elapsed < 3600)      return "dot-recent";
  if (elapsed > 86400 * 7) return "dot-old";
  return "dot-normal";
}

// ── Datos de ejemplo (reemplazar con llamadas a tu API) ──────────────────────
const MOCK_STATS = {
  total_acciones: 342,
  admins_activos: 5,
  total_logins: 87,
  total_actualizaciones: 124,
  total_archivados: 43,
  total_eliminados: 18,
  acciones_hoy: 12,
};

const MOCK_ADMINS = [
  { id: 1, username: "jgarcia",   nombre_completo: "Juan García" },
  { id: 2, username: "mlopez",    nombre_completo: "María López" },
  { id: 3, username: "crodriguez",nombre_completo: "Carlos Rodríguez" },
];

const MOCK_ACTIVIDADES = [
  { id: 1,  admin_id: 1, username: "jgarcia",    nombre_completo: "Juan García",      rol: "superadmin", accion: "Login exitoso",       descripcion: "Inicio de sesión desde navegador Chrome.", tabla_afectada: null,          registro_id: null, ip_address: "192.168.1.10", fecha: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: 2,  admin_id: 2, username: "mlopez",     nombre_completo: "María López",      rol: "admin",      accion: "Actualizar denuncia",  descripcion: "Se actualizó el estado de la denuncia #45 a 'En proceso'.", tabla_afectada: "denuncias",   registro_id: 45,   ip_address: "10.0.0.5",    fecha: new Date(Date.now() - 1000 * 60 * 22).toISOString() },
  { id: 3,  admin_id: 3, username: "crodriguez", nombre_completo: "Carlos Rodríguez", rol: "admin",      accion: "Archivar denuncia",    descripcion: "Denuncia #67 archivada tras revisión completa.", tabla_afectada: "denuncias",   registro_id: 67,   ip_address: "172.16.0.3",  fecha: new Date(Date.now() - 1000 * 3600 * 2).toISOString() },
  { id: 4,  admin_id: 1, username: "jgarcia",    nombre_completo: "Juan García",      rol: "superadmin", accion: "Eliminar registro",    descripcion: "Se eliminó el registro duplicado #12 de la tabla usuarios.", tabla_afectada: "usuarios",    registro_id: 12,   ip_address: "192.168.1.10", fecha: new Date(Date.now() - 1000 * 3600 * 5).toISOString() },
  { id: 5,  admin_id: 2, username: "mlopez",     nombre_completo: "María López",      rol: "admin",      accion: "Exportar reporte",     descripcion: "Exportación de reporte mensual en formato PDF.", tabla_afectada: "reportes",    registro_id: null, ip_address: "10.0.0.5",    fecha: new Date(Date.now() - 1000 * 86400).toISOString() },
  { id: 6,  admin_id: 3, username: "crodriguez", nombre_completo: "Carlos Rodríguez", rol: "admin",      accion: "Registro nuevo admin", descripcion: "Se registró el nuevo administrador 'pedrosanchez'.",  tabla_afectada: "administradores", registro_id: 6, ip_address: "172.16.0.3",  fecha: new Date(Date.now() - 1000 * 86400 * 2).toISOString() },
  { id: 7,  admin_id: 1, username: "jgarcia",    nombre_completo: "Juan García",      rol: "superadmin", accion: "Desarchivar denuncia", descripcion: "Denuncia #33 restaurada al flujo activo.",          tabla_afectada: "denuncias",   registro_id: 33,   ip_address: "192.168.1.10", fecha: new Date(Date.now() - 1000 * 86400 * 9).toISOString() },
  { id: 8,  admin_id: 2, username: "mlopez",     nombre_completo: "María López",      rol: "admin",      accion: "Login exitoso",        descripcion: "Inicio de sesión desde dispositivo móvil.", tabla_afectada: null,          registro_id: null, ip_address: "10.0.0.8",    fecha: new Date(Date.now() - 1000 * 86400 * 10).toISOString() },
];

const PER_PAGE = 20;

// ── Componente principal ─────────────────────────────────────────────────────
export default function Auditoria() {
  // Estado de filtros
  const [filtroAdmin,  setFiltroAdmin]  = useState("todos");
  const [filtroAccion, setFiltroAccion] = useState("todos");
  const [filtroFecha,  setFiltroFecha]  = useState("todos");
  const [page,         setPage]         = useState(1);

  // Contador auto-refresh
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (filtroFecha !== "hoy") return;
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 30; /* simula recarga */ }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [filtroFecha]);

  // Filtrado local (en producción esto sería una llamada a la API)
  const actividades = MOCK_ACTIVIDADES.filter((act) => {
    if (filtroAdmin !== "todos" && act.admin_id !== Number(filtroAdmin)) return false;
    if (filtroAccion !== "todos" && !act.accion.toLowerCase().includes(filtroAccion.toLowerCase())) return false;
    if (filtroFecha !== "todos") {
      const elapsed = (Date.now() - new Date(act.fecha).getTime()) / 1000;
      if (filtroFecha === "hoy"    && elapsed > 86400)     return false;
      if (filtroFecha === "semana" && elapsed > 86400 * 7)  return false;
      if (filtroFecha === "mes"    && elapsed > 86400 * 30) return false;
    }
    return true;
  });

  const totalRegistros = actividades.length;
  const totalPaginas   = Math.ceil(totalRegistros / PER_PAGE);
  const paginadas      = actividades.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleFiltrar = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleLimpiar = () => {
    setFiltroAdmin("todos");
    setFiltroAccion("todos");
    setFiltroFecha("todos");
    setPage(1);
  };

  // Rango de páginas
  const paginRange = () => {
    const ini = Math.max(1, page - 2);
    const fin = Math.min(totalPaginas, page + 2);
    return Array.from({ length: fin - ini + 1 }, (_, i) => ini + i);
  };

  return (
    <>
      {/* ── TOPBAR ─────────────────────────────────────────────────────── */}
      <nav className="aud-topbar">
        <div className="aud-topbar-inner">
          <a href="/admin" className="aud-topbar-brand">
            <div className="aud-brand-icon">
              <i className="fas fa-shield-alt" />
            </div>
            <span className="aud-topbar-brand-text">
              <span className="choco">Choco</span>
              <span className="vis">Visible</span>
              <span className="sep">·</span>
              <span className="adm">Admin</span>
            </span>
          </a>

          <div className="aud-topbar-nav">
            <a href="/admin"     className="aud-topbar-link"><i className="fas fa-tachometer-alt" /><span>Dashboard</span></a>
            <a href="/auditoria" className="aud-topbar-link active"><i className="fas fa-history" /><span>Auditoría</span></a>

            <a href="#"          className="aud-topbar-link"><i className="fas fa-external-link-alt" /><span>Ver sitio</span></a>
            <a href="/login"     className="aud-topbar-link danger"><i className="fas fa-sign-out-alt" /><span>Salir</span></a>
          </div>

          <div className="aud-topbar-user">
            <div className="aud-user-avatar">A</div>
            <span>Admin</span>
          </div>
        </div>
      </nav>

      {/* ── CONTENIDO ──────────────────────────────────────────────────── */}
      <div className="aud-page-wrap">

        {/* Page header */}
        <div className="aud-page-head">
          <div className="aud-page-head-left">
            <h1><i className="fas fa-history" />Auditoría del Sistema</h1>
            <p>
              Registro completo de actividades de administradores ·{" "}
              {new Date().toLocaleDateString("es-CO")}{" "}
              {new Date().toLocaleTimeString("es-CO")}
            </p>
          </div>
          <div className="aud-page-head-right">
            {filtroFecha === "hoy" && (
              <div className="aud-refresh-badge">
                <span className="aud-live-dot" />
                Auto-refresh en <strong>{countdown}s</strong>
              </div>
            )}
            <button className="btn-cv btn-cv-outline-white" onClick={handleLimpiar}>
              <i className="fas fa-sync-alt" /> <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="aud-stats-grid">
          {[
            { cls: "s-total",    icon: "fa-list",         val: MOCK_STATS.total_acciones,      label: "Total Acciones" },
            { cls: "s-admins",   icon: "fa-users",        val: MOCK_STATS.admins_activos,      label: "Admins Activos" },
            { cls: "s-logins",   icon: "fa-sign-in-alt",  val: MOCK_STATS.total_logins,        label: "Inicios Sesión" },
            { cls: "s-updates",  icon: "fa-edit",         val: MOCK_STATS.total_actualizaciones,label: "Actualizaciones" },
            { cls: "s-archives", icon: "fa-archive",      val: MOCK_STATS.total_archivados,    label: "Archivados" },
            { cls: "s-deletes",  icon: "fa-trash-alt",    val: MOCK_STATS.total_eliminados,    label: "Eliminaciones" },
            { cls: "s-today",    icon: "fa-calendar-day", val: MOCK_STATS.acciones_hoy,        label: "Hoy" },
          ].map(({ cls, icon, val, label }) => (
            <div key={cls} className={`aud-stat-card ${cls}`}>
              <div className="aud-stat-icon"><i className={`fas ${icon}`} /></div>
              <div className="aud-stat-num">{val}</div>
              <div className="aud-stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="aud-filter-card">
          <h6><i className="fas fa-filter" />Filtrar registros</h6>
          <form className="aud-filter-form" onSubmit={handleFiltrar}>
            <div className="aud-filter-group">
              <label>Administrador</label>
              <select value={filtroAdmin} onChange={(e) => setFiltroAdmin(e.target.value)}>
                <option value="todos">Todos los administradores</option>
                {MOCK_ADMINS.map((adm) => (
                  <option key={adm.id} value={adm.id}>
                    {adm.nombre_completo} (@{adm.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="aud-filter-group">
              <label>Tipo de acción</label>
              <select value={filtroAccion} onChange={(e) => setFiltroAccion(e.target.value)}>
                <option value="todos">Todas las acciones</option>
                <option value="Login">Inicios de sesión</option>
                <option value="Actualizar">Actualizaciones</option>
                <option value="Archivar">Archivados</option>
                <option value="Desarchivar">Desarchivados</option>
                <option value="Exportar">Exportaciones</option>
                <option value="Eliminar">Eliminaciones</option>
                <option value="Registro">Registros</option>
              </select>
            </div>

            <div className="aud-filter-group">
              <label>Período</label>
              <select value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)}>
                <option value="todos">Todo el tiempo</option>
                <option value="hoy">Hoy</option>
                <option value="semana">Última semana</option>
                <option value="mes">Último mes</option>
              </select>
            </div>

            <div className="aud-filter-actions">
              <button type="submit" className="btn-cv btn-cv-primary">
                <i className="fas fa-search" /> Filtrar
              </button>
              <button type="button" className="btn-cv btn-cv-outline" onClick={handleLimpiar} title="Limpiar filtros">
                <i className="fas fa-times" />
              </button>
            </div>
          </form>
        </div>

        {/* Tabla */}
        <div className="aud-table-card">
          <div className="aud-table-head-bar">
            <h5><i className="fas fa-list-alt" />Registro de Actividades</h5>
            <small>
              Mostrando {Math.min(PER_PAGE, Math.max(0, totalRegistros - (page - 1) * PER_PAGE))} de {totalRegistros} registros
              {totalPaginas > 1 && ` · Página ${page} de ${totalPaginas}`}
            </small>
          </div>

          <div className="aud-table-wrap">
            <table className="aud-table">
              <thead>
                <tr>
                  <th style={{ width: 140 }}><i className="fas fa-clock" />Fecha y hora</th>
                  <th style={{ width: 200 }}><i className="fas fa-user" />Administrador</th>
                  <th style={{ width: 180 }}><i className="fas fa-cog" />Acción</th>
                  <th><i className="fas fa-info-circle" />Descripción</th>
                  <th style={{ width: 130 }}><i className="fas fa-network-wired" />IP</th>
                </tr>
              </thead>
              <tbody>
                {paginadas.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="aud-empty-state">
                        <div className="aud-empty-icon"><i className="fas fa-search" /></div>
                        <h6>Sin registros</h6>
                        <p>No hay actividades que coincidan con los filtros seleccionados.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginadas.map((act) => {
                    const elapsed    = Math.floor((Date.now() - new Date(act.fecha).getTime()) / 1000);
                    const esRecent   = elapsed < 3600;
                    const dotClass   = getDotClass(act.fecha);
                    const rowClass   = esRecent
                      ? "row-recent"
                      : act.accion.toLowerCase().includes("eliminar")
                      ? "row-danger"
                      : "";
                    const color    = getAccionColor(act.accion);
                    const icon     = getAccionIcon(act.accion);
                    const initials = getInitials(act.nombre_completo);
                    const isSuperAdmin = act.rol?.toLowerCase() === "superadmin";

                    return (
                      <tr key={act.id} className={rowClass}>
                        {/* Fecha */}
                        <td>
                          <div className="aud-time-cell">
                            <span className={`aud-time-dot ${dotClass}`} />
                            <div>
                              <div className="aud-date">{formatDate(act.fecha)}</div>
                              <div className="aud-time">{formatTime(act.fecha)}</div>
                              <div className="aud-ago">{getRelativeTime(act.fecha)}</div>
                            </div>
                          </div>
                        </td>

                        {/* Admin */}
                        <td>
                          <div className="aud-admin-row">
                            <div className={`aud-admin-av${isSuperAdmin ? " role-superadmin" : ""}`}>
                              {initials}
                            </div>
                            <div>
                              <div className="aud-admin-name">{act.nombre_completo}</div>
                              <div className="aud-admin-user">@{act.username}</div>
                              {act.rol && <div className="aud-admin-rol">{act.rol}</div>}
                            </div>
                          </div>
                        </td>

                        {/* Acción */}
                        <td>
                          <span className={`aud-action-badge ab-${color}`}>
                            <i className={`fas ${icon}`} />
                            {act.accion}
                          </span>
                        </td>

                        {/* Descripción */}
                        <td>
                          <div className="aud-desc">{act.descripcion}</div>
                          {act.tabla_afectada && (
                            <div className="aud-meta-chips">
                              <span className="aud-meta-chip">
                                <i className="fas fa-table" />{act.tabla_afectada}
                              </span>
                              {act.registro_id && (
                                <span className="aud-meta-chip">
                                  <i className="fas fa-hashtag" />ID {act.registro_id}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* IP */}
                        <td>
                          <span className="aud-ip-code">{act.ip_address}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <nav className="aud-pagination">
            {page > 1 && (
              <button className="aud-page-btn" onClick={() => setPage(page - 1)}>
                <i className="fas fa-chevron-left" /> Ant.
              </button>
            )}
            {paginRange()[0] > 1 && (
              <>
                <button className="aud-page-btn" onClick={() => setPage(1)}>1</button>
                {paginRange()[0] > 2 && <span className="aud-page-ellipsis">…</span>}
              </>
            )}
            {paginRange().map((p) => (
              <button
                key={p}
                className={`aud-page-btn${p === page ? " active" : ""}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            {paginRange()[paginRange().length - 1] < totalPaginas && (
              <>
                {paginRange()[paginRange().length - 1] < totalPaginas - 1 && (
                  <span className="aud-page-ellipsis">…</span>
                )}
                <button className="aud-page-btn" onClick={() => setPage(totalPaginas)}>
                  {totalPaginas}
                </button>
              </>
            )}
            {page < totalPaginas && (
              <button className="aud-page-btn" onClick={() => setPage(page + 1)}>
                Sig. <i className="fas fa-chevron-right" />
              </button>
            )}
          </nav>
        )}

        {/* Footer */}
        <div className="aud-footer-bar">
          <span>
            <i className="fas fa-shield-alt" />
            ChocoVisible · Registro de Auditoría · {totalRegistros} actividades registradas
          </span>
          <a href="/admin">
            <i className="fas fa-arrow-left" />Volver al Dashboard
          </a>
        </div>

      </div>{/* /page-wrap */}
    </>
  );
}