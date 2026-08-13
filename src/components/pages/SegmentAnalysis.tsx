import React, { useState, useMemo } from 'react';
import { Layers, Package, Users, IndianRupee, ShoppingBag, ArrowRight, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useAnalytics } from '../../context/AnalyticsContext';

export const SegmentAnalysis: React.FC = () => {
  const { segmentBreakdown, allRecords, filteredRecords, toggleSegmentFilter, setSelectedProduct, toggleCustomerFilter, setActiveView } = useAnalytics();
  const [selectedSeg, setSelectedSeg] = useState<string>(segmentBreakdown[0]?.segment || '');

  const activeSegmentData = useMemo(() => {
    return segmentBreakdown.find(s => s.segment === selectedSeg) || segmentBreakdown[0];
  }, [segmentBreakdown, selectedSeg]);

  // Segment Multi-Financial Year Performance across all years (Section 8 & 11)
  const segmentYearlyBreakdown = useMemo(() => {
    if (!activeSegmentData) return [];
    const map: Record<string, { sales: number; quantity: number; customers: Set<string>; products: Set<string>; transactions: number }> = {};

    allRecords
      .filter(r => r.productSegment === activeSegmentData.segment)
      .forEach(r => {
        const fy = r.financialYear || 'FY Unknown';
        if (!map[fy]) {
          map[fy] = { sales: 0, quantity: 0, customers: new Set(), products: new Set(), transactions: 0 };
        }
        map[fy].sales += r.saleValue;
        map[fy].quantity += r.invQty;
        map[fy].customers.add(r.customer);
        map[fy].products.add(`${r.materialCode}|||${r.description}`);
        map[fy].transactions += 1;
      });

    const sortedFYs = Object.keys(map).sort();
    return sortedFYs.map((fy, idx) => {
      const data = map[fy];
      const prevData = idx > 0 ? map[sortedFYs[idx - 1]] : undefined;
      const prevSales = prevData?.sales;
      const prevProducts = prevData?.products.size;
      const prevCustomers = prevData?.customers.size;

      let yoyGrowthPct: number | null = null;
      if (prevSales !== undefined && prevSales > 0) {
        yoyGrowthPct = Number((((data.sales - prevSales) / prevSales) * 100).toFixed(1));
      }

      const productDiff = prevProducts !== undefined ? data.products.size - prevProducts : 0;
      const customerDiff = prevCustomers !== undefined ? data.customers.size - prevCustomers : 0;

      return {
        financialYear: fy,
        sales: data.sales,
        quantity: data.quantity,
        customers: data.customers.size,
        products: data.products.size,
        transactions: data.transactions,
        yoyGrowthPct,
        productDiff,
        customerDiff,
      };
    });
  }, [allRecords, activeSegmentData]);

  // Products in selected segment (Material Code + Description)
  const segmentTopProducts = useMemo(() => {
    if (!activeSegmentData) return [];
    const map: Record<string, { materialCode: string; description: string; sales: number; quantity: number; customers: Set<string> }> = {};

    filteredRecords
      .filter(r => r.productSegment === activeSegmentData.segment)
      .forEach(r => {
        const key = `${r.materialCode}|||${r.description}`;
        if (!map[key]) {
          map[key] = { materialCode: r.materialCode, description: r.description, sales: 0, quantity: 0, customers: new Set() };
        }
        map[key].sales += r.saleValue;
        map[key].quantity += r.invQty;
        map[key].customers.add(r.customer);
      });

    return Object.values(map).sort((a, b) => b.sales - a.sales);
  }, [filteredRecords, activeSegmentData]);

  // Customers buying from selected segment
  const segmentTopCustomers = useMemo(() => {
    if (!activeSegmentData) return [];
    const map: Record<string, { customer: string; sales: number; quantity: number }> = {};

    filteredRecords
      .filter(r => r.productSegment === activeSegmentData.segment)
      .forEach(r => {
        if (!map[r.customer]) {
          map[r.customer] = { customer: r.customer, sales: 0, quantity: 0 };
        }
        map[r.customer].sales += r.saleValue;
        map[r.customer].quantity += r.invQty;
      });

    return Object.values(map).sort((a, b) => b.sales - a.sales).slice(0, 6);
  }, [filteredRecords, activeSegmentData]);

  // Monthly trend for selected segment (April -> March Chronological)
  const segmentMonthlyTrend = useMemo(() => {
    if (!activeSegmentData) return [];
    const map: Record<string, { month: string; sales: number; quantity: number; sortKey: number }> = {};

    filteredRecords
      .filter(r => r.productSegment === activeSegmentData.segment)
      .forEach(r => {
        if (!map[r.month]) {
          let sortKey = r.monthSortKey;
          if (sortKey === undefined) {
            const dateObj = new Date(r.billDate);
            sortKey = isNaN(dateObj.getTime()) ? 0 : dateObj.getFullYear() * 12 + dateObj.getMonth();
          }
          map[r.month] = { month: r.month, sales: 0, quantity: 0, sortKey };
        }
        map[r.month].sales += r.saleValue;
        map[r.month].quantity += r.invQty;
      });

    return Object.values(map).sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredRecords, activeSegmentData]);

  // Quarterly trend for selected segment
  const segmentQuarterlyTrend = useMemo(() => {
    if (!activeSegmentData) return [];
    const map: Record<string, { quarter: string; sales: number; quantity: number }> = {};

    filteredRecords
      .filter(r => r.productSegment === activeSegmentData.segment)
      .forEach(r => {
        if (!map[r.quarter]) {
          map[r.quarter] = { quarter: r.quarter, sales: 0, quantity: 0 };
        }
        map[r.quarter].sales += r.saleValue;
        map[r.quarter].quantity += r.invQty;
      });

    const quarterOrder = ['Q1', 'Q2', 'Q3', 'Q4'];
    return Object.values(map).sort((a, b) => {
      const idxA = quarterOrder.findIndex(q => a.quarter.startsWith(q));
      const idxB = quarterOrder.findIndex(q => b.quarter.startsWith(q));
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.quarter.localeCompare(b.quarter);
    });
  }, [filteredRecords, activeSegmentData]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Vehicle Segment Analysis</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Category-level metrics, multi-year vehicle segment performance, and SKU hierarchy</p>
      </div>

      {/* Segment Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {segmentBreakdown.map(seg => {
          const isSelected = activeSegmentData?.segment === seg.segment;
          return (
            <div
              key={seg.segment}
              onClick={() => setSelectedSeg(seg.segment)}
              className={`p-5 rounded-2xl cursor-pointer border transition-all ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-brand-500 dark:border-brand-500 shadow-card-hover ring-2 ring-brand-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  {seg.percentage}% Share • Rank #{seg.rank}
                </span>
                <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600">
                  <Layers className="w-4 h-4" />
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">{seg.segment}</h3>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <p className="text-slate-400">Sales Value</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">₹{(seg.sales / 100000).toFixed(1)}L</p>
                </div>
                <div>
                  <p className="text-slate-400">Inv Qty / SKUs</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                    {seg.quantity.toLocaleString()} / {seg.productCount} SKUs
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Segment Performance Detail */}
      {activeSegmentData && (
        <div className="space-y-6">
          {/* Segment Details Header Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                  Vehicle Segment Category
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeSegmentData.segment}</h2>
              </div>

              <button
                onClick={() => {
                  toggleSegmentFilter(activeSegmentData.segment);
                  setActiveView('overview');
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm"
              >
                <span>Cross-Filter Entire Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <p className="text-slate-400">Total Sales Value</p>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  ₹{(activeSegmentData.sales / 100000).toFixed(2)} Lakhs
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <p className="text-slate-400">Total Invoice Qty</p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {activeSegmentData.quantity.toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <p className="text-slate-400">Active SKUs</p>
                <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {activeSegmentData.productCount} products
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <p className="text-slate-400">Buying Accounts</p>
                <p className="text-base font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                  {activeSegmentData.customerCount} customers
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <p className="text-slate-400">Transactions</p>
                <p className="text-base font-bold text-amber-500 mt-0.5">
                  {activeSegmentData.transactionCount}
                </p>
              </div>
            </div>
          </div>

          {/* Segment Performance across Financial Years (Section 8 & 11) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              <span>Financial Year Performance for Segment "{activeSegmentData.segment}"</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Financial Year</th>
                    <th className="py-2.5 px-3 text-right">FY Sales</th>
                    <th className="py-2.5 px-3 text-right">YoY Sales Growth</th>
                    <th className="py-2.5 px-3 text-right">Invoice Qty</th>
                    <th className="py-2.5 px-3 text-right">Product SKUs</th>
                    <th className="py-2.5 px-3 text-right">Customer Accounts</th>
                    <th className="py-2.5 px-3 text-right">Transactions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {segmentYearlyBreakdown.map(fyRow => (
                    <tr key={fyRow.financialYear} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{fyRow.financialYear}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        ₹{(fyRow.sales / 100000).toFixed(2)} Lakhs
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {fyRow.yoyGrowthPct !== null && fyRow.yoyGrowthPct !== undefined ? (
                          <span className={fyRow.yoyGrowthPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {fyRow.yoyGrowthPct >= 0 ? '+' : ''}{fyRow.yoyGrowthPct}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Base Year</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {fyRow.quantity.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {fyRow.products}{' '}
                        {fyRow.productDiff !== 0 && (
                          <span className={fyRow.productDiff > 0 ? 'text-emerald-500 text-[10px]' : 'text-rose-500 text-[10px]'}>
                            ({fyRow.productDiff > 0 ? '+' : ''}{fyRow.productDiff})
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {fyRow.customers}{' '}
                        {fyRow.customerDiff !== 0 && (
                          <span className={fyRow.customerDiff > 0 ? 'text-emerald-500 text-[10px]' : 'text-rose-500 text-[10px]'}>
                            ({fyRow.customerDiff > 0 ? '+' : ''}{fyRow.customerDiff})
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">{fyRow.transactions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hierarchy Step 1: Products within Segment (Material Code + Description) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Products within Segment ({segmentTopProducts.length} SKUs)
            </h3>
            <p className="text-xs text-slate-400 mb-4">True Hierarchy: Vehicle Segment → Material Code + Description</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {segmentTopProducts.map(prod => (
                <div
                  key={`${prod.materialCode}-${prod.description}`}
                  onClick={() => {
                    setSelectedProduct(prod.description);
                    setActiveView('products');
                  }}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-brand-50/50 border border-slate-200 dark:border-slate-700/60 cursor-pointer transition-colors space-y-2"
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{prod.description}</p>
                  <p className="text-[10px] font-mono text-slate-400">Material Code: {prod.materialCode}</p>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <span className="text-slate-400">{prod.quantity.toLocaleString()} units</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{(prod.sales / 100000).toFixed(1)}L
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hierarchy Step 2: Customers Buying from this Segment */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              Top Customer Accounts Buying from "{activeSegmentData.segment}"
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {segmentTopCustomers.map(cust => (
                <div
                  key={cust.customer}
                  onClick={() => {
                    toggleCustomerFilter(cust.customer);
                    setActiveView('customers');
                  }}
                  className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-brand-50/50 cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{cust.customer}</p>
                    <p className="text-[10px] text-slate-400">{cust.quantity.toLocaleString()} units</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{(cust.sales / 100000).toFixed(1)}L
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Segment Monthly, Quarterly & Yearly Sales Velocity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Sales Velocity */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Monthly Velocity (April → March)
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={segmentMonthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales Value']} />
                    <Bar dataKey="sales" fill="#0c8de9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quarterly Trend */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Quarterly Trend (Q1-Q4)
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={segmentQuarterlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales Value']} />
                    <Bar dataKey="sales" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Yearly Trend */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Yearly Trend (Financial Years)
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={segmentYearlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="financialYear" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales Value']} />
                    <Bar dataKey="sales" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
