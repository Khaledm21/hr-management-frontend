import { Department, Position } from '../types';
import { apiClient } from './apiClient';

let deptState: Department[] = [];
let posState: Position[] = [];

export const departmentService = {
  async getDepartments(): Promise<Department[]> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>('/departments');
        const list: Department[] = Array.isArray(res) ? res : res?.data || [];
        deptState = list;
        return list;
      } catch (err) {
        console.warn('Backend unavailable for getDepartments:', err);
      }
    }
    await new Promise(res => setTimeout(res, 40));
    return [...deptState];
  },

  async getDepartmentById(id: string): Promise<Department | null> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>(`/departments/${id}`);
        return res?.data || res || null;
      } catch (err) {
        console.warn(`Backend unavailable for getDepartmentById(${id}):`, err);
      }
    }
    await new Promise(res => setTimeout(res, 40));
    return deptState.find(d => d.id === id) || null;
  },

  async getPositions(departmentId?: string): Promise<Position[]> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>('/positions', {
          params: departmentId && departmentId !== 'all' ? { departmentId } : undefined,
        });
        const list: Position[] = Array.isArray(res) ? res : res?.data || [];
        posState = list;
        return list;
      } catch (err) {
        console.warn('Backend unavailable for getPositions:', err);
      }
    }
    await new Promise(res => setTimeout(res, 40));
    if (departmentId && departmentId !== 'all') {
      return posState.filter(p => p.departmentId === departmentId);
    }
    return [...posState];
  },

  async createDepartment(data: Partial<Department>): Promise<Department> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.post<any>('/departments', data);
        const created = res?.data || res;
        deptState.push(created);
        return created;
      } catch (err) {
        console.warn('Backend unavailable for createDepartment:', err);
      }
    }
    await new Promise(res => setTimeout(res, 40));
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      code: data.code || 'DEPT',
      name: data.name || 'New Department',
      nameAr: data.nameAr || data.name || 'قسم جديد',
      nameZh: data.nameZh || data.name || '新部门',
      employeeCount: data.employeeCount || 0,
      location: data.location || 'Headquarters',
      budget: data.budget || 0,
      managerName: data.managerName,
      managerId: data.managerId,
    };
    deptState.push(newDept);
    return newDept;
  },

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.put<any>(`/departments/${id}`, data);
        const updated = res?.data || res;
        const idx = deptState.findIndex(d => d.id === id);
        if (idx !== -1) deptState[idx] = { ...deptState[idx], ...updated };
        return updated;
      } catch (err) {
        console.warn(`Backend unavailable for updateDepartment(${id}):`, err);
      }
    }
    await new Promise(res => setTimeout(res, 40));
    const idx = deptState.findIndex(d => d.id === id);
    if (idx === -1) throw new Error('Department not found');
    deptState[idx] = { ...deptState[idx], ...data };
    return deptState[idx];
  },

  async deleteDepartment(id: string): Promise<boolean> {
    if (apiClient.isBackendAvailable()) {
      try {
        await apiClient.delete(`/departments/${id}`);
        deptState = deptState.filter(d => d.id !== id);
        return true;
      } catch (err) {
        console.warn(`Backend unavailable for deleteDepartment(${id}):`, err);
      }
    }
    await new Promise(res => setTimeout(res, 40));
    deptState = deptState.filter(d => d.id !== id);
    return true;
  },
};
