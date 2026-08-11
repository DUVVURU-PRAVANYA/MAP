import React, { useState, useMemo } from 'react';
import { Users, Search, ShoppingBag, Package, Layers, Calendar, ChevronRight, X, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useAnalytics } from '../../context/AnalyticsContext';

export const CustomerAnalysis: React.FC = () => {
  const { topCustomers, filteredRecords, selectedCustomer, setSelectedCustomer, toggleCustomerFilter } = useAnalytics();
  const [searchTerm, setSearchTerm] = useState('');

  const activeCustomer = useMemo(() => {
    if (!selectedCustomer) return null;
    return topCustomers.find(c => c.customer === selectedCustomer) || null;
  }, [topCustomers, selectedCustomer]);

  // Monthly trend for selected customer
  const customerMonthlyTrend = useMemo(() => {
    if (!activeCustomer) return [];
    const map: Record<string, { month: string; sales: number; quantity: number }> = {};

    filteredRecords
      .filter(r => r.customer === activeCustomer.customer)
      .forEach(r => {
        if (!map[r.month]) {
          map[r.month] = { month: r.month, sales: 0, quantity: 0 };
        }
        map[r.month].sales += r.saleValue;
        map[r.month].quantity += r.saleQty;
      });

    return Object.values(map);
  }, [filteredRecords, activeCustomer]);

  // Products purchased by selected customer
  const customerProductsPurchased = useMemo(() => {
    if (!activeCustomer) return [];
    const map: Record<string, { description: string; segment: string; sales: number; quantity: number }> = {};

    filteredRecords
      .filter(r => r.customer === activeCustomer.customer)
      .forEach(r => {
        if (!map[r.materialCode]) {
          map[r.materialCode] = { description: r.description, segment: r.productSegment, sales: 0, quantity: 0 };
        }
        map[r.materialCode].sales += r.saleValue;
        map[r.materialCode].quantity += r.saleQty;
      });

    return Object.values(map).sort((a, b) => b.sales - a.sales);
  }, [filteredRecords, activeCustomer]);

  const filteredCustomerList = topCustomers.filter(
    c =>
      c.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.custNum.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 font-sans relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Customer Key Account Analysis</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Retail account performance, order volume, and product preferences</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customer account..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Customer Ranking Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-card">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Customer Account Rankings ({filteredCustomerList.length})</h3>
          <span className="text-xs text-slate-400">Click any row to inspect account details</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Customer Account</th>
                <th className="py-3 px-4">Account Code</th>
                <th className="py-3 px-4 text-right">Sales Revenue</th>
                <th className="py-3 px-4 text-right">Qty Sold</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-center">SKUs Bought</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomerList.map((cust, idx) => (
                <tr
                  key={cust.customer}
                  onClick={() => setSelectedCustomer(cust.customer)}
                  className="hover:bg-brand-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-slate-400">#{idx + 1}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{cust.customer}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{cust.custNum}</td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                    ₹{(cust.sales / 100000).toFixed(2)} Lakhs
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {cust.quantity.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium">{cust.transactionCount}</td>
                  <td className="py-3.5 px-4 text-center font-medium">{cust.productCount}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedCustomer(cust.customer);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 rounded-md border border-brand-200 dark:border-brand-800"
                    >
                      View Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer */}
      {activeCustomer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-mono">
                  {activeCustomer.custNum}
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">{activeCustomer.customer}</h2>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <p className="text-[11px] text-slate-400">Total Purchase Value</p>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                  ₹{(activeCustomer.sales / 100000).toFixed(2)} Lakhs
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <p className="text-[11px] text-slate-400">Quantity Purchased</p>
                <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {activeCustomer.quantity.toLocaleString()} units
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <p className="text-[11px] text-slate-400">Total Transactions</p>
                <p className="text-lg font-extrabold text-brand-600 dark:text-brand-400 mt-0.5">
                  {activeCustomer.transactionCount} orders
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <p className="text-[11px] text-slate-400">Distinct SKUs</p>
                <p className="text-lg font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">
                  {activeCustomer.productCount} products
                </p>
              </div>
            </div>

            {/* Customer Purchase Trend */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Purchase Trend Over Time</h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={customerMonthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Purchase Value']} />
                    <Area type="monotone" dataKey="sales" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Products Purchased Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Products Purchased Breakdown</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {customerProductsPurchased.map(prod => (
                  <div key={prod.description} className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{prod.description}</p>
                      <p className="text-[10px] text-slate-400">{prod.segment} • {prod.quantity.toLocaleString()} units</p>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{(prod.sales / 100000).toFixed(1)}L</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  toggleCustomerFilter(activeCustomer.customer);
                  setSelectedCustomer(null);
                }}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm transition-all"
              >
                Cross-Filter Entire Dashboard for {activeCustomer.customer}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
