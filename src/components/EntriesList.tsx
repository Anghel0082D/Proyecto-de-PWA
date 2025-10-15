
import { useEffect, useState } from 'react';
import { getAllEntries, deleteEntry } from '../lib/idb';

export default function EntriesList() {
  const [entries, setEntries] = useState<any[]>([]);

  async function load() {
    const all = await getAllEntries();
    setEntries(all.sort((a,b)=>b.createdAt - a.createdAt));
  }

  useEffect(() => {
    load();
    // opcional: actualizar cada vez que la página se vuelve visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') load();
    });
  }, []);

  return (
    <div>
      <h3>Entradas guardadas</h3>
      <ul>
        {entries.map((e) => (
          <li key={e.id}>
            <strong>{e.title}</strong> — {new Date(e.createdAt).toLocaleString()}
            <p>{e.content}</p>
            <button onClick={async () => { await deleteEntry(e.id); await load(); }}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
