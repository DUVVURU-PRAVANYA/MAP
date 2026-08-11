import React, { useState, useMemo } from 'react';
import { Layers, Package, Users, IndianRupee, ShoppingBag, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useAnalytics } from '../../context/AnalyticsContext';

export const SegmentAnalysis: React.FC = () => {
  const { segmentBreakdown, filteredRecords, toggleSegmentFilter, setSelectedProduct, setActiveView } = useAnalytics();
  const [selectedSeg, setSelectedSeg] = useState<string>(segmentBreakdown[0]?.segment || '');

  const activeSegmentData = useMemo(() => {
    return segmentBreakdown.find(s => s.segment === selectedSeg) || segmentBreakdown[0];
  }, [segmentBreakdown, selectedSeg]);

  // Top Products in selected segment
  const segmentTopProducts = useMemo(() => {
    if (!activeSegmentData) return [];
    const map: Record<string, { description: string; sales: number; quantity: number }> = {};

    filteredRecords
      .filter(r => r.productSegment === activeSegmentData.segment)
      .forEach(r => {
        if (!map[r.materialCode]) {
          map[r.materialCode] = { description: r.description, sales: 0, quantity: 0 };
        }
        map[r.materialCode].sales += r.saleValue;
        map[r.materialCode].quantity += r.saleQty;
      });

    return Object.values(map).sort((a, b) => b.sales - a.sales).slice(0, 6);
  }, [filteredRecords, activeSegmentData]);

  // Monthly trend for selected segment
  const segmentMonthlyTrend = useMemo(() => {
    if (!activeSegmentData) return [];
    const map: Record<string, { month: string; sales: number; quantity: number }> = {};

    filteredRecords
      .filter(r => r.productSegment === activeSegmentData.segment)
      .forEach(r => {
        if (!map[r.month]) {
          map[r.month] = { month: r.month, sales: 0, quantity: 0 };
        }
        map[r.month].sales += r.saleValue;
        map[r.month].quantity += r.saleQty;
      });

    return Object.values(map);
  }, [filteredRecords, activeSegmentData]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Product Segment Analysis</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Category-level sales contribution, monthly trend, and product portfolio</p>
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
                  {seg.percentage}% Share
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
                  <p className="text-slate-400">SKUs / Accounts</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                    {seg.productCount} SKUs / {seg.customerCount} Accounts
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
          {/* Segment Monthly Trend Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Monthly Sales Velocity for "{activeSegmentData.segment}"
                </h3>
                <p className="text-xs text-slate-500">Revenue trend across bill dates</p>
              </div>

              <button
                onClick={() => {
                  toggleSegmentFilter(activeSegmentData.segment);
                  setActiveView('overview');
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm"
              >
                <span>Drill Down Entire Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-64 w-full">
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

          {/* Top Products in Segment */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Top Performing SKUs in "{activeSegmentData.segment}"
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {segmentTopProducts.map(prod => (
                <div
                  key={prod.description}
                  onClick={() => {
                    setSelectedProduct(prod.description);
                    setActiveView('products');
                  }}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-brand-50/50 border border-slate-200 dark:border-slate-700/60 cursor-pointer transition-colors"
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{prod.description}</p>
                  <div className="flex justify-between items-center mt-3 text-xs">
                    <span className="text-slate-400">{prod.quantity.toLocaleString()} units</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{(prod.sales / 100000).toFixed(1)}L
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
