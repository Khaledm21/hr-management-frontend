import { InsuranceItem, DocumentStatus, SocialInsuranceRecord, MissingDocumentRecord } from '../types';
import { mockEmployees } from './employees';
import { realSeedSocialInsurance } from './realExcelData';

function generateInsuranceItems(): InsuranceItem[] {
  return mockEmployees.map((emp) => {
    const isInsured = emp.insuranceStatus === 'insured';
    const nationalIdStatus: DocumentStatus = isInsured ? 'verified' : (emp.idCardStatus === 'available' ? 'verified' : 'missing');
    const birthCertStatus: DocumentStatus = isInsured ? 'verified' : (emp.birthCertificateStatus === 'available' ? 'verified' : 'missing');
    const qualificationStatus: DocumentStatus = isInsured ? 'verified' : (emp.qualificationCertificateStatus === 'available' ? 'verified' : 'missing');
    const contractStatus: DocumentStatus = isInsured ? 'verified' : (emp.contractDocStatus === 'available' ? 'verified' : 'missing');

    const missingList: string[] = [];
    if (nationalIdStatus === 'missing') missingList.push('ID Card');
    if (birthCertStatus === 'missing') missingList.push('Birth Certificate');
    if (qualificationStatus === 'missing') missingList.push('Qualification Certificate');
    if (contractStatus === 'missing') missingList.push('Contract');

    let insuranceStatus: 'complete' | 'missing' | 'under_review' = 'complete';
    if (missingList.length > 0) {
      insuranceStatus = 'missing';
    } else if (!isInsured) {
      insuranceStatus = 'under_review';
    }

    return {
      id: `ins-${emp.id}`,
      employeeId: emp.id,
      employeeCode: emp.employeeId,
      employeeName: emp.arabicName || `${emp.firstName} ${emp.lastName}`,
      department: emp.departmentName,
      nationalIdStatus,
      birthCertStatus,
      qualificationStatus,
      contractStatus,
      insuranceStatus,
      missingDocuments: missingList,
      lastUpdated: '2026-03-28',
    };
  });
}

export const mockInsuranceRecords: InsuranceItem[] = generateInsuranceItems();

// Social Insurance (September) - matching the user's second sheet
function generateSocialInsuranceRecords(): SocialInsuranceRecord[] {
  // Start with the exact 44 extracted rows from screenshot 2
  const records: SocialInsuranceRecord[] = [...realSeedSocialInsurance];

  // Fill up remaining until we have exactly 76 Found + 32 Not Found = 108 records total
  const currentFoundCount = records.filter(r => r.employeeListStatus === 'found').length;
  const currentNotFoundCount = records.filter(r => r.employeeListStatus === 'not_found').length;

  const targetFound = 76;
  const targetNotFound = 32;

  // Add remaining not found if needed
  let notFoundAdded = currentNotFoundCount;
  while (notFoundAdded < targetNotFound) {
    notFoundAdded++;
    const sNo = records.length + 1;
    records.push({
      id: `soc-${sNo}`,
      serialNo: sNo,
      nationalId: `28${String(100000000000 + notFoundAdded * 9876543).substring(0, 12)}`,
      employeeName: `Ex-Employee Unlinked ${notFoundAdded}`,
      department: notFoundAdded % 2 === 0 ? 'PD' : 'SD',
      insuranceNumber: `${80000000 + notFoundAdded * 123}`,
      insuranceSalary: 4325.00,
      workerShare: 475.85,
      companyShare: 811.13,
      totalContribution: 1286.98,
      note: 'Start:2024-01-01',
      employeeListStatus: 'not_found',
    });
  }

  // Add remaining found from insured employees in mockEmployees
  const insuredEmployees = mockEmployees.filter(e => e.insuranceStatus === 'insured');
  let foundAdded = currentFoundCount;
  for (const emp of insuredEmployees) {
    if (foundAdded >= targetFound) break;
    // check if already in records
    const exists = records.some(r => r.nationalId === emp.nationalId || (emp.employeeId && r.employeeCode === emp.employeeId));
    if (!exists) {
      foundAdded++;
      const sNo = records.length + 1;
      records.push({
        id: `soc-${sNo}`,
        serialNo: sNo,
        nationalId: emp.nationalId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.departmentName,
        insuranceNumber: emp.insuranceNumber || `${50000000 + sNo * 777}`,
        insuranceSalary: 4325.00,
        workerShare: 475.85,
        companyShare: 811.13,
        totalContribution: 1286.98,
        note: `Start:${emp.hireDate}`,
        employeeListStatus: 'found',
        employeeCode: emp.employeeId,
      });
    }
  }

  return records;
}

export const mockSocialInsuranceRecords: SocialInsuranceRecord[] = generateSocialInsuranceRecords();

// Missing Documents sheet - matching the user's third sheet
function generateMissingDocumentRecords(): MissingDocumentRecord[] {
  const missingEmps = mockEmployees.filter(
    e => e.insuranceStatus === 'not_insured' || e.documentChecklistStatus === 'incomplete'
  );

  return missingEmps.map((emp, idx) => {
    const qual = emp.qualificationCertificateStatus || 'missing';
    const birth = emp.birthCertificateStatus || 'missing';
    const id = emp.idCardStatus || 'missing';
    const cont = emp.contractDocStatus || 'missing';

    let count = 0;
    if (qual === 'missing') count++;
    if (birth === 'missing') count++;
    if (id === 'missing') count++;
    if (cont === 'missing') count++;

    return {
      id: `doc-${emp.id}`,
      serialNo: idx + 1,
      department: emp.departmentName,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      nationalId: emp.nationalId,
      position: emp.chinesePosition || emp.positionTitle,
      startDate: emp.hireDate,
      resignationDate: emp.resignationDate,
      employeeCode: emp.employeeId,
      insuranceStatus: emp.insuranceStatus || 'not_insured',
      qualificationCert: qual,
      birthCert: birth,
      idCard: id,
      contract: cont,
      missingCount: count,
      notes: count === 4 ? 'All documents missing' : `${count} document(s) pending`,
      status: count === 0 ? 'complete' : 'incomplete',
    };
  });
}

export const mockMissingDocumentRecords: MissingDocumentRecord[] = generateMissingDocumentRecords();
