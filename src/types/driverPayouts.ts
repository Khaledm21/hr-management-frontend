export type DriverCategory = 'management' | 'production';

export interface Driver {
  id: string;
  code: string;
  name: string;
  phone?: string;
  nationalId?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  defaultCategory: DriverCategory;
  status: 'active' | 'inactive';
  joinedDate: string;
  notes?: string;
}

export interface DriverPayoutTransaction {
  id: string;
  driverId: string;
  driverName: string;
  weekPeriod: string; // e.g., '2026-10-12'
  date: string;
  amount: number;
  category: DriverCategory;
  description?: string;
  vehiclePlate?: string;
  status: 'paid' | 'pending' | 'cancelled';
  paymentMethod: 'cash' | 'transfer' | 'cheque';
  receiptNumber?: string;
  orderIndex: number;
  createdAt: string;
}

export interface WeeklyPayoutSummary {
  weekPeriod: string;
  weekLabel: string;
  date: string;
  totalDrivers: number;
  totalAmount: number;
  totalOperations: number;
  averagePayout: number;
  managementTotal: number;
  productionTotal: number;
  status: 'open' | 'locked';
  lockedAt?: string;
  lockedBy?: string;
}

export interface DriverWeeklyColumn {
  driver: Driver;
  transactions: DriverPayoutTransaction[];
  totalAmount: number;
  operationsCount: number;
  managementAmount: number;
  productionAmount: number;
}
