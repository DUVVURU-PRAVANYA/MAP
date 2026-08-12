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
  ShoppingBag,
  Boxes,
  Users,
  Package,
  Layers,
  Receipt,
  TrendingUp,
  Filter,
  X,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  PieChartIcon,
  BarChart2,
  ChevronRight,
} from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';

export const OverviewDashboard: React.FC = () => {
  const {
    kpiMetrics,
    timeTrends,
    segmentBreakdown,
    topProducts,
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
    clearAllFilters,
    allRecords,
    setActiveView,
    setSelectedProduct,
    setSelectedCustomer,
  } = useAnalytics();

  const [trendView, setTrendView] = useState<'monthly' | 'quarterly'>('monthly');
  const [segmentChartType, setSegmentChartType] = useState<'bar' | 'donut'>('donut');
  const [productMetricType, setProductMetricType] = useState<'sales' | 'quantity'>('sales');
  const [quarterMetricType, setQuarterMetricType] = useState<'sales' | 'quantity' | 'customers'>('sales');

  // Available unique segments, products, customers for filter dropdowns
  const availableSegments = useMemo(() => Array.from(new Set(allRecords.map(r => r.productSegment))), [allRecords]);
  const availableProducts = useMemo(() => Array.from(new Set(allRecords.map(r => r.description))), [allRecords]);
  const availableCustomers = useMemo(() => Array.from(new Set(allRecords.map(r => r.customer))), [allRecords]);

  // Helper formatting INR
  const formatCurrency = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    } else if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const SEGMENT_COLORS = ['#0c8de9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  const hasActiveFilters =
    filters.financialYears.length > 0 ||
    filters.segments.length > 0 ||
    filters.products.length > 0 ||
    filters.customers.length > 0 ||
    filters.searchTerm !== '';

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sales Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Financial Year Performance & Real-time Analytics
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-100 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-card space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-brand-500" />
          <span>Global Search & Filter Controls</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Financial Year Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Financial Year</label>
            <select
              value={filters.financialYears[0] || ''}
              onChange={e => {
                if (e.target.value) {
                  setFilter('financialYears', [e.target.value]);
                } else {
                  setFilter('financialYears', []);
                }
              }}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-brand-600 dark:text-brand-400"
            >
              <option value="">All Years ({availableFinancialYears.length})</option>
              {availableFinancialYears.map(fy => (
                <option key={fy} value={fy}>
                  {fy}
                </option>
              ))}
            </select>
          </div>

          {/* Search Term */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Search Keywords</label>
            <input
              type="text"
              placeholder="Search product, customer..."
              value={filters.searchTerm}
              onChange={e => setFilter('searchTerm', e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Vehicle Segment Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Vehicle Segment</label>
            <select
              value={filters.segments[0] || ''}
              onChange={e => {
                if (e.target.value) {
                  setFilter('segments', [e.target.value]);
                } else {
                  setFilter('segments', []);
                }
              }}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Vehicle Segments ({availableSegments.length})</option>
              {availableSegments.map(seg => (
                <option key={seg} value={seg}>
                  {seg}
                </option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Product</label>
            <select
              value={filters.products[0] || ''}
              onChange={e => {
                if (e.target.value) {
                  setFilter('products', [e.target.value]);
                } else {
                  setFilter('products', []);
                }
              }}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Products ({availableProducts.length})</option>
              {availableProducts.map(prod => (
                <option key={prod} value={prod}>
                  {prod}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Customer</label>
            <select
              value={filters.customers[0] || ''}
              onChange={e => {
                if (e.target.value) {
                  setFilter('customers', [e.target.value]);
                } else {
                  setFilter('customers', []);
                }
              }}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Customers ({availableCustomers.length})</option>
              {availableCustomers.map(cust => (
                <option key={cust} value={cust}>
                  {cust}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400">ACTIVE FILTERS:</span>
            {filters.segments.map(seg => (
              <span
                key={seg}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
              >
                <span>Segment: {seg}</span>
                <button onClick={() => toggleSegmentFilter(seg)} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.products.map(prod => (
              <span
                key={prod}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              >
                <span>Product: {prod}</span>
                <button onClick={() => toggleProductFilter(prod)} className="hover:text-red-500">
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
            {filters.searchTerm && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <span>Keyword: "{filters.searchTerm}"</span>
                <button onClick={() => setFilter('searchTerm', '')} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs font-bold text-slate-500 hover:text-red-600 underline ml-2"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* 7 Core KPI Cards (Invoice Qty as Primary Quantity) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* KPI 1: Total Sales Value */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Sales Value</span>
            <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-1.5 truncate">
            {formatCurrency(kpiMetrics.totalSalesValue)}
          </p>
          <div className="flex items-center space-x-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            <ArrowUpRight className="w-3 h-3" />
            <span>Revenue</span>
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

        {/* KPI 3: Active Customers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Customers</span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-1.5 truncate">
            {kpiMetrics.customerCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Active Accounts</p>
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

        {/* KPI 6: Total Transactions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Transactions</span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-1.5 truncate">
            {kpiMetrics.transactionCount.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Billing Entries</p>
        </div>

        {/* KPI 7: Average Sale Value */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Avg / Invoice</span>
            <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-1.5 truncate">
            ₹{kpiMetrics.avgSalesValue.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Avg Invoice Size</p>
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
                onClick={() => setFilter('financialYears', [])}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filters.financialYears.length === 0
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All Years ({availableFinancialYears.length})
              </button>
              {availableFinancialYears.map(fy => (
                <button
                  key={fy}
                  onClick={() => toggleFinancialYearFilter(fy)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filters.financialYears.includes(fy)
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
              const isSelected = filters.financialYears.length === 0 || filters.financialYears.includes(item.financialYear);
              return (
                <div
                  key={item.financialYear}
                  onClick={() => toggleFinancialYearFilter(item.financialYear)}
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
                      <span className="text-[10px] text-slate-400 font-medium">Base Year</span>
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
                          <span className="text-slate-400 font-normal">-</span>
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
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendView === 'monthly' ? timeTrends : quarterlyBreakdown}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0c8de9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0c8de9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey={trendView === 'monthly' ? 'period' : 'quarter'}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Sales Value']}
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

      {/* Grid: Sales by Segment vs Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Product Segment */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Sales by Product Segment</h3>
              <p className="text-xs text-slate-500">Click any segment to cross-filter dashboard</p>
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

          <div className="h-64 w-full">
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
                    outerRadius={90}
                    paddingAngle={3}
                    onClick={entry => toggleSegmentFilter(entry.segment)}
                    cursor="pointer"
                  >
                    {segmentBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales Value']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                  />
                </RePieChart>
              ) : (
                <BarChart data={segmentBreakdown} layout="vertical">
                  <XAxis type="number" tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis dataKey="segment" type="category" tick={{ fontSize: 10, fill: '#94a3b8' }} width={110} />
                  <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales']} />
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

          {/* Segment Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {segmentBreakdown.map((seg, idx) => (
              <button
                key={seg.segment}
                onClick={() => toggleSegmentFilter(seg.segment)}
                className="flex items-center space-x-2 text-left p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: SEGMENT_COLORS[idx % SEGMENT_COLORS.length] }}
                />
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{seg.segment}</p>
                  <p className="text-[10px] text-slate-400">{seg.percentage}% share</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Top Products Horizontal Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Top 10 Products</h3>
              <p className="text-xs text-slate-500">Highest revenue & quantity volume SKUs</p>
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
              <BarChart data={topProducts.slice(0, 8)} layout="vertical">
                <XAxis
                  type="number"
                  tickFormatter={v => (productMetricType === 'sales' ? `₹${(v / 100000).toFixed(1)}L` : v)}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis dataKey="description" type="category" tick={{ fontSize: 10, fill: '#94a3b8' }} width={130} />
                <Tooltip
                  formatter={(val: any) => [
                    productMetricType === 'sales' ? `₹${Number(val).toLocaleString('en-IN')}` : Number(val).toLocaleString(),
                    productMetricType === 'sales' ? 'Sales Value' : 'Quantity Sold',
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Bar
                  dataKey={productMetricType === 'sales' ? 'sales' : 'quantity'}
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                  onClick={entry => {
                    setSelectedProduct(entry.description);
                    setActiveView('products');
                  }}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Top Customers & Quarterly Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Top Key Account Customers</h3>
              <p className="text-xs text-slate-500">Highest contribution accounts</p>
            </div>
            <button
              onClick={() => setActiveView('customers')}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1"
            >
              <span>View All ({topCustomers.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topCustomers.slice(0, 5).map((cust, idx) => (
              <div
                key={cust.customer}
                onClick={() => {
                  setSelectedCustomer(cust.customer);
                  setActiveView('customers');
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-brand-50/50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{cust.customer}</p>
                    <p className="text-[10px] text-slate-400">{cust.transactionCount} transactions</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(cust.sales)}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{cust.quantity.toLocaleString()} units</p>
                </div>
              </div>
            ))}
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
                  tickFormatter={v => (quarterMetricType === 'sales' ? `₹${(v / 100000).toFixed(0)}L` : v)}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <Tooltip
                  formatter={(val: any) => [
                    quarterMetricType === 'sales' ? `₹${Number(val).toLocaleString('en-IN')}` : Number(val).toLocaleString(),
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
