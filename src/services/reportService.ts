import { mockEmployees } from '../mocks/employees';
import { mockDepartments } from '../mocks/departments';
import { mockPayrollSummaries } from '../mocks/payroll';
import { mockContracts } from '../mocks/contracts';
import { mockInsuranceRecords } from '../mocks/insurance';
import { employeeService } from './employeeService';
import { insuranceService } from './insuranceService';

export interface ReportConfig {
  id: string;
  name: string;
  nameAr: string;
  nameZh: string;
  description: string;
  category: 'workforce' | 'compliance' | 'attendance' | 'financial';
}

export const availableReports: ReportConfig[] = [
  {
    id: 'rep-headcount',
    name: 'Employee Headcount & Demographics',
    nameAr: 'إجمالي القوى العاملة والتركيبة الديموغرافية',
    nameZh: '员工总人数与人口统计',
    description: 'Comprehensive breakdown of active workforce, nationalities, gender, and employment status.',
    category: 'workforce',
  },
  {
    id: 'rep-dept-dist',
    name: 'Employees by Department',
    nameAr: 'توزيع الموظفين حسب الإدارات',
    nameZh: '各部门员工分布',
    description: 'Headcount, budgeted vs actual staffing, and management ratios across all company divisions.',
    category: 'workforce',
  },
  {
    id: 'rep-new-hires',
    name: 'New Hires & Probation Pipeline',
    nameAr: 'التعيينات الجديدة ومرحلة التجربة',
    nameZh: '新员工入职与试用期追踪',
    description: 'Onboarding cohort tracking, probation completion rates, and talent source analytics.',
    category: 'workforce',
  },
  {
    id: 'rep-turnover',
    name: 'Employee Turnover & Retention',
    nameAr: 'معدل دوران الموظفين والاستبقاء',
    nameZh: '员工流动率与留存率',
    description: 'Attrition rates, tenure analysis, voluntary vs involuntary departure patterns.',
    category: 'workforce',
  },
  {
    id: 'rep-doc-completion',
    name: 'Document Completion & Audit',
    nameAr: 'اكتمال ملفات ومستندات الموظفين',
    nameZh: '员工档案文件完整性审计',
    description: 'Detailed compliance report on required personnel files, IDs, educational certificates, and contracts.',
    category: 'compliance',
  },
  {
    id: 'rep-insurance',
    name: 'Medical & GOSI Insurance Status',
    nameAr: 'حالة التأمين الطبي والتأمينات الاجتماعية',
    nameZh: '医疗与社会保险状态',
    description: 'Insurance coverage eligibility, policy renewal dates, and dependent documentation status.',
    category: 'compliance',
  },
  {
    id: 'rep-contracts',
    name: 'Contract Expiration & Renewals',
    nameAr: 'انتهاء العقود والتجديدات',
    nameZh: '合同到期与续签分析',
    description: '30/60/90-day contract expiration horizons, indefinite vs fixed-term tenure.',
    category: 'compliance',
  },
  {
    id: 'rep-attendance',
    name: 'Monthly Attendance & Punctuality',
    nameAr: 'ملخص الحضور والانضباط الشهري',
    nameZh: '月度考勤与出勤率汇总',
    description: 'Late arrivals, early leaves, overtime accumulation, and biometric check-in anomalies.',
    category: 'attendance',
  },
  {
    id: 'rep-leave',
    name: 'Leave Balances & Utilization',
    nameAr: 'أرصدة واستخدام الإجازات',
    nameZh: '假期余额与休假利用率',
    description: 'Annual leave liability, accrued unused days, sick leave trends by department.',
    category: 'attendance',
  },
  {
    id: 'rep-payroll',
    name: 'Payroll & Compensation Summary',
    nameAr: 'ملخص مسير الرواتب والتعويضات',
    nameZh: '薪酬发放与成本汇总',
    description: 'Gross compensation, statutory deductions, net disbursements, and month-over-month variances.',
    category: 'financial',
  },
];

export const reportService = {
  async getReportsList(): Promise<ReportConfig[]> {
    return availableReports;
  },

  async generateReportData(reportId: string, departmentId: string = 'all') {
    let emps: any[] = [];
    try {
      const res = await employeeService.getEmployees({ pageSize: 1000 });
      emps = res?.data || [];
    } catch {
      emps = [];
    }

    if (departmentId !== 'all') {
      emps = emps.filter(e => e.departmentId === departmentId || e.departmentName === departmentId);
    }

    switch (reportId) {
      case 'rep-headcount':
        return {
          title: 'Employee Headcount & Demographics',
          summary: {
            total: emps.length,
            active: emps.filter(e => e.employmentStatus === 'active').length,
            probation: emps.filter(e => e.employmentStatus === 'probation').length,
            onLeave: emps.filter(e => e.employmentStatus === 'on_leave').length,
            male: emps.filter(e => e.gender === 'male').length,
            female: emps.filter(e => e.gender === 'female').length,
            saudiNational: emps.filter(e => e.nationality === 'Saudi').length,
            saudizationRate: `${Math.round((emps.filter(e => e.nationality === 'Saudi').length / (emps.length || 1)) * 100)}%`,
          },
          chartData: [
            { name: 'Active', value: emps.filter(e => e.employmentStatus === 'active').length },
            { name: 'Probation', value: emps.filter(e => e.employmentStatus === 'probation').length },
            { name: 'On Leave', value: emps.filter(e => e.employmentStatus === 'on_leave').length },
            { name: 'Suspended/Other', value: emps.filter(e => e.employmentStatus === 'suspended' || e.employmentStatus === 'terminated').length },
          ],
          tableRows: emps.slice(0, 50).map(e => ({
            id: e.employeeId,
            name: `${e.firstName} ${e.lastName}`,
            department: e.departmentName,
            position: e.positionTitle,
            nationality: e.nationality,
            gender: e.gender,
            status: e.employmentStatus,
            hireDate: e.hireDate,
          })),
        };

      case 'rep-dept-dist':
        const deptStats = mockDepartments.map(d => {
          const count = emps.filter(e => e.departmentId === d.id).length;
          return {
            department: d.name,
            code: d.code,
            headcount: count,
            budget: `SAR ${(d.budget / 1000).toLocaleString()}k`,
            manager: d.managerName,
          };
        });
        return {
          title: 'Employees by Department',
          summary: {
            totalDepartments: mockDepartments.length,
            avgPerDept: Math.round(emps.length / mockDepartments.length),
            largestDept: 'Engineering & Technology',
          },
          chartData: mockDepartments.map(d => ({
            name: d.code,
            headcount: emps.filter(e => e.departmentId === d.id).length,
          })),
          tableRows: deptStats,
        };

      case 'rep-doc-completion':
        const complete = emps.filter(e => e.documentCompletenessPercentage === 100).length;
        const missing = emps.filter(e => e.documentCompletenessPercentage < 100).length;
        return {
          title: 'Document Completion Audit',
          summary: {
            auditedEmployees: emps.length,
            completeFiles: complete,
            missingFiles: missing,
            complianceRate: `${Math.round((complete / (emps.length || 1)) * 100)}%`,
          },
          chartData: [
            { name: '100% Complete', count: complete },
            { name: 'Incomplete / Missing', count: missing },
          ],
          tableRows: emps.slice(0, 50).map(e => ({
            id: e.employeeId,
            name: `${e.firstName} ${e.lastName}`,
            department: e.departmentName,
            completeness: `${e.documentCompletenessPercentage}%`,
            missingCount: e.missingDocumentsCount,
            status: e.documentCompletenessPercentage === 100 ? 'Compliant' : 'Action Required',
          })),
        };

      case 'rep-payroll':
        const currentSum = mockPayrollSummaries[0];
        return {
          title: 'Payroll & Compensation Summary',
          summary: {
            currentPeriod: currentSum.period,
            totalEmployees: currentSum.totalEmployees,
            grossTotal: `SAR ${currentSum.grossTotal.toLocaleString()}`,
            netTotal: `SAR ${currentSum.netTotal.toLocaleString()}`,
            deductionsTotal: `SAR ${currentSum.deductionsTotal.toLocaleString()}`,
          },
          chartData: mockPayrollSummaries.map(s => ({
            period: s.period,
            gross: s.grossTotal / 1000,
            net: s.netTotal / 1000,
          })),
          tableRows: emps.slice(0, 40).map(e => ({
            id: e.employeeId,
            name: `${e.firstName} ${e.lastName}`,
            department: e.departmentName,
            basicSalary: e.basicSalary,
            housing: e.housingAllowance,
            transport: e.transportAllowance,
            gross: e.basicSalary + e.housingAllowance + e.transportAllowance,
            net: Math.round((e.basicSalary + e.housingAllowance + e.transportAllowance) * 0.9025),
          })),
        };

      default:
        return {
          title: 'Standard Enterprise Metric Report',
          summary: {
            totalRecords: emps.length,
            generatedDate: new Date().toISOString().split('T')[0],
          },
          chartData: [
            { name: 'Metric A', count: 120 },
            { name: 'Metric B', count: 80 },
            { name: 'Metric C', count: 65 },
          ],
          tableRows: emps.slice(0, 30).map(e => ({
            id: e.employeeId,
            name: `${e.firstName} ${e.lastName}`,
            department: e.departmentName,
            position: e.positionTitle,
            status: e.employmentStatus,
          })),
        };
    }
  },
};
