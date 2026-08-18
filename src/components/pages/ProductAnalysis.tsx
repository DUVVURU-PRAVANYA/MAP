import React, { useState, useMemo } from 'react';
import { Layers, Search, Users, ArrowRight, Filter, ChevronRight, Check, X, ShieldAlert, Tag, Boxes, Receipt, Building2 } from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';

export const ProductAnalysis: React.FC = () => {
  const {
    filteredRecords,
    filters,
    setSelectedReportingFY,
    toggleCustomerFilter,
  } = useAnalytics();

  // Selected hierarchy drill-down state
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [selectedRblSegment, setSelectedRblSegment] = useState<string>('');
  const [selectedMaterialCode, setSelectedMaterialCode] = useState<string>('');
  const [customerHierarchyLevel, setCustomerHierarchyLevel] = useState<'master' | 'group' | 'customer'>('master');
  const [materialSearchTerm, setMaterialSearchTerm] = useState<string>('');

  // 1. SECTION 1 — SEGMENT PERFORMANCE
  const segmentList = useMemo(() => {
    const map: Record<
      string,
      {
        segment: string;
        sales: number;
        quantity: number;
        customers: Set<string>;
        topCustomer: string;
        topCustomerSales: number;
        transactions: number;
      }
    > = {};

    const customerSalesPerSeg: Record<string, Record<string, number>> = {};

    filteredRecords.forEach(r => {
      const seg = r.productSegment;
      if (!seg) return;

      if (!map[seg]) {
        map[seg] = {
          segment: seg,
          sales: 0,
          quantity: 0,
          customers: new Set(),
          topCustomer: '',
          topCustomerSales: 0,
          transactions: 0,
        };
        customerSalesPerSeg[seg] = {};
      }

      map[seg].sales += r.saleValue;
      map[seg].quantity += r.saleQty;
      if (r.masterCustomerGroup || r.customer) {
        map[seg].customers.add(r.masterCustomerGroup || r.customer);
      }
      map[seg].transactions += 1;

      const custKey = r.masterCustomerGroup || r.customer;
      if (custKey) {
        customerSalesPerSeg[seg][custKey] = (customerSalesPerSeg[seg][custKey] || 0) + r.saleValue;
      }
    });

    Object.keys(map).forEach(seg => {
      const custEntries = Object.entries(customerSalesPerSeg[seg] || {}).sort((a, b) => b[1] - a[1]);
      if (custEntries.length > 0) {
        map[seg].topCustomer = custEntries[0][0];
        map[seg].topCustomerSales = custEntries[0][1];
      }
    });

    return Object.values(map).sort((a, b) => b.sales - a.sales);
  }, [filteredRecords]);

  // 2. SECTION 2 — RBL_PRODUCT SEGMENT PERFORMANCE (Filtered by selectedSegment if set)
  const rblSegmentList = useMemo(() => {
    let targetRecords = filteredRecords;
    if (selectedSegment) {
      targetRecords = targetRecords.filter(r => r.productSegment === selectedSegment);
    }

    const map: Record<
      string,
      {
        rblSegment: string;
        parentSegment: string;
        sales: number;
        quantity: number;
        customers: Set<string>;
        topCustomer: string;
        topCustomerSales: number;
        transactions: number;
      }
    > = {};

    const customerSalesPerRbl: Record<string, Record<string, number>> = {};

    targetRecords.forEach(r => {
      const rbl = r.rblProductSegment;
      if (!rbl) return;

      if (!map[rbl]) {
        map[rbl] = {
          rblSegment: rbl,
          parentSegment: r.productSegment,
          sales: 0,
          quantity: 0,
          customers: new Set(),
          topCustomer: '',
          topCustomerSales: 0,
          transactions: 0,
        };
        customerSalesPerRbl[rbl] = {};
      }

      map[rbl].sales += r.saleValue;
      map[rbl].quantity += r.saleQty;
      if (r.masterCustomerGroup || r.customer) {
        map[rbl].customers.add(r.masterCustomerGroup || r.customer);
      }
      map[rbl].transactions += 1;

      const custKey = r.masterCustomerGroup || r.customer;
      if (custKey) {
        customerSalesPerRbl[rbl][custKey] = (customerSalesPerRbl[rbl][custKey] || 0) + r.saleValue;
      }
    });

    Object.keys(map).forEach(rbl => {
      const custEntries = Object.entries(customerSalesPerRbl[rbl] || {}).sort((a, b) => b[1] - a[1]);
      if (custEntries.length > 0) {
        map[rbl].topCustomer = custEntries[0][0];
        map[rbl].topCustomerSales = custEntries[0][1];
      }
    });

    return Object.values(map).sort((a, b) => b.sales - a.sales);
  }, [filteredRecords, selectedSegment]);

  // 3. SECTION 3 — MATERIAL PERFORMANCE (Filtered by selectedSegment & selectedRblSegment)
  const materialList = useMemo(() => {
    let targetRecords = filteredRecords;
    if (selectedSegment) {
      targetRecords = targetRecords.filter(r => r.productSegment === selectedSegment);
    }
    if (selectedRblSegment) {
      targetRecords = targetRecords.filter(r => r.rblProductSegment === selectedRblSegment);
    }

    const map: Record<
      string,
      {
        materialCode: string;
        description: string;
        segment: string;
        rblSegment: string;
        sales: number;
        quantity: number;
        customers: Set<string>;
        invoices: Set<string>;
      }
    > = {};

    targetRecords.forEach(r => {
      const key = `${r.materialCode}|||${r.description}`;
      if (!map[key]) {
        map[key] = {
          materialCode: r.materialCode,
          description: r.description,
          segment: r.productSegment,
          rblSegment: r.rblProductSegment || '',
          sales: 0,
          quantity: 0,
          customers: new Set(),
          invoices: new Set(),
        };
      }
      map[key].sales += r.saleValue;
      map[key].quantity += r.saleQty;
      if (r.masterCustomerGroup || r.customer) {
        map[key].customers.add(r.masterCustomerGroup || r.customer);
      }
      if (r.invoiceNum) {
        map[key].invoices.add(r.invoiceNum);
      }
    });

    const result = Object.values(map).sort((a, b) => b.sales - a.sales);

    if (!materialSearchTerm) return result;

    const q = materialSearchTerm.toLowerCase();
    return result.filter(
      m => m.materialCode.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
    );
  }, [filteredRecords, selectedSegment, selectedRblSegment, materialSearchTerm]);

  // 4. SECTION 4 — TOP CUSTOMER CONTRIBUTORS (For selected scope)
  const topCustomerContributors = useMemo(() => {
    let targetRecords = filteredRecords;
    if (selectedSegment) {
      targetRecords = targetRecords.filter(r => r.productSegment === selectedSegment);
    }
    if (selectedRblSegment) {
      targetRecords = targetRecords.filter(r => r.rblProductSegment === selectedRblSegment);
    }
    if (selectedMaterialCode) {
      targetRecords = targetRecords.filter(r => r.materialCode === selectedMaterialCode);
    }

    const totalScopeSales = targetRecords.reduce((sum, r) => sum + r.saleValue, 0) || 1;

    const map: Record<
      string,
      {
        name: string;
        masterGroup: string;
        custGroup: string;
        customer: string;
        sales: number;
        quantity: number;
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
          name: key,
          masterGroup: r.masterCustomerGroup || r.customer,
          custGroup: r.customerGroup || r.customer,
          customer: r.customer,
          sales: 0,
          quantity: 0,
          invoices: new Set(),
        };
      }

      map[key].sales += r.saleValue;
      map[key].quantity += r.saleQty;
      if (r.invoiceNum) {
        map[key].invoices.add(r.invoiceNum);
      }
    });

    return Object.values(map)
      .map(c => ({
        name: c.name,
        masterCustomerGroup: c.masterGroup,
        customerGroup: c.custGroup,
        customer: c.customer,
        sales: c.sales,
        quantity: c.quantity,
        invoiceCount: c.invoices.size,
        contributionPct: Number(((c.sales / totalScopeSales) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.sales - a.sales);
  }, [filteredRecords, selectedSegment, selectedRblSegment, selectedMaterialCode, customerHierarchyLevel]);

  // Overall Scope Financials
  const currentScopeSales = useMemo(() => {
    let target = filteredRecords;
    if (selectedSegment) target = target.filter(r => r.productSegment === selectedSegment);
    if (selectedRblSegment) target = target.filter(r => r.rblProductSegment === selectedRblSegment);
    if (selectedMaterialCode) target = target.filter(r => r.materialCode === selectedMaterialCode);
    return target.reduce((sum, r) => sum + r.saleValue, 0);
  }, [filteredRecords, selectedSegment, selectedRblSegment, selectedMaterialCode]);

  const resetAllHierarchySelections = () => {
    setSelectedSegment('');
    setSelectedRblSegment('');
    setSelectedMaterialCode('');
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            <span>Product Performance & Customer Analysis</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Exact Product Hierarchy (<span className="font-semibold text-slate-700 dark:text-slate-300">Segment → RBL_Product segment → Material code → Desciption</span>) & Top Customer Contributors
          </p>
        </div>

        {/* Active Scope Card */}
        <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-2xl flex items-center space-x-4">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Active Scope Sales</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              ₹{currentScopeSales.toFixed(2)} Cr
            </p>
          </div>
          {(selectedSegment || selectedRblSegment || selectedMaterialCode) && (
            <button
              onClick={resetAllHierarchySelections}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-bold bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              Reset Selections
            </button>
          )}
        </div>
      </div>

      {/* Interactive Hierarchy Scope Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
        <span className="text-slate-400 font-bold uppercase text-[10px]">Product Hierarchy Path:</span>
        
        <button
          onClick={() => {
            setSelectedSegment('');
            setSelectedRblSegment('');
            setSelectedMaterialCode('');
          }}
          className={`px-3 py-1 rounded-lg transition-all ${
            !selectedSegment ? 'bg-brand-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
          }`}
        >
          All Segments ({segmentList.length})
        </button>

        {selectedSegment && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <button
              onClick={() => {
                setSelectedRblSegment('');
                setSelectedMaterialCode('');
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedSegment && !selectedRblSegment ? 'bg-brand-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
              }`}
            >
              Segment: {selectedSegment}
            </button>
          </>
        )}

        {selectedRblSegment && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <button
              onClick={() => setSelectedMaterialCode('')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedRblSegment && !selectedMaterialCode ? 'bg-brand-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
              }`}
            >
              RBL Segment: {selectedRblSegment}
            </button>
          </>
        )}

        {selectedMaterialCode && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold">
              Material: {selectedMaterialCode}
            </span>
          </>
        )}
      </div>

      {/* SECTION 1: SEGMENT PERFORMANCE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-black text-xs flex items-center justify-center">1</span>
              <span>SECTION 1: SEGMENT PERFORMANCE</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Main product classification based on source Excel <code className="font-mono text-brand-600">Segment</code> values
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">Click a Segment card to filter downstream RBL Product Segments & Materials</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {segmentList.map(seg => {
            const isSelected = selectedSegment === seg.segment;
            return (
              <div
                key={seg.segment}
                onClick={() => {
                  if (isSelected) {
                    setSelectedSegment('');
                    setSelectedRblSegment('');
                    setSelectedMaterialCode('');
                  } else {
                    setSelectedSegment(seg.segment);
                    setSelectedRblSegment('');
                    setSelectedMaterialCode('');
                  }
                }}
                className={`p-4 rounded-2xl cursor-pointer border transition-all space-y-3 relative ${
                  isSelected
                    ? 'bg-brand-50/90 border-brand-500 dark:bg-brand-950/80 dark:border-brand-600 shadow-md ring-2 ring-brand-400/50'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/70 hover:border-brand-300 dark:hover:border-brand-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Segment</span>
                  {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{seg.segment}</h3>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{seg.sales.toFixed(2)} Cr</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400">Sales Qty</p>
                    <p className="font-bold text-slate-700 dark:text-slate-300">{seg.quantity.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Customers</p>
                    <p className="font-bold text-purple-600 dark:text-purple-400">{seg.customers.size}</p>
                  </div>
                </div>

                {seg.topCustomer && (
                  <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    <span className="text-slate-400 font-semibold">Top Customer: </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{seg.topCustomer}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: RBL_PRODUCT SEGMENT PERFORMANCE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center">2</span>
              <span>SECTION 2: RBL_PRODUCT SEGMENT PERFORMANCE</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sub-classification within <code className="font-mono text-purple-600">{selectedSegment || 'All Segments'}</code> based on source Excel <code className="font-mono text-purple-600">RBL_Product segment</code>
            </p>
          </div>
          {selectedSegment && (
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-full border border-brand-200">
              Filtered for Segment: {selectedSegment}
            </span>
          )}
        </div>

        {rblSegmentList.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 font-medium">No RBL_Product segment records found for the active selection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rblSegmentList.map(rbl => {
              const isSelected = selectedRblSegment === rbl.rblSegment;
              return (
                <div
                  key={rbl.rblSegment}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedRblSegment('');
                      setSelectedMaterialCode('');
                    } else {
                      setSelectedRblSegment(rbl.rblSegment);
                      setSelectedMaterialCode('');
                    }
                  }}
                  className={`p-4 rounded-2xl cursor-pointer border transition-all space-y-3 relative ${
                    isSelected
                      ? 'bg-purple-50/90 border-purple-500 dark:bg-purple-950/80 dark:border-purple-600 shadow-md ring-2 ring-purple-400/50'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/70 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RBL Product Segment</span>
                    {isSelected && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{rbl.rblSegment}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Parent Segment: {rbl.parentSegment}</p>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{rbl.sales.toFixed(2)} Cr</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400">Sales Qty</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300">{rbl.quantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Customers</p>
                      <p className="font-bold text-purple-600 dark:text-purple-400">{rbl.customers.size}</p>
                    </div>
                  </div>

                  {rbl.topCustomer && (
                    <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      <span className="text-slate-400 font-semibold">Top Customer: </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{rbl.topCustomer}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: MATERIAL PERFORMANCE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center">3</span>
              <span>SECTION 3: MATERIAL PERFORMANCE</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Specific <code className="font-mono text-emerald-600">Material code</code> & <code className="font-mono text-emerald-600">Desciption</code> breakdown ({materialList.length} materials)
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Material Code or Desciption..."
              value={materialSearchTerm}
              onChange={e => setMaterialSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Material Code</th>
                <th className="py-3 px-4">Desciption</th>
                <th className="py-3 px-4">Segment</th>
                <th className="py-3 px-4">RBL Product Segment</th>
                <th className="py-3 px-4 text-right">Sales Qty</th>
                <th className="py-3 px-4 text-right">Sales (Cr)</th>
                <th className="py-3 px-4 text-center">Customers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {materialList.slice(0, 50).map((mat, idx) => {
                const isSelected = selectedMaterialCode === mat.materialCode;
                return (
                  <tr
                    key={`${mat.materialCode}-${mat.description}-${idx}`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedMaterialCode('');
                      } else {
                        setSelectedMaterialCode(mat.materialCode);
                      }
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/60 font-medium'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{mat.materialCode}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{mat.description || ''}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-semibold">
                        {mat.segment}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">{mat.rblSegment}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                      {mat.quantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                      ₹{mat.sales.toFixed(2)} Cr
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-purple-600 dark:text-purple-400">
                      {mat.customers.size}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: TOP CUSTOMER CONTRIBUTORS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-black text-xs flex items-center justify-center">4</span>
              <span>SECTION 4: TOP CUSTOMER CONTRIBUTORS</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customers contributing highest sales for active selection (<code className="font-mono text-amber-600">{selectedMaterialCode || selectedRblSegment || selectedSegment || 'All Products & Segments'}</code>)
            </p>
          </div>

          {/* 3-Level Customer Hierarchy Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setCustomerHierarchyLevel('master')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                customerHierarchyLevel === 'master'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Master Group
            </button>
            <button
              onClick={() => setCustomerHierarchyLevel('group')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                customerHierarchyLevel === 'group'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Customer Group
            </button>
            <button
              onClick={() => setCustomerHierarchyLevel('customer')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                customerHierarchyLevel === 'customer'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Customer Account
            </button>
          </div>
        </div>

        {/* Top Customer Contributors Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Master Customer Group</th>
                <th className="py-3 px-4">Customer Group</th>
                <th className="py-3 px-4">Customer Account</th>
                <th className="py-3 px-4 text-right">Sales Qty</th>
                <th className="py-3 px-4 text-right">Sales (Cr)</th>
                <th className="py-3 px-4 text-right">Contribution %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {topCustomerContributors.slice(0, 30).map((c, idx) => (
                <tr key={`${c.name}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium">
                  <td className="py-3 px-4 font-bold text-slate-400">#{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{c.masterCustomerGroup}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{c.customerGroup}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{c.customer}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">{c.quantity.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                    ₹{c.sales.toFixed(2)} Cr
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-block bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      {c.contributionPct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
