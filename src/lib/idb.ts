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

export type Entry = {
  id: number;
  title: string;
  content: string;
  createdAt: number;
};

let dbPromise: Promise<IDBPDatabase<MyDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<MyDB>> {
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

export async function addEntry(entry: { title: string; content: string }): Promise<number> {
  const db = await getDB();
  return db.add('pending-entries', { ...entry, createdAt: Date.now() });
}

export async function getAllEntries(): Promise<Entry[]> {
  const db = await getDB();
  return db.getAll('pending-entries') as unknown as Promise<Entry[]>;
}

export async function deleteEntry(id: number): Promise<void> {
  const db = await getDB();
  return db.delete('pending-entries', id);
}
