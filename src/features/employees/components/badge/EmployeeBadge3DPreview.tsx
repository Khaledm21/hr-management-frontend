import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RotateCcw,
  Download,
  Printer,
  CreditCard,
  Layers,
  ChevronDown,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { Employee } from '../../../../types';
import { EmployeeBadgeCard } from './EmployeeBadgeCard';
import { exportBadgeToPng } from '../../services/badgeImageExport';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';

export interface EmployeeBadge3DPreviewProps {
  employee: Employee;
  initialOrientation?: 'vertical' | 'horizontal';
  validUntil?: string;
  onOpenPrintModal?: () => void;
  className?: string;
}

export const EmployeeBadge3DPreview: React.FC<EmployeeBadge3DPreviewProps> = ({
  employee,
  initialOrientation = 'vertical',
  validUntil = '2027/12/31',
  onOpenPrintModal,
  className = '',
}) => {
  const { t } = useTranslation();
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>(initialOrientation);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // 3D Parallax Tilt & Light Reflection State
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const cardEl = containerRef.current;
    if (!cardEl) return;

    const rect = cardEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Realistic physical tilt degrees (max +/- 10 degrees)
    const tiltX = ((y - centerY) / centerY) * -10;
    const tiltY = ((x - centerX) / centerX) * 10;

    setTilt({ x: tiltX, y: tiltY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35,
    });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  const handleDownload = async (side: 'front' | 'back' | 'both') => {
    try {
      setIsDownloading(true);
      setDownloadDropdownOpen(false);
      setDownloadSuccess(null);

      const empCode = employee.employeeId || 'NH';
      const cleanName = `${employee.firstName}_${employee.lastName}`.trim().replace(/\s+/g, '_');

      if (side === 'both') {
        const el = document.getElementById(`badge-both-${employee.id}`);
        if (el) {
          await exportBadgeToPng(el, `${empCode}_${cleanName}_Badge_FullSheet`, { pixelRatio: 3 });
        } else {
          const frontEl = document.getElementById(`badge-front-${employee.id}`);
          if (frontEl) await exportBadgeToPng(frontEl, `${empCode}_${cleanName}_Badge_Front`, { pixelRatio: 3 });
        }
      } else if (side === 'back') {
        const el = document.getElementById(`badge-back-${employee.id}`);
        if (el) {
          await exportBadgeToPng(el, `${empCode}_${cleanName}_Badge_Back_QR`, { pixelRatio: 3 });
        }
      } else {
        const el = document.getElementById(`badge-front-${employee.id}`);
        if (el) {
          await exportBadgeToPng(el, `${empCode}_${cleanName}_Badge_Front`, { pixelRatio: 3 });
        }
      }

      setDownloadSuccess(t('common.completed', 'تم التنزيل بنجاح'));
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to export badge as PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const isVertical = orientation === 'vertical';
  // Standard CR80 ID Card dimensions precisely matching 54mm x 85.6mm (at 96 DPI: 204px x 324px)
  const cardWidth = isVertical ? 204 : 324;
  const cardHeight = isVertical ? 324 : 204;

  return (
    <div
      className={`relative rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-[#1E293B] shadow-sm p-4 sm:p-5 flex flex-col justify-between select-none overflow-hidden text-slate-800 dark:text-slate-100 transition-all ${className}`}
    >
      {/* Decorative Subtle Ambient Glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header & Layout / Flip Controls */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E293B] gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shadow-2xs shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F8FAFC] leading-none truncate">
                {t('employees.interactiveBadgeTitle', 'كارنيه العمل الرقمي')}
              </h3>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 leading-none shrink-0">
                CR80
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-none truncate">
              {isFlipped
                ? t('employees.backSide', 'الظهر (رمز QR الأمني)')
                : t('employees.frontSide', 'الوجه الأمامي (الصورة والبيانات)')}
            </p>
          </div>
        </div>

        {/* Action Controls in Header: Flip & Orientation */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Flip Toggle Button */}
          <button
            type="button"
            onClick={handleFlip}
            className="px-2 py-1 text-xs font-semibold bg-slate-50 dark:bg-[#1E293B] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 shadow-2xs"
            title={isFlipped ? t('employees.frontSide', 'عرض الوجه الأمامي') : t('employees.backSide', 'عرض الظهر')}
          >
            <RotateCcw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 transition-transform duration-500 ${isFlipped ? 'rotate-180' : ''}`} />
            <span className="text-[11px] hidden sm:inline">
              {isFlipped ? t('employees.frontSide', 'الوجه') : t('employees.backSide', 'الظهر')}
            </span>
          </button>

          {/* Orientation Switcher */}
          <button
            type="button"
            onClick={() => setOrientation(isVertical ? 'horizontal' : 'vertical')}
            className="px-2 py-1 text-xs font-semibold bg-slate-50 dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 shadow-2xs"
            title="تبديل اتجاه الكارنيه بين رأسي وأفقي"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px]">{isVertical ? t('employees.badgeVertical', 'رأسي') : t('employees.badgeHorizontal', 'أفقي')}</span>
          </button>
        </div>
      </div>

      {/* 3D Interactive Stage */}
      <div
        className="relative my-2 py-1 flex flex-col items-center justify-center cursor-pointer group"
        onClick={handleFlip}
        title={t('employees.flipBadgeHint', 'انقر على الكارنيه لقلبه وعرض الوجه الآخر')}
        style={{ perspective: '1200px' }}
      >
        {/* Chrome Swivel Clip Cliphead */}
        <div className="flex flex-col items-center -mb-1 z-20 pointer-events-none">
          <div className="w-6 h-2 bg-gradient-to-b from-slate-200 via-white to-slate-300 rounded-t-sm border border-slate-300 shadow-2xs flex items-center justify-center">
            <div className="w-2.5 h-0.5 bg-slate-400 rounded-full" />
          </div>
        </div>

        {/* 3D Rotating Card Container with Mouse Tilt */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative"
          style={{
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            transformStyle: 'preserve-3d',
            transform: `rotateX(${tilt.x}deg) rotateY(${isFlipped ? 180 - tilt.y : tilt.y}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`,
            transition: isHovered
              ? 'transform 0.12s cubic-bezier(0.1, 0.9, 0.2, 1)'
              : 'transform 0.65s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          {/* Subtle Hover Flip Hint Tag */}
          <div className="absolute top-1.5 end-1.5 z-40 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-900/75 hover:bg-slate-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1 shadow-md pointer-events-none">
            <RotateCcw className="w-2.5 h-2.5 text-emerald-400" />
            <span>{isFlipped ? t('employees.frontSide', 'الوجه') : t('employees.backSide', 'الظهر')}</span>
          </div>

          {/* FRONT FACE */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-2xl"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <div className="relative shadow-md rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-700">
              <EmployeeBadgeCard
                employee={employee}
                orientation={orientation}
                showSide="front"
                validUntil={validUntil}
                scale={1}
                printMode={false}
              />
              {/* Dynamic Specular Sheen Reflection Overlay */}
              <div
                className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-200 rounded-2xl"
                style={{
                  background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.06) 50%, transparent 80%)`,
                  opacity: glare.opacity,
                  mixBlendMode: 'overlay',
                }}
              />
            </div>
          </div>

          {/* BACK FACE */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-2xl"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="relative shadow-md rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-700">
              <EmployeeBadgeCard
                employee={employee}
                orientation={orientation}
                showSide="back"
                validUntil={validUntil}
                scale={1}
                printMode={false}
              />
              {/* Dynamic Specular Sheen Reflection Overlay */}
              <div
                className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-200 rounded-2xl"
                style={{
                  background: `radial-gradient(circle at ${100 - glare.x}% ${glare.y}%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.06) 50%, transparent 80%)`,
                  opacity: glare.opacity,
                  mixBlendMode: 'overlay',
                }}
              />
            </div>
          </div>
        </div>

        {/* Ambient Ground Shadow */}
        <div
          className="h-2 bg-slate-400/20 dark:bg-black/40 blur-xs rounded-full mt-2 transition-all duration-500 pointer-events-none"
          style={{
            width: isVertical ? '160px' : '260px',
            transform: isFlipped ? 'scaleX(0.92)' : 'scaleX(1)',
          }}
        />
      </div>

      {/* Action Toolbar: Print & High-Res PNG Download */}
      <div className="relative z-10 pt-2.5 mt-1 border-t border-slate-100 dark:border-[#1E293B] space-y-2">
        <div className="flex items-center gap-2">
          {/* Print Button */}
          {onOpenPrintModal && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={onOpenPrintModal}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
            >
              {t('employees.badgePrintNow', 'طباعة الكارنيه')}
            </Button>
          )}

          {/* Download Dropdown */}
          <div className="relative flex-1">
            <Button
              variant="outline"
              size="sm"
              leftIcon={
                isDownloading ? (
                  <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                )
              }
              rightIcon={<ChevronDown className="w-3 h-3 text-slate-400" />}
              onClick={() => setDownloadDropdownOpen(prev => !prev)}
              disabled={isDownloading}
              className="w-full border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs"
            >
              {isDownloading
                ? t('employees.downloadingBadge', 'جاري التجهيز...')
                : t('employees.downloadPng', 'تنزيل PNG')}
            </Button>

            {downloadDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setDownloadDropdownOpen(false)}
                />
                <div className="absolute bottom-full end-0 mb-2 w-52 bg-white dark:bg-[#151D2E] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1 z-50 text-xs font-semibold divide-y divide-slate-100 dark:divide-slate-800 text-start animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => handleDownload('front')}
                    className="w-full px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center justify-between transition-colors"
                  >
                    <span>{t('employees.downloadFrontPng', 'الوجه الأمامي')}</span>
                    <Badge variant="success" className="text-[9px]">300 DPI</Badge>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload('back')}
                    className="w-full px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center justify-between transition-colors"
                  >
                    <span>{t('employees.downloadBackPng', 'الظهر مع QR')}</span>
                    <Badge variant="success" className="text-[9px]">300 DPI</Badge>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload('both')}
                    className="w-full px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center justify-between transition-colors"
                  >
                    <span>{t('employees.downloadBothPng', 'الوجهين معاً')}</span>
                    <Badge variant="secondary" className="text-[9px]">A4 / Full</Badge>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Security & Standard Footnote */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium px-1 pt-0.5">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            رمز QR مشفر للتحقق
          </span>
          <span className="font-mono">ISO/IEC 7810 ID-1</span>
        </div>
      </div>

      {/* Hidden container for rendering 'both' sides off-screen for combined PNG export */}
      <div
        className="fixed -left-[9999px] -top-[9999px] opacity-0 pointer-events-none no-export"
        aria-hidden="true"
      >
        <div id={`badge-both-${employee.id}`}>
          <EmployeeBadgeCard
            employee={employee}
            orientation={orientation}
            showSide="both"
            validUntil={validUntil}
            scale={1}
            printMode={true}
          />
        </div>
      </div>
    </div>
  );
};
