import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Layers, Users, Package } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { useAnalytics } from '../../context/AnalyticsContext';

export const TimeAnalysis: React.FC = () => {
  const { timeTrends, quarterlyBreakdown } = useAnalytics();
  const [granularity, setGranularity] = useState<'monthly' | 'quarterly'>('monthly');

  // Compute MoM or QoQ % changes sorted in April-March Financial Year order
  const periodDataWithChange = useMemo(() => {
    const rawList = granularity === 'monthly' ? timeTrends : quarterlyBreakdown;
    return rawList.map((item, idx) => {
      let salesChangePct = 0;
      let qtyChangePct = 0;

      if (idx > 0) {
        const prevSales = rawList[idx - 1].sales;
        const prevQty = rawList[idx - 1].quantity;
        if (prevSales > 0) {
          salesChangePct = Math.round(((item.sales - prevSales) / prevSales) * 100);
        }
        if (prevQty > 0) {
          qtyChangePct = Math.round(((item.quantity - prevQty) / prevQty) * 100);
        }
      }

      return {
        ...item,
        salesChangePct,
        qtyChangePct,
      };
    });
  }, [timeTrends, quarterlyBreakdown, granularity]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Time & Seasonality Analysis</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Month-over-Month (MoM) & Quarter-over-Quarter (QoQ) growth metrics</p>
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
        </div>
      </div>

      {/* Main Trend Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Revenue Trend & Sales Velocity ({granularity === 'monthly' ? 'Monthly' : 'Quarterly'})
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={periodDataWithChange}>
              <defs>
                <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
              <XAxis dataKey={granularity === 'monthly' ? 'period' : 'quarter'} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales Value']} />
              <Area type="monotone" dataKey="sales" stroke="#10b981" fill="url(#timeGrad)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Period-by-Period Comparison Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-card">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {granularity === 'monthly' ? 'Monthly (MoM)' : 'Quarterly (QoQ)'} Detailed Performance Table
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 text-right">Sales Value</th>
                <th className="py-3 px-4 text-right">{granularity === 'monthly' ? 'MoM Sales Change' : 'QoQ Sales Change'}</th>
                <th className="py-3 px-4 text-right">Invoice Quantity</th>
                <th className="py-3 px-4 text-right">{granularity === 'monthly' ? 'MoM Qty Change' : 'QoQ Qty Change'}</th>
                <th className="py-3 px-4 text-center">Active Accounts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {periodDataWithChange.map((row: any, idx: number) => {
                const label = granularity === 'monthly' ? row.period : row.quarter;
                const isPositive = row.salesChangePct >= 0;

                return (
                  <tr key={label} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{label}</td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                      ₹{(row.sales / 100000).toFixed(2)} Lakhs
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
                    <td className="py-3.5 px-4 text-right font-semibold">{row.quantity.toLocaleString()} units</td>
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
