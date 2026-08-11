import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Download, ArrowUpDown, FileSpreadsheet } from 'lucide-react';
import { CleanSalesRecord } from '../../types/analytics';

interface DataTableProps {
  records: CleanSalesRecord[];
  title?: string;
}

export const DataTable: React.FC<DataTableProps> = ({ records, title = 'Sales Dataset' }) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof CleanSalesRecord>('billDate');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const handleSort = (field: keyof CleanSalesRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.customer.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.materialCode.toLowerCase().includes(q) ||
        r.productSegment.toLowerCase().includes(q) ||
        r.custNum.toLowerCase().includes(q)
      );
    });
  }, [records, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let valA = a[sortField] ?? '';
      let valB = b[sortField] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortAsc]);

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  const exportCSV = async () => {
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'csv', records: filtered }),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'filtered_sales_data.csv';
      a.click();
    } catch (err) {
      alert('Failed to export CSV');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-card font-sans">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="w-5 h-5 text-brand-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {title} ({filtered.length.toLocaleString()} rows)
          </h3>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search table..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            onClick={exportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] sticky top-0">
            <tr>
              <th onClick={() => handleSort('financialYear')} className="py-3 px-4 cursor-pointer">
                <div className="flex items-center space-x-1">
                  <span>Financial Year</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('billDate')} className="py-3 px-4 cursor-pointer">
                <div className="flex items-center space-x-1">
                  <span>Bill Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('customer')} className="py-3 px-4 cursor-pointer">
                <div className="flex items-center space-x-1">
                  <span>Customer</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('productSegment')} className="py-3 px-4 cursor-pointer">
                <div className="flex items-center space-x-1">
                  <span>Segment</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('description')} className="py-3 px-4 cursor-pointer">
                <div className="flex items-center space-x-1">
                  <span>Material Description</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('invQty')} className="py-3 px-4 text-right cursor-pointer">
                <div className="flex items-center justify-end space-x-1">
                  <span>Inv Qty</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('saleValue')} className="py-3 px-4 text-right cursor-pointer">
                <div className="flex items-center justify-end space-x-1">
                  <span>Sale Value (₹)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginated.map((r, i) => (
              <tr key={r.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                <td className="py-3 px-4">
                  <span className="text-[10px] bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 px-2 py-0.5 rounded-full font-bold">
                    {r.financialYear}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono font-medium text-slate-500">{r.billDate}</td>
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{r.customer}</td>
                <td className="py-3 px-4">
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-semibold">
                    {r.productSegment}
                  </span>
                </td>
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{r.description}</td>
                <td className="py-3 px-4 text-right font-semibold">{r.invQty}</td>
                <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                  ₹{r.saleValue.toLocaleString('en-IN')}
                </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Showing {Math.min((currentPage - 1) * pageSize + 1, sorted.length)} to{' '}
          {Math.min(currentPage * pageSize, sorted.length)} of {sorted.length} records
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-900 dark:text-white">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
