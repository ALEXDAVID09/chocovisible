// frontend/src/Home.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ── NAVBAR ─────────────────────────────── */}
      <nav className={`cv-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <Link to="/" className="nav-logo">
            <img src="/assets/images/chocovisibleee.png" alt="ChocoVisible" />
            <span className="nav-logo-text">
              <span className="choco">Choco</span>
              <span className="visible">Visible</span>
            </span>
          </Link>

          <ul className="nav-links">
            <li><Link to="/" className="nav-link active">Inicio</Link></li>
            <li><Link to="/nueva-denuncia" className="nav-link">Nueva Denuncia</Link></li>
            <li><Link to="/consultar" className="nav-link">Consultar Estado</Link></li>
          </ul>

          <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
            <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>

        <div className={`nav-drawer ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
            <i className="fas fa-home"></i> Inicio
          </Link>
          <Link to="/nueva-denuncia" className="nav-link" onClick={() => setMenuOpen(false)}>
            <i className="fas fa-pen"></i> Nueva Denuncia
          </Link>
          <Link to="/consultar" className="nav-link" onClick={() => setMenuOpen(false)}>
            <i className="fas fa-search"></i> Consultar Estado
          </Link>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────── */}
      {/* La ola inferior ya NO es un SVG — es el pseudo-elemento ::after del CSS */}
      <section className="hero">
        <div className="hero-orbs-wrap">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
        </div>

        <div className="container hero-content">
          <div className="hero-eyebrow">
            <i className="fas fa-map-marker-alt"></i>
            Quibdó, Departamento del Chocó · Colombia
          </div>
          <h1 className="hero-title">
            Tu voz protege al<br />
            <span className="highlight">Chocó Visible</span>
          </h1>
          <p className="hero-subtitle">
            Plataforma segura y confidencial de denuncia ciudadana. Reporta incidentes,
            haz seguimiento en tiempo real y construye un Chocó más transparente.
          </p>
          <div className="hero-btns">
            <Link to="/nueva-denuncia" className="btn-hero-primary">
              <i className="fas fa-plus-circle"></i> Hacer una Denuncia
            </Link>
            <Link to="/consultar" className="btn-hero-secondary">
              <i className="fas fa-search"></i> Consultar Estado
            </Link>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-num">100<span>%</span></div>
              <div className="stat-label">Confidencial</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-num">24<span>/7</span></div>
              <div className="stat-label">Disponible</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-num">0<span>%</span></div>
              <div className="stat-label">Datos Expuestos</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-num">5</div>
              <div className="stat-label">Categorías</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ──────────────────────── */}
      <section className="section">
        <div className="container text-center">
          <div className="reveal">
            <span className="section-eyebrow"><i className="fas fa-route"></i> Proceso</span>
            <h2 className="section-title">¿Cómo funciona?</h2>
            <p className="section-subtitle">Simple, seguro y transparente. Tu denuncia en tres pasos.</p>
          </div>
          <div className="process-grid">
            <div className="process-card reveal reveal-delay-1">
              <div className="process-num">1</div>
              <div className="process-icon"><i className="fas fa-edit"></i></div>
              <h5>Reporta el incidente</h5>
              <p>Completa nuestro formulario seguro con los detalles del incidente.</p>
            </div>
            <div className="process-card reveal reveal-delay-2">
              <div className="process-num">2</div>
              <div className="process-icon"><i className="fas fa-qrcode"></i></div>
              <h5>Recibe tu código</h5>
              <p>Obtén un código único de seguimiento para consultar el estado.</p>
            </div>
            <div className="process-card reveal reveal-delay-3">
              <div className="process-num">3</div>
              <div className="process-icon"><i className="fas fa-eye"></i></div>
              <h5>Seguimiento activo</h5>
              <p>Consulta actualizaciones y el progreso de tu denuncia en tiempo real.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TIPOS DE DENUNCIAS ─────────────────── */}
      <section className="section section-alt">
        <div className="container text-center">
          <div className="reveal">
            <span className="section-eyebrow"><i className="fas fa-layer-group"></i> Categorías</span>
            <h2 className="section-title">Tipos de Denuncias</h2>
            <p className="section-subtitle">Cada denuncia es enrutada automáticamente a la autoridad competente.</p>
          </div>
          <div className="types-grid">

            <div className="type-card reveal reveal-delay-1">
              <div className="type-icon-wrap" style={{ background: 'rgba(220,38,38,.12)' }}>
                <i className="fas fa-gavel" style={{ color: '#DC2626' }}></i>
              </div>
              <h6>Delito Penal</h6>
              <small>Hurto, violencia, amenazas, extorsión</small>
              <div className="type-badge" style={{ background: 'rgba(220,38,38,.1)', color: '#DC2626' }}>
                <i className="fas fa-building"></i> Fiscalía
              </div>
            </div>

            <div className="type-card reveal reveal-delay-2">
              <div className="type-icon-wrap" style={{ background: 'rgba(22,163,74,.12)' }}>
                <i className="fas fa-leaf" style={{ color: '#16A34A' }}></i>
              </div>
              <h6>Daño Ambiental</h6>
              <small>Minería ilegal, deforestación, contaminación</small>
              <div className="type-badge" style={{ background: 'rgba(22,163,74,.1)', color: '#16A34A' }}>
                <i className="fas fa-building"></i> CODECHOCÓ
              </div>
            </div>

            <div className="type-card reveal reveal-delay-3">
              <div className="type-icon-wrap" style={{ background: 'rgba(124,58,237,.12)' }}>
                <i className="fas fa-hand-holding-usd" style={{ color: '#7C3AED' }}></i>
              </div>
              <h6>Corrupción</h6>
              <small>Uso indebido de recursos públicos</small>
              <div className="type-badge" style={{ background: 'rgba(124,58,237,.1)', color: '#7C3AED' }}>
                <i className="fas fa-building"></i> Contraloría
              </div>
            </div>

            <div className="type-card reveal reveal-delay-1">
              <div className="type-icon-wrap" style={{ background: 'rgba(219,39,119,.12)' }}>
                <i className="fas fa-people-group" style={{ color: '#DB2777' }}></i>
              </div>
              <h6>Derechos Humanos</h6>
              <small>Desplazamiento, violencia de género</small>
              <div className="type-badge" style={{ background: 'rgba(219,39,119,.1)', color: '#DB2777' }}>
                <i className="fas fa-building"></i> Defensoría
              </div>
            </div>

            <div className="type-card reveal reveal-delay-2">
              <div className="type-icon-wrap" style={{ background: 'rgba(2,132,199,.12)' }}>
                <i className="fas fa-kit-medical" style={{ color: '#0284C7' }}></i>
              </div>
              <h6>Salud Pública</h6>
              <small>Brotes, agua contaminada, condiciones insalubres</small>
              <div className="type-badge" style={{ background: 'rgba(2,132,199,.1)', color: '#0284C7' }}>
                <i className="fas fa-building"></i> Secretaría de Salud
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CONFIDENCIALIDAD ───────────────────── */}
      <section className="conf-section">
        <div className="container text-center">
          <div className="reveal">
            <span className="section-eyebrow" style={{ background: 'rgba(255,255,255,.12)', color: '#F5C842' }}>
              <i className="fas fa-shield-alt"></i> Seguridad
            </span>
            <h2 className="section-title" style={{ color: '#fff' }}>Confidencialidad Garantizada</h2>
            <p className="section-subtitle" style={{ color: 'rgba(255,255,255,.72)' }}>
              Tu identidad está protegida con los más altos estándares.
            </p>
          </div>
          <div className="conf-grid">
            <div className="conf-card reveal reveal-delay-1">
              <i className="fas fa-lock conf-icon"></i>
              <h5>100% Seguro</h5>
              <p>Encriptación de datos en cada transmisión.</p>
            </div>
            <div className="conf-card reveal reveal-delay-2">
              <i className="fas fa-user-secret conf-icon"></i>
              <h5>Anónimo</h5>
              <p>Tu identidad permanece protegida.</p>
            </div>
            <div className="conf-card reveal reveal-delay-3">
              <i className="fas fa-clock conf-icon"></i>
              <h5>24/7 Disponible</h5>
              <p>Sistema disponible todo el año.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────── */}
      <section className="cta-band">
        <div className="container reveal">
          <h2>¿Listo para hacer tu denuncia?</h2>
          <p>Únete a los ciudadanos que están construyendo un Chocó más transparente.</p>
          <div className="cta-btns">
            <Link to="/nueva-denuncia" className="btn-cta">
              <i className="fas fa-plus-circle"></i> Nueva Denuncia
            </Link>
            <Link to="/consultar" className="btn-cta-outline">
              <i className="fas fa-search"></i> Consultar Estado
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────── */}
      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-left">
              <Link to="/" className="footer-logo">
                <img src="/assets/images/chocovisibleee.png" alt="ChocoVisible" />
                <span className="footer-logo-text">
                  <span className="choco">Choco</span><span className="visible">Visible</span>
                </span>
              </Link>
              <p className="footer-desc">
                Sistema seguro de denuncia ciudadana para el desarrollo transparente
                y sostenible del Departamento del Chocó.
              </p>
              <p className="footer-location">
                <i className="fas fa-map-marker-alt"></i>
                Quibdó, Departamento del Chocó, Colombia
              </p>
            </div>

            <div className="footer-right">
              <div className="footer-badge">
                <i className="fas fa-heart"></i> Construyendo un Chocó mejor
              </div>
              <p className="footer-copy">
                &copy; {new Date().getFullYear()} ChocoVisible · Todos los derechos reservados.
              </p>
              <small className="footer-tagline">Comprometidos con la transparencia</small>
            </div>
          </div>

          <hr className="footer-divider" />

          <div className="footer-bottom">
            <span>ChocoVisible · Denuncia Ciudadana</span>

          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;                 