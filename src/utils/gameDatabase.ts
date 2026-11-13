/**
 * Astronavega Client-Side Game Database (IndexedDB with LocalStorage fallback)
 * Provides persistent high-speed caching for game state, astronaut customization,
 * unlocked exoplanets, graphics performance presets, and procedural seed caches.
 * Prevents redundant runtime computations and eliminates frame-rate stutter.
 */

const DB_NAME = 'AstronavegaGameDB';
const DB_VERSION = 1;
const STORE_NAME = 'gameStateStore';

interface DBStatus {
  isReady: boolean;
  storageType: 'indexeddb' | 'localstorage' | 'memory';
  lastSaved: string | null;
  savedKeysCount: number;
}

let dbInstance: IDBDatabase | null = null;
let statusInfo: DBStatus = {
  isReady: false,
  storageType: 'memory',
  lastSaved: null,
  savedKeysCount: 0,
};

export async function initGameDatabase(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if (!window.indexedDB) {
    statusInfo.storageType = 'localstorage';
    statusInfo.isReady = true;
    return true;
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        statusInfo.isReady = true;
        statusInfo.storageType = 'indexeddb';
        resolve(true);
      };

      request.onerror = () => {
        // Fallback gracefully to localStorage
        statusInfo.isReady = true;
        statusInfo.storageType = 'localstorage';
        resolve(false);
      };
    } catch {
      statusInfo.isReady = true;
      statusInfo.storageType = 'localstorage';
      resolve(false);
    }
  });
}

export async function saveGameStateToDB(data: Record<string, unknown>): Promise<boolean> {
  const payload = {
    key: 'current_game_save',
    updatedAt: new Date().toISOString(),
    data,
  };

  statusInfo.lastSaved = new Date().toLocaleTimeString();

  if (dbInstance && statusInfo.storageType === 'indexeddb') {
    return new Promise((resolve) => {
      try {
        const tx = dbInstance!.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(payload);
        tx.oncomplete = () => {
          statusInfo.savedKeysCount = Object.keys(data).length;
          resolve(true);
        };
        tx.onerror = () => {
          // Fallback to localStorage on transaction error
          try {
            localStorage.setItem(DB_NAME, JSON.stringify(payload));
            resolve(true);
          } catch {
            resolve(false);
          }
        };
      } catch {
        resolve(false);
      }
    });
  }

  try {
    localStorage.setItem(DB_NAME, JSON.stringify(payload));
    statusInfo.savedKeysCount = Object.keys(data).length;
    return true;
  } catch {
    return false;
  }
}

export async function loadGameStateFromDB(): Promise<Record<string, unknown> | null> {
  if (dbInstance && statusInfo.storageType === 'indexeddb') {
    return new Promise((resolve) => {
      try {
        const tx = dbInstance!.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get('current_game_save');
        req.onsuccess = () => {
          if (req.result && req.result.data) {
            statusInfo.lastSaved = new Date(req.result.updatedAt).toLocaleTimeString();
            resolve(req.result.data as Record<string, unknown>);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  try {
    const raw = localStorage.getItem(DB_NAME);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data) {
        statusInfo.lastSaved = new Date(parsed.updatedAt).toLocaleTimeString();
        return parsed.data as Record<string, unknown>;
      }
    }
  } catch {
    // Ignore parse error
  }
  return null;
}

export function getDatabaseStatus(): DBStatus {
  return { ...statusInfo };
}
