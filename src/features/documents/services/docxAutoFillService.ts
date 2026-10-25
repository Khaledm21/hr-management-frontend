import JSZip from 'jszip';
import { numberToArabicWords } from '../../../lib/tafqeet';

export interface SalarySlipFillData {
  employeeName: string;
  nationalId: string;
  jobTitle: string;
  salary: number;
  salaryWords?: string;
  hireDate?: string;
  issueDate?: string;
}

export interface ClearanceFillData {
  employeeName: string;
  nationalId: string;
  address?: string;
  issueDate?: string;
}

export interface ResignationFillData {
  employeeName: string;
  nationalId: string;
  department?: string;
  jobTitle?: string;
  hireDate?: string;
  resignationDate?: string;
  issueDate?: string;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Format date to Egyptian standard DD/MM/YYYY
 */
export function formatToEgyptianDate(dateStr?: string | null): string {
  if (!dateStr) {
    const today = new Date();
    return `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

/**
 * Auto-fill Salary Certificate / Pay Slip Word template
 */
export async function generateFilledSalarySlip(data: SalarySlipFillData): Promise<Blob> {
  const response = await fetch('/templates/salary_slip_template.docx');
  if (!response.ok) {
    throw new Error('فشل تحميل قالب مفردات المرتب');
  }
  const arrayBuffer = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  let xml = await zip.file('word/document.xml')?.async('text');
  if (!xml) {
    throw new Error('ملف الوورد غير صالح أو تالف');
  }

  const empName = data.employeeName.trim();
  const nationalId = data.nationalId.trim();
  const jobTitle = data.jobTitle.trim() || 'موظف';
  const salaryNum = data.salary.toLocaleString('en-US');
  const salaryWords = data.salaryWords?.trim() || numberToArabicWords(data.salary);
  const hireDate = formatToEgyptianDate(data.hireDate);
  const issueDate = formatToEgyptianDate(data.issueDate);

  // 1. Replace Employee Name in Paragraph 1 (preserves bold and underline XML formatting)
  const nameBlockRegex = /<w:r w:rsidRPr="0078715E"><w:rPr><w:b\/><w:bCs\/><w:sz w:val="28"\/><w:szCs w:val="32"\/><w:u w:val="single"\/><w:rtl\/><\/w:rPr><w:t xml:space="preserve">أحمد مجدي السيد <\/w:t>[\s\S]*?<w:t>بصلة<\/w:t><\/w:r>/;
  if (nameBlockRegex.test(xml)) {
    xml = xml.replace(
      nameBlockRegex,
      `<w:r w:rsidRPr="0078715E"><w:rPr><w:b/><w:bCs/><w:sz w:val="28"/><w:szCs w:val="32"/><w:u w:val="single"/><w:rtl/></w:rPr><w:t xml:space="preserve">${empName}</w:t></w:r>`
    );
  } else {
    xml = xml.replace('أحمد مجدي السيد السيد بصلة', empName);
  }

  // 2. Replace National ID
  xml = xml.replace('29601011106831', nationalId);

  // 3. Replace Job Title
  xml = xml.replace('مندوب مبيعات', jobTitle);

  // 4. Replace Salary Number
  xml = xml.replace('14,000', salaryNum);

  // 5. Replace Salary Words
  xml = xml.replace('أربعة عشر ألف جنيه مصري فقط لا غير', salaryWords);

  // 6. Replace Hire Date
  const hireDateRegex = /<w:t>1<\/w:t><\/w:r><w:r w:rsidRPr="0078715E"><w:rPr><w:rFonts w:hint="cs"\/><w:b\/><w:bCs\/><w:sz w:val="32"\/><w:szCs w:val="32"\/><w:rtl\/><\/w:rPr><w:t>\/9\/2025<\/w:t>/;
  if (hireDateRegex.test(xml)) {
    xml = xml.replace(hireDateRegex, `<w:t>${hireDate}</w:t>`);
  } else {
    xml = xml.replace('1/9/2025', hireDate);
  }

  // 7. Replace Issue Date
  const issueDateRegex = /<w:t>29<\/w:t>[\s\S]*?<w:t>2026<\/w:t>/;
  if (issueDateRegex.test(xml)) {
    xml = xml.replace(issueDateRegex, `<w:t>${issueDate}</w:t>`);
  } else {
    xml = xml.replace('29/9/2026', issueDate);
  }

  zip.file('word/document.xml', xml);
  const generatedBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  const fileName = `مفردات مرتب - ${empName} - ${issueDate.replace(/\//g, '-')}.docx`;
  triggerBlobDownload(generatedBlob, fileName);
  return generatedBlob;
}

/**
 * Auto-fill Employee Clearance & Asset Handover Word template
 */
export async function generateFilledClearanceForm(data: ClearanceFillData): Promise<Blob> {
  const response = await fetch('/templates/clearance_form.docx');
  if (!response.ok) {
    throw new Error('فشل تحميل قالب إخلاء الطرف');
  }
  const arrayBuffer = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  let xml = await zip.file('word/document.xml')?.async('text');
  if (!xml) {
    throw new Error('ملف الوورد غير صالح أو تالف');
  }

  const empName = data.employeeName.trim();
  const nationalId = data.nationalId.trim();
  const address = data.address?.trim() || 'جمهورية مصر العربية';
  const issueDate = formatToEgyptianDate(data.issueDate);

  // Exact replacement in XML text runs
  xml = xml.replace('أقر أنا : .....................................................................', `أقر أنا : ${empName}`);
  xml = xml.replace('المقيم فى : ................................................................', `المقيم فى : ${address}`);
  xml = xml.replace('رقم قومى : .................................................................', `رقم قومى : ${nationalId}`);
  xml = xml.replace('الأسم :...............................', `الأسم : ${empName}`);
  xml = xml.replace('تحرير فى :     /         /', `تحرير فى : ${issueDate.replace(/\//g, ' / ')}`);

  zip.file('word/document.xml', xml);
  const generatedBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  const fileName = `إخلاء طرف - ${empName} - ${issueDate.replace(/\//g, '-')}.docx`;
  triggerBlobDownload(generatedBlob, fileName);
  return generatedBlob;
}

/**
 * Auto-fill Resignation Form & Clearance Procedures Word template
 */
export async function generateFilledResignationForm(data: ResignationFillData): Promise<Blob> {
  const response = await fetch('/templates/resignation_form.docx');
  if (!response.ok) {
    throw new Error('فشل تحميل قالب الاستقالة');
  }
  const arrayBuffer = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  let xml = await zip.file('word/document.xml')?.async('text');
  if (!xml) {
    throw new Error('ملف الوورد غير صالح أو تالف');
  }

  const empName = data.employeeName.trim();
  const nationalId = data.nationalId.trim();
  const dept = data.department?.trim() || '';
  const jobTitle = data.jobTitle?.trim() || '';
  const issueDate = formatToEgyptianDate(data.issueDate);
  const hireDate = formatToEgyptianDate(data.hireDate);
  const resignationDate = formatToEgyptianDate(data.resignationDate || data.issueDate);

  // 1. Applicant name & signature placeholder
  xml = xml.replace('مقدم الطلب :', `مقدم الطلب : ${empName}`);

  // 2. ID card and resignation notification section
  const idRegex = /رقم البطاقة :                                      ، أنني قد تقدمت بطلب إستقالة/;
  if (idRegex.test(xml)) {
    xml = xml.replace(
      idRegex,
      `رقم البطاقة : ${nationalId} ، أنني قد تقدمت بطلب إستقالة`
    );
  }

  // 3. Employee Name / Dept / Job Title table header
  const infoHeaderRegex = /员工姓名اسم الموظف                     部  门القسم                      职位الوظيفة：/;
  if (infoHeaderRegex.test(xml)) {
    xml = xml.replace(
      infoHeaderRegex,
      `员工姓名اسم الموظف: ${empName} | 部  门القسم: ${dept} | 职位الوظيفة: ${jobTitle}`
    );
  }

  // 4. Dates
  const datesHeaderRegex = /入职日期تاريخ دخول الشركة                离职时间تاريخ الاستقالة/;
  if (datesHeaderRegex.test(xml)) {
    xml = xml.replace(
      datesHeaderRegex,
      `入职日期تاريخ دخول الشركة: ${hireDate} | 离职时间تاريخ الاستقالة: ${resignationDate}`
    );
  }

  zip.file('word/document.xml', xml);
  const generatedBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  const fileName = `استمارة استقالة وإجراءات إنهاء خدمة - ${empName}.docx`;
  triggerBlobDownload(generatedBlob, fileName);
  return generatedBlob;
}
