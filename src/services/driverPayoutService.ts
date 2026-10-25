import XLSX from 'xlsx-js-style';
import {
  Driver,
  DriverPayoutTransaction,
  WeeklyPayoutSummary,
  DriverWeeklyColumn,
  DriverCategory,
} from '../types/driverPayouts';
import { apiClient } from './apiClient';

const STORAGE_KEYS = {
  DRIVERS: 'hr_drivers_clean_v1',
  TRANSACTIONS: 'hr_driver_transactions_clean_v1',
  SUMMARIES: 'hr_driver_summaries_clean_v1',
};

// Immediate purge of any legacy mock data from browser storage so system starts 100% clean
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const keysToPurge = [
      'hr_drivers_data_v1',
      'hr_driver_transactions_v1',
      'hr_driver_summaries_v1',
      'hr_drivers_data_v2',
      'hr_driver_transactions_v2',
      'hr_driver_summaries_v2',
      'hr_drivers_data',
      'hr_driver_transactions',
      'hr_driver_summaries',
    ];
    keysToPurge.forEach(k => localStorage.removeItem(k));
  }
} catch {
  // Ignore in SSR
}

// Official approved model data matching the user's weekly sheet exactly
export const OFFICIAL_TEMPLATE_DATA = {
  weekPeriod: '2026-10-18',
  weekLabel: 'Sunday, October 18, 2026',
  drivers: [
    { name: 'بهاء سمير', vehicleType: 'ميكروباص', defaultCategory: 'production' as DriverCategory },
    { name: 'السيد عبدالرازق', vehicleType: 'ميكروباص', defaultCategory: 'production' as DriverCategory },
    { name: 'ناصر ماهر', vehicleType: 'ميكروباص', defaultCategory: 'production' as DriverCategory },
    { name: 'السيد محمد', vehicleType: 'ميكروباص', defaultCategory: 'production' as DriverCategory },
    { name: 'علي محمد', vehicleType: 'ميكروباص', defaultCategory: 'production' as DriverCategory },
    { name: 'السعيد عوض', vehicleType: 'ميكروباص', defaultCategory: 'production' as DriverCategory },
    { name: 'رمزي إبراهيم', vehicleType: 'ميكروباص', defaultCategory: 'production' as DriverCategory },
    { name: 'خيري محمد', vehicleType: 'ميكروباص', defaultCategory: 'production' as DriverCategory },
    { name: 'عمرو إبراهيم', vehicleType: 'ميكروباص', defaultCategory: 'production' as DriverCategory },
    { name: 'أحمد شوقي', vehicleType: 'ميكروباص', defaultCategory: 'production' as DriverCategory },
    { name: 'أحمد جمعه', vehicleType: 'ميكروباص', defaultCategory: 'production' as DriverCategory },
    { name: 'علاء بازيد', vehicleType: 'ميكروباص', defaultCategory: 'management' as DriverCategory },
    { name: 'أبو عمر', vehicleType: 'ميكروباص', defaultCategory: 'management' as DriverCategory },
    { name: 'أحمد فريد', vehicleType: 'ميكروباص', defaultCategory: 'management' as DriverCategory },
  ],
  transactions: [
    // بهاء سمير (Col H) - Total 9,170 (2 operations)
    { driverName: 'بهاء سمير', amount: 4585, category: 'production' as DriverCategory },
    { driverName: 'بهاء سمير', amount: 4585, category: 'production' as DriverCategory },

    // السيد عبدالرازق (Col I) - Total 9,170 (2 operations)
    { driverName: 'السيد عبدالرازق', amount: 4585, category: 'production' as DriverCategory },
    { driverName: 'السيد عبدالرازق', amount: 4585, category: 'production' as DriverCategory },

    // ناصر ماهر (Col J) - Total 9,170 (2 operations)
    { driverName: 'ناصر ماهر', amount: 4585, category: 'production' as DriverCategory },
    { driverName: 'ناصر ماهر', amount: 4585, category: 'production' as DriverCategory },

    // السيد محمد (Col K) - Total 7,860 (2 operations)
    { driverName: 'السيد محمد', amount: 3930, category: 'production' as DriverCategory },
    { driverName: 'السيد محمد', amount: 3930, category: 'production' as DriverCategory },

    // علي محمد (Col L) - Total 10,170 (3 operations)
    { driverName: 'علي محمد', amount: 1060, category: 'production' as DriverCategory },
    { driverName: 'علي محمد', amount: 4525, category: 'production' as DriverCategory },
    { driverName: 'علي محمد', amount: 4585, category: 'production' as DriverCategory },

    // السعيد عوض (Col M) - Total 9,420 (2 operations)
    { driverName: 'السعيد عوض', amount: 4835, category: 'production' as DriverCategory },
    { driverName: 'السعيد عوض', amount: 4585, category: 'production' as DriverCategory },

    // رمزي إبراهيم (Col N) - Total 8,610 (2 operations)
    { driverName: 'رمزي إبراهيم', amount: 4305, category: 'production' as DriverCategory },
    { driverName: 'رمزي إبراهيم', amount: 4305, category: 'production' as DriverCategory },

    // خيري محمد (Col O) - Total 10,150 (3 operations)
    { driverName: 'خيري محمد', amount: 1700, category: 'production' as DriverCategory },
    { driverName: 'خيري محمد', amount: 4250, category: 'production' as DriverCategory },
    { driverName: 'خيري محمد', amount: 4200, category: 'production' as DriverCategory },

    // عمرو إبراهيم (Col P) - Total 9,015 (4 operations: 3,240 management + 5,775 production)
    { driverName: 'عمرو إبراهيم', amount: 3240, category: 'management' as DriverCategory },
    { driverName: 'عمرو إبراهيم', amount: 1750, category: 'production' as DriverCategory },
    { driverName: 'عمرو إبراهيم', amount: 3325, category: 'production' as DriverCategory },
    { driverName: 'عمرو إبراهيم', amount: 700, category: 'production' as DriverCategory },

    // أحمد شوقي (Col Q) - Total 10,110 (3 operations)
    { driverName: 'أحمد شوقي', amount: 1480, category: 'production' as DriverCategory },
    { driverName: 'أحمد شوقي', amount: 4325, category: 'production' as DriverCategory },
    { driverName: 'أحمد شوقي', amount: 4305, category: 'production' as DriverCategory },

    // أحمد جمعه (Col R) - Total 8,235 (3 operations: 3,510 management + 4,725 production)
    { driverName: 'أحمد جمعه', amount: 3510, category: 'management' as DriverCategory },
    { driverName: 'أحمد جمعه', amount: 3325, category: 'production' as DriverCategory },
    { driverName: 'أحمد جمعه', amount: 1400, category: 'production' as DriverCategory },

    // علاء بازيد (Col S) - Total 5,640 (2 operations: 3,240 management + 2,400 production)
    { driverName: 'علاء بازيد', amount: 3240, category: 'management' as DriverCategory },
    { driverName: 'علاء بازيد', amount: 2400, category: 'production' as DriverCategory },

    // أبو عمر (Col T) - Total 2,280 (1 operation: 2,280 management)
    { driverName: 'أبو عمر', amount: 2280, category: 'management' as DriverCategory },

    // أحمد فريد (Col U) - Total 3,240 (1 operation: 3,240 management)
    { driverName: 'أحمد فريد', amount: 3240, category: 'management' as DriverCategory },
  ],
};

// Helper to initialize local storage with EMPTY arrays (No mock data)
function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item);
  } catch {
    return defaultValue;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

// Normalize vehicle types to strictly allow only 'ميكروباص' or 'عربية فان'
export function normalizeVehicleType(type?: string): 'ميكروباص' | 'عربية فان' {
  if (!type) return 'ميكروباص';
  const clean = type.trim();
  if (clean === 'عربية فان' || clean === 'فان' || clean.toLowerCase() === 'van') {
    return 'عربية فان';
  }
  return 'ميكروباص';
}

export const driverPayoutService = {
  // --- DRIVERS ---
  async getDrivers(): Promise<Driver[]> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>('/drivers');
        // Handle both raw array or wrapped { success, data } format
        const list: Driver[] = Array.isArray(res) ? res : res.data || [];
        return list.map(d => ({ ...d, vehicleType: normalizeVehicleType(d.vehicleType) }));
      } catch (err) {
        console.warn('Backend unavailable for /drivers, falling back to local cache:', err);
      }
    }
    await new Promise(res => setTimeout(res, 20));
    const raw = getStoredItem<Driver[]>(STORAGE_KEYS.DRIVERS, []);
    let hasChanges = false;
    const normalized = raw.map(d => {
      const valid = normalizeVehicleType(d.vehicleType);
      if (d.vehicleType !== valid) {
        hasChanges = true;
        return { ...d, vehicleType: valid };
      }
      return d;
    });
    if (hasChanges) {
      setStoredItem(STORAGE_KEYS.DRIVERS, normalized);
    }
    return normalized;
  },

  async getDriver(id: string): Promise<Driver | null> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>(`/drivers/${id}`);
        return res?.data || res || null;
      } catch (err) {
        console.warn(`Backend unavailable for /drivers/${id}:`, err);
      }
    }
    const drivers = await this.getDrivers();
    return drivers.find(d => d.id === id) || null;
  },

  async createDriver(data: Omit<Driver, 'id' | 'code' | 'joinedDate'>): Promise<Driver> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.post<any>('/drivers', data);
        const created = res?.data || res;
        // Keep local cache synced
        const drivers = getStoredItem<Driver[]>(STORAGE_KEYS.DRIVERS, []);
        setStoredItem(STORAGE_KEYS.DRIVERS, [...drivers, created]);
        return created;
      } catch (err) {
        console.warn('Backend unavailable for POST /drivers, saving locally:', err);
      }
    }

    const drivers = await this.getDrivers();
    const newId = `drv-${Date.now()}`;
    const nextCode = `DRV-${String(drivers.length + 1).padStart(2, '0')}`;
    const newDriver: Driver = {
      ...data,
      vehicleType: normalizeVehicleType(data.vehicleType),
      id: newId,
      code: nextCode,
      joinedDate: new Date().toISOString().split('T')[0],
      status: data.status || 'active',
    };
    const updated = [...drivers, newDriver];
    setStoredItem(STORAGE_KEYS.DRIVERS, updated);
    return newDriver;
  },

  async updateDriver(id: string, data: Partial<Driver>): Promise<Driver> {
    const sanitizedData = {
      ...data,
      ...(data.vehicleType !== undefined ? { vehicleType: normalizeVehicleType(data.vehicleType) } : {}),
    };
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.put<any>(`/drivers/${id}`, sanitizedData);
        const updated = res?.data || res;
        const drivers = getStoredItem<Driver[]>(STORAGE_KEYS.DRIVERS, []);
        const idx = drivers.findIndex(d => d.id === id);
        if (idx !== -1) drivers[idx] = updated;
        setStoredItem(STORAGE_KEYS.DRIVERS, drivers);

        // Keep local transactions synced if name changed
        if (data.name) {
          const txs = getStoredItem<DriverPayoutTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
          let changed = false;
          const updatedTxs = txs.map(t => {
            if (t.driverId === id) {
              changed = true;
              return { ...t, driverName: data.name! };
            }
            return t;
          });
          if (changed) setStoredItem(STORAGE_KEYS.TRANSACTIONS, updatedTxs);
        }

        return updated;
      } catch (err) {
        console.warn(`Backend unavailable for PUT /drivers/${id}:`, err);
      }
    }

    const drivers = await this.getDrivers();
    const index = drivers.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Driver not found');
    const updatedDriver = { ...drivers[index], ...sanitizedData };
    drivers[index] = updatedDriver;
    setStoredItem(STORAGE_KEYS.DRIVERS, drivers);

    // Keep local transactions synced if name changed
    if (sanitizedData.name) {
      const txs = getStoredItem<DriverPayoutTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
      let changed = false;
      const updatedTxs = txs.map(t => {
        if (t.driverId === id) {
          changed = true;
          return { ...t, driverName: data.name! };
        }
        return t;
      });
      if (changed) setStoredItem(STORAGE_KEYS.TRANSACTIONS, updatedTxs);
    }

    return updatedDriver;
  },

  async deleteDriver(id: string): Promise<boolean> {
    if (apiClient.isBackendAvailable()) {
      try {
        await apiClient.delete(`/drivers/${id}`);
      } catch (err: any) {
        console.warn(`Backend error on DELETE /drivers/${id}:`, err);
        if (err.message && (err.message.includes('HTTP 4') || err.message.includes('HTTP 5'))) {
          throw err;
        }
      }
    }

    const drivers = getStoredItem<Driver[]>(STORAGE_KEYS.DRIVERS, []);
    const updated = drivers.filter(d => d.id !== id);
    setStoredItem(STORAGE_KEYS.DRIVERS, updated);

    // Also clean up local transactions for this driver and recalculate affected weekly summaries
    const txs = getStoredItem<DriverPayoutTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const affectedWeeks = new Set(txs.filter(t => t.driverId === id).map(t => t.weekPeriod));
    const remainingTxs = txs.filter(t => t.driverId !== id);
    setStoredItem(STORAGE_KEYS.TRANSACTIONS, remainingTxs);

    for (const week of affectedWeeks) {
      await this.recalculateWeeklySummary(week);
    }

    return true;
  },

  // --- TRANSACTIONS ---
  async getTransactions(params?: {
    weekPeriod?: string;
    driverId?: string;
    category?: DriverCategory | 'all';
    search?: string;
  }): Promise<DriverPayoutTransaction[]> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>('/driver-payouts/transactions', { params });
        return Array.isArray(res) ? res : res.data || [];
      } catch (err) {
        console.warn('Backend unavailable for /driver-payouts/transactions:', err);
      }
    }

    await new Promise(res => setTimeout(res, 20));
    let list = getStoredItem<DriverPayoutTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);

    if (params?.weekPeriod) {
      list = list.filter(t => t.weekPeriod === params.weekPeriod);
    }

    if (params?.driverId && params.driverId !== 'all') {
      list = list.filter(t => t.driverId === params.driverId);
    }

    if (params?.category && params.category !== 'all') {
      list = list.filter(t => t.category === params.category);
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        t =>
          t.driverName.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.vehiclePlate && t.vehiclePlate.toLowerCase().includes(q)) ||
          (t.receiptNumber && t.receiptNumber.toLowerCase().includes(q))
      );
    }

    return list;
  },

  async createTransaction(
    data: Omit<DriverPayoutTransaction, 'id' | 'orderIndex' | 'createdAt'>
  ): Promise<DriverPayoutTransaction> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.post<any>('/driver-payouts/transactions', data);
        const created = res?.data || res;
        const all = getStoredItem<DriverPayoutTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
        setStoredItem(STORAGE_KEYS.TRANSACTIONS, [...all, created]);
        await this.recalculateWeeklySummary(data.weekPeriod);
        return created;
      } catch (err) {
        console.warn('Backend unavailable for POST /driver-payouts/transactions:', err);
      }
    }

    const all = getStoredItem<DriverPayoutTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const driverWeekTxs = all.filter(
      t => t.driverId === data.driverId && t.weekPeriod === data.weekPeriod
    );
    const orderIndex = driverWeekTxs.length;

    const newTx: DriverPayoutTransaction = {
      ...data,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      orderIndex,
      createdAt: new Date().toISOString(),
      receiptNumber:
        data.receiptNumber ||
        `REC-${new Date().getFullYear().toString().substr(2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(all.length + 1).padStart(3, '0')}`,
    };

    const updated = [...all, newTx];
    setStoredItem(STORAGE_KEYS.TRANSACTIONS, updated);
    await this.recalculateWeeklySummary(data.weekPeriod);
    return newTx;
  },

  async updateTransaction(
    id: string,
    data: Partial<DriverPayoutTransaction>
  ): Promise<DriverPayoutTransaction> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.put<any>(`/driver-payouts/transactions/${id}`, data);
        const updated = res?.data || res;
        const all = getStoredItem<DriverPayoutTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
        const idx = all.findIndex(t => t.id === id);
        if (idx !== -1) all[idx] = updated;
        setStoredItem(STORAGE_KEYS.TRANSACTIONS, all);
        await this.recalculateWeeklySummary(updated.weekPeriod);
        return updated;
      } catch (err) {
        console.warn(`Backend unavailable for PUT /driver-payouts/transactions/${id}:`, err);
      }
    }

    const all = getStoredItem<DriverPayoutTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const index = all.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transaction not found');

    const updatedTx = { ...all[index], ...data };
    all[index] = updatedTx;
    setStoredItem(STORAGE_KEYS.TRANSACTIONS, all);

    await this.recalculateWeeklySummary(updatedTx.weekPeriod);
    return updatedTx;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    if (apiClient.isBackendAvailable()) {
      try {
        await apiClient.delete(`/driver-payouts/transactions/${id}`);
      } catch (err) {
        console.warn(`Backend unavailable for DELETE /driver-payouts/transactions/${id}:`, err);
      }
    }

    const all = getStoredItem<DriverPayoutTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const target = all.find(t => t.id === id);
    if (!target) return false;

    const updated = all.filter(t => t.id !== id);
    setStoredItem(STORAGE_KEYS.TRANSACTIONS, updated);
    await this.recalculateWeeklySummary(target.weekPeriod);
    return true;
  },

  // --- WEEKLY MATRIX & SUMMARIES ---
  async getWeeklySummaries(): Promise<WeeklyPayoutSummary[]> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>('/driver-payouts/summaries');
        return Array.isArray(res) ? res : res.data || [];
      } catch (err) {
        console.warn('Backend unavailable for /driver-payouts/summaries:', err);
      }
    }
    await new Promise(res => setTimeout(res, 20));
    return getStoredItem<WeeklyPayoutSummary[]>(STORAGE_KEYS.SUMMARIES, []);
  },

  async getWeeklySummary(weekPeriod: string): Promise<WeeklyPayoutSummary | null> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>(`/driver-payouts/summaries/${weekPeriod}`);
        return res?.data || res || null;
      } catch (err) {
        console.warn(`Backend unavailable for /driver-payouts/summaries/${weekPeriod}:`, err);
      }
    }

    const summaries = await this.getWeeklySummaries();
    let summary = summaries.find(s => s.weekPeriod === weekPeriod);
    if (!summary) {
      summary = await this.recalculateWeeklySummary(weekPeriod);
    }
    return summary || null;
  },

  async recalculateWeeklySummary(weekPeriod: string): Promise<WeeklyPayoutSummary> {
    const summaries = getStoredItem<WeeklyPayoutSummary[]>(STORAGE_KEYS.SUMMARIES, []);
    const transactions = getStoredItem<DriverPayoutTransaction[]>(STORAGE_KEYS.TRANSACTIONS, [])
      .filter(t => t.weekPeriod === weekPeriod && t.status !== 'cancelled');

    const uniqueDriverIds = new Set(transactions.map(t => t.driverId));
    const totalDrivers = uniqueDriverIds.size;
    const totalOperations = transactions.length;

    let managementTotal = 0;
    let productionTotal = 0;

    transactions.forEach(t => {
      if (t.category === 'management') {
        managementTotal += Number(t.amount) || 0;
      } else {
        productionTotal += Number(t.amount) || 0;
      }
    });

    const totalAmount = managementTotal + productionTotal;
    const averagePayout = totalDrivers > 0 ? Math.round(totalAmount / totalDrivers) : 0;

    const existingIndex = summaries.findIndex(s => s.weekPeriod === weekPeriod);
    const existing = existingIndex !== -1 ? summaries[existingIndex] : null;

    const updatedSummary: WeeklyPayoutSummary = {
      weekPeriod,
      weekLabel: existing?.weekLabel || `أسبوع ${weekPeriod}`,
      date: existing?.date || weekPeriod,
      totalDrivers,
      totalAmount,
      totalOperations,
      averagePayout,
      managementTotal,
      productionTotal,
      status: existing?.status || 'open',
      lockedAt: existing?.lockedAt,
      lockedBy: existing?.lockedBy,
    };

    if (existingIndex !== -1) {
      summaries[existingIndex] = updatedSummary;
    } else {
      summaries.unshift(updatedSummary);
    }

    setStoredItem(STORAGE_KEYS.SUMMARIES, summaries);
    return updatedSummary;
  },

  async getWeeklyColumns(weekPeriod: string): Promise<{
    columns: DriverWeeklyColumn[];
    maxRows: number;
    summary: WeeklyPayoutSummary;
  }> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>(`/driver-payouts/matrix/${weekPeriod}`);
        const matrixData = res?.data || res;
        if (matrixData && Array.isArray(matrixData.columns)) {
          return matrixData;
        }
      } catch (err) {
        console.warn(`Backend endpoint /driver-payouts/matrix/${weekPeriod} not available, calculating client-side:`, err);
      }
    }

    const drivers = await this.getDrivers();
    const transactions = await this.getTransactions({ weekPeriod });
    const summary = (await this.getWeeklySummary(weekPeriod)) || (await this.recalculateWeeklySummary(weekPeriod));

    let maxRows = 0;

    const columns: DriverWeeklyColumn[] = drivers.map(driver => {
      const driverTxs = transactions
        .filter(t => t.driverId === driver.id && t.status !== 'cancelled')
        .sort((a, b) => a.orderIndex - b.orderIndex);

      if (driverTxs.length > maxRows) {
        maxRows = driverTxs.length;
      }

      let totalAmount = 0;
      let managementAmount = 0;
      let productionAmount = 0;

      driverTxs.forEach(tx => {
        const val = Number(tx.amount) || 0;
        totalAmount += val;
        if (tx.category === 'management') {
          managementAmount += val;
        } else {
          productionAmount += val;
        }
      });

      return {
        driver,
        transactions: driverTxs,
        totalAmount,
        operationsCount: driverTxs.length,
        managementAmount,
        productionAmount,
      };
    });

    maxRows = Math.max(maxRows, 4);
    return { columns, maxRows, summary };
  },

  async updateWeeklyStatus(
    weekPeriod: string,
    status: 'open' | 'locked',
    lockedBy?: string
  ): Promise<WeeklyPayoutSummary> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.put<any>(`/driver-payouts/summaries/${weekPeriod}/status`, {
          status,
          lockedBy,
        });
        return res?.data || res;
      } catch (err) {
        console.warn('Backend unavailable for status update:', err);
      }
    }

    const summaries = await this.getWeeklySummaries();
    const index = summaries.findIndex(s => s.weekPeriod === weekPeriod);
    if (index === -1) throw new Error('Week summary not found');

    summaries[index].status = status;
    if (status === 'locked') {
      summaries[index].lockedAt = new Date().toISOString();
      summaries[index].lockedBy = lockedBy || 'المسؤول المالي';
    } else {
      delete summaries[index].lockedAt;
      delete summaries[index].lockedBy;
    }

    setStoredItem(STORAGE_KEYS.SUMMARIES, summaries);
    return summaries[index];
  },

  async createNewWeeklyCycle(
    dateStr: string,
    label?: string
  ): Promise<WeeklyPayoutSummary> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.post<any>('/driver-payouts/summaries', {
          weekPeriod: dateStr,
          weekLabel: label,
        });
        return res?.data || res;
      } catch (err) {
        console.warn('Backend unavailable for POST /driver-payouts/summaries:', err);
      }
    }

    const summaries = await this.getWeeklySummaries();
    const existing = summaries.find(s => s.weekPeriod === dateStr);
    if (existing) return existing;

    const newSummary: WeeklyPayoutSummary = {
      weekPeriod: dateStr,
      weekLabel: label || `الأسبوع المنتهي في ${dateStr}`,
      date: dateStr,
      totalDrivers: 0,
      totalAmount: 0,
      totalOperations: 0,
      averagePayout: 0,
      managementTotal: 0,
      productionTotal: 0,
      status: 'open',
    };

    summaries.unshift(newSummary);
    setStoredItem(STORAGE_KEYS.SUMMARIES, summaries);
    return newSummary;
  },

  // --- STYLED EXCEL WORKBOOK GENERATOR (Matching the official approved template exactly) ---
  buildStyledWeeklyMatrixWorkbook(params: {
    weekLabel: string;
    columns: DriverWeeklyColumn[];
    maxRows: number;
    summary: WeeklyPayoutSummary;
  }) {
    const wb = XLSX.utils.book_new();
    wb.Workbook = { Views: [{ RTL: true }] };
    const ws: any = {};
    ws['!merges'] = [];
    ws['!views'] = [{ rightToLeft: true, RTL: true }];
    ws['!sheetViews'] = [{ rightToLeft: true }];

    function setCell(r: number, c: number, val: any, style: any = {}, type?: string) {
      const ref = XLSX.utils.encode_cell({ r, c });
      ws[ref] = {
        v: val,
        t: type || (typeof val === 'number' ? 'n' : 's'),
        s: style || {},
      };
    }

    const darkBorder = {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    };

    const lightBorder = {
      top: { style: 'thin', color: { rgb: 'C8C8C8' } },
      bottom: { style: 'thin', color: { rgb: 'C8C8C8' } },
      left: { style: 'thin', color: { rgb: 'C8C8C8' } },
      right: { style: 'thin', color: { rgb: 'C8C8C8' } },
    };

    const cols = params.columns;
    const driverCount = Math.max(cols.length, 14);
    // Columns start at C (index 2). C to G (indices 2 to 6) is the summary/sidebar.
    // Driver columns start at H (index 7) up to 7 + driverCount - 1 (index 20 = U for 14 drivers)
    const startDriverCol = 7;
    const endCol = Math.max(startDriverCol + driverCount - 1, 20);

    // 1. Row 1 (r: 0): Main Title Banner (Columns C to U merged)
    setCell(0, 2, 'الملخص الأسبوعي - متابعة قبض السواقين', {
      fill: { fgColor: { rgb: '1F4E79' } },
      font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    });
    for (let c = 3; c <= endCol; c++) {
      setCell(0, c, '', { fill: { fgColor: { rgb: '1F4E79' } } });
    }
    ws['!merges'].push({ s: { r: 0, c: 2 }, e: { r: 0, c: endCol } });

    // 2. Row 2 (r: 1): Date Cell (Columns J to M, or centered)
    setCell(1, 9, params.weekLabel, {
      fill: { fgColor: { rgb: 'BDD7EE' } },
      font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: '000000' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: darkBorder,
    });
    for (let c = 10; c <= 12; c++) {
      setCell(1, c, '', { fill: { fgColor: { rgb: 'BDD7EE' } }, border: darkBorder });
    }
    ws['!merges'].push({ s: { r: 1, c: 9 }, e: { r: 1, c: 12 } });

    // 3. KPI Summary Table (Rows 2 to 5, columns C to H)
    const kpis = [
      { label: 'إجمالي عدد السواقين', val: params.summary.totalDrivers, isNum: true },
      { label: 'إجمالي المبالغ المدفوعة', val: `${params.summary.totalAmount.toLocaleString()} جنيه` },
      { label: 'عدد عمليات القبض', val: params.summary.totalOperations, isNum: true },
      { label: 'متوسط قبض السائق', val: `${params.summary.averagePayout.toLocaleString()} جنيه` },
    ];

    kpis.forEach((kpi, idx) => {
      const r = 1 + idx;
      // Label in cols C to E (c: 2 to 4)
      setCell(r, 2, kpi.label, {
        fill: { fgColor: { rgb: 'D9E1F2' } },
        font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '1F4E79' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: darkBorder,
      });
      setCell(r, 3, '', { fill: { fgColor: { rgb: 'D9E1F2' } }, border: darkBorder });
      setCell(r, 4, '', { fill: { fgColor: { rgb: 'D9E1F2' } }, border: darkBorder });
      ws['!merges'].push({ s: { r, c: 2 }, e: { r, c: 4 } });

      // Value in cols F to H (c: 5 to 7)
      setCell(
        r,
        5,
        kpi.val,
        {
          fill: { fgColor: { rgb: 'FFFFFF' } },
          font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: darkBorder,
        },
        kpi.isNum ? 'n' : 's'
      );
      setCell(r, 6, '', { fill: { fgColor: { rgb: 'FFFFFF' } }, border: darkBorder });
      setCell(r, 7, '', { fill: { fgColor: { rgb: 'FFFFFF' } }, border: darkBorder });
      ws['!merges'].push({ s: { r, c: 5 }, e: { r, c: 7 } });
    });

    // 4. Row 7 (r: 6): Driver Header Row (Golden Yellow)
    cols.forEach((col, idx) => {
      const c = startDriverCol + idx;
      setCell(6, c, col.driver.name, {
        fill: { fgColor: { rgb: 'FFC000' } },
        font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: '000000' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: darkBorder,
      });
    });

    // 5. Rows 8 to (7 + maxRows - 1): Payout Transactions Rows
    const maxR = Math.max(params.maxRows, 4);
    for (let rIdx = 0; rIdx < maxR; rIdx++) {
      const r = 7 + rIdx;
      cols.forEach((col, cIdx) => {
        const c = startDriverCol + cIdx;
        const tx = col.transactions[rIdx];
        if (tx) {
          const isMgt = tx.category === 'management';
          setCell(
            r,
            c,
            tx.amount,
            {
              font: {
                name: 'Segoe UI',
                sz: 11,
                bold: true,
                color: { rgb: isMgt ? 'C00000' : '000000' },
              },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: lightBorder,
            },
            'n'
          );
        } else {
          setCell(r, c, '', {
            alignment: { horizontal: 'center', vertical: 'center' },
            border: lightBorder,
          });
        }
      });
    }

    // 6. Row (7 + maxR): Spacer row (blank)
    const spacerRow = 7 + maxR;

    // 7. Row (spacerRow + 1): "إجمالي القبض" (Light Green)
    const totalRow = spacerRow + 1;
    // Label in C to G
    setCell(totalRow, 2, 'إجمالي القبض', {
      fill: { fgColor: { rgb: 'C6EFCE' } },
      font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: '276A3C' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: darkBorder,
    });
    for (let c = 3; c <= 6; c++) {
      setCell(totalRow, c, '', { fill: { fgColor: { rgb: 'C6EFCE' } }, border: darkBorder });
    }
    ws['!merges'].push({ s: { r: totalRow, c: 2 }, e: { r: totalRow, c: 6 } });

    cols.forEach((col, idx) => {
      const c = startDriverCol + idx;
      setCell(totalRow, c, `${col.totalAmount.toLocaleString()} جنيه`, {
        fill: { fgColor: { rgb: 'C6EFCE' } },
        font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: '276A3C' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: darkBorder,
      });
    });

    // 8. Row (totalRow + 1): "عدد مرات القبض" (Light Blue)
    const opsRow = totalRow + 1;
    setCell(opsRow, 2, 'عدد مرات القبض', {
      fill: { fgColor: { rgb: 'DDEBF7' } },
      font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: '1F4E79' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: darkBorder,
    });
    for (let c = 3; c <= 6; c++) {
      setCell(opsRow, c, '', { fill: { fgColor: { rgb: 'DDEBF7' } }, border: darkBorder });
    }
    ws['!merges'].push({ s: { r: opsRow, c: 2 }, e: { r: opsRow, c: 6 } });

    cols.forEach((col, idx) => {
      const c = startDriverCol + idx;
      setCell(
        opsRow,
        c,
        col.operationsCount,
        {
          fill: { fgColor: { rgb: 'DDEBF7' } },
          font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: '1F4E79' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: darkBorder,
        },
        'n'
      );
    });

    // 9. Row (opsRow + 2): Master Grand Total Row (Dark Green)
    const grandRow = opsRow + 2;
    setCell(grandRow, 2, 'الإجمالي العام', {
      fill: { fgColor: { rgb: '375623' } },
      font: { name: 'Segoe UI', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: darkBorder,
    });
    for (let c = 3; c <= 6; c++) {
      setCell(grandRow, c, '', { fill: { fgColor: { rgb: '375623' } }, border: darkBorder });
    }
    ws['!merges'].push({ s: { r: grandRow, c: 2 }, e: { r: grandRow, c: 6 } });

    setCell(grandRow, startDriverCol, `${params.summary.totalAmount.toLocaleString()} جنيه`, {
      fill: { fgColor: { rgb: '375623' } },
      font: { name: 'Segoe UI', sz: 15, bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: darkBorder,
    });
    for (let c = startDriverCol + 1; c <= endCol; c++) {
      setCell(grandRow, c, '', { fill: { fgColor: { rgb: '375623' } }, border: darkBorder });
    }
    ws['!merges'].push({ s: { r: grandRow, c: startDriverCol }, e: { r: grandRow, c: endCol } });

    // 10. Row (grandRow + 1): Administration Total Row (Crimson Red)
    const mgtRow = grandRow + 1;
    setCell(mgtRow, 2, 'اجمالي الاداره', {
      fill: { fgColor: { rgb: 'C00000' } },
      font: { name: 'Segoe UI', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: darkBorder,
    });
    for (let c = 3; c <= 6; c++) {
      setCell(mgtRow, c, '', { fill: { fgColor: { rgb: 'C00000' } }, border: darkBorder });
    }
    ws['!merges'].push({ s: { r: mgtRow, c: 2 }, e: { r: mgtRow, c: 6 } });

    setCell(mgtRow, startDriverCol, `${params.summary.managementTotal.toLocaleString()} جنيه`, {
      fill: { fgColor: { rgb: 'C00000' } },
      font: { name: 'Segoe UI', sz: 15, bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: darkBorder,
    });
    for (let c = startDriverCol + 1; c <= endCol; c++) {
      setCell(mgtRow, c, '', { fill: { fgColor: { rgb: 'C00000' } }, border: darkBorder });
    }
    ws['!merges'].push({ s: { r: mgtRow, c: startDriverCol }, e: { r: mgtRow, c: endCol } });

    // 11. Row (mgtRow + 1): Production Total Row (Peach / Orange)
    const prodRow = mgtRow + 1;
    setCell(prodRow, 2, 'اجمالي الإنتاج', {
      fill: { fgColor: { rgb: 'F8CBAD' } },
      font: { name: 'Segoe UI', sz: 12, bold: true, color: { rgb: '000000' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: darkBorder,
    });
    for (let c = 3; c <= 6; c++) {
      setCell(prodRow, c, '', { fill: { fgColor: { rgb: 'F8CBAD' } }, border: darkBorder });
    }
    ws['!merges'].push({ s: { r: prodRow, c: 2 }, e: { r: prodRow, c: 6 } });

    setCell(prodRow, startDriverCol, `${params.summary.productionTotal.toLocaleString()} جنيه`, {
      fill: { fgColor: { rgb: 'F8CBAD' } },
      font: { name: 'Segoe UI', sz: 15, bold: true, color: { rgb: '000000' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: darkBorder,
    });
    for (let c = startDriverCol + 1; c <= endCol; c++) {
      setCell(prodRow, c, '', { fill: { fgColor: { rgb: 'F8CBAD' } }, border: darkBorder });
    }
    ws['!merges'].push({ s: { r: prodRow, c: startDriverCol }, e: { r: prodRow, c: endCol } });

    // Dimension bounds & column widths
    ws['!ref'] = `A1:${XLSX.utils.encode_cell({ r: prodRow + 2, c: endCol + 1 })}`;
    const colWidths: any[] = [
      { wch: 4 }, // A
      { wch: 4 }, // B
      { wch: 12 }, // C
      { wch: 12 }, // D
      { wch: 12 }, // E
      { wch: 10 }, // F
      { wch: 10 }, // G
    ];
    for (let i = startDriverCol; i <= endCol; i++) {
      colWidths.push({ wch: 14 });
    }
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'متابعة قبض السواقين');
    return wb;
  },

  // --- EXPORT TO REAL EXCEL (.xlsx) ---
  async exportWeeklyMatrixToExcel(weekPeriod: string): Promise<void> {
    const { columns, maxRows, summary } = await this.getWeeklyColumns(weekPeriod);
    const wb = this.buildStyledWeeklyMatrixWorkbook({
      weekLabel: summary.weekLabel || `أسبوع ${weekPeriod}`,
      columns,
      maxRows,
      summary,
    });
    XLSX.writeFile(wb, `قبض_السواقين_${weekPeriod}.xlsx`);
  },

  // --- TEMPLATE DOWNLOAD FOR EXCEL (Downloads the official approved template matching user's sheet) ---
  downloadTemplateExcel(): void {
    // Generate DriverWeeklyColumn array from the official model data
    const columns: DriverWeeklyColumn[] = OFFICIAL_TEMPLATE_DATA.drivers.map((d, dIdx) => {
      const driverTxs = OFFICIAL_TEMPLATE_DATA.transactions
        .filter(t => t.driverName === d.name)
        .map((t, idx) => ({
          id: `tpl-tx-${dIdx}-${idx}`,
          driverId: `tpl-drv-${dIdx}`,
          driverName: d.name,
          weekPeriod: OFFICIAL_TEMPLATE_DATA.weekPeriod,
          date: OFFICIAL_TEMPLATE_DATA.weekPeriod,
          amount: t.amount,
          category: t.category,
          orderIndex: idx,
          paymentMethod: 'cash' as const,
          status: 'paid' as const,
          createdAt: new Date().toISOString(),
        }));

      const totalAmount = driverTxs.reduce((sum, t) => sum + t.amount, 0);
      const managementAmount = driverTxs
        .filter(t => t.category === 'management')
        .reduce((sum, t) => sum + t.amount, 0);
      const productionAmount = driverTxs
        .filter(t => t.category === 'production')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        driver: {
          id: `tpl-drv-${dIdx}`,
          code: `DRV-${String(dIdx + 1).padStart(2, '0')}`,
          name: d.name,
          vehicleType: d.vehicleType,
          defaultCategory: d.defaultCategory,
          status: 'active',
          joinedDate: '2026-10-18',
        },
        transactions: driverTxs,
        totalAmount,
        operationsCount: driverTxs.length,
        managementAmount,
        productionAmount,
      };
    });

    const summary: WeeklyPayoutSummary = {
      weekPeriod: OFFICIAL_TEMPLATE_DATA.weekPeriod,
      weekLabel: OFFICIAL_TEMPLATE_DATA.weekLabel,
      date: OFFICIAL_TEMPLATE_DATA.weekPeriod,
      totalDrivers: 14,
      totalAmount: 112240,
      totalOperations: 32,
      averagePayout: 8017,
      managementTotal: 15510,
      productionTotal: 96730,
      status: 'open',
    };

    const maxRows = Math.max(...columns.map(c => c.transactions.length), 4);
    const wb = this.buildStyledWeeklyMatrixWorkbook({
      weekLabel: OFFICIAL_TEMPLATE_DATA.weekLabel,
      columns,
      maxRows,
      summary,
    });

    XLSX.writeFile(wb, 'نموذج_متابعة_قبض_السواقين.xlsx');
  },

  // --- BATCH IMPORT FROM PARSED EXCEL DATA ---
  async batchImportWeeklyData(params: {
    weekPeriod: string;
    weekLabel: string;
    drivers: Array<{ name: string; vehicleType?: string; defaultCategory?: DriverCategory }>;
    transactions: Array<{
      driverName: string;
      amount: number;
      category: DriverCategory;
      description?: string;
      date?: string;
    }>;
  }): Promise<{ importedDriversCount: number; importedTransactionsCount: number }> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.post<any>('/driver-payouts/batch-import', params);
        const data = res?.data || res;
        return {
          importedDriversCount: data.importedDriversCount ?? params.drivers.length,
          importedTransactionsCount: data.importedTransactionsCount ?? params.transactions.length,
        };
      } catch (err) {
        console.warn('Backend endpoint /driver-payouts/batch-import unavailable, executing client fallback:', err);
      }
    }

    const existingDrivers = await this.getDrivers();
    const driverMap = new Map<string, Driver>();

    existingDrivers.forEach(d => driverMap.set(d.name.trim(), d));

    let newDriversCount = 0;

    // 1. Ensure all drivers exist
    for (const d of params.drivers) {
      const cleanName = d.name.trim();
      if (!driverMap.has(cleanName)) {
        const created = await this.createDriver({
          name: cleanName,
          vehicleType: d.vehicleType || 'ميكروباص',
          defaultCategory: d.defaultCategory || 'production',
          status: 'active',
          notes: 'مستورد من شيت إكسيل',
        });
        driverMap.set(cleanName, created);
        newDriversCount++;
      }
    }

    // 2. Ensure week cycle exists
    await this.createNewWeeklyCycle(params.weekPeriod, params.weekLabel);

    // Clean up existing transactions for this weekPeriod so import REPLACES rather than appends
    const existingTxs = getStoredItem<DriverPayoutTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const filteredTxs = existingTxs.filter(t => t.weekPeriod !== params.weekPeriod);
    setStoredItem(STORAGE_KEYS.TRANSACTIONS, filteredTxs);

    // 3. Insert transactions
    let txCount = 0;
    for (const t of params.transactions) {
      const driver = driverMap.get(t.driverName.trim());
      if (driver && t.amount > 0) {
        await this.createTransaction({
          driverId: driver.id,
          driverName: driver.name,
          weekPeriod: params.weekPeriod,
          date: t.date || params.weekPeriod,
          amount: Number(t.amount),
          category: t.category,
          description: t.description || (t.category === 'management' ? 'مشاوير إدارة' : 'شحنة إنتاج'),
          vehiclePlate: driver.vehicleNumber,
          status: 'paid',
          paymentMethod: 'cash',
        });
        txCount++;
      }
    }

    await this.recalculateWeeklySummary(params.weekPeriod);
    return { importedDriversCount: newDriversCount, importedTransactionsCount: txCount };
  },

  async clearAllData(): Promise<void> {
    if (apiClient.isBackendAvailable()) {
      try {
        await apiClient.delete('/driver-payouts/clear-all');
      } catch (err) {
        console.warn('Backend clear-all DELETE failed, attempting POST:', err);
        try {
          await apiClient.post('/driver-payouts/clear-all');
        } catch {
          // ignore
        }
      }
    }

    const allKeys = [
      STORAGE_KEYS.DRIVERS,
      STORAGE_KEYS.TRANSACTIONS,
      STORAGE_KEYS.SUMMARIES,
      'hr_drivers_clean_v1',
      'hr_driver_transactions_clean_v1',
      'hr_driver_summaries_clean_v1',
      'hr_drivers_data_v1',
      'hr_driver_transactions_v1',
      'hr_driver_summaries_v1',
      'hr_drivers_data_v2',
      'hr_driver_transactions_v2',
      'hr_driver_summaries_v2',
      'hr_drivers_data',
      'hr_driver_transactions',
      'hr_driver_summaries',
    ];
    allKeys.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });

    setStoredItem(STORAGE_KEYS.DRIVERS, []);
    setStoredItem(STORAGE_KEYS.TRANSACTIONS, []);
    setStoredItem(STORAGE_KEYS.SUMMARIES, []);
    apiClient.clearCache();
  },
};
