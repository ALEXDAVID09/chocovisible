// frontend/src/Login.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

/* ── Helpers ─────────────────────────────────────── */
function passwordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return 'weak';
  if (score === 2) return 'fair';
  if (score === 3) return 'good';
  return 'strong';
}

const MAX_ATTEMPTS  = 5;
const LOCKOUT_SECS  = 300; // 5 minutos

/* ── Partículas ──────────────────────────────────── */
function Particles() {
  const colors = ['#1E6B3C','#2D8A52','#0D3B6E','#1557A0','#6EE7A0'];
  const particles = Array.from({ length: 18 }, (_, i) => {
    const size = Math.random() * 40 + 10;
    return {
      id: i,
      size,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 20 + 12,
      delay: Math.random() * 12,
    };
  });

  return (
    <div className="bg-particles" id="particles">
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            width:  p.size,
            height: p.size,
            left:   `${p.left}%`,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay:    `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Campo con icono y toggle de contraseña ─────── */
function InputField({
  id, label, icon, type = 'text', placeholder, value, onChange,
  disabled, required, autoComplete, hasToggle = false, className = '',
}) {
  const [show, setShow] = useState(false);
  const realType = hasToggle ? (show ? 'text' : 'password') : type;

  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">
        <i className={`fas ${icon}`} /> {label}
      </label>
      <div className="input-wrapper">
        <input
          id={id}
          type={realType}
          className={`form-control${hasToggle ? ' password-field' : ''} ${className}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
        />
        <i className={`fas ${icon} input-icon`} />
        {hasToggle && (
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShow(s => !s)}
            aria-label="Mostrar/ocultar contraseña"
          >
            <i className={`fas ${show ? 'fa-eye-slash' : 'fa-eye'}`} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Formulario de LOGIN ─────────────────────────── */
function FormLogin({ onSwitchToRegister }) {
  const navigate  = useNavigate();
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // Lockout en cliente
  const [attempts, setAttempts]   = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [remaining, setRemaining] = useState(0);

  // Cuenta regresiva de bloqueo
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const diff = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (diff <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setError('');
        setRemaining(0);
      } else {
        setRemaining(diff);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const isLocked = lockedUntil && Date.now() < lockedUntil;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('https://chocovisible-backend.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, action: 'login' }),
        credentials: 'include',
      });

      const data = await res.json();

      if (data.success) {
        navigate('/admin');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_SECS * 1000);
          setError(`Demasiados intentos fallidos. Por favor espere ${Math.ceil(LOCKOUT_SECS / 60)} minutos antes de intentar nuevamente.`);
        } else {
          const left = MAX_ATTEMPTS - newAttempts;
          setError(data.error || `Credenciales incorrectas. Le quedan ${left} intentos.`);
        }
      }
    } catch {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-container slide-in">
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-circle" />
          <span>
            {error}
            {isLocked && remaining > 0 && ` (${Math.ceil(remaining / 60)}m ${remaining % 60}s)`}
          </span>
        </div>
      )}

      <div className="security-info">
        <i className="fas fa-shield-alt" />
        <span>Conexión segura · Acceso exclusivo para administradores autorizados</span>
      </div>

      <form onSubmit={handleSubmit} autoComplete="on" noValidate>
        <InputField
          id="username"
          label="Usuario"
          icon="fa-user"
          placeholder="Ingrese su usuario"
          value={username}
          onChange={e => setUsername(e.target.value)}
          disabled={!!isLocked}
          required
          autoComplete="username"
        />
        <InputField
          id="password"
          label="Contraseña"
          icon="fa-lock"
          placeholder="Ingrese su contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={!!isLocked}
          required
          autoComplete="current-password"
          hasToggle
        />

        <button
          type="submit"
          className="btn-primary-cv"
          disabled={!!isLocked || loading}
        >
          {loading
            ? <><i className="fas fa-spinner fa-spin" /> Verificando…</>
            : <><i className="fas fa-sign-in-alt" /> Iniciar Sesión</>
          }
        </button>
      </form>

      <div className="toggle-link">

      </div>
    </div>
  );
}

/* ── Formulario de REGISTRO ──────────────────────── */
function FormRegistro({ onSwitchToLogin }) {
  const [form, setForm] = useState({
    nombreCompleto: '',
    username: '',
    telefono: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [strength, setStrength] = useState('');
  const [confirmState, setConfirmState] = useState(''); // 'error' | 'success' | ''

  function handleChange(field) {
    return e => {
      const val = e.target.value;
      setForm(f => ({ ...f, [field]: val }));

      if (field === 'password') {
        setStrength(val ? passwordStrength(val) : '');
        if (form.confirmPassword) {
          setConfirmState(val === form.confirmPassword ? 'success' : 'error');
        }
      }
      if (field === 'confirmPassword') {
        setConfirmState(!val ? '' : val === form.password ? 'success' : 'error');
      }
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!form.nombreCompleto || !form.username || !form.email || !form.password) {
      setError('Por favor complete todos los campos obligatorios.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, action: 'register' }),
        credentials: 'include',
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Administrador registrado exitosamente. Ahora puede iniciar sesión.');
        setForm({ nombreCompleto: '', username: '', telefono: '', email: '', password: '', confirmPassword: '' });
        setStrength('');
        setConfirmState('');
      } else {
        setError(data.error || 'Error al registrar el administrador. Intente nuevamente.');
      }
    } catch {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  const pwdMinError = form.password.length > 0 && form.password.length < 8 ? 'error' : '';

  return (
    <div className="form-container slide-in">
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-circle" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="alert">
          <i className="fas fa-check-circle" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>

        {/* Nombre completo */}
        <div className="form-group">
          <label htmlFor="reg_nombre" className="form-label">
            <i className="fas fa-id-card" /> Nombre completo *
          </label>
          <div className="input-wrapper">
            <input
              id="reg_nombre" type="text" className="form-control"
              placeholder="Ingrese su nombre completo"
              value={form.nombreCompleto}
              onChange={handleChange('nombreCompleto')}
              required
            />
            <i className="fas fa-id-card input-icon" />
          </div>
        </div>

        {/* Usuario + Teléfono */}
        <div className="row-2">
          <div className="form-group">
            <label htmlFor="reg_username" className="form-label">
              <i className="fas fa-user" /> Usuario *
            </label>
            <div className="input-wrapper">
              <input
                id="reg_username" type="text" className="form-control"
                placeholder="usuario"
                value={form.username}
                onChange={handleChange('username')}
                required
              />
              <i className="fas fa-user input-icon" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="reg_telefono" className="form-label">
              <i className="fas fa-phone" /> Teléfono
            </label>
            <div className="input-wrapper">
              <input
                id="reg_telefono" type="tel" className="form-control"
                placeholder="+57 300 000 0000"
                value={form.telefono}
                onChange={handleChange('telefono')}
              />
              <i className="fas fa-phone input-icon" />
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="reg_email" className="form-label">
            <i className="fas fa-envelope" /> Correo electrónico *
          </label>
          <div className="input-wrapper">
            <input
              id="reg_email" type="email" className="form-control"
              placeholder="correo@ejemplo.com"
              value={form.email}
              onChange={handleChange('email')}
              required
            />
            <i className="fas fa-envelope input-icon" />
          </div>
        </div>

        {/* Contraseña + Confirmar */}
        <div className="row-2">
          <div className="form-group">
            <label htmlFor="reg_password" className="form-label">
              <i className="fas fa-lock" /> Contraseña *
            </label>
            <div className="input-wrapper">
              <PasswordToggleInput
                id="reg_password"
                className={pwdMinError}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange('password')}
                required
              />
            </div>
            <div className={`strength-bar ${strength}`}>
              <span /><span /><span /><span />
            </div>
            <div className="form-text">Mínimo 8 caracteres</div>
          </div>

          <div className="form-group">
            <label htmlFor="reg_confirm" className="form-label">
              <i className="fas fa-lock" /> Confirmar *
            </label>
            <div className="input-wrapper">
              <PasswordToggleInput
                id="reg_confirm"
                className={confirmState}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                required
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary-cv" disabled={loading}>
          {loading
            ? <><i className="fas fa-spinner fa-spin" /> Registrando…</>
            : <><i className="fas fa-user-plus" /> Registrar Administrador</>
          }
        </button>
      </form>

      <div className="toggle-link">
        <a onClick={onSwitchToLogin} role="button" tabIndex={0}
           onKeyDown={e => e.key === 'Enter' && onSwitchToLogin()}>
          <i className="fas fa-sign-in-alt" /> ¿Ya tienes cuenta? Inicia sesión
        </a>
      </div>
    </div>
  );
}

/* Helper: input contraseña con toggle interno */
function PasswordToggleInput({ id, className, placeholder, value, onChange, required }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className={`form-control password-field ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
      <i className="fas fa-lock input-icon" />
      <button type="button" className="toggle-password" onClick={() => setShow(s => !s)}>
        <i className={`fas ${show ? 'fa-eye-slash' : 'fa-eye'}`} />
      </button>
    </>
  );
}

/* ══ Página principal ════════════════════════════════ */
export default function Login() {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="login-page">
      <Particles />

      <div className="login-card">

        {/* Cabecera */}
        <div className="login-header">
          <div className="logo-wrap">
            <img src="/assets/images/chocovisibleee.png" alt="ChocoVisible Logo" />
          </div>
          <div className="header-badge">
            <i className="fas fa-map-marker-alt" /> Quibdó, Chocó · Colombia
          </div>
          <h1>Choco<span>Visible</span></h1>
          <p>Panel de Administración · Denuncia Ciudadana</p>
        </div>

        {/* Cuerpo */}
        <div className="login-body">
          {showRegister
            ? <FormRegistro onSwitchToLogin={() => setShowRegister(false)} />
            : <FormLogin    onSwitchToRegister={() => setShowRegister(true)} />
          }
        </div>

        {/* Volver al sitio */}
        <Link to="/" className="back-link">
          <i className="fas fa-arrow-left" /> Volver al sitio principal
        </Link>

        <div className="card-footer-info">
          © {new Date().getFullYear()} ChocoVisible · Denuncia Ciudadana · Quibdó, Chocó
        </div>
      </div>
    </div>
  );
}