import React from 'react';
import { Loader2, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';

export const ProcessingAnimation: React.FC = () => {
  const { processingStage } = useAnalytics();

  const stages = [
    'Uploading Excel workbook...',
    'Reading sheets & checking column definitions...',
    'Validating numeric values and date formats...',
    'Cleaning duplicates and missing attributes...',
    'Generating interactive dashboard & business insights...',
  ];

  const currentStageIndex = stages.findIndex(s => s === processingStage);
  const activeIdx = currentStageIndex >= 0 ? currentStageIndex : 0;
  const progressPct = Math.round(((activeIdx + 1) / stages.length) * 100);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white px-4 py-12 relative overflow-hidden font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-8 backdrop-blur-md shadow-2xl text-center relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-brand-900/60 text-brand-400 flex items-center justify-center mx-auto mb-6 border border-brand-700/50">
          <FileSpreadsheet className="w-8 h-8 animate-pulse text-brand-400" />
        </div>

        <h2 className="text-xl font-bold text-white mb-1">Processing Sales Excel</h2>
        <p className="text-xs text-slate-400 mb-8">Validating columns, cleaning records, and compiling analytics</p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-700/70 h-2.5 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Stages Checklist */}
        <div className="space-y-3 text-left">
          {stages.map((stage, idx) => {
            const isDone = idx < activeIdx;
            const isCurrent = idx === activeIdx;

            return (
              <div
                key={idx}
                className={`flex items-center space-x-3 text-xs p-2.5 rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-brand-950/80 text-brand-200 border border-brand-800/60 font-semibold'
                    : isDone
                    ? 'text-emerald-400 font-medium'
                    : 'text-slate-500 opacity-60'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-brand-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                )}
                <span className="truncate">{stage}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
