import { Employee, EmploymentStatus, EmploymentType, ContractStatus } from '../types';
import { mockDepartments } from './departments';
const realSeedEmployees: any[] = [];

const firstNamesMale = [
  'Mohammed', 'Omar', 'Abdullah', 'Fahad', 'Khalid', 'Tariq', 'Sultan', 'Yousef', 'Ali', 'Majed',
  'Abdulaziz', 'Hamad', 'Ibrahim', 'Saud', 'Nasser', 'Zaid', 'Rayan', 'Bader', 'Hassan', 'Hussain',
  'Ahmed', 'David', 'Alexander', 'Wei', 'Jun', 'Chen', 'Liang', 'Carlos', 'Julian', 'Karim'
];

const firstNamesFemale = [
  'Fatima', 'Sarah', 'Noura', 'Lina', 'Reem', 'Mona', 'Huda', 'Layla', 'Rania', 'Amal',
  'Maha', 'Deema', 'Aisha', 'Salma', 'Jana', 'Dalal', 'Ghadah', 'Dana', 'Noor', 'Mariam',
  'Sophia', 'Emma', 'Mei', 'Ying', 'Ling', 'Xia', 'Elena', 'Yasmin', 'Hind', 'Latifa'
];

const lastNames = [
  'Al-Ghamdi', 'Al-Otaibi', 'Al-Shehri', 'Al-Qahtani', 'Al-Zahrani', 'Al-Harbi', 'Al-Mutairi',
  'Al-Dosari', 'Al-Mansoor', 'Al-Bishi', 'Al-Subaie', 'Al-Shammari', 'Al-Enazi', 'Al-Ruwaili',
  'Al-Saud', 'Al-Hassan', 'Al-Saleh', 'Al-Khatib', 'Chen', 'Zhang', 'Wang', 'Liu', 'Smith',
  'Johnson', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Martin'
];

const arabicFirstNamesMale: Record<string, string> = {
  'Mohammed': 'محمد', 'Omar': 'عمر', 'Abdullah': 'عبدالله', 'Fahad': 'فهد', 'Khalid': 'خالد',
  'Tariq': 'طارق', 'Sultan': 'سلطان', 'Yousef': 'يوسف', 'Ali': 'علي', 'Majed': 'ماجد',
  'Abdulaziz': 'عبدالعزيز', 'Hamad': 'حمد', 'Ibrahim': 'إبراهيم', 'Saud': 'سعود', 'Nasser': 'ناصر',
  'Zaid': 'زيد', 'Rayan': 'ريان', 'Bader': 'بدر', 'Hassan': 'حسن', 'Hussain': 'حسين',
  'Ahmed': 'أحمد', 'David': 'ديفيد', 'Alexander': 'ألكسندر', 'Wei': 'وي', 'Jun': 'جون',
  'Chen': 'تشن', 'Liang': 'ليانغ', 'Carlos': 'كارلوس', 'Julian': 'جوليان', 'Karim': 'كريم'
};

const arabicFirstNamesFemale: Record<string, string> = {
  'Fatima': 'فاطمة', 'Sarah': 'سارة', 'Noura': 'نورة', 'Lina': 'لينا', 'Reem': 'ريم',
  'Mona': 'منى', 'Huda': 'هدى', 'Layla': 'ليلى', 'Rania': 'رانيا', 'Amal': 'أمل',
  'Maha': 'مها', 'Deema': 'ديما', 'Aisha': 'عائشة', 'Salma': 'سلمى', 'Jana': 'جنى',
  'Dalal': 'دلال', 'Ghadah': 'غادة', 'Dana': 'دانة', 'Noor': 'نور', 'Mariam': 'مريم',
  'Sophia': 'صوفيا', 'Emma': 'إيما', 'Mei': 'مي', 'Ying': 'ينغ', 'Ling': 'لينغ',
  'Xia': 'شيا', 'Elena': 'إلينا', 'Yasmin': 'ياسمين', 'Hind': 'هند', 'Latifa': 'لطيفة'
};

const arabicLastNames: Record<string, string> = {
  'Al-Ghamdi': 'الغامدي', 'Al-Otaibi': 'العتيبي', 'Al-Shehri': 'الشهري', 'Al-Qahtani': 'القحطاني',
  'Al-Zahrani': 'الزهراني', 'Al-Harbi': 'الحربي', 'Al-Mutairi': 'المطيري', 'Al-Dosari': 'الدوسري',
  'Al-Mansoor': 'المنصور', 'Al-Bishi': 'البيشي', 'Al-Subaie': 'السبيعي', 'Al-Shammari': 'الشمري',
  'Al-Enazi': 'العنزي', 'Al-Ruwaili': 'الرويلي', 'Al-Saud': 'آل سعود', 'Al-Hassan': 'الحسن',
  'Al-Saleh': 'الصالح', 'Al-Khatib': 'الخطيب', 'Chen': 'تشن', 'Zhang': 'تشانغ', 'Wang': 'وانغ',
  'Liu': 'ليو', 'Smith': 'سميث', 'Johnson': 'جونسون', 'Miller': 'ميلر', 'Davis': 'ديفيس',
  'Wilson': 'ويلسون', 'Anderson': 'أندرسون', 'Taylor': 'تايلور', 'Martin': 'مارتن'
};

const chineseNamesMap: Record<string, string> = {
  'Mohammed': '穆罕默德', 'Sarah': '莎拉', 'Tariq': '塔里克', 'Fatima': '法蒂玛',
  'Omar': '奥马尔', 'Lina': '莉娜', 'Chen': '陈伟', 'Wei': '李伟', 'Jun': '王军',
  'Ying': '张颖', 'Zhang': '张敏', 'David': '大卫', 'Emma': '艾玛'
};

function generateDeterministicEmployees(): Employee[] {
  const list: Employee[] = [];
  const totalCount = 275;

  const managersList = [
    { id: 'emp-001', name: 'Tariq Al-Mansoor', deptId: 'dept-1' },
    { id: 'emp-002', name: 'Sarah Al-Ghamdi', deptId: 'dept-2' },
    { id: 'emp-003', name: 'Fahad Al-Otaibi', deptId: 'dept-3' },
    { id: 'emp-004', name: 'Lina Al-Hassan', deptId: 'dept-4' },
    { id: 'emp-005', name: 'Omar Al-Zahrani', deptId: 'dept-5' },
    { id: 'emp-006', name: 'Mona Al-Shehri', deptId: 'dept-6' },
    { id: 'emp-007', name: 'Abdulaziz Al-Dosari', deptId: 'dept-7' },
    { id: 'emp-008', name: 'Khalid Al-Mutairi', deptId: 'dept-8' },
    { id: 'emp-009', name: 'Reem Al-Qahtani', deptId: 'dept-9' },
    { id: 'emp-010', name: 'Majed Al-Harbi', deptId: 'dept-10' },
    { id: 'emp-011', name: 'Sultan Al-Bishi', deptId: 'dept-11' },
  ];

  // 1. Add Real Seed Employees (32 employees directly from user's sheets)
  realSeedEmployees.forEach((seed, idx) => {
    const i = idx + 1;
    const isInsured = seed.insuranceStatus === 'insured';
    const dept = mockDepartments.find(d => d.name === seed.departmentName) || mockDepartments[0];
    const isFemale = seed.firstName?.toLowerCase().includes('donya') || 
                     seed.firstName?.toLowerCase().includes('maysa') || 
                     seed.firstName?.toLowerCase().includes('sally') || 
                     seed.firstName?.toLowerCase().includes('zeinab') || 
                     seed.firstName?.toLowerCase().includes('wafaa');

    list.push({
      id: `emp-seed-${String(i).padStart(3, '0')}`,
      employeeId: seed.employeeId || `1803010${String(i).padStart(2, '0')}`,
      firstName: seed.firstName || 'Employee',
      lastName: seed.lastName || 'Staff',
      arabicName: seed.arabicName,
      chineseName: isFemale ? '李华' : '王伟',
      email: `${(seed.firstName || 'emp').toLowerCase().replace(/\s+/g, '.')}.${(seed.lastName || 'user').toLowerCase().replace(/\s+/g, '')}@company.com`,
      phone: `+20 10 ${String(10000000 + i * 4321).substring(0, 8)}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed.firstName}-${seed.lastName}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
      nationalId: seed.nationalId || `2900000000000${i}`,
      dateOfBirth: `1985-05-15`,
      gender: isFemale ? 'female' : 'male',
      nationality: 'Egyptian',
      address: 'Cairo, Egypt',
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'Family',
        phone: '+20 11 0000 0000',
      },
      departmentId: dept.id,
      departmentName: seed.departmentName || dept.name,
      positionId: `pos-${i}`,
      positionTitle: seed.positionTitle || 'Specialist',
      chinesePosition: seed.chinesePosition,
      managerId: 'emp-001',
      managerName: 'HR Director',
      employmentStatus: 'active',
      employmentType: 'full_time',
      hireDate: seed.hireDate || '2022-01-01',
      probationEndDate: '2022-04-01',
      workLocation: 'Company Facility',
      basicSalary: isInsured ? 4325.00 : 3500.00,
      housingAllowance: 500,
      transportAllowance: 300,
      contractStatus: 'active',
      documentCompletenessPercentage: seed.documentCompletenessPercentage ?? (isInsured ? 100 : 0),
      missingDocumentsCount: seed.missingDocumentsCount ?? (isInsured ? 0 : 4),
      insuranceStatus: seed.insuranceStatus,
      insuranceNumber: seed.insuranceNumber,
      insuranceSalary: seed.insuranceSalary,
      workerShare: seed.workerShare,
      companyShare: seed.companyShare,
      qualificationCertificateStatus: seed.qualificationCertificateStatus || (isInsured ? 'available' : 'missing'),
      birthCertificateStatus: seed.birthCertificateStatus || (isInsured ? 'available' : 'missing'),
      idCardStatus: seed.idCardStatus || (isInsured ? 'available' : 'missing'),
      contractDocStatus: seed.contractDocStatus || (isInsured ? 'available' : 'missing'),
      documentChecklistStatus: seed.documentChecklistStatus || (isInsured ? 'complete' : 'incomplete'),
    });
  });

  // 2. Generate remaining employees up to 275 total
  // Currently seed has 7 insured. To get 76 insured, we need 69 more insured (indices 33 to 101).
  // The rest (102 to 275) will be not insured (174 employees), giving 25 + 174 = 199 not insured!
  for (let i = list.length + 1; i <= totalCount; i++) {
    const isFemale = i % 3 === 0;
    const fNames = isFemale ? firstNamesFemale : firstNamesMale;
    const arMap = isFemale ? arabicFirstNamesFemale : arabicFirstNamesMale;

    const firstName = fNames[(i * 7) % fNames.length];
    const lastName = lastNames[(i * 11) % lastNames.length];
    const gender = isFemale ? 'female' : 'male';

    const arabicFirst = arMap[firstName] || firstName;
    const arabicLast = arabicLastNames[lastName] || lastName;
    const arabicName = `${arabicFirst} ${arabicLast}`;

    const chineseFirst = chineseNamesMap[firstName] || '明';
    const chineseLast = chineseNamesMap[lastName] || '李';
    const chineseName = `${chineseLast}${chineseFirst}`;

    const dept = mockDepartments[i % mockDepartments.length];
    const matchingPositions = mockPositions.filter(p => p.departmentId === dept.id);
    const position = matchingPositions.length > 0
      ? matchingPositions[i % matchingPositions.length]
      : mockPositions[i % mockPositions.length];

    const manager = managersList.find(m => m.deptId === dept.id) || managersList[0];

    // Statuses
    let employmentStatus: EmploymentStatus = 'active';
    if (i % 35 === 0) employmentStatus = 'suspended';
    else if (i % 20 === 0) employmentStatus = 'on_leave';
    else if (i % 12 === 0) employmentStatus = 'probation';

    let employmentType: EmploymentType = 'full_time';
    if (i % 15 === 0) employmentType = 'contract';

    let contractStatus: ContractStatus = 'active';
    if (i % 18 === 0) contractStatus = 'expiring_soon';

    const yearHired = 2019 + (i % 6);
    const monthHired = String(1 + (i % 12)).padStart(2, '0');
    const dayHired = String(1 + (i % 27)).padStart(2, '0');
    const hireDate = `${yearHired}-${monthHired}-${dayHired}`;

    // Exactly 76 insured (7 from seed + 69 here: i <= 101)
    const isInsured = i <= 101;
    const insuranceStatus: 'insured' | 'not_insured' = isInsured ? 'insured' : 'not_insured';

    const documentCompletenessPercentage = isInsured ? 100 : (i % 2 === 0 ? 50 : 25);
    const missingDocumentsCount = isInsured ? 0 : (i % 2 === 0 ? 2 : 3);

    const empIdPadded = String(i).padStart(4, '0');
    const id = `emp-${empIdPadded}`;
    const employeeId = `180301${String(i).padStart(3, '0')}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}${i > 50 ? i : ''}@enterprise.com`;
    const phone = `+20 1${String((i * 1234567) % 90000000 + 10000000).substring(0, 8)}`;
    const nationalId = `2${String(8000000000000 + (i * 9876543) % 19999999999)}`;

    const basicSalary = isInsured ? 4325.00 : 3800.00;
    const housingAllowance = 500;
    const transportAllowance = 300;

    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}-${lastName}-${i}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

    list.push({
      id,
      employeeId,
      firstName,
      lastName,
      arabicName,
      chineseName,
      email,
      phone,
      avatar,
      nationalId,
      dateOfBirth: `${1980 + (i % 20)}-${String(1 + ((i * 3) % 12)).padStart(2, '0')}-15`,
      gender,
      nationality: 'Egyptian',
      address: `Cairo, Egypt`,
      emergencyContact: {
        name: isFemale ? `Abdullah ${lastName}` : `Noura ${lastName}`,
        relationship: 'Spouse',
        phone: `+20 10 ${String(2000000 + i * 3).substring(0, 7)}`,
      },
      departmentId: dept.id,
      departmentName: dept.name,
      positionId: position.id,
      positionTitle: position.title,
      chinesePosition: position.titleZh ? `${position.titleZh} - ${position.title}` : position.title,
      managerId: manager.id === id ? undefined : manager.id,
      managerName: manager.name,
      employmentStatus,
      employmentType,
      hireDate,
      probationEndDate: `${yearHired}-${String(Math.min(12, Number(monthHired) + 3)).padStart(2, '0')}-${dayHired}`,
      workLocation: dept.location,
      basicSalary,
      housingAllowance,
      transportAllowance,
      contractStatus,
      documentCompletenessPercentage,
      missingDocumentsCount,
      insuranceStatus,
      insuranceNumber: isInsured ? `${20000000 + i * 317}` : undefined,
      insuranceSalary: isInsured ? 4325.00 : undefined,
      workerShare: isInsured ? 475.85 : undefined,
      companyShare: isInsured ? 811.13 : undefined,
      qualificationCertificateStatus: isInsured ? 'available' : 'missing',
      birthCertificateStatus: isInsured ? 'available' : (i % 2 === 0 ? 'available' : 'missing'),
      idCardStatus: isInsured ? 'available' : (i % 3 === 0 ? 'available' : 'missing'),
      contractDocStatus: isInsured ? 'available' : 'missing',
      documentChecklistStatus: isInsured ? 'complete' : 'incomplete',
    });
  }

  return list;
}

export const mockEmployees: Employee[] = generateDeterministicEmployees();
