export interface RawSalesRecord {
  'Cust Num.'?: string | number;
  'Customer'?: string;
  'Customer Group'?: string;
  'Master Customer Group'?: string;
  'Material code'?: string | number;
  'Description'?: string;
  'Bill Date'?: string | number | Date;
  'Inv. Qty'?: string | number;
  'Sale value (Doc rate)'?: string | number;
  'Value In Crs'?: string | number;
  'Sale qty in nos'?: string | number;
  'Product'?: string;
  'Product Segment'?: string;
  'Segment'?: string;
  'Plant'?: string | number;
  'Plant Code'?: string | number;
  'Invoice Num.'?: string | number;
  'Invoice Num'?: string | number;
  'Invoice Number'?: string | number;
  [key: string]: any;
}

export interface CleanSalesRecord {
  id: string;
  custNum: string;
  customer: string;
  customerGroup: string;
  masterCustomerGroup: string;
  materialCode: string;
  description: string;
  grnDate: string; // ISO format YYYY-MM-DD
  billType: string;
  month: string;
  monthSortKey?: number;
  quarter: string;
  year?: number;
  financialYear: string;
  saleValue: number; // Sales (Cr) = Sum of Sale value(Doc rate) / 10,000,000
  saleQty: number; // Sum of Sale qty in nos
  productSegment: string;
  plantCode: string;
  plantName: string;
  invoiceNum: string;
  customerPurNum?: string;
  refDocNo?: string;
  oemCustomer?: string;
  rblProductSegment?: string;
  organicNpd?: string;
  aopOem?: string;
  application?: string;
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
  prevQuantity?: number;
  qtyGrowthPct?: number | null;
}

export interface PlantMetric {
  plantCode: string;
  plantName: string;
  sales: number;
  quantity: number;
  customerCount: number;
  productCount: number;
  transactionCount: number;
  percentage: number;
  rank: number;
}

export interface CustomerHierarchyMetric {
  key: string;
  name: string;
  level: 'master' | 'group' | 'customer';
  sales: number;
  quantity: number;
  productCount: number;
  plantCount: number;
  transactionCount: number;
  percentage: number;
  rank: number;
  masterCustomerGroup?: string;
  customerGroup?: string;
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
  l2RecordsRemoved: number;
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
  selectedReportingFY?: string;
  financialYears: string[];
  segments: string[];
  rblProductSegments: string[];
  products: string[];
  customers: string[];
  customerGroups: string[];
  masterCustomerGroups: string[];
  plants: string[];
  invoiceNums: string[];
  searchTerm: string;
}

export interface KPIMetrics {
  totalSalesValue: number; // In Crores
  totalInvQty: number;
  totalSaleQty: number;
  customerCount: number; // Distinct Master Customer Group Count
  individualCustomerCount: number;
  customerGroupCount: number;
  masterCustomerGroupCount: number;
  productCount: number;
  segmentCount: number;
  plantCount: number;
  invoiceCount: number;
  transactionCount: number;
  avgSalesValue: number;
  prevPeriodDiffSalesValue?: number; // % change vs prior period
  prevPeriodDiffQty?: number;
}

export interface TimeTrendPoint {
  period: string; // Month label
  sales: number;
  quantity: number;
  transactions: number;
  customers: number;
  monthSortKey?: number;
}

export interface ProductFamilyMetric {
  productFamily: string;
  sales: number;
  quantity: number;
  skuCount: number;
  customerCount: number;
  transactionCount: number;
  percentage: number;
  rank: number;
}

export interface SegmentMetric {
  segment: string;
  sales: number;
  quantity: number;
  productCount: number;
  customerCount: number;
  transactionCount: number;
  percentage: number;
  rank: number;
}

export interface ProductMetric {
  product: string; // `${materialCode} - ${description}`
  materialCode: string;
  description: string;
  segment: string;
  sales: number;
  quantity: number; // Inv Qty
  transactionCount: number;
  customerCount: number;
  salesContributionPct: number;
  rank: number;
}

export interface CustomerMetric {
  custNum: string;
  customer: string;
  customerGroup?: string;
  masterCustomerGroup?: string;
  sales: number;
  quantity: number;
  transactionCount: number;
  productCount: number;
  segmentCount: number;
  plantCount?: number;
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
    plant?: string;
    period?: string;
    salesChangePct?: number;
  };
}

export type ViewTab =
  | 'landing'
  | 'processing'
  | 'quality_summary'
  | 'overview'
  | 'plants'
  | 'products'
  | 'customers'
  | 'segments'
  | 'time'
  | 'insights'
  | 'quality'
  | 'settings';
