import { useEffect, useState } from "react";
import "./App.css";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import OfflineView from "./components/OfflineView";
function App() {
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);

  // Splash de carga inicial
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
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

  // Registrar Service Worker (por si no lo tienes ya en main.tsx)
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((reg) => console.log("Service Worker registrado:", reg))
        .catch((err) => console.error("Error al registrar SW:", err));
    }
  }, []);

  // Pantalla Splash (branding)
  if (loading) {
    return (
      <div className="splash">
        <img src="/icons/image.png" alt="logo" className="logo" />
        <h1 className="brand-title">Mi PWA AGCT</h1>
        <p className="brand-author">Creada por Angel Gabriel Carreón Trujillo 👻</p>
      </div>
    );
  }

  // Vista offline
  if (!online) {
    return <OfflineView />;
  }

  // Interfaz principal
  return (
    <div className="app">
      <header className="header">
        <h2>Mi PWA AGCT 🚀</h2>
      </header>

      <main className="content">
        <h3>Bienvenido a tu App Progresiva</h3>
        <p>
          Esta es una aplicación PWA desarrollada con React + Vite, lista para
          funcionar offline, sincronizar datos y enviar notificaciones.
        </p>

        {/* Estado de conexión */}
        <div
          style={{
            background: online ? "#c8f7c5" : "#f7c5c5",
            color: online ? "#225522" : "#661111",
            padding: "8px",
            borderRadius: "8px",
            marginBottom: "10px",
            textAlign: "center",
          }}
        >
          Estado: {online ? "En línea ✅" : "Offline ❌ — se guardará localmente"}
        </div>

        {/* Sección de tareas */}
        <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
          <h2>📋 Lista de Tareas Offline</h2>
          <TaskForm />
          <TaskList />
        </div>

        {/* Botón para activar notificaciones */}
        <button
          onClick={async () => {
            if ("Notification" in window) {
              const permission = await Notification.requestPermission();
              if (permission === "granted") {
                new Notification("¡Notificaciones activadas!", {
                  body: "Ahora recibirás avisos de tus tareas.",
                  icon: "/icons/image.png",
                });
              }
            }
          }}
          style={{
            display: "block",
            margin: "20px auto",
            padding: "10px 20px",
            borderRadius: "10px",
            background: "#0078ff",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Permitir Notificaciones
        </button>
      </main>

    <footer className="footer">© 2025 Mi PWA — Angel Gabriel Carreón Trujillo</footer>
  </div>
);
}

export default App;
