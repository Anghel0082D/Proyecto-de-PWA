import { useEffect, useState } from "react";
import "./App.css";
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList'

function App() {
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);

  // 🟡 Splash de carga inicial
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // 🌐 Detectar estado online/offline
  useEffect(() => {
    const updateStatus = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  // 🔔 Registrar Service Worker (por si no lo tienes ya en main.tsx)
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((reg) => console.log("Service Worker registrado:", reg))
        .catch((err) => console.error("Error al registrar SW:", err));
    }
  }, []);

  // ⏳ Pantalla Splash (branding)
  if (loading) {
    return (
      <div className="splash">
        <img src="/icons/image.png" alt="logo" className="logo" />
        <h1 className="brand-title">Mi PWA AGCT</h1>
        <p className="brand-author">Creada por Angel Gabriel Carreón Trujillo 👻</p>
      </div>
    );
  }

  // 🧩 Interfaz principal
  return (
    <div className="app">
      <header className="header">
        <h2>Mi PWA AGCT 🚀</h2>
      </header>

      <main className="content">
        <h3>Bienvenido 🚀</h3>
        <p>Esta es la App Shell con React + Vite.</p>        <p>Esta es la App Fue creada por Angel Gabriel Carreon Trujillo👻👻👻👻</p>
        <p>Estado: {online ? "En línea ✅" : "Offline ❌"}</p>
      </main>
      <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h1>Mi Lista de Tareas Offline 📝</h1>
      <TaskForm />
      <TaskList />
    </div>
      <footer className="footer">© 2025 Mi PWA</footer>
    </div>
  );
}

export default App;
