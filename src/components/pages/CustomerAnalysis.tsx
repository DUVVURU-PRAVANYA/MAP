import React, { useState, useMemo } from 'react';
import { Users, Search, ShoppingBag, Package, Layers, Calendar, ChevronRight, X, ArrowUpRight, Building2, GitFork, UserCheck } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useAnalytics } from '../../context/AnalyticsContext';

export const CustomerAnalysis: React.FC = () => {
  const { topCustomers, allRecords, filteredRecords, selectedCustomer, setSelectedCustomer, toggleCustomerFilter, kpiMetrics } = useAnalytics();
  const [searchTerm, setSearchTerm] = useState('');
  const [hierarchyLevel, setHierarchyLevel] = useState<'master' | 'group' | 'customer'>('master');
  const [selectedMasterGroup, setSelectedMasterGroup] = useState<string | null>(null);
  const [selectedCustomerGroup, setSelectedCustomerGroup] = useState<string | null>(null);

  const activeCustomer = useMemo(() => {
    if (!selectedCustomer) return null;
    return topCustomers.find(c => c.customer === selectedCustomer) || null;
  }, [topCustomers, selectedCustomer]);

  // Derived 3-Level Customer Hierarchy Metrics
  const customerHierarchyMetrics = useMemo(() => {
    const totalSales = kpiMetrics.totalSalesValue || 1;

    let recordsToGroup = filteredRecords;
    if (hierarchyLevel === 'group' && selectedMasterGroup) {
      recordsToGroup = filteredRecords.filter(r => r.masterCustomerGroup === selectedMasterGroup);
    } else if (hierarchyLevel === 'customer' && selectedCustomerGroup) {
      recordsToGroup = filteredRecords.filter(r => r.customerGroup === selectedCustomerGroup);
    }

    const groupMap: Record<
      string,
      {
        key: string;
        name: string;
        masterGroup: string;
        custGroup: string;
        sales: number;
        quantity: number;
        products: Set<string>;
        plants: Set<string>;
        invoices: Set<string>;
        transactions: number;
      }
    > = {};

    recordsToGroup.forEach(r => {
      let key = r.masterCustomerGroup || r.customer;
      if (hierarchyLevel === 'group') {
        key = r.customerGroup || r.customer;
      } else if (hierarchyLevel === 'customer') {
        key = r.customer;
      }

      if (!groupMap[key]) {
        groupMap[key] = {
          key,
          name: key,
          masterGroup: r.masterCustomerGroup,
          custGroup: r.customerGroup,
          sales: 0,
          quantity: 0,
          products: new Set(),
          plants: new Set(),
          invoices: new Set(),
          transactions: 0,
        };
      }
      groupMap[key].sales += r.saleValue;
      groupMap[key].quantity += r.saleQty;
      groupMap[key].products.add(`${r.materialCode}|||${r.description}`);
      groupMap[key].plants.add(r.plantCode);
      groupMap[key].invoices.add(r.invoiceNum);
      groupMap[key].transactions += 1;
    });

    return Object.values(groupMap)
      .map(item => ({
        key: item.key,
        name: item.name,
        level: hierarchyLevel,
        masterCustomerGroup: item.masterGroup,
        customerGroup: item.custGroup,
        sales: item.sales,
        quantity: item.quantity,
        productCount: item.products.size,
        plantCount: item.plants.size,
        invoiceCount: item.invoices.size,
        transactionCount: item.transactions,
        percentage: Number(((item.sales / totalSales) * 100).toFixed(1)),
        rank: 0,
      }))
      .sort((a, b) => b.sales - a.sales)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [filteredRecords, hierarchyLevel, selectedMasterGroup, selectedCustomerGroup, kpiMetrics.totalSalesValue]);

  // Customer Performance across Financial Years
  const customerYearlyBreakdown = useMemo(() => {
    if (!activeCustomer) return [];
    const map: Record<string, { sales: number; quantity: number; products: Set<string>; transactions: number }> = {};

    allRecords
      .filter(r => r.customer === activeCustomer.customer)
      .forEach(r => {
        const fy = r.financialYear || 'FY Unknown';
        if (!map[fy]) {
          map[fy] = { sales: 0, quantity: 0, products: new Set(), transactions: 0 };
        }
        map[fy].sales += r.saleValue;
        map[fy].quantity += r.saleQty;
        map[fy].products.add(`${r.materialCode}|||${r.description}`);
        map[fy].transactions += 1;
      });

    const sortedFYs = Object.keys(map).sort();
    return sortedFYs.map((fy, idx) => {
      const data = map[fy];
      const prevSales = idx > 0 ? map[sortedFYs[idx - 1]].sales : undefined;
      let yoyGrowthPct: number | null = null;
      if (prevSales !== undefined && prevSales > 0) {
        yoyGrowthPct = Number((((data.sales - prevSales) / prevSales) * 100).toFixed(1));
      }
      return {
        financialYear: fy,
        sales: data.sales,
        quantity: data.quantity,
        products: data.products.size,
        transactions: data.transactions,
        yoyGrowthPct,
      };
    });
  }, [allRecords, activeCustomer]);

  // Monthly trend for selected customer
  const customerMonthlyTrend = useMemo(() => {
    if (!activeCustomer) return [];
    const map: Record<string, { month: string; sales: number; quantity: number; sortKey: number }> = {};

    filteredRecords
      .filter(r => r.customer === activeCustomer.customer)
      .forEach(r => {
        if (!map[r.month]) {
          let sortKey = r.monthSortKey;
          if (sortKey === undefined) {
            const dateObj = new Date(r.grnDate);
            sortKey = isNaN(dateObj.getTime()) ? 0 : dateObj.getFullYear() * 12 + dateObj.getMonth();
          }
          map[r.month] = { month: r.month, sales: 0, quantity: 0, sortKey };
        }
        map[r.month].sales += r.saleValue;
        map[r.month].quantity += r.saleQty;
      });

    return Object.values(map).sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredRecords, activeCustomer]);

  // Products purchased by selected customer
  const customerProductsPurchased = useMemo(() => {
    if (!activeCustomer) return [];
    const map: Record<string, { description: string; segment: string; sales: number; quantity: number }> = {};

    filteredRecords
      .filter(r => r.customer === activeCustomer.customer)
      .forEach(r => {
        const key = `${r.materialCode}|||${r.description}`;
        if (!map[key]) {
          map[key] = { description: r.description, segment: r.productSegment, sales: 0, quantity: 0 };
        }
        map[key].sales += r.saleValue;
        map[key].quantity += r.saleQty;
      });

    return Object.values(map).sort((a, b) => b.sales - a.sales);
  }, [filteredRecords, activeCustomer]);

  const filteredHierarchyList = customerHierarchyMetrics.filter(
    item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.masterCustomerGroup && item.masterCustomerGroup.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12 font-sans relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Customer Hierarchy & Key Account Analysis</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            3-Level Analysis: Master Customer Group &rarr; Customer Group &rarr; Customer
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customer account or group..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Hierarchy Level Selector Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Customer Analysis Level</h3>
          </div>
          {(selectedMasterGroup || selectedCustomerGroup) && (
            <button
              onClick={() => {
                setSelectedMasterGroup(null);
                setSelectedCustomerGroup(null);
                setHierarchyLevel('master');
              }}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              Reset Hierarchy Breadcrumb
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <button
            onClick={() => {
              setHierarchyLevel('master');
              setSelectedMasterGroup(null);
              setSelectedCustomerGroup(null);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              hierarchyLevel === 'master'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Level 1: Master Customer Group ({kpiMetrics.masterCustomerGroupCount})</span>
          </button>

          <button
            onClick={() => setHierarchyLevel('group')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              hierarchyLevel === 'group'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <GitFork className="w-4 h-4" />
            <span>Level 2: Customer Group ({kpiMetrics.customerGroupCount})</span>
          </button>

          <button
            onClick={() => setHierarchyLevel('customer')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              hierarchyLevel === 'customer'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Level 3: Individual Customer ({kpiMetrics.individualCustomerCount})</span>
          </button>
        </div>

        {/* Active Hierarchy Drill-Down Path */}
        {(selectedMasterGroup || selectedCustomerGroup) && (
          <div className="flex items-center space-x-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 p-2.5 rounded-xl border border-purple-200 dark:border-purple-800">
            <span>Filter Hierarchy:</span>
            {selectedMasterGroup && (
              <span className="font-bold bg-white dark:bg-purple-900 px-2 py-0.5 rounded-md">
                Master: {selectedMasterGroup}
              </span>
            )}
            {selectedCustomerGroup && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="font-bold bg-white dark:bg-purple-900 px-2 py-0.5 rounded-md">
                  Group: {selectedCustomerGroup}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Customer Hierarchy Ranking Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-card">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {hierarchyLevel === 'master'
              ? 'Master Customer Group Rankings'
              : hierarchyLevel === 'group'
              ? 'Customer Group Rankings'
              : 'Individual Customer Account Rankings'}{' '}
            ({filteredHierarchyList.length})
          </h3>
          <span className="text-xs text-slate-400">Click any row to drill down into sub-accounts or view details</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">
                  {hierarchyLevel === 'master'
                    ? 'Master Customer Group'
                    : hierarchyLevel === 'group'
                    ? 'Customer Group'
                    : 'Customer Account'}
                </th>
                <th className="py-3 px-4 text-right">Sales Revenue (Cr)</th>
                <th className="py-3 px-4 text-right">Contribution %</th>
                <th className="py-3 px-4 text-right">Inv Qty</th>
                <th className="py-3 px-4 text-center">Plants Served</th>
                <th className="py-3 px-4 text-center">SKUs Bought</th>
                <th className="py-3 px-4 text-center">Invoices</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredHierarchyList.map((item, idx) => (
                <tr
                  key={item.key}
                  onClick={() => {
                    if (hierarchyLevel === 'master') {
                      setSelectedMasterGroup(item.name);
                      setHierarchyLevel('group');
                    } else if (hierarchyLevel === 'group') {
                      setSelectedCustomerGroup(item.name);
                      setHierarchyLevel('customer');
                    } else {
                      setSelectedCustomer(item.name);
                    }
                  }}
                  className="hover:bg-purple-50/50 dark:hover:bg-purple-950/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-slate-400">#{idx + 1}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {hierarchyLevel === 'master' ? (
                      <Building2 className="w-4 h-4 text-purple-600" />
                    ) : hierarchyLevel === 'group' ? (
                      <GitFork className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>{item.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                    ₹{item.sales.toFixed(2)} Cr
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-purple-600 dark:text-purple-400">
                    {item.percentage}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {item.quantity.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium">{item.plantCount}</td>
                  <td className="py-3.5 px-4 text-center font-medium">{item.productCount}</td>
                  <td className="py-3.5 px-4 text-center font-medium">{item.invoiceCount}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (hierarchyLevel === 'master') {
                          setSelectedMasterGroup(item.name);
                          setHierarchyLevel('group');
                        } else if (hierarchyLevel === 'group') {
                          setSelectedCustomerGroup(item.name);
                          setHierarchyLevel('customer');
                        } else {
                          setSelectedCustomer(item.name);
                        }
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300 rounded-md border border-purple-200 dark:border-purple-800"
                    >
                      {hierarchyLevel === 'customer' ? 'View Details' : 'Drill Down &rarr;'}
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
          <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-2xl h-full overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{activeCustomer.customer}</h2>
                  <p className="text-xs text-slate-500 font-mono">Account Code: {activeCustomer.custNum}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block">Total Sales</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  ₹{activeCustomer.sales.toFixed(2)} Cr
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block">Invoice Quantity</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {activeCustomer.quantity.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block">SKUs Purchased</span>
                <span className="text-base font-black text-purple-600 dark:text-purple-400">
                  {activeCustomer.productCount}
                </span>
              </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Monthly Purchase Velocity (Cr)</h4>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={customerMonthlyTrend}>
                    <defs>
                      <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: any) => [`₹${Number(value).toFixed(2)} Cr`, 'Sales']} />
                    <Area type="monotone" dataKey="sales" stroke="#8b5cf6" fillOpacity={1} fill="url(#custGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Purchased Products Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Products Purchased by {activeCustomer.customer}</h4>
              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold">
                    <tr>
                      <th className="py-2 px-3">Product Description</th>
                      <th className="py-2 px-3">Segment</th>
                      <th className="py-2 px-3 text-right">Sales (Cr)</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {customerProductsPurchased.map(p => (
                      <tr key={p.description} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{p.description}</td>
                        <td className="py-2 px-3 text-slate-500">{p.segment}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">₹{p.sales.toFixed(2)} Cr</td>
                        <td className="py-2 px-3 text-right font-semibold text-emerald-600">{p.quantity.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={() => {
                toggleCustomerFilter(activeCustomer.customer);
                setSelectedCustomer(null);
              }}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Filter Dashboard by {activeCustomer.customer}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
