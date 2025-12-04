
import { STORAGE_KEYS } from '../constants';

// --- Database Layer (Low Level) ---
// This file strictly handles reading/writing to localStorage without business logic.

const get = <T>(key: string, defaultVal: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultVal;
};

const set = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const db = {
  // Generic Helpers
  read: <T>(table: string, defaultVal: T) => get<T>(table, defaultVal),
  write: (table: string, data: any) => set(table, data),
  
  // Specific Table Accessors
  users: {
    getAll: () => get<any[]>(STORAGE_KEYS.USERS, []),
    setAll: (data: any[]) => set(STORAGE_KEYS.USERS, data)
  },
  courses: {
    getAll: () => get<any[]>(STORAGE_KEYS.COURSES, []),
    setAll: (data: any[]) => set(STORAGE_KEYS.COURSES, data)
  },
  modules: {
    getAll: () => get<any[]>(STORAGE_KEYS.MODULES, []),
    setAll: (data: any[]) => set(STORAGE_KEYS.MODULES, data)
  },
  lessons: {
    getAll: () => get<any[]>(STORAGE_KEYS.LESSONS, []),
    setAll: (data: any[]) => set(STORAGE_KEYS.LESSONS, data)
  },
  resources: {
    getAll: () => get<any[]>(STORAGE_KEYS.RESOURCES, []),
    setAll: (data: any[]) => set(STORAGE_KEYS.RESOURCES, data)
  },
  folders: {
    getAll: () => get<any[]>(STORAGE_KEYS.FOLDERS, []),
    setAll: (data: any[]) => set(STORAGE_KEYS.FOLDERS, data)
  },
  logs: {
    getAll: () => get<any[]>(STORAGE_KEYS.LOGS, []),
    add: (entry: any) => {
      const logs = get<any[]>(STORAGE_KEYS.LOGS, []);
      set(STORAGE_KEYS.LOGS, [entry, ...logs]);
    }
  },
  sessions: {
    getAll: () => get<any[]>('eduforge_sessions', []),
    setAll: (data: any[]) => set('eduforge_sessions', data)
  }
};
