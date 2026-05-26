// Admin.jsx — Panel de Administración ChocoVisible
// Convierte admin.php completo a React con todas las funcionalidades
// Requiere: React, react-router-dom, axios (o fetch nativo)
// Conecta al mismo backend PHP (API REST) o al PHP existente vía fetch

import { useState, useEffect, useCallback, useRef } from "react";
import "./Admin.css";

/* ════════════════════════════════════════════════════════
   CONFIGURACIÓN — ajusta esta URL a tu backend
════════════════════════════════════════════════════════ */
const API_BASE = "https://chocovisible-backend.onrender.com/api";// cambia a la URL de tu backend PHP

/* ════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════ */
function normalizarEstado(estado) {
  if (!estado || estado.trim() === "") return "pendiente";
  const e = estado.trim().toLowerCase();
  if (["en_proceso", "en proceso", "enproceso", "proceso"].includes(e)) return "en_proceso";
  if (["resuelto", "resueltas", "completado", "finalizado"].includes(e)) return "resuelto";
  if (["archivado", "archivo"].includes(e)) return "archivado";
  return "pendiente";
}

function etiquetaEstado(en) {
  return { pendiente: "Pendiente", en_proceso: "En Proceso", resuelto: "Resuelto", archivado: "Archivado" }[en] || "Pendiente";
}

function formatFecha(f, soloFecha = false) {
  if (!f) return "Sin fecha";
  try {
    const d = new Date(f);
    if (soloFecha) return d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
    return d.toLocaleString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return f; }
}

function isImage(nombre) {
  return /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(nombre || "");
}

/* ════════════════════════════════════════════════════════
   HOOKS
════════════════════════════════════════════════════════ */
function useApi() {
  const request = useCallback(async (endpoint, options = {}) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Error de red" }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }, []);

  return { request };
}

/* ════════════════════════════════════════════════════════
   TOAST
════════════════════════════════════════════════════════ */
function Toast({ toasts, removeToast }) {
  const colors = {
    info: "var(--cv-blue-light)",
    warning: "var(--cv-gold)",
    error: "var(--cv-danger)",
    success: "var(--cv-green-mid)",
  };
  const icons = {
    info: "fa-info-circle",
    warning: "fa-exclamation-triangle",
    error: "fa-exclamation-circle",
    success: "fa-check-circle",
  };
  return (
    <div className="cv-toast-container">
      {toasts.map((t) => (
        <div key={t.id} className="cv-toast" style={{ borderLeftColor: colors[t.type] }}>
          <i className={`fas ${icons[t.type]}`} style={{ color: colors[t.type], flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{t.msg}</span>
          <button onClick={() => removeToast(t.id)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.6, fontSize: 13 }}>
            <i className="fas fa-times" />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);
  const remove = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, show, remove };
}

/* ════════════════════════════════════════════════════════
   LIGHTBOX
════════════════════════════════════════════════════════ */
function Lightbox({ imgs, idx, onClose, onNav }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNav(1);
      if (e.key === "ArrowLeft") onNav(-1);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, onNav]);

  if (!imgs.length) return null;
  return (
    <div className="cv-lightbox open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button className="cv-lightbox-close" onClick={onClose}><i className="fas fa-times" /></button>
      <div className="cv-lightbox-bar">
        <button className="cv-lightbox-nav" onClick={() => onNav(-1)}><i className="fas fa-chevron-left" /></button>
        <img src={imgs[idx]} alt={`Evidencia ${idx + 1}`} />
        <button className="cv-lightbox-nav" onClick={() => onNav(1)}><i className="fas fa-chevron-right" /></button>
      </div>
      <div className="cv-lightbox-caption">Evidencia {idx + 1} de {imgs.length}</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   ESTADO BADGE
════════════════════════════════════════════════════════ */
function EstadoBadge({ estado }) {
  const en = normalizarEstado(estado);
  return <span className={`cv-estado-badge ${en}`}>{etiquetaEstado(en)}</span>;
}

/* ════════════════════════════════════════════════════════
   ENRUTAMIENTO BADGE
════════════════════════════════════════════════════════ */
function EnrutBadge({ estado }) {
  const map = {
    pendiente:     { color: "#E8A020", icon: "fa-clock",          text: "Sin notificar" },
    notificada:    { color: "#1A73D6", icon: "fa-paper-plane",    text: "Notificada" },
    confirmada:    { color: "#1A6636", icon: "fa-check-circle",   text: "Confirmada" },
    sin_autoridad: { color: "#6B7280", icon: "fa-question-circle",text: "Sin autoridad" },
  };
  const cfg = map[estado] || map.pendiente;
  return (
    <small style={{ fontSize: 11, color: cfg.color, display: "flex", alignItems: "center", gap: 3, marginTop: 3 }}>
      <i className={`fas ${cfg.icon}`} /> {cfg.text}
    </small>
  );
}

/* ════════════════════════════════════════════════════════
   MODAL DETALLE
════════════════════════════════════════════════════════ */
function ModalDetalle({ denuncia: d, onClose, onActualizar, onArchivar, onDesarchivar, onNotificar, toast }) {
  const [tab, setTab] = useState("estado");
  const [nuevoEstado, setNuevoEstado] = useState(normalizarEstado(d.estado));
  const [descAct, setDescAct] = useState("");
  const [motivoArch, setMotivoArch] = useState("");
  const [nuevoEstadoDesarch, setNuevoEstadoDesarch] = useState(d.estado_anterior || "pendiente");
  const [notasEnrut, setNotasEnrut] = useState(d.enrut_notas || "");
  const [saving, setSaving] = useState(false);
  const [lbImgs, setLbImgs] = useState([]);
  const [lbIdx, setLbIdx] = useState(0);
  const [lbOpen, setLbOpen] = useState(false);

  const en = normalizarEstado(d.estado);
  const archivada = en === "archivado";
  const fotos = d.fotos || [];
  const actualizaciones = d.actualizaciones || [];

  const imgSrcs = fotos
    .filter((f) => isImage(f.ruta || f.nombre_archivo))
    .map((f) => f.ruta || f.url || "");

  function abrirLightbox(src) {
    const idx = imgSrcs.indexOf(src);
    setLbIdx(idx >= 0 ? idx : 0);
    setLbImgs(imgSrcs);
    setLbOpen(true);
    document.body.style.overflow = "hidden";
  }

  function cerrarLightbox() {
    setLbOpen(false);
    document.body.style.overflow = "";
  }

  async function handleActualizar(e) {
    e.preventDefault();
    if (!nuevoEstado) { toast.show("Selecciona un estado", "warning"); return; }
    if (!descAct.trim()) { toast.show("Agrega una descripción", "warning"); return; }
   
    setSaving(true);
    try {
      await onActualizar(d.id, nuevoEstado, descAct);
      setDescAct("");
      onClose();
    } catch (err) {
      toast.show(err.message, "error");
    } finally { setSaving(false); }
  }

  async function handleArchivar(e) {
    e.preventDefault();
    if (!motivoArch) { toast.show("Selecciona un motivo", "warning"); return; }
    if (!confirm(`¿Archivar esta denuncia?\n\nMotivo: ${motivoArch}\n\nEl archivado es reversible.`)) return;
    setSaving(true);
    try {
      await onArchivar(d.id, motivoArch);
      onClose();
    } catch (err) {
      toast.show(err.message, "error");
    } finally { setSaving(false); }
  }

  async function handleDesarchivar(e) {
    e.preventDefault();
    if (!nuevoEstadoDesarch) { toast.show("Selecciona el estado", "warning"); return; }
    if (!confirm(`¿Desarchivar esta denuncia?\n\nSe restaurará al estado: ${etiquetaEstado(nuevoEstadoDesarch)}`)) return;
    setSaving(true);
    try {
      await onDesarchivar(d.id, nuevoEstadoDesarch);
      onClose();
    } catch (err) {
      toast.show(err.message, "error");
    } finally { setSaving(false); }
  }

  async function handleNotificar(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onNotificar(d.id, notasEnrut);
      onClose();
    } catch (err) {
      toast.show(err.message, "error");
    } finally { setSaving(false); }
  }

  return (
    <>
      <div className="cv-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="cv-modal cv-modal-xl">
          {/* Header */}
          <div className="cv-modal-header">
            <h5>
              <i className="fas fa-file-alt" />
              Denuncia #{d.codigo_seguimiento || "SIN-CÓDIGO"}
              {archivada && <span className="cv-estado-badge archivado ms-2" style={{ fontSize: 11 }}>Archivada</span>}
            </h5>
            <button className="cv-modal-close" onClick={onClose}><i className="fas fa-times" /></button>
          </div>

          <div className="cv-modal-body">
            <div className="row-g row-g-2">
              {/* Col izquierda — Info */}
              <div>
                <div className="cv-section-card">
                  <div className="cv-section-head green"><i className="fas fa-info-circle" />Información de la Denuncia</div>
                  <div className="cv-section-body">
                    <div className="cv-info-block">
                      <div className="cv-info-label"><i className="fas fa-tag" />Tipo</div>
                      <div className="cv-info-value">
                        <span className="cv-tipo-pill" style={{
                          background: d.tipo_color ? `${d.tipo_color}22` : "rgba(107,114,128,.1)",
                          color: d.tipo_color || "var(--cv-gray)",
                          border: `1px solid ${d.tipo_color ? `${d.tipo_color}44` : "var(--cv-border)"}`,
                        }}>
                          {d.tipo_icono && <i className={`fas ${d.tipo_icono}`} />}
                          {d.tipo_nombre || d.tipo || "Sin tipo"}
                        </span>
                        {d.autoridad_sigla && (
                          <div style={{ fontSize: 11, color: "var(--cv-muted)", marginTop: 4 }}>
                            <i className="fas fa-building me-1" />{d.autoridad_sigla}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="cv-info-block">
                      <div className="cv-info-label"><i className="fas fa-circle-dot" />Estado</div>
                      <EstadoBadge estado={d.estado} />
                    </div>
                    <div className="cv-info-block">
                      <div className="cv-info-label"><i className="fas fa-align-left" />Descripción</div>
                      <div className="cv-info-value" style={{ whiteSpace: "pre-line" }}>{d.descripcion || "Sin descripción"}</div>
                    </div>
                    <div className="row-g row-g-2">
                      <div className="cv-info-block mb-0">
                        <div className="cv-info-label"><i className="fas fa-calendar" />Fecha</div>
                        <div className="cv-info-value">{formatFecha(d.fecha, true)}</div>
                      </div>
                      <div className="cv-info-block mb-0">
                        <div className="cv-info-label"><i className="fas fa-clock" />Hora</div>
                        <div className="cv-info-value">{d.fecha ? new Date(d.fecha).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "—"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Denunciante */}
                <div className="cv-section-card">
                  <div className="cv-section-head blue"><i className="fas fa-user" />Datos del Denunciante</div>
                  <div className="cv-section-body">
                    <div className="cv-info-block">
                      <div className="cv-info-label"><i className="fas fa-user-circle" />Nombre</div>
                      <div className="cv-info-value">{d.nombre_denunciante || "Anónimo"}</div>
                    </div>
                    <div className="cv-info-block">
                      <div className="cv-info-label"><i className="fas fa-envelope" />Email</div>
                      <div className="cv-info-value">{d.email_denunciante || "Sin email"}</div>
                    </div>
                    <div className="cv-info-block">
                      <div className="cv-info-label"><i className="fas fa-phone" />Contacto</div>
                      <div className="cv-info-value">{d.contacto_denunciante || "Sin contacto"}</div>
                    </div>
                    {d.latitud && d.longitud && (
                      <div className="cv-info-block">
                        <div className="cv-info-label"><i className="fas fa-map-marker-alt" />Ubicación</div>
                        <div className="cv-info-value">
                          <a
                            href={`https://www.google.com/maps?q=${d.latitud},${d.longitud}`}
                            target="_blank" rel="noreferrer" className="cv-map-link"
                          >
                            <i className="fas fa-map-marker-alt" /> Ver en mapa
                          </a>
                          <div style={{ fontSize: 11, color: "var(--cv-muted)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                            {d.latitud}, {d.longitud}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Col derecha — Evidencias + Historial */}
              <div>
                <div className="cv-section-card">
                  <div className="cv-section-head gray"><i className="fas fa-paperclip" />Evidencias Adjuntas</div>
                  <div className="cv-section-body">
                    {fotos.length > 0 ? (
                      <>
                        <div className="cv-ev-grid">
                          {fotos.map((foto, i) => {
                            const ruta = foto.ruta || foto.url || "";
                            const esImg = isImage(ruta);
                            const ext = ruta.split(".").pop()?.toLowerCase() || "";
                            const iconMap = { pdf: ["fa-file-pdf", "#DC2626"], docx: ["fa-file-word", "#1A73D6"], doc: ["fa-file-word", "#1A73D6"], xlsx: ["fa-file-excel", "#10B981"], xls: ["fa-file-excel", "#10B981"], txt: ["fa-file-lines", "#6B7280"] };
                            const [ico, icoColor] = iconMap[ext] || ["fa-file", "#6B7280"];
                            return (
                              <div key={i} className="cv-ev-thumb" onClick={() => esImg && abrirLightbox(ruta)}>
                                {esImg ? (
                                  <img src={ruta} alt={`Evidencia ${i + 1}`} data-src={ruta} />
                                ) : (
                                  <a href={ruta} target="_blank" rel="noreferrer" download
                                     style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 8, textDecoration: "none" }}
                                     onClick={(e) => e.stopPropagation()}>
                                    <i className={`fas ${ico}`} style={{ fontSize: 24, color: icoColor }} />
                                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--cv-muted)" }}>{ext.toUpperCase()}</span>
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ marginTop: 8, fontSize: 11, color: "var(--cv-muted)" }}>
                          <i className="fas fa-info-circle" style={{ marginRight: 4 }} />
                          Haz clic en una imagen para verla · Documentos se descargan automáticamente
                        </div>
                        <div className="d-flex gap-2 mt-2">
                          <span className="cv-archivo-chip"><i className="fas fa-camera" /> {fotos.length} evidencias</span>
                          <span className="cv-archivo-chip"><i className="fas fa-comments" /> {actualizaciones.length} actualizaciones</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: "center", padding: "18px 0", color: "var(--cv-muted)", fontSize: 13 }}>
                        <i className="fas fa-folder-open" style={{ fontSize: 22, opacity: .35, display: "block", marginBottom: 8 }} />
                        Sin evidencias adjuntas
                      </div>
                    )}
                  </div>
                </div>

                {/* Historial de actualizaciones */}
                {actualizaciones.length > 0 && (
                  <div className="cv-section-card">
                    <div className="cv-section-head blue"><i className="fas fa-history" />Historial de Actualizaciones</div>
                    <div className="cv-section-body">
                      <div className="cv-historia-list">
                        {actualizaciones.map((a, i) => (
                          <div key={i} className="cv-historia-item">
                            <div className="cv-historia-header">
                              <span className="cv-historia-who"><i className="fas fa-user me-1" />{a.responsable || "Administrador"}</span>
                              <span className="cv-historia-when">{formatFecha(a.fecha)}</span>
                            </div>
                            <div className="cv-historia-desc">{a.descripcion}</div>
                            {a.estado_anterior && a.estado_nuevo && (
                              <div className="cv-estado-arrow mt-2">
                                <EstadoBadge estado={a.estado_anterior} />
                                <i className="fas fa-arrow-right" style={{ fontSize: 11, color: "var(--cv-muted)" }} />
                                <EstadoBadge estado={a.estado_nuevo} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Gestión (solo si no archivada) ── */}
            {!archivada && (
              <>
                <div className="hr-cv" />
                <div className="cv-section-card">
                  <div className="cv-section-head dark"><i className="fas fa-edit" />Gestionar Denuncia</div>
                  <div className="cv-section-body">
                    {/* Autoridad */}
                    {d.autoridad_nombre && (
                      <div className="cv-authority-panel" style={{
                        borderLeft: `4px solid ${d.tipo_color || "var(--cv-green)"}`,
                        background: `${d.tipo_color || "#1A6636"}0d`,
                        marginBottom: 16,
                      }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--cv-muted)", marginBottom: 3 }}>
                            <i className="fas fa-sitemap" style={{ marginRight: 4 }} />Autoridad competente
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--cv-text)" }}>{d.autoridad_nombre}</div>
                          {d.autoridad_email && (
                            <div style={{ fontSize: 12, color: "var(--cv-muted)", marginTop: 2 }}>
                              <i className="fas fa-envelope" style={{ marginRight: 4 }} />{d.autoridad_email}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {d.autoridad_sigla && (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: `${d.tipo_color || "#1A6636"}22`, color: d.tipo_color || "#1A6636", border: `1px solid ${d.tipo_color || "#1A6636"}44` }}>
                              {d.autoridad_sigla}
                            </span>
                          )}
                          <EnrutBadge estado={d.estado_enrutamiento || "pendiente"} />
                        </div>
                      </div>
                    )}

                    {/* Tabs */}
                    <div className="cv-tabs">
                      {[
                        { id: "estado",   label: "Actualizar Estado", icon: "fa-edit" },
                        { id: "enrut",    label: "Enrutar", icon: "fa-paper-plane", dot: d.estado_enrutamiento === "pendiente" && d.autoridad_nombre },
                        { id: "archivar", label: "Archivar", icon: "fa-archive" },
                      ].map((t) => (
                        <button key={t.id} className={`cv-tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                          <i className={`fas ${t.icon}`} /> {t.label}
                          {t.dot && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#E8A020", display: "inline-block", marginLeft: 4 }} />}
                        </button>
                      ))}
                    </div>

                    {/* Tab: Actualizar Estado */}
                    {tab === "estado" && (
                      <form onSubmit={handleActualizar}>
                        <div className="cv-form-row">
                          <div>
                            <label className="cv-label">Nuevo estado</label>
                            <select className="cv-select" value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)} required>
                              <option value="">Seleccionar</option>
                              <option value="pendiente">⏳ Pendiente</option>
                              <option value="en_proceso">🔄 En Proceso</option>
                              <option value="resuelto">✅ Resuelto</option>
                            </select>
                          </div>
                          <div>
                            <label className="cv-label">Descripción de la actualización</label>
                            <input className="cv-input" type="text" placeholder="Describe los cambios realizados..." maxLength={255} value={descAct} onChange={(e) => setDescAct(e.target.value)} required />
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                          <button type="submit" className="btn-cv btn-primary-cv" disabled={saving}>
                            {saving ? <><i className="fas fa-spinner spinning" /> Guardando…</> : <><i className="fas fa-save" /> Guardar cambios</>}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Tab: Enrutar */}
                    {tab === "enrut" && (
                      <div>
                        {d.autoridad_nombre ? (
                          <>
                            <div style={{ background: "var(--cv-off)", border: "1px solid var(--cv-border)", borderRadius: 10, padding: 16, marginBottom: 14 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cv-text-2)", marginBottom: 6 }}>
                                <i className="fas fa-info-circle" style={{ color: "var(--cv-blue-mid)", marginRight: 8 }} />
                                Asignada a: <strong>{d.autoridad_nombre}</strong>
                              </div>
                              {d.enrut_fecha && (
                                <div style={{ fontSize: 12, color: "var(--cv-muted)" }}>
                                  <i className="fas fa-clock" style={{ marginRight: 4 }} />Último enrutamiento: {formatFecha(d.enrut_fecha)}
                                </div>
                              )}
                              {d.enrut_notas && (
                                <div style={{ fontSize: 12, color: "var(--cv-muted)", marginTop: 4 }}>
                                  <i className="fas fa-sticky-note" style={{ marginRight: 4 }} />Notas: {d.enrut_notas}
                                </div>
                              )}
                            </div>
                            <div style={{ marginBottom: 12 }}>
                              <label className="cv-label"><i className="fas fa-sticky-note" style={{ marginRight: 4 }} />Notas internas (opcional)</label>
                              <input className="cv-input" type="text" placeholder="Ej: Llamar al funcionario después de enviar..." maxLength={255} value={notasEnrut} onChange={(e) => setNotasEnrut(e.target.value)} />
                            </div>
                            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "12px 14px", marginBottom: 14, fontSize: 12.5, color: "#1E40AF" }}>
                              <i className="fas fa-envelope" style={{ marginRight: 8 }} />
                              Al enviar, el sistema notificará a <strong>{d.autoridad_sigla || d.autoridad_nombre}</strong> ({d.autoridad_email || "sin correo registrado"}).
                            </div>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <button className="btn-cv btn-primary-cv" onClick={handleNotificar} disabled={saving}>
                                {saving ? <><i className="fas fa-spinner spinning" /> Enviando…</> : <><i className="fas fa-paper-plane" /> Enviar a autoridad</>}
                              </button>
                              {d.estado_enrutamiento === "notificada" || d.estado_enrutamiento === "confirmada" ? (
                                <button className="btn-cv btn-green-cv" onClick={handleNotificar} disabled={saving}>
                                  <i className="fas fa-check" /> Marcar como notificada
                                </button>
                              ) : null}
                            </div>
                          </>
                        ) : (
                          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--cv-muted)", fontSize: 13 }}>
                            <i className="fas fa-building" style={{ fontSize: 28, opacity: .3, display: "block", marginBottom: 10 }} />
                            Esta denuncia no tiene autoridad asignada (tipo sin mapeo de autoridad).
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab: Archivar */}
                    {tab === "archivar" && (
                      <form onSubmit={handleArchivar}>
                        <div style={{ marginBottom: 14 }}>
                          <label className="cv-label"><i className="fas fa-archive" style={{ marginRight: 4 }} />Motivo del archivado</label>
                          <select className="cv-select" value={motivoArch} onChange={(e) => setMotivoArch(e.target.value)} required>
                            <option value="">Seleccionar motivo...</option>
                            <option value="Denuncia duplicada">Denuncia duplicada</option>
                            <option value="Fuera de jurisdicción">Fuera de jurisdicción</option>
                            <option value="Información insuficiente">Información insuficiente</option>
                            <option value="Caso cerrado por resolución">Caso cerrado por resolución</option>
                            <option value="Retiro voluntario del denunciante">Retiro voluntario del denunciante</option>
                            <option value="Sin evidencias suficientes">Sin evidencias suficientes</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: "#92400E", marginBottom: 14 }}>
                          <i className="fas fa-info-circle" style={{ marginRight: 6 }} />El archivado es <strong>reversible</strong>. Puedes restaurar la denuncia en cualquier momento.
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button type="submit" className="btn-cv" style={{ background: "linear-gradient(135deg,#92400E,#B45309)", color: "#fff" }} disabled={saving}>
                            {saving ? <><i className="fas fa-spinner spinning" /> Archivando…</> : <><i className="fas fa-archive" /> Archivar denuncia</>}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── Desarchivar (solo si archivada) ── */}
            {archivada && (
              <>
                <div className="hr-cv" />
                <div className="cv-section-card">
                  <div className="cv-section-head dark"><i className="fas fa-box-open" />Restaurar Denuncia</div>
                  <div className="cv-section-body">
                    <form onSubmit={handleDesarchivar}>
                      <div style={{ marginBottom: 14 }}>
                        <label className="cv-label">Restaurar al estado:</label>
                        <select className="cv-select" value={nuevoEstadoDesarch} onChange={(e) => setNuevoEstadoDesarch(e.target.value)} required>
                          <option value="">Seleccionar estado...</option>
                          <option value="pendiente">⏳ Pendiente</option>
                          <option value="en_proceso">🔄 En Proceso</option>
                          <option value="resuelto">✅ Resuelto</option>
                        </select>
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button type="submit" className="btn-cv btn-green-cv" disabled={saving}>
                          {saving ? <><i className="fas fa-spinner spinning" /> Desarchivando…</> : <><i className="fas fa-box-open" /> Desarchivar</>}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lbOpen && (
        <Lightbox
          imgs={lbImgs}
          idx={lbIdx}
          onClose={cerrarLightbox}
          onNav={(dir) => setLbIdx((p) => (p + dir + lbImgs.length) % lbImgs.length)}
        />
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════
   MODAL ELIMINAR
════════════════════════════════════════════════════════ */
function ModalEliminar({ denuncia, onClose, onEliminar, toast }) {
  const [texto, setTexto] = useState("");
  const [saving, setSaving] = useState(false);
  const valid = texto.trim().toUpperCase() === "ELIMINAR";

  async function handleEliminar() {
    if (!valid) { toast.show("Debes escribir ELIMINAR para confirmar", "error"); return; }
    setSaving(true);
    try {
      await onEliminar(denuncia.id);
      onClose();
    } catch (err) {
      toast.show(err.message, "error");
    } finally { setSaving(false); }
  }

  return (
    <div className="cv-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cv-modal cv-modal-sm">
        <div className="cv-modal-header" style={{ background: "linear-gradient(135deg,#7F1D1D,#DC2626)" }}>
          <h5><i className="fas fa-trash-alt" /> Eliminar Denuncia</h5>
          <button className="cv-modal-close" onClick={onClose}><i className="fas fa-times" /></button>
        </div>
        <div className="cv-modal-body">
          <div className="cv-delete-zone">
            <h6><i className="fas fa-exclamation-triangle" /> Acción irreversible</h6>
            <p>
              Estás a punto de eliminar permanentemente la denuncia{" "}
              <strong style={{ fontFamily: "var(--font-mono)" }}>#{denuncia.codigo_seguimiento}</strong>.
              <br /><br />
              Esta acción <strong>no se puede deshacer</strong>. Se eliminarán todas las fotos, actualizaciones y registros asociados.
            </p>
            <label className="cv-label" style={{ color: "var(--cv-danger)" }}>
              Escribe <strong>ELIMINAR</strong> para confirmar:
            </label>
            <input
              className={`cv-delete-input ${valid ? "valid" : ""}`}
              type="text"
              placeholder="ELIMINAR"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
            <button className="btn-cv btn-outline-cv" onClick={onClose}>Cancelar</button>
            <button
              className="btn-cv btn-delete-cv"
              onClick={handleEliminar}
              disabled={!valid || saving}
              style={{ background: valid ? "linear-gradient(135deg,#991B1B,#DC2626)" : undefined, color: valid ? "#fff" : undefined }}
            >
              {saving ? <><i className="fas fa-spinner spinning" /> Eliminando…</> : <><i className="fas fa-trash-alt" /> Eliminar permanentemente</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   FILA DE TABLA
════════════════════════════════════════════════════════ */
function DenunciaRow({ d, onVer, onEliminar }) {
  const en = normalizarEstado(d.estado);
  const archivada = en === "archivado";

  return (
    <tr className={archivada ? "row-archived" : ""}>
      {/* Código */}
      <td>
        <span className="cv-code-pill">{d.codigo_seguimiento || "SIN-CÓDIGO"}</span>
        {archivada && (
          <div style={{ fontSize: 11, color: "var(--cv-muted)", marginTop: 3 }}>
            <i className="fas fa-archive" style={{ marginRight: 4 }} />Archivada
          </div>
        )}
      </td>

      {/* Tipo */}
      <td>
        <span className="cv-tipo-pill" style={{
          background: d.tipo_color ? `${d.tipo_color}22` : "rgba(107,114,128,.1)",
          color: d.tipo_color || "var(--cv-gray)",
          border: `1px solid ${d.tipo_color ? `${d.tipo_color}44` : "var(--cv-border)"}`,
        }}>
          {d.tipo_icono && <i className={`fas ${d.tipo_icono}`} />}
          {d.tipo_nombre || d.tipo || "Sin tipo"}
        </span>
        {d.autoridad_sigla && (
          <div style={{ fontSize: 11, color: "var(--cv-muted)", marginTop: 3 }}>
            <i className="fas fa-building" style={{ marginRight: 4 }} />{d.autoridad_sigla}
          </div>
        )}
      </td>

      {/* Denunciante */}
      <td>
        <strong style={{ fontSize: 13.5 }}>{d.nombre_denunciante || "Anónimo"}</strong>
        <br />
        <small style={{ color: "var(--cv-muted)" }}>{d.email_denunciante || "Sin email"}</small>
      </td>

      {/* Fecha */}
      <td>
        <span style={{ fontSize: 13 }}>{formatFecha(d.fecha, true)}</span>
        <br />
        <small style={{ color: "var(--cv-muted)" }}>
          {d.fecha ? new Date(d.fecha).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "Solo fecha"}
        </small>
      </td>

      {/* Estado */}
      <td>
        <EstadoBadge estado={d.estado} />
        {(!d.estado || d.estado.trim() === "") && (
          <div style={{ fontSize: 11, color: "var(--cv-danger)", marginTop: 2 }}>
            <i className="fas fa-exclamation-triangle" style={{ marginRight: 4 }} />Estado vacío
          </div>
        )}
        <EnrutBadge estado={d.estado_enrutamiento || "pendiente"} />
      </td>

      {/* Archivos */}
      <td>
        <div className="d-flex gap-2 flex-wrap">
          <span className="cv-archivo-chip"><i className="fas fa-camera" /> {d.fotos_count || 0}</span>
          <span className="cv-archivo-chip"><i className="fas fa-comments" /> {d.actualizaciones_count || 0}</span>
        </div>
      </td>

      {/* Acciones */}
      <td>
        <div className="d-flex gap-2 flex-wrap" style={{ justifyContent: "center" }}>
          <button className="btn-cv btn-view-cv btn-cv-sm" onClick={() => onVer(d)}>
            <i className="fas fa-eye" /> Ver
          </button>
          <button className="btn-cv btn-delete-cv btn-cv-sm" onClick={() => onEliminar(d)}>
            <i className="fas fa-trash-alt" /> Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════════════════ */
export default function Admin() {
  const { request } = useApi();
  const toast = useToast();

  // Estado
  const [session, setSession]         = useState({ nombre: "Admin", id: 1 });
  const [stats, setStats]             = useState({});
  const [denuncias, setDenuncias]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filtro, setFiltro]           = useState("activos");
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalReg, setTotalReg]       = useState(0);
  const [verDenuncia, setVerDenuncia] = useState(null);
  const [delDenuncia, setDelDenuncia] = useState(null);
  const [exportFiltro, setExportFiltro] = useState("todos");
  const [exporting, setExporting]     = useState(false);

  const PER_PAGE = 15;

  /* ── Cargar datos ── */
  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, listData] = await Promise.all([
        request("/admin/stats"),
        request(`/admin/denuncias?filtro=${filtro}&page=${page}&per_page=${PER_PAGE}`),
      ]);
      setStats(statsData);
      setDenuncias(listData.denuncias || []);
      setTotalPages(listData.total_paginas || 1);
      setTotalReg(listData.total_registros || 0);
    } catch (err) {
      toast.show(err.message, "error");
    } finally { setLoading(false); }
  }, [filtro, page]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setPage(1); }, [filtro]);

  /* ── Acciones ── */
  async function handleActualizar(id, nuevoEstado, descripcion) {
    await request("/admin/actualizar-estado", {
      method: "POST",
      body: JSON.stringify({ denuncia_id: id, nuevo_estado: nuevoEstado, descripcion_actualizacion: descripcion }),
    });
    toast.show("Denuncia actualizada correctamente.", "success");
    cargar();
  }

  async function handleArchivar(id, motivo) {
    await request("/admin/archivar", {
      method: "POST",
      body: JSON.stringify({ denuncia_id: id, motivo_archivo: motivo }),
    });
    toast.show("Denuncia archivada.", "success");
    cargar();
  }

  async function handleDesarchivar(id, nuevoEstado) {
    await request("/admin/desarchivar", {
      method: "POST",
      body: JSON.stringify({ denuncia_id: id, nuevo_estado_desarchivar: nuevoEstado }),
    });
    toast.show(`Denuncia desarchivada y restaurada a: ${etiquetaEstado(nuevoEstado)}`, "success");
    cargar();
  }

  async function handleEliminar(id) {
    await request("/admin/eliminar", {
      method: "POST",
      body: JSON.stringify({ denuncia_id: id }),
    });
    toast.show("Denuncia eliminada permanentemente.", "success");
    cargar();
  }

  async function handleNotificar(id, notas) {
    await request("/admin/notificar", {
      method: "POST",
      body: JSON.stringify({ denuncia_id: id, notas_enrutamiento: notas }),
    });
    toast.show("Denuncia marcada como notificada a la autoridad competente.", "success");
    cargar();
  }

  async function handleExportar() {
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/exportar?filtro=${exportFiltro}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al exportar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `denuncias_${exportFiltro}_${new Date().toISOString().slice(0, 10)}.xls`;
      a.click();
      URL.revokeObjectURL(url);
      toast.show("Exportación exitosa.", "success");
    } catch (err) {
      toast.show(err.message, "error");
    } finally { setExporting(false); }
  }

function handleLogout() {
  window.location.href = "/login";
}

  /* ── Filtros ── */
  const FILTROS = [
    { id: "activos",    label: "Activas",    icon: "fa-bolt",         count: stats.activas    },
    { id: "pendientes", label: "Pendientes", icon: "fa-clock",        count: stats.pendientes },
    { id: "proceso",    label: "En Proceso", icon: "fa-cogs",         count: stats.en_proceso },
    { id: "resueltos",  label: "Resueltas",  icon: "fa-check-circle", count: stats.resueltas  },
    { id: "archivado",  label: "Archivadas", icon: "fa-archive",      count: stats.archivadas },
    { id: "todos",      label: "Todas",      icon: "fa-list",         count: stats.total      },
  ];

  const TITULOS = {
    activos: "Denuncias Activas", pendientes: "Denuncias Pendientes",
    proceso: "Denuncias en Proceso", resueltos: "Denuncias Resueltas",
    archivado: "Denuncias Archivadas", todos: "Todas las Denuncias",
  };

  const mostrando = Math.min(PER_PAGE, totalReg - (page - 1) * PER_PAGE);

  /* ════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── TOPBAR ── */}
      <nav className="cv-topbar">
        <div className="cv-topbar-inner">
          <a href="/admin" className="cv-brand">
            <img src="/assets/images/chocovisibleee.png" alt="ChocoVisible" className="cv-brand-logo" onError={(e) => { e.target.style.display = "none"; }} />
            <span className="cv-brand-text">
              <span className="cv-brand-choco">Choco</span>
              <span className="cv-brand-vis">Visible</span>
              <span className="cv-brand-sep">·</span>
              <span className="cv-brand-admin">Admin</span>
            </span>
          </a>

          <div className="cv-topbar-nav">
            <button className="cv-topbar-link active"><i className="fas fa-tachometer-alt" /><span>Dashboard</span></button>
            <a href="/auditoria" className="cv-topbar-link"><i className="fas fa-history" /><span>Auditoría</span></a>
            <a href="/" target="_blank" rel="noreferrer" className="cv-topbar-link"><i className="fas fa-external-link-alt" /><span>Ver sitio</span></a>
            <button className="cv-topbar-link danger" onClick={handleLogout}><i className="fas fa-sign-out-alt" /><span>Salir</span></button>
          </div>

          <div className="cv-topbar-user">
            <div className="cv-avatar">{session.nombre?.[0]?.toUpperCase() || "A"}</div>
            <span>{session.nombre}</span>
          </div>
        </div>
      </nav>

      <div className="cv-page">
        {/* ── Header ── */}
        <div className="cv-page-head">
          <div>
            <h1><i className="fas fa-tachometer-alt" />Panel de Administración</h1>
            <p>Gestión de Denuncias Ciudadanas · Quibdó, Chocó · {new Date().toLocaleString("es-CO")}</p>
          </div>
          <button className="btn-cv btn-primary-cv btn-cv-sm" onClick={cargar}>
            <i className="fas fa-sync-alt" /> Actualizar
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="cv-stats-grid">
          {[
            { cls: "total",     icon: "fa-database",     num: stats.total,      lbl: "Total" },
            { cls: "activas",   icon: "fa-bolt",         num: stats.activas,    lbl: "Activas" },
            { cls: "pendiente", icon: "fa-clock",        num: stats.pendientes, lbl: "Pendientes" },
            { cls: "proceso",   icon: "fa-cogs",         num: stats.en_proceso, lbl: "En Proceso" },
            { cls: "resueltas", icon: "fa-check-circle", num: stats.resueltas,  lbl: "Resueltas" },
            { cls: "archivadas",icon: "fa-archive",      num: stats.archivadas, lbl: "Archivadas" },
          ].map((s) => (
            <div key={s.cls} className={`cv-stat-card ${s.cls}`}>
              <div className="cv-stat-icon"><i className={`fas ${s.icon}`} /></div>
              <div className="cv-stat-num">{s.num ?? 0}</div>
              <div className="cv-stat-label">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* ── Exportar ── */}
        <div className="cv-export-bar">
          <div>
            <h6><i className="fas fa-file-excel" />Exportar a Excel</h6>
            <p>Descarga las denuncias en formato compatible con Excel para análisis y respaldo.</p>
          </div>
          <div className="cv-export-controls">
            <select className="cv-select cv-select-sm" style={{ width: 190 }} value={exportFiltro} onChange={(e) => setExportFiltro(e.target.value)}>
              <option value="todos">Todas las denuncias</option>
              <option value="activos">Solo activas</option>
              <option value="pendiente">Pendientes</option>
              <option value="en_proceso">En proceso</option>
              <option value="resuelto">Resueltas</option>
              <option value="archivado">Archivadas</option>
            </select>
            <button className="btn-cv btn-export-cv" onClick={handleExportar} disabled={exporting}>
              {exporting ? <><i className="fas fa-spinner spinning" /> Exportando…</> : <><i className="fas fa-download" /> Exportar</>}
            </button>
          </div>
        </div>

        {/* ── Filtros ── */}
        <div className="cv-filter-bar">
          <span className="cv-filter-label"><i className="fas fa-filter" /> Filtrar:</span>
          {FILTROS.map((f) => (
            <button key={f.id} className={`cv-filter-pill ${filtro === f.id ? "active" : ""}`} onClick={() => setFiltro(f.id)}>
              <i className={`fas ${f.icon}`} /> {f.label} <span className="pill-count">({f.count ?? 0})</span>
            </button>
          ))}
        </div>

        {/* ── Tabla ── */}
        <div className="cv-table-card">
          <div className="cv-table-head">
            <h5><i className="fas fa-list" />{TITULOS[filtro] || "Gestión de Denuncias"}</h5>
            <small>
              Mostrando {mostrando > 0 ? mostrando : 0} de {totalReg} registros
              {totalPages > 1 ? ` · Página ${page} de ${totalPages}` : ""}
            </small>
          </div>

          <div className="cv-table-wrap">
            {loading ? (
              <div className="cv-loading">
                <i className="fas fa-spinner spinning" />
                <p>Cargando denuncias…</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th><i className="fas fa-barcode" style={{ marginRight: 5 }} />Código</th>
                    <th><i className="fas fa-tag" style={{ marginRight: 5 }} />Tipo</th>
                    <th><i className="fas fa-user" style={{ marginRight: 5 }} />Denunciante</th>
                    <th><i className="fas fa-calendar" style={{ marginRight: 5 }} />Fecha</th>
                    <th><i className="fas fa-flag" style={{ marginRight: 5 }} />Estado</th>
                    <th><i className="fas fa-paperclip" style={{ marginRight: 5 }} />Archivos</th>
                    <th style={{ textAlign: "center" }}><i className="fas fa-cog" style={{ marginRight: 5 }} />Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {denuncias.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="cv-empty">
                          <i className="fas fa-search" />
                          <h6>Sin denuncias</h6>
                          <p>No hay denuncias que coincidan con el filtro seleccionado.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    denuncias.map((d) => (
                      <DenunciaRow
                        key={d.id}
                        d={d}
                        onVer={setVerDenuncia}
                        onEliminar={setDelDenuncia}
                      />
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="cv-pagination">
              <button className="cv-page-btn" onClick={() => setPage(1)} disabled={page === 1}>
                <i className="fas fa-angle-double-left" />
              </button>
              <button className="cv-page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <i className="fas fa-angle-left" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const num = start + i;
                return num <= totalPages ? (
                  <button key={num} className={`cv-page-btn ${page === num ? "active" : ""}`} onClick={() => setPage(num)}>
                    {num}
                  </button>
                ) : null;
              })}
              <button className="cv-page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <i className="fas fa-angle-right" />
              </button>
              <button className="cv-page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
                <i className="fas fa-angle-double-right" />
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="cv-footer-bar">
          <div>
            <h6><i className="fas fa-shield-alt" />ChocoVisible · Panel Admin</h6>
            <p>Sistema de Gestión de Denuncias Ciudadanas · Quibdó, Chocó · Colombia</p>
          </div>
          <div className="cv-footer-icons">
            <div className="fi"><i className="fas fa-lock" /><span>Seguro</span></div>
            <div className="fi"><i className="fas fa-database" /><span>Datos</span></div>
            <div className="fi"><i className="fas fa-users" /><span>Ciudadanos</span></div>
          </div>
        </div>
      </div>

      {/* ── Modales ── */}
      {verDenuncia && (
        <ModalDetalle
          denuncia={verDenuncia}
          onClose={() => setVerDenuncia(null)}
          onActualizar={handleActualizar}
          onArchivar={handleArchivar}
          onDesarchivar={handleDesarchivar}
          onNotificar={handleNotificar}
          toast={toast}
        />
      )}

      {delDenuncia && (
        <ModalEliminar
          denuncia={delDenuncia}
          onClose={() => setDelDenuncia(null)}
          onEliminar={handleEliminar}
          toast={toast}
        />
      )}

      {/* ── Toasts ── */}
      <Toast toasts={toast.toasts} removeToast={toast.remove} />
    </>
  );
}