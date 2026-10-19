import { DocumentRecord, DocumentType, DocumentStatus } from '../types';
import { mockEmployees } from './employees';

const docTypeTitles: Record<DocumentType, string> = {
  national_id: 'National Identification / Iqama',
  birth_certificate: 'Birth Certificate',
  qualification: 'Educational Degree / Qualification Certificate',
  contract: 'Signed Employment Agreement',
  insurance: 'GOSI / Medical Insurance Card',
  passport: 'Passport Copy',
  medical: 'Pre-Employment Medical Fitness Report',
  other: 'Background Check & Police Clearance',
};

function generateDocuments(): DocumentRecord[] {
  const docs: DocumentRecord[] = [];
  const types: DocumentType[] = [
    'national_id',
    'qualification',
    'contract',
    'insurance',
    'birth_certificate',
    'medical',
  ];

  mockEmployees.slice(0, 100).forEach((emp, empIdx) => {
    types.forEach((type, typeIdx) => {
      const docId = `doc-${emp.id}-${type}`;
      let status: DocumentStatus = 'verified';

      if (empIdx % 7 === 0 && typeIdx === 1) {
        status = 'missing';
      } else if (empIdx % 5 === 0 && typeIdx === 0) {
        status = 'under_review';
      } else if (empIdx % 12 === 0 && typeIdx === 2) {
        status = 'rejected';
      } else if (empIdx % 15 === 0 && typeIdx === 3) {
        status = 'expired';
      } else if (empIdx % 9 === 0 && typeIdx === 4) {
        status = 'uploaded';
      }

      docs.push({
        id: docId,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.departmentName,
        type,
        title: docTypeTitles[type],
        fileName: `${emp.employeeId}_${type.toUpperCase()}.pdf`,
        fileSize: `${(1.2 + (typeIdx * 0.4)).toFixed(1)} MB`,
        status,
        expiryDate: status === 'expired' ? '2026-02-15' : '2028-12-31',
        uploadedAt: status !== 'missing' ? '2025-11-10' : undefined,
        verifiedAt: status === 'verified' ? '2025-11-12' : undefined,
        verifiedBy: status === 'verified' ? 'Sarah Al-Ghamdi (HR Ops)' : undefined,
        notes: status === 'rejected' ? 'Document scan was blurry. Signature missing on page 3.' : 'Verified against civil registry portal.',
        rejectionReason: status === 'rejected' ? 'Image quality unreadable. Please re-upload high resolution PDF.' : undefined,
      });
    });
  });

  return docs;
}

export const mockDocuments: DocumentRecord[] = generateDocuments();
