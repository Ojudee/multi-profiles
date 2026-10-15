import { PartnerRecord } from '../types';

const DB_NAME = 'PartnerProfilesDossierDB';
const DB_VERSION = 1;
const STORE_NAME = 'partnersStore';
const KEY = 'active_partner_records';
const LOCAL_STORAGE_KEY = 'cpp_partners_backup_v2';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not available in this environment'));
        return;
      }
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Save partners list to IndexedDB (virtually unlimited quota for large base64 images)
 * and sync with the Express backend server store.
 */
export async function savePartnersToStorage(partners: PartnerRecord[]): Promise<void> {
  // 1. Save to IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(partners, KEY);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch (err) {
    console.warn('[Storage] IndexedDB save warning:', err);
  }

  // 2. Also sync to Server-side storage for durability
  try {
    await fetch('/api/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partners }),
    });
  } catch (err) {
    // offline or backend busy, no problem as IndexedDB has it
  }

  // 3. Fallback: try small localStorage backup without images if too big
  try {
    const json = JSON.stringify(partners);
    if (json.length < 3 * 1024 * 1024) {
      localStorage.setItem(LOCAL_STORAGE_KEY, json);
    }
  } catch {
    // Quota reached, ignore since IndexedDB and server store hold the full data
  }
}

/**
 * Load partners list from IndexedDB, falling back to server-side endpoint,
 * then localStorage.
 */
export async function loadPartnersFromStorage(): Promise<PartnerRecord[] | null> {
  // 1. Try IndexedDB first (fastest and handles full base64 images)
  try {
    const db = await openDB();
    const result = await new Promise<PartnerRecord[] | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(KEY);
      getReq.onsuccess = () => {
        if (getReq.result && Array.isArray(getReq.result) && getReq.result.length > 0) {
          resolve(getReq.result);
        } else {
          resolve(null);
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });

    if (result) {
      return result;
    }
  } catch (err) {
    console.warn('[Storage] IndexedDB load failed, trying server:', err);
  }

  // 2. Try Server-side store (if running with backend server)
  try {
    const res = await fetch('/api/partners');
    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.partners) && data.partners.length > 0) {
        // Cache to IndexedDB for next time
        try {
          const db = await openDB();
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).put(data.partners, KEY);
        } catch {}
        return data.partners;
      }
    }
  } catch {
    // Static hosting environment (GitHub Pages) or server offline
  }

  // 3. Try LocalStorage backup
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return null;
}

/**
 * Reset and clear saved partners from both client and server storage.
 */
export async function clearPartnersFromStorage(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(KEY);
  } catch {}

  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {}

  try {
    await fetch('/api/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partners: null }),
    });
  } catch {}
}
