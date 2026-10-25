import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  CheckCircle2,
  Download,
  Info,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { driverPayoutService } from '../../../services/driverPayoutService';
import { DriverCategory } from '../../../types/driverPayouts';
import { cn } from '../../../lib/utils';

interface DriverExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (weekPeriod: string) => void;
}

interface ParsedDriverColumn {
  name: string;
  amounts: Array<{ amount: number; category: DriverCategory }>;
  total: number;
  count: number;
}

export const DriverExcelImportModal: React.FC<DriverExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { success, error: toastError, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Parsed metadata
  const [weekDate, setWeekDate] = useState('2026-10-18');
  const [weekLabel, setWeekLabel] = useState('Sunday, October 18, 2026');
  const [parsedDrivers, setParsedDrivers] = useState<ParsedDriverColumn[]>([]);

  const resetState = () => {
    setFile(null);
    setParsedDrivers([]);
    setIsProcessing(false);
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = () => {
    driverPayoutService.downloadTemplateExcel();
    info('تم تحميل النموذج الرسمي لمتابعة قبض السواقين');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert sheet to 2D array of rows
      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (!rawRows || rawRows.length === 0) {
        toastError('ملف الإكسيل فارغ أو لا يحتوي على صفوف بيانات');
        setIsProcessing(false);
        return;
      }

      // 1. Detect Date or Title in first 4 rows
      let detectedDate = '2026-10-18';
      let detectedLabel = 'Sunday, October 18, 2026';

      for (let r = 0; r < Math.min(rawRows.length, 5); r++) {
        const row = rawRows[r];
        for (let c = 0; c < row.length; c++) {
          const val = String(row[c]).trim();
          if (
            val.toLowerCase().includes('sunday') ||
            val.toLowerCase().includes('monday') ||
            val.toLowerCase().includes('october') ||
            val.includes('2026') ||
            val.includes('2025') ||
            val.includes('أسبوع')
          ) {
            detectedLabel = val;
            const matchDate = val.match(/\d{4}-\d{2}-\d{2}/);
            if (matchDate) {
              detectedDate = matchDate[0];
            }
            break;
          }
        }
      }

      setWeekDate(detectedDate);
      setWeekLabel(detectedLabel);

      // 2. Locate the Drivers Header Row (Row that contains multiple driver names)
      let headerRowIndex = -1;
      const commonArabicNames = ['احمد', 'محمد', 'علي', 'عمر', 'محمود', 'بهاء', 'ناصر', 'السيد', 'علاء', 'عمرو', 'رمزي', 'السعيد', 'خيري'];

      for (let r = 0; r < rawRows.length; r++) {
        const row = rawRows[r];
        let nameHits = 0;
        for (let c = 0; c < row.length; c++) {
          const cellStr = String(row[c]).trim();
          if (cellStr && isNaN(Number(cellStr)) && commonArabicNames.some(n => cellStr.includes(n))) {
            nameHits++;
          }
        }
        if (nameHits >= 3) {
          headerRowIndex = r;
          break;
        }
      }

      // Fallback: look for row with strings that don't have words like 'إجمالي'
      if (headerRowIndex === -1) {
        for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
          const row = rawRows[r];
          const stringCells = row.filter(cell => typeof cell === 'string' && cell.trim() && isNaN(Number(cell)));
          if (stringCells.length >= 4) {
            headerRowIndex = r;
            break;
          }
        }
      }

      if (headerRowIndex === -1) {
        toastError('لم يتم العثور على سطر أسماء السائقين في الشيت، يرجى مراجعة النموذج');
        setIsProcessing(false);
        return;
      }

      const driverHeaderRow = rawRows[headerRowIndex];
      const detectedDrivers: ParsedDriverColumn[] = [];

      // Locate master footer row (e.g., إجمالي القبض / الإجمالي العام) so footer cells are never read as amounts
      let footerRowIndex = rawRows.length;
      for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
        const row = rawRows[r] || [];
        const rowText = row.map(cell => String(cell ?? '').trim()).join(' ');
        if (
          rowText.includes('إجمالي القبض') ||
          rowText.includes('عدد مرات القبض') ||
          rowText.includes('الإجمالي العام') ||
          rowText.includes('اجمالي الاداره') ||
          rowText.includes('اجمالي الإنتاج') ||
          rowText.includes('Grand Total') ||
          rowText.includes('Total')
        ) {
          footerRowIndex = r;
          break;
        }
      }

      // Administration known keywords or first rows
      const adminNames = ['احمد فريد', 'أبو عمر'];

      for (let c = 0; c < driverHeaderRow.length; c++) {
        const nameVal = String(driverHeaderRow[c] || '').trim();
        if (!nameVal || nameVal.includes('إجمالي') || nameVal.includes('Total') || !isNaN(Number(nameVal))) {
          continue;
        }

        const amounts: Array<{ amount: number; category: DriverCategory }> = [];
        let total = 0;

        // Traverse rows strictly between header and footer
        for (let r = headerRowIndex + 1; r < footerRowIndex; r++) {
          const row = rawRows[r];
          if (!row) continue;

          const rawVal = row[c];
          if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
            const num = parseFloat(String(rawVal).replace(/[^0-9.-]+/g, ''));
            if (!isNaN(num) && num > 0) {
              // Heuristic: Check if this payment is a Management payout according to the official model
              const isManagement =
                ((nameVal.includes('احمد فريد') || nameVal.includes('أحمد فريد')) && num === 3240) ||
                ((nameVal.includes('ابو عمر') || nameVal.includes('أبو عمر')) && num === 2280) ||
                (nameVal.includes('علاء بازيد') && num === 3240) ||
                ((nameVal.includes('احمد جمعه') || nameVal.includes('أحمد جمعه')) && num === 3510) ||
                ((nameVal.includes('عمرو ابراهيم') || nameVal.includes('عمرو إبراهيم')) && num === 3240) ||
                (adminNames.includes(nameVal) && r === headerRowIndex + 1);

              amounts.push({
                amount: num,
                category: isManagement ? 'management' : 'production',
              });
              total += num;
            }
          }
        }

        if (amounts.length > 0 || nameVal.length > 2) {
          detectedDrivers.push({
            name: nameVal,
            amounts,
            total,
            count: amounts.length,
          });
        }
      }

      if (detectedDrivers.length === 0) {
        toastError('لم يتم العثور على مبالغ أو سواقين في الشيت');
        setIsProcessing(false);
        return;
      }

      setParsedDrivers(detectedDrivers);
      success(`تم التعرف على ${detectedDrivers.length} سائق بنجاح من الشيت`);
    } catch (err) {
      console.error(err);
      toastError('حدث خطأ أثناء قراءة ملف الإكسيل');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleCategory = (driverIndex: number, amountIndex: number) => {
    setParsedDrivers(prev => {
      const copy = [...prev];
      const targetDriver = { ...copy[driverIndex] };
      const targetAmounts = [...targetDriver.amounts];
      const currentCat = targetAmounts[amountIndex].category;
      targetAmounts[amountIndex] = {
        ...targetAmounts[amountIndex],
        category: currentCat === 'management' ? 'production' : 'management',
      };
      targetDriver.amounts = targetAmounts;
      copy[driverIndex] = targetDriver;
      return copy;
    });
  };

  const handleConfirmImport = async () => {
    if (parsedDrivers.length === 0) return;
    setIsImporting(true);

    try {
      const driversToImport = parsedDrivers.map(d => ({
        name: d.name,
        defaultCategory: d.amounts.some(a => a.category === 'management') ? ('management' as const) : ('production' as const),
      }));

      const transactionsToImport: Array<{
        driverName: string;
        amount: number;
        category: DriverCategory;
        date: string;
      }> = [];

      parsedDrivers.forEach(d => {
        d.amounts.forEach(a => {
          transactionsToImport.push({
            driverName: d.name,
            amount: a.amount,
            category: a.category,
            date: weekDate,
          });
        });
      });

      const res = await driverPayoutService.batchImportWeeklyData({
        weekPeriod: weekDate,
        weekLabel: weekLabel,
        drivers: driversToImport,
        transactions: transactionsToImport,
      });

      success(
        `تم استيراد ${res.importedTransactionsCount} دفعة قبض بنجاح وتحديث ملخص الأسبوع!`,
        'تم الاستيراد بنجاح'
      );
      onImportSuccess(weekDate);
      onClose();
      resetState();
    } catch (err) {
      console.error(err);
      toastError('فشل حفظ البيانات المستوردة');
    } finally {
      setIsImporting(false);
    }
  };

  // Aggregated totals of parsed preview
  const grandTotal = parsedDrivers.reduce((sum, d) => sum + d.total, 0);
  const managementTotal = parsedDrivers.reduce(
    (sum, d) => sum + d.amounts.filter(a => a.category === 'management').reduce((s, a) => s + a.amount, 0),
    0
  );
  const productionTotal = parsedDrivers.reduce(
    (sum, d) => sum + d.amounts.filter(a => a.category === 'production').reduce((s, a) => s + a.amount, 0),
    0
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetState();
        onClose();
      }}
      title={t('driverPayouts.importModalTitle')}
      size="xl"
    >
      <div className="space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Step 1: Upload or Template Area */}
        {!parsedDrivers.length ? (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-[#1E293B] hover:border-brand-500 hover:bg-brand-50/20 dark:hover:bg-brand-950/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center group"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform flex items-center justify-center mb-3 shadow-inner">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-[#F8FAFC]">
                {isProcessing ? t('common.loading', 'جاري التحميل...') : t('driverPayouts.dropzoneTitle')}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                {t('driverPayouts.dropzoneSub')}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="bg-slate-50 dark:bg-[#0B0F19] rounded-xl p-4 border border-slate-200 dark:border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 dark:text-[#F8FAFC] block">
                    {t('driverPayouts.downloadTemplate', 'تحميل النموذج الرسمي المعتمد')}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {t('driverPayouts.importModalDesc', 'تنزيل ملف إكسيل المعتمد مطابق للشيت المعتمد لتعبئته ورفعه')}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900/50 shrink-0"
              >
                <Download className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
                {t('driverPayouts.downloadTemplate', 'تحميل ملف النموذج (.xlsx)')}
              </Button>
            </div>
          </div>
        ) : (
          /* Step 2: Live Preview and Configuration */
          <div className="space-y-4">
            {/* Header info & Week adjustment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 dark:bg-[#0B0F19] p-3.5 rounded-xl border border-slate-200 dark:border-[#1E293B] transition-colors">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {t('driverPayouts.detectedDate')}
                </label>
                <input
                  type="date"
                  value={weekDate}
                  onChange={e => setWeekDate(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-[#151D2E] border border-slate-300 dark:border-[#1E293B] text-slate-900 dark:text-[#F8FAFC] rounded-lg px-2.5 py-1.5 font-bold transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {t('driverPayouts.weekPeriodLabel')}
                </label>
                <input
                  type="text"
                  value={weekLabel}
                  onChange={e => setWeekLabel(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-[#151D2E] border border-slate-300 dark:border-[#1E293B] text-slate-900 dark:text-[#F8FAFC] rounded-lg px-2.5 py-1.5 font-bold transition-colors"
                />
              </div>
            </div>

            {/* Quick Stat Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 p-2.5 rounded-xl transition-colors">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 block">
                  {t('driverPayouts.detectedDriversCount')}
                </span>
                <span className="text-lg font-black text-blue-900 dark:text-blue-100">{parsedDrivers.length}</span>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-2.5 rounded-xl transition-colors">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">
                  {t('driverPayouts.grandTotal')}
                </span>
                <span className="text-lg font-black text-emerald-900 dark:text-emerald-100">{grandTotal.toLocaleString()} {t('driverPayouts.egp')}</span>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-2.5 rounded-xl transition-colors">
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 block">
                  {t('driverPayouts.managementTotal')}
                </span>
                <span className="text-lg font-black text-rose-900 dark:text-rose-100">{managementTotal.toLocaleString()} {t('driverPayouts.egp')}</span>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-2.5 rounded-xl transition-colors">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block">
                  {t('driverPayouts.productionTotal')}
                </span>
                <span className="text-lg font-black text-amber-900 dark:text-amber-100">{productionTotal.toLocaleString()} {t('driverPayouts.egp')}</span>
              </div>
            </div>

            {/* Replace Notice Banner */}
            <div className="bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl p-2.5 flex items-center gap-2.5 text-xs text-blue-950 dark:text-blue-200 transition-colors">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <p className="text-[11px] leading-relaxed">
                <span className="font-bold text-blue-800 dark:text-blue-300">نظام الاستبدال التلقائي:</span> تأكيد الاستيراد يستبدل بالكامل معاملات هذا الأسبوع بالبيانات الجديدة في هذا الشيت فقط، ويمنع تراكم أو تكرار المشاوير القديمة.
              </p>
            </div>

            {/* Drivers & Amounts Preview Table */}
            <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-[#1E293B] rounded-xl bg-white dark:bg-[#151D2E] transition-colors">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-[#1E293B] font-bold text-slate-700 dark:text-slate-300 sticky top-0 transition-colors">
                  <tr>
                    <th className={cn("py-2.5 px-3", isRtl ? "text-right" : "text-left")}>
                      {t('driverPayouts.driverName')}
                    </th>
                    <th className={cn("py-2.5 px-3", isRtl ? "text-right" : "text-left")}>
                      {t('driverPayouts.transactionsTab')}
                    </th>
                    <th className="py-2.5 px-3 text-center">
                      {t('driverPayouts.payoutCount')}
                    </th>
                    <th className={cn("py-2.5 px-3", isRtl ? "text-left" : "text-right")}>
                      {t('driverPayouts.totalPayout')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B] transition-colors">
                  {parsedDrivers.map((d, dIdx) => (
                    <tr key={dIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-[#F8FAFC]">{d.name}</td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {d.amounts.map((a, aIdx) => (
                            <button
                              key={aIdx}
                              type="button"
                              onClick={() => handleToggleCategory(dIdx, aIdx)}
                              className={cn(
                                'text-[11px] font-black px-2 py-0.5 rounded-lg border transition-all cursor-pointer',
                                a.category === 'management'
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                              )}
                              title="Toggle Management / Production"
                            >
                              {a.amount.toLocaleString()} ({a.category === 'management' ? t('driverPayouts.managementCategory') : t('driverPayouts.productionCategory')})
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-600 dark:text-slate-400">{d.count}</td>
                      <td className={cn("py-2 px-3 font-black text-emerald-700 dark:text-emerald-400", isRtl ? "text-left" : "text-right")}>
                        {d.total.toLocaleString()} {t('driverPayouts.egp')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-[#1E293B]">
              <Button variant="outline" size="sm" onClick={resetState} disabled={isImporting}>
                {t('driverPayouts.dropzoneTitle')}
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onClose} disabled={isImporting}>
                  {t('driverPayouts.cancel')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmImport}
                  disabled={isImporting}
                  className="font-bold shadow-md shadow-brand-500/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
                  {isImporting ? t('common.loading', 'جاري التحميل...') : t('driverPayouts.confirmImport')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
