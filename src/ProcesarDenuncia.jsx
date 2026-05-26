import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './NuevaDenuncia.css';

const API_URL = 'http://localhost:3000/api/denuncias';

function formatearFecha(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function Navbar() {
  return (
    <nav className="cv-navbar">
      <div className="container">
        <Link to="/" className="nav-logo">
          <img src="/assets/images/chocovisibleee.png" alt="ChocoVisible" />
          <span className="nav-logo-text">
            <span className="choco">Choco</span>
            <span className="visible">Visible</span>
          </span>
        </Link>

        <ul className="nav-links">
          <li><Link to="/" className="nav-link">Inicio</Link></li>
          <li><Link to="/nueva-denuncia" className="nav-link active">Nueva Denuncia</Link></li>
          <li><Link to="/consultar" className="nav-link">Consultar Estado</Link></li>
        </ul>
      </div>
    </nav>
  );
}

function Hero({ loading, success }) {
  return (
    <div className="page-hero">
      <div className="container">
        <div className="page-hero-inner">
          {loading ? (
            <>
              <h1><i className="fas fa-spinner spinning" /> Procesando…</h1>
              <p>Registrando tu denuncia, por favor espera.</p>
            </>
          ) : success ? (
            <>
              <h1><i className="fas fa-check-circle" /> ¡Denuncia Registrada!</h1>
              <p>Tu denuncia fue recibida correctamente.</p>
            </>
          ) : (
            <>
              <h1><i className="fas fa-exclamation-triangle" /> Error al Procesar</h1>
              <p>No fue posible registrar la denuncia.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({ resultado }) {
  return (
    <div className="result-card visible">
      <div className="card-head">
        <div className="card-head-icon">
          <i className="fas fa-file-contract" />
        </div>
        <div>
          <h4>Denuncia registrada exitosamente</h4>
          <p>Guarda tu código para consultar el estado</p>
        </div>
      </div>

      <div className="card-body-cv">
        <div className="tracking-wrap">
          <div className="tracking-label">
            <i className="fas fa-barcode" /> Código de seguimiento
          </div>
          <div className="tracking-code">{resultado.codigo_seguimiento}</div>
        </div>

        <div className="info-grid">
          <div className="info-box">
            <div className="info-label">Tipo</div>
            <div className="info-value">{resultado.tipo}</div>
          </div>

          <div className="info-box">
            <div className="info-label">Fecha</div>
            <div className="info-value">{formatearFecha(resultado.fecha)}</div>
          </div>

          <div className="info-box">
            <div className="info-label">Urgencia</div>
            <div className="info-value">{resultado.urgencia}</div>
          </div>

          <div className="info-box">
            <div className="info-label">Estado</div>
            <div className="info-value">
              <span className="badge-pendiente">
                <i className="fas fa-clock" /> Pendiente
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/consultar" className="btn-cv btn-cv-primary">
            <i className="fas fa-search" /> Consultar estado
          </Link>

          <Link to="/" className="btn-cv btn-cv-outline">
            <i className="fas fa-home" /> Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({ mensaje }) {
  return (
    <div className="result-card visible">
      <div className="card-head-error">
        <div className="card-head-icon">
          <i className="fas fa-triangle-exclamation" />
        </div>
        <div>
          <h4 style={{ color: '#fff' }}>No se pudo procesar</h4>
          <p style={{ color: '#fff' }}>Revisa e intenta nuevamente</p>
        </div>
      </div>

      <div className="card-body-cv">
        <div className="info-box" style={{ background: '#FEF2F2', borderColor: '#FECACA', marginBottom: 24 }}>
          <div className="info-label" style={{ color: 'var(--cv-danger)' }}>
            Detalle
          </div>
          <div style={{ color: 'var(--cv-danger)', fontWeight: 500 }}>
            {mensaje}
          </div>
        </div>

        <Link to="/nueva-denuncia" className="btn-cv btn-cv-primary">
          <i className="fas fa-arrow-left" /> Volver al formulario
        </Link>
      </div>
    </div>
  );
}

export default function ProcesarDenuncia() {
  const location = useLocation();
  const navigate = useNavigate();
  const formData = location.state || null;

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    if (!formData) {
      navigate('/nueva-denuncia', { replace: true });
      return;
    }

    enviarDenuncia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enviarDenuncia() {
    try {
      const {
        tipo_id,
        descripcion,
        urgencia,
        fecha,
        latitud,
        longitud,
        nombre,
        contacto,
        email,
        evidencias,
      } = formData;

      if (!tipo_id || !descripcion || descripcion.trim().length < 20) {
        throw new Error('Faltan campos requeridos o la descripción es muy corta.');
      }

      const tipoIdNum = Number(tipo_id);

      const TIPO_NOMBRE = {
        1: 'Delito Penal',
        2: 'Daño Ambiental',
        3: 'Corrupción',
        4: 'Derechos Humanos',
        5: 'Salud Pública',
      };

      const body = new FormData();

      body.append('tipo_id', tipoIdNum);
      body.append('descripcion', descripcion.trim());
      body.append('urgencia', urgencia || 'media');
      body.append('fecha', fecha || '');
      body.append('latitud', latitud || '');
      body.append('longitud', longitud || '');
      body.append('nombre_denunciante', nombre || '');
      body.append('contacto_denunciante', contacto || '');
      body.append('email_denunciante', email || '');

      if (Array.isArray(evidencias)) {
        evidencias.forEach((file) => {
          if (file instanceof File) {
            body.append('evidencias', file);
          }
        });
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        body,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.mensaje || data.error || 'Error al registrar la denuncia.');
      }

      setResultado({
        codigo_seguimiento: data.codigo_seguimiento,
        tipo: data.tipo || TIPO_NOMBRE[tipoIdNum] || 'Denuncia',
        urgencia: urgencia || 'media',
        fecha: fecha || new Date().toISOString().slice(0, 10),
        archivos_subidos: data.archivos_subidos || [],
      });

      setSuccess(true);
    } catch (error) {
      console.error('Error enviando denuncia:', error);
      setMensaje(error.message || 'Error desconocido al procesar la denuncia.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <Hero loading={loading} success={success} />

      <div className="page-body">
        <div className="container">
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <i className="fas fa-spinner spinning" style={{ fontSize: 50, color: 'var(--cv-green)' }} />
                <p style={{ marginTop: 20 }}>Procesando denuncia...</p>
              </div>
            )}

            {!loading && success && resultado && (
              <SuccessScreen resultado={resultado} />
            )}

            {!loading && !success && (
              <ErrorScreen mensaje={mensaje} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}