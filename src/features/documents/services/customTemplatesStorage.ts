export interface CustomFormTemplate {
  id: string;
  titleAr: string;
  titleSecondary?: string;
  description: string;
  originalFileName: string;
  downloadUrl?: string;
  fileData: string; // Base64 data URL
  format: 'docx' | 'pdf' | 'xlsx';
  fileSize: string;
  category: 'resignation' | 'payroll' | 'insurance' | 'general' | 'administrative' | 'assets' | 'onboarding';
  categoryLabelAr: string;
  tags: string[];
  lastUpdated: string;
  isCustom: true;
  colorScheme: {
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    iconColor: string;
  };
}

const DB_NAME = 'HR_TEMPLATES_DB';
const DB_VERSION = 1;
const STORE_NAME = 'custom_templates';
const LOCAL_STORAGE_BACKUP_KEY = 'hr_custom_templates_backup_v1';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const customTemplatesStorage = {
  async getAll(): Promise<CustomFormTemplate[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback to localStorage
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
  },

  async save(template: CustomFormTemplate): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(template);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback to localStorage
      try {
        const existing = await this.getAll();
        const updated = [...existing.filter(t => t.id !== template.id), template];
        localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save to localStorage fallback', err);
        throw new Error('فشلت عملية حفظ النموذج');
      }
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback to localStorage
      try {
        const existing = await this.getAll();
        const updated = existing.filter(t => t.id !== id);
        localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to delete from localStorage fallback', err);
      }
    }
  },
};
