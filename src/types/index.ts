export type RoleType = 'hr_staff' | 'hr_manager' | 'dept_manager' | 'admin';

export type EmploymentStatus = 'active' | 'probation' | 'on_leave' | 'suspended' | 'terminated';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'contractor' | 'intern';
export type ContractType = 'indefinite' | 'fixed_term' | 'probation' | 'consultancy';
export type ContractStatus = 'active' | 'expiring_soon' | 'expired' | 'pending_renewal';

export type DocumentType =
  | 'national_id'
  | 'birth_certificate'
  | 'qualification'
  | 'contract'
  | 'insurance'
  | 'passport'
  | 'medical'
  | 'other';

export type DocumentStatus =
  | 'missing'
  | 'uploaded'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'expired';

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave' | 'holiday' | 'weekend';

export type LeaveType = 'annual' | 'sick' | 'unpaid' | 'emergency' | 'maternity' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type PayrollStatus = 'draft' | 'under_review' | 'approved' | 'locked';

export type AdvanceStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'completed';

export type ApprovalCategory =
  | 'leave'
  | 'contract_renewal'
  | 'employee_change'
  | 'salary_change'
  | 'advance'
  | 'other';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  arabicName?: string;
  chineseName?: string;
  email: string;
  phone: string;
  avatar?: string;
  nationalId: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  nationality: string;
  address: string;
  emergencyContact: EmergencyContact;
  departmentId: string;
  departmentName: string;
  positionId: string;
  positionTitle: string;
  chinesePosition?: string;
  managerId?: string;
  managerName?: string;
  employmentStatus: EmploymentStatus;
  employmentType: EmploymentType;
  hireDate: string;
  probationEndDate: string;
  resignationDate?: string;
  workLocation: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  contractStatus: ContractStatus;
  documentCompletenessPercentage: number;
  missingDocumentsCount: number;
  // Specific to User's Excel workbook
  insuranceStatus?: 'insured' | 'not_insured';
  insuranceNumber?: string;
  insuranceSalary?: number;
  workerShare?: number;
  companyShare?: number;
  insuranceNote?: string;
  qualificationCertificateStatus?: 'missing' | 'available';
  birthCertificateStatus?: 'missing' | 'available';
  idCardStatus?: 'missing' | 'available';
  contractDocStatus?: 'missing' | 'available';
  documentChecklistStatus?: 'incomplete' | 'complete';
  missingNotes?: string;
  inEmployeeList?: boolean;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  nameZh: string;
  managerId?: string;
  managerName?: string;
  employeeCount: number;
  location: string;
  budget: number;
}

export interface Position {
  id: string;
  code: string;
  title: string;
  titleAr: string;
  titleZh: string;
  departmentId: string;
  departmentName: string;
  minSalary: number;
  maxSalary: number;
  level: string;
}

export interface DocumentRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type: DocumentType;
  title: string;
  fileName: string;
  fileSize: string;
  status: DocumentStatus;
  expiryDate?: string;
  uploadedAt?: string;
  verifiedAt?: string;
  verificationDate?: string;
  verifiedBy?: string;
  notes?: string;
  rejectionReason?: string;
}

export interface InsuranceItem {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  nationalIdStatus: DocumentStatus;
  birthCertStatus: DocumentStatus;
  qualificationStatus: DocumentStatus;
  contractStatus: DocumentStatus;
  insuranceStatus: 'complete' | 'missing' | 'under_review';
  missingDocuments: string[];
  lastUpdated: string;
}

export interface SocialInsuranceRecord {
  id: string;
  serialNo: number;
  nationalId: string;
  employeeName: string;
  department: string;
  insuranceNumber: string;
  insuranceSalary: number; // e.g. 4325.00
  workerShare: number;    // e.g. 475.85 (11%)
  companyShare: number;   // e.g. 811.13 (18.75%)
  totalContribution: number; // 1286.98
  note: string;           // e.g. Start: 2024-08-01
  employeeListStatus: 'found' | 'not_found';
  employeeCode?: string;
}

export interface MissingDocumentRecord {
  id: string;
  serialNo: number;
  department: string;
  employeeName: string;
  nationalId: string;
  position: string;
  startDate: string;
  resignationDate?: string;
  employeeCode: string;
  insuranceStatus: 'insured' | 'not_insured';
  qualificationCert: 'missing' | 'available';
  birthCert: 'missing' | 'available';
  idCard: 'missing' | 'available';
  contract: 'missing' | 'available';
  missingCount: number;
  notes?: string;
  status: 'incomplete' | 'complete';
}

export interface ContractRecord {
  id: string;
  contractNumber: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  type: ContractType;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  salary: number;
  noticePeriodDays: number;
  renewalCount: number;
  termsSummary?: string;
}

export interface EmploymentHistoryEvent {
  id: string;
  employeeId: string;
  date: string;
  eventType:
    | 'hired'
    | 'department_transfer'
    | 'promotion'
    | 'position_change'
    | 'salary_change'
    | 'manager_change'
    | 'contract_renewal'
    | 'leave_of_absence'
    | 'termination';
  previousValue: string;
  newValue: string;
  changedBy: string;
  notes: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workHours: number;
  overtimeHours: number;
  status: AttendanceStatus;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  deviceSource: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  approverId?: string;
  approverName?: string;
  submittedAt: string;
  decisionAt?: string;
  comments?: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  annualTotal: number;
  annualUsed: number;
  annualRemaining: number;
  sickTotal: number;
  sickUsed: number;
  emergencyTotal: number;
  emergencyUsed: number;
  unpaidUsed: number;
}

export interface PayrollItem {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  period: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  taxDeduction: number;
  insuranceDeduction: number;
  advancesDeduction: number;
  totalDeductions: number;
  netSalary: number;
  status: PayrollStatus;
  paymentMethod: string;
}

export interface PayrollPeriodSummary {
  period: string;
  totalEmployees: number;
  grossTotal: number;
  deductionsTotal: number;
  netTotal: number;
  status: PayrollStatus;
  lockedAt?: string;
  approvedBy?: string;
  payDate: string;
}

export interface AdvanceItem {
  id: string;
  advanceNumber: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  amount: number;
  installmentsCount: number;
  installmentAmount: number;
  remainingBalance: number;
  purpose: string;
  status: AdvanceStatus;
  requestedAt: string;
  approvedAt?: string;
}

export interface ApprovalItem {
  id: string;
  approvalCode: string;
  category: ApprovalCategory;
  requesterName: string;
  requesterRole: string;
  employeeId: string;
  employeeName: string;
  department: string;
  submittedAt: string;
  currentStep: string;
  totalSteps: number;
  currentStepIndex: number;
  status: ApprovalStatus;
  title: string;
  summary: string;
  rejectionReason?: string;
  history: {
    step: string;
    actor: string;
    action: string;
    timestamp: string;
    comment?: string;
  }[];
}

export interface NotificationItem {
  id: string;
  type:
    | 'contract_expiring'
    | 'missing_document'
    | 'leave_pending'
    | 'approval_required'
    | 'document_rejected'
    | 'payroll_approval'
    | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  department: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  avatar?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  target: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'failed';
  details?: Record<string, any>;
}

export interface CompanySettings {
  companyName: string;
  companyNameAr: string;
  companyNameZh: string;
  taxRegistrationNumber: string;
  crNumber: string;
  companyEmail: string;
  companyPhone: string;
  country: string;
  city: string;
  address: string;
  fiscalYearStart: string;
  workingDaysPerWeek: number;
  probationPeriodMonths: number;
  noticePeriodDays: number;
  defaultAnnualLeaveDays: number;
  autoAttendanceCheckout: boolean;
}

export interface PermissionMatrix {
  module: string;
  label: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
}

export * from './driverPayouts';

