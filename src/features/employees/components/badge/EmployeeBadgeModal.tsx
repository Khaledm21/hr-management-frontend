import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  Printer,
  X,
  CreditCard,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Sparkles,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Employee } from '../../../../types';
import { EmployeeBadgeCard } from './EmployeeBadgeCard';
import { EmployeeBadge3DPreview } from './EmployeeBadge3DPreview';
import { exportBadgeToPng } from '../../services/badgeImageExport';

export interface EmployeeBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
}

export const EmployeeBadgeModal: React.FC<EmployeeBadgeModalProps> = ({
  isOpen,
  onClose,
  employees,
}) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'3d_simulator' | 'print_preview'>(
    employees.length === 1 ? '3d_simulator' : 'print_preview'
  );
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [showSide, setShowSide] = useState<'front' | 'back' | 'both'>('both');
  const [validUntil, setValidUntil] = useState<string>('2027/12/31');
  const [previewScale, setPreviewScale] = useState<number>(1.15);
  const [printLayout, setPrintLayout] = useState<'single' | 'a4_sheet'>(
    employees.length > 1 ? 'a4_sheet' : 'single'
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);

  if (!isOpen || employees.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = async (side: 'front' | 'back' | 'both') => {
    if (employees.length === 0) return;
    try {
      setIsDownloading(true);
      setDownloadDropdownOpen(false);
      const emp = employees[0];
      const empCode = emp.employeeId || 'NH';
      const cleanName = `${emp.firstName}_${emp.lastName}`.trim().replace(/\s+/g, '_');

      if (side === 'both') {
        const el = document.getElementById(`badge-both-${emp.id}`);
        if (el) {
          await exportBadgeToPng(el, `${empCode}_${cleanName}_Badge_FullSheet`, { pixelRatio: 3 });
        } else {
          const frontEl = document.getElementById(`badge-front-${emp.id}`);
          if (frontEl) await exportBadgeToPng(frontEl, `${empCode}_${cleanName}_Badge_Front`, { pixelRatio: 3 });
        }
      } else if (side === 'back') {
        const el = document.getElementById(`badge-back-${emp.id}`);
        if (el) {
          await exportBadgeToPng(el, `${empCode}_${cleanName}_Badge_Back_QR`, { pixelRatio: 3 });
        }
      } else {
        const el = document.getElementById(`badge-front-${emp.id}`);
        if (el) {
          await exportBadgeToPng(el, `${empCode}_${cleanName}_Badge_Front`, { pixelRatio: 3 });
        }
      }
    } catch (err) {
      console.error('Failed to download badge PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return createPortal(
    <div className="employee-badge-modal-root fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Dedicated Print Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 15mm 10mm 15mm 10mm !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #root {
            display: none !important;
          }
          body > *:not(.employee-badge-modal-root) {
            display: none !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
          }
          .employee-badge-modal-root {
            position: static !important;
            inset: auto !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            width: 100% !important;
          }
          .employee-badge-modal-content {
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            max-height: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
          }
          .employee-badge-modal-header,
          .employee-badge-modal-toolbar,
          .employee-badge-modal-footer,
          .no-print,
          .print\\:hidden {
            display: none !important;
          }
          .employee-badge-modal-body {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            min-height: auto !important;
          }
          #printable-badge-area {
            display: flex !important;
            width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: flex-start !important;
          }
          .badge-card-wrapper {
            transform: none !important;
            -webkit-transform: none !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
          .badge-both-container {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8mm !important;
            margin: 0 auto !important;
          }
          .badge-card-container {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            box-shadow: none !important;
            border: 0.5px solid #94a3b8 !important;
            margin: 0 auto !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>

      <div className="employee-badge-modal-content bg-white dark:bg-[#151D2E] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E293B] w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="employee-badge-modal-header flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-[#1E293B] bg-gradient-to-r from-emerald-50/90 to-white dark:from-emerald-950/20 dark:to-[#151D2E]">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
              <CreditCard className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-[#F8FAFC] text-lg">
                  {t('employees.badgeModalTitle', 'طباعة وتخصيص كارنيه العمل (ID Badge)')}
                </h3>
                <Badge variant="success" className="text-xs">
                  {employees.length === 1
                    ? `${employees[0].firstName} ${employees[0].lastName}`
                    : t('employees.badgeCountMultiple', { count: employees.length, defaultValue: `${employees.length} موظفين` })}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle (3D Simulator vs Print Layout) */}
            {employees.length === 1 && (
              <div className="flex items-center bg-slate-100 dark:bg-[#0B0F19] p-0.5 rounded-xl border border-slate-200 dark:border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setViewMode('3d_simulator')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === '3d_simulator'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('employees.mode3d', 'محاكي 3D تفاعلي')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('print_preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'print_preview'
                      ? 'bg-slate-900 dark:bg-brand-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('employees.modePrint', 'معاينة الطباعة')}</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Controls (in Print Preview Mode) */}
        {viewMode === 'print_preview' && (
          <div className="employee-badge-modal-toolbar p-4 bg-slate-50/90 dark:bg-[#111827]/70 border-b border-slate-200/80 dark:border-[#1E293B] grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs animate-in fade-in duration-150">
            {/* Orientation Toggle */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">{t('employees.badgeOrientation', 'شكل وتوجيه الكارنيه:')}</label>
              <div className="flex items-center bg-white dark:bg-[#0B0F19] p-0.5 rounded-lg border border-slate-200 dark:border-[#1E293B] shadow-2xs">
                <button
                  type="button"
                  onClick={() => setOrientation('horizontal')}
                  className={`flex-1 py-1.5 rounded-md font-bold text-[11px] transition-colors ${
                    orientation === 'horizontal'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t('employees.badgeHorizontal', 'أفقي (محفظة)')}
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('vertical')}
                  className={`flex-1 py-1.5 rounded-md font-bold text-[11px] transition-colors ${
                    orientation === 'vertical'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t('employees.badgeVertical', 'رأسي (تعليق)')}
                </button>
              </div>
            </div>

            {/* Sides Toggle */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">{t('employees.badgeSides', 'الأوجه المطلوبة للطباعة:')}</label>
              <div className="flex items-center bg-white dark:bg-[#0B0F19] p-0.5 rounded-lg border border-slate-200 dark:border-[#1E293B] shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowSide('both')}
                  className={`flex-1 py-1.5 rounded-md font-bold text-[11px] transition-colors ${
                    showSide === 'both'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t('employees.badgeBothSides', 'الوجهين معاً')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSide('front')}
                  className={`flex-1 py-1.5 rounded-md font-bold text-[11px] transition-colors ${
                    showSide === 'front'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t('employees.badgeFrontOnly', 'الوجه فقط')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSide('back')}
                  className={`flex-1 py-1.5 rounded-md font-bold text-[11px] transition-colors ${
                    showSide === 'back'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t('employees.badgeBackOnly', 'الظهر (QR)')}
                </button>
              </div>
            </div>

            {/* Print Layout */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">{t('employees.badgeLayout', 'نمط الإخراج:')}</label>
              <div className="flex items-center bg-white dark:bg-[#0B0F19] p-0.5 rounded-lg border border-slate-200 dark:border-[#1E293B] shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPrintLayout('single')}
                  className={`flex-1 py-1.5 rounded-md font-bold text-[11px] transition-colors ${
                    printLayout === 'single'
                      ? 'bg-slate-900 dark:bg-brand-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t('employees.badgeSingle', 'كارت فردي (A4)')}
                </button>
                <button
                  type="button"
                  onClick={() => setPrintLayout('a4_sheet')}
                  className={`flex-1 py-1.5 rounded-md font-bold text-[11px] transition-colors ${
                    printLayout === 'a4_sheet'
                      ? 'bg-slate-900 dark:bg-brand-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t('employees.badgeSheet', 'شيت مجمع')}
                </button>
              </div>
            </div>

            {/* Screen Zoom Control */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">{t('employees.badgeZoom', 'معاينة الشاشة:')}</label>
              <div className="flex items-center justify-between bg-white dark:bg-[#0B0F19] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setPreviewScale(prev => Math.max(0.8, prev - 0.1))}
                  className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E293B] rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {Math.round(previewScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewScale(prev => Math.min(1.8, prev + 0.1))}
                  className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E293B] rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewScale(1.0)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] rounded text-[10px]"
                  title="Reset"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="employee-badge-modal-body flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/90 dark:bg-[#0B0F19] flex items-center justify-center min-h-[400px]">
          {viewMode === '3d_simulator' && employees.length === 1 ? (
            /* 3D Interactive Simulator View */
            <div className="w-full max-w-2xl py-2">
              <EmployeeBadge3DPreview
                employee={employees[0]}
                initialOrientation={orientation}
                validUntil={validUntil}
              />
            </div>
          ) : (
            /* Printable Flat Preview */
            <div id="printable-badge-area" className="w-full">
              {printLayout === 'a4_sheet' ? (
                <div className="bg-white dark:bg-[#151D2E] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-[#1E293B] mx-auto max-w-3xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
                    {employees.map(emp => (
                      <div key={emp.id} className="p-1 border border-dashed border-slate-300 dark:border-[#1E293B] rounded-xl relative group">
                        <EmployeeBadgeCard
                          employee={emp}
                          orientation={orientation}
                          showSide={showSide}
                          validUntil={validUntil}
                          scale={1}
                          printMode={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <EmployeeBadgeCard
                    employee={employees[0]}
                    orientation={orientation}
                    showSide={showSide}
                    validUntil={validUntil}
                    scale={previewScale}
                    printMode={false}
                  />
                </div>
              )}
            </div>
          )}

          {/* Off-screen Printable Area kept in DOM during 3D Simulator mode so window.print() still works */}
          {viewMode === '3d_simulator' && (
            <div id="printable-badge-area" className="hidden print:flex">
              <div className="flex flex-col items-center justify-center">
                <EmployeeBadgeCard
                  employee={employees[0]}
                  orientation={orientation}
                  showSide={showSide}
                  validUntil={validUntil}
                  scale={1}
                  printMode={true}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="employee-badge-modal-footer p-4 bg-white dark:bg-[#111827]/70 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('common.close', 'إغلاق')}
          </Button>

          <div className="flex items-center gap-2.5">
            {/* Download High-Res PNG Button with Dropdown */}
            {employees.length === 1 && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={
                    isDownloading ? (
                      <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                    )
                  }
                  rightIcon={<ChevronDown className="w-3 h-3 text-slate-400" />}
                  onClick={() => setDownloadDropdownOpen(prev => !prev)}
                  disabled={isDownloading}
                  className="border-emerald-300 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 font-bold"
                >
                  {isDownloading
                    ? t('employees.downloadingBadge', 'جاري التجهيز...')
                    : t('employees.downloadPngHighRes', 'تنزيل كصورة PNG')}
                </Button>

                {downloadDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-transparent"
                      onClick={() => setDownloadDropdownOpen(false)}
                    />
                    <div className="absolute bottom-full end-0 mb-2 w-56 bg-white dark:bg-[#151D2E] border border-slate-200 dark:border-[#1E293B] rounded-xl shadow-2xl py-1 z-50 text-xs font-semibold divide-y divide-slate-100 dark:divide-[#1E293B] text-start animate-in fade-in zoom-in-95">
                      <button
                        type="button"
                        onClick={() => handleDownloadPng('front')}
                        className="w-full px-3.5 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center justify-between transition-colors"
                      >
                        <span>{t('employees.downloadFrontPng', 'تنزيل الوجه الأمامي (PNG)')}</span>
                        <Badge variant="success" className="text-[9px]">300 DPI</Badge>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPng('back')}
                        className="w-full px-3.5 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center justify-between transition-colors"
                      >
                        <span>{t('employees.downloadBackPng', 'تنزيل الوجه الخلفي (PNG)')}</span>
                        <Badge variant="success" className="text-[9px]">QR Code</Badge>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPng('both')}
                        className="w-full px-3.5 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center justify-between transition-colors"
                      >
                        <span>{t('employees.downloadBothPng', 'تنزيل الوجهين معاً (PNG)')}</span>
                        <Badge variant="secondary" className="text-[9px]">Full</Badge>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Print Badge Button */}
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-2.5 shadow-md shadow-emerald-600/25 text-sm"
            >
              {t('employees.badgePrintNow', 'طباعة الكارنيه')}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EmployeeBadgeModal;
