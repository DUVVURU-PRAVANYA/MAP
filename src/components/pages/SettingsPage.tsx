import React from 'react';
import { Settings, Sun, Moon, Monitor, Shield, Database, FileSpreadsheet } from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, filename, allRecords } = useAnalytics();

  return (
    <div className="space-y-6 pb-12 font-sans max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Platform Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Configure visual themes, data architecture preferences, and prototype parameters</p>
      </div>

      {/* Theme Preference */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Appearance & Theme</h3>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${
              theme === 'light'
                ? 'border-brand-500 bg-brand-50/50 text-brand-600 font-bold'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-xs">Light Mode</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${
              theme === 'dark'
                ? 'border-brand-500 bg-slate-800 text-brand-400 font-bold'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <span className="text-xs">Dark Mode</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${
              theme === 'system'
                ? 'border-brand-500 bg-brand-50/50 text-brand-600 font-bold'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <Monitor className="w-5 h-5 text-slate-500" />
            <span className="text-xs">System Default</span>
          </button>
        </div>
      </div>

      {/* Security & Future Database Preparedness */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Architecture & Security Status</h3>
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
            <span>File Extension Validation</span>
            <span className="font-semibold text-emerald-600">Active (.xlsx, .xls)</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
            <span>Data Ingestion Decoupling</span>
            <span className="font-semibold text-emerald-600">Active (REST APIs & Engine)</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
            <span>Database Pipeline Compatibility</span>
            <span className="font-semibold text-brand-600">Prepared for PostgreSQL / Snowflake</span>
          </div>
        </div>
      </div>
    </div>
  );
};
