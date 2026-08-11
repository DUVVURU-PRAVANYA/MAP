export interface RawSalesRecord {
  'Cust Num.'?: string | number;
  'Customer'?: string;
  'Material code'?: string | number;
  'Description'?: string;
  'Bill Date'?: string | number | Date;
  'Inv. Qty'?: string | number;
  'Sale value (Doc rate)'?: string | number;
  'Sale qty in nos'?: string | number;
  'Product Segment'?: string;
  [key: string]: any;
}

export interface CleanSalesRecord {
  id: string;
  custNum: string;
  customer: string;
  materialCode: string;
  description: string;
  billDate: string; // ISO format YYYY-MM-DD
  month: string; // e.g. "Apr 2025" or "April"
  quarter: string; // e.g. "Q1 FY26" or "Q1"
  year: number; // e.g. 2025
  financialYear: string; // e.g. "FY 2024-25"
  invQty: number;
  saleValue: number;
  saleQty: number;
  productSegment: string;
  isFlagged?: boolean;
  flagReason?: string;
}

export interface FinancialYearMetric {
  financialYear: string; // e.g. "FY 2024-25"
  sales: number;
  quantity: number; // Inv Qty
  customers: number;
  products: number;
  segments: number;
  transactions: number;
  prevSales?: number;
  yoyGrowthPct?: number | null;
}

export interface DataValidationRule {
  id: string;
  title: string;
  description: string;
  status: 'success' | 'warning' | 'error';
  count?: number;
  details?: string[];
}

export interface DataQualitySummary {
  originalRecords: number;
  duplicatesRemoved: number;
  invalidRecordsRemoved: number;
  missingValuesFixed: number;
  cleanRecords: number;
  totalCustomers: number;
  totalProducts: number;
  totalSegments: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  validationRules: DataValidationRule[];
  flaggedRows: { rowNumber: number; issue: string; rawData: Record<string, any> }[];
}

export interface FilterState {
  dateRange: [string, string] | null; // [start, end]
  financialYears: string[];
  segments: string[];
  products: string[];
  customers: string[];
  searchTerm: string;
}

export interface KPIMetrics {
  totalSalesValue: number;
  totalInvQty: number;
  totalSaleQty: number;
  customerCount: number;
  productCount: number;
  segmentCount: number;
  transactionCount: number;
  avgSalesValue: number;
  prevPeriodDiffSalesValue?: number; // % change vs prior period
  prevPeriodDiffQty?: number;
}

export interface TimeTrendPoint {
  period: string; // Date or Quarter label
  sales: number;
  quantity: number;
  transactions: number;
  customers: number;
}

export interface SegmentMetric {
  segment: string;
  sales: number;
  quantity: number;
  productCount: number;
  customerCount: number;
  percentage: number;
}

export interface ProductMetric {
  materialCode: string;
  description: string;
  segment: string;
  sales: number;
  quantity: number;
  transactionCount: number;
  customerCount: number;
  rank: number;
}

export interface CustomerMetric {
  custNum: string;
  customer: string;
  sales: number;
  quantity: number;
  transactionCount: number;
  productCount: number;
  segmentCount: number;
  rank: number;
}

export interface BusinessInsight {
  id: string;
  type: 'growth' | 'decline' | 'concentration' | 'top_performer' | 'anomaly';
  title: string;
  observation: string;
  question: string;
  severity: 'info' | 'warning' | 'success' | 'alert';
  affectedContext: {
    segment?: string;
    product?: string;
    customer?: string;
    period?: string;
    salesChangePct?: number;
  };
}

export type ViewTab =
  | 'landing'
  | 'processing'
  | 'quality_summary'
  | 'overview'
  | 'products'
  | 'customers'
  | 'segments'
  | 'time'
  | 'insights'
  | 'quality'
  | 'settings';
