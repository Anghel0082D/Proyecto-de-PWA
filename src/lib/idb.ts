// src/lib/idb.ts
import { openDB, type DBSchema } from 'idb';
import type { IDBPDatabase } from 'idb';

interface MyDB extends DBSchema {
  'pending-entries': {
    key: number;
    value: {
      id?: number;
      title: string;
      content: string;
      createdAt: number;
    };
    indexes: { 'by-created': number };
  };
}

let dbPromise: Promise<IDBPDatabase<MyDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MyDB>('my-pwa-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('pending-entries', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-created', 'createdAt');
      },
    });
  }
  return dbPromise;
}

export async function addEntry(entry: { title: string; content: string }) {
  const db = await getDB();
  return db.add('pending-entries', { ...entry, createdAt: Date.now() });
}

export async function getAllEntries() {
  const db = await getDB();
  return db.getAll('pending-entries');
}

export async function deleteEntry(id: number) {
  const db = await getDB();
  return db.delete('pending-entries', id);
}
