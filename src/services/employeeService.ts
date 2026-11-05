import { Employee } from '../types';
import { apiClient } from './apiClient';

const STORAGE_KEY = 'hr_employees_clean_v1';
const ARABIC_OVERRIDES_KEY = 'hr_employee_arabic_names_v1';

// Auto-purge any legacy mock employee state from browser
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const legacyKeys = ['hr_employees_mock_state_v2', 'hr_employees_mock_state_v1', 'hr_employees_mock_state'];
    legacyKeys.forEach(k => localStorage.removeItem(k));
  }
} catch {
  // Ignore in SSR
}

function loadArabicOverrides(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ARABIC_OVERRIDES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    // Auto-clean any hallucinated Sarah assignment for Khaled Ashraf
    let needsSave = false;
    for (const key of Object.keys(parsed)) {
      if ((key.includes('160301002') || key.includes('180301002') || key.includes('002')) && parsed[key]?.includes('سارة')) {
        parsed[key] = 'خالد أشرف محمد محمد عباس';
        needsSave = true;
      }
    }
    if (needsSave) {
      persistArabicOverrides(parsed);
    }
    return parsed;
  } catch {
    return {};
  }
}

function persistArabicOverrides(overrides: Record<string, string>) {
  try {
    localStorage.setItem(ARABIC_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.error('Error saving arabic overrides to localStorage', e);
  }
}

function applyArabicOverrides(employees: Employee[]): Employee[] {
  if (!Array.isArray(employees)) return [];
  const overrides = loadArabicOverrides();
  return employees.map(emp => {
    if (!emp) return emp;
    const fullEn = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
    
    // Immediate anti-hallucination guard for Khaled Ashraf
    if (fullEn.toLowerCase().includes('khaled ashraf')) {
      if (!emp.arabicName || emp.arabicName.includes('سارة') || overrides[emp.id]?.includes('سارة') || (emp.employeeId && overrides[emp.employeeId]?.includes('سارة'))) {
        return { ...emp, arabicName: 'خالد أشرف محمد محمد عباس' };
      }
    }

    const arOverride = overrides[emp.id] || (emp.employeeId ? overrides[emp.employeeId] : undefined);
    if (arOverride && arOverride.trim()) {
      return { ...emp, arabicName: arOverride.trim() };
    }
    return emp;
  });
}

function loadEmployeesState(): Employee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading employees from localStorage', e);
  }
  return [];
}

function persistEmployees(state: Employee[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving employees to localStorage', e);
  }
}

let employeesState: Employee[] = loadEmployeesState();

// Purge any corrupted fake employees generated from Excel department summary tables (e.g. "Employee 110", ID "2451.4")
const cleanEmployeesList = (list: Employee[]): Employee[] => {
  if (!Array.isArray(list)) return [];
  return list.filter(e => {
    if (!e) return false;
    const name = String(e.name || `${e.firstName} ${e.lastName}` || '').trim();
    const natId = String(e.nationalId || '').trim();
    if (/^Employee\s+\d+$/i.test(name) && (natId.includes('.') || natId.replace(/\D/g, '').length < 10)) {
      return false;
    }
    if (/^(total|grand\s*total|subtotal|إجمالي|المجموع)$/i.test(name)) {
      return false;
    }
    return true;
  });
};

const initialEmpLen = Array.isArray(employeesState) ? employeesState.length : 0;
employeesState = cleanEmployeesList(employeesState);
if (employeesState.length !== initialEmpLen) {
  persistEmployees(employeesState);
}

export interface EmployeeFilterParams {
  search?: string;
  departmentId?: string;
  positionId?: string;
  employmentStatus?: string;
  contractStatus?: string;
  managerId?: string;
  documentStatus?: string; // 'complete' | 'incomplete'
  insuranceStatus?: 'insured' | 'not_insured' | 'all';
  page?: number;
  pageSize?: number;
  sortBy?: keyof Employee;
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const employeeService = {
  async getEmployees(params: EmployeeFilterParams = {}): Promise<PaginatedResult<Employee>> {
    if (apiClient.isBackendAvailable()) {
      try {
        const response = await apiClient.get<any>('/employees', { params });
        if (Array.isArray(response)) {
          const processed = applyArabicOverrides(response);
          if (employeesState.length === 0 && processed.length > 0) {
            employeesState = [...processed];
            persistEmployees(employeesState);
          }
          return {
            data: processed,
            total: processed.length,
            page: params.page || 1,
            pageSize: params.pageSize || processed.length || 10,
            totalPages: Math.ceil((processed.length || 1) / (params.pageSize || 10)),
          };
        }
        if (response && Array.isArray(response.data)) {
          let allData = [...response.data];
          const total = response.total ?? allData.length;
          const totalPages = response.totalPages ?? Math.ceil(total / (response.pageSize || 100));

          // If caller asked for full list (e.g. pageSize > 100 or no specific page) and backend capped to 100 per page:
          if ((!params.page || (params.pageSize && params.pageSize > 100)) && totalPages > 1 && allData.length < total) {
            const pagePromises = [];
            for (let p = 2; p <= totalPages; p++) {
              pagePromises.push(
                apiClient.get<any>('/employees', {
                  params: { ...params, page: p, pageSize: 100 },
                }).then(res => res?.data || (Array.isArray(res) ? res : []))
              );
            }
            const remainingPages = await Promise.all(pagePromises);
            for (const pageItems of remainingPages) {
              if (Array.isArray(pageItems)) {
                allData.push(...pageItems);
              }
            }
          }

          allData = applyArabicOverrides(allData);

          // Keep employeesState in sync so local operations find records
          if (allData.length > 0 && (employeesState.length === 0 || employeesState.length < allData.length)) {
            employeesState = [...allData];
            persistEmployees(employeesState);
          }

          return {
            data: allData,
            total: total,
            page: response.page ?? params.page ?? 1,
            pageSize: allData.length,
            totalPages: Math.ceil(total / allData.length),
          };
        }
        if (response && response.data !== undefined) {
          if (Array.isArray(response.data)) {
            response.data = applyArabicOverrides(response.data);
          }
          return response;
        }
      } catch (err) {
        console.warn('Backend unavailable for getEmployees, using local cache:', err);
      }
    }

    // Simulate lightweight API latency
    await new Promise(res => setTimeout(res, 60));

    let filtered = applyArabicOverrides([...employeesState]);

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        e =>
          e.firstName.toLowerCase().includes(q) ||
          e.lastName.toLowerCase().includes(q) ||
          e.employeeId.toLowerCase().includes(q) ||
          e.nationalId.includes(q) ||
          e.email.toLowerCase().includes(q) ||
          (e.arabicName && e.arabicName.includes(q)) ||
          (e.chineseName && e.chineseName.includes(q)) ||
          (e.chinesePosition && e.chinesePosition.toLowerCase().includes(q))
      );
    }

    if (params.departmentId && params.departmentId !== 'all') {
      filtered = filtered.filter(e => e.departmentId === params.departmentId || e.departmentName === params.departmentId);
    }

    if (params.employmentStatus && params.employmentStatus !== 'all') {
      filtered = filtered.filter(e => e.employmentStatus === params.employmentStatus);
    }

    if (params.contractStatus && params.contractStatus !== 'all') {
      filtered = filtered.filter(e => e.contractStatus === params.contractStatus);
    }

    if (params.insuranceStatus && params.insuranceStatus !== 'all') {
      filtered = filtered.filter(e => e.insuranceStatus === params.insuranceStatus);
    }

    if (params.documentStatus && params.documentStatus !== 'all') {
      if (params.documentStatus === 'complete') {
        filtered = filtered.filter(e => e.documentCompletenessPercentage === 100);
      } else if (params.documentStatus === 'incomplete') {
        filtered = filtered.filter(e => e.documentCompletenessPercentage < 100);
      }
    }

    if (params.sortBy) {
      filtered.sort((a, b) => {
        const valA = a[params.sortBy!];
        const valB = b[params.sortBy!];
        if (valA === undefined || valB === undefined) return 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
          return params.sortDirection === 'desc'
            ? valB.localeCompare(valA)
            : valA.localeCompare(valB);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return params.sortDirection === 'desc' ? valB - valA : valA - valB;
        }
        return 0;
      });
    }

    const total = filtered.length;
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };
  },

  async getEmployeeById(id: string): Promise<Employee | null> {
    if (apiClient.isBackendAvailable()) {
      try {
        const emp = await apiClient.get<Employee>(`/employees/${id}`);
        if (emp) {
          const overrides = loadArabicOverrides();
          const ar = overrides[emp.id] || (emp.employeeId ? overrides[emp.employeeId] : undefined);
          if (ar && (!emp.arabicName || emp.arabicName.trim() === '' || emp.arabicName.trim().toLowerCase() === `${emp.firstName || ''} ${emp.lastName || ''}`.trim().toLowerCase())) {
            return { ...emp, arabicName: ar };
          }
          return emp;
        }
      } catch (err) {
        console.warn('Backend unavailable for getEmployeeById, falling back to mock data:', err);
      }
    }

    await new Promise(res => setTimeout(res, 50));
    const found = employeesState.find(e => e.id === id || e.employeeId === id) || null;
    if (found) {
      const overrides = loadArabicOverrides();
      const ar = overrides[found.id] || (found.employeeId ? overrides[found.employeeId] : undefined);
      if (ar && (!found.arabicName || found.arabicName.trim() === '' || found.arabicName.trim().toLowerCase() === `${found.firstName || ''} ${found.lastName || ''}`.trim().toLowerCase())) {
        return { ...found, arabicName: ar };
      }
    }
    return found;
  },

  async createEmployee(data: Partial<Employee>): Promise<Employee> {
    if (apiClient.isBackendAvailable()) {
      try {
        const response = await apiClient.post<any>('/employees', data);
        const created = response?.data || response;
        if (created && created.id) {
          employeesState.unshift(created);
          persistEmployees(employeesState);
        }
        return created;
      } catch (err: any) {
        console.error('Backend createEmployee failed:', err);
        const errorMsg =
          err?.response?.data?.message ||
          (err?.response?.data?.errors && err.response.data.errors.map((e: any) => `${e.path?.join('.')}: ${e.message}`).join(', ')) ||
          err?.message ||
          'فشل في حفظ بيانات الموظف في قاعدة البيانات';
        throw new Error(errorMsg);
      }
    }

    await new Promise(res => setTimeout(res, 100));
    const newId = `emp-${String(employeesState.length + 1).padStart(4, '0')}`;
    const newEmployeeId = data.employeeId || `160301${String(employeesState.length + 1).padStart(3, '0')}`;

    const newEmp: Employee = {
      id: newId,
      employeeId: newEmployeeId,
      firstName: data.firstName || 'New',
      lastName: data.lastName || 'Employee',
      arabicName: data.arabicName,
      chineseName: data.chineseName,
      email: data.email || `emp${employeesState.length + 1}@enterprise.com`,
      phone: data.phone || '+20 10 0000 0000',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.firstName}-${data.lastName}`,
      nationalId: data.nationalId || '29000000000000',
      dateOfBirth: data.dateOfBirth || '1995-01-01',
      gender: data.gender || 'male',
      nationality: data.nationality || 'Egyptian',
      address: data.address || 'Cairo, Egypt',
      emergencyContact: data.emergencyContact || {
        name: 'Emergency Contact',
        relationship: 'Family',
        phone: '+20 11 0000 0000',
      },
      departmentId: data.departmentId || 'dept-1',
      departmentName: data.departmentName || 'HR',
      positionId: data.positionId || 'pos-04',
      positionTitle: data.positionTitle || 'Staff',
      chinesePosition: data.chinesePosition,
      managerId: data.managerId,
      managerName: data.managerName,
      employmentStatus: data.employmentStatus || 'probation',
      employmentType: data.employmentType || 'full_time',
      hireDate: data.hireDate || new Date().toISOString().split('T')[0],
      probationEndDate: data.probationEndDate || '2026-06-30',
      workLocation: data.workLocation || 'Main Facility',
      basicSalary: data.basicSalary || 0,
      housingAllowance: data.housingAllowance || 500,
      transportAllowance: data.transportAllowance || 300,
      contractStatus: 'active',
      documentCompletenessPercentage: 100,
      missingDocumentsCount: 0,
      insuranceStatus: data.insuranceStatus || 'not_insured',
      insuranceNumber: data.insuranceNumber,
      insuranceSalary: data.insuranceSalary,
      workerShare: data.workerShare,
      companyShare: data.companyShare,
    };

    employeesState.unshift(newEmp);
    persistEmployees(employeesState);
    return newEmp;
  },

  async bulkUpdateArabicNames(updates: Array<{ id: string; arabicName: string }>): Promise<number> {
    if (!updates || updates.length === 0) return 0;

    // 1. Persist to Arabic overrides registry in localStorage
    const overrides = loadArabicOverrides();
    const updateMap = new Map<string, string>();
    for (const item of updates) {
      if (item.id && item.arabicName?.trim()) {
        const cleanName = item.arabicName.trim();
        overrides[item.id] = cleanName;
        updateMap.set(item.id, cleanName);
      }
    }
    persistArabicOverrides(overrides);

    // 2. Synchronize in-memory employeesState & localStorage
    let localUpdatedCount = 0;
    employeesState = employeesState.map(emp => {
      const newAr = updateMap.get(emp.id) || (emp.employeeId ? updateMap.get(emp.employeeId) : undefined);
      if (newAr) {
        localUpdatedCount++;
        return { ...emp, arabicName: newAr };
      }
      return emp;
    });
    if (localUpdatedCount > 0) {
      persistEmployees(employeesState);
    }

    // 3. Persist to Backend if available
    if (apiClient.isBackendAvailable()) {
      try {
        // Try dedicated bulk endpoint first (single network roundtrip)
        await apiClient.post('/employees/bulk-arabic-names', { updates });
      } catch (bulkErr) {
        console.warn('Dedicated /employees/bulk-arabic-names endpoint unavailable, falling back to batch PUTs:', bulkErr);
        // Fallback to batched individual PUT requests (chunks of 15)
        const chunkSize = 15;
        for (let i = 0; i < updates.length; i += chunkSize) {
          const chunk = updates.slice(i, i + chunkSize);
          await Promise.allSettled(
            chunk.map(item =>
              apiClient.put(`/employees/${item.id}`, { arabicName: item.arabicName.trim() }).catch(err => {
                console.warn(`Failed to update employee ${item.id} on backend`, err);
              })
            )
          );
        }
      }
    }

    return updates.length;
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    // 1. Update Persistent Overrides for both id and employeeId
    if (updates.arabicName?.trim()) {
      const overrides = loadArabicOverrides();
      const cleanAr = updates.arabicName.trim();
      overrides[id] = cleanAr;
      if (updates.employeeId) {
        overrides[updates.employeeId] = cleanAr;
      }
      persistArabicOverrides(overrides);
    }

    // 2. Synchronize in-memory and local storage state
    let localUpdated: Employee | null = null;
    const index = employeesState.findIndex(e => e.id === id || e.employeeId === id);
    if (index !== -1) {
      if (updates.arabicName?.trim()) {
        const empNum = employeesState[index].employeeId;
        if (empNum) {
          const overrides = loadArabicOverrides();
          overrides[empNum] = updates.arabicName.trim();
          persistArabicOverrides(overrides);
        }
      }
      employeesState[index] = { ...employeesState[index], ...updates };
      persistEmployees(employeesState);
      localUpdated = employeesState[index];
    } else {
      localUpdated = { id, ...updates } as Employee;
      employeesState.unshift(localUpdated);
      persistEmployees(employeesState);
    }

    // 3. Persist to Backend if available (graceful fallback to local cache if server is offline)
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.put<any>(`/employees/${id}`, updates);
        const updated = res?.data || res;
        if (updated && typeof updated === 'object') {
          return { ...localUpdated, ...updated };
        }
      } catch (err: any) {
        console.warn('Backend updateEmployee unavailable or rejected, saved successfully in local store & overrides:', err?.message || err);
      }
    }

    return localUpdated;
  },

  async deactivateEmployee(id: string): Promise<boolean> {
    if (apiClient.isBackendAvailable()) {
      try {
        await apiClient.put(`/employees/${id}/deactivate`, {});
        const index = employeesState.findIndex(e => e.id === id || e.employeeId === id);
        if (index !== -1) {
          employeesState[index].employmentStatus = 'terminated';
          employeesState[index].contractStatus = 'expired';
          persistEmployees(employeesState);
        }
        return true;
      } catch (err) {
        console.warn('Backend unavailable for deactivateEmployee, falling back to mock data:', err);
      }
    }

    await new Promise(res => setTimeout(res, 80));
    const index = employeesState.findIndex(e => e.id === id || e.employeeId === id);
    if (index === -1) return false;
    employeesState[index].employmentStatus = 'terminated';
    employeesState[index].contractStatus = 'expired';
    persistEmployees(employeesState);
    return true;
  },

  async deleteEmployee(id: string): Promise<boolean> {
    if (apiClient.isBackendAvailable()) {
      try {
        await apiClient.delete(`/employees/${id}`);
        employeesState = employeesState.filter(e => e.id !== id && e.employeeId !== id);
        persistEmployees(employeesState);
        return true;
      } catch (err) {
        console.error('Failed to delete employee on backend:', err);
        throw err;
      }
    }

    await new Promise(res => setTimeout(res, 80));
    employeesState = employeesState.filter(e => e.id !== id && e.employeeId !== id);
    persistEmployees(employeesState);
    return true;
  },

  async bulkDeleteEmployees(ids: string[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.post<any>('/employees/bulk-delete', { ids });
        const count = res?.count ?? ids.length;
        employeesState = employeesState.filter(e => !ids.includes(e.id) && !ids.includes(e.employeeId));
        persistEmployees(employeesState);
        return count;
      } catch (err) {
        console.error('Failed to bulk delete employees on backend:', err);
        throw err;
      }
    }

    await new Promise(res => setTimeout(res, 100));
    const initialCount = employeesState.length;
    employeesState = employeesState.filter(e => !ids.includes(e.id) && !ids.includes(e.employeeId));
    persistEmployees(employeesState);
    return initialCount - employeesState.length;
  },

  async deleteAllEmployees(): Promise<number> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.delete<any>('/employees/all');
        const count = res?.count ?? employeesState.length;
        employeesState = [];
        persistEmployees(employeesState);
        return count;
      } catch (err) {
        console.error('Failed to deleteAllEmployees on backend:', err);
        throw err;
      }
    }

    await new Promise(res => setTimeout(res, 120));
    const count = employeesState.length;
    employeesState = [];
    persistEmployees(employeesState);
    return count;
  },

  async importEmployees(newRecords: Partial<Employee>[], overwrite = false): Promise<number> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.post<{ importedCount: number }>('/employees/import', {
          records: newRecords,
          overwrite,
        });
        if (overwrite) {
          employeesState = [];
          persistEmployees(employeesState);
        }
        return res.importedCount || newRecords.length;
      } catch (err) {
        console.warn('Backend unavailable for importEmployees, falling back to mock data:', err);
      }
    }

    await new Promise(res => setTimeout(res, 80));
    const formatted: Employee[] = cleanEmployeesList(
      newRecords.map((r, i) => {
      const isInsured = r.insuranceStatus === 'insured';
      return {
        id: r.id || `emp-imp-${Date.now()}-${i}`,
        employeeId: r.employeeId || `180301${String(employeesState.length + i + 1).padStart(3, '0')}`,
        firstName: r.firstName || 'Employee',
        lastName: r.lastName || `${i + 1}`,
        arabicName: r.arabicName,
        chineseName: r.chineseName,
        email: r.email || `emp${Date.now()}${i}@company.com`,
        phone: r.phone || '+20 10 0000 0000',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.firstName || 'user'}-${r.lastName || i}`,
        nationalId: r.nationalId || `2900000000000${i}`,
        dateOfBirth: r.dateOfBirth || '1990-01-01',
        gender: r.gender || 'male',
        nationality: r.nationality || 'Egyptian',
        address: r.address || 'Cairo, Egypt',
        emergencyContact: r.emergencyContact || {
          name: 'Emergency Contact',
          relationship: 'Family',
          phone: '+20 10 0000 0000',
        },
        departmentId: r.departmentId || 'dept-1',
        departmentName: r.departmentName || 'HR',
        positionId: r.positionId || 'pos-1',
        positionTitle: r.positionTitle || 'Specialist',
        chinesePosition: r.chinesePosition,
        employmentStatus: r.employmentStatus || 'active',
        employmentType: r.employmentType || 'full_time',
        hireDate: r.hireDate || new Date().toISOString().split('T')[0],
        probationEndDate: r.probationEndDate || '2026-06-30',
        resignationDate: r.resignationDate,
        workLocation: r.workLocation || 'Company Facility',
        basicSalary: r.basicSalary || 0,
        housingAllowance: r.housingAllowance || 500,
        transportAllowance: r.transportAllowance || 300,
        contractStatus: r.contractStatus || 'active',
        documentCompletenessPercentage: r.documentCompletenessPercentage ?? (isInsured ? 100 : 0),
        missingDocumentsCount: r.missingDocumentsCount ?? (isInsured ? 0 : 4),
        insuranceStatus: r.insuranceStatus || (isInsured ? 'insured' : 'not_insured'),
        insuranceNumber: r.insuranceNumber,
        insuranceSalary: r.insuranceSalary,
        workerShare: r.workerShare,
        companyShare: r.companyShare,
        qualificationCertificateStatus: r.qualificationCertificateStatus || (isInsured ? 'available' : 'missing'),
        birthCertificateStatus: r.birthCertificateStatus || (isInsured ? 'available' : 'missing'),
        idCardStatus: r.idCardStatus || (isInsured ? 'available' : 'missing'),
        contractDocStatus: r.contractDocStatus || (isInsured ? 'available' : 'missing'),
        documentChecklistStatus: r.documentChecklistStatus || (isInsured ? 'complete' : 'incomplete'),
      };
    })
  );

    if (overwrite) {
      employeesState = formatted;
    } else {
      employeesState = [...formatted, ...employeesState];
    }
    persistEmployees(employeesState);
    return formatted.length;
  },

  async getEmployeeStats() {
    if (apiClient.isBackendAvailable()) {
      try {
        return await apiClient.get<any>('/employees/stats');
      } catch (err) {
        console.warn('Backend unavailable for getEmployeeStats, falling back to mock data:', err);
      }
    }

    await new Promise(res => setTimeout(res, 20));
    const total = employeesState.length;
    const insured = employeesState.filter(e => e.insuranceStatus === 'insured').length;
    const notInsured = employeesState.filter(e => e.insuranceStatus === 'not_insured').length;
    const active = employeesState.filter(e => e.employmentStatus === 'active').length;
    return {
      total,
      insured,
      notInsured,
      active,
    };
  },
};
