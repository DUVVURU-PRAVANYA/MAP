import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, FileSpreadsheet, Search, RefreshCw } from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';

export const DataQualityPage: React.FC = () => {
  const {
    qualitySummary,
    filename,
    allRecords,
    filteredRecords,
    selectedReportingFY,
    setSelectedReportingFY,
    reportingPeriodLabel,
    outsideReportingPeriodRecords,
    availableReportingFYs,
  } = useAnalytics();
  const [filterType, setFilterType] = useState<'all' | 'flagged'>('all');
  const [search, setSearch] = useState('');

  if (!qualitySummary) {
    return <div className="p-8 text-center text-slate-500">No active dataset quality audit loaded.</div>;
  }

  const flaggedRows = qualitySummary.flaggedRows || [];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Data Quality & Audit Log</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Permanent audit log of file processing, reporting financial year validation rules, and cleaning actions
        </p>
      </div>

      {/* Reporting Financial Year Audit Card */}
      <div className="bg-white dark:bg-slate-900 border border-brand-300 dark:border-brand-800/60 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Selected Reporting Financial Year:</span>
                <span className="text-brand-600 dark:text-brand-400">{selectedReportingFY || 'N/A'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Reporting Period Bounds: <span className="font-semibold text-slate-700 dark:text-slate-200">{reportingPeriodLabel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Select Reporting FY:</label>
            <select
              value={selectedReportingFY}
              onChange={e => setSelectedReportingFY(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {availableReportingFYs.map(fy => (
                <option key={fy} value={fy}>
                  {fy}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <p className="text-slate-500 dark:text-slate-400 font-medium">Total Uploaded Records</p>
            <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
              {allRecords.length.toLocaleString()}
            </p>
          </div>
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60">
            <p className="text-emerald-700 dark:text-emerald-300 font-medium">Valid In-Period Records</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {filteredRecords.length.toLocaleString()}
            </p>
            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Participating in Main Analytics</p>
          </div>
          <div className={`p-3.5 rounded-xl border ${outsideReportingPeriodRecords.length > 0 ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/60' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60'}`}>
            <p className="text-amber-700 dark:text-amber-300 font-medium">Outside Reporting Period Records</p>
            <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1">
              {outsideReportingPeriodRecords.length}
            </p>
            <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">Isolated for Audit Log</p>
          </div>
        </div>

        {outsideReportingPeriodRecords.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>{outsideReportingPeriodRecords.length} record(s)</strong> fall outside the selected reporting period ({reportingPeriodLabel}).
            </span>
          </div>
        )}
      </div>

      {/* Dataset Overview Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{filename}</h3>
            <p className="text-xs text-slate-400">Processed File Audit Summary</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <p className="text-slate-400">Original Row Count</p>
            <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {qualitySummary.originalRecords.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <p className="text-slate-400">Clean Active Rows</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {qualitySummary.cleanRecords.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <p className="text-slate-400">Duplicates Cleaned</p>
            <p className="text-base font-bold text-amber-500 mt-0.5">{qualitySummary.duplicatesRemoved}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <p className="text-slate-400">Missing Fields Fixed</p>
            <p className="text-base font-bold text-indigo-500 mt-0.5">{qualitySummary.missingValuesFixed}</p>
          </div>
        </div>
      </div>

      {/* Outside Reporting Period Audit Log Table */}
      {outsideReportingPeriodRecords.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/80 rounded-2xl overflow-hidden shadow-card space-y-3">
          <div className="p-4 border-b border-amber-100 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/30 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Outside Selected Reporting Period Records ({outsideReportingPeriodRecords.length})
              </h3>
            </div>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2.5 py-0.5 rounded-full">
              Audit Warning
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Bill Date</th>
                  <th className="py-3 px-4">Transaction FY</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Material Code</th>
                  <th className="py-3 px-4">Sale Value (INR)</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {outsideReportingPeriodRecords.map(r => (
                  <tr key={r.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/20 font-medium">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500">{r.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{r.billDate}</td>
                    <td className="py-3.5 px-4 text-slate-500">{r.financialYear}</td>
                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">{r.customer}</td>
                    <td className="py-3.5 px-4 font-mono">{r.materialCode}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      ₹{r.saleValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                        Outside reporting period
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Validation Rules Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Validation Rules Audit</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {qualitySummary.validationRules.map(rule => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
            >
              <div className="flex items-center space-x-3">
                {rule.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{rule.title}</h4>
                  <p className="text-[11px] text-slate-400">{rule.description}</p>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  rule.status === 'success'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {rule.status === 'success' ? 'PASSED' : 'FLAGGED'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Flagged Rows Inspection Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-card">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Flagged & Excluded Rows ({flaggedRows.length})
          </h3>
        </div>

        {flaggedRows.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No rows were flagged or removed. The uploaded file contained 100% clean structure.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Row #</th>
                  <th className="py-3 px-4">Audit Issue</th>
                  <th className="py-3 px-4">Raw Snippet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {flaggedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400">Row #{row.rowNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-amber-500">{row.issue}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 truncate max-w-xs">
                      {JSON.stringify(row.rawData)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
