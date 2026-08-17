import React, { useState, useMemo } from 'react';
import {
  Factory,
  Building2,
  GitFork,
  UserCheck,
  Boxes,
  Package,
  IndianRupee,
  TrendingUp,
  BarChart2,
  Filter,
  Layers,
  Search,
  Users,
  Receipt,
  ChevronRight,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { useAnalytics } from '../../context/AnalyticsContext';

export const PlantAnalysis: React.FC = () => {
  const {
    allRecords,
    filteredRecords,
    filters,
    setFilter,
    togglePlantFilter,
    availableProducts,
    availableSegments,
    availableFinancialYears,
    selectedReportingFY,
    setSelectedReportingFY,
  } = useAnalytics();

  const [selectedProductForComparison, setSelectedProductForComparison] = useState<string>('');
  const [customerHierarchyLevel, setCustomerHierarchyLevel] = useState<'master' | 'group' | 'customer'>('master');
  const [selectedMasterGroup, setSelectedMasterGroup] = useState<string | null>(null);
  const [selectedCustomerGroup, setSelectedCustomerGroup] = useState<string | null>(null);
  const [productFilterForCustomerAnalysis, setProductFilterForCustomerAnalysis] = useState<string>('');

  const PLANT_DEFINITIONS = [
    { code: '3000', name: 'Chennai', color: '#0c8de9' },
    { code: '3100', name: 'Hyderabad', color: '#10b981' },
    { code: '3200', name: 'Pondicherry', color: '#f59e0b' },
    { code: '3600', name: 'Trichy', color: '#8b5cf6' },
  ];

  // Active plant scope from global filters
  const activePlantFilter = filters.plants[0] || '';

  // 1. Plant Scope Records (filteredRecords respects active FY, Segment, Product, Customer, Invoice filters)
  const scopedRecords = useMemo(() => {
    if (!activePlantFilter || activePlantFilter === 'ALL' || activePlantFilter === 'All Plants') {
      return filteredRecords;
    }
    return filteredRecords.filter(
      r => r.plantName === activePlantFilter || r.plantCode === activePlantFilter
    );
  }, [filteredRecords, activePlantFilter]);

  // 2. Scoped KPI Metrics
  const scopedKPIs = useMemo(() => {
    const totalSales = scopedRecords.reduce((sum, r) => sum + r.saleValue, 0);
    const totalQty = scopedRecords.reduce((sum, r) => sum + r.invQty, 0);
    const masterCustomerCount = new Set(scopedRecords.map(r => r.masterCustomerGroup).filter(Boolean)).size;
    const individualCustomerCount = new Set(scopedRecords.map(r => r.customer).filter(Boolean)).size;
    const productCount = new Set(scopedRecords.map(r => `${r.materialCode}|||${r.description}`)).size;
    const invoiceCount = new Set(scopedRecords.map(r => r.invoiceNum).filter(Boolean)).size;
    const transactionCount = scopedRecords.length;

    return {
      totalSales,
      totalQty,
      masterCustomerCount,
      individualCustomerCount,
      productCount,
      invoiceCount,
      transactionCount,
    };
  }, [scopedRecords]);

  // 3. Plant Performance Matrix & Sales Contribution
  const plantPerformanceMatrix = useMemo(() => {
    const totalFilteredSales = filteredRecords.reduce((sum, r) => sum + r.saleValue, 0) || 1;

    return PLANT_DEFINITIONS.map(plant => {
      const plantRecords = filteredRecords.filter(
        r => r.plantCode === plant.code || r.plantName === plant.name
      );

      const sales = plantRecords.reduce((sum, r) => sum + r.saleValue, 0);
      const quantity = plantRecords.reduce((sum, r) => sum + r.invQty, 0);
      const masterCustomers = new Set(plantRecords.map(r => r.masterCustomerGroup).filter(Boolean)).size;
      const individualCustomers = new Set(plantRecords.map(r => r.customer).filter(Boolean)).size;
      const products = new Set(plantRecords.map(r => `${r.materialCode}|||${r.description}`)).size;
      const invoices = new Set(plantRecords.map(r => r.invoiceNum).filter(Boolean)).size;
      const contributionPct = Number(((sales / totalFilteredSales) * 100).toFixed(1));

      return {
        plantCode: plant.code,
        plantName: plant.name,
        color: plant.color,
        sales,
        quantity,
        masterCustomers,
        individualCustomers,
        products,
        invoices,
        transactions: plantRecords.length,
        contributionPct,
      };
    }).sort((a, b) => b.sales - a.sales);
  }, [filteredRecords]);

  // 4. Plant -> Product Analysis (Products contributing to active plant scope)
  const plantProductAnalysis = useMemo(() => {
    const map: Record<
      string,
      {
        description: string;
        materialCode: string;
        segment: string;
        sales: number;
        quantity: number;
        masterCustomers: Set<string>;
        invoices: Set<string>;
      }
    > = {};

    const totalScopeSales = scopedRecords.reduce((sum, r) => sum + r.saleValue, 0) || 1;

    scopedRecords.forEach(r => {
      const key = `${r.materialCode}|||${r.description}`;
      if (!map[key]) {
        map[key] = {
          description: r.description,
          materialCode: r.materialCode,
          segment: r.productSegment,
          sales: 0,
          quantity: 0,
          masterCustomers: new Set(),
          invoices: new Set(),
        };
      }
      map[key].sales += r.saleValue;
      map[key].quantity += r.invQty;
      map[key].masterCustomers.add(r.masterCustomerGroup || r.customer);
      map[key].invoices.add(r.invoiceNum);
    });

    return Object.values(map)
      .map(p => ({
        description: p.description,
        materialCode: p.materialCode,
        segment: p.segment,
        sales: p.sales,
        quantity: p.quantity,
        masterCustomerCount: p.masterCustomers.size,
        invoiceCount: p.invoices.size,
        contributionPct: Number(((p.sales / totalScopeSales) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.sales - a.sales);
  }, [scopedRecords]);

  // 5. Requirement 10: Same Product Performance Across Different Plants
  const allProductOptions = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach(r => {
      if (r.description) set.add(r.description);
    });
    return Array.from(set).sort();
  }, [allRecords]);

  const activeComparisonProduct = selectedProductForComparison || (allProductOptions[0] || '');

  const sameProductAcrossPlants = useMemo(() => {
    if (!activeComparisonProduct) return [];

    const productRecords = filteredRecords.filter(
      r => r.description === activeComparisonProduct || r.materialCode === activeComparisonProduct
    );
    const totalProductSales = productRecords.reduce((sum, r) => sum + r.saleValue, 0) || 1;

    return PLANT_DEFINITIONS.map(plant => {
      const pRecords = productRecords.filter(
        r => r.plantCode === plant.code || r.plantName === plant.name
      );

      const sales = pRecords.reduce((sum, r) => sum + r.saleValue, 0);
      const quantity = pRecords.reduce((sum, r) => sum + r.invQty, 0);
      const masterCustomers = new Set(pRecords.map(r => r.masterCustomerGroup).filter(Boolean)).size;
      const invoices = new Set(pRecords.map(r => r.invoiceNum).filter(Boolean)).size;
      const sharePct = Number(((sales / totalProductSales) * 100).toFixed(1));

      return {
        plantCode: plant.code,
        plantName: plant.name,
        color: plant.color,
        sales,
        quantity,
        masterCustomers,
        invoices,
        sharePct,
      };
    }).sort((a, b) => b.sales - a.sales);
  }, [filteredRecords, activeComparisonProduct]);

  // 6. Plant -> Customer Analysis (3-Level Customer Hierarchy)
  const plantCustomerHierarchy = useMemo(() => {
    let targetRecords = scopedRecords;
    if (productFilterForCustomerAnalysis) {
      targetRecords = targetRecords.filter(
        r => r.description === productFilterForCustomerAnalysis || r.materialCode === productFilterForCustomerAnalysis
      );
    }

    if (customerHierarchyLevel === 'group' && selectedMasterGroup) {
      targetRecords = targetRecords.filter(r => r.masterCustomerGroup === selectedMasterGroup);
    } else if (customerHierarchyLevel === 'customer' && selectedCustomerGroup) {
      targetRecords = targetRecords.filter(r => r.customerGroup === selectedCustomerGroup);
    }

    const totalScopeSales = targetRecords.reduce((sum, r) => sum + r.saleValue, 0) || 1;

    const map: Record<
      string,
      {
        key: string;
        name: string;
        masterGroup: string;
        custGroup: string;
        sales: number;
        quantity: number;
        products: Set<string>;
        invoices: Set<string>;
      }
    > = {};

    targetRecords.forEach(r => {
      let key = r.masterCustomerGroup || r.customer;
      if (customerHierarchyLevel === 'group') {
        key = r.customerGroup || r.customer;
      } else if (customerHierarchyLevel === 'customer') {
        key = r.customer;
      }

      if (!map[key]) {
        map[key] = {
          key,
          name: key,
          masterGroup: r.masterCustomerGroup,
          custGroup: r.customerGroup,
          sales: 0,
          quantity: 0,
          products: new Set(),
          invoices: new Set(),
        };
      }

      map[key].sales += r.saleValue;
      map[key].quantity += r.invQty;
      map[key].products.add(`${r.materialCode}|||${r.description}`);
      map[key].invoices.add(r.invoiceNum);
    });

    return Object.values(map)
      .map(c => ({
        key: c.key,
        name: c.name,
        masterCustomerGroup: c.masterGroup,
        customerGroup: c.custGroup,
        sales: c.sales,
        quantity: c.quantity,
        productCount: c.products.size,
        invoiceCount: c.invoices.size,
        contributionPct: Number(((c.sales / totalScopeSales) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.sales - a.sales);
  }, [scopedRecords, customerHierarchyLevel, selectedMasterGroup, selectedCustomerGroup, productFilterForCustomerAnalysis]);

  // 7. Plant Sales Trend by FY, Quarter, and Month
  const plantTimeTrends = useMemo(() => {
    // FY Breakdown
    const fyMap: Record<string, { sales: number; quantity: number; masterCustomers: Set<string>; transactions: number }> = {};
    // Monthly Breakdown
    const monthMap: Record<string, { month: string; sales: number; quantity: number; sortKey: number }> = {};
    // Quarterly Breakdown
    const qMap: Record<string, { quarter: string; sales: number; quantity: number }> = {};

    scopedRecords.forEach(r => {
      const fy = r.financialYear || 'FY Unknown';
      if (!fyMap[fy]) {
        fyMap[fy] = { sales: 0, quantity: 0, masterCustomers: new Set(), transactions: 0 };
      }
      fyMap[fy].sales += r.saleValue;
      fyMap[fy].quantity += r.invQty;
      fyMap[fy].masterCustomers.add(r.masterCustomerGroup || r.customer);
      fyMap[fy].transactions += 1;

      if (!monthMap[r.month]) {
        let sortKey = r.monthSortKey;
        if (sortKey === undefined) {
          const d = new Date(r.billDate);
          sortKey = isNaN(d.getTime()) ? 0 : d.getFullYear() * 12 + d.getMonth();
        }
        monthMap[r.month] = { month: r.month, sales: 0, quantity: 0, sortKey };
      }
      monthMap[r.month].sales += r.saleValue;
      monthMap[r.month].quantity += r.invQty;

      if (!qMap[r.quarter]) {
        qMap[r.quarter] = { quarter: r.quarter, sales: 0, quantity: 0 };
      }
      qMap[r.quarter].sales += r.saleValue;
      qMap[r.quarter].quantity += r.invQty;
    });

    const sortedFYs = Object.keys(fyMap).sort();
    const fyBreakdown = sortedFYs.map((fy, idx) => {
      const data = fyMap[fy];
      const prevSales = idx > 0 ? fyMap[sortedFYs[idx - 1]].sales : undefined;
      let yoyGrowthPct: number | null = null;
      if (prevSales !== undefined && prevSales > 0) {
        yoyGrowthPct = Number((((data.sales - prevSales) / prevSales) * 100).toFixed(1));
      }
      return {
        financialYear: fy,
        sales: data.sales,
        quantity: data.quantity,
        masterCustomers: data.masterCustomers.size,
        transactions: data.transactions,
        yoyGrowthPct,
      };
    });

    const monthlyTrend = Object.values(monthMap).sort((a, b) => a.sortKey - b.sortKey);

    const quarterOrder = ['Q1', 'Q2', 'Q3', 'Q4'];
    const quarterlyTrend = Object.values(qMap).sort((a, b) => {
      const idxA = quarterOrder.findIndex(q => a.quarter.startsWith(q));
      const idxB = quarterOrder.findIndex(q => b.quarter.startsWith(q));
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.quarter.localeCompare(b.quarter);
    });

    return { fyBreakdown, monthlyTrend, quarterlyTrend };
  }, [scopedRecords]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Factory className="w-7 h-7 text-amber-500" />
            <span>Plant Analysis & Cross-Plant Intelligence</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Multi-Plant Sales Comparison, Product-Wise Plant Allocation, and Customer Distribution (Value in Crores)
          </p>
        </div>

        {/* Global Filter Sync Reset */}
        {activePlantFilter && (
          <button
            onClick={() => setFilter('plants', [])}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Plant Filter ({activePlantFilter})</span>
          </button>
        )}
      </div>

      {/* 5. PLANT SELECTOR BAR (Synced with AnalyticsContext) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-amber-500" />
            <span>Active Plant Analysis Scope</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Currently Viewing: <strong className="text-amber-600 dark:text-amber-400">{activePlantFilter || 'All 4 Plants (Chennai, Hyderabad, Pondicherry, Trichy)'}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('plants', [])}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-sm ${
              !activePlantFilter || activePlantFilter === 'ALL' || activePlantFilter === 'All Plants'
                ? 'bg-amber-500 text-white ring-2 ring-amber-400/50 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Plants (4)
          </button>

          {PLANT_DEFINITIONS.map(p => {
            const isActive = activePlantFilter === p.name || activePlantFilter === p.code;
            return (
              <button
                key={p.code}
                onClick={() => setFilter('plants', [p.name])}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-500/50'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span>{p.name} ({p.code})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. SCOPED PLANT KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* KPI 1: Total Sales (Cr) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Sales Value</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1.5 truncate">
            ₹{scopedKPIs.totalSales.toFixed(2)} Cr
          </p>
          <div className="flex items-center space-x-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            <ArrowUpRight className="w-3 h-3" />
            <span>Value In Crs</span>
          </div>
        </div>

        {/* KPI 2: Total Inv. Qty (Nos) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Inv Quantity</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1.5 truncate">
            {scopedKPIs.totalQty.toLocaleString()} Nos
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Primary Quantity</p>
        </div>

        {/* KPI 3: Customer Count (DISTINCT Master Customer Group) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Customer Count</span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1.5 truncate">
            {scopedKPIs.masterCustomerCount}
          </p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1 font-semibold truncate" title="DISTINCT Master Customer Groups">
            Master Groups ({scopedKPIs.individualCustomerCount} Accounts)
          </p>
        </div>

        {/* KPI 4: Product Count (Distinct SKUs) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Products</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1.5 truncate">
            {scopedKPIs.productCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Active Material SKUs</p>
        </div>

        {/* KPI 5: Invoice Count (DISTINCT Invoice Num) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Invoices</span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1.5 truncate">
            {scopedKPIs.invoiceCount.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Distinct Invoices</p>
        </div>
      </div>

      {/* 7 & 8. PLANT-WISE SALES COMPARISON & DETAILED PERFORMANCE MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plant Comparison Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <BarChart2 className="w-5 h-5 text-amber-500" />
                <span>Plant Sales Comparison (Sales in Cr)</span>
              </h3>
              <p className="text-xs text-slate-500">Sales value & contribution % across Chennai (3000), Hyderabad (3100), Pondicherry (3200), and Trichy (3600)</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plantPerformanceMatrix}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="plantName" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                <YAxis tickFormatter={v => `₹${v.toFixed(1)}Cr`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any) => [`₹${Number(value).toFixed(2)} Cr`, 'Sales Value']} />
                <Bar dataKey="sales" radius={[8, 8, 0, 0]}>
                  {plantPerformanceMatrix.map(entry => (
                    <Cell key={entry.plantCode} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plant Contribution Cards Grid (1 Col) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Plant Sales Share %
          </h3>
          <div className="space-y-3">
            {plantPerformanceMatrix.map(plant => (
              <div
                key={plant.plantCode}
                onClick={() => setFilter('plants', [plant.plantName])}
                className="cursor-pointer p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-amber-50/50 border border-slate-100 dark:border-slate-800 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plant.color }} />
                    <span>{plant.plantName} ({plant.plantCode})</span>
                  </span>
                  <span className="font-black text-amber-600 dark:text-amber-400">{plant.contributionPct}% Share</span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${plant.contributionPct}%`, backgroundColor: plant.color }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Sales: <strong>₹{plant.sales.toFixed(2)} Cr</strong></span>
                  <span>Qty: <strong>{plant.quantity.toLocaleString()} Nos</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 8. DETAILED PLANT PERFORMANCE TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-card">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span>Detailed Plant Performance Matrix</span>
          </h3>
          <span className="text-xs text-slate-400">Master Customers = DISTINCT Master Customer Group</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Plant Name</th>
                <th className="py-3 px-4">Plant Code</th>
                <th className="py-3 px-4 text-right">Sales Revenue (Cr)</th>
                <th className="py-3 px-4 text-right">Contribution %</th>
                <th className="py-3 px-4 text-right">Quantity (Nos)</th>
                <th className="py-3 px-4 text-center">Master Customers</th>
                <th className="py-3 px-4 text-center">Products (SKUs)</th>
                <th className="py-3 px-4 text-center">Invoices</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {plantPerformanceMatrix.map(plant => (
                <tr
                  key={plant.plantCode}
                  onClick={() => setFilter('plants', [plant.plantName])}
                  className="hover:bg-amber-50/50 dark:hover:bg-amber-950/30 cursor-pointer transition-colors font-medium"
                >
                  <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plant.color }} />
                    <span>{plant.plantName}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-500">{plant.plantCode}</td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                    ₹{plant.sales.toFixed(2)} Cr
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                    {plant.contributionPct}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {plant.quantity.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-purple-600 dark:text-purple-400">
                    {plant.masterCustomers}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium">{plant.products}</td>
                  <td className="py-3.5 px-4 text-center font-medium">{plant.invoices}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setFilter('plants', [plant.plantName]);
                      }}
                      className="px-3 py-1 text-[11px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                    >
                      Filter Scope &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 10. REQUIREMENT 10: SAME PRODUCT PERFORMANCE ACROSS DIFFERENT PLANTS */}
      <div className="bg-white dark:bg-slate-900 border border-brand-300 dark:border-brand-800 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-500" />
              <span>Same Product Performance Across Different Plants</span>
            </h3>
            <p className="text-xs text-slate-500">
              Select any product to compare its sales & volume distribution across Chennai, Hyderabad, Pondicherry, and Trichy
            </p>
          </div>

          {/* Product Selector Dropdown */}
          <div className="w-full sm:w-72">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Select Product SKU:</label>
            <select
              value={activeComparisonProduct}
              onChange={e => setSelectedProductForComparison(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-brand-300 dark:border-brand-800 bg-brand-50/50 dark:bg-slate-800 font-extrabold text-brand-600 dark:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {allProductOptions.map(prod => (
                <option key={prod} value={prod}>
                  {prod}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Product Cross-Plant Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sameProductAcrossPlants.map(plant => (
            <div
              key={plant.plantCode}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plant.color }} />
                  <span>{plant.plantName} ({plant.plantCode})</span>
                </span>
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{plant.sharePct}% Share</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400">Product Sales Value</span>
                <p className="text-lg font-black text-slate-900 dark:text-white">₹{plant.sales.toFixed(2)} Cr</p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Inv Quantity</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{plant.quantity.toLocaleString()} Nos</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Master Customers</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{plant.masterCustomers}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 9. PLANT -> PRODUCT ANALYSIS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              <span>Products Contributing to {activePlantFilter || 'All Plants'}</span>
            </h3>
            <p className="text-xs text-slate-500">Ranked by SUM(Value In Crs) descending for currently scoped plant selection</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Product Description</th>
                <th className="py-3 px-4">Material Code</th>
                <th className="py-3 px-4">Vehicle Segment</th>
                <th className="py-3 px-4 text-right">Sales Revenue (Cr)</th>
                <th className="py-3 px-4 text-right">Plant Share %</th>
                <th className="py-3 px-4 text-right">Quantity (Nos)</th>
                <th className="py-3 px-4 text-center">Master Customers</th>
                <th className="py-3 px-4 text-center">Invoices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {plantProductAnalysis.slice(0, 10).map((prod, idx) => (
                <tr key={prod.materialCode + prod.description} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium">
                  <td className="py-3 px-4 font-bold text-slate-400">#{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{prod.description}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{prod.materialCode}</td>
                  <td className="py-3 px-4 text-slate-500">{prod.segment}</td>
                  <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">₹{prod.sales.toFixed(2)} Cr</td>
                  <td className="py-3 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">{prod.contributionPct}%</td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">{prod.quantity.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center font-bold text-purple-600 dark:text-purple-400">{prod.masterCustomerCount}</td>
                  <td className="py-3 px-4 text-center font-medium">{prod.invoiceCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 11, 12 & 13. PLANT -> CUSTOMER ANALYSIS (3-LEVEL CUSTOMER HIERARCHY) */}
      <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/40 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span>Customer Analysis for {activePlantFilter || 'All Plants'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              3-Level Customer Hierarchy Analysis: Master Customer Group &rarr; Customer Group &rarr; Customer
            </p>
          </div>

          {/* Optional Product Filter for Plant -> Product -> Customer Analysis */}
          <div className="w-full sm:w-64">
            <select
              value={productFilterForCustomerAnalysis}
              onChange={e => setProductFilterForCustomerAnalysis(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
            >
              <option value="">All Products for Plant</option>
              {plantProductAnalysis.map(p => (
                <option key={p.description} value={p.description}>
                  Product: {p.description}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3-Level Customer Hierarchy Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <button
            onClick={() => {
              setCustomerHierarchyLevel('master');
              setSelectedMasterGroup(null);
              setSelectedCustomerGroup(null);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              customerHierarchyLevel === 'master'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Level 1: Master Customer Group</span>
          </button>

          <button
            onClick={() => setCustomerHierarchyLevel('group')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              customerHierarchyLevel === 'group'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <GitFork className="w-4 h-4" />
            <span>Level 2: Customer Group</span>
          </button>

          <button
            onClick={() => setCustomerHierarchyLevel('customer')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              customerHierarchyLevel === 'customer'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Level 3: Individual Customer</span>
          </button>
        </div>

        {/* Customer Hierarchy Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">
                  {customerHierarchyLevel === 'master'
                    ? 'Master Customer Group'
                    : customerHierarchyLevel === 'group'
                    ? 'Customer Group'
                    : 'Customer Account'}
                </th>
                <th className="py-3 px-4 text-right">Sales Revenue (Cr)</th>
                <th className="py-3 px-4 text-right">Contribution %</th>
                <th className="py-3 px-4 text-right">Quantity (Nos)</th>
                <th className="py-3 px-4 text-center">Products (SKUs)</th>
                <th className="py-3 px-4 text-center">Invoices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {plantCustomerHierarchy.map((cust, idx) => (
                <tr key={cust.key} className="hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-colors font-medium">
                  <td className="py-3.5 px-4 font-bold text-slate-400">#{idx + 1}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {customerHierarchyLevel === 'master' ? (
                      <Building2 className="w-4 h-4 text-purple-600" />
                    ) : customerHierarchyLevel === 'group' ? (
                      <GitFork className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>{cust.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                    ₹{cust.sales.toFixed(2)} Cr
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-purple-600 dark:text-purple-400">
                    {cust.contributionPct}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {cust.quantity.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium">{cust.productCount}</td>
                  <td className="py-3.5 px-4 text-center font-medium">{cust.invoiceCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 14. PLANT SALES TREND (TIME-BASED FY / QUARTER / MONTH) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span>Plant Sales Velocity & Time Analysis for {activePlantFilter || 'All Plants'}</span>
          </h3>
          <p className="text-xs text-slate-500">Chronological April &rarr; March financial year time trends</p>
        </div>

        {/* Monthly Area Chart */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Monthly Sales Velocity (Sales in Cr)</h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={plantTimeTrends.monthlyTrend}>
                <defs>
                  <linearGradient id="plantMonthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: any) => [`₹${Number(val).toFixed(2)} Cr`, 'Sales Value']} />
                <Area type="monotone" dataKey="sales" stroke="#f59e0b" fillOpacity={1} fill="url(#plantMonthGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FY Breakdown Table */}
        <div className="pt-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">Financial Year Breakdown & YoY Growth</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2 px-3">Financial Year</th>
                  <th className="py-2 px-3 text-right">FY Sales (Cr)</th>
                  <th className="py-2 px-3 text-right">YoY Growth %</th>
                  <th className="py-2 px-3 text-right">Inv Quantity (Nos)</th>
                  <th className="py-2 px-3 text-right">Master Customers</th>
                  <th className="py-2 px-3 text-right">Transactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {plantTimeTrends.fyBreakdown.map(fyRow => (
                  <tr key={fyRow.financialYear} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{fyRow.financialYear}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">₹{fyRow.sales.toFixed(2)} Cr</td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      {fyRow.yoyGrowthPct !== null && fyRow.yoyGrowthPct !== undefined ? (
                        <span className={fyRow.yoyGrowthPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {fyRow.yoyGrowthPct >= 0 ? '+' : ''}{fyRow.yoyGrowthPct}%
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">Base Year</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">{fyRow.quantity.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-medium">{fyRow.masterCustomers}</td>
                    <td className="py-2.5 px-3 text-right font-medium">{fyRow.transactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
