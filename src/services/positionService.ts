import { Position } from '../types';
import { apiClient } from './apiClient';

let posState: Position[] = [];

export interface PositionFilterParams {
  departmentId?: string;
  search?: string;
}

export const positionService = {
  async getPositions(params: PositionFilterParams = {}): Promise<Position[]> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>('/positions', {
          params: {
            departmentId: params.departmentId && params.departmentId !== 'all' ? params.departmentId : undefined,
            search: params.search,
          },
        });
        const list: Position[] = Array.isArray(res) ? res : res?.data || [];
        posState = list;
        return list;
      } catch (err) {
        console.warn('Backend unavailable for getPositions:', err);
      }
    }
    await new Promise(res => setTimeout(res, 40));
    let filtered = [...posState];
    if (params.departmentId && params.departmentId !== 'all') {
      filtered = filtered.filter(p => p.departmentId === params.departmentId);
    }
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.titleAr.includes(q) ||
          p.code.toLowerCase().includes(q)
      );
    }
    return filtered;
  },

  async getPositionById(id: string): Promise<Position | null> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>(`/positions/${id}`);
        return res?.data || res || null;
      } catch (err) {
        console.warn(`Backend unavailable for getPositionById(${id}):`, err);
      }
    }
    await new Promise(res => setTimeout(res, 40));
    return posState.find(p => p.id === id) || null;
  },

  async createPosition(data: Partial<Position>): Promise<Position> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.post<any>('/positions', data);
        const created = res?.data || res;
        posState.push(created);
        return created;
      } catch (err) {
        console.warn('Backend unavailable for createPosition:', err);
      }
    }
    await new Promise(res => setTimeout(res, 40));
    const newPos: Position = {
      id: `pos-${Date.now()}`,
      code: data.code || `POS-${String(posState.length + 1).padStart(2, '0')}`,
      title: data.title || 'New Position',
      titleAr: data.titleAr || data.title || 'مسمى جديد',
      titleZh: data.titleZh || data.title || '新职位',
      departmentId: data.departmentId || 'dept-1',
      departmentName: data.departmentName || 'General',
      minSalary: data.minSalary || 3500,
      maxSalary: data.maxSalary || 7000,
      level: data.level || 'Mid',
    };
    posState.push(newPos);
    return newPos;
  },

  async updatePosition(id: string, data: Partial<Position>): Promise<Position> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.put<any>(`/positions/${id}`, data);
        const updated = res?.data || res;
        const idx = posState.findIndex(p => p.id === id);
        if (idx !== -1) posState[idx] = { ...posState[idx], ...updated };
        return updated;
      } catch (err) {
        console.warn(`Backend unavailable for updatePosition(${id}):`, err);
      }
    }
    await new Promise(res => setTimeout(res, 40));
    const idx = posState.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Position not found');
    posState[idx] = { ...posState[idx], ...data };
    return posState[idx];
  },

  async deletePosition(id: string): Promise<boolean> {
    if (apiClient.isBackendAvailable()) {
      try {
        await apiClient.delete(`/positions/${id}`);
        posState = posState.filter(p => p.id !== id);
        return true;
      } catch (err) {
        console.warn(`Backend unavailable for deletePosition(${id}):`, err);
      }
    }
    await new Promise(res => setTimeout(res, 40));
    posState = posState.filter(p => p.id !== id);
    return true;
  },
};
