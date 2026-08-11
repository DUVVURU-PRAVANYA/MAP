import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, ShieldCheck, BarChart3, ArrowRight } from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';

export const LandingUpload: React.FC = () => {
  const { uploadExcelFile, loadSampleDataset, isLoading } = useAnalytics();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        uploadExcelFile(file);
      } else {
        alert('Please upload a valid Excel file (.xlsx or .xls)');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      uploadExcelFile(file);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-900 text-white relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-6 border-b border-slate-800 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-glow">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Marketing Analytics Platform</span>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Bricks-Inspired BI Engine</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center relative z-10 max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-950/80 border border-brand-800/60 text-brand-300 text-xs font-semibold mb-6">
          <ShieldCheck className="w-4 h-4 text-brand-400" />
          <span>Automated Validation & Insights Engine</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight mb-4">
          Marketing Analytics Platform
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mb-10">
          Turn your sales Excel data into interactive business decisions. Upload raw sales files for automated validation, cleaning, cross-filtering, and strategic insights.
        </p>

        {/* Drag and Drop Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full max-w-2xl rounded-2xl p-8 sm:p-12 border-2 border-dashed transition-all duration-300 cursor-pointer text-center relative ${
            isDragging
              ? 'border-brand-500 bg-brand-950/40 scale-[1.02] shadow-glow'
              : 'border-slate-700 bg-slate-800/50 hover:border-brand-500/60 hover:bg-slate-800/80'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".xlsx, .xls"
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-brand-900/50 text-brand-400 flex items-center justify-center mx-auto mb-4 border border-brand-700/40">
            <UploadCloud className="w-8 h-8 animate-bounce" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">Upload your Sales Excel</h3>
          <p className="text-sm text-slate-400 mb-6">
            Drag & drop your workbook here, or click to browse files
          </p>

          <div className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition-all">
            <span>Choose Excel File</span>
            <ArrowRight className="w-4 h-4" />
          </div>

          <p className="text-xs text-slate-500 mt-4">
            Supports <strong className="text-slate-300">.xlsx</strong> and <strong className="text-slate-300">.xls</strong> workbooks up to 25MB
          </p>
        </div>

        {/* Quick Launch Sample Dataset Action */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <span className="text-xs text-slate-400 font-medium">No file handy right now?</span>
          <button
            onClick={loadSampleDataset}
            disabled={isLoading}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-300 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
          >
            <BarChart3 className="w-4 h-4 text-brand-400" />
            <span>Try with Sample Dataset (sample_sales_dashboard_data.xlsx)</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800 text-center text-xs text-slate-500 relative z-10">
        Marketing Analytics Platform • Enterprise Intelligence Workflow
      </footer>
    </div>
  );
};
