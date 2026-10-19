import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Printer, Download, X, Building, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { DriverWeeklyColumn, WeeklyPayoutSummary } from '../../../types/driverPayouts';
import { cn } from '../../../lib/utils';
import newHopeLogo from '../../../assets/new-hope-logo.jpg';

interface DriverPrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: DriverWeeklyColumn[];
  maxRows: number;
  summary: WeeklyPayoutSummary | null | undefined;
}

export const DriverPrintReportModal: React.FC<DriverPrintReportModalProps> = ({
  isOpen,
  onClose,
  columns,
  maxRows,
  summary,
}) => {
  const { t, i18n } = useTranslation();
  const [includeSignatures, setIncludeSignatures] = useState(true);

  const isRtl = i18n.language === 'ar';
  const isZh = i18n.language === 'zh-CN';
  const lang = i18n.language;

  const handlePrint = () => {
    const reportElem = document.getElementById('driver-payout-printable-report');
    if (!reportElem) {
      window.print();
      return;
    }

    // Clean up any previously created print iframe
    const oldIframe = document.getElementById('driver-report-print-frame');
    if (oldIframe) oldIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'driver-report-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '1400px';
    iframe.style.height = '900px';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    // Extract all styles and links from active document
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    const fontFamily = isRtl
      ? "'Cairo', 'Segoe UI', Tahoma, sans-serif"
      : isZh
      ? "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"
      : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="${isRtl ? 'rtl' : 'ltr'}" lang="${lang}">
      <head>
        <meta charset="utf-8" />
        <title>${t('driverPayouts.weeklySheetTitle')}</title>
        ${styles}
        <style>
          @page {
            size: landscape;
            margin: 5mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: ${fontFamily} !important;
            direction: ${isRtl ? 'rtl' : 'ltr'};
            width: 100% !important;
          }
          #print-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 2px !important;
            border: none !important;
            box-shadow: none !important;
          }
          table {
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }
          th, td {
            word-break: break-word !important;
            overflow-wrap: break-word !important;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div id="print-wrapper">
          ${reportElem.innerHTML}
        </div>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Print iframe failed, fallback to window.print', err);
        window.print();
      } finally {
        setTimeout(() => {
          iframe.remove();
        }, 2000);
      }
    }, 350);
  };

  const totalDrivers = summary?.totalDrivers || columns.length || 0;
  const totalAmount = summary?.totalAmount || 0;
  const totalOperations = summary?.totalOperations || 0;
  const averagePayout = summary?.averagePayout || 0;
  const managementTotal = summary?.managementTotal || 0;
  const productionTotal = summary?.productionTotal || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('driverPayouts.printModalTitle')}
      size="full"
    >
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 no-print">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={e => setIncludeSignatures(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              {t('driverPayouts.showSignatures')}
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              {t('driverPayouts.close')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="font-bold shadow-md shadow-brand-500/20"
            >
              <Printer className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
              {t('driverPayouts.printNow')}
            </Button>
          </div>
        </div>

        {/* Printable Sheet Container */}
        <div
          id="driver-payout-printable-report"
          className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm text-slate-900 printable-content print:p-0 print:border-none print:shadow-none"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-3 mb-4">
            <div className="flex items-center justify-between gap-4">
              {/* Company Logo & Identity */}
              <div className="flex items-center gap-3 shrink-0">
                <img
                  src={newHopeLogo}
                  alt="New Hope Egypt"
                  className="h-12 w-auto object-contain border border-slate-200 rounded p-0.5 bg-white shadow-xs shrink-0"
                />
                <div>
                  <div
                    dir="ltr"
                    className={cn(
                      'font-black text-xs md:text-sm text-slate-950 tracking-tight whitespace-nowrap leading-tight',
                      isRtl ? 'text-right' : 'text-left'
                    )}
                  >
                    {t('driverPayouts.companyNameEn')}
                  </div>
                  <div className="text-[11px] font-bold text-slate-700 whitespace-nowrap mt-0.5">
                    {t('driverPayouts.companyName')}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-black whitespace-nowrap">
                      {t('driverPayouts.departmentName')}
                    </span>
                    <span className="text-[9px] text-slate-500 font-semibold whitespace-nowrap">
                      {t('driverPayouts.deptSub')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Center: Title & Period */}
              <div className="text-center px-2 shrink-0">
                <h1 className="text-base md:text-lg font-black text-slate-950 tracking-tight whitespace-nowrap leading-tight">
                  {t('driverPayouts.weeklySheetTitle')}
                </h1>
                <div className="text-[10px] font-bold text-slate-500 tracking-wide mt-0.5 whitespace-nowrap">
                  {t('driverPayouts.printSheetSubtitle')}
                </div>
                <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 text-[11px] font-bold px-3 py-0.5 rounded-full mt-1 border border-slate-300 whitespace-nowrap">
                  <span className="text-slate-500">{t('driverPayouts.weekPeriodLabel')}</span>
                  <span className="font-black text-slate-950">
                    {summary?.weekLabel || summary?.weekPeriod || ''}
                  </span>
                </div>
              </div>

              {/* Side: Mini KPI Box */}
              <div className="border-2 border-slate-800 rounded-lg overflow-hidden text-xs shrink-0 w-[250px] bg-slate-50/50">
                <table className="w-full text-xs border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-300 bg-slate-100/70">
                      <td className={cn("py-1.5 px-3 font-bold text-slate-700 whitespace-nowrap", isRtl ? "text-right" : "text-left")}>
                        {t('driverPayouts.kpiTotalDrivers')}:
                      </td>
                      <td className={cn("py-1.5 px-3 font-black text-slate-950 whitespace-nowrap", isRtl ? "text-left" : "text-right")}>
                        {totalDrivers}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-300 bg-white">
                      <td className={cn("py-1.5 px-3 font-bold text-slate-700 whitespace-nowrap", isRtl ? "text-right" : "text-left")}>
                        {t('driverPayouts.kpiTotalAmount')}:
                      </td>
                      <td className={cn("py-1.5 px-3 font-black text-emerald-700 whitespace-nowrap", isRtl ? "text-left" : "text-right")}>
                        {totalAmount.toLocaleString()} {t('driverPayouts.egp')}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-300 bg-slate-100/70">
                      <td className={cn("py-1.5 px-3 font-bold text-slate-700 whitespace-nowrap", isRtl ? "text-right" : "text-left")}>
                        {t('driverPayouts.kpiTotalOperations')}:
                      </td>
                      <td className={cn("py-1.5 px-3 font-black text-slate-950 whitespace-nowrap", isRtl ? "text-left" : "text-right")}>
                        {totalOperations}
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <td className={cn("py-1.5 px-3 font-bold text-slate-700 whitespace-nowrap", isRtl ? "text-right" : "text-left")}>
                        {t('driverPayouts.kpiAveragePayout')}:
                      </td>
                      <td className={cn("py-1.5 px-3 font-black text-indigo-800 whitespace-nowrap", isRtl ? "text-left" : "text-right")}>
                        {averagePayout.toLocaleString()} {t('driverPayouts.egp')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto mb-4 print:overflow-visible">
            <table className="w-full text-center border-collapse text-[10px] border-2 border-slate-800 table-fixed">
              {/* Driver Headers */}
              <thead>
                <tr className="bg-[#FFC000] text-slate-950 font-black border-b-2 border-slate-800">
                  {columns.map(col => (
                    <th
                      key={col.driver.id}
                      className="py-1.5 px-0.5 border border-slate-700 font-bold leading-tight"
                    >
                      <div className="font-black text-[10px] leading-tight break-words">{col.driver.name}</div>
                      <div className="text-[8px] font-bold text-slate-900 mt-0.5">
                        {col.driver.vehicleType === 'عربية فان'
                          ? t('driverPayouts.vehicleVan', 'عربية فان')
                          : t('driverPayouts.vehicleMicrobus', 'ميكروباص')}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Rows */}
              <tbody className="divide-y divide-slate-300 bg-white">
                {Array.from({ length: maxRows || 4 }).map((_, rIdx) => (
                  <tr key={rIdx} className="border-b border-slate-300">
                    {columns.map(col => {
                      const tx = col.transactions[rIdx];
                      const isManagement = tx?.category === 'management';
                      return (
                        <td
                          key={col.driver.id}
                          className="py-1 px-0.5 border border-slate-300 font-bold text-[10px]"
                        >
                          {tx ? (
                            <span className={isManagement ? 'text-[#c00000] font-black' : 'text-slate-900'}>
                              {tx.amount.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="bg-[#bbf7d0] text-emerald-950 font-black border-t-2 border-slate-800">
                  {columns.map(col => (
                    <td key={col.driver.id} className="py-1.5 px-0.5 border border-slate-400 text-[10px] leading-tight">
                      <div className="font-black">{col.totalAmount.toLocaleString()} {t('driverPayouts.egp')}</div>
                      <div className="text-[8px] text-emerald-900 font-bold">{t('driverPayouts.totalPayout')}</div>
                    </td>
                  ))}
                </tr>

                {/* Count Row */}
                <tr className="bg-[#bfdbfe] text-blue-950 font-black border-t border-slate-400">
                  {columns.map(col => (
                    <td key={col.driver.id} className="py-1 px-0.5 border border-slate-400 text-[10px] leading-tight">
                      <div className="font-black">{col.operationsCount}</div>
                      <div className="text-[8px] text-blue-900 font-bold">{t('driverPayouts.tripsCount')}</div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Master Breakdown Banners (Matching Excel bottom rows) */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#2e6930] text-white p-2.5 rounded-lg text-center font-bold">
              <span className="text-[11px] block text-emerald-100 font-medium">
                {t('driverPayouts.grandTotal')}
              </span>
              <span className="text-lg font-black block mt-0.5">
                {totalAmount.toLocaleString()} {t('driverPayouts.egp')}
              </span>
            </div>

            <div className="bg-[#c00000] text-white p-2.5 rounded-lg text-center font-bold">
              <span className="text-[11px] block text-rose-100 font-medium">
                {t('driverPayouts.managementTotal')}
              </span>
              <span className="text-lg font-black block mt-0.5">
                {managementTotal.toLocaleString()} {t('driverPayouts.egp')}
              </span>
            </div>

            <div className="bg-[#f8cbad] text-slate-950 p-2.5 rounded-lg text-center font-bold">
              <span className="text-[11px] block text-slate-800 font-medium">
                {t('driverPayouts.productionTotal')}
              </span>
              <span className="text-lg font-black block mt-0.5">
                {productionTotal.toLocaleString()} {t('driverPayouts.egp')}
              </span>
            </div>
          </div>

          {/* Official Signatures */}
          {includeSignatures && (
            <div className="border-t-2 border-slate-400 pt-3 mt-3 grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-6">
                  {t('driverPayouts.signatureFleetOfficer')}
                </span>
                <span className="border-t border-slate-400 pt-1 px-6 inline-block text-slate-500 font-mono">
                  {t('driverPayouts.signatureLabel')}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block mb-6">
                  {t('driverPayouts.signatureAccounting')}
                </span>
                <span className="border-t border-slate-400 pt-1 px-6 inline-block text-slate-500 font-mono">
                  {t('driverPayouts.signatureLabel')}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block mb-6">
                  {t('driverPayouts.signatureDirector')}
                </span>
                <span className="border-t border-slate-400 pt-1 px-6 inline-block text-slate-500 font-mono">
                  {t('driverPayouts.stampLabel')}
                </span>
              </div>
            </div>
          )}

          {/* Footer date */}
          <div className="text-[10px] text-slate-500 flex items-center justify-between mt-3 pt-1.5 border-t border-slate-200">
            <span className="font-semibold">
              {t('driverPayouts.companyNameEn')} - {t('driverPayouts.printFooterSystem')}
            </span>
            <span>
              {t('driverPayouts.printedAt')} {new Date().toLocaleString(isRtl ? 'ar-EG' : isZh ? 'zh-CN' : 'en-US')}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

