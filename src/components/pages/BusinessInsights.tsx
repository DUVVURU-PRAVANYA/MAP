import React, { useState } from 'react';
import { Lightbulb, HelpCircle, ArrowRight, TrendingUp, TrendingDown, Users, Trophy, AlertTriangle, ShieldCheck, Filter } from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';
import { BusinessInsight } from '../../types/analytics';

export const BusinessInsights: React.FC = () => {
  const { insights, investigateInsight } = useAnalytics();
  const [selectedInsight, setSelectedInsight] = useState<BusinessInsight | null>(null);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'growth':
        return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      case 'decline':
        return <TrendingDown className="w-5 h-5 text-rose-500" />;
      case 'top_performer':
        return <Trophy className="w-5 h-5 text-amber-500" />;
      case 'concentration':
        return <Users className="w-5 h-5 text-indigo-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Lightbulb className="w-4 h-4" />
          <span>Automated Business Intelligence Engine</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Executive Business Insights</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Data-driven observations and strategic business questions generated from your uploaded Excel data
        </p>
      </div>

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map(item => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                    {getInsightIcon(item.type)}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
                </div>
              </div>

              {/* Observation Block */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  OBSERVATION
                </p>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {item.observation}
                </p>
              </div>

              {/* Business Question Block */}
              <div className="p-3.5 rounded-xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/40">
                <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>BUSINESS QUESTION FOR MANAGEMENT</span>
                </p>
                <p className="text-xs text-brand-900 dark:text-brand-200 font-semibold leading-relaxed">
                  {item.question}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Contextual Filter Ready</span>
              <button
                onClick={() => investigateInsight(item)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Investigate In Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
