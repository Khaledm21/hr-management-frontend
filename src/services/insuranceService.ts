import { InsuranceItem, SocialInsuranceRecord, MissingDocumentRecord } from '../types';
import { apiClient } from './apiClient';

const STORAGE_KEYS = {
  INSURANCE_AUDIT: 'hr_insurance_audit_v2',
  SOCIAL_INSURANCE: 'hr_social_insurance_v2',
  MISSING_DOCS: 'hr_missing_docs_v2',
};

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

let insuranceState = getStored<InsuranceItem[]>(STORAGE_KEYS.INSURANCE_AUDIT, []);
let socialInsuranceState = getStored<SocialInsuranceRecord[]>(STORAGE_KEYS.SOCIAL_INSURANCE, []);
let missingDocumentsState = getStored<MissingDocumentRecord[]>(STORAGE_KEYS.MISSING_DOCS, []);

export interface InsuranceFilterParams {
  search?: string;
  department?: string;
  status?: 'complete' | 'missing' | 'under_review' | 'all';
}

export interface SocialInsuranceFilterParams {
  search?: string;
  department?: string;
  employeeListStatus?: 'found' | 'not_found' | 'all';
}

export interface MissingDocumentsFilterParams {
  search?: string;
  department?: string;
  status?: 'incomplete' | 'complete' | 'all';
  missingDoc?: 'qualification' | 'birth' | 'idCard' | 'contract' | 'all';
}

export const insuranceService = {
  // Existing audit records
  async getInsuranceRecords(params: InsuranceFilterParams = {}): Promise<InsuranceItem[]> {
    await new Promise(res => setTimeout(res, 30));
    let filtered = [...insuranceState];

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        i =>
          i.employeeName.toLowerCase().includes(q) ||
          i.employeeCode.toLowerCase().includes(q)
      );
    }

    if (params.department && params.department !== 'all') {
      filtered = filtered.filter(i => i.department === params.department);
    }

    if (params.status && params.status !== 'all') {
      filtered = filtered.filter(i => i.insuranceStatus === params.status);
    }

    return filtered;
  },

  // 1. Social Insurance Registry (Sheet 2: Social Insurance - September)
  async getSocialInsuranceRecords(params: SocialInsuranceFilterParams = {}): Promise<SocialInsuranceRecord[]> {
    if (apiClient.isBackendAvailable()) {
      try {
        const response = await apiClient.get<SocialInsuranceRecord[]>('/insurance/social', { params });
        if (response) return response;
      } catch (err) {
        console.warn('Backend unavailable for getSocialInsuranceRecords, falling back to mock data:', err);
      }
    }

    await new Promise(res => setTimeout(res, 40));
    let filtered = [...socialInsuranceState];

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        r =>
          r.employeeName.toLowerCase().includes(q) ||
          r.nationalId.includes(q) ||
          r.insuranceNumber.includes(q) ||
          (r.employeeCode && r.employeeCode.toLowerCase().includes(q))
      );
    }

    if (params.department && params.department !== 'all') {
      filtered = filtered.filter(r => r.department === params.department);
    }

    if (params.employeeListStatus && params.employeeListStatus !== 'all') {
      filtered = filtered.filter(r => r.employeeListStatus === params.employeeListStatus);
    }

    return filtered;
  },

  // 2. Missing Documents Tracker (Sheet 3: Missing Documents)
  async getMissingDocumentsRecords(params: MissingDocumentsFilterParams = {}): Promise<MissingDocumentRecord[]> {
    if (apiClient.isBackendAvailable()) {
      try {
        const response = await apiClient.get<MissingDocumentRecord[]>('/insurance/missing-documents', { params });
        if (response) return response;
      } catch (err) {
        console.warn('Backend unavailable for getMissingDocumentsRecords, falling back to mock data:', err);
      }
    }

    await new Promise(res => setTimeout(res, 40));
    let filtered = [...missingDocumentsState];

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        d =>
          d.employeeName.toLowerCase().includes(q) ||
          d.nationalId.includes(q) ||
          d.employeeCode.toLowerCase().includes(q) ||
          d.position.toLowerCase().includes(q)
      );
    }

    if (params.department && params.department !== 'all') {
      filtered = filtered.filter(d => d.department === params.department);
    }

    if (params.status && params.status !== 'all') {
      filtered = filtered.filter(d => d.status === params.status);
    }

    if (params.missingDoc && params.missingDoc !== 'all') {
      if (params.missingDoc === 'qualification') {
        filtered = filtered.filter(d => d.qualificationCert === 'missing');
      } else if (params.missingDoc === 'birth') {
        filtered = filtered.filter(d => d.birthCert === 'missing');
      } else if (params.missingDoc === 'idCard') {
        filtered = filtered.filter(d => d.idCard === 'missing');
      } else if (params.missingDoc === 'contract') {
        filtered = filtered.filter(d => d.contract === 'missing');
      }
    }

    return filtered;
  },

  // Toggle single document for an employee
  async toggleDocumentStatus(
    id: string,
    docType: 'qualificationCert' | 'birthCert' | 'idCard' | 'contract'
  ): Promise<MissingDocumentRecord> {
    if (apiClient.isBackendAvailable()) {
      try {
        return await apiClient.patch<MissingDocumentRecord>(`/insurance/missing-documents/${id}/toggle`, {
          documentType: docType,
        });
      } catch (err) {
        console.warn('Backend unavailable for toggleDocumentStatus, falling back to mock data:', err);
      }
    }

    await new Promise(res => setTimeout(res, 30));
    const idx = missingDocumentsState.findIndex(d => d.id === id);
    if (idx === -1) throw new Error('Record not found');

    const item = { ...missingDocumentsState[idx] };
    const currentVal = item[docType];
    item[docType] = currentVal === 'missing' ? 'available' : 'missing';

    let count = 0;
    if (item.qualificationCert === 'missing') count++;
    if (item.birthCert === 'missing') count++;
    if (item.idCard === 'missing') count++;
    if (item.contract === 'missing') count++;

    item.missingCount = count;
    item.status = count === 0 ? 'complete' : 'incomplete';
    item.notes = count === 0 ? 'All documents submitted' : `${count} document(s) pending`;

    missingDocumentsState[idx] = item;
    persistItem(STORAGE_KEYS.MISSING_DOCS, missingDocumentsState);
    return item;
  },

  // Toggle insuranceStatus ('insured' | 'not_insured') for a Missing Document record
  // and automatically add/remove the employee in the Social Insurance sheet
  async toggleInsuranceStatus(
    record: MissingDocumentRecord,
    currentlyInsured?: boolean
  ): Promise<{ missingRecord: MissingDocumentRecord; targetStatus: 'insured' | 'not_insured' }> {
    const isCurrentlyInsured =
      currentlyInsured !== undefined ? currentlyInsured : record.insuranceStatus === 'insured';
    const targetStatus: 'insured' | 'not_insured' = isCurrentlyInsured ? 'not_insured' : 'insured';

    let updatedMissing: MissingDocumentRecord = {
      ...record,
      insuranceStatus: targetStatus,
    };

    if (apiClient.isBackendAvailable()) {
      try {
        const patched = await apiClient.patch<MissingDocumentRecord>(
          `/insurance/missing-documents/${record.id}/toggle`,
          {
            documentType: 'insuranceStatus',
            status: targetStatus,
          }
        );
        if (patched) {
          updatedMissing = { ...patched, insuranceStatus: targetStatus };
        }
      } catch (err) {
        console.warn('Backend toggle insuranceStatus on missing-documents failed, continuing with social sync:', err);
      }

      if (targetStatus === 'insured') {
        try {
          const existingSocial = await this.getSocialInsuranceRecords();
          const alreadyInSocial = existingSocial.some(
            s =>
              (record.nationalId && s.nationalId && s.nationalId.trim() === record.nationalId.trim()) ||
              (record.employeeCode && s.employeeCode && s.employeeCode.trim() === record.employeeCode.trim())
          );

          if (!alreadyInSocial) {
            const salary = 4325.0;
            const worker = Number((salary * 0.11).toFixed(2));
            const company = Number((salary * 0.1875).toFixed(2));
            await this.importSocialInsurance(
              [
                {
                  serialNo: existingSocial.length + 1,
                  nationalId: record.nationalId?.trim() || record.employeeCode?.trim() || String(Date.now()),
                  employeeName: record.employeeName?.trim() || 'Employee',
                  department: record.department || 'HR',
                  employeeCode: record.employeeCode,
                  insuranceNumber: 'قيد الإصدار',
                  insuranceSalary: salary,
                  workerShare: worker,
                  companyShare: company,
                  totalContribution: Number((worker + company).toFixed(2)),
                  note: record.startDate ? `Start: ${record.startDate}` : 'تم التأمين من شيت مسوغات التعيين',
                  employeeListStatus: 'found',
                },
              ],
              false
            );
          }
        } catch (err) {
          console.error('Failed to auto-add employee to Social Insurance sheet:', err);
          throw err;
        }
      } else {
        try {
          const existingSocial = await this.getSocialInsuranceRecords();
          const matchedSocial = existingSocial.find(
            s =>
              (record.nationalId && s.nationalId && s.nationalId.trim() === record.nationalId.trim()) ||
              (record.employeeCode && s.employeeCode && s.employeeCode.trim() === record.employeeCode.trim())
          );
          const deleteTargetId = matchedSocial?.id || record.nationalId?.trim() || record.employeeCode?.trim();
          if (deleteTargetId) {
            await this.deleteSocialInsurance(deleteTargetId).catch(() => {});
          }
        } catch (err) {
          console.warn('Could not remove employee from Social Insurance sheet:', err);
        }
      }
    } else {
      // Local state fallback when backend is offline
      if (targetStatus === 'insured') {
        const alreadyInSocial = socialInsuranceState.some(
          s =>
            (record.nationalId && s.nationalId === record.nationalId) ||
            (record.employeeCode && s.employeeCode === record.employeeCode)
        );
        if (!alreadyInSocial) {
          const salary = 4325.0;
          const worker = Number((salary * 0.11).toFixed(2));
          const company = Number((salary * 0.1875).toFixed(2));
          const newSocial: SocialInsuranceRecord = {
            id: `soc-auto-${Date.now()}`,
            serialNo: socialInsuranceState.length + 1,
            nationalId: record.nationalId?.trim() || record.employeeCode?.trim() || '',
            employeeName: record.employeeName,
            department: record.department || 'HR',
            employeeCode: record.employeeCode,
            insuranceNumber: 'قيد الإصدار',
            insuranceSalary: salary,
            workerShare: worker,
            companyShare: company,
            totalContribution: Number((worker + company).toFixed(2)),
            note: record.startDate ? `Start: ${record.startDate}` : 'تم التأمين من شيت مسوغات التعيين',
            employeeListStatus: 'found',
          };
          socialInsuranceState = [newSocial, ...socialInsuranceState];
          persistItem(STORAGE_KEYS.SOCIAL_INSURANCE, socialInsuranceState);
        }
      } else {
        socialInsuranceState = socialInsuranceState.filter(
          s =>
            (!record.nationalId || s.nationalId !== record.nationalId) &&
            (!record.employeeCode || s.employeeCode !== record.employeeCode)
        );
        persistItem(STORAGE_KEYS.SOCIAL_INSURANCE, socialInsuranceState);
      }
    }

    const idx = missingDocumentsState.findIndex(
      d =>
        d.id === record.id ||
        (record.employeeCode && d.employeeCode === record.employeeCode) ||
        (record.nationalId && d.nationalId === record.nationalId)
    );
    if (idx !== -1) {
      missingDocumentsState[idx] = {
        ...missingDocumentsState[idx],
        insuranceStatus: targetStatus,
      };
      persistItem(STORAGE_KEYS.MISSING_DOCS, missingDocumentsState);
    }

    return { missingRecord: updatedMissing, targetStatus };
  },

  // Bulk import for Social Insurance
  async importSocialInsurance(records: Partial<SocialInsuranceRecord>[], overwrite = false): Promise<number> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.post<{ importedCount: number }>('/insurance/social/import', {
          records,
          overwrite,
        });
        return res.importedCount || records.length;
      } catch (err) {
        console.warn('Backend unavailable for importSocialInsurance, falling back to mock data:', err);
      }
    }

    await new Promise(res => setTimeout(res, 80));
    const formatted: SocialInsuranceRecord[] = records.map((r, i) => {
      const salary = Number(r.insuranceSalary) || 4325.00;
      const worker = Number(r.workerShare) || Number((salary * 0.11).toFixed(2));
      const comp = Number(r.companyShare) || Number((salary * 0.1875).toFixed(2));
      return {
        id: `soc-imp-${Date.now()}-${i}`,
        serialNo: r.serialNo || i + 1,
        nationalId: String(r.nationalId || ''),
        employeeName: String(r.employeeName || 'Unknown'),
        department: String(r.department || 'HR'),
        insuranceNumber: String(r.insuranceNumber || ''),
        insuranceSalary: salary,
        workerShare: worker,
        companyShare: comp,
        totalContribution: Number((worker + comp).toFixed(2)),
        note: String(r.note || ''),
        employeeListStatus: r.employeeListStatus === 'not_found' ? 'not_found' : 'found',
        employeeCode: r.employeeCode,
      };
    });

    if (overwrite) {
      socialInsuranceState = formatted;
    } else {
      socialInsuranceState = [...formatted, ...socialInsuranceState];
    }
    persistItem(STORAGE_KEYS.SOCIAL_INSURANCE, socialInsuranceState);
    return formatted.length;
  },

  async deleteSocialInsurance(id: string): Promise<boolean> {
    if (apiClient.isBackendAvailable()) {
      try {
        await apiClient.delete(`/insurance/social/${id}`);
        socialInsuranceState = socialInsuranceState.filter(s => s.id !== id && s.nationalId !== id && s.employeeCode !== id);
        persistItem(STORAGE_KEYS.SOCIAL_INSURANCE, socialInsuranceState);
        return true;
      } catch (err) {
        console.error('Failed to delete social insurance record on backend:', err);
        throw err;
      }
    }
    await new Promise(res => setTimeout(res, 40));
    socialInsuranceState = socialInsuranceState.filter(s => s.id !== id && s.nationalId !== id && s.employeeCode !== id);
    persistItem(STORAGE_KEYS.SOCIAL_INSURANCE, socialInsuranceState);
    return true;
  },

  async bulkDeleteSocialInsurance(ids: string[]): Promise<number> {
    if (!ids || !ids.length) return 0;
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.post<any>('/insurance/social/bulk-delete', { ids });
        const count = res?.count ?? ids.length;
        socialInsuranceState = socialInsuranceState.filter(s => !ids.includes(s.id) && !ids.includes(s.nationalId) && (!s.employeeCode || !ids.includes(s.employeeCode)));
        persistItem(STORAGE_KEYS.SOCIAL_INSURANCE, socialInsuranceState);
        return count;
      } catch (err) {
        console.error('Failed to bulk delete social insurance records on backend:', err);
        throw err;
      }
    }
    await new Promise(res => setTimeout(res, 50));
    const initialCount = socialInsuranceState.length;
    socialInsuranceState = socialInsuranceState.filter(s => !ids.includes(s.id) && !ids.includes(s.nationalId) && (!s.employeeCode || !ids.includes(s.employeeCode)));
    persistItem(STORAGE_KEYS.SOCIAL_INSURANCE, socialInsuranceState);
    return initialCount - socialInsuranceState.length;
  },

  async deleteAllSocialInsurance(): Promise<number> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.delete<any>('/insurance/social/all');
        const count = res?.count ?? socialInsuranceState.length;
        socialInsuranceState = [];
        persistItem(STORAGE_KEYS.SOCIAL_INSURANCE, socialInsuranceState);
        return count;
      } catch (err) {
        console.error('Failed to deleteAllSocialInsurance on backend:', err);
        throw err;
      }
    }
    await new Promise(res => setTimeout(res, 60));
    const count = socialInsuranceState.length;
    socialInsuranceState = [];
    persistItem(STORAGE_KEYS.SOCIAL_INSURANCE, socialInsuranceState);
    return count;
  },

  // Bulk import for Missing Documents
  async importMissingDocuments(records: Partial<MissingDocumentRecord>[], overwrite = false): Promise<number> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.post<{ importedCount: number }>('/insurance/missing-documents/import', {
          records,
          overwrite,
        });
        if (overwrite) {
          missingDocumentsState = [];
          persistItem(STORAGE_KEYS.MISSING_DOCS, missingDocumentsState);
        }
        return res.importedCount || records.length;
      } catch (err) {
        console.warn('Backend unavailable for importMissingDocuments, falling back to mock data:', err);
      }
    }

    await new Promise(res => setTimeout(res, 80));
    const formatted: MissingDocumentRecord[] = records.map((r, i) => {
      const qual = r.qualificationCert === 'available' ? 'available' : 'missing';
      const birth = r.birthCert === 'available' ? 'available' : 'missing';
      const id = r.idCard === 'available' ? 'available' : 'missing';
      const cont = r.contract === 'available' ? 'available' : 'missing';
      let count = 0;
      if (qual === 'missing') count++;
      if (birth === 'missing') count++;
      if (id === 'missing') count++;
      if (cont === 'missing') count++;

      return {
        id: `doc-imp-${Date.now()}-${i}`,
        serialNo: r.serialNo || i + 1,
        department: String(r.department || 'HR'),
        employeeName: String(r.employeeName || 'Unknown'),
        nationalId: String(r.nationalId || ''),
        position: String(r.position || 'Employee'),
        startDate: String(r.startDate || ''),
        resignationDate: r.resignationDate,
        employeeCode: String(r.employeeCode || ''),
        insuranceStatus: r.insuranceStatus || 'not_insured',
        qualificationCert: qual,
        birthCert: birth,
        idCard: id,
        contract: cont,
        missingCount: count,
        notes: r.notes || (count === 0 ? 'All documents submitted' : `${count} document(s) pending`),
        status: count === 0 ? 'complete' : 'incomplete',
      };
    });

    if (overwrite) {
      missingDocumentsState = formatted;
    } else {
      missingDocumentsState = [...formatted, ...missingDocumentsState];
    }
    persistItem(STORAGE_KEYS.MISSING_DOCS, missingDocumentsState);
    return formatted.length;
  },

  async deleteMissingDocument(id: string): Promise<boolean> {
    if (apiClient.isBackendAvailable()) {
      try {
        await apiClient.delete(`/insurance/missing-documents/${id}`);
        missingDocumentsState = missingDocumentsState.filter(d => d.id !== id && d.employeeCode !== id && d.nationalId !== id);
        persistItem(STORAGE_KEYS.MISSING_DOCS, missingDocumentsState);
        return true;
      } catch (err) {
        console.error('Failed to delete missing document on backend:', err);
        throw err;
      }
    }
    await new Promise(res => setTimeout(res, 40));
    missingDocumentsState = missingDocumentsState.filter(d => d.id !== id && d.employeeCode !== id && d.nationalId !== id);
    persistItem(STORAGE_KEYS.MISSING_DOCS, missingDocumentsState);
    return true;
  },

  async bulkDeleteMissingDocuments(ids: string[]): Promise<number> {
    if (!ids || !ids.length) return 0;
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.post<any>('/insurance/missing-documents/bulk-delete', { ids });
        const count = res?.count ?? ids.length;
        missingDocumentsState = missingDocumentsState.filter(d => !ids.includes(d.id) && !ids.includes(d.employeeCode) && !ids.includes(d.nationalId));
        persistItem(STORAGE_KEYS.MISSING_DOCS, missingDocumentsState);
        return count;
      } catch (err) {
        console.error('Failed to bulk delete missing documents on backend:', err);
        throw err;
      }
    }
    await new Promise(res => setTimeout(res, 50));
    const initialCount = missingDocumentsState.length;
    missingDocumentsState = missingDocumentsState.filter(d => !ids.includes(d.id) && !ids.includes(d.employeeCode) && !ids.includes(d.nationalId));
    persistItem(STORAGE_KEYS.MISSING_DOCS, missingDocumentsState);
    return initialCount - missingDocumentsState.length;
  },

  async deleteAllMissingDocuments(): Promise<number> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.delete<any>('/insurance/missing-documents/all');
        const count = res?.count ?? missingDocumentsState.length;
        missingDocumentsState = [];
        persistItem(STORAGE_KEYS.MISSING_DOCS, missingDocumentsState);
        return count;
      } catch (err) {
        console.error('Failed to deleteAllMissingDocuments on backend:', err);
        throw err;
      }
    }
    await new Promise(res => setTimeout(res, 60));
    const count = missingDocumentsState.length;
    missingDocumentsState = [];
    persistItem(STORAGE_KEYS.MISSING_DOCS, missingDocumentsState);
    return count;
  },

  // Overall Statistics calculated dynamically from live database / local state
  async getInsuranceStats() {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>('/insurance/stats');
        if (res) {
          const insured = res.insuredCount ?? res.foundCount ?? 0;
          const notFound = res.notFoundCount ?? 0;
          const totalSalary = res.totalSalary ?? res.totalInsuranceWage ?? 0;
          const workerShare = res.totalWorkerShare ?? res.totalWorkerContributions ?? 0;
          const companyShare = res.totalCompanyShare ?? res.totalCompanyContributions ?? 0;
          const totalContributions = res.totalContributions ?? Number((workerShare + companyShare).toFixed(2));
          const totalEmployees = res.totalEmployees ?? (res.notInsuredCount !== undefined ? res.notInsuredCount + insured : 0);
          const notInsured = res.notInsuredCount ?? Math.max(0, totalEmployees - insured);
          const totalInsuredRows = res.totalInsuredRows ?? res.totalRecords ?? 0;
          return {
            ...res,
            insuredCount: insured,
            notInsuredCount: notInsured,
            notFoundCount: notFound,
            totalInsuredRows,
            totalSalary,
            totalWorkerShare: workerShare,
            totalCompanyShare: companyShare,
            totalContributions,
            totalEmployees,
            incompleteDocsCount: res.incompleteDocsCount ?? 0,
            completeDocsCount: res.completeDocsCount ?? 0,
            totalMissingDocs: res.totalMissingDocs ?? 0,
            completenessRate: res.completenessRate ?? (totalEmployees > 0 ? Math.round((insured / totalEmployees) * 100) : 0),
          };
        }
      } catch (err) {
        console.warn('Backend unavailable for getInsuranceStats, calculating from local state:', err);
      }
    }

    await new Promise(res => setTimeout(res, 30));
    const totalRecords = socialInsuranceState.length;
    const foundInEmployeeList = socialInsuranceState.filter(s => s.employeeListStatus === 'found').length;
    const notFoundInEmployeeList = socialInsuranceState.filter(s => s.employeeListStatus === 'not_found').length;

    const totalSalary = socialInsuranceState.reduce((acc, curr) => acc + (curr.insuranceSalary || 0), 0);
    const totalWorkerShare = socialInsuranceState.reduce((acc, curr) => acc + (curr.workerShare || 0), 0);
    const totalCompanyShare = socialInsuranceState.reduce((acc, curr) => acc + (curr.companyShare || 0), 0);
    const totalContributions = Number((totalWorkerShare + totalCompanyShare).toFixed(2));

    const totalMissingDocs = missingDocumentsState.length;
    const incompleteDocsCount = missingDocumentsState.filter(d => d.status === 'incomplete').length;
    const completeDocsCount = missingDocumentsState.filter(d => d.status === 'complete').length;

    // Missing counts by type
    const missingQualCount = missingDocumentsState.filter(d => d.qualificationCert === 'missing').length;
    const missingBirthCount = missingDocumentsState.filter(d => d.birthCert === 'missing').length;
    const missingIdCount = missingDocumentsState.filter(d => d.idCard === 'missing').length;
    const missingContractCount = missingDocumentsState.filter(d => d.contract === 'missing').length;

    return {
      insuredCount: foundInEmployeeList,
      notInsuredCount: Math.max(0, totalMissingDocs - foundInEmployeeList),
      notFoundCount: notFoundInEmployeeList,
      totalInsuredRows: totalRecords,
      totalSalary,
      totalWorkerShare,
      totalCompanyShare,
      totalContributions,
      totalMissingDocs,
      incompleteDocsCount,
      completeDocsCount,
      missingQualCount,
      missingBirthCount,
      missingIdCount,
      missingContractCount,
      completenessRate: totalRecords > 0 ? Math.round((foundInEmployeeList / totalRecords) * 100) : 0,
    };
  },
};
