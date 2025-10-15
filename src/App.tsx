
import { useEffect, useState } from "react";
import "./App.css";
import OfflineForm from './components/OfflineForm';
import EntriesList from './components/EntriesList';


function App() {
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);

  // Splash de carga
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Detectar estado online/offline
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
        <img src="/icons/image.png" alt="logo" className="logo" />
        <h1>Mi PWA AGCT</h1>
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
        <OfflineForm />
        <EntriesList />
      </main>
      <footer className="footer">© 2025 Mi PWA</footer>
    </div>
  );
}

export default App;
