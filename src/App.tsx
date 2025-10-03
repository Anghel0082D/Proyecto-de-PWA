import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);

  // Simula carga inicial (splash screen)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Detectar cambios de conexión
  useEffect(() => {
    const updateStatus = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (loading) {
    return (
      <div className="splash">
        <img src="public/icons/image.png" alt="logo" className="logo" />
        <h1>Mi PWA Demo</h1>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h2>Mi PWA</h2>
      </header>

      <main className="content">
        <h3>Bienvenido 🚀</h3>
        <p>Esta es la App Shell con React + Vite.</p>
        <p>Esta es la App Fue creada por Angel Gabriel Carreon Trujillo👻👻👻👻</p>
        <p>Estado: {online ? "En línea ✅" : "Offline ❌"}</p>
      </main>

      <footer className="footer">© 2025 Mi PWA</footer>
    </div>
  );
}

export default App;
