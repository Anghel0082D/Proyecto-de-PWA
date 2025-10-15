// src/lib/idb.ts
import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import type { DBSchema } from 'idb';

interface MyDB extends DBSchema {
  'tasks': {
    key: number;
    value: {
      id?: number;
      title: string;
      completed: boolean;
      createdAt: number;
    };
    indexes: { 'by-created': number };
  };
}

let dbPromise: Promise<IDBPDatabase<MyDB>>;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MyDB>('my-pwa-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('tasks', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-created', 'createdAt');
      },
    });
  }
  return dbPromise;
}

export async function addTask(title: string) {
  const db = await getDB();
  return db.add('tasks', { title, completed: false, createdAt: Date.now() });
}

export async function getTasks() {
  const db = await getDB();
  return db.getAllFromIndex('tasks', 'by-created');
}

export async function deleteTask(id: number) {
  const db = await getDB();
  return db.delete('tasks', id);
}

export async function toggleTask(id: number) {
  const db = await getDB();
  const task = await db.get('tasks', id);
  if (task) {
    task.completed = !task.completed;
    await db.put('tasks', task);
  }
}
