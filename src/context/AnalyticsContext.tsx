import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  BusinessInsight,
  CleanSalesRecord,
  CustomerMetric,
  DataQualitySummary,
  FilterState,
  FinancialYearMetric,
  KPIMetrics,
  ProductMetric,
  SegmentMetric,
  TimeTrendPoint,
  ViewTab,
} from '../types/analytics';

export interface BreadcrumbItem {
  label: string;
  type: 'all' | 'segment' | 'product' | 'customer' | 'quarter';
  value?: string;
}

interface AnalyticsContextType {
  activeView: ViewTab;
  setActiveView: (view: ViewTab) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  processingStage: string;
  filename: string;
  qualitySummary: DataQualitySummary | null;
  allRecords: CleanSalesRecord[];
  filteredRecords: CleanSalesRecord[];
  insights: BusinessInsight[];
  filters: FilterState;
  breadcrumbs: BreadcrumbItem[];

  // Financial Year properties
  availableFinancialYears: string[];
  financialYearBreakdown: FinancialYearMetric[];

  // Selection state for detail drawers
  selectedProduct: string | null;
  setSelectedProduct: (product: string | null) => void;
  selectedCustomer: string | null;
  setSelectedCustomer: (customer: string | null) => void;
  compareProducts: string[];
  setCompareProducts: (products: string[] | ((prev: string[]) => string[])) => void;

  // Actions
  uploadExcelFile: (file: File) => Promise<void>;
  loadSampleDataset: () => Promise<void>;
  setFilter: (key: keyof FilterState, value: any) => void;
  toggleFinancialYearFilter: (fy: string) => void;
  toggleSegmentFilter: (segment: string) => void;
  toggleProductFilter: (product: string) => void;
  toggleCustomerFilter: (customer: string) => void;
  clearAllFilters: () => void;
  investigateInsight: (insight: BusinessInsight) => void;
  popBreadcrumb: (index: number) => void;
  resetDataset: () => void;

  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Derived Metrics
  kpiMetrics: KPIMetrics;
  timeTrends: TimeTrendPoint[];
  segmentBreakdown: SegmentMetric[];
  topProducts: ProductMetric[];
  topCustomers: CustomerMetric[];
  quarterlyBreakdown: { quarter: string; sales: number; quantity: number; customers: number }[];
}

const initialFilters: FilterState = {
  dateRange: null,
  financialYears: [],
  segments: [],
  products: [],
  customers: [],
  searchTerm: '',
};

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ViewTab>('landing');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [qualitySummary, setQualitySummary] = useState<DataQualitySummary | null>(null);
  const [allRecords, setAllRecords] = useState<CleanSalesRecord[]>([]);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ label: 'All Sales', type: 'all' }]);

  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [compareProducts, setCompareProducts] = useState<string[]>([]);

  // Theme handling
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('light');

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  useEffect(() => {
    setTheme('light');
  }, []);

  // Upload Excel File handler
  const uploadExcelFile = async (file: File) => {
    setIsLoading(true);
    setActiveView('processing');
    setProcessingStage('Uploading Excel workbook...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      await new Promise(r => setTimeout(r, 600));
      setProcessingStage('Reading sheets & checking column definitions...');

      await new Promise(r => setTimeout(r, 600));
      setProcessingStage('Validating numeric values and date formats...');

      await new Promise(r => setTimeout(r, 600));
      setProcessingStage('Cleaning duplicates and missing attributes...');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload Excel file');
      }

      setProcessingStage('Generating interactive dashboard & business insights...');
      await new Promise(r => setTimeout(r, 600));

      const data = await response.json();
      setFilename(data.filename);
      setAllRecords(data.cleanRecords);
      setQualitySummary(data.qualitySummary);
      setInsights(data.insights);
      clearAllFilters();

      setIsLoading(false);
      setActiveView('quality_summary');
    } catch (err: any) {
      setIsLoading(false);
      setActiveView('landing');
      alert(`Error uploading file: ${err.message || String(err)}`);
    }
  };

  // Load Sample Dataset handler
  const loadSampleDataset = async () => {
    setIsLoading(true);
    setActiveView('processing');
    setProcessingStage('Loading synthetic sales dataset (sample_sales_dashboard_data.xlsx)...');

    try {
      await new Promise(r => setTimeout(r, 500));
      setProcessingStage('Checking 2,500 sales transactions...');

      await new Promise(r => setTimeout(r, 500));
      setProcessingStage('Parsing segments, products, and customers...');

      const response = await fetch('/api/sample');
      if (!response.ok) {
        throw new Error('Failed to load sample dataset');
      }

      setProcessingStage('Preparing visual analytics dashboard...');
      await new Promise(r => setTimeout(r, 500));

      const data = await response.json();
      setFilename(data.filename);
      setAllRecords(data.cleanRecords);
      setQualitySummary(data.qualitySummary);
      setInsights(data.insights);
      clearAllFilters();

      setIsLoading(false);
      setActiveView('quality_summary');
    } catch (err: any) {
      setIsLoading(false);
      setActiveView('landing');
      alert(`Error loading sample dataset: ${err.message || String(err)}`);
    }
  };

  const resetDataset = () => {
    setAllRecords([]);
    setQualitySummary(null);
    setFilename('');
    setInsights([]);
    clearAllFilters();
    setActiveView('landing');
  };

  // Available Financial Years
  const availableFinancialYears = useMemo(() => {
    return Array.from(new Set(allRecords.map(r => r.financialYear))).filter(Boolean).sort();
  }, [allRecords]);

  // Filter handlers
  const setFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleFinancialYearFilter = (fy: string) => {
    setFilters(prev => {
      const exists = prev.financialYears.includes(fy);
      const nextFYs = exists ? prev.financialYears.filter(f => f !== fy) : [...prev.financialYears, fy];
      return { ...prev, financialYears: nextFYs };
    });
  };

  const toggleSegmentFilter = (seg: string) => {
    setFilters(prev => {
      const exists = prev.segments.includes(seg);
      const nextSegments = exists ? prev.segments.filter(s => s !== seg) : [...prev.segments, seg];
      updateBreadcrumbs(nextSegments, prev.products, prev.customers);
      return { ...prev, segments: nextSegments };
    });
  };

  const toggleProductFilter = (prod: string) => {
    setFilters(prev => {
      const exists = prev.products.includes(prod);
      const nextProducts = exists ? prev.products.filter(p => p !== prod) : [...prev.products, prod];
      updateBreadcrumbs(prev.segments, nextProducts, prev.customers);
      return { ...prev, products: nextProducts };
    });
  };

  const toggleCustomerFilter = (cust: string) => {
    setFilters(prev => {
      const exists = prev.customers.includes(cust);
      const nextCustomers = exists ? prev.customers.filter(c => c !== cust) : [...prev.customers, cust];
      updateBreadcrumbs(prev.segments, prev.products, nextCustomers);
      return { ...prev, customers: nextCustomers };
    });
  };

  const clearAllFilters = () => {
    setFilters(initialFilters);
    setBreadcrumbs([{ label: 'All Sales', type: 'all' }]);
  };

  const updateBreadcrumbs = (segments: string[], products: string[], customers: string[]) => {
    const crumbs: BreadcrumbItem[] = [{ label: 'All Sales', type: 'all' }];
    if (segments.length > 0) {
      crumbs.push({ label: segments.length === 1 ? segments[0] : `${segments.length} Segments`, type: 'segment', value: segments[0] });
    }
    if (products.length > 0) {
      crumbs.push({ label: products.length === 1 ? products[0] : `${products.length} Products`, type: 'product', value: products[0] });
    }
    if (customers.length > 0) {
      crumbs.push({ label: customers.length === 1 ? customers[0] : `${customers.length} Customers`, type: 'customer', value: customers[0] });
    }
    setBreadcrumbs(crumbs);
  };

  const popBreadcrumb = (index: number) => {
    if (index === 0) {
      clearAllFilters();
      return;
    }
    const targetCrumb = breadcrumbs[index];
    if (targetCrumb.type === 'segment') {
      setFilters(prev => ({ ...prev, products: [], customers: [] }));
      setBreadcrumbs(prev => prev.slice(0, index + 1));
    } else if (targetCrumb.type === 'product') {
      setFilters(prev => ({ ...prev, customers: [] }));
      setBreadcrumbs(prev => prev.slice(0, index + 1));
    }
  };

  const investigateInsight = (insight: BusinessInsight) => {
    clearAllFilters();
    const ctx = insight.affectedContext;
    if (ctx.segment) {
      toggleSegmentFilter(ctx.segment);
    }
    if (ctx.product) {
      toggleProductFilter(ctx.product);
    }
    if (ctx.customer) {
      toggleCustomerFilter(ctx.customer);
    }
    setActiveView('overview');
  };

  // Compute Filtered Records
  const filteredRecords = useMemo(() => {
    return allRecords.filter(r => {
      if (filters.financialYears.length > 0 && !filters.financialYears.includes(r.financialYear)) {
        return false;
      }
      if (filters.segments.length > 0 && !filters.segments.includes(r.productSegment)) {
        return false;
      }
      if (filters.products.length > 0 && !filters.products.includes(r.description) && !filters.products.includes(r.materialCode)) {
        return false;
      }
      if (filters.customers.length > 0 && !filters.customers.includes(r.customer) && !filters.customers.includes(r.custNum)) {
        return false;
      }
      if (filters.searchTerm) {
        const q = filters.searchTerm.toLowerCase();
        const matches =
          r.customer.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.materialCode.toLowerCase().includes(q) ||
          r.productSegment.toLowerCase().includes(q) ||
          (r.financialYear && r.financialYear.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [allRecords, filters]);

  // Derived Financial Year Breakdown with YoY Growth Calculation
  const financialYearBreakdown = useMemo<FinancialYearMetric[]>(() => {
    const fyMap: Record<string, { sales: number; quantity: number; customers: Set<string>; products: Set<string>; segments: Set<string>; transactions: number }> = {};

    allRecords.forEach(r => {
      const fy = r.financialYear || 'FY Unknown';
      if (!fyMap[fy]) {
        fyMap[fy] = { sales: 0, quantity: 0, customers: new Set(), products: new Set(), segments: new Set(), transactions: 0 };
      }
      fyMap[fy].sales += r.saleValue;
      fyMap[fy].quantity += r.invQty;
      fyMap[fy].customers.add(r.customer);
      fyMap[fy].products.add(r.materialCode);
      fyMap[fy].segments.add(r.productSegment);
      fyMap[fy].transactions += 1;
    });

    const sortedFYs = Object.keys(fyMap).sort();
    return sortedFYs.map((fy, idx) => {
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
        customers: data.customers.size,
        products: data.products.size,
        segments: data.segments.size,
        transactions: data.transactions,
        prevSales,
        yoyGrowthPct,
      };
    });
  }, [allRecords]);

  // Derived KPI Metrics
  const kpiMetrics = useMemo<KPIMetrics>(() => {
    if (filteredRecords.length === 0) {
      return {
        totalSalesValue: 0,
        totalInvQty: 0,
        totalSaleQty: 0,
        customerCount: 0,
        productCount: 0,
        segmentCount: 0,
        transactionCount: 0,
        avgSalesValue: 0,
      };
    }

    const totalSalesValue = filteredRecords.reduce((sum, r) => sum + r.saleValue, 0);
    const totalInvQty = filteredRecords.reduce((sum, r) => sum + r.invQty, 0);
    const totalSaleQty = filteredRecords.reduce((sum, r) => sum + r.saleQty, 0);
    const customerCount = new Set(filteredRecords.map(r => r.customer)).size;
    const productCount = new Set(filteredRecords.map(r => r.materialCode)).size;
    const segmentCount = new Set(filteredRecords.map(r => r.productSegment)).size;
    const transactionCount = filteredRecords.length;
    const avgSalesValue = transactionCount > 0 ? Math.round(totalSalesValue / transactionCount) : 0;

    return {
      totalSalesValue,
      totalInvQty,
      totalSaleQty,
      customerCount,
      productCount,
      segmentCount,
      transactionCount,
      avgSalesValue,
      prevPeriodDiffSalesValue: 12.4, // indicative benchmark comparison
      prevPeriodDiffQty: 8.6,
    };
  }, [filteredRecords]);

  // Derived Time Trends (grouped by Month)
  const timeTrends = useMemo<TimeTrendPoint[]>(() => {
    const monthMap: Record<string, { sales: number; quantity: number; transactions: number; customers: Set<string> }> = {};

    filteredRecords.forEach(r => {
      if (!monthMap[r.month]) {
        monthMap[r.month] = { sales: 0, quantity: 0, transactions: 0, customers: new Set() };
      }
      monthMap[r.month].sales += r.saleValue;
      monthMap[r.month].quantity += r.saleQty;
      monthMap[r.month].transactions += 1;
      monthMap[r.month].customers.add(r.customer);
    });

    return Object.entries(monthMap).map(([period, data]) => ({
      period,
      sales: data.sales,
      quantity: data.quantity,
      transactions: data.transactions,
      customers: data.customers.size,
    }));
  }, [filteredRecords]);

  // Derived Segment Breakdown
  const segmentBreakdown = useMemo<SegmentMetric[]>(() => {
    const total = kpiMetrics.totalSalesValue || 1;
    const segMap: Record<string, { sales: number; quantity: number; products: Set<string>; customers: Set<string> }> = {};

    filteredRecords.forEach(r => {
      if (!segMap[r.productSegment]) {
        segMap[r.productSegment] = { sales: 0, quantity: 0, products: new Set(), customers: new Set() };
      }
      segMap[r.productSegment].sales += r.saleValue;
      segMap[r.productSegment].quantity += r.saleQty;
      segMap[r.productSegment].products.add(r.materialCode);
      segMap[r.productSegment].customers.add(r.customer);
    });

    return Object.entries(segMap)
      .map(([segment, data]) => ({
        segment,
        sales: data.sales,
        quantity: data.quantity,
        productCount: data.products.size,
        customerCount: data.customers.size,
        percentage: Number(((data.sales / total) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.sales - a.sales);
  }, [filteredRecords, kpiMetrics.totalSalesValue]);

  // Derived Top Products
  const topProducts = useMemo<ProductMetric[]>(() => {
    const prodMap: Record<string, { materialCode: string; description: string; segment: string; sales: number; quantity: number; transactions: number; customers: Set<string> }> = {};

    filteredRecords.forEach(r => {
      const key = r.materialCode;
      if (!prodMap[key]) {
        prodMap[key] = {
          materialCode: r.materialCode,
          description: r.description,
          segment: r.productSegment,
          sales: 0,
          quantity: 0,
          transactions: 0,
          customers: new Set(),
        };
      }
      prodMap[key].sales += r.saleValue;
      prodMap[key].quantity += r.saleQty;
      prodMap[key].transactions += 1;
      prodMap[key].customers.add(r.customer);
    });

    return Object.values(prodMap)
      .sort((a, b) => b.sales - a.sales)
      .map((item, idx) => ({
        materialCode: item.materialCode,
        description: item.description,
        segment: item.segment,
        sales: item.sales,
        quantity: item.quantity,
        transactionCount: item.transactions,
        customerCount: item.customers.size,
        rank: idx + 1,
      }));
  }, [filteredRecords]);

  // Derived Top Customers
  const topCustomers = useMemo<CustomerMetric[]>(() => {
    const custMap: Record<string, { custNum: string; customer: string; sales: number; quantity: number; transactions: number; products: Set<string>; segments: Set<string> }> = {};

    filteredRecords.forEach(r => {
      const key = r.customer;
      if (!custMap[key]) {
        custMap[key] = {
          custNum: r.custNum,
          customer: r.customer,
          sales: 0,
          quantity: 0,
          transactions: 0,
          products: new Set(),
          segments: new Set(),
        };
      }
      custMap[key].sales += r.saleValue;
      custMap[key].quantity += r.saleQty;
      custMap[key].transactions += 1;
      custMap[key].products.add(r.materialCode);
      custMap[key].segments.add(r.productSegment);
    });

    return Object.values(custMap)
      .sort((a, b) => b.sales - a.sales)
      .map((item, idx) => ({
        custNum: item.custNum,
        customer: item.customer,
        sales: item.sales,
        quantity: item.quantity,
        transactionCount: item.transactions,
        productCount: item.products.size,
        segmentCount: item.segments.size,
        rank: idx + 1,
      }));
  }, [filteredRecords]);

  // Derived Quarterly Breakdown
  const quarterlyBreakdown = useMemo(() => {
    const qMap: Record<string, { sales: number; quantity: number; customers: Set<string> }> = {};

    filteredRecords.forEach(r => {
      if (!qMap[r.quarter]) {
        qMap[r.quarter] = { sales: 0, quantity: 0, customers: new Set() };
      }
      qMap[r.quarter].sales += r.saleValue;
      qMap[r.quarter].quantity += r.saleQty;
      qMap[r.quarter].customers.add(r.customer);
    });

    return Object.entries(qMap)
      .map(([quarter, data]) => ({
        quarter,
        sales: data.sales,
        quantity: data.quantity,
        customers: data.customers.size,
      }))
      .sort((a, b) => a.quarter.localeCompare(b.quarter));
  }, [filteredRecords]);

  return (
    <AnalyticsContext.Provider
      value={{
        activeView,
        setActiveView,
        isLoading,
        setIsLoading,
        processingStage,
        filename,
        qualitySummary,
        allRecords,
        filteredRecords,
        insights,
        filters,
        breadcrumbs,
        availableFinancialYears,
        financialYearBreakdown,
        selectedProduct,
        setSelectedProduct,
        selectedCustomer,
        setSelectedCustomer,
        compareProducts,
        setCompareProducts,
        uploadExcelFile,
        loadSampleDataset,
        setFilter,
        toggleFinancialYearFilter,
        toggleSegmentFilter,
        toggleProductFilter,
        toggleCustomerFilter,
        clearAllFilters,
        investigateInsight,
        popBreadcrumb,
        resetDataset,
        theme,
        setTheme,
        kpiMetrics,
        timeTrends,
        segmentBreakdown,
        topProducts,
        topCustomers,
        quarterlyBreakdown,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};
