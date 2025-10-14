import { openDB, IDBPDatabase } from 'idb';

export type Entry = {
  id?: number;
  title: string;
  details: string;
  createdAt: number;
  synced?: boolean;
};

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

function getDatabase(): Promise<IDBPDatabase<any>> {
  if (!dbPromise) {
    dbPromise = openDB('week4-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('entries')) {
          const entries = db.createObjectStore('entries', {
            keyPath: 'id',
            autoIncrement: true,
          });
          entries.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('outbox')) {
          const outbox = db.createObjectStore('outbox', {
            keyPath: 'id',
            autoIncrement: true,
          });
          outbox.createIndex('createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

export async function addEntry(entry: Omit<Entry, 'id' | 'createdAt'>): Promise<Entry> {
  const db = await getDatabase();
  const record: Entry = { ...entry, createdAt: Date.now(), synced: navigator.onLine };
  const id = await db.add('entries', record);
  return { ...record, id };
}

export async function listEntries(): Promise<Entry[]> {
  const db = await getDatabase();
  const tx = db.transaction('entries');
  const index = tx.store.index('createdAt');
  const all = await index.getAll();
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function markEntrySyncedByCreatedAt(createdAt: number): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction('entries', 'readwrite');
  const index = tx.store.index('createdAt');
  const items = await index.getAll();
  const item = items.find((e) => e.createdAt === createdAt);
  if (item && item.id != null) {
    await tx.store.put({ ...item, synced: true });
  }
  await tx.done;
}

export async function queueForSync(entry: Entry): Promise<void> {
  const db = await getDatabase();
  await db.add('outbox', { ...entry, synced: false });
}

export async function getOutbox(): Promise<Entry[]> {
  const db = await getDatabase();
  const tx = db.transaction('outbox');
  const index = tx.store.index('createdAt');
  const all = await index.getAll();
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function removeFromOutbox(ids: number[]): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction('outbox', 'readwrite');
  await Promise.all(ids.map((id) => tx.store.delete(id)));
  await tx.done;
}
