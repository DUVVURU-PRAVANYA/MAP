import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Users,
  Package,
  Target,
  Clock,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Factory,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ReferenceLine,
  Legend,
} from 'recharts';
import { useAnalytics } from '../../context/AnalyticsContext';

export const TimeAnalysis: React.FC = () => {
  const {
    timeTrends,
    quarterlyBreakdown,
    financialYearBreakdown,
    allRecords,
    filteredRecords,
    selectedReportingFY,
    availableReportingFYs,
    availableFinancialYears,
    filters,
  } = useAnalytics();

  const [granularity, setGranularity] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  // Determine Current Actual Year and Last Year
  const sortedFYs = useMemo(() => {
    if (availableFinancialYears && availableFinancialYears.length > 0) {
      return [...availableFinancialYears].sort();
    }
    const set = new Set<string>();
    allRecords.forEach(r => {
      if (r.financialYear && r.financialYear !== 'FY Unknown') set.add(r.financialYear);
    });
    return Array.from(set).sort();
  }, [availableFinancialYears, allRecords]);

  const currentFY =
    selectedReportingFY && selectedReportingFY !== 'ALL' && selectedReportingFY !== 'All Years'
      ? selectedReportingFY
      : sortedFYs[sortedFYs.length - 1] || 'FY 2025-26';

  const currentFYIndex = sortedFYs.indexOf(currentFY);
  const lastYearFY = currentFYIndex > 0 ? sortedFYs[currentFYIndex - 1] : '';

  // Determine distinct selected plants count (Part 5 & 6: ₹120 Cr per plant)
  const distinctPlantsInfo = useMemo(() => {
    let plantList: string[] = [];
    if (filters.plants.length > 0) {
      plantList = filters.plants;
    } else {
      const distinctSet = new Set(
        filteredRecords.map(r => r.plantName || r.plantCode).filter(Boolean)
      );
      plantList = distinctSet.size > 0 ? Array.from(distinctSet) : ['Chennai', 'Hyderabad', 'Pondicherry', 'Trichy'];
    }
    const count = plantList.length;

    // Target Allocations per Part 5 & 8
    const annualTargetCr = count * 120.0; // ₹120 Cr per plant annual
    const monthlyTargetCr = count * 10.0; // ₹10 Cr per plant per month (₹120 Cr / 12)
    const quarterlyTargetCr = count * 30.0; // ₹30 Cr per plant per quarter (₹120 Cr / 4)

    return {
      plantList,
      count,
      annualTargetCr,
      monthlyTargetCr,
      quarterlyTargetCr,
    };
  }, [filters.plants, filteredRecords]);

  // Sales Target Analysis Logic (Parts 5, 6, 7)
  const salesTargetAnalysis = useMemo(() => {
    const targetCr = distinctPlantsInfo.annualTargetCr;

    // Calculate actual sales for current reporting period strictly from filtered clean records
    const actualSalesCr = filteredRecords.reduce((sum, r) => sum + r.saleValue, 0);
    const achievementPct = targetCr > 0 ? Number(((actualSalesCr / targetCr) * 100).toFixed(2)) : 0;
    const varianceCr = Number((actualSalesCr - targetCr).toFixed(2));
    const isTargetReached = actualSalesCr >= targetCr;

    // Last Year sales (if prior FY genuinely exists in dataset and respects active filters)
    const hasPriorYearData = Boolean(lastYearFY && sortedFYs.includes(lastYearFY));
    const lastYearRecs = hasPriorYearData
      ? allRecords.filter(r => {
          if (r.financialYear !== lastYearFY) return false;
          if (filters.plants.length > 0 && !filters.plants.includes(r.plantName) && !filters.plants.includes(r.plantCode)) return false;
          if (filters.segments.length > 0 && !filters.segments.includes(r.productSegment)) return false;
          if (filters.rblProductSegments && filters.rblProductSegments.length > 0 && (!r.rblProductSegment || !filters.rblProductSegments.includes(r.rblProductSegment))) return false;
          if (filters.customers.length > 0 && !filters.customers.includes(r.customer) && !filters.customers.includes(r.custNum)) return false;
          if (filters.customerGroups.length > 0 && !filters.customerGroups.includes(r.customerGroup)) return false;
          if (filters.masterCustomerGroups.length > 0 && !filters.masterCustomerGroups.includes(r.masterCustomerGroup)) return false;
          if (filters.products.length > 0) {
            const prodName = `${r.materialCode} - ${r.description}`;
            const isMatch =
              filters.products.includes(r.description) ||
              filters.products.includes(r.materialCode) ||
              filters.products.includes(prodName);
            if (!isMatch) return false;
          }
          if (filters.invoiceNums.length > 0 && !filters.invoiceNums.includes(r.invoiceNum)) return false;
          if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            const matches =
              (r.customer && r.customer.toLowerCase().includes(term)) ||
              (r.description && r.description.toLowerCase().includes(term)) ||
              (r.materialCode && r.materialCode.toLowerCase().includes(term)) ||
              (r.productSegment && r.productSegment.toLowerCase().includes(term)) ||
              (r.application && r.application.toLowerCase().includes(term));
            if (!matches) return false;
          }
          return true;
        })
      : [];
    const lastYearSalesCr = hasPriorYearData ? lastYearRecs.reduce((sum, r) => sum + r.saleValue, 0) : null;
    const lastYearAchievementPct =
      lastYearSalesCr !== null && targetCr > 0 ? Number(((lastYearSalesCr / targetCr) * 100).toFixed(2)) : null;

    const yoySalesGrowthCr =
      lastYearSalesCr !== null ? Number((actualSalesCr - lastYearSalesCr).toFixed(2)) : null;

    let yoySalesGrowthPct: number | null = null;
    let yoySalesGrowthStatus = 'N/A — No Prior FY in Dataset';

    if (!hasPriorYearData || lastYearSalesCr === null) {
      yoySalesGrowthStatus = 'N/A — No Prior FY in Dataset';
    } else if (lastYearSalesCr <= 0) {
      yoySalesGrowthStatus = 'N/A — No Previous-Year Sales';
    } else {
      yoySalesGrowthPct = Number((((actualSalesCr - lastYearSalesCr) / lastYearSalesCr) * 100).toFixed(1));
      yoySalesGrowthStatus = `${yoySalesGrowthPct >= 0 ? '+' : ''}${yoySalesGrowthPct}% YoY`;
    }

    return {
      targetCr,
      actualSalesCr,
      achievementPct,
      varianceCr,
      isTargetReached,
      hasPriorYearData,
      lastYearFY,
      lastYearSalesCr,
      lastYearAchievementPct,
      yoySalesGrowthCr,
      yoySalesGrowthPct,
      yoySalesGrowthStatus,
      currentFY,
      plantCount: distinctPlantsInfo.count,
    };
  }, [allRecords, filteredRecords, currentFY, lastYearFY, sortedFYs, distinctPlantsInfo, filters]);

  // Compute MoM, QoQ, or YoY % changes sorted in April-March Financial Year order
  const periodDataWithChange = useMemo(() => {
    const rawList =
      granularity === 'monthly'
        ? timeTrends
        : granularity === 'quarterly'
        ? quarterlyBreakdown
        : financialYearBreakdown;

    return rawList.map((item, idx) => {
      let salesChangePct = 0;
      let qtyChangePct = 0;

      if (idx > 0) {
        const prevSales = rawList[idx - 1].sales;
        const prevQty = rawList[idx - 1].quantity;
        if (prevSales > 0) {
          salesChangePct = Number((((item.sales - prevSales) / prevSales) * 100).toFixed(1));
        }
        if (prevQty > 0) {
          qtyChangePct = Number((((item.quantity - prevQty) / prevQty) * 100).toFixed(1));
        }
      }

      return {
        ...item,
        salesChangePct,
        qtyChangePct,
      };
    });
  }, [timeTrends, quarterlyBreakdown, financialYearBreakdown, granularity]);


  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-brand-600" />
            <span>Sales Target vs Actual Analysis</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Performance vs Plant Benchmark Target (₹120 Cr per Plant) and Period Revenue Velocity (Value in Crores)
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-sm">
          <button
            onClick={() => setGranularity('monthly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              granularity === 'monthly'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Monthly (MoM)
          </button>
          <button
            onClick={() => setGranularity('quarterly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              granularity === 'quarterly'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Quarterly (QoQ)
          </button>
          <button
            onClick={() => setGranularity('yearly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              granularity === 'yearly'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Yearly (YoY)
          </button>
        </div>
      </div>

      {/* SALES TARGET VS ACTUAL PERFORMANCE SECTION (Parts 5, 6, 7) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-600" />
              <span>
                Sales Target vs Actual ({distinctPlantsInfo.count} Plant{distinctPlantsInfo.count > 1 ? 's' : ''}: ₹{distinctPlantsInfo.annualTargetCr.toFixed(0)} Cr Annual Target)
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Target = {distinctPlantsInfo.count} × ₹120 Cr = ₹{distinctPlantsInfo.annualTargetCr.toFixed(2)} Cr | Achievement % = (Actual / Target) × 100 | Variance = Actual − Target
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              Period: {salesTargetAnalysis.currentFY}
            </span>
            {salesTargetAnalysis.isTargetReached ? (
              <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                [ TARGET REACHED ]
              </span>
            ) : (
              <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                [ BELOW TARGET ]
              </span>
            )}
          </div>
        </div>

        {/* 3 Value Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Target Card */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">1. Target Benchmark</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                [ TARGET ]
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              ₹{salesTargetAnalysis.targetCr.toFixed(2)} Cr
            </p>
            <p className="text-[11px] text-slate-400">
              {distinctPlantsInfo.count} Plant{distinctPlantsInfo.count > 1 ? 's' : ''} Selected (₹120 Cr / Plant)
            </p>
          </div>

          {/* 2. Last Year Card */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                2. Last Year {salesTargetAnalysis.hasPriorYearData ? `(${salesTargetAnalysis.lastYearFY})` : ''}
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                [ LAST YEAR ]
              </span>
            </div>
            <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
              {salesTargetAnalysis.hasPriorYearData && salesTargetAnalysis.lastYearSalesCr !== null
                ? `₹${salesTargetAnalysis.lastYearSalesCr.toFixed(2)} Cr`
                : 'N/A'}
            </p>
            <p className="text-[11px] text-slate-400">
              {salesTargetAnalysis.hasPriorYearData && salesTargetAnalysis.lastYearAchievementPct !== null
                ? `${salesTargetAnalysis.lastYearAchievementPct.toFixed(1)}% of Target`
                : 'No prior FY in dataset'}
            </p>
          </div>

          {/* 3. Actual Year Achieved Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                3. Actual Year Sales ({salesTargetAnalysis.currentFY})
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  salesTargetAnalysis.isTargetReached
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                }`}
              >
                {salesTargetAnalysis.isTargetReached ? '[ TARGET REACHED ]' : '[ BELOW TARGET ]'}
              </span>
            </div>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{salesTargetAnalysis.actualSalesCr.toFixed(2)} Cr
            </p>
            <div className="flex items-center space-x-2 text-[11px] font-bold">
              <span className={salesTargetAnalysis.isTargetReached ? 'text-emerald-600' : 'text-amber-600'}>
                {salesTargetAnalysis.achievementPct.toFixed(1)}% Achieved ({salesTargetAnalysis.varianceCr >= 0 ? '+' : ''}
                ₹{salesTargetAnalysis.varianceCr.toFixed(2)} Cr)
              </span>
              {salesTargetAnalysis.yoySalesGrowthStatus && (
                <>
                  <span className="text-slate-400">•</span>
                  <span
                    className={
                      salesTargetAnalysis.yoySalesGrowthPct !== null
                        ? salesTargetAnalysis.yoySalesGrowthPct >= 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                        : 'text-slate-500 dark:text-slate-400 font-medium'
                    }
                  >
                    {salesTargetAnalysis.yoySalesGrowthStatus}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Cross Analysis Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Performance Metric</th>
                <th className="py-2.5 px-4 text-right">Sales Value (Cr)</th>
                <th className="py-2.5 px-4 text-right">Achievement % (vs Target)</th>
                <th className="py-2.5 px-4 text-right">Variance (vs Target)</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Target ({distinctPlantsInfo.count} Plants)</td>
                <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                  ₹{salesTargetAnalysis.targetCr.toFixed(2)} Cr
                </td>
                <td className="py-3 px-4 text-right text-slate-400">100.0%</td>
                <td className="py-3 px-4 text-right text-slate-400">₹0.00 Cr (Benchmark)</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    [ TARGET ]
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                  Last Year {salesTargetAnalysis.hasPriorYearData ? `(${salesTargetAnalysis.lastYearFY})` : ''}
                </td>
                <td className="py-3 px-4 text-right font-black text-blue-600 dark:text-blue-400">
                  {salesTargetAnalysis.hasPriorYearData && salesTargetAnalysis.lastYearSalesCr !== null
                    ? `₹${salesTargetAnalysis.lastYearSalesCr.toFixed(2)} Cr`
                    : 'N/A (Single FY)'}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-blue-600 dark:text-blue-400">
                  {salesTargetAnalysis.hasPriorYearData && salesTargetAnalysis.lastYearAchievementPct !== null
                    ? `${salesTargetAnalysis.lastYearAchievementPct.toFixed(1)}%`
                    : '-'}
                </td>
                <td className="py-3 px-4 text-right text-slate-500">
                  {salesTargetAnalysis.hasPriorYearData && salesTargetAnalysis.lastYearSalesCr !== null
                    ? `${salesTargetAnalysis.lastYearSalesCr - salesTargetAnalysis.targetCr >= 0 ? '+' : ''}₹${(salesTargetAnalysis.lastYearSalesCr - salesTargetAnalysis.targetCr).toFixed(2)} Cr`
                    : '-'}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    [ LAST YEAR ]
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 bg-emerald-50/20">
                <td className="py-3 px-4 font-black text-emerald-700 dark:text-emerald-300">
                  Actual Sales Achieved ({salesTargetAnalysis.currentFY})
                </td>
                <td className="py-3 px-4 text-right font-black text-emerald-700 dark:text-emerald-300 text-sm">
                  ₹{salesTargetAnalysis.actualSalesCr.toFixed(2)} Cr
                </td>
                <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                  {salesTargetAnalysis.achievementPct.toFixed(1)}%
                </td>
                <td
                  className={`py-3 px-4 text-right font-bold ${
                    salesTargetAnalysis.varianceCr >= 0 ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {salesTargetAnalysis.varianceCr >= 0 ? '+' : ''}₹{salesTargetAnalysis.varianceCr.toFixed(2)} Cr
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      salesTargetAnalysis.isTargetReached
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {salesTargetAnalysis.isTargetReached ? '[ TARGET REACHED ]' : '[ BELOW TARGET ]'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* REVENUE VELOCITY GRAPH (Purely Actual Sales Trend / Velocity) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Revenue Velocity
            </h3>
            <p className="text-xs text-slate-500">
              {granularity === 'monthly' ? 'Monthly (April → March)' : granularity === 'quarterly' ? 'Quarterly (Q1 → Q4)' : 'Yearly (YoY)'} — Actual Sales Trend (Value in Crores)
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span>Actual Sales (Cr)</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={periodDataWithChange}
              margin={{ top: 20, right: 30, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey={granularity === 'monthly' ? 'period' : granularity === 'quarterly' ? 'quarter' : 'financialYear'}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                tickFormatter={v => `₹${Number(v).toFixed(1)}Cr`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                domain={[0, 'auto']}
              />
              <Tooltip
                formatter={(val: any) => [`₹${Number(val).toFixed(2)} Cr`, 'Revenue / Sales Value']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="sales" stroke="#10b981" fill="url(#timeGrad)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Period-by-Period Comparison Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-card">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {granularity === 'monthly' ? 'Monthly (MoM)' : granularity === 'quarterly' ? 'Quarterly (QoQ)' : 'Yearly (YoY)'} Detailed Performance Table
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 text-right">Sales Value (Cr)</th>
                <th className="py-3 px-4 text-right">
                  {granularity === 'monthly'
                    ? 'MoM Sales Change'
                    : granularity === 'quarterly'
                    ? 'QoQ Sales Change'
                    : 'YoY Sales Change'}
                </th>
                <th className="py-3 px-4 text-right">Invoice Quantity (Nos)</th>
                <th className="py-3 px-4 text-right">
                  {granularity === 'monthly'
                    ? 'MoM Qty Change'
                    : granularity === 'quarterly'
                    ? 'QoQ Qty Change'
                    : 'YoY Qty Change'}
                </th>
                <th className="py-3 px-4 text-center">Active Accounts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {periodDataWithChange.map((row: any, idx: number) => {
                const label =
                  granularity === 'monthly' ? row.period : granularity === 'quarterly' ? row.quarter : row.financialYear;
                const isPositive = row.salesChangePct >= 0;

                return (
                  <tr key={label} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{label}</td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                      ₹{Number(row.sales).toFixed(2)} Cr
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold">
                      {idx === 0 ? (
                        <span className="text-slate-400 font-normal">Base Period</span>
                      ) : isPositive ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-end space-x-0.5">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>+{row.salesChangePct}%</span>
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 flex items-center justify-end space-x-0.5">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          <span>{row.salesChangePct}%</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                      {row.quantity.toLocaleString()} Nos
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">
                      {idx === 0 ? '-' : `${row.qtyChangePct >= 0 ? '+' : ''}${row.qtyChangePct}%`}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium">{row.customers}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
