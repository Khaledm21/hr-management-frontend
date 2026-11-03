import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Printer, Download, X, Building, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { DriverWeeklyColumn, WeeklyPayoutSummary } from '../../../types/driverPayouts';
import { cn } from '../../../lib/utils';
import newHopeLogo from '../../../assets/new-hope-logo.png';
import { useCompany } from '../../../context/CompanyContext';

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
  const { logo, settings } = useCompany();
  const [includeSignatures, setIncludeSignatures] = useState(true);

  const isRtl = i18n.language === 'ar';
  const isZh = i18n.language === 'zh-CN';
  const lang = i18n.language;

  const totalDrivers = summary?.totalDrivers || columns.length || 0;
  const totalAmount = summary?.totalAmount || 0;
  const totalOperations = summary?.totalOperations || 0;
  const averagePayout = summary?.averagePayout || 0;
  const managementTotal = summary?.managementTotal || 0;
  const productionTotal = summary?.productionTotal || 0;

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
    iframe.style.width = '297mm';
    iframe.style.height = '210mm';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const fontFamily = isRtl
      ? "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif"
      : isZh
      ? "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"
      : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    // Extract active stylesheets as supplementary
    const activeStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="${isRtl ? 'rtl' : 'ltr'}" lang="${lang}">
      <head>
        <meta charset="utf-8" />
        <base href="${window.location.origin}/" />
        <title>${t('driverPayouts.weeklySheetTitle')}</title>
        ${activeStyles}
        <style>
          @page {
            size: A4 landscape;
            margin: 4mm 5mm 4mm 5mm;
          }
          @media print {
            @page {
              size: A4 landscape;
              margin: 4mm 5mm 4mm 5mm;
            }
            html, body {
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              overflow: visible !important;
            }
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: ${fontFamily} !important;
            direction: ${isRtl ? 'rtl' : 'ltr'} !important;
            width: 100% !important;
            -webkit-font-smoothing: antialiased;
          }
          #print-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }

          /* Header layout */
          .driver-print-header {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            border-bottom: 2px solid #0f172a !important;
            padding-bottom: 4px !important;
            margin-bottom: 5px !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .driver-brand-group {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            flex-shrink: 0 !important;
          }
          .driver-brand-logo {
            height: 38px !important;
            max-height: 38px !important;
            width: auto !important;
            max-width: 120px !important;
            object-fit: contain !important;
            display: block !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 4px !important;
            padding: 1px !important;
            background: #ffffff !important;
          }
          .driver-brand-titles {
            display: flex !important;
            flex-direction: column !important;
            line-height: 1.15 !important;
          }
          .driver-company-en {
            font-size: 11px !important;
            font-weight: 900 !important;
            color: #020617 !important;
            letter-spacing: -0.2px !important;
            white-space: nowrap !important;
          }
          .driver-company-ar {
            font-size: 10px !important;
            font-weight: 700 !important;
            color: #334155 !important;
            white-space: nowrap !important;
          }
          .driver-dept-tag {
            display: inline-block !important;
            background: #ecfdf5 !important;
            color: #065f46 !important;
            border: 1px solid #a7f3d0 !important;
            padding: 1px 6px !important;
            border-radius: 3px !important;
            font-size: 8px !important;
            font-weight: 800 !important;
            white-space: nowrap !important;
            margin-top: 1px !important;
          }

          /* Center title */
          .driver-center-title {
            text-align: center !important;
            flex-shrink: 0 !important;
          }
          .driver-title-h1 {
            font-size: 15px !important;
            font-weight: 900 !important;
            color: #020617 !important;
            margin: 0 !important;
            line-height: 1.15 !important;
            white-space: nowrap !important;
          }
          .driver-subtitle {
            font-size: 8.5px !important;
            font-weight: 600 !important;
            color: #64748b !important;
            margin-top: 1px !important;
            white-space: nowrap !important;
          }
          .driver-week-badge {
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            background: #f1f5f9 !important;
            color: #0f172a !important;
            border: 1px solid #cbd5e1 !important;
            padding: 1px 8px !important;
            border-radius: 9999px !important;
            font-size: 9.5px !important;
            font-weight: 800 !important;
            margin-top: 2px !important;
            white-space: nowrap !important;
          }

          /* KPI Mini Box */
          .driver-kpi-box {
            width: 220px !important;
            border: 1.5px solid #0f172a !important;
            border-radius: 4px !important;
            overflow: hidden !important;
            background: #f8fafc !important;
            flex-shrink: 0 !important;
          }
          .driver-kpi-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 8.5px !important;
          }
          .driver-kpi-table td {
            padding: 1.5px 5px !important;
            border: none !important;
            border-bottom: 1px solid #e2e8f0 !important;
            line-height: 1.2 !important;
          }
          .driver-kpi-table tr:last-child td {
            border-bottom: none !important;
          }

          /* Table Matrix */
          .driver-matrix-table {
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            border: 1.5px solid #0f172a !important;
            margin-bottom: 5px !important;
          }
          .driver-matrix-table th {
            background-color: #FFC000 !important;
            color: #000000 !important;
            font-weight: 800 !important;
            padding: 3px 1px !important;
            border: 1px solid #475569 !important;
            text-align: center !important;
            vertical-align: middle !important;
            word-break: normal !important;
            white-space: normal !important;
          }
          .driver-name-text {
            font-size: 8.5px !important;
            font-weight: 900 !important;
            line-height: 1.1 !important;
            color: #000000 !important;
            display: block !important;
          }
          .driver-vehicle-badge {
            font-size: 7.5px !important;
            font-weight: 700 !important;
            color: #1e293b !important;
            white-space: nowrap !important;
            display: block !important;
            margin-top: 1px !important;
          }
          .driver-matrix-table td {
            padding: 2.5px 1px !important;
            border: 1px solid #cbd5e1 !important;
            text-align: center !important;
            font-size: 9px !important;
            font-weight: 700 !important;
            vertical-align: middle !important;
            white-space: nowrap !important;
            line-height: 1.2 !important;
          }
          .driver-matrix-table tbody tr:nth-child(even) {
            background-color: #fafafa !important;
          }
          .driver-matrix-table tbody tr:nth-child(odd) {
            background-color: #ffffff !important;
          }
          .mgmt-val {
            color: #c00000 !important;
            font-weight: 900 !important;
          }
          .total-row td {
            background-color: #bbf7d0 !important;
            color: #064e3b !important;
            font-weight: 900 !important;
            border-top: 1.5px solid #0f172a !important;
            border: 1px solid #86efac !important;
            padding: 3px 1px !important;
          }
          .count-row td {
            background-color: #bfdbfe !important;
            color: #1e3a8a !important;
            font-weight: 900 !important;
            border: 1px solid #93c5fd !important;
            padding: 2px 1px !important;
          }
          .driver-total-amount {
            font-size: 8.5px !important;
            font-weight: 900 !important;
            white-space: nowrap !important;
            line-height: 1.1 !important;
          }
          .driver-total-label {
            font-size: 7px !important;
            font-weight: 700 !important;
            color: #065f46 !important;
            white-space: nowrap !important;
            margin-top: 1px !important;
          }
          .driver-count-val {
            font-size: 8.5px !important;
            font-weight: 900 !important;
            line-height: 1.1 !important;
          }
          .driver-count-label {
            font-size: 7px !important;
            font-weight: 700 !important;
            color: #1e3a8a !important;
            white-space: nowrap !important;
            margin-top: 1px !important;
          }

          /* Master Breakdown Cards */
          .driver-breakdown-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 6px !important;
            margin-bottom: 5px !important;
            page-break-inside: avoid !important;
          }
          .driver-stat-card {
            border-radius: 4px !important;
            padding: 4px 6px !important;
            text-align: center !important;
            font-weight: bold !important;
          }
          .card-grand-total {
            background-color: #2e6930 !important;
            color: #ffffff !important;
          }
          .card-mgmt-total {
            background-color: #c00000 !important;
            color: #ffffff !important;
          }
          .card-prod-total {
            background-color: #f8cbad !important;
            color: #0f172a !important;
          }
          .stat-card-title {
            font-size: 9px !important;
            display: block !important;
            font-weight: 600 !important;
            opacity: 0.95 !important;
          }
          .stat-card-amount {
            font-size: 13px !important;
            font-weight: 900 !important;
            display: block !important;
            margin-top: 1px !important;
            white-space: nowrap !important;
          }

          /* Signatures */
          .driver-signatures-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 12px !important;
            margin-top: 5px !important;
            padding-top: 4px !important;
            border-top: 1.5px solid #94a3b8 !important;
            text-align: center !important;
            font-size: 9px !important;
            page-break-inside: avoid !important;
          }
          .sig-label-top {
            font-weight: 800 !important;
            color: #334155 !important;
            display: block !important;
            margin-bottom: 12px !important;
          }
          .sig-underline {
            border-top: 1px dashed #64748b !important;
            display: inline-block !important;
            padding: 2px 24px 0 !important;
            color: #64748b !important;
            font-size: 8px !important;
          }

          /* Footer */
          .driver-print-footer {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            font-size: 8px !important;
            color: #64748b !important;
            margin-top: 4px !important;
            padding-top: 2px !important;
            border-top: 1px solid #e2e8f0 !important;
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

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Print iframe failed, fallback to window.print', err);
        window.print();
      } finally {
        setTimeout(() => {
          iframe.remove();
        }, 3000);
      }
    };

    const images = Array.from(doc.images || []);
    if (images.length === 0) {
      setTimeout(triggerPrint, 250);
    } else {
      Promise.all(
        images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      ).then(() => {
        setTimeout(triggerPrint, 250);
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('driverPayouts.printModalTitle')}
      size="full"
    >
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-[#0B0F19] p-3 rounded-xl border border-slate-200 dark:border-[#1E293B] no-print transition-colors">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={e => setIncludeSignatures(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
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
          <div className="driver-print-header">
            {/* Company Logo & Identity */}
            <div className="driver-brand-group">
              <img
                src={logo || newHopeLogo}
                alt="New Hope Egypt"
                className="driver-brand-logo"
              />
              <div className="driver-brand-titles">
                <div
                  dir="ltr"
                  className={cn(
                    'driver-company-en',
                    isRtl ? 'text-right' : 'text-left'
                  )}
                >
                  {settings.companyName || t('driverPayouts.companyNameEn')}
                </div>
                <div className="driver-company-ar">
                  {settings.companyNameAr || t('driverPayouts.companyName')}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="driver-dept-tag">
                    {t('driverPayouts.departmentName')}
                  </span>
                  <span className="text-[8.5px] text-slate-500 font-semibold whitespace-nowrap">
                    {t('driverPayouts.deptSub')}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Title & Period */}
            <div className="driver-center-title">
              <h1 className="driver-title-h1">
                {t('driverPayouts.weeklySheetTitle')}
              </h1>
              <div className="driver-subtitle">
                {t('driverPayouts.printSheetSubtitle')}
              </div>
              <div className="driver-week-badge">
                <span className="text-slate-500">{t('driverPayouts.weekPeriodLabel')}</span>
                <span className="font-black text-slate-950">
                  {summary?.weekLabel || summary?.weekPeriod || ''}
                </span>
              </div>
            </div>

            {/* Side: Mini KPI Box */}
            <div className="driver-kpi-box">
              <table className="driver-kpi-table">
                <tbody>
                  <tr className="bg-slate-100/70">
                    <td className={cn("font-bold text-slate-700 whitespace-nowrap", isRtl ? "text-right" : "text-left")}>
                      {t('driverPayouts.kpiTotalDrivers')}:
                    </td>
                    <td className={cn("font-black text-slate-950 whitespace-nowrap", isRtl ? "text-left" : "text-right")}>
                      {totalDrivers}
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className={cn("font-bold text-slate-700 whitespace-nowrap", isRtl ? "text-right" : "text-left")}>
                      {t('driverPayouts.kpiTotalAmount')}:
                    </td>
                    <td className={cn("font-black text-emerald-700 whitespace-nowrap", isRtl ? "text-left" : "text-right")}>
                      {totalAmount.toLocaleString()} {t('driverPayouts.egp')}
                    </td>
                  </tr>
                  <tr className="bg-slate-100/70">
                    <td className={cn("font-bold text-slate-700 whitespace-nowrap", isRtl ? "text-right" : "text-left")}>
                      {t('driverPayouts.kpiTotalOperations')}:
                    </td>
                    <td className={cn("font-black text-slate-950 whitespace-nowrap", isRtl ? "text-left" : "text-right")}>
                      {totalOperations}
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className={cn("font-bold text-slate-700 whitespace-nowrap", isRtl ? "text-right" : "text-left")}>
                      {t('driverPayouts.kpiAveragePayout')}:
                    </td>
                    <td className={cn("font-black text-indigo-800 whitespace-nowrap", isRtl ? "text-left" : "text-right")}>
                      {averagePayout.toLocaleString()} {t('driverPayouts.egp')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto mb-3 print:overflow-visible">
            <table className="driver-matrix-table">
              {/* Driver Headers */}
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col.driver.id}>
                      <span className="driver-name-text">{col.driver.name}</span>
                      <span className="driver-vehicle-badge">
                        {col.driver.vehicleType === 'عربية فان'
                          ? t('driverPayouts.vehicleVan', 'عربية فان')
                          : t('driverPayouts.vehicleMicrobus', 'ميكروباص')}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Rows */}
              <tbody>
                {Array.from({ length: maxRows || 4 }).map((_, rIdx) => (
                  <tr key={rIdx}>
                    {columns.map(col => {
                      const tx = col.transactions[rIdx];
                      const isManagement = tx?.category === 'management';
                      return (
                        <td key={col.driver.id}>
                          {tx ? (
                            <span className={isManagement ? 'mgmt-val' : 'text-slate-900 font-bold'}>
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
                <tr className="total-row">
                  {columns.map(col => (
                    <td key={col.driver.id}>
                      <div className="driver-total-amount">
                        {col.totalAmount.toLocaleString()} {t('driverPayouts.egp')}
                      </div>
                      <div className="driver-total-label">
                        {t('driverPayouts.totalPayout')}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Count Row */}
                <tr className="count-row">
                  {columns.map(col => (
                    <td key={col.driver.id}>
                      <div className="driver-count-val">
                        {col.operationsCount}
                      </div>
                      <div className="driver-count-label">
                        {t('driverPayouts.tripsCount')}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Master Breakdown Banners */}
          <div className="driver-breakdown-grid">
            <div className="driver-stat-card card-grand-total">
              <span className="stat-card-title">
                {t('driverPayouts.grandTotal')}
              </span>
              <span className="stat-card-amount">
                {totalAmount.toLocaleString()} {t('driverPayouts.egp')}
              </span>
            </div>

            <div className="driver-stat-card card-mgmt-total">
              <span className="stat-card-title">
                {t('driverPayouts.managementTotal')}
              </span>
              <span className="stat-card-amount">
                {managementTotal.toLocaleString()} {t('driverPayouts.egp')}
              </span>
            </div>

            <div className="driver-stat-card card-prod-total">
              <span className="stat-card-title">
                {t('driverPayouts.productionTotal')}
              </span>
              <span className="stat-card-amount">
                {productionTotal.toLocaleString()} {t('driverPayouts.egp')}
              </span>
            </div>
          </div>

          {/* Official Signatures */}
          {includeSignatures && (
            <div className="driver-signatures-grid">
              <div>
                <span className="sig-label-top">
                  {t('driverPayouts.signatureFleetOfficer')}
                </span>
                <span className="sig-underline">
                  {t('driverPayouts.signatureLabel')}
                </span>
              </div>
              <div>
                <span className="sig-label-top">
                  {t('driverPayouts.signatureAccounting')}
                </span>
                <span className="sig-underline">
                  {t('driverPayouts.signatureLabel')}
                </span>
              </div>
              <div>
                <span className="sig-label-top">
                  {t('driverPayouts.signatureDirector')}
                </span>
                <span className="sig-underline">
                  {t('driverPayouts.stampLabel')}
                </span>
              </div>
            </div>
          )}

          {/* Footer date */}
          <div className="driver-print-footer">
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
