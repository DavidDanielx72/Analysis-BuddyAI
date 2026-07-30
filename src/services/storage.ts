import type { AnalysisRecord, AppSettings } from '@/types';

const DB_NAME = 'sentinel-ai';
const DB_VERSION = 1;
const STORE_HISTORY = 'history';
const STORE_SETTINGS = 'settings';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function saveAnalysis(record: AnalysisRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    tx.objectStore(STORE_HISTORY).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllAnalyses(): Promise<AnalysisRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HISTORY, 'readonly');
    const req = tx.objectStore(STORE_HISTORY).getAll();
    req.onsuccess = () => {
      const all = (req.result as AnalysisRecord[]) ?? [];
      all.sort((a, b) => b.createdAt - a.createdAt);
      resolve(all);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getAnalysis(id: string): Promise<AnalysisRecord | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HISTORY, 'readonly');
    const req = tx.objectStore(STORE_HISTORY).get(id);
    req.onsuccess = () => resolve(req.result as AnalysisRecord | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function updateAnalysis(record: AnalysisRecord): Promise<void> {
  return saveAnalysis(record);
}

export async function deleteAnalysis(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    tx.objectStore(STORE_HISTORY).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllAnalyses(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    tx.objectStore(STORE_HISTORY).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  confidenceThreshold: 0.5,
  maxItemsPerAnalysis: 5000,
  defaultResponseTone: 'professional',
};

export async function getSettings(): Promise<AppSettings> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SETTINGS, 'readonly');
    const req = tx.objectStore(STORE_SETTINGS).get('app');
    req.onsuccess = () =>
      resolve({ ...DEFAULT_SETTINGS, ...(req.result ?? {}) } as AppSettings);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SETTINGS, 'readwrite');
    tx.objectStore(STORE_SETTINGS).put(settings, 'app');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
