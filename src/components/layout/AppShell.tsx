import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Users,
  PieChart,
  Calendar,
  Lightbulb,
  ShieldCheck,
  Settings,
  Upload,
  Sun,
  Moon,
  ChevronRight,
  Menu,
  X,
  FileSpreadsheet,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';
import { ViewTab } from '../../types/analytics';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activeView,
    setActiveView,
    filename,
    breadcrumbs,
    popBreadcrumb,
    theme,
    setTheme,
    resetDataset,
    allRecords,
    loadSampleDataset,
    selectedReportingFY,
    setSelectedReportingFY,
    reportingPeriodLabel,
    availableReportingFYs,
  } = useAnalytics();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const navItems: { id: ViewTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Sales Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'products', label: 'Products', icon: <Package className="w-5 h-5" /> },
    { id: 'customers', label: 'Customers', icon: <Users className="w-5 h-5" /> },
    { id: 'segments', label: 'Vehicle Segments', icon: <PieChart className="w-5 h-5" /> },
    { id: 'time', label: 'Time Analysis', icon: <Calendar className="w-5 h-5" /> },
    { id: 'insights', label: 'Business Insights', icon: <Lightbulb className="w-5 h-5" /> },
    { id: 'quality', label: 'Data Quality', icon: <ShieldCheck className="w-5 h-5" /> },
  ];

  if (activeView === 'landing' || activeView === 'processing' || activeView === 'quality_summary') {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans">
      {/* Sidebar Desktop */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 z-30 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Brand Logo Header */}
        <div className={`flex items-center h-16 px-3 border-b border-slate-200 dark:border-slate-800 ${isSidebarOpen ? 'justify-between' : 'justify-center space-x-2'}`}>
          <div className="flex items-center space-x-2.5 overflow-hidden shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-glow shrink-0" title="Marketing Analytics Platform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            {isSidebarOpen && (
              <div className="truncate min-w-0">
                <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                  Marketing Analytics
                </h1>
                <p className="text-[10px] text-brand-600 dark:text-brand-400 font-medium truncate">Enterprise Intelligence</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border-l-4 border-brand-600'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'
                }`}
                title={item.label}
              >
                <span className={`${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                {isSidebarOpen && <span className="ml-3 truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <button
            onClick={() => setActiveView('settings')}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'settings'
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-5 h-5 text-slate-400" />
            {isSidebarOpen && <span className="ml-3">Settings</span>}
          </button>
          <button
            onClick={resetDataset}
            className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            {isSidebarOpen && <span className="ml-3">Change File</span>}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 sm:px-6 z-20">
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-xs sm:text-sm font-medium text-slate-500 overflow-x-auto py-1">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  <button
                    onClick={() => popBreadcrumb(idx)}
                    className={`truncate hover:text-brand-600 dark:hover:text-brand-400 transition-colors ${
                      idx === breadcrumbs.length - 1 ? 'font-semibold text-slate-900 dark:text-white' : ''
                    }`}
                  >
                    {crumb.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {/* Financial Year Selector */}
            {selectedReportingFY && (
              <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-brand-300 dark:border-brand-800">
                <Calendar className="w-3.5 h-3.5 text-brand-500" />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Financial Year:</span>
                <select
                  value={selectedReportingFY}
                  onChange={e => setSelectedReportingFY(e.target.value)}
                  className="bg-transparent text-xs font-bold text-brand-600 dark:text-brand-400 focus:outline-none cursor-pointer"
                  title={`Selected Reporting Period: ${reportingPeriodLabel}`}
                >
                  <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium">
                    All Years
                  </option>
                  {availableReportingFYs.map(fy => (
                    <option key={fy} value={fy} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium">
                      {fy}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Active Dataset Pill */}
            {filename && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <FileSpreadsheet className="w-3.5 h-3.5 text-brand-500" />
                <span className="truncate max-w-[140px]">{filename}</span>
                <span className="text-[10px] bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded-full">
                  {allRecords.length.toLocaleString()} rows
                </span>
              </div>
            )}

            {/* Upload New File Button */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload File</span>
            </button>

            {/* Theme Selector */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>

      {/* Confirmation Modal for Upload New File */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Upload New Dataset?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Uploading a new Excel workbook will replace the current active dataset. Do you want to proceed?
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetDataset();
                }}
                className="px-4 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm"
              >
                Proceed to Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
