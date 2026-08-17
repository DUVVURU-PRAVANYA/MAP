import React, { useState, useMemo } from 'react';
import { Package, Search, Layers, IndianRupee, ShoppingBag, Users, Receipt, ArrowLeftRight, Check, X, TrendingUp, Building2, GitFork, UserCheck, Boxes } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { useAnalytics } from '../../context/AnalyticsContext';

export const ProductAnalysis: React.FC = () => {
  const {
    topProducts,
    productFamilyBreakdown,
    allRecords,
    filteredRecords,
    selectedProduct,
    setSelectedProduct,
    compareProducts,
    setCompareProducts,
    toggleCustomerFilter,
    setActiveView,
    filters,
  } = useAnalytics();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [productCustomerHierarchyLevel, setProductCustomerHierarchyLevel] = useState<'master' | 'group' | 'customer'>('master');

  // Active single product selection (default to top product if none selected)
  const currentProductDesc = selectedProduct || (topProducts[0] ? topProducts[0].description : '');

  const productMetrics = useMemo(() => {
    return (
      topProducts.find(p => p.description === currentProductDesc || p.materialCode === currentProductDesc || p.product === currentProductDesc) ||
      topProducts[0]
    );
  }, [topProducts, currentProductDesc]);

  // Product Multi-Financial Year Comparison across all years
  const productYearlyBreakdown = useMemo(() => {
    if (!productMetrics) return [];
    const map: Record<string, { sales: number; quantity: number; customers: Set<string>; transactions: number }> = {};

    allRecords
      .filter(r => r.materialCode === productMetrics.materialCode && r.description === productMetrics.description)
      .forEach(r => {
        const fy = r.financialYear || 'FY Unknown';
        if (!map[fy]) {
          map[fy] = { sales: 0, quantity: 0, customers: new Set(), transactions: 0 };
        }
        map[fy].sales += r.saleValue;
        map[fy].quantity += r.invQty;
        map[fy].customers.add(r.customer);
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
        customers: data.customers.size,
        transactions: data.transactions,
        yoyGrowthPct,
      };
    });
  }, [allRecords, productMetrics]);

  // Monthly trend for selected product
  const productMonthlyTrend = useMemo(() => {
    if (!productMetrics) return [];
    const map: Record<string, { month: string; sales: number; quantity: number; sortKey: number }> = {};

    filteredRecords
      .filter(r => r.description === productMetrics.description || r.materialCode === productMetrics.materialCode)
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
  }, [filteredRecords, productMetrics]);

  // Quarterly breakdown for selected product
  const productQuarterlyTrend = useMemo(() => {
    if (!productMetrics) return [];
    const map: Record<string, { quarter: string; sales: number; quantity: number }> = {};

    filteredRecords
      .filter(r => r.description === productMetrics.description || r.materialCode === productMetrics.materialCode)
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
  }, [filteredRecords, productMetrics]);

  // Product-Wise Plant Distribution
  const productPlantDistribution = useMemo(() => {
    if (!productMetrics) return [];
    const map: Record<string, { plantName: string; plantCode: string; sales: number; quantity: number }> = {};

    filteredRecords
      .filter(r => r.description === productMetrics.description || r.materialCode === productMetrics.materialCode)
      .forEach(r => {
        const pCode = r.plantCode || '3000';
        const pName = r.plantName || 'Chennai';
        if (!map[pCode]) {
          map[pCode] = { plantName: pName, plantCode: pCode, sales: 0, quantity: 0 };
        }
        map[pCode].sales += r.saleValue;
        map[pCode].quantity += r.invQty;
      });

    return Object.values(map).sort((a, b) => b.sales - a.sales);
  }, [filteredRecords, productMetrics]);

  // Requirement 5: Product-Wise Top Contributing Customers across 3 Hierarchy Levels (respecting Plant filters)
  const productTopCustomerContributors = useMemo(() => {
    if (!productMetrics) return [];
    
    // Filter records for the selected product (filteredRecords ALREADY respects active Plant filters!)
    const targetRecords = filteredRecords.filter(
      r => r.description === productMetrics.description || r.materialCode === productMetrics.materialCode
    );

    const totalProductSales = targetRecords.reduce((sum, r) => sum + r.saleValue, 0) || 1;

    const map: Record<string, { name: string; sales: number; quantity: number; invoices: Set<string>; plants: Set<string> }> = {};

    targetRecords.forEach(r => {
      let key = r.masterCustomerGroup || r.customer;
      if (productCustomerHierarchyLevel === 'group') {
        key = r.customerGroup || r.customer;
      } else if (productCustomerHierarchyLevel === 'customer') {
        key = r.customer;
      }

      if (!map[key]) {
        map[key] = { name: key, sales: 0, quantity: 0, invoices: new Set(), plants: new Set() };
      }
      map[key].sales += r.saleValue;
      map[key].quantity += r.invQty;
      map[key].invoices.add(r.invoiceNum);
      map[key].plants.add(r.plantName);
    });

    return Object.values(map)
      .map(c => ({
        name: c.name,
        sales: c.sales,
        quantity: c.quantity,
        invoiceCount: c.invoices.size,
        plantCount: c.plants.size,
        contributionPct: Number(((c.sales / totalProductSales) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.sales - a.sales);
  }, [filteredRecords, productMetrics, productCustomerHierarchyLevel]);

  // Comparative metrics data
  const comparisonData = useMemo(() => {
    if (compareProducts.length === 0) return [];
    return compareProducts.map(pDesc => {
      const pm = topProducts.find(p => p.description === pDesc || p.materialCode === pDesc || p.product === pDesc);
      return {
        product: pm?.product || pDesc,
        description: pm?.description || pDesc,
        materialCode: pm?.materialCode || 'N/A',
        segment: pm?.segment || 'N/A',
        sales: pm?.sales || 0,
        quantity: pm?.quantity || 0,
        customerCount: pm?.customerCount || 0,
        salesContributionPct: pm?.salesContributionPct || 0,
        rank: pm?.rank || 0,
      };
    });
  }, [topProducts, compareProducts]);

  const toggleCompareProduct = (pDesc: string) => {
    if (compareProducts.includes(pDesc)) {
      setCompareProducts(compareProducts.filter(p => p !== pDesc));
    } else {
      if (compareProducts.length >= 4) {
        alert('You can compare up to 4 products at a time.');
        return;
      }
      setCompareProducts([...compareProducts, pDesc]);
    }
  };

  const filteredProductList = topProducts.filter(
    p =>
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.segment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Product Performance & Customer Analysis</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Excel Product Family categories & Product-wise top customer contributor ranking</p>
        </div>

        <button
          onClick={() => setIsCompareOpen(!isCompareOpen)}
          className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all ${
            isCompareOpen || compareProducts.length > 0
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Compare Products ({compareProducts.length})</span>
        </button>
      </div>

      {/* Product Family Categories Grid */}
      {productFamilyBreakdown.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Excel Product Families ({productFamilyBreakdown.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {productFamilyBreakdown.map(pf => (
              <div
                key={pf.productFamily}
                className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 shadow-sm hover:border-brand-400 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">#{pf.rank} • {pf.percentage}%</span>
                  <Package className="w-3.5 h-3.5 text-brand-500" />
                </div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{pf.productFamily}</p>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{pf.sales.toFixed(2)} Cr</p>
                <p className="text-[10px] text-slate-400">{pf.skuCount} SKUs • {pf.quantity.toLocaleString()} Inv Qty</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Comparison View */}
      {(isCompareOpen || compareProducts.length > 0) && (
        <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-indigo-200 flex items-center space-x-2">
              <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
              <span>Side-by-Side Product Comparison</span>
            </h2>
            {compareProducts.length > 0 && (
              <button
                onClick={() => setCompareProducts([])}
                className="text-xs text-indigo-400 hover:text-indigo-200 underline font-semibold"
              >
                Clear Selection
              </button>
            )}
          </div>

          {comparisonData.length === 0 ? (
            <p className="text-xs text-indigo-300">Select products below to add them to comparative matrix.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {comparisonData.map(item => (
                <div key={item.materialCode + item.description} className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative space-y-2">
                  <button
                    onClick={() => toggleCompareProduct(item.description)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-xs font-bold text-white pr-6 truncate">{item.description}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{item.materialCode}</p>
                  <span className="inline-block text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-full font-mono">
                    {item.segment}
                  </span>

                  <div className="space-y-1 pt-2 border-t border-slate-800 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Sales Value:</span>
                      <span className="font-bold text-emerald-400">₹{item.sales.toFixed(2)} Cr</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Invoice Qty:</span>
                      <span className="font-bold text-white">{item.quantity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Contribution:</span>
                      <span className="font-bold text-brand-400">{item.salesContributionPct}%</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Rank:</span>
                      <span className="font-bold text-amber-400">#{item.rank}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Left Selector List & Right Product Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-card">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Material Code or Description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {filteredProductList.map(prod => {
              const isSelected = prod.description === productMetrics?.description && prod.materialCode === productMetrics?.materialCode;
              const isCompared = compareProducts.includes(prod.description);

              return (
                <div
                  key={`${prod.materialCode}-${prod.description}`}
                  onClick={() => setSelectedProduct(prod.description)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-brand-50/80 border-brand-500 dark:bg-brand-950/60 dark:border-brand-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{prod.description}</p>
                    <p className="text-[10px] text-slate-400 truncate">Code: {prod.materialCode} • {prod.segment}</p>
                    <p className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">{prod.salesContributionPct}% Share • #{prod.rank}</p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      ₹{prod.sales.toFixed(2)} Cr
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleCompareProduct(prod.description);
                      }}
                      className={`p-1 rounded-md text-[10px] border transition-colors ${
                        isCompared
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                      }`}
                      title="Compare SKU"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Product Performance Detail */}
        {productMetrics ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Product Overview Header Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                    {productMetrics.segment}
                  </span>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mt-2">{productMetrics.description}</h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">Material Code: {productMetrics.materialCode}</p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded-full">
                    Rank #{productMetrics.rank} ({productMetrics.salesContributionPct}% Share)
                  </span>
                </div>
              </div>

              {/* 4 Product KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                  <p className="text-[11px] text-slate-400 font-medium">Sales Revenue</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    ₹{productMetrics.sales.toFixed(2)} Cr
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                  <p className="text-[11px] text-slate-400 font-medium">Invoice Quantity</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {productMetrics.quantity.toLocaleString()} units
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                  <p className="text-[11px] text-slate-400 font-medium">Buying Accounts</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                    {productMetrics.customerCount} customers
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                  <p className="text-[11px] text-slate-400 font-medium">Transactions</p>
                  <p className="text-lg font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                    {productMetrics.transactionCount} orders
                  </p>
                </div>
              </div>
            </div>

            {/* Requirement 5: Product-Wise Customer Analysis (3-Level Customer Hierarchy) */}
            <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/40 rounded-2xl p-6 shadow-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span>Top Contributing Customers for "{productMetrics.description}"</span>
                  </h3>
                  <p className="text-xs text-slate-500">Ranked by SUM(Value In Crs) descending • Respects active Plant filters</p>
                </div>

                {/* 3-Level Customer Hierarchy Selector */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setProductCustomerHierarchyLevel('master')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      productCustomerHierarchyLevel === 'master'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Master Group
                  </button>
                  <button
                    onClick={() => setProductCustomerHierarchyLevel('group')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      productCustomerHierarchyLevel === 'group'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Customer Group
                  </button>
                  <button
                    onClick={() => setProductCustomerHierarchyLevel('customer')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      productCustomerHierarchyLevel === 'customer'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Customer Account
                  </button>
                </div>
              </div>

              {/* Contributor Customer Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">
                        {productCustomerHierarchyLevel === 'master'
                          ? 'Master Customer Group'
                          : productCustomerHierarchyLevel === 'group'
                          ? 'Customer Group'
                          : 'Customer Account'}
                      </th>
                      <th className="py-2.5 px-3 text-right">Contribution Sales (Cr)</th>
                      <th className="py-2.5 px-3 text-right">Product Share %</th>
                      <th className="py-2.5 px-3 text-right">Qty Purchased</th>
                      <th className="py-2.5 px-3 text-center">Invoices</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {productTopCustomerContributors.map((c, idx) => (
                      <tr key={c.name} className="hover:bg-purple-50/40 dark:hover:bg-purple-950/30">
                        <td className="py-2.5 px-3 font-bold text-slate-400">#{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {productCustomerHierarchyLevel === 'master' ? (
                            <Building2 className="w-3.5 h-3.5 text-purple-600" />
                          ) : productCustomerHierarchyLevel === 'group' ? (
                            <GitFork className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          <span>{c.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                          ₹{c.sales.toFixed(2)} Cr
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-purple-600 dark:text-purple-400">
                          {c.contributionPct}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {c.quantity.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium">{c.invoiceCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Plant Breakdown for Selected Product */}
            {productPlantDistribution.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-6 shadow-card space-y-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Boxes className="w-4 h-4 text-amber-500" />
                  <span>Plant Location Distribution for "{productMetrics.description}"</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {productPlantDistribution.map(plant => (
                    <div key={plant.plantCode} className="p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50 space-y-1">
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-300">{plant.plantName} ({plant.plantCode})</span>
                      <p className="text-sm font-black text-slate-900 dark:text-white">₹{plant.sales.toFixed(2)} Cr</p>
                      <p className="text-[10px] text-slate-500">{plant.quantity.toLocaleString()} Inv Qty</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Performance across Financial Years */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-brand-500" />
                <span>Financial Year Breakdown for "{productMetrics.description}"</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Financial Year</th>
                      <th className="py-2.5 px-3 text-right">FY Sales (Cr)</th>
                      <th className="py-2.5 px-3 text-right">YoY Growth</th>
                      <th className="py-2.5 px-3 text-right">FY Invoice Qty</th>
                      <th className="py-2.5 px-3 text-right">Customer Count</th>
                      <th className="py-2.5 px-3 text-right">Transactions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {productYearlyBreakdown.map(fyRow => (
                      <tr key={fyRow.financialYear} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium">
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{fyRow.financialYear}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                          ₹{fyRow.sales.toFixed(2)} Cr
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
                        <td className="py-2.5 px-3 text-right font-medium">{fyRow.customers}</td>
                        <td className="py-2.5 px-3 text-right font-medium">{fyRow.transactions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Product Monthly Sales Velocity */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Monthly Velocity Trend (Chronological April → March)</h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={productMonthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip formatter={(val: any) => [`₹${Number(val).toFixed(2)} Cr`, 'Sales Value']} />
                    <Area type="monotone" dataKey="sales" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Product Quarterly Breakdown */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Quarterly Performance (Q1-Q4)</h3>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productQuarterlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip formatter={(val: any) => [`₹${Number(val).toFixed(2)} Cr`, 'Sales Value']} />
                    <Bar dataKey="sales" fill="#0c8de9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

