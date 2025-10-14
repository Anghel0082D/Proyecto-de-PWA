
import { useEffect, useState, FormEvent } from "react";
import "./App.css";
import { addEntry, listEntries, queueForSync, type Entry } from "./lib/idb";
import { enablePushNotifications } from "./main";


function App() {
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);

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

  // Cargar registros desde IndexedDB
  useEffect(() => {
    listEntries().then(setEntries).catch(console.error);
  }, [loading]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const saved = await addEntry({ title, details });
    setTitle("");
    setDetails("");
    setEntries((prev) => [saved, ...prev]);
    if (!navigator.onLine) {
      await queueForSync(saved);
      // Registrar Background Sync
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        try {
          const reg = await navigator.serviceWorker.ready;
          await reg.sync.register("sync-entries");
        } catch (err) {
          console.warn("No se pudo registrar Background Sync:", err);
        }
      }
    } else {
      // Intento directo cuando hay conexión (frontend-only demo)
      try {
        await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saved),
        });
      } catch (e) {
        console.warn("Fallo envío online, se encola para sync");
        await queueForSync(saved);
        if ("serviceWorker" in navigator && "SyncManager" in window) {
          const reg = await navigator.serviceWorker.ready;
          await reg.sync.register("sync-entries");
        }
      }
    }
  }

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
        <button onClick={() => enablePushNotifications()}>Activar notificaciones</button>
      </header>
      <main className="content">
        <h3>Formulario Offline con IndexedDB</h3>
        <p>Estado: {online ? "En línea ✅" : "Offline ❌"}</p>

        <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
          <div>
            <label>Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Actividad o tarea"
              required
            />
          </div>
          <div>
            <label>Detalles</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Notas..."
            />
          </div>
          <button type="submit">Guardar</button>
        </form>

        <h4 style={{ marginTop: 24 }}>Registros</h4>
        <ul>
          {entries.map((e) => (
            <li key={e.id ?? e.createdAt}>
              <strong>{e.title}</strong> — {new Date(e.createdAt).toLocaleString()}
              {e.synced ? " (sincronizado)" : " (local)"}
              {e.details ? ` — ${e.details}` : null}
            </li>
          ))}
        </ul>
      </main>
      <footer className="footer">© 2025 Mi PWA</footer>
    </div>
  );
}

export default App;
