import { Position } from '../types';

export const mockPositions: Position[] = [
  // Engineering
  { id: 'pos-01', code: 'ENG-DIR', title: 'Director of Engineering', titleAr: 'مدير عام الهندسة', titleZh: '工程总监', departmentId: 'dept-1', departmentName: 'Engineering & Technology', minSalary: 38000, maxSalary: 52000, level: 'Director' },
  { id: 'pos-02', code: 'ENG-TL', title: 'Lead Software Architect', titleAr: 'كبير مهندسي البرمجيات', titleZh: '首席软件架构师', departmentId: 'dept-1', departmentName: 'Engineering & Technology', minSalary: 28000, maxSalary: 38000, level: 'Lead' },
  { id: 'pos-03', code: 'ENG-SR', title: 'Senior Full Stack Engineer', titleAr: 'مهندس برمجيات أول', titleZh: '高级全栈工程师', departmentId: 'dept-1', departmentName: 'Engineering & Technology', minSalary: 20000, maxSalary: 28000, level: 'Senior' },
  { id: 'pos-04', code: 'ENG-MID', title: 'Full Stack Engineer', titleAr: 'مهندس برمجيات', titleZh: '全栈工程师', departmentId: 'dept-1', departmentName: 'Engineering & Technology', minSalary: 14000, maxSalary: 19000, level: 'Mid' },
  { id: 'pos-05', code: 'ENG-DEVOPS', title: 'DevOps & Cloud Engineer', titleAr: 'مهندس ديف أوبس وحوسبة سحابية', titleZh: 'DevOps与云架构师', departmentId: 'dept-1', departmentName: 'Engineering & Technology', minSalary: 18000, maxSalary: 26000, level: 'Senior' },
  { id: 'pos-06', code: 'ENG-SEC', title: 'Cybersecurity Specialist', titleAr: 'أخصائي أمن سيبراني', titleZh: '网络安全专家', departmentId: 'dept-1', departmentName: 'Engineering & Technology', minSalary: 19000, maxSalary: 27000, level: 'Senior' },
  { id: 'pos-07', code: 'ENG-DATA', title: 'Senior Data Engineer', titleAr: 'مهندس بيانات أول', titleZh: '高级数据工程师', departmentId: 'dept-1', departmentName: 'Engineering & Technology', minSalary: 21000, maxSalary: 29000, level: 'Senior' },

  // HR
  { id: 'pos-08', code: 'HR-DIR', title: 'HR Director', titleAr: 'مدير عام الموارد البشرية', titleZh: '人力资源总监', departmentId: 'dept-2', departmentName: 'Human Resources', minSalary: 32000, maxSalary: 45000, level: 'Director' },
  { id: 'pos-09', code: 'HR-OPS', title: 'HR Operations Manager', titleAr: 'مدير عمليات الموارد البشرية', titleZh: '人事运营经理', departmentId: 'dept-2', departmentName: 'Human Resources', minSalary: 20000, maxSalary: 27000, level: 'Manager' },
  { id: 'pos-10', code: 'HR-REC', title: 'Talent Acquisition Lead', titleAr: 'رئيس قسم استقطاب الكفاءات', titleZh: '人才招聘主管', departmentId: 'dept-2', departmentName: 'Human Resources', minSalary: 16000, maxSalary: 22000, level: 'Lead' },
  { id: 'pos-11', code: 'HR-SPEC', title: 'HR Specialist', titleAr: 'أخصائي موارد بشرية', titleZh: '人力资源专员', departmentId: 'dept-2', departmentName: 'Human Resources', minSalary: 11000, maxSalary: 16000, level: 'Mid' },
  { id: 'pos-12', code: 'HR-PAY', title: 'Payroll & Benefits Officer', titleAr: 'مسؤول الرواتب والمزايا', titleZh: '薪酬与福利专员', departmentId: 'dept-2', departmentName: 'Human Resources', minSalary: 13000, maxSalary: 18000, level: 'Mid' },

  // Finance
  { id: 'pos-13', code: 'FIN-CFO', title: 'Chief Financial Officer', titleAr: 'المدير المالي التنفيذي', titleZh: '首席财务官', departmentId: 'dept-3', departmentName: 'Finance & Accounting', minSalary: 42000, maxSalary: 60000, level: 'Executive' },
  { id: 'pos-14', code: 'FIN-MNGR', title: 'Finance Manager', titleAr: 'مدير مالي', titleZh: '财务经理', departmentId: 'dept-3', departmentName: 'Finance & Accounting', minSalary: 25000, maxSalary: 34000, level: 'Manager' },
  { id: 'pos-15', code: 'FIN-SR-ACC', title: 'Senior Accountant', titleAr: 'محاسب أول', titleZh: '高级会计师', departmentId: 'dept-3', departmentName: 'Finance & Accounting', minSalary: 15000, maxSalary: 21000, level: 'Senior' },
  { id: 'pos-16', code: 'FIN-ACC', title: 'Financial Analyst', titleAr: 'محلل مالي', titleZh: '财务分析师', departmentId: 'dept-3', departmentName: 'Finance & Accounting', minSalary: 12000, maxSalary: 17000, level: 'Mid' },

  // Product & Design
  { id: 'pos-17', code: 'PROD-VP', title: 'VP of Product', titleAr: 'نائب رئيس المنتجات', titleZh: '产品副总裁', departmentId: 'dept-4', departmentName: 'Product & Design', minSalary: 36000, maxSalary: 50000, level: 'Executive' },
  { id: 'pos-18', code: 'PROD-SR', title: 'Senior Product Manager', titleAr: 'مدير منتج أول', titleZh: '高级产品经理', departmentId: 'dept-4', departmentName: 'Product & Design', minSalary: 24000, maxSalary: 32000, level: 'Senior' },
  { id: 'pos-19', code: 'PROD-UX', title: 'Lead Product Designer (UX/UI)', titleAr: 'كبير مصممي تجربة المستخدم', titleZh: '首席UX/UI设计师', departmentId: 'dept-4', departmentName: 'Product & Design', minSalary: 21000, maxSalary: 28000, level: 'Lead' },
  { id: 'pos-20', code: 'PROD-UI', title: 'UI/UX Designer', titleAr: 'مصمم واجهات وتجربة المستخدم', titleZh: 'UI/UX设计师', departmentId: 'dept-4', departmentName: 'Product & Design', minSalary: 13000, maxSalary: 18000, level: 'Mid' },

  // Sales
  { id: 'pos-21', code: 'SALES-DIR', title: 'Sales Director', titleAr: 'مدير عام المبيعات', titleZh: '销售总监', departmentId: 'dept-5', departmentName: 'Commercial Sales', minSalary: 30000, maxSalary: 45000, level: 'Director' },
  { id: 'pos-22', code: 'SALES-AM', title: 'Enterprise Account Executive', titleAr: 'مدير حسابات كبرى', titleZh: '大客户经理', departmentId: 'dept-5', departmentName: 'Commercial Sales', minSalary: 16000, maxSalary: 25000, level: 'Senior' },
  { id: 'pos-23', code: 'SALES-REP', title: 'Business Development Specialist', titleAr: 'أخصائي تطوير أعمال', titleZh: '业务拓展专员', departmentId: 'dept-5', departmentName: 'Commercial Sales', minSalary: 10000, maxSalary: 15000, level: 'Mid' },

  // Marketing
  { id: 'pos-24', code: 'MKTG-DIR', title: 'Head of Marketing', titleAr: 'رئيس قسم التسويق', titleZh: '市场总监', departmentId: 'dept-6', departmentName: 'Marketing & Brand', minSalary: 28000, maxSalary: 38000, level: 'Manager' },
  { id: 'pos-25', code: 'MKTG-SPEC', title: 'Digital Marketing Strategist', titleAr: 'أخصائي تسويق رقمي', titleZh: '数字营销策略师', departmentId: 'dept-6', departmentName: 'Marketing & Brand', minSalary: 13000, maxSalary: 18000, level: 'Mid' },
  { id: 'pos-26', code: 'MKTG-CONT', title: 'Content & PR Specialist', titleAr: 'أخصائي محتوى وعلاقات عامة', titleZh: '内容与公关专员', departmentId: 'dept-6', departmentName: 'Marketing & Brand', minSalary: 11000, maxSalary: 16000, level: 'Mid' },

  // Legal
  { id: 'pos-27', code: 'LEG-HEAD', title: 'General Legal Counsel', titleAr: 'المستشار القانوني العام', titleZh: '总法律顾问', departmentId: 'dept-7', departmentName: 'Legal & Compliance', minSalary: 35000, maxSalary: 48000, level: 'Director' },
  { id: 'pos-28', code: 'LEG-ADV', title: 'Compliance Officer', titleAr: 'مسؤول الالتزام والامتثال', titleZh: '合规官', departmentId: 'dept-7', departmentName: 'Legal & Compliance', minSalary: 17000, maxSalary: 23000, level: 'Senior' },

  // Operations
  { id: 'pos-29', code: 'OPS-DIR', title: 'Operations Director', titleAr: 'مدير عام العمليات', titleZh: '运营总监', departmentId: 'dept-8', departmentName: 'Operations & Facilities', minSalary: 30000, maxSalary: 42000, level: 'Director' },
  { id: 'pos-30', code: 'OPS-LOG', title: 'Logistics Supervisor', titleAr: 'مشرف خدمات لوجستية', titleZh: '物流主管', departmentId: 'dept-8', departmentName: 'Operations & Facilities', minSalary: 12000, maxSalary: 17000, level: 'Lead' },
  { id: 'pos-31', code: 'OPS-FAC', title: 'Facilities Coordinator', titleAr: 'منسق مرافق وخدمات', titleZh: '设施协调员', departmentId: 'dept-8', departmentName: 'Operations & Facilities', minSalary: 9000, maxSalary: 13000, level: 'Junior' },

  // CS
  { id: 'pos-32', code: 'CS-HEAD', title: 'Customer Success Director', titleAr: 'مدير عام خدمة ورعاية العملاء', titleZh: '客户成功总监', departmentId: 'dept-9', departmentName: 'Customer Success', minSalary: 26000, maxSalary: 36000, level: 'Director' },
  { id: 'pos-33', code: 'CS-SPEC', title: 'Senior Client Partner', titleAr: 'مسؤول شركاء أول', titleZh: '高级客户伙伴', departmentId: 'dept-9', departmentName: 'Customer Success', minSalary: 13000, maxSalary: 18000, level: 'Senior' },

  // QA
  { id: 'pos-34', code: 'QA-LEAD', title: 'Quality Assurance Lead', titleAr: 'رئيس قسم ضمان الجودة', titleZh: '质量保证主管', departmentId: 'dept-10', departmentName: 'Quality & Governance', minSalary: 20000, maxSalary: 27000, level: 'Lead' },
  { id: 'pos-35', code: 'QA-ENG', title: 'QA Automation Engineer', titleAr: 'مهندس أتمتة الجودة', titleZh: 'QA自动化工程师', departmentId: 'dept-10', departmentName: 'Quality & Governance', minSalary: 13000, maxSalary: 18000, level: 'Mid' },

  // Procurement
  { id: 'pos-36', code: 'PROC-MGR', title: 'Procurement Specialist', titleAr: 'أخصائي مشتريات وتعاقدات', titleZh: '采购专员', departmentId: 'dept-11', departmentName: 'Procurement & Supply Chain', minSalary: 12000, maxSalary: 17000, level: 'Mid' },
];
