import React, { useState } from 'react';
import { addTask } from '../lib/idb';

// ✅ Extensión de tipo para incluir SyncManager
interface ServiceWorkerRegistrationSync extends ServiceWorkerRegistration {
  sync: {
    register(tag: string): Promise<void>;
  };
}

export default function TaskForm() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await addTask(title);
      setMessage('✅ Tarea guardada localmente.');

      // 🔄 Registro de sincronización en segundo plano
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = (await navigator.serviceWorker.ready) as ServiceWorkerRegistrationSync;
        await registration.sync.register('sync-entries');
        setMessage('⏳ Tarea guardada y sincronización programada.');
      }
    } catch (error) {
      console.error('Error al guardar tarea:', error);
      setMessage('❌ Error al guardar la tarea.');
    }

    setTitle('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
        placeholder="Nueva tarea..."
      />
      <button type="submit">Agregar</button>
      <p>{message}</p>
    </form>
  );
}
