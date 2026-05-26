// frontend/src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Home from './Home.jsx';
import NuevaDenuncia from './NuevaDenuncia.jsx';
import ProcesarDenuncia from './ProcesarDenuncia.jsx';
import ConsultarDenuncia from './ConsultarDenuncia.jsx';
import Login from './Login.jsx';
import Admin from "./Admin";
import Auditoria from "./Auditoria.jsx";

// dentro de <Routes>:
<Route path="/auditoria" element={<Auditoria />} />

function App() {
  return (
    <Routes>
      <Route path="/"                   element={<Home />} />
      <Route path="/nueva-denuncia"     element={<NuevaDenuncia />} />
      <Route path="/procesar-denuncia"  element={<ProcesarDenuncia />} />
      <Route path="/consultar"          element={<ConsultarDenuncia />} />
      <Route path="/login"              element={<Login />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/auditoria" element={<Auditoria />} />
    </Routes>
  );
}

export default App;

