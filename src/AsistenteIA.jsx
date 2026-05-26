import { useState, useRef, useEffect } from 'react';
import './AsistenteIA.css';

const API_IA = 'http://localhost:3000/api/ia/chat';

export default function AsistenteIA({ onFillForm }) {
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [datosPendientes, setDatosPendientes] = useState(null);

  const [mensajes, setMensajes] = useState([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy Asis, tu asistente para redactar denuncias. 👋\n\nCuéntame qué está pasando y te ayudo a documentarlo correctamente.',
    },
  ]);

  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [mensajes, loading]);

  async function enviarMensaje() {
    const texto = mensaje.trim();
    if (!texto || loading) return;

    const nuevoHistorial = [
      ...mensajes,
      {
        role: 'user',
        content: texto,
      },
    ];

    setMensajes(nuevoHistorial);
    setMensaje('');
    setLoading(true);

    try {
      const historialApi = nuevoHistorial.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

      const res = await fetch(API_IA, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensaje: texto,
          historial: historialApi,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error con el asistente IA.');
      }

      setMensajes(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.respuesta,
        },
      ]);

      if (data.datosDenuncia || data.datos) {
        setDatosPendientes(data.datosDenuncia || data.datos);
      }

    } catch (error) {
      setMensajes(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${error.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function rellenarFormulario() {
    if (!datosPendientes) return;

    onFillForm?.(datosPendientes);

    setMensajes(prev => [
      ...prev,
      {
        role: 'assistant',
        content: '✅ Formulario rellenado automáticamente. Revisa los datos antes de enviar.',
      },
    ]);

    setDatosPendientes(null);
    setOpen(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  }

  return (
    <>
      <button
        className="ai-toggle-btn"
        title="Asistente IA"
        onClick={() => setOpen(!open)}
      >
        <span className="ai-badge">IA</span>
        <i className="fas fa-comment-alt" />
      </button>

      <div className={`ai-panel ${open ? 'open' : ''}`}>
        <div className="ai-header">
          <div className="ai-avatar">🤖</div>
          <div>
            <strong>Asis — Asistente IA</strong>
            <small>ChocoVisible · Powered by OpenAI</small>
          </div>
          <button className="ai-close" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>

        <div className="ai-messages" ref={messagesRef}>
          {mensajes.map((m, index) => (
            <div
              key={index}
              className={`ai-msg ${m.role === 'assistant' ? 'bot' : 'user'}`}
            >
              {m.content}
            </div>
          ))}

          {loading && (
            <div className="ai-msg bot typing">
              Asis está escribiendo...
            </div>
          )}
        </div>

        {datosPendientes && (
          <button className="ai-fill-btn" onClick={rellenarFormulario}>
            ⚡ Rellenar formulario automáticamente
          </button>
        )}

        <div className="ai-input-area">
          <textarea
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            rows={1}
          />

          <button onClick={enviarMensaje} disabled={loading}>
            <i className="fas fa-paper-plane" />
          </button>
        </div>
      </div>
    </>
  );
}