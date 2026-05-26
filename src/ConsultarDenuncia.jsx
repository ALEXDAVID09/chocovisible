// frontend/src/ConsultarDenuncia.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ConsultarDenuncia.css';

/* ── Helpers ─────────────────────────────────────── */
function getEstadoColor(estado = 'pendiente') {
  switch (estado.toLowerCase()) {
    case 'pendiente':  return 'pendiente';
    case 'en_proceso': return 'proceso';
    case 'resuelto':   return 'resuelto';
    case 'cerrado':    return 'cerrado';
    default:           return 'pendiente';
  }
}

function getEstadoIcono(estado = 'pendiente') {
  switch (estado.toLowerCase()) {
    case 'pendiente':  return 'fa-clock';
    case 'en_proceso': return 'fa-gear';
    case 'resuelto':   return 'fa-check-circle';
    case 'cerrado':    return 'fa-times-circle';
    default:           return 'fa-clock';
  }
}

function getEstadoTexto(estado = 'pendiente') {
  switch (estado.toLowerCase()) {
    case 'pendiente':  return 'Pendiente';
    case 'en_proceso': return 'En Proceso';
    case 'resuelto':   return 'Resuelto';
    case 'cerrado':    return 'Cerrado';
    default:           return 'Pendiente';
  }
}

const TIPOS_LABEL = {
  acoso:          'Acoso o Intimidación',
  seguridad:      'Problema de Seguridad',
  etico:          'Problema Ético',
  discriminacion: 'Discriminación',
  corrupcion:     'Corrupción',
  laboral:        'Problema Laboral',
  ambiental:      'Problema Ambiental',
  servicios:      'Servicios Públicos',
  otro:           'Otro',
};

const TIPOS_ICONO = {
  acoso:          'fa-user-times',
  seguridad:      'fa-shield-alt',
  etico:          'fa-balance-scale',
  discriminacion: 'fa-users',
  corrupcion:     'fa-hand-holding-usd',
  laboral:        'fa-briefcase',
  ambiental:      'fa-leaf',
  servicios:      'fa-water',
  otro:           'fa-question-circle',
};

function formatearTipo(denuncia) {
  if (denuncia.tipo_nombre) return denuncia.tipo_nombre;
  const t = (denuncia.tipo || '').toLowerCase().trim();
  return TIPOS_LABEL[t] || (t ? t.charAt(0).toUpperCase() + t.slice(1) : 'No especificado');
}

function getTipoIcono(denuncia) {
  if (denuncia.tipo_icono) return `fa-${denuncia.tipo_icono}`;
  const t = (denuncia.tipo || '').toLowerCase().trim();
  return TIPOS_ICONO[t] || 'fa-exclamation-circle';
}

function formatFecha(fechaStr, includeTime = false) {
  if (!fechaStr) return '—';
  const d = new Date(fechaStr);
  const date = d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  if (!includeTime) return date;
  const time = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

function formatTime(fechaStr) {
  if (!fechaStr) return '';
  return new Date(fechaStr).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function formatCodigo(raw) {
  let v = raw.toUpperCase().replace(/[^A-Z0-9\-]/g, '');
  if (v.length >= 2 && !v.includes('-')) v = v.substring(0, 2) + '-' + v.substring(2);
  if (v.length >= 7 && v.split('-').length === 2) {
    const p = v.split('-');
    if (p[1].length >= 4) v = p[0] + '-' + p[1].substring(0, 4) + '-' + p[1].substring(4);
  }
  return v;
}

/* ── Componentes pequeños ─────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`cv-navbar${scrolled ? ' scrolled' : ''}`} id="navbar">
      <div className="container">
        <Link to="/" className="nav-logo">
          <img src="/assets/images/chocovisibleee.png" alt="ChocoVisible" />
          <span className="nav-logo-text">
            <span className="choco">Choco</span>
            <span className="vis">Visible</span>
          </span>
        </Link>
        <ul className="nav-links">
          <li><Link to="/" className="nav-link">Inicio</Link></li>
          <li><Link to="/nueva-denuncia" className="nav-link">Nueva Denuncia</Link></li>
          <li><Link to="/consultar-denuncia" className="nav-link active">Consultar Estado</Link></li>
        </ul>
        <button
          className="nav-toggle"
          onClick={() => setDrawerOpen(o => !o)}
          aria-label="Menú"
        >
          <i className={`fas ${drawerOpen ? 'fa-times' : 'fa-bars'}`} />
        </button>
      </div>
      {drawerOpen && (
        <div className="nav-drawer open">
          <Link to="/" className="nav-link" onClick={() => setDrawerOpen(false)}>
            <i className="fas fa-home" /> Inicio
          </Link>
          <Link to="/nueva-denuncia" className="nav-link" onClick={() => setDrawerOpen(false)}>
            <i className="fas fa-pen" /> Nueva Denuncia
          </Link>
          <Link to="/consultar-denuncia" className="nav-link" onClick={() => setDrawerOpen(false)}>
            <i className="fas fa-search" /> Consultar Estado
          </Link>
        </div>
      )}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="cv-footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-5 col-md-6">
            <Link to="/" className="footer-logo">
              <img src="/assets/images/chocovisibleee.png" alt="ChocoVisible" />
              <span className="footer-logo-text">
                <span className="choco">Choco</span>
                <span className="vis">Visible</span>
              </span>
            </Link>
            <p>Sistema de denuncia ciudadana para el desarrollo transparente y sostenible del Departamento del Chocó.</p>
            <div className="d-flex gap-3 mt-3">
              <a href="#" style={{ color: 'rgba(255,255,255,.45)' }}><i className="fab fa-facebook fa-lg" /></a>
              <a href="#" style={{ color: 'rgba(255,255,255,.45)' }}><i className="fab fa-twitter fa-lg" /></a>
              <a href="#" style={{ color: 'rgba(255,255,255,.45)' }}><i className="fab fa-instagram fa-lg" /></a>
            </div>
          </div>
          <div className="col-lg-3 col-md-3 col-6">
            <h6 style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 700, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Enlaces
            </h6>
            <ul className="footer-links">
              <li><Link to="/"><i className="fas fa-home" />Inicio</Link></li>
              <li><Link to="/nueva-denuncia"><i className="fas fa-plus" />Nueva Denuncia</Link></li>
              <li><Link to="/consultar-denuncia"><i className="fas fa-search" />Consultar Estado</Link></li>
            </ul>
          </div>
          <div className="col-lg-4 col-md-3 col-6">
            <h6 style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 700, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Contacto
            </h6>
            <ul className="footer-links">
              <li><a href="#"><i className="fas fa-map-marker-alt" style={{ color: '#E8A020' }} />Quibdó, Chocó</a></li>
              <li><a href="tel:+5746701234"><i className="fas fa-phone" style={{ color: '#E8A020' }} />(4) 670-1234</a></li>
              <li><a href="mailto:contacto@chocovisible.co"><i className="fas fa-envelope" style={{ color: '#E8A020' }} />contacto@chocovisible.co</a></li>
            </ul>
          </div>
        </div>
        <hr className="footer-divider" />
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} ChocoVisible · Todos los derechos reservados.</span>
         
        </div>
      </div>
    </footer>
  );
}

/* ── Modal foto ──────────────────────────────────── */
function FotoModal({ foto, index, onClose }) {
  if (!foto) return null;
  return (
    <div className="foto-modal-overlay" onClick={onClose}>
      <div className="foto-modal-box" onClick={e => e.stopPropagation()}>
        <div className="foto-modal-head">
          <h5><i className="fas fa-image me-2" />Evidencia #{index}</h5>
          <button className="foto-modal-close" onClick={onClose}>&times;</button>
        </div>
        <img className="foto-modal-img" src={foto} alt={`Evidencia ${index}`} />
        <div className="foto-modal-footer">
          <i className="fas fa-info-circle me-1" /> Haz clic fuera de la imagen para cerrar
        </div>
      </div>
    </div>
  );
}

/* ── EstadoVacío ─────────────────────────────────── */
function EstadoVacio({ onFocus }) {
  return (
    <div className="row justify-content-center reveal visible">
      <div className="col-lg-8">
        <div className="empty-state">
          <div className="empty-icon"><i className="fas fa-search" /></div>
          <h3>Ingresa tu código de seguimiento</h3>
          <p>Para consultar el estado de tu denuncia, necesitas el código único que recibiste al momento del registro.</p>
          <div className="code-info-grid">
            <div className="code-info-item"><i className="fas fa-check ok" /> Formato: <code>CV-YYYY-XXXX</code></div>
            <div className="code-info-item"><i className="fas fa-shield-alt info" /> Completamente confidencial</div>
            <div className="code-info-item"><i className="fas fa-check ok" /> Ejemplo: <code>CV-2024-1234</code></div>
            <div className="code-info-item"><i className="fas fa-clock info" /> Válido permanentemente</div>
            <div className="code-info-item"><i className="fas fa-check ok" /> Único por denuncia</div>
            <div className="code-info-item"><i className="fas fa-eye warn" /> Solo tú puedes consultarlo</div>
          </div>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link to="/nueva-denuncia" className="btn-cv btn-cv-primary">
              <i className="fas fa-plus" /> Crear nueva denuncia
            </Link>
            <button className="btn-cv btn-cv-outline" onClick={onFocus}>
              <i className="fas fa-arrow-up" /> Buscar arriba
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── EstadoError ─────────────────────────────────── */
function EstadoError({ mensaje, onReset }) {
  return (
    <div id="resultado" className="row justify-content-center reveal visible">
      <div className="col-lg-7">
        <div className="error-card">
          <div className="err-icon"><i className="fas fa-exclamation-triangle" /></div>
          <h4>Denuncia no encontrada</h4>
          <p>{mensaje}</p>
          <div className="tips-box">
            <h6><i className="fas fa-lightbulb me-2" style={{ color: 'var(--cv-gold)' }} />Consejos de búsqueda</h6>
            <div className="tip-item"><i className="fas fa-check" /> Verifica que el código esté completo (Ej: CV-2024-1234)</div>
            <div className="tip-item"><i className="fas fa-check" /> Asegúrate de incluir los guiones (–)</div>
            <div className="tip-item"><i className="fas fa-check" /> El código no distingue entre mayúsculas y minúsculas</div>
          </div>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <button className="btn-cv btn-cv-outline" onClick={onReset}>
              <i className="fas fa-redo" /> Intentar de nuevo
            </button>
            <Link to="/nueva-denuncia" className="btn-cv btn-cv-primary">
              <i className="fas fa-plus" /> Crear nueva denuncia
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── ResultadoDenuncia ───────────────────────────── */
function ResultadoDenuncia({ denuncia, actualizaciones, fotos }) {
  const [fotoModal, setFotoModal] = useState(null);
  const [fotoIdx, setFotoIdx]   = useState(null);
  const [toastShow, setToastShow] = useState(false);

  function copiarCodigo() {
    navigator.clipboard.writeText(denuncia.codigo_seguimiento).then(() => {
      setToastShow(true);
      setTimeout(() => setToastShow(false), 2000);
    });
  }

  const isImg = ext => ['jpg', 'jpeg', 'png', 'gif'].includes(ext);
  const getExt = path => (path.split('.').pop() || '').toLowerCase();

  const ultimaAct = actualizaciones.length
    ? actualizaciones[0].fecha
    : denuncia.fecha_creacion || denuncia.fecha;

  return (
    <>
      <div id="resultado" className="row g-4 reveal visible">
        {/* Columna principal */}
        <div className="col-lg-8">

          {/* Card principal */}
          <div className="result-card">
            <div className="card-head">
              <h4><i className="fas fa-file-contract me-2" />Información de la Denuncia</h4>
            </div>
            <div className="card-body-cv">

              {/* Código + Estado */}
              <div className="row g-3 mb-2">
                <div className="col-md-6">
                  <div className="info-box">
                    <div className="info-label"><i className="fas fa-barcode me-1" /> Código de seguimiento</div>
                    <div
                      className="tracking-code"
                      onClick={copiarCodigo}
                      title="Clic para copiar"
                    >
                      {denuncia.codigo_seguimiento}
                    </div>
                    <p className="copy-hint">Haz clic para copiar</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="info-box">
                    <div className="info-label"><i className="fas fa-circle-dot me-1" /> Estado actual</div>
                    <div className="mt-2">
                      <span className={`estado-badge estado-${getEstadoColor(denuncia.estado)}`}>
                        <i className={`fas ${getEstadoIcono(denuncia.estado)}`} />
                        {getEstadoTexto(denuncia.estado)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tipo + Fecha */}
              <div className="row g-3 mb-2">
                <div className="col-md-6">
                  <div className="info-box">
                    <div className="info-label"><i className="fas fa-tag me-1" /> Tipo de denuncia</div>
                    <div className="info-value">
                      <i
                        className={`fas ${getTipoIcono(denuncia)} me-2`}
                        style={{ color: denuncia.tipo_color || 'var(--cv-green-mid)' }}
                      />
                      {formatearTipo(denuncia)}
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="info-box">
                    <div className="info-label"><i className="fas fa-calendar-alt me-1" /> Fecha del incidente</div>
                    <div className="info-value">{formatFecha(denuncia.fecha)}</div>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div className="info-box mb-2">
                <div className="info-label"><i className="fas fa-align-left me-1" /> Descripción del incidente</div>
                <div className="info-text mt-1" style={{ whiteSpace: 'pre-line' }}>
                  {denuncia.descripcion}
                </div>
              </div>

              {/* Ubicación */}
              {denuncia.latitud && denuncia.longitud && (
                <div className="info-box mb-2">
                  <div className="info-label"><i className="fas fa-map-marker-alt me-1" /> Ubicación geográfica</div>
                  <div className="mt-1">
                    <span className="coord-badge">
                      <i className="fas fa-globe" /> Lat: {Number(denuncia.latitud).toFixed(6)}
                    </span>
                    <span className="coord-badge">
                      <i className="fas fa-compass" /> Lng: {Number(denuncia.longitud).toFixed(6)}
                    </span>
                  </div>
                </div>
              )}

              {/* Evidencias */}
              {fotos.length > 0 && (
                <div className="info-box">
                  <div className="info-label">
                    <i className="fas fa-camera me-1" /> Evidencias adjuntas
                    <span className="evidencias-count">{fotos.length}</span>
                  </div>
                  <div className="foto-grid">
                    {fotos.map((foto, i) => {
                      const ext = getExt(foto.foto_path);
                      return isImg(ext) ? (
                        <img
                          key={i}
                          src={foto.foto_path}
                          className="foto-thumb"
                          alt={`Evidencia ${i + 1}`}
                          onClick={() => { setFotoModal(foto.foto_path); setFotoIdx(i + 1); }}
                        />
                      ) : (
                        <div key={i} className="file-thumb">
                          <i className="fas fa-file-alt" />
                          <span>{ext.toUpperCase()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información del proceso */}
          <div className="result-card">
            <div className="card-head">
              <h5><i className="fas fa-info-circle me-2" />Información del proceso</h5>
            </div>
            <div className="card-body-cv">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="info-box mb-0">
                    <div className="info-label"><i className="fas fa-calendar-plus me-1" /> Fecha de registro</div>
                    <div className="info-value">{formatFecha(denuncia.fecha, true)}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="info-box mb-0">
                    <div className="info-label"><i className="fas fa-clock me-1" /> Última actualización</div>
                    <div className="info-value">{formatFecha(ultimaAct, true)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna lateral */}
        <div className="col-lg-4">

          {/* Timeline */}
          <div className="result-card">
            <div className="card-head">
              <h5><i className="fas fa-history me-2" />Seguimiento y actualizaciones</h5>
            </div>
            <div className="card-body-cv">
              {actualizaciones.length > 0 ? (
                <div className="cv-timeline">
                  {actualizaciones.map((act, i) => (
                    <div className="tl-item" key={i}>
                      <div className="tl-card">
                        <div className="tl-card-head">
                          <span className="tl-responsible">
                            <i className="fas fa-user-tie" /> {act.responsable}
                          </span>
                          <span className="tl-date">
                            <i className="fas fa-calendar-alt" /> {formatFecha(act.fecha)}
                          </span>
                        </div>
                        <p className="tl-desc" style={{ whiteSpace: 'pre-line' }}>{act.descripcion}</p>
                        <div className="tl-time">
                          <i className="fas fa-clock" /> {formatTime(act.fecha)} hrs
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-updates">
                  <i className="fas fa-clock" />
                  <p>Tu denuncia ha sido registrada exitosamente.<br />Las actualizaciones aparecerán aquí cuando estén disponibles.</p>
                </div>
              )}
            </div>
          </div>

          {/* Contacto */}
          <div className="result-card">
            <div className="card-head">
              <h5><i className="fas fa-headset me-2" />¿Necesitas ayuda?</h5>
            </div>
            <div className="card-body-cv">
              <div className="contact-item">
                <span className="contact-icon" style={{ background: 'rgba(26,102,54,.1)', color: 'var(--cv-green)' }}>
                  <i className="fas fa-phone" />
                </span>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--cv-muted)', marginBottom: 2 }}>Teléfono</div>
                  <a href="tel:+5746701234">(4) 670-1234</a>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon" style={{ background: 'rgba(19,78,155,.1)', color: 'var(--cv-blue-mid)' }}>
                  <i className="fas fa-envelope" />
                </span>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--cv-muted)', marginBottom: 2 }}>Correo electrónico</div>
                  <a href="mailto:contacto@chocovisible.co">contacto@chocovisible.co</a>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon" style={{ background: 'rgba(232,160,32,.1)', color: 'var(--cv-gold)' }}>
                  <i className="fas fa-clock" />
                </span>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--cv-muted)', marginBottom: 2 }}>Horario de atención</div>
                  <span style={{ fontSize: 13.5, color: 'var(--cv-text-2)' }}>Lun–Vie · 8:00 AM – 5:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal foto */}
      <FotoModal foto={fotoModal} index={fotoIdx} onClose={() => setFotoModal(null)} />

      {/* Toast copiar */}
      <div className={`copy-toast${toastShow ? ' show' : ''}`}>
        <i className="fas fa-check me-2" /> ¡Código copiado!
      </div>
    </>
  );
}

/* ══ Página principal ════════════════════════════════ */
export default function ConsultarDenuncia() {
  const [codigo, setCodigo]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [denuncia, setDenuncia]       = useState(null);
  const [actualizaciones, setActualizaciones] = useState([]);
  const [fotos, setFotos]             = useState([]);
  const [error, setError]             = useState(null);
  const [searched, setSearched]       = useState(false);
  const inputRef = useRef(null);

  // Auto-focus
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 400);
  }, []);

  // Scroll al resultado
  useEffect(() => {
    if ((denuncia || error) && searched) {
      setTimeout(() => {
        document.getElementById('resultado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [denuncia, error, searched]);

  function handleCodigoChange(e) {
    setCodigo(formatCodigo(e.target.value));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!codigo.trim()) return;

    setLoading(true);
    setError(null);
    setDenuncia(null);
    setActualizaciones([]);
    setFotos([]);
    setSearched(true);

    try {
      // Llama a tu backend/API. Ajusta la URL según tu configuración.
const codigoLimpio = codigo.replace(/-/g, '').trim().toUpperCase();

const res = await fetch(`http://localhost:3000/api/denuncias/seguimiento/${codigoLimpio}`, {
  method: 'GET',
});
      if (!res.ok) throw new Error('Error del servidor');

      const data = await res.json();

if (!res.ok || !data.success || !data.data) {
  setError(data.error || 'No se encontró ninguna denuncia con ese código de seguimiento.');
} else {
  setDenuncia(data.data);
  setActualizaciones(data.data.actualizaciones || []);
  setFotos(data.data.fotos || []);
}
    } catch (err) {
      setError('Error del sistema al procesar la consulta. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSearched(false);
    setError(null);
    setDenuncia(null);
    setCodigo('');
    setTimeout(() => inputRef.current?.focus(), 200);
  }

  return (
    <>
      <Navbar />

      {/* ══ HERO ══ */}
      <div className="page-hero">
        <div className="container hero-inner">
          <h1>
            <i className="fas fa-search me-2" style={{ color: 'var(--cv-gold-light)' }} />
            Consulta tu Denuncia
          </h1>
          <p>Transparencia y seguimiento en tiempo real para las denuncias ciudadanas del Chocó.</p>

          <div className="search-card reveal visible">
            <form onSubmit={handleSubmit} id="searchForm">
              <label htmlFor="codigo">
                <i className="fas fa-barcode" /> Código de seguimiento
              </label>
              <div className="search-group">
                <div className="search-input-wrap">
                  <i className="fas fa-hashtag search-icon" />
                  <input
                    ref={inputRef}
                    type="text"
                    className="search-input"
                    id="codigo"
                    name="codigo"
                    placeholder="Ej: CV-2024-1234"
                    value={codigo}
                    onChange={handleCodigoChange}
                    autoComplete="off"
                    required
                  />
                </div>
                <button type="submit" className="btn-search" id="btnSearch" disabled={loading}>
                  {loading
                    ? <><i className="fas fa-spinner spinning" /> Consultando…</>
                    : <><i className="fas fa-search" /> Consultar</>
                  }
                </button>
              </div>
            </form>
          </div>

          <p className="search-hint">
            <i className="fas fa-info-circle me-1" />
            El código te fue entregado al registrar tu denuncia ·{' '}
            <Link to="/nueva-denuncia">¿No tienes uno? Crea una denuncia</Link>
          </p>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 48" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,24 C480,48 960,0 1440,24 L1440,48 L0,48 Z" fill="#F6F8FA" />
          </svg>
        </div>
      </div>

      {/* ══ CONTENIDO ══ */}
      <div className="page-body">
        <div className="container">
          {!searched && (
            <EstadoVacio onFocus={() => inputRef.current?.focus()} />
          )}
          {searched && error && (
            <EstadoError mensaje={error} onReset={handleReset} />
          )}
          {searched && denuncia && (
            <ResultadoDenuncia
              denuncia={denuncia}
              actualizaciones={actualizaciones}
              fotos={fotos}
            />
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}