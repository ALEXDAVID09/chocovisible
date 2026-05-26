import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NuevaDenuncia.css';
import AsistenteIA from './AsistenteIA.jsx';

/* ══════════════════════════════════════════════════════
   DATOS (igual que el PHP — vienen de la BD en prod)
══════════════════════════════════════════════════════ */
const TIPOS_MOCK = [
  {
    id: 1,
    nombre: 'Delito Penal',
    descripcion: 'Hurto, violencia, amenazas, extorsión y otros delitos penales.',
    icono: 'fa-gavel',
    color_hex: '#DC2626',
    autoridad_sigla: 'FGN',
    autoridad_nombre: 'Fiscalía General de la Nación',
    autoridad_desc: 'Investiga y acusa a los presuntos infractores de la ley penal.',
  },
  {
    id: 2,
    nombre: 'Daño Ambiental',
    descripcion: 'Minería ilegal, deforestación, contaminación de fuentes hídricas.',
    icono: 'fa-leaf',
    color_hex: '#1A6636',
    autoridad_sigla: 'CODECHOCÓ',
    autoridad_nombre: 'Corporación Autónoma Regional del Chocó',
    autoridad_desc: 'Autoridad ambiental regional responsable de los recursos naturales del Chocó.',
  },
  {
    id: 3,
    nombre: 'Corrupción',
    descripcion: 'Uso indebido de recursos públicos, sobornos y abuso de cargo.',
    icono: 'fa-hand-holding-usd',
    color_hex: '#7C3AED',
    autoridad_sigla: 'CGR',
    autoridad_nombre: 'Contraloría General de la República',
    autoridad_desc: 'Vigila la gestión fiscal y el uso correcto de los recursos públicos.',
  },
  {
    id: 4,
    nombre: 'Derechos Humanos',
    descripcion: 'Desplazamiento forzado, violencia de género y vulneración de DDHH.',
    icono: 'fa-users',
    color_hex: '#DB2777',
    autoridad_sigla: 'DEF',
    autoridad_nombre: 'Defensoría del Pueblo',
    autoridad_desc: 'Protege y promueve los derechos humanos de los ciudadanos colombianos.',
  },
  {
    id: 5,
    nombre: 'Salud Pública',
    descripcion: 'Brotes epidémicos, agua contaminada y condiciones insalubres.',
    icono: 'fa-first-aid',
    color_hex: '#0C3460',
    autoridad_sigla: 'SS',
    autoridad_nombre: 'Secretaría de Salud del Chocó',
    autoridad_desc: 'Autoridad departamental encargada de la salud pública en el Chocó.',
  },
];

const MUNICIPIOS = [
  { value: 'quibdo',     label: 'Quibdó' },
  { value: 'istmina',    label: 'Istmina' },
  { value: 'condoto',    label: 'Condoto' },
  { value: 'nuqui',      label: 'Nuquí' },
  { value: 'otro_choco', label: 'Otro municipio del Chocó' },
  { value: 'otro',       label: 'Otro departamento' },
];

const URGENCIAS = [
  { value: 'baja',  label: '🟢 Baja — No requiere acción inmediata' },
  { value: 'media', label: '🟡 Media — Requiere atención' },
  { value: 'alta',  label: '🔴 Alta — Requiere acción urgente' },
];

const STEPS = [
  { n: 1, label: 'Información del incidente' },
  { n: 2, label: 'Ubicación' },
  { n: 3, label: 'Evidencias' },
  { n: 4, label: 'Información de contacto' },
  { n: 5, label: 'Confirmación y envío' },
];

const AI_SUGGESTIONS = [
  { text: 'Quiero reportar un caso de acoso laboral',              label: '🚫 Acoso laboral' },
  { text: 'Quiero denunciar un problema ambiental',                label: '🌿 Problema ambiental' },
  { text: 'Tengo información sobre un acto de corrupción',         label: '💼 Corrupción' },
  { text: 'Quiero reportar un problema de seguridad',              label: '🛡️ Seguridad' },
];

/* ── Helpers ── */
const FILE_ICONS = {
  'application/pdf': 'fa-file-pdf',
  'application/msword': 'fa-file-word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fa-file-word',
  'text/plain': 'fa-file-alt',
};
function getFileIcon(type) {
  if (type.startsWith('image/')) return 'fa-file-image';
  return FILE_ICONS[type] || 'fa-file-alt';
}
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const s = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + s[i];
}
function horaFmt() {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}
function fmtTexto(txt) {
  return txt
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

/* ═══════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════ */
function Toast({ toasts, removeToast }) {
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
  };
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`cv-toast ${t.type}`}>
          <i className={`fas ${icons[t.type]}`}></i>
          <span>{t.msg}</span>
          <button className="toast-close" onClick={() => removeToast(t.id)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   WIDGET DE DICTADO POR VOZ
═══════════════════════════════════════════════════ */
function VozWidget({ onApply, showToast }) {
  const [open, setOpen]         = useState(false);
  const [showTooltip, setTip]   = useState(false);
  const [showBadge, setBadge]   = useState(true);
  const [lang, setLang]         = useState('es-CO');
  const [target, setTarget]     = useState('descripcion');
  const [grabando, setGrabando] = useState(false);
  const [textoFinal, setTF]     = useState('');
  const [interim, setInterim]   = useState('');
  const [status, setStatus]     = useState('Listo para escuchar');
  const [statusCls, setStatusCls] = useState('');
  const [displayCls, setDisplayCls] = useState('');
  const [waveShow, setWave]     = useState(false);
  const [noSupport, setNoSupport] = useState(false);

  const recogRef    = useRef(null);
  const grabandoRef = useRef(false);
  const textoRef    = useRef('');

  const SpeechRecognition = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

  useEffect(() => { if (!SpeechRecognition) setNoSupport(true); }, [SpeechRecognition]);

  const setStatusMsg = (msg, cls = '') => { setStatus(msg); setStatusCls(cls); };

  const iniciar = useCallback(() => {
    if (!SpeechRecognition) return;
    const r = new SpeechRecognition();
    r.lang = lang; r.continuous = true; r.interimResults = true; r.maxAlternatives = 1;
    recogRef.current = r;

    r.onstart = () => {
      grabandoRef.current = true; setGrabando(true);
      setWave(true); setDisplayCls('escuchando');
      setStatusMsg('🔴 Escuchando... habla ahora', 'grabando');
    };
    r.onresult = (e) => {
      let fin = '', inter = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t + ' '; else inter += t;
      }
      if (fin) { textoRef.current += fin; setTF(textoRef.current); }
      setInterim(inter);
    };
    r.onerror = (e) => {
      const errores = {
        'no-speech':     '⚠️ No detecté voz. Intenta de nuevo.',
        'audio-capture': '⚠️ No se puede acceder al micrófono.',
        'not-allowed':   '🔒 Permiso de micrófono denegado. Habilítalo en tu navegador.',
        'network':       '🌐 Error de red. Revisa tu conexión.',
        'aborted':       '',
      };
      const msg = errores[e.error] || ('Error: ' + e.error);
      if (msg) setStatusMsg(msg, 'error');
      detener(false);
    };
    r.onend = () => {
      if (grabandoRef.current) { try { r.start(); } catch { detener(); } }
    };
    try { r.start(); } catch { setStatusMsg('Error al iniciar el micrófono', 'error'); }
  }, [SpeechRecognition, lang]);

  const detener = useCallback((limpiarInterim = true) => {
    grabandoRef.current = false; setGrabando(false);
    if (recogRef.current) { try { recogRef.current.stop(); } catch {} }
    setWave(false);
    if (limpiarInterim) setInterim('');
    if (textoRef.current.trim()) {
      setDisplayCls('listo');
      setStatusMsg('✅ Dictado listo — presiona "Aplicar"', 'listo');
    } else {
      setDisplayCls('');
      setStatusMsg('Listo para escuchar', '');
    }
  }, []);

  const aplicar = () => {
    if (!textoFinal.trim()) return;
    onApply(target, textoFinal.trim());
    showToast('🎤 Texto dictado aplicado al formulario', 'success');
    setTimeout(() => setOpen(false), 800);
  };

  const limpiar = () => {
    textoRef.current = ''; setTF(''); setInterim('');
    setDisplayCls(''); setStatusMsg('Listo para escuchar', '');
    if (grabando) detener();
  };

  const toggleOpen = () => {
    setTip(false); setOpen(o => !o);
    if (!open) setBadge(false);
  };

  return (
    <>
      <div className={`voz-tooltip${showTooltip ? ' show' : ''}`}>🎤 Dictado por voz</div>
      <button
        className="voz-toggle-btn"
        title="Dictar denuncia por voz"
        onClick={toggleOpen}
        onMouseEnter={() => setTip(true)}
        onMouseLeave={() => setTip(false)}
      >
        {showBadge && <span className="voz-badge">VOZ</span>}
        <svg viewBox="0 0 24 24">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8"  y1="23" x2="16" y2="23"/>
        </svg>
      </button>

      <div className={`voz-panel${open ? ' open' : ''}`}>
        <div className="voz-header">
          <div className="voz-header-icon">🎤</div>
          <div className="voz-header-info">
            <strong>Dictado por Voz</strong>
            <small>Habla y tu denuncia se escribe sola</small>
          </div>
          <button className="voz-close-btn" onClick={() => { setOpen(false); if (grabando) detener(); }}>✕</button>
        </div>

        {noSupport && (
          <div className="voz-no-support">
            ⚠️ Tu navegador no soporta dictado por voz. Usa <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong>.
          </div>
        )}

        <div className="voz-lang-selector">
          {[['es-CO','🇨🇴 Español'],['es-ES','🇪🇸 Castellano'],['en-US','🇺🇸 English'],['fr-FR','🇫🇷 Français']].map(([l, label]) => (
            <button key={l} className={`voz-lang-btn${lang === l ? ' active' : ''}`}
              onClick={() => { setLang(l); if (grabando) { detener(); setTimeout(iniciar, 300); } }}>
              {label}
            </button>
          ))}
        </div>

        <div className="voz-target-selector">
          <label>¿Dónde quieres escribir?</label>
          <select className="voz-target-select" value={target} onChange={e => setTarget(e.target.value)}>
            <option value="descripcion">📝 Descripción del incidente</option>
            <option value="nombre">👤 Tu nombre</option>
            <option value="direccion">📍 Dirección del lugar</option>
            <option value="contacto">📞 Teléfono de contacto</option>
          </select>
        </div>

        <div className={`voz-display${displayCls ? ' ' + displayCls : ''}`}>
          {!textoFinal && !interim && <span className="voz-placeholder">Presiona "Iniciar" y comienza a hablar...</span>}
          <span>{textoFinal}</span>
          <span className="voz-interim">{interim}</span>
        </div>

        <div className={`voz-wave${waveShow ? ' show' : ''}`}>
          <span/><span/><span/><span/><span/>
        </div>

        <div className={`voz-status${statusCls ? ' ' + statusCls : ''}`}>{status}</div>

        <div className="voz-controls">
          <button
            className={`voz-start-btn${grabando ? ' grabando' : ''}`}
            disabled={noSupport}
            onClick={() => grabando ? detener() : iniciar()}
          >
            {grabando ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
                Detener
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                </svg>
                Iniciar dictado
              </>
            )}
          </button>
          <button className="voz-apply-btn" disabled={!textoFinal.trim()} onClick={aplicar}>✅ Aplicar</button>
          <button className="voz-clear-btn" onClick={limpiar}>🗑️</button>
        </div>
        <div className="voz-tip">🌐 Funciona mejor en Chrome · Requiere micrófono</div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════
const handleAsisApply = (datos) => {
  setForm(prev => ({
    ...prev,
    tipo_id: datos.tipo_id ? String(datos.tipo_id) : prev.tipo_id,
    descripcion: datos.descripcion || prev.descripcion,
    urgencia: datos.urgencia || prev.urgencia,
    fecha: datos.fecha || prev.fecha,
    direccion: datos.direccion || datos.barrio || prev.direccion,
    municipio: datos.municipio || prev.municipio,
  }));

  if (datos.tipo_id) {
    const t = TIPOS_MOCK.find(t => t.id === Number(datos.tipo_id));
    setSelectedTipo(t || null);
  }

  if (datos.descripcion) {
    setCharCount(datos.descripcion.length);
  }

  showToast('🤖 Formulario rellenado con ayuda de IA', 'success');

  const sec = sectionRefs.current[0];
  if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export default function NuevaDenuncia() {
  const navigate = useNavigate();

  const [navScrolled, setNavScrolled]     = useState(false);
  const [navOpen, setNavOpen]             = useState(false);
  const [activeStep, setActiveStep]       = useState(1);
  const [toasts, setToasts]               = useState([]);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTipo, setSelectedTipo]   = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging]       = useState(false);
  const [locStatus, setLocStatus]         = useState('idle');
  const [charCount, setCharCount]         = useState(0);
  const [anonimo, setAnonimo]             = useState(false);
  const [errors, setErrors]               = useState({});

  const [form, setForm] = useState({
    tipo_id: '', fecha: '', descripcion: '', urgencia: 'media',
    direccion: '', municipio: 'quibdo', latitud: '', longitud: '',
    nombre: '', email: '', contacto: '', terminos: false,
  });

  const fileInputRef = useRef(null);
  const sectionRefs  = useRef([]);
  const toastId      = useRef(0);

  /* ── Toast ── */
  const showToast = useCallback((msg, type = 'info') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  /* ── Scroll navbar ── */
  useEffect(() => {
    const h = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  /* ── Scroll → step activo (IntersectionObserver igual que el PHP) ── */
  useEffect(() => {
    const sections = sectionRefs.current.filter(Boolean);
    if (!sections.length) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) setActiveStep(parseInt(e.target.dataset.step, 10));
      });
    }, { threshold: 0.4 });

    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  /* ── Form change ── */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setForm(prev => ({ ...prev, [name]: val }));
    if (name === 'descripcion') setCharCount(value.length);
    if (name === 'tipo_id') setSelectedTipo(TIPOS_MOCK.find(t => String(t.id) === value) || null);
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  /* ── Geolocalización ── */
  const getLocation = () => {
    if (!navigator.geolocation) { showToast('Tu navegador no soporta geolocalización.', 'error'); return; }
    setLocStatus('loading');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(prev => ({ ...prev, latitud: pos.coords.latitude.toFixed(6), longitud: pos.coords.longitude.toFixed(6) }));
        setLocStatus('success');
        showToast('Ubicación obtenida correctamente.', 'success');
        setTimeout(() => setLocStatus('idle'), 3000);
      },
      err => {
        const msgs = { 1: 'Permiso denegado.', 2: 'Información no disponible.', 3: 'Tiempo de espera agotado.' };
        showToast(msgs[err.code] || 'Error al obtener la ubicación.', 'error');
        setLocStatus('error');
        setTimeout(() => setLocStatus('idle'), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  /* ── Archivos ── */
  const handleFiles = (files) => {
    const arr = Array.from(files);
    if (arr.length > 5) { showToast('Máximo 5 archivos permitidos.', 'warning'); return; }
    const valid = arr.filter(f => {
      if (f.size > 10 * 1024 * 1024) { showToast(`"${f.name}" supera los 10 MB.`, 'warning'); return false; }
      return true;
    });
    setSelectedFiles(valid.map(f => ({ file: f, preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null })));
  };
  const removeFile = (idx) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
    showToast('Archivo eliminado.', 'info');
  };

  /* ── Validación ── */
  const validate = () => {
    const e = {};
    if (!form.tipo_id)                                      e.tipo_id     = 'Selecciona el tipo de denuncia.';
    if (!form.descripcion || form.descripcion.length < 20)  e.descripcion = 'Mínimo 20 caracteres.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))         e.email    = 'Ingresa un email válido.';
    if (form.contacto && !/^[\+]?[\d\s\-\(\)]{7,}$/.test(form.contacto))      e.contacto = 'Ingresa un teléfono válido.';
    if (!form.terminos)                                      e.terminos    = 'Debes aceptar los términos.';
    setErrors(e);
    if (Object.keys(e).length) {
      showToast('Corrige los errores antes de continuar.', 'error');
      return false;
    }
    return true;
  };

  /* ── Submit ── */
const handleSubmit = (e) => {
  e.preventDefault();

  if (!validate()) return;

  navigate('/procesar-denuncia', {
    state: {
      tipo_id: form.tipo_id,
      descripcion: form.descripcion,
      urgencia: form.urgencia || 'media',
      fecha: form.fecha,
      latitud: form.latitud,
      longitud: form.longitud,
      nombre: anonimo ? '' : form.nombre,
      contacto: anonimo ? '' : form.contacto,
      email: anonimo ? '' : form.email,
      evidencias: selectedFiles.map(item => item.file),
    },
  });
};

  /* ── Voz → form ── */
  const handleVozApply = (targetField, texto) => {
    setForm(prev => {
      if (targetField === 'descripcion') {
        const sep = prev.descripcion.trim() ? ' ' : '';
        const newVal = prev.descripcion + sep + texto;
        setCharCount(newVal.length);
        return { ...prev, descripcion: newVal };
      }
      return { ...prev, [targetField]: texto };
    });
  };

  /* ── Asis IA → form ── */
  const handleAsisApply = (datos) => {
    if (datos.tipo_id) {
      const t = TIPOS_MOCK.find(t => t.id === datos.tipo_id);
      if (t) { setSelectedTipo(t); setForm(prev => ({ ...prev, tipo_id: String(t.id) })); }
    }
    if (datos.descripcion) { setForm(prev => ({ ...prev, descripcion: datos.descripcion })); setCharCount(datos.descripcion.length); }
    if (datos.urgencia)    { setForm(prev => ({ ...prev, urgencia: datos.urgencia })); }
    const sec = sectionRefs.current[0];
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const progressPct = Math.round((activeStep / STEPS.length) * 100);
  const today = new Date().toISOString().split('T')[0];

  /* ── Helpers para el modal de vista previa (igual al PHP) ── */
  const tipoSelOpt    = TIPOS_MOCK.find(t => String(t.id) === form.tipo_id);
  const municipioLabel = MUNICIPIOS.find(m => m.value === form.municipio)?.label || '—';
  const urgenciaLabel  = URGENCIAS.find(u => u.value === form.urgencia)?.label   || '—';

  return (
    <>
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ══ NAVBAR ══ */}
      <nav className={`cv-navbar${navScrolled ? ' scrolled' : ''}`}>
        <div className="container">
          <Link to="/" className="nav-logo">
            <img src="/assets/images/chocovisibleee.png" alt="ChocoVisible" onError={e => { e.target.style.display = 'none'; }} />
            <span className="nav-logo-text">
              <span claAssName="choco">Choco</span><span className="visible">Visible</span>
            </span>
          </Link>
          <ul className="nav-links">
            <li><Link to="/" className="nav-link">Inicio</Link></li>
            <li><Link to="/nueva-denuncia" className="nav-link active">Nueva Denuncia</Link></li>
            <li><Link to="/consultar" className="nav-link">Consultar Estado</Link></li>
          </ul>
          <button className="nav-toggle" onClick={() => setNavOpen(o => !o)} aria-label="Menú">
            <i className={`fas ${navOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
        {navOpen && (
          <div className="nav-drawer open">
            <Link to="/" className="nav-link" onClick={() => setNavOpen(false)}><i className="fas fa-home"></i> Inicio</Link>
            <Link to="/nueva-denuncia" className="nav-link" onClick={() => setNavOpen(false)}><i className="fas fa-pen"></i> Nueva Denuncia</Link>
            <Link to="/consultar" className="nav-link" onClick={() => setNavOpen(false)}><i className="fas fa-search"></i> Consultar Estado</Link>
          </div>
        )}
      </nav>

      {/* ══ HERO ══ */}
      <div className="page-hero">
        <div className="container page-hero-inner">
          <h1>
            <i className="fas fa-shield-alt" style={{ color: 'var(--cv-gold-light)', marginRight: 10 }}></i>
            Nueva Denuncia
          </h1>
          <p>Tu voz importa. Reporta incidentes de manera segura y confidencial.</p>
          <div className="hero-pills">
            <span className="hero-pill"><i className="fas fa-lock"></i> 100% Confidencial</span>
            <span className="hero-pill"><i className="fas fa-eye-slash"></i> Anónimo opcional</span>
            <span className="hero-pill"><i className="fas fa-shield-alt"></i> Datos protegidos</span>
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 48" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,24 C480,48 960,0 1440,24 L1440,48 L0,48 Z" fill="#F6F8FA"/>
          </svg>
        </div>
      </div>

      {/* ══ CONTENIDO ══ */}
      <div className="page-body">
        <div className="container">
          <div className="row g-4">

            {/* ── Sidebar sticky ── */}
            <div className="col-lg-3 d-none d-lg-block">
              <div className="progress-sidebar">
                <div className="progress-card">
                  <h6>Progreso</h6>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar-fill" style={{ width: progressPct + '%' }}></div>
                  </div>
                  <ul className="step-list">
                    {STEPS.map(s => (
                      <li key={s.n} className={`step-item${activeStep === s.n ? ' active' : activeStep > s.n ? ' done' : ''}`} data-step={s.n}>
                        <div className="step-dot">
                          {activeStep > s.n
                            ? <i className="fas fa-check" style={{ fontSize: 10 }}></i>
                            : s.n}
                        </div>
                        <span className="step-label">{s.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="quick-help">
                  <h6><i className="fas fa-life-ring" style={{ marginRight: 6 }}></i>¿Necesitas ayuda?</h6>
                  <p>Emergencias: <strong>123</strong><br />Policía: <strong>112</strong><br />Antiextorsión: <strong>165</strong></p>
                  <button className="btn-location mt-3 w-100" style={{ borderRadius: 'var(--cv-radius-sm)' }} onClick={() => setShowHelpModal(true)}>
                    <i className="fas fa-headset"></i> Ver más ayuda
                  </button>
                </div>
              </div>
            </div>

            {/* ── Formulario ── */}
            <div className="col-lg-9">
              <form onSubmit={handleSubmit} encType="multipart/form-data" id="denunciaForm">
                <div className="form-wrapper">

                  {/* ─ Sección 1: Incidente ─ */}
                  <div className="form-section" data-step="1" ref={el => { sectionRefs.current[0] = el; }}>
                    <div className="section-header">
                      <div className="section-icon"><i className="fas fa-exclamation-triangle"></i></div>
                      <div>
                        <h4>Información del Incidente</h4>
                        <p>Describe qué sucedió y cuándo ocurrió</p>
                      </div>
                    </div>
                    <div className="section-body">
                      <div className="row g-3 mb-3">
                        <div className="col-md-12">
                          <label className="form-label">
                            <i className="fas fa-tag"></i> Tipo de denuncia <span className="required">*</span>
                          </label>
                          <select
                            className={`form-select${errors.tipo_id ? ' is-invalid' : form.tipo_id ? ' is-valid' : ''}`}
                            name="tipo_id" value={form.tipo_id} onChange={handleChange} required
                          >
                            <option value="">— Selecciona el tipo de incidente —</option>
                            {TIPOS_MOCK.map(t => (
                              <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                          </select>
                          {errors.tipo_id && <div className="invalid-feedback">{errors.tipo_id}</div>}

                          {selectedTipo && (
                            <div className="autoridad-panel">
                              <div className="autoridad-card" style={{ borderLeftColor: selectedTipo.color_hex }}>
                                <div className="autoridad-icon-wrap" style={{ background: selectedTipo.color_hex + '22' }}>
                                  <i className={`fas ${selectedTipo.icono}`} style={{ color: selectedTipo.color_hex }}></i>
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div className="autoridad-label">Tu denuncia será enviada a</div>
                                  <div className="autoridad-nombre">{selectedTipo.autoridad_nombre}</div>
                                  <div className="autoridad-desc">{selectedTipo.autoridad_desc}</div>
                                  <div className="tipo-desc">{selectedTipo.descripcion}</div>
                                </div>
                                <span className="autoridad-sigla" style={{ background: selectedTipo.color_hex + '22', color: selectedTipo.color_hex }}>
                                  {selectedTipo.autoridad_sigla}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">
                            <i className="fas fa-calendar-alt"></i> Fecha del incidente
                          </label>
                          <input type="date" className="form-control" name="fecha" value={form.fecha} max={today} onChange={handleChange} />
                          <div className="form-text">Fecha aproximada si no recuerdas exactamente</div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">
                          <i className="fas fa-align-left"></i> Descripción detallada <span className="required">*</span>
                        </label>
                        <textarea
                          className={`form-control${errors.descripcion ? ' is-invalid' : charCount >= 20 ? ' is-valid' : ''}`}
                          name="descripcion" rows="6"
                          placeholder="Describe detalladamente lo que ocurrió... ¿Qué pasó? ¿Quién estuvo involucrado? ¿Dónde sucedió? ¿Hay testigos?"
                          value={form.descripcion} onChange={handleChange} required
                        />
                        <div className="char-counter">
                          <span className="form-text"><i className="fas fa-edit" style={{ marginRight: 4 }}></i>Mínimo 20 caracteres. Sé específico.</span>
                          <span className={`char-count ${charCount === 0 ? 'bad' : charCount < 20 ? 'warn' : 'ok'}`}>
                            {charCount} caracteres
                          </span>
                        </div>
                        {errors.descripcion && <div className="invalid-feedback d-block">{errors.descripcion}</div>}
                      </div>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">
                            <i className="fas fa-tachometer-alt"></i> Nivel de urgencia
                          </label>
                          <select className="form-select" name="urgencia" value={form.urgencia} onChange={handleChange}>
                            {URGENCIAS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ─ Sección 2: Ubicación ─ */}
                  <div className="form-section" data-step="2" ref={el => { sectionRefs.current[1] = el; }}>
                    <div className="section-header">
                      <div className="section-icon"><i className="fas fa-map-marker-alt"></i></div>
                      <div>
                        <h4>Ubicación del Incidente</h4>
                        <p>Ayúdanos a ubicar dónde ocurrió</p>
                      </div>
                    </div>
                    <div className="section-body">
                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="form-label"><i className="fas fa-road"></i> Dirección o lugar</label>
                          <input type="text" className="form-control" name="direccion" value={form.direccion}
                            placeholder="Ej: Calle 25 #12-34, Oficina, parque..." onChange={handleChange} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label"><i className="fas fa-city"></i> Municipio</label>
                          <select className="form-select" name="municipio" value={form.municipio} onChange={handleChange}>
                            {MUNICIPIOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="form-label"><i className="fas fa-globe"></i> Latitud</label>
                          <input type="number" step="any" className="form-control" name="latitud" value={form.latitud} placeholder="5.6918" readOnly />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label"><i className="fas fa-globe"></i> Longitud</label>
                          <input type="number" step="any" className="form-control" name="longitud" value={form.longitud} placeholder="-76.6669" readOnly />
                        </div>
                      </div>
                      <div className="text-center">
                        <button type="button"
                          className={`btn-location${locStatus === 'success' ? ' success' : locStatus === 'error' ? ' error' : ''}`}
                          onClick={getLocation} disabled={locStatus === 'loading'}
                        >
                          <i className={`fas ${locStatus === 'loading' ? 'fa-spinner spinning' : locStatus === 'success' ? 'fa-check' : locStatus === 'error' ? 'fa-exclamation-triangle' : 'fa-crosshairs'}`}></i>
                          {locStatus === 'loading' ? ' Obteniendo ubicación…' : locStatus === 'success' ? ' Ubicación obtenida' : locStatus === 'error' ? ' Error — reintentar' : ' Obtener ubicación actual'}
                        </button>
                        <p className="form-text mt-2">
                          <i className="fas fa-shield-alt" style={{ marginRight: 4 }}></i>
                          Tu ubicación se usará solo para la investigación y permanecerá confidencial.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ─ Sección 3: Evidencias ─ */}
                  <div className="form-section" data-step="3" ref={el => { sectionRefs.current[2] = el; }}>
                    <div className="section-header">
                      <div className="section-icon"><i className="fas fa-camera"></i></div>
                      <div>
                        <h4>Evidencias</h4>
                        <p>Adjunta documentos, fotos o archivos de respaldo</p>
                      </div>
                    </div>
                    <div className="section-body">
                      <div
                        className={`file-drop-zone${isDragging ? ' dragover' : ''}`}
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                        onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                      >
                        <div className="drop-icon"><i className="fas fa-cloud-upload-alt"></i></div>
                        <h5>{selectedFiles.length > 0 ? `${selectedFiles.length} archivo(s) seleccionado(s)` : 'Arrastra archivos aquí'}</h5>
                        <p>{selectedFiles.length > 0 ? 'Arrastra más o haz clic para agregar.' : 'Imágenes, PDFs, documentos Word · Máx. 5 archivos de 10 MB c/u'}</p>
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple
                          accept="image/*,.pdf,.doc,.docx,.txt"
                          onChange={e => handleFiles(e.target.files)} />
                        <button type="button" className="btn-select-file" onClick={() => fileInputRef.current.click()}>
                          <i className="fas fa-plus"></i> Seleccionar archivos
                        </button>
                      </div>
                      {selectedFiles.length > 0 && (
                        <div className="file-preview-grid">
                          {selectedFiles.map((f, idx) => (
                            <div key={idx} className="file-card">
                              {f.preview
                                ? <img src={f.preview} className="file-card-thumb" alt={f.file.name} />
                                : <div className="file-card-icon"><i className={`fas ${getFileIcon(f.file.type)}`}></i></div>
                              }
                              <div className="file-card-info">
                                <div className="file-card-name" title={f.file.name}>{f.file.name}</div>
                                <div className="file-card-size">{formatSize(f.file.size)}</div>
                              </div>
                              <button type="button" className="file-card-remove" onClick={() => removeFile(idx)}>
                                <i className="fas fa-trash-alt"></i> Eliminar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ─ Sección 4: Contacto ─ */}
                  <div className="form-section" data-step="4" ref={el => { sectionRefs.current[3] = el; }}>
                    <div className="section-header">
                      <div className="section-icon"><i className="fas fa-user-circle"></i></div>
                      <div>
                        <h4>Información de Contacto</h4>
                        <p>Opcional y completamente confidencial</p>
                      </div>
                    </div>
                    <div className="section-body">
                      <div className="cv-alert cv-alert-info mb-3">
                        <i className="fas fa-info-circle"></i>
                        <div>
                          <strong>¿Por qué pedimos esta información?</strong><br />
                          Solo para contactarte si necesitamos aclarar detalles. Tu identidad permanecerá protegida en todo momento.
                        </div>
                      </div>
                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="form-label"><i className="fas fa-user"></i> Nombre completo</label>
                          <input type="text" className="form-control" name="nombre" value={form.nombre}
                            placeholder={anonimo ? 'Deshabilitado — denuncia anónima' : 'Tu nombre (opcional)'}
                            disabled={anonimo} onChange={handleChange} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label"><i className="fas fa-phone"></i> Teléfono</label>
                          <input type="tel"
                            className={`form-control${errors.contacto ? ' is-invalid' : ''}`}
                            name="contacto" value={form.contacto}
                            placeholder={anonimo ? 'Deshabilitado — denuncia anónima' : '+57 300 123 4567 (opcional)'}
                            disabled={anonimo} onChange={handleChange} />
                          {errors.contacto && <div className="invalid-feedback">{errors.contacto}</div>}
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label"><i className="fas fa-envelope"></i> Correo electrónico</label>
                        <input type="email"
                          className={`form-control${errors.email ? ' is-invalid' : ''}`}
                          name="email" value={form.email}
                          placeholder={anonimo ? 'Deshabilitado — denuncia anónima' : 'tu@correo.com (opcional)'}
                          disabled={anonimo} onChange={handleChange} />
                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                      </div>
                      <label className="cv-check">
                        <input type="checkbox" checked={anonimo} onChange={e => {
                          setAnonimo(e.target.checked);
                          if (e.target.checked) setForm(prev => ({ ...prev, nombre: '', email: '', contacto: '' }));
                        }} />
                        <span>
                          <i className="fas fa-user-secret" style={{ color: 'var(--cv-green)', marginRight: 4 }}></i>
                          Prefiero mantener mi denuncia completamente anónima (se deshabilitarán los campos de contacto)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* ─ Sección 5: Confirmación ─ */}
                  <div className="form-section" data-step="5" ref={el => { sectionRefs.current[4] = el; }}>
                    <div className="section-header">
                      <div className="section-icon"><i className="fas fa-check-double"></i></div>
                      <div>
                        <h4>Confirmación y Envío</h4>
                        <p>Revisa y acepta los términos antes de enviar</p>
                      </div>
                    </div>
                    <div className="section-body">
                      <div className="cv-alert cv-alert-warning mb-4">
                        <i className="fas fa-exclamation-triangle"></i>
                        <div>
                          <strong>Importante:</strong> Una vez enviada la denuncia, recibirás un <strong>código único de seguimiento</strong> para consultar su estado en cualquier momento.
                        </div>
                      </div>
                      <label className={`cv-check mb-4${errors.terminos ? ' border-danger' : ''}`}>
                        <input type="checkbox" name="terminos" checked={form.terminos}
                          onChange={e => setForm(prev => ({ ...prev, terminos: e.target.checked }))} required />
                        <span>
                          <strong>Declaro que:</strong><br />
                          · La información proporcionada es veraz y completa.<br />
                          · Autorizo el procesamiento de mis datos para la investigación.<br />
                          · Entiendo que proporcionar información falsa puede tener consecuencias legales.
                          <span className="required"> *</span>
                        </span>
                      </label>
                      {errors.terminos && <div className="invalid-feedback d-block mb-3">{errors.terminos}</div>}
                      <div className="action-row">
                        <Link to="/" className="btn-back">
                          <i className="fas fa-arrow-left"></i> Volver al inicio
                        </Link>

                        <button type="submit" className="btn-submit">
                          <i className="fas fa-paper-plane"></i> Enviar denuncia
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAB ayuda ── */}
      <button className="fab-help" onClick={() => setShowHelpModal(true)} title="¿Necesitas ayuda?">
        <i className="fas fa-question"></i>
      </button>

      {/* ── Widget Voz ── */}
      <VozWidget onApply={handleVozApply} showToast={showToast} />

      {/* ── Asistente IA ── */}
     <AsistenteIA onFillForm={handleAsisApply} />

      {/* ══ MODAL: VISTA PREVIA (igual estructura que el PHP) ══ */}
      {showPreviewModal && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header-cv">
              <h5><i className="fas fa-eye"></i> Vista previa de la denuncia</h5>
              <button className="btn-close-modal" onClick={() => setShowPreviewModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="preview-section">
                <h6><i className="fas fa-exclamation-triangle" style={{ color: 'var(--cv-gold)' }}></i> Información del incidente</h6>
                <table className="preview-table">
                  <tbody>
                    <tr><td>Tipo</td><td>{tipoSelOpt?.nombre || '—'}</td></tr>
                    <tr><td>Autoridad competente</td><td>{tipoSelOpt?.autoridad_nombre || '—'}</td></tr>
                    <tr><td>Fecha</td><td>{form.fecha || 'No especificada'}</td></tr>
                    <tr><td>Urgencia</td><td>{urgenciaLabel}</td></tr>
                    <tr><td>Descripción</td><td>{form.descripcion || '—'}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="preview-section">
                    <h6><i className="fas fa-map-marker-alt" style={{ color: 'var(--cv-green)' }}></i> Ubicación</h6>
                    <table className="preview-table">
                      <tbody>
                        <tr><td>Dirección</td><td>{form.direccion || 'No especificada'}</td></tr>
                        <tr><td>Municipio</td><td>{municipioLabel}</td></tr>
                        <tr><td>Coordenadas</td><td>{form.latitud ? `${form.latitud}, ${form.longitud}` : '—'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="preview-section">
                    <h6><i className="fas fa-user" style={{ color: 'var(--cv-blue-mid)' }}></i> Contacto</h6>
                    <table className="preview-table">
                      <tbody>
                        <tr><td>Nombre</td><td>{form.nombre || (anonimo ? 'Anónimo' : 'No proporcionado')}</td></tr>
                        <tr><td>Email</td><td>{form.email || 'No proporcionado'}</td></tr>
                        <tr><td>Teléfono</td><td>{form.contacto || 'No proporcionado'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {selectedFiles.length > 0 && (
                <div className="preview-section">
                  <h6><i className="fas fa-paperclip"></i> Evidencias ({selectedFiles.length})</h6>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedFiles.map((f, i) => (
                      <span key={i} style={{ fontSize: 12, background: 'var(--cv-off)', border: '1px solid var(--cv-border)', borderRadius: 20, padding: '4px 12px' }}>
                        <i className={`fas ${getFileIcon(f.file.type)}`} style={{ marginRight: 5, color: 'var(--cv-blue-mid)' }}></i>
                        {f.file.name} · {formatSize(f.file.size)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer preview-footer">
              <button type="button" className="btn-back" onClick={() => setShowPreviewModal(false)}>
                <i className="fas fa-edit"></i> Editar
              </button>
<button
  type="button"
  className="btn-submit"
  onClick={(e) => {
    e.stopPropagation();
    setShowPreviewModal(false);
    handleSubmit(e);
  }}
>
  <i className="fas fa-check"></i> Confirmar y enviar
</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: AYUDA ══ */}
      {showHelpModal && (
        <div className="modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header-help">
              <h5><i className="fas fa-life-ring"></i> ¿Necesitas ayuda?</h5>
              <button className="btn-close-modal" onClick={() => setShowHelpModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="help-item">
                <i className="fas fa-phone-alt" style={{ color: 'var(--cv-green)' }}></i>
                <div>
                  <strong>Líneas de emergencia</strong>
                  <p>Emergencias: <strong>123</strong> · Policía Nacional: <strong>112</strong> · Antiextorsión: <strong>165</strong></p>
                </div>
              </div>
              <div className="help-item">
                <i className="fas fa-shield-alt" style={{ color: 'var(--cv-blue-mid)' }}></i>
                <div>
                  <strong>Tu seguridad es primero</strong>
                  <p>Tus datos están protegidos. Puedes reportar de forma anónima. No compartiremos tu identidad sin tu consentimiento.</p>
                </div>
              </div>
              <div className="help-item">
                <i className="fas fa-question-circle" style={{ color: 'var(--cv-gold)' }}></i>
                <div>
                  <strong>¿Cómo funciona?</strong>
                  <p>Completa el formulario con la mayor información posible. Recibirás un código de seguimiento para monitorear tu caso.</p>
                </div>
              </div>
              <div className="help-item">
                <i className="fas fa-envelope" style={{ color: 'var(--cv-gold)' }}></i>
                <div>
                  <strong>Contacto directo</strong>
                  <p>Email: contacto@chocovisible.org<br />WhatsApp: +57 314 123 4567</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
  type="button"
  className="btn-submit"
  onClick={() => setShowPreviewModal(false)}
>
  <i className="fas fa-check"></i> Entendido
</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}