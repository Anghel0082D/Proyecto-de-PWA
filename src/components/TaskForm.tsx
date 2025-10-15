// src/components/TaskForm.tsx
import React, { useState } from 'react';
import { addTask } from '../lib/idb';

export default function TaskForm() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;

    try {
      await addTask(title);
      setMessage('✅ Tarea guardada localmente.');

      // Registrar sincronización en segundo plano (si está disponible)
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const reg = await navigator.serviceWorker.ready;
        await (reg as any).sync.register('sync-entries');
        setMessage('⏳ Tarea guardada y sincronización programada.');
      }
    } catch (error) {
      console.error(error);
      setMessage('❌ Error al guardar la tarea.');
    }

    setTitle('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nueva tarea..."
      />
      <button type="submit">Agregar</button>
      <p>{message}</p>
    </form>
  );
}
