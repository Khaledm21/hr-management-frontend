import { ContractRecord, ContractStatus, ContractType } from '../types';
import { mockContracts } from '../mocks/contracts';
import { apiClient } from './apiClient';

let contractsState = [...mockContracts];

export interface ContractFilterParams {
  search?: string;
  department?: string;
  status?: ContractStatus | 'all';
  type?: ContractType | 'all';
}

export const contractService = {
  async getContracts(params: ContractFilterParams = {}): Promise<ContractRecord[]> {
    if (apiClient.isBackendAvailable()) {
      try {
        const response = await apiClient.get<ContractRecord[]>('/contracts', { params });
        if (response) return response;
      } catch (err) {
        console.warn('Backend unavailable for getContracts, falling back to mock data:', err);
      }
    }

    await new Promise(res => setTimeout(res, 50));
    let filtered = [...contractsState];

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        c =>
          c.employeeName.toLowerCase().includes(q) ||
          c.employeeCode.toLowerCase().includes(q) ||
          c.contractNumber.toLowerCase().includes(q)
      );
    }

    if (params.department && params.department !== 'all') {
      filtered = filtered.filter(c => c.department === params.department);
    }

    if (params.status && params.status !== 'all') {
      filtered = filtered.filter(c => c.status === params.status);
    }

    if (params.type && params.type !== 'all') {
      filtered = filtered.filter(c => c.type === params.type);
    }

    return filtered;
  },

  async renewContract(id: string, newEndDate: string, newSalary?: number): Promise<ContractRecord> {
    await new Promise(res => setTimeout(res, 70));
    const contract = contractsState.find(c => c.id === id);
    if (!contract) throw new Error('Contract not found');

    contract.status = 'active';
    contract.endDate = newEndDate;
    contract.renewalCount += 1;
    if (newSalary) contract.salary = newSalary;

    return { ...contract };
  },

  async getExpiringContracts(): Promise<ContractRecord[]> {
    await new Promise(res => setTimeout(res, 30));
    return contractsState.filter(c => c.status === 'expiring_soon' || c.status === 'pending_renewal');
  },
};
