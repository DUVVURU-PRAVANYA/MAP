import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Users,
  Package,
  Layers,
  Calendar,
  ArrowRight,
  Info,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';

export const DataQualitySummary: React.FC = () => {
  const {
    qualitySummary,
    setActiveView,
    filename,
    selectedReportingFY,
    setSelectedReportingFY,
    reportingPeriodLabel,
    outsideReportingPeriodRecords,
    filteredRecords,
    allRecords,
    availableReportingFYs,
  } = useAnalytics();
  const [selectedRuleDetails, setSelectedRuleDetails] = useState<any | null>(null);

  if (!qualitySummary) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8 font-sans overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center space-x-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Step 2 of 2 • Data Quality Audit</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Data Quality & Cleaning Summary</h1>
            <p className="text-sm text-slate-400 mt-1">
              Workbook: <span className="text-white font-medium">{filename}</span>
            </p>
          </div>

          <button
            onClick={() => setActiveView('overview')}
            className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/30 transition-all shrink-0"
          >
            <span>Continue to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Reporting Financial Year Selector & Period Audit Card */}
        <div className="bg-slate-800/90 border border-brand-500/30 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
            <div>
              <div className="inline-flex items-center space-x-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Calendar className="w-4 h-4" />
                <span>Selected Financial Year</span>
              </div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-3">
                <span>{selectedReportingFY || 'N/A'}</span>
                <span className="text-xs font-semibold text-brand-300 bg-brand-950/80 border border-brand-800 px-3 py-1 rounded-full">
                  {reportingPeriodLabel}
                </span>
              </h2>
            </div>

            <div className="flex items-center space-x-3">
              <label className="text-xs text-slate-400 font-semibold whitespace-nowrap">Financial Year:</label>
              <select
                value={selectedReportingFY}
                onChange={e => setSelectedReportingFY(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-brand-500/50 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Years</option>
                {availableReportingFYs.map(fy => (
                  <option key={fy} value={fy}>
                    {fy}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
              <p className="text-slate-400 font-medium">Total Uploaded Records</p>
              <p className="text-lg font-bold text-white mt-1">{allRecords.length.toLocaleString()}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
              <p className="text-emerald-300 font-medium">Valid In-FY Records</p>
              <p className="text-lg font-bold text-emerald-400 mt-1">{filteredRecords.length.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-400/80 mt-0.5">Participating in Main Analytics</p>
            </div>
            <div className={`p-3.5 rounded-xl border ${outsideReportingPeriodRecords.length > 0 ? 'bg-amber-950/40 border-amber-800/60' : 'bg-slate-900/60 border-slate-700/60'}`}>
              <p className="text-amber-300 font-medium">Outside Financial Year Records</p>
              <p className="text-lg font-bold text-amber-400 mt-1">{outsideReportingPeriodRecords.length}</p>
              <p className="text-[10px] text-amber-400/80 mt-0.5">Isolated for Data Quality & Audit</p>
            </div>
          </div>

          {outsideReportingPeriodRecords.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>{outsideReportingPeriodRecords.length} record(s)</strong> fall outside the selected reporting period ({reportingPeriodLabel}).
                </span>
              </div>
              <button
                onClick={() => setActiveView('quality')}
                className="px-3 py-1 text-xs font-semibold bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 rounded-lg border border-amber-700 transition-all shrink-0"
              >
                Inspect Audit Log
              </button>
            </div>
          )}
        </div>

        {/* Dataset Summary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
            <p className="text-xs text-slate-400 font-medium">Valid Period Rows</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{filteredRecords.length.toLocaleString()}</p>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
            <p className="text-xs text-slate-400 font-medium">Total Uploaded</p>
            <p className="text-xl font-bold text-white mt-1">{allRecords.length.toLocaleString()}</p>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
            <p className="text-xs text-slate-400 font-medium">Customers</p>
            <p className="text-xl font-bold text-brand-400 mt-1">{qualitySummary.totalCustomers}</p>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
            <p className="text-xs text-slate-400 font-medium">Products</p>
            <p className="text-xl font-bold text-brand-400 mt-1">{qualitySummary.totalProducts}</p>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
            <p className="text-xs text-slate-400 font-medium">Segments</p>
            <p className="text-xl font-bold text-brand-400 mt-1">{qualitySummary.totalSegments}</p>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
            <p className="text-xs text-slate-400 font-medium">Date Range</p>
            <p className="text-xs font-semibold text-slate-300 mt-1 truncate">
              {qualitySummary.dateRangeStart} to {qualitySummary.dateRangeEnd}
            </p>
          </div>
        </div>

        {/* Two Column Layout: Validation Rules vs Cleaning Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Validation Rules */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-brand-400" />
              <span>Automated Validation Cards</span>
            </h2>

            <div className="space-y-3">
              {qualitySummary.validationRules.map(rule => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60"
                >
                  <div className="flex items-center space-x-3">
                    {rule.status === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-white">{rule.title}</h4>
                      <p className="text-xs text-slate-400">{rule.description}</p>
                    </div>
                  </div>

                  {rule.details || rule.count ? (
                    <button
                      onClick={() => setSelectedRuleDetails(rule)}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-brand-300 rounded-lg border border-slate-700"
                    >
                      View Details
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                      Passed
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Data Cleaning Summary */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Data Cleaning Actions</span>
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-slate-700/60 text-slate-300">
                  <span>Original Uploaded Records</span>
                  <span className="font-mono font-bold text-white">{qualitySummary.originalRecords.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700/60 text-amber-400">
                  <span>Duplicate Records Removed</span>
                  <span className="font-mono font-bold">-{qualitySummary.duplicatesRemoved}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700/60 text-amber-400">
                  <span>Invalid / Non-Numeric Rows Removed</span>
                  <span className="font-mono font-bold">-{qualitySummary.invalidRecordsRemoved}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700/60 text-indigo-400">
                  <span>Missing Attributes Auto-Filled</span>
                  <span className="font-mono font-bold">+{qualitySummary.missingValuesFixed}</span>
                </div>
                <div className="flex justify-between items-center py-3 text-lg font-bold text-emerald-400">
                  <span>Final Processed Clean Dataset</span>
                  <span className="font-mono text-2xl">{qualitySummary.cleanRecords.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-brand-950/50 border border-brand-800/50 text-xs text-brand-200">
              <p className="font-semibold flex items-center space-x-1.5 mb-1">
                <Info className="w-4 h-4 text-brand-400" />
                <span>Original File Integrity Preserved</span>
              </p>
              Your uploaded file remains unedited. The cleaned dataset is isolated for analytics and dashboard rendering.
            </div>
          </div>
        </div>

        {/* Rule Details Modal */}
        {selectedRuleDetails && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white">{selectedRuleDetails.title} Details</h3>
                <button
                  onClick={() => setSelectedRuleDetails(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">{selectedRuleDetails.description}</p>

              {selectedRuleDetails.details ? (
                <ul className="space-y-2 text-xs text-slate-300">
                  {selectedRuleDetails.details.map((d: string, i: number) => (
                    <li key={i} className="p-2 rounded bg-slate-800 border border-slate-700">
                      {d}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-medium text-amber-400">
                  {selectedRuleDetails.count} record(s) flagged during processing.
                </p>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedRuleDetails(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
