import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  IndianRupee,
  Boxes,
  Users,
  Package,
  Layers,
  Receipt,
  TrendingUp,
  Filter,
  Search,
  X,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  PieChartIcon,
  BarChart2,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';

export const OverviewDashboard: React.FC = () => {
  const {
    kpiMetrics,
    timeTrends,
    segmentBreakdown,
    plantBreakdown,
    topProducts,
    topApplications,
    topCustomers,
    quarterlyBreakdown,
    availableFinancialYears,
    financialYearBreakdown,
    toggleFinancialYearFilter,
    filters,
    setFilter,
    toggleSegmentFilter,
    toggleProductFilter,
    toggleCustomerFilter,
    togglePlantFilter,
    toggleInvoiceNumFilter,
    clearAllFilters,
    allRecords,
    filteredRecords,
    qualitySummary,
    setActiveView,
    setSelectedProduct,
    setSelectedCustomer,
    selectedReportingFY,
    setSelectedReportingFY,
    reportingPeriodLabel,
    availableReportingFYs,
    availableSegments,
    availableRblProductSegments,
    availableProducts,
    availableCustomers,
    availableMasterCustomerGroups,
    availablePlants,
    availableInvoiceNums,
    toggleRblProductSegmentFilter,
  } = useAnalytics();

  const [trendView, setTrendView] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [segmentChartType, setSegmentChartType] = useState<'bar' | 'donut'>('donut');
  const [productMetricType, setProductMetricType] = useState<'sales' | 'quantity'>('sales');
  const [appMetricType, setAppMetricType] = useState<'sales' | 'quantity'>('sales');
  const [quarterMetricType, setQuarterMetricType] = useState<'sales' | 'quantity' | 'customers'>('sales');

  // Dynamic Selection Filter States (Section 1 & 2: Exactly 2 Controls)
  const [selectedField, setSelectedField] = useState<string>('plant');
  const [comboboxQuery, setComboboxQuery] = useState<string>('');
  const [isComboboxOpen, setIsComboboxOpen] = useState<boolean>(false);

  // Helper formatting INR in Crores
  const formatCurrency = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return '₹0.00 Cr';
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;
  };

  const SEGMENT_COLORS = ['#0c8de9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  // Supported Selection Filter Fields (Section 1)
  const FILTER_FIELDS = [
    { key: 'plant', label: 'Plant' },
    { key: 'masterCustomerGroup', label: 'Master customer Group' },
    { key: 'customerGroup', label: 'Customer Group' },
    { key: 'customer', label: 'Customer.' },
    { key: 'custNum', label: 'Cust Num.' },
    { key: 'application', label: 'Application' },
    { key: 'productSegment', label: 'Segment' },
    { key: 'rblProductSegment', label: 'RBL_Product segment' },
    { key: 'materialCode', label: 'Material code' },
    { key: 'description', label: 'Desciption' },
    { key: 'invoiceNum', label: 'Invoice Num.' },
    { key: 'billType', label: 'Bill type' },
    { key: 'grnDate', label: 'GRN date' },
    { key: 'month', label: 'Month' },
  ];

  // Indian Financial Year Month Sorting Order (Section 2)
  const INDIAN_FY_MONTH_ORDER = [
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
    'January',
    'February',
    'March',
  ];

  // Dynamically compute distinct unique values from the clean dataset for the selected field
  const distinctFieldValues = useMemo(() => {
    if (!selectedField) return [];
    const valSet = new Set<string>();

    allRecords.forEach(r => {
      let rawVal = '';
      if (selectedField === 'plant') rawVal = r.plantName || r.plantCode || '';
      else if (selectedField === 'masterCustomerGroup') rawVal = r.masterCustomerGroup || '';
      else if (selectedField === 'customerGroup') rawVal = r.customerGroup || '';
      else if (selectedField === 'customer') rawVal = r.customer || '';
      else if (selectedField === 'custNum') rawVal = r.custNum || '';
      else if (selectedField === 'application') rawVal = r.application || '';
      else if (selectedField === 'productSegment') rawVal = r.productSegment || '';
      else if (selectedField === 'rblProductSegment') rawVal = r.rblProductSegment || '';
      else if (selectedField === 'materialCode') rawVal = r.materialCode || '';
      else if (selectedField === 'description') rawVal = r.description || '';
      else if (selectedField === 'invoiceNum') rawVal = r.invoiceNum || '';
      else if (selectedField === 'billType') rawVal = r.billType || '';
      else if (selectedField === 'grnDate') rawVal = r.grnDate || '';
      else if (selectedField === 'month') rawVal = r.month || '';

      if (rawVal && String(rawVal).trim() !== '') {
        valSet.add(String(rawVal).trim());
      }
    });

    const valuesList = Array.from(valSet);

    // If Month, sort strictly in Indian FY order (April -> March) per Section 2
    if (selectedField === 'month') {
      return valuesList.sort((a, b) => {
        const idxA = INDIAN_FY_MONTH_ORDER.findIndex(m => a.toLowerCase().includes(m.toLowerCase()));
        const idxB = INDIAN_FY_MONTH_ORDER.findIndex(m => b.toLowerCase().includes(m.toLowerCase()));
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      });
    }

    return valuesList.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [allRecords, selectedField]);

  // Filtered suggestions while typing in the combobox
  const filteredSuggestions = useMemo(() => {
    if (!comboboxQuery) return distinctFieldValues;
    const q = comboboxQuery.toLowerCase();
    return distinctFieldValues.filter(val => val.toLowerCase().includes(q));
  }, [distinctFieldValues, comboboxQuery]);

  // Handler for applying the selected value
  const handleSelectComboboxValue = (val: string) => {
    setComboboxQuery(val === 'ALL' ? '' : val);
    setIsComboboxOpen(false);

    if (!val || val === 'ALL') {
      // Clear specific filters
      if (selectedField === 'plant') setFilter('plants', []);
      else if (selectedField === 'masterCustomerGroup') setFilter('masterCustomerGroups', []);
      else if (selectedField === 'customerGroup') setFilter('customerGroups', []);
      else if (selectedField === 'customer') setFilter('customers', []);
      else if (selectedField === 'productSegment') setFilter('segments', []);
      else if (selectedField === 'rblProductSegment') setFilter('rblProductSegments', []);
      else if (selectedField === 'invoiceNum') setFilter('invoiceNums', []);
      else if (selectedField === 'materialCode' || selectedField === 'description') setFilter('products', []);
      else setFilter('searchTerm', '');
      return;
    }

    // Apply the chosen distinct value across dashboard analysis
    if (selectedField === 'plant') {
      setFilter('plants', [val]);
    } else if (selectedField === 'masterCustomerGroup') {
      setFilter('masterCustomerGroups', [val]);
    } else if (selectedField === 'customerGroup') {
      setFilter('customerGroups', [val]);
    } else if (selectedField === 'customer') {
      setFilter('customers', [val]);
    } else if (selectedField === 'productSegment') {
      setFilter('segments', [val]);
    } else if (selectedField === 'rblProductSegment') {
      setFilter('rblProductSegments', [val]);
    } else if (selectedField === 'invoiceNum') {
      setFilter('invoiceNums', [val]);
    } else if (selectedField === 'materialCode' || selectedField === 'description') {
      setFilter('products', [val]);
    } else {
      setFilter('searchTerm', val);
    }
  };

  const hasActiveFilters =
    filters.financialYears.length > 0 ||
    filters.segments.length > 0 ||
    (filters.rblProductSegments && filters.rblProductSegments.length > 0) ||
    filters.products.length > 0 ||
    filters.customers.length > 0 ||
    filters.customerGroups.length > 0 ||
    filters.plants.length > 0 ||
    filters.masterCustomerGroups.length > 0 ||
    filters.invoiceNums.length > 0 ||
    filters.searchTerm !== '' ||
    comboboxQuery !== '' ||
    Boolean(selectedReportingFY && selectedReportingFY !== 'ALL' && selectedReportingFY !== 'All Years');

  const l2TotalValue = qualitySummary?.l2TotalValue ?? 0;
  const currentFieldLabel = FILTER_FIELDS.find(f => f.key === selectedField)?.label || 'Field';

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sales Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time Sales Performance & Analytics (Value in Crores)
          </p>
        </div>

        {/* Reset Filter Button */}
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={() => {
                clearAllFilters();
                setSelectedReportingFY('');
                setComboboxQuery('');
                setIsComboboxOpen(false);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-100 transition-colors border border-red-200 dark:border-red-800 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* APPROVED TWO FILTER SYSTEM (Section 1: Filter 1 Field Selector + Filter 2 Searchable Combobox) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <SlidersHorizontal className="w-4 h-4 text-brand-500" />
            <span>Dashboard Filters (2 Controls: Field Selector & Searchable Combobox)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Exactly 2 Filter Controls</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* FILTER 1: FIELD SELECTOR */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-brand-500" />
              <span>Filter 1 — Field Selector</span>
            </label>
            <select
              value={selectedField}
              onChange={e => {
                const newField = e.target.value;
                setSelectedField(newField);
                setComboboxQuery('');
                handleSelectComboboxValue('ALL');
              }}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-300 dark:border-brand-800 bg-brand-50/30 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold shadow-sm"
            >
              {FILTER_FIELDS.map(f => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* FILTER 2: SEARCHABLE DISTINCT-VALUE COMBOBOX */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-brand-500" />
                <span>Filter 2 — Search / Select {currentFieldLabel}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {distinctFieldValues.length} distinct values
              </span>
            </label>

            <div className="relative">
              <input
                type="text"
                placeholder={`Search or select ${currentFieldLabel}...`}
                value={comboboxQuery}
                onFocus={() => setIsComboboxOpen(true)}
                onChange={e => {
                  setComboboxQuery(e.target.value);
                  setIsComboboxOpen(true);
                  if (e.target.value === '') {
                    handleSelectComboboxValue('ALL');
                  }
                }}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold shadow-sm pr-16"
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                {comboboxQuery && (
                  <button
                    onClick={() => {
                      setComboboxQuery('');
                      handleSelectComboboxValue('ALL');
                    }}
                    className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsComboboxOpen(!isComboboxOpen)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isComboboxOpen ? 'rotate-90' : ''}`} />
                </button>
              </div>
            </div>

            {/* Suggestions Dropdown */}
            {isComboboxOpen && (
              <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <button
                  type="button"
                  onClick={() => handleSelectComboboxValue('ALL')}
                  className="w-full text-left px-3.5 py-2 font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800 flex items-center justify-between"
                >
                  <span>All {currentFieldLabel}s (No filter)</span>
                  <span className="text-[10px] text-slate-400">Reset</span>
                </button>

                {filteredSuggestions.length === 0 ? (
                  <div className="px-3.5 py-3 text-slate-400 text-center italic">
                    No matching {currentFieldLabel} values found
                  </div>
                ) : (
                  filteredSuggestions.map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSelectComboboxValue(val)}
                      className={`w-full text-left px-3.5 py-2 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${
                        comboboxQuery === val ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold' : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{val}</span>
                      {selectedField === 'month' && (
                        <span className="text-[10px] text-slate-400 ml-2 shrink-0">FY Month</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400">ACTIVE FILTER:</span>
            {comboboxQuery && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                <span>{currentFieldLabel}: {comboboxQuery}</span>
                <button
                  onClick={() => {
                    setComboboxQuery('');
                    handleSelectComboboxValue('ALL');
                  }}
                  className="hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedReportingFY && selectedReportingFY !== 'ALL' && selectedReportingFY !== 'All Years' && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                <span>FY: {selectedReportingFY}</span>
                <button onClick={() => setSelectedReportingFY('')} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.plants.map(plant => (
              <span
                key={plant}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
              >
                <span>Plant: {plant}</span>
                <button onClick={() => togglePlantFilter(plant)} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.segments.map(seg => (
              <span
                key={seg}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
              >
                <span>Segment: {seg}</span>
                <button onClick={() => toggleSegmentFilter(seg)} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.masterCustomerGroups.map(mcg => (
              <span
                key={mcg}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
              >
                <span>Master Group: {mcg}</span>
                <button onClick={() => setFilter('masterCustomerGroups', [])} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.customers.map(cust => (
              <span
                key={cust}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
              >
                <span>Customer: {cust}</span>
                <button onClick={() => toggleCustomerFilter(cust)} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => {
                clearAllFilters();
                setSelectedReportingFY('');
                setComboboxQuery('');
                setIsComboboxOpen(false);
              }}
              className="text-xs font-bold text-slate-500 hover:text-red-600 underline ml-2"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* 6 CORE KPI CARDS (Section 2 & Validation: Removed OE/OS, Avg Invoice, Transaction Count, Invoice Style No) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Total Sales Value (Cr) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Sales (Cr)</span>
            <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-1.5 truncate" title={`Value in Crores: ${formatCurrency(kpiMetrics.totalSalesValue)}`}>
            {formatCurrency(kpiMetrics.totalSalesValue)}
          </p>
          <div className="flex items-center space-x-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            <ArrowUpRight className="w-3 h-3" />
            <span>Value In Crs</span>
          </div>
        </div>

        {/* KPI 2: Total Invoice Quantity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Inv. Qty</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Boxes className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-1.5 truncate">
            {kpiMetrics.totalInvQty.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Primary Quantity</p>
        </div>

        {/* KPI 3: Customer Count (Distinct Master Customer Group) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Customer Count</span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-1.5 truncate">
            {kpiMetrics.customerCount}
          </p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1 font-semibold truncate" title="Distinct Master Customer Groups">
            Master Groups ({kpiMetrics.individualCustomerCount} Accounts)
          </p>
        </div>

        {/* KPI 4: Product SKUs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Products</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-1.5 truncate">
            {kpiMetrics.productCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Active SKUs</p>
        </div>

        {/* KPI 5: Vehicle Segments */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Vehicle Segments</span>
            <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-1.5 truncate">
            {kpiMetrics.segmentCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Vehicle Categories</p>
        </div>

        {/* KPI 6: L2 Value (Excluded L2 Records) */}
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-xl p-3.5 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">L2 Value</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-1.5 truncate" title={`Excluded L2 Records Value: ₹${l2TotalValue.toFixed(2)} Cr`}>
            ₹{l2TotalValue.toFixed(2)} Cr
          </p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold truncate">
            {qualitySummary?.l2RecordsRemoved || 0} L2 Excluded
          </p>
        </div>
      </div>

      {/* Multi-Financial Year Performance & YoY Growth Analysis */}
      {financialYearBreakdown.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-500" />
                <span>Financial Year Performance & YoY Growth</span>
              </h3>
              <p className="text-xs text-slate-500">Select any Financial Year to filter the entire dashboard</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedReportingFY('')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  !selectedReportingFY || selectedReportingFY === 'ALL' || selectedReportingFY === 'All Years'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All Years ({availableFinancialYears.length})
              </button>
              {availableReportingFYs.map(fy => (
                <button
                  key={fy}
                  onClick={() => setSelectedReportingFY(fy)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedReportingFY === fy
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {fy}
                </button>
              ))}
            </div>
          </div>

          {/* Financial Year Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {financialYearBreakdown.map(item => {
              const isSelected = !selectedReportingFY || selectedReportingFY === 'ALL' || selectedReportingFY === 'All Years' || selectedReportingFY === item.financialYear;
              return (
                <div
                  key={item.financialYear}
                  onClick={() => setSelectedReportingFY(item.financialYear)}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br from-white to-brand-50/30 dark:from-slate-900 dark:to-brand-950/20 border-brand-300 dark:border-brand-800 shadow-md'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400 bg-brand-100 dark:bg-brand-900/60 px-2.5 py-0.5 rounded-full">
                      {item.financialYear}
                    </span>
                    {item.yoyGrowthPct !== null && item.yoyGrowthPct !== undefined ? (
                      <span
                        className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                          item.yoyGrowthPct >= 0
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300'
                        }`}
                      >
                        {item.yoyGrowthPct >= 0 ? '↑' : '↓'} {Math.abs(item.yoyGrowthPct)}% YoY
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {item.yoyGrowthStatus || 'Base Year'}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-slate-500 font-medium">Sales Value</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      {formatCurrency(item.sales)}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Inv Quantity</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.quantity.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Customers</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.customers}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Multi-Financial Year Side-by-Side Comparison Matrix */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
              Multi-Year Performance Matrix (Comparative Table)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Financial Year</th>
                    <th className="py-2.5 px-3 text-right">Sales Value</th>
                    <th className="py-2.5 px-3 text-right">YoY Sales Growth</th>
                    <th className="py-2.5 px-3 text-right">Invoice Quantity</th>
                    <th className="py-2.5 px-3 text-right">Customers</th>
                    <th className="py-2.5 px-3 text-right">Products (SKUs)</th>
                    <th className="py-2.5 px-3 text-right">Segments</th>
                    <th className="py-2.5 px-3 text-right">Transactions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {financialYearBreakdown.map(fyItem => (
                    <tr key={fyItem.financialYear} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{fyItem.financialYear}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(fyItem.sales)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {fyItem.yoyGrowthPct !== null && fyItem.yoyGrowthPct !== undefined ? (
                          <span className={fyItem.yoyGrowthPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {fyItem.yoyGrowthPct >= 0 ? '+' : ''}{fyItem.yoyGrowthPct}%
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 font-normal text-[11px]">
                            {fyItem.yoyGrowthStatus || '-'}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {fyItem.quantity.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">{fyItem.customers}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{fyItem.products}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{fyItem.segments}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{fyItem.transactions.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Plant-Wise Analysis Card */}
      {plantBreakdown.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-xl p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-500" />
                <span>Plant-Wise Sales Contribution & Performance</span>
              </h3>
              <p className="text-xs text-slate-500">Sales breakdown across manufacturing plants (Chennai 3000, Hyderabad 3100, Pondicherry 3200, Trichy 3600)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plantBreakdown.map(plant => (
              <div
                key={plant.plantCode}
                onClick={() => togglePlantFilter(plant.plantName)}
                className={`cursor-pointer rounded-xl p-4 border transition-all ${
                  filters.plants.includes(plant.plantName) || filters.plants.includes(plant.plantCode)
                    ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 shadow-md ring-2 ring-amber-500/20'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 rounded-full">
                    {plant.plantName} ({plant.plantCode})
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {plant.percentage}% Share
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-400 font-medium">Sales Value</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">
                    {formatCurrency(plant.sales)}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-2 gap-1 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Inv Quantity</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{plant.quantity.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Customers</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{plant.customerCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Sales Trend Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sales Trend Performance</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Bill Date revenue velocity across periods</p>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setTrendView('monthly')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                trendView === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTrendView('quarterly')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                trendView === 'quarterly'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setTrendView('yearly')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                trendView === 'yearly'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendView === 'monthly' ? timeTrends : trendView === 'quarterly' ? quarterlyBreakdown : financialYearBreakdown}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0c8de9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0c8de9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey={trendView === 'monthly' ? 'period' : trendView === 'quarterly' ? 'quarter' : 'financialYear'}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={v => `₹${Number(v).toFixed(1)}Cr`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: any) => [`₹${Number(value).toFixed(2)} Cr`, 'Sales Value']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#ffffff',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#0c8de9"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#salesGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Top 10 Products & Top 10 Applications (Part 5, 6, 7: Two Separate Independent Visualizations Side-by-Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Top 10 Products (Grouping: Description per Part 5) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Top 10 Products by Sales</h3>
              <p className="text-xs text-slate-500">Ranked by Product Description ({productMetricType === 'sales' ? 'Sales in Cr' : 'Quantity in Nos'})</p>
            </div>
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setProductMetricType('sales')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                  productMetricType === 'sales' ? 'bg-white dark:bg-slate-900 text-brand-600' : 'text-slate-400'
                }`}
              >
                Sales Value
              </button>
              <button
                onClick={() => setProductMetricType('quantity')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                  productMetricType === 'quantity' ? 'bg-white dark:bg-slate-900 text-brand-600' : 'text-slate-400'
                }`}
              >
                Quantity
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts.slice(0, 10)} layout="vertical">
                <XAxis
                  type="number"
                  tickFormatter={v => (productMetricType === 'sales' ? `₹${Number(v).toFixed(1)}Cr` : Number(v).toLocaleString())}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis dataKey="description" type="category" tick={{ fontSize: 10, fill: '#94a3b8' }} width={130} />
                <Tooltip
                  formatter={(val: any) => [
                    productMetricType === 'sales' ? `₹${Number(val).toFixed(2)} Cr` : `${Number(val).toLocaleString()} units`,
                    productMetricType === 'sales' ? 'Sales Value' : 'Quantity Sold',
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Bar
                  dataKey={productMetricType === 'sales' ? 'sales' : 'quantity'}
                  fill="#0c8de9"
                  radius={[0, 4, 4, 0]}
                  onClick={entry => {
                    if (entry.description) toggleProductFilter(entry.description);
                  }}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Top 10 Applications (Grouping: Application per Part 6) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Top 10 Applications by Sales</h3>
              <p className="text-xs text-slate-500">Ranked by Vehicle & End-Use Application ({appMetricType === 'sales' ? 'Sales in Cr' : 'Quantity in Nos'})</p>
            </div>
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setAppMetricType('sales')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                  appMetricType === 'sales' ? 'bg-white dark:bg-slate-900 text-brand-600' : 'text-slate-400'
                }`}
              >
                Sales Value
              </button>
              <button
                onClick={() => setAppMetricType('quantity')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                  appMetricType === 'quantity' ? 'bg-white dark:bg-slate-900 text-brand-600' : 'text-slate-400'
                }`}
              >
                Quantity
              </button>
            </div>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {topApplications.length === 0 ? (
              <div className="text-center p-6 text-slate-400">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No Application data available</p>
                <p className="text-[10px] text-slate-400 mt-1">Application metrics require values in the source Application column</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topApplications.slice(0, 10)} layout="vertical">
                  <XAxis
                    type="number"
                    tickFormatter={v => (appMetricType === 'sales' ? `₹${Number(v).toFixed(1)}Cr` : Number(v).toLocaleString())}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                  />
                  <YAxis dataKey="application" type="category" tick={{ fontSize: 10, fill: '#94a3b8' }} width={130} />
                  <Tooltip
                    formatter={(val: any, _name: any, item: any) => [
                      appMetricType === 'sales'
                        ? `₹${Number(val).toFixed(2)} Cr (${item?.payload?.salesContributionPct ?? 0}% contribution)`
                        : `${Number(val).toLocaleString()} units`,
                      appMetricType === 'sales' ? 'Sales Value' : 'Quantity Sold',
                    ]}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar
                    dataKey={appMetricType === 'sales' ? 'sales' : 'quantity'}
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                    onClick={entry => {
                      if (entry.application) setFilter('searchTerm', entry.application);
                    }}
                    cursor="pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Sales by Vehicle Segment (Full Width Card per User Request) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Sales by Vehicle Segment</h3>
            <p className="text-xs text-slate-500">Click any vehicle segment to cross-filter dashboard</p>
          </div>
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setSegmentChartType('donut')}
              className={`p-1.5 rounded-md ${
                segmentChartType === 'donut' ? 'bg-white dark:bg-slate-900 text-brand-600' : 'text-slate-400'
              }`}
              title="Donut Chart"
            >
              <PieChartIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSegmentChartType('bar')}
              className={`p-1.5 rounded-md ${
                segmentChartType === 'bar' ? 'bg-white dark:bg-slate-900 text-brand-600' : 'text-slate-400'
              }`}
              title="Bar Chart"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="h-64 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            {segmentChartType === 'donut' ? (
              <RePieChart>
                <Pie
                  data={segmentBreakdown}
                  dataKey="sales"
                  nameKey="segment"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  onClick={entry => toggleSegmentFilter(entry.segment)}
                  cursor="pointer"
                >
                  {segmentBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 text-white p-3 rounded-xl shadow-2xl z-50 pointer-events-none text-xs space-y-1">
                          <p className="font-bold text-brand-400 border-b border-slate-800 pb-1">{data.segment}</p>
                          <p className="text-slate-300 flex justify-between gap-4">
                            <span>Sales:</span>
                            <span className="font-mono font-bold text-emerald-400">₹{Number(data.sales).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </p>
                          <p className="text-slate-300 flex justify-between gap-4">
                            <span>Quantity (Inv. Qty):</span>
                            <span className="font-mono font-bold text-white">{Number(data.quantity).toLocaleString()}</span>
                          </p>
                          <p className="text-slate-300 flex justify-between gap-4">
                            <span>Transactions:</span>
                            <span className="font-mono text-slate-400">{data.transactionCount || data.transactions || 0}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RePieChart>
            ) : (
              <BarChart data={segmentBreakdown} layout="vertical">
                <XAxis type="number" tickFormatter={v => `₹${Number(v).toFixed(1)}Cr`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis dataKey="segment" type="category" tick={{ fontSize: 10, fill: '#94a3b8' }} width={120} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 text-white p-3 rounded-xl shadow-2xl z-50 pointer-events-none text-xs space-y-1">
                          <p className="font-bold text-brand-400 border-b border-slate-800 pb-1">{data.segment}</p>
                          <p className="text-slate-300 flex justify-between gap-4">
                            <span>Sales:</span>
                            <span className="font-mono font-bold text-emerald-400">₹{Number(data.sales).toFixed(2)} Cr</span>
                          </p>
                          <p className="text-slate-300 flex justify-between gap-4">
                            <span>Quantity (Inv. Qty):</span>
                            <span className="font-mono font-bold text-white">{Number(data.quantity).toLocaleString()}</span>
                          </p>
                          <p className="text-slate-300 flex justify-between gap-4">
                            <span>Transactions:</span>
                            <span className="font-mono text-slate-400">{data.transactionCount || data.transactions || 0}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="sales"
                  fill="#0c8de9"
                  radius={[0, 4, 4, 0]}
                  onClick={entry => toggleSegmentFilter(entry.segment)}
                  cursor="pointer"
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Segment Legend (Responsive Grid across Full Width) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {segmentBreakdown.map((seg, idx) => (
            <button
              key={seg.segment}
              onClick={() => toggleSegmentFilter(seg.segment)}
              className="flex items-center space-x-2 text-left p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: SEGMENT_COLORS[idx % SEGMENT_COLORS.length] }}
              />
              <div className="truncate min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{seg.segment}</p>
                <p className="text-[10px] text-slate-400">{seg.percentage}% share</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Top Customers & Quarterly Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Key Account Customers Card (Requirement 5: Master Customer Group level) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Top Key Account Customers</h3>
              <p className="text-xs text-slate-500">Highest contribution Master Customer Groups</p>
            </div>
            <button
              onClick={() => setActiveView('customers')}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1"
            >
              <span>View All ({topCustomers.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 pt-2">
            {topCustomers.slice(0, 5).map((cust, idx) => {
              const totalCompanySales = kpiMetrics.totalSalesValue || 1;
              const contributionPct = Number(((cust.sales / totalCompanySales) * 100).toFixed(1));

              // Pyramid Tier Width & Theme Styling
              const tierStyles = [
                {
                  width: 'w-[70%] sm:w-[66%]',
                  bg: 'bg-gradient-to-r from-amber-500/15 via-amber-400/25 to-amber-500/15 border-amber-400/70 dark:from-amber-950/70 dark:via-amber-900/60 dark:to-amber-950/70 dark:border-amber-500/80 shadow-md',
                  badge: 'bg-amber-500 text-white font-black shadow-sm',
                  salesColor: 'text-amber-700 dark:text-amber-300 font-black',
                  contribBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
                },
                {
                  width: 'w-[77.5%] sm:w-[74.5%]',
                  bg: 'bg-gradient-to-r from-indigo-500/10 via-indigo-400/20 to-indigo-500/10 border-indigo-300 dark:from-indigo-950/60 dark:via-indigo-900/50 dark:to-indigo-950/60 dark:border-indigo-700/80 shadow-sm',
                  badge: 'bg-indigo-600 text-white font-black',
                  salesColor: 'text-indigo-700 dark:text-indigo-300 font-extrabold',
                  contribBadge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
                },
                {
                  width: 'w-[85%] sm:w-[83%]',
                  bg: 'bg-gradient-to-r from-purple-500/10 via-purple-400/15 to-purple-500/10 border-purple-300 dark:from-purple-950/50 dark:via-purple-900/40 dark:to-purple-950/50 dark:border-purple-800/80',
                  badge: 'bg-purple-600 text-white font-black',
                  salesColor: 'text-purple-700 dark:text-purple-300 font-extrabold',
                  contribBadge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
                },
                {
                  width: 'w-[92.5%] sm:w-[91.5%]',
                  bg: 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80',
                  badge: 'bg-slate-600 text-white font-black',
                  salesColor: 'text-slate-900 dark:text-white font-bold',
                  contribBadge: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
                },
                {
                  width: 'w-[100%]',
                  bg: 'bg-slate-100/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60',
                  badge: 'bg-slate-500 text-white font-black',
                  salesColor: 'text-slate-900 dark:text-white font-bold',
                  contribBadge: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
                },
              ];

              const tier = tierStyles[idx] || tierStyles[4];

              return (
                <div
                  key={cust.customer}
                  onClick={() => {
                    setSelectedCustomer(cust.customer);
                    setActiveView('customers');
                  }}
                  className={`${tier.width} ${tier.bg} mx-auto p-3 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md flex items-center justify-between gap-2`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-1">
                    <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center shrink-0 ${tier.badge}`}>
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={cust.customer}>
                        {cust.customer}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {cust.transactionCount.toLocaleString()} txns • {cust.quantity.toLocaleString()} units
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-xs ${tier.salesColor}`}>
                      {formatCurrency(cust.sales)}
                    </p>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.contribBadge}`}>
                      {contributionPct}% contribution
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quarterly Analysis Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Quarterly Performance Analysis</h3>
              <p className="text-xs text-slate-500">Q1 to Q4 financial metrics</p>
            </div>
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setQuarterMetricType('sales')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                  quarterMetricType === 'sales' ? 'bg-white dark:bg-slate-900 text-brand-600' : 'text-slate-400'
                }`}
              >
                Sales
              </button>
              <button
                onClick={() => setQuarterMetricType('quantity')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                  quarterMetricType === 'quantity' ? 'bg-white dark:bg-slate-900 text-brand-600' : 'text-slate-400'
                }`}
              >
                Quantity
              </button>
              <button
                onClick={() => setQuarterMetricType('customers')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                  quarterMetricType === 'customers' ? 'bg-white dark:bg-slate-900 text-brand-600' : 'text-slate-400'
                }`}
              >
                Accounts
              </button>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis
                  tickFormatter={v => (quarterMetricType === 'sales' ? `₹${Number(v).toFixed(1)}Cr` : Number(v).toLocaleString())}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <Tooltip
                  formatter={(val: any) => [
                    quarterMetricType === 'sales' ? `₹${Number(val).toFixed(2)} Cr` : Number(val).toLocaleString(),
                    quarterMetricType === 'sales' ? 'Sales Value' : quarterMetricType === 'quantity' ? 'Quantity' : 'Customers',
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey={quarterMetricType} fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
