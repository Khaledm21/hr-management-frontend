import React, { useEffect, useState } from 'react';
import { Employee } from '../../../../types';
import { generateEmployeeQRCode } from '../../services/badgeQrService';
import logoImg from '../../../../assets/new-hope-logo.png';
import { CheckCircle2, User, Phone, Shield } from 'lucide-react';

export interface EmployeeBadgeCardProps {
  employee: Employee;
  orientation?: 'vertical' | 'horizontal';
  showSide?: 'front' | 'back' | 'both';
  validUntil?: string;
  scale?: number;
  printMode?: boolean;
}

const ARABIC_DEPT_TRANSLATIONS: Record<string, string> = {
  'الموارد البشرية والشؤون الإدارية': 'HUMAN RESOURCES',
  'قطاع الإنتاج والتشغيل': 'PRODUCTION UNIT',
  'مبيعات قطاع الأسماك': 'SALES DEPT - FISH',
  'مبيعات قطاع الدواجن': 'SALES DEPT - POULTRY',
  'الإدارة المالية والحسابات': 'FINANCE DEPARTMENT',
  'رقابة الجودة والمعامل': 'QUALITY CONTROL',
  'إدارة إنتاج الأسماك': 'PRODUCTION DEPT - FISH',
  'إدارة إنتاج الدواجن': 'PRODUCTION DEPT - POULTRY',
  'إدارة الإنتاج والتصنيع': 'PRODUCTION DEPARTMENT',
};

const ARABIC_POS_TRANSLATIONS: Record<string, string> = {
  'مسؤول توظيف وتعيينات 2': 'Recruitment Specialist 2',
  'مشرف إداري 1': 'Supervisor 1',
  'كاتب شؤون إدارية 2': 'Administrative Clerk 2',
  'مشرف حركة وسائقين': 'Driver Team Leader',
  'مشرف أمن وحراسة': 'Security Team Leader',
  'مشرف وردية أمن': 'Security Supervisor',
  'فرد أمن وحراسة': 'Security Guard',
  'عامل خدمات ونظافة': 'Cleaner',
  'مساعد خدمات مطبخ': 'Kitchen Assistant',
  'فرد حراسة خارجية': 'External Security Guard',
  'موظف من ذوي الهمم (نسبة 5%)': 'Employee with Disability',
  'محامي ومستشار شؤون قانونية': 'Lawyer',
  'مستشار إداري وقانوني': 'Consultant',
};

function resolveEnglishDepartment(dept?: string): string {
  if (!dept) return 'OPERATIONS';
  const trimmed = dept.trim();
  if (ARABIC_DEPT_TRANSLATIONS[trimmed]) return ARABIC_DEPT_TRANSLATIONS[trimmed];
  for (const [ar, en] of Object.entries(ARABIC_DEPT_TRANSLATIONS)) {
    if (trimmed.includes(ar)) return en;
  }
  return trimmed.toUpperCase();
}

function resolveEnglishPosition(pos?: string): string {
  if (!pos) return 'Specialist';
  const trimmed = pos.trim();
  if (ARABIC_POS_TRANSLATIONS[trimmed]) return ARABIC_POS_TRANSLATIONS[trimmed];
  for (const [ar, en] of Object.entries(ARABIC_POS_TRANSLATIONS)) {
    if (trimmed.includes(ar)) return en;
  }
  return trimmed;
}

export const EmployeeBadgeCard: React.FC<EmployeeBadgeCardProps> = ({
  employee,
  orientation = 'vertical',
  showSide = 'front',
  validUntil = '2027/12/31',
  scale = 1,
  printMode = false,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const fullNameEn = `${employee.firstName} ${employee.lastName}`.trim().toUpperCase();
  const chineseName = employee.chineseName || '';
  const positionTitle = resolveEnglishPosition(employee.positionTitle);
  const chinesePosition = employee.chinesePosition || '';
  const departmentName = resolveEnglishDepartment(employee.departmentName);
  const employeeCode = employee.employeeId || 'NH-001';

  useEffect(() => {
    generateEmployeeQRCode({
      id: employee.id,
      employeeId: employeeCode,
      name: fullNameEn,
      department: departmentName,
    }).then(setQrCodeUrl);
  }, [employee.id, employeeCode, fullNameEn, departmentName]);

  // ==========================================
  // 1. VERTICAL FRONT (54mm x 85.6mm)
  // ==========================================
  const renderFrontVertical = () => (
    <div
      id={`badge-front-${employee.id}`}
      className="badge-card-container relative bg-white text-slate-800 flex flex-col justify-between overflow-hidden shadow-md print:shadow-none border border-slate-300 print:border-slate-400 select-none"
      style={{
        width: '54mm',
        height: '85.6mm',
        minWidth: '54mm',
        minHeight: '85.6mm',
        maxWidth: '54mm',
        maxHeight: '85.6mm',
        borderRadius: printMode ? '2.5mm' : '12px',
        boxSizing: 'border-box',
        direction: 'ltr',
      }}
    >
      {/* Top Lanyard Slot Guide (Preview only) */}
      {!printMode && (
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-slate-200 rounded-full z-20 pointer-events-none" />
      )}

      {/* Decorative Top Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 p-2.5 pt-3 text-white text-center relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xs pointer-events-none" />
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <div className="w-6 h-6 rounded-full bg-white p-0.5 shadow-xs flex items-center justify-center shrink-0">
            <img src={logoImg} alt="New Hope" className="w-full h-full object-contain" />
          </div>
          <span className="text-[10px] font-black tracking-tight leading-none font-sans">
            新希望埃及水产科技
          </span>
        </div>
        <p className="text-[6px] font-bold text-emerald-100 font-sans tracking-wider uppercase leading-none">
          NEW HOPE EGYPT AQUATIC TECH CO., LTD.
        </p>
      </div>

      {/* Center Body: Photo & Name */}
      <div className="flex-1 flex flex-col items-center justify-center px-2 py-1 text-center">
        {/* Photo Container */}
        <div className="relative mb-1.5">
          <div
            className="rounded-xl p-0.5 shadow-xs flex items-center justify-center overflow-hidden border-2 border-emerald-600 bg-slate-50"
            style={{ width: '23mm', height: '28mm' }}
          >
            {employee.avatar ? (
              <img
                src={employee.avatar}
                alt={fullNameEn}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                <User className="w-8 h-8 text-emerald-600/70" />
                <span className="text-[7px] font-bold text-slate-500 mt-0.5">PHOTO</span>
              </div>
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-0.5 rounded-full shadow-xs">
            <CheckCircle2 className="w-3 h-3" />
          </span>
        </div>

        {/* Name */}
        <h3 className="text-[11px] font-black text-slate-900 leading-snug line-clamp-1 uppercase font-sans tracking-tight">
          {fullNameEn}
        </h3>
        {chineseName && (
          <span className="text-[10px] font-bold text-emerald-700 leading-tight block mt-0.5">
            {chineseName}
          </span>
        )}

        {/* Position */}
        <div className="mt-1 bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded-md text-[8.5px] font-bold inline-block max-w-[48mm] truncate font-sans">
          {chinesePosition ? `${chinesePosition} / ` : ''}{positionTitle}
        </div>

        {/* Department */}
        <span className="text-[8px] text-slate-500 font-semibold block mt-0.5 font-sans uppercase">
          {departmentName}
        </span>
      </div>

      {/* Bottom Bar: ID & Security Strip */}
      <div className="border-t border-slate-200 bg-slate-50 px-2.5 py-1.5 flex items-center justify-between">
        <div className="text-left">
          <span className="text-[6px] text-slate-400 uppercase font-bold block leading-none">
            EMPLOYEE ID / 工号
          </span>
          <span className="text-[10px] font-mono font-black text-slate-900 tracking-wider">
            {employeeCode}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[6px] text-slate-400 uppercase font-bold block leading-none">
            VALID THRU / 有效期
          </span>
          <span className="text-[9px] font-mono font-bold text-slate-700">
            {validUntil}
          </span>
        </div>
      </div>

      {/* Decorative Bottom Colored Ribbon */}
      <div className="h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700" />
    </div>
  );

  // ==========================================
  // 2. VERTICAL BACK (54mm x 85.6mm)
  // ==========================================
  const renderBackVertical = () => (
    <div
      id={`badge-back-${employee.id}`}
      className="badge-card-container relative bg-white text-slate-800 flex flex-col justify-between overflow-hidden shadow-md print:shadow-none border border-slate-300 print:border-slate-400 select-none"
      style={{
        width: '54mm',
        height: '85.6mm',
        minWidth: '54mm',
        minHeight: '85.6mm',
        maxWidth: '54mm',
        maxHeight: '85.6mm',
        borderRadius: printMode ? '2.5mm' : '12px',
        boxSizing: 'border-box',
        direction: 'ltr',
      }}
    >
      {/* Top Header */}
      <div className="bg-slate-900 text-white p-2 text-center">
        <span className="text-[9px] font-black tracking-wide block">
          新希望埃及 • 员工工作证
        </span>
        <span className="text-[6.5px] text-slate-400 uppercase font-sans tracking-wider font-semibold">
          NEW HOPE EGYPT • EMPLOYEE ID CARD
        </span>
      </div>

      {/* Center Details with QR Code */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 space-y-1.5 text-center">
        {/* QR Code Container */}
        {qrCodeUrl ? (
          <div className="p-1 bg-white border border-slate-300 rounded-lg shadow-xs inline-block">
            <img src={qrCodeUrl} alt="Verification QR" className="w-18 h-18 object-contain" />
          </div>
        ) : (
          <div className="w-18 h-18 bg-slate-100 rounded-lg border border-slate-200" />
        )}
        <span className="text-[6.5px] text-slate-400 font-sans tracking-tight block">
          SCAN TO VERIFY / 扫码核验员工身份
        </span>

        {/* Vital Info Box */}
        <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[8px] space-y-1 text-left">
          <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
            <span className="text-slate-500 font-bold">EMPLOYEE ID / 工号:</span>
            <span className="font-mono font-black text-slate-900">{employeeCode}</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-500 font-bold flex items-center gap-1">
              <Phone className="w-2.5 h-2.5 text-emerald-600" />
              HOTLINE / 应急电话:
            </span>
            <span className="font-mono font-bold text-slate-800">0100 297 0938</span>
          </div>
        </div>

        {/* Legal Disclaimer in English & Chinese */}
        <div className="text-[6px] text-slate-500 leading-tight px-1 text-center space-y-0.5">
          <p>
            This card is the official property of New Hope Egypt Aquatic Tech Co., Ltd. Please display upon entry and return to HR upon resignation.
          </p>
          <p className="text-[6.5px] text-slate-600 font-medium">
            本卡为新希望埃及水产科技有限公司所有，进出厂区请主动出示，离职时须归还人力资源部。
          </p>
        </div>
      </div>

      {/* Bottom Address */}
      <div className="bg-slate-100 px-2 py-1 text-center border-t border-slate-200">
        <span className="text-[6px] text-slate-600 font-medium block">
          Gamasa Industrial Zone, 4th Stage, Block A, Piece 5 / 埃及加姆萨工业区
        </span>
      </div>
    </div>
  );

  // ==========================================
  // 3. HORIZONTAL FRONT (85.6mm x 54mm)
  // ==========================================
  const renderFrontHorizontal = () => (
    <div
      id={`badge-front-${employee.id}`}
      className="badge-card-container relative bg-white text-slate-800 flex flex-col justify-between overflow-hidden shadow-md print:shadow-none border border-slate-300 print:border-slate-400 select-none"
      style={{
        width: '85.6mm',
        height: '54mm',
        minWidth: '85.6mm',
        minHeight: '54mm',
        maxWidth: '85.6mm',
        maxHeight: '54mm',
        borderRadius: printMode ? '2.5mm' : '12px',
        boxSizing: 'border-box',
        direction: 'ltr',
      }}
    >
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 px-3 py-1.5 text-white flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-white p-0.5 shadow-xs flex items-center justify-center shrink-0">
            <img src={logoImg} alt="New Hope" className="w-full h-full object-contain" />
          </div>
          <span className="text-[10px] font-black tracking-tight leading-none font-sans">
            新希望埃及水产科技有限公司
          </span>
        </div>
        <span className="text-[7px] text-emerald-100 font-sans uppercase font-bold">
          NEW HOPE EGYPT
        </span>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex items-center justify-between px-3.5 py-1.5 gap-3">
        {/* Left Photo */}
        <div
          className="rounded-xl p-0.5 shadow-xs flex items-center justify-center overflow-hidden border-2 border-emerald-600 bg-slate-50 shrink-0"
          style={{ width: '22mm', height: '26mm' }}
        >
          {employee.avatar ? (
            <img src={employee.avatar} alt={fullNameEn} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400">
              <User className="w-7 h-7 text-emerald-600/70" />
            </div>
          )}
        </div>

        {/* Right Info */}
        <div className="flex-1 text-left space-y-0.5">
          <h3 className="text-[12px] font-black text-slate-900 leading-tight uppercase font-sans">
            {fullNameEn}
          </h3>
          {chineseName && (
            <span className="text-[10px] font-bold text-emerald-700 block">
              {chineseName}
            </span>
          )}

          <div className="pt-0.5">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[9px] font-bold inline-block font-sans">
              {chinesePosition ? `${chinesePosition} / ` : ''}{positionTitle}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1 text-[8px] text-slate-500 font-sans">
            <span>DEPT: <strong className="text-slate-800 uppercase">{departmentName}</strong></span>
            <span>•</span>
            <span>ID: <strong className="text-slate-900 font-mono font-bold">{employeeCode}</strong></span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-3 py-1 flex items-center justify-between text-[7px] text-slate-500">
        <span>EMPLOYEE ID / 工号: <strong className="font-mono text-slate-900">{employeeCode}</strong></span>
        <span>VALID THRU / 有效期至: <strong className="font-mono text-slate-900">{validUntil}</strong></span>
      </div>
    </div>
  );

  // ==========================================
  // 4. HORIZONTAL BACK (85.6mm x 54mm)
  // ==========================================
  const renderBackHorizontal = () => (
    <div
      id={`badge-back-${employee.id}`}
      className="badge-card-container relative bg-white text-slate-800 flex flex-col justify-between overflow-hidden shadow-md print:shadow-none border border-slate-300 print:border-slate-400 select-none"
      style={{
        width: '85.6mm',
        height: '54mm',
        minWidth: '85.6mm',
        minHeight: '54mm',
        maxWidth: '85.6mm',
        maxHeight: '54mm',
        borderRadius: printMode ? '2.5mm' : '12px',
        boxSizing: 'border-box',
        direction: 'ltr',
      }}
    >
      {/* Top Header */}
      <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between">
        <span className="text-[9.5px] font-black tracking-wide">
          新希望埃及 • 员工工作证
        </span>
        <span className="text-[7px] text-slate-300 uppercase font-sans tracking-wider font-semibold">
          OFFICIAL WORKFORCE ID CARD
        </span>
      </div>

      {/* Center Content: Two Columns */}
      <div className="flex-1 flex items-center justify-between px-4 py-1.5 gap-4">
        {/* Left: QR Code */}
        <div className="flex flex-col items-center justify-center shrink-0 text-center">
          {qrCodeUrl ? (
            <div className="p-1 bg-white border border-slate-300 rounded-lg shadow-xs inline-block">
              <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16 object-contain" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-slate-100 rounded-lg border border-slate-200" />
          )}
          <span className="text-[6px] text-slate-400 font-sans tracking-tight mt-0.5">
            SCAN TO VERIFY / 扫码核验
          </span>
        </div>

        {/* Right: Info and Disclaimer */}
        <div className="flex-1 space-y-1 text-left">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[8px] space-y-0.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold">EMPLOYEE ID / 工号:</span>
              <span className="font-mono font-black text-slate-900">{employeeCode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold flex items-center gap-1">
                <Phone className="w-2.5 h-2.5 text-emerald-600" />
                HOTLINE / 应急电话:
              </span>
              <span className="font-mono font-bold text-slate-800">0100 297 0938</span>
            </div>
          </div>

          <div className="text-[6px] text-slate-500 leading-tight space-y-0.5">
            <p>
              Official property of New Hope Egypt Aquatic Tech Co., Ltd. Return to HR upon resignation.
            </p>
            <p className="text-[6.5px] text-slate-600 font-medium">
              本卡为新希望埃及所有，进出请出示，离职时须归还。
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Address */}
      <div className="bg-slate-100 px-3 py-1 text-center border-t border-slate-200">
        <span className="text-[6px] text-slate-600 font-medium block">
          Gamasa Industrial Zone, 4th Stage, Block A, Piece 5 / 埃及加姆萨工业区
        </span>
      </div>
    </div>
  );

  return (
    <div
      className="badge-card-wrapper inline-flex flex-col items-center justify-center transition-transform duration-200"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
    >
      {orientation === 'vertical' ? (
        showSide === 'both' ? (
          <div id={`badge-both-${employee.id}`} className="badge-both-container flex flex-col items-center justify-center gap-4 print:gap-[8mm]">
            {renderFrontVertical()}
            {/* Subtle separator guide between front and back without any text */}
            <div className="hidden print:block w-[54mm] border-b border-dashed border-slate-300 my-0.5 select-none" />
            {renderBackVertical()}
          </div>
        ) : showSide === 'back' ? (
          renderBackVertical()
        ) : (
          renderFrontVertical()
        )
      ) : showSide === 'both' ? (
        <div id={`badge-both-${employee.id}`} className="badge-both-container flex flex-col items-center justify-center gap-4 print:gap-[8mm]">
          {renderFrontHorizontal()}
          {/* Subtle separator guide between front and back without any text */}
          <div className="hidden print:block w-[85.6mm] border-b border-dashed border-slate-300 my-0.5 select-none" />
          {renderBackHorizontal()}
        </div>
      ) : showSide === 'back' ? (
        renderBackHorizontal()
      ) : (
        renderFrontHorizontal()
      )}
    </div>
  );
};
