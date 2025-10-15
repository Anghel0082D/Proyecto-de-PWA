
import React, { useState } from 'react';
import { addEntry } from '../lib/idb';

type SyncCapableSWRegistration = ServiceWorkerRegistration & {
  sync: { register: (tag: string) => Promise<void> };
};

export default function OfflineForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [msg, setMsg] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !content) return setMsg('Completa todos los campos.');

    try {
      const id = await addEntry({ title, content });
      setMsg(`Guardado local (id ${id}).`);

      // Registrar Background Sync si está disponible
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        try {
          await (registration as SyncCapableSWRegistration).sync.register('sync-entries');
          setMsg('Guardado y sincronización programada (Background Sync).');
        } catch {
          setMsg('Guardado local; Background Sync no disponible (intenta en línea).');
        }
      } else {
        setMsg('Guardado local; Background Sync no soportado en este navegador.');
      }
    } catch (err) {
      setMsg('Error guardando localmente.');
      console.error(err);
    }

    setTitle('');
    setContent('');
  }

  return (
    <form onSubmit={onSubmit}>
      <label>
        Título:
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label>
        Contenido:
        <textarea value={content} onChange={(e) => setContent(e.target.value)} />
      </label>
      <button type="submit">Guardar</button>
      <div>{msg}</div>
    </form>
  );
}
