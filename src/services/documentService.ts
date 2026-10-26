import { DocumentRecord, DocumentType, DocumentStatus } from '../types';
import { apiClient } from './apiClient';
import { insuranceService } from './insuranceService';

const STORAGE_KEY = 'hr_documents_clean_v1';
const CLEARED_FLAG = 'hr_documents_cleared_v1';

// Auto-purge legacy mock document state from browser
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const legacyKeys = ['hr_documents_v2', 'hr_documents_v1', 'hr_documents', 'hr_documents_cleared'];
    legacyKeys.forEach(k => localStorage.removeItem(k));
  }
} catch {
  // Ignore in SSR
}

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
  }
  return defaultValue;
}

function persistItem<T>(key: string, val: T) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
}

let documentsState = getStored<DocumentRecord[]>(STORAGE_KEY, []);

function applyFilters(docs: DocumentRecord[], params: DocumentFilterParams): DocumentRecord[] {
  let filtered = [...docs];

  if (params.search) {
    const q = params.search.toLowerCase().trim();
    filtered = filtered.filter(
      d =>
        d.employeeName.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.fileName.toLowerCase().includes(q)
    );
  }

  if (params.type && params.type !== 'all') {
    filtered = filtered.filter(d => d.type === params.type);
  }

  if (params.status && params.status !== 'all') {
    filtered = filtered.filter(d => d.status === params.status);
  }

  if (params.department && params.department !== 'all') {
    filtered = filtered.filter(d => d.department === params.department);
  }

  if (params.employeeId) {
    filtered = filtered.filter(d => d.employeeId === params.employeeId);
  }

  return filtered;
}

export interface DocumentFilterParams {
  search?: string;
  type?: DocumentType | 'all';
  status?: DocumentStatus | 'all';
  department?: string;
  employeeId?: string;
}

export const documentService = {
  async getDocuments(params: DocumentFilterParams = {}): Promise<DocumentRecord[]> {
    if (apiClient.isBackendAvailable()) {
      try {
        const response = await apiClient.get<any>('/documents', { params });
        const list: DocumentRecord[] = Array.isArray(response) ? response : response?.data || [];
        documentsState = list;
        return list;
      } catch (err) {
        console.warn('Backend unavailable for getDocuments, using local cache:', err);
      }
    }

    await new Promise(res => setTimeout(res, 30));
    return applyFilters(documentsState, params);
  },

  async deleteDocument(id: string): Promise<boolean> {
    if (apiClient.isBackendAvailable()) {
      try {
        await apiClient.delete(`/documents/${id}`);
      } catch (err) {
        console.warn('Backend delete document failed, applying local delete:', err);
      }
    }
    await new Promise(res => setTimeout(res, 40));
    documentsState = documentsState.filter(d => d.id !== id);
    persistItem(STORAGE_KEY, documentsState);
    if (documentsState.length === 0) {
      localStorage.setItem(CLEARED_FLAG, 'true');
    }
    return true;
  },

  async bulkDeleteDocuments(ids: string[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;
    if (apiClient.isBackendAvailable()) {
      try {
        await apiClient.post('/documents/bulk-delete', { ids });
      } catch (err) {
        console.warn('Backend bulk delete documents failed, applying local delete:', err);
      }
    }
    await new Promise(res => setTimeout(res, 50));
    const initialCount = documentsState.length;
    documentsState = documentsState.filter(d => !ids.includes(d.id));
    persistItem(STORAGE_KEY, documentsState);
    if (documentsState.length === 0) {
      localStorage.setItem(CLEARED_FLAG, 'true');
    }
    return initialCount - documentsState.length;
  },

  async deleteAllDocuments(): Promise<number> {
    if (apiClient.isBackendAvailable()) {
      try {
        await apiClient.delete('/documents/all');
      } catch (err) {
        console.warn('Backend deleteAllDocuments failed, applying local delete:', err);
      }
    }
    await new Promise(res => setTimeout(res, 60));
    const count = documentsState.length;
    documentsState = [];
    persistItem(STORAGE_KEY, documentsState);
    localStorage.setItem(CLEARED_FLAG, 'true');
    return count;
  },

  async verifyDocument(id: string, notes?: string): Promise<DocumentRecord> {
    if (apiClient.isBackendAvailable()) {
      try {
        const response = await apiClient.post<DocumentRecord>(`/documents/${id}/verify`, { notes });
        if (response) return response;
      } catch (err) {
        console.warn('Backend unavailable for verifyDocument, falling back to mock data:', err);
      }
    }

    await new Promise(res => setTimeout(res, 60));
    const doc = documentsState.find(d => d.id === id);
    if (!doc) throw new Error('Document not found');
    doc.status = 'verified';
    doc.verifiedAt = new Date().toISOString().split('T')[0];
    doc.verifiedBy = 'HR Specialist';
    if (notes) doc.notes = notes;
    persistItem(STORAGE_KEY, documentsState);
    return { ...doc };
  },

  async rejectDocument(id: string, rejectionReason: string): Promise<DocumentRecord> {
    if (apiClient.isBackendAvailable()) {
      try {
        const response = await apiClient.post<DocumentRecord>(`/documents/${id}/reject`, { rejectionReason });
        if (response) return response;
      } catch (err) {
        console.warn('Backend unavailable for rejectDocument, falling back to mock data:', err);
      }
    }

    await new Promise(res => setTimeout(res, 60));
    const doc = documentsState.find(d => d.id === id);
    if (!doc) throw new Error('Document not found');
    doc.status = 'rejected';
    doc.rejectionReason = rejectionReason;
    persistItem(STORAGE_KEY, documentsState);
    return { ...doc };
  },

  async uploadDocument(data: {
    file?: File;
    employeeId: string;
    type: DocumentType;
    title: string;
    employeeName?: string;
    department?: string;
  }): Promise<DocumentRecord> {
    if (apiClient.isBackendAvailable()) {
      try {
        const formData = new FormData();
        if (data.file) {
          formData.append('file', data.file);
        }
        formData.append('employeeId', data.employeeId);
        formData.append('type', data.type);
        formData.append('title', data.title);
        if (data.employeeName) formData.append('employeeName', data.employeeName);
        if (data.department) formData.append('department', data.department);

        const response = await apiClient.post<any>('/documents/upload', formData);
        const created = response?.data || response;
        if (created) {
          localStorage.removeItem(CLEARED_FLAG);
          return created;
        }
      } catch (err) {
        console.warn('Backend unavailable for uploadDocument, falling back to local:', err);
      }
    }

    await new Promise(res => setTimeout(res, 80));
    const newDoc: DocumentRecord = {
      id: `doc-${data.employeeId}-${data.type}-${Date.now()}`,
      employeeId: data.employeeId,
      employeeName: data.employeeName || 'Employee',
      department: data.department || 'Operations',
      type: data.type,
      title: data.title || data.type.replace('_', ' ').toUpperCase(),
      fileName: data.file?.name || `${data.title || 'document'}.pdf`,
      fileSize: data.file ? `${(data.file.size / (1024 * 1024)).toFixed(1)} MB` : '1.5 MB',
      status: 'under_review',
      uploadedAt: new Date().toISOString().split('T')[0],
      notes: 'Uploaded via HR self-service portal.',
    };
    documentsState.unshift(newDoc);
    persistItem(STORAGE_KEY, documentsState);
    localStorage.removeItem(CLEARED_FLAG);

    // Local fallback sync with insurance checklist
    try {
      const typeMap: Record<string, 'qualificationCert' | 'birthCert' | 'idCard' | 'contract'> = {
        qualification: 'qualificationCert',
        birth_certificate: 'birthCert',
        national_id: 'idCard',
        contract: 'contract',
      };
      const field = typeMap[data.type];
      if (field) {
        insuranceService.toggleDocumentStatus(data.employeeId, field).catch(() => {});
      }
    } catch {
      // ignore
    }

    return newDoc;
  },

  async mockUpload(
    employeeId: string,
    employeeName: string,
    department: string,
    type: DocumentType,
    fileName: string,
    fileSize: string = '2.1 MB'
  ): Promise<DocumentRecord> {
    return this.uploadDocument({
      employeeId,
      employeeName,
      department,
      type,
      title: fileName.replace(/\.[^/.]+$/, ''),
    });
  },
};
