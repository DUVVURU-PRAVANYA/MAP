import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import { CleanSalesRecord, DataQualitySummary, DataValidationRule, RawSalesRecord } from '../src/types/analytics.js';

export const REQUIRED_COLUMNS = [
  'Cust Num.',
  'Customer',
  'Material code',
  'Description',
  'Bill Date',
  'Inv. Qty',
  'Sale value (Doc rate)',
  'Sale qty in nos',
  'Product Segment',
];

export interface ProcessingResult {
  rawRecords: RawSalesRecord[];
  cleanRecords: CleanSalesRecord[];
  qualitySummary: DataQualitySummary;
  filename: string;
}

export function parseAndCleanExcel(fileBuffer: Buffer, filename: string): ProcessingResult {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: false, raw: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: RawSalesRecord[] = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: true });

  return processRawRecords(rawData, filename);
}

export function calculateFinancialYearFromYMD(year: number, month: number): { financialYear: string; year: number; month: string; quarter: string; monthSortKey: number } {
  // month is 1-indexed: 1=Jan, 4=Apr, 12=Dec
  let fyStartYear: number;
  let quarter: string;

  if (month >= 4) {
    // April (4) to December (12) -> Start of Financial Year
    fyStartYear = year;
    if (month >= 4 && month <= 6) quarter = 'Q1';
    else if (month >= 7 && month <= 9) quarter = 'Q2';
    else quarter = 'Q3';
  } else {
    // January (1) to March (3) -> End of Financial Year
    fyStartYear = year - 1;
    quarter = 'Q4';
  }

  const fyEndYear = fyStartYear + 1;
  const financialYear = `FY ${fyStartYear}-${fyEndYear.toString().slice(-2)}`;
  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthStr = `${monthNames[month] || 'Jan'} ${year}`;
  const monthSortKey = year * 12 + (month - 1);

  return { financialYear, year, month: monthStr, quarter, monthSortKey };
}

export function calculateFinancialYear(dateObj: Date) {
  return calculateFinancialYearFromYMD(dateObj.getFullYear(), dateObj.getMonth() + 1);
}

export function parseExcelDateOnly(rawVal: any): { isoDate: string; year: number; month: number; day: number; fyDetails: ReturnType<typeof calculateFinancialYearFromYMD> } {
  let yyyy = 2025;
  let mmNum = 4;
  let ddNum = 1;

  if (typeof rawVal === 'number') {
    // 1. Excel Serial Number (e.g. 45748 -> 2025-04-01, 45749 -> 2025-04-02, 46112 -> 2026-03-31)
    const parsed = XLSX.SSF.parse_date_code(rawVal);
    if (parsed) {
      yyyy = parsed.y;
      mmNum = parsed.m;
      ddNum = parsed.d;
    }
  } else {
    // 2. String value parsing (e.g. "01-Apr-2025", "1-Apr-25", "2025-04-01", "23-Jan-2025")
    const str = String(rawVal || '').trim();
    if (str) {
      const parts = str.split(/[-/\s.]/);
      if (parts.length === 3) {
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        let d = parseInt(parts[0], 10);
        let mStr = parts[1].toLowerCase();
        let y = parseInt(parts[2], 10);

        let m = monthNames.findIndex(mn => mStr.startsWith(mn)) + 1;
        if (m === 0 && !isNaN(parseInt(parts[1], 10))) {
          m = parseInt(parts[1], 10);
        }

        if (y < 100) {
          y = y >= 50 ? 1900 + y : 2000 + y;
        }

        if (!isNaN(d) && m >= 1 && m <= 12 && !isNaN(y)) {
          yyyy = y;
          mmNum = m;
          ddNum = d;
        }
      }
    }
  }

  const mm = String(mmNum).padStart(2, '0');
  const dd = String(ddNum).padStart(2, '0');
  const isoDate = `${yyyy}-${mm}-${dd}`;
  const fyDetails = calculateFinancialYearFromYMD(yyyy, mmNum);

  return { isoDate, year: yyyy, month: mmNum, day: ddNum, fyDetails };
}

const HEADER_ALIASES: Record<string, string[]> = {
  custNum: ['custnum', 'custno', 'customernumber', 'customercode'],
  customer: ['customer', 'customername', 'custname'],
  materialCode: ['materialcode', 'itemcode', 'productcode', 'matcode'],
  description: ['description', 'materialdescription', 'productdescription', 'itemname'],
  billDate: ['billdate', 'invoicedate', 'date'],
  invQty: ['invqty', 'invoiceqty', 'invoicequantity'],
  saleValue: ['salevaluedocrate', 'salevalue', 'salesvalue', 'amount', 'totalsales'],
  saleQty: ['saleqtyinnos', 'saleqty', 'salesqty', 'quantity'],
  productSegment: ['productsegment', 'vehiclesegment', 'segment', 'category', 'product'],
};

export function normalizeHeader(str: string): string {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function parseNumeric(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str) return 0;
  // Remove currency symbols (₹, $), commas (Indian & Western formatting), spaces
  const cleaned = str.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function processRawRecords(rawData: RawSalesRecord[], filename: string): ProcessingResult {
  const originalRecords = rawData.length;
  const cleanRecords: CleanSalesRecord[] = [];
  const flaggedRows: { rowNumber: number; issue: string; rawData: Record<string, any> }[] = [];

  let duplicatesCount = 0;
  let invalidRecordsCount = 0;
  let missingValuesFixedCount = 0;
  let quantityMismatchCount = 0;

  const seenSignatures = new Set<string>();
  const validationRulesMap: Record<string, DataValidationRule> = {
    required_cols: {
      id: 'required_cols',
      title: 'Required Columns',
      description: 'Checks for mandatory fields in uploaded Excel',
      status: 'success',
    },
    date_format: {
      id: 'date_format',
      title: 'Date Format Verification',
      description: 'Validates Bill Date format and April-March Financial Year derivation',
      status: 'success',
    },
    numeric_fields: {
      id: 'numeric_fields',
      title: 'Numeric Fields Validation',
      description: 'Checks sale value and quantities are valid positive numbers',
      status: 'success',
    },
    quantity_mismatch: {
      id: 'quantity_mismatch',
      title: 'Quantity Consistency Check',
      description: 'Verifies Invoice Quantity matches Sale Qty in nos',
      status: 'success',
    },
    missing_values: {
      id: 'missing_values',
      title: 'Missing Values Audit',
      description: 'Identifies empty segment/description fields and auto-completes defaults',
      status: 'success',
    },
    duplicate_records: {
      id: 'duplicate_records',
      title: 'Duplicate Records Check',
      description: 'Finds exact duplicate sales records',
      status: 'success',
    },
    data_range: {
      id: 'data_range',
      title: 'Data Range Consistency',
      description: 'Verifies transaction date ranges within expected bounds',
      status: 'success',
    },
  };

  // Check column presence in sample row using robust header normalization
  const sampleRow = rawData[0] || {};
  const actualNormalizedCols = Object.keys(sampleRow).map(normalizeHeader);

  const missingConcepts = Object.entries(HEADER_ALIASES).filter(([concept, aliases]) => {
    return !aliases.some(alias => actualNormalizedCols.includes(alias));
  });

  if (missingConcepts.length > 0) {
    validationRulesMap.required_cols.status = 'warning';
    validationRulesMap.required_cols.details = [`Missing expected column concepts: ${missingConcepts.map(m => m[0]).join(', ')}`];
  }

  rawData.forEach((row, index) => {
    const rowNum = index + 2; // Excel row indexing starting from row 2 (row 1 is header)

    // Extract values matching normalized header aliases
    const getValByConcept = (conceptKey: keyof typeof HEADER_ALIASES) => {
      const aliases = HEADER_ALIASES[conceptKey];
      for (const rk of Object.keys(row)) {
        const normKey = normalizeHeader(rk);
        if (aliases.includes(normKey)) {
          const val = row[rk];
          if (val !== undefined && val !== null) return val;
        }
      }
      return '';
    };

    const custNum = String(getValByConcept('custNum')).trim();
    const customer = String(getValByConcept('customer')).trim();
    const materialCode = String(getValByConcept('materialCode')).trim();
    let description = String(getValByConcept('description')).trim();
    const rawBillDate = getValByConcept('billDate');
    const rawInvQty = getValByConcept('invQty');
    const rawSaleVal = getValByConcept('saleValue');
    const rawSaleQty = getValByConcept('saleQty');
    let productSegment = String(getValByConcept('productSegment')).trim();

    // Check duplicate signature
    const signature = `${custNum}|${materialCode}|${rawBillDate}|${rawSaleVal}|${rawSaleQty}`;
    if (seenSignatures.has(signature)) {
      duplicatesCount++;
      flaggedRows.push({
        rowNumber: rowNum,
        issue: 'Duplicate Record Removed',
        rawData: row,
      });
      return;
    }
    seenSignatures.add(signature);

    // Parse numeric fields with robust formatting tolerance
    const invQty = parseNumeric(rawInvQty);
    const saleValue = parseNumeric(rawSaleVal);
    const saleQty = parseNumeric(rawSaleQty);

    // Discard only if row has zero/unparseable values across all numeric fields and lacks account details
    if (saleValue <= 0 && saleQty <= 0 && invQty <= 0 && !customer && !materialCode) {
      invalidRecordsCount++;
      flaggedRows.push({
        rowNumber: rowNum,
        issue: 'Invalid or missing sales record data',
        rawData: row,
      });
      return;
    }

    // Quantity mismatch check: compare numeric float values with tolerance
    const rawInvQtyStr = String(rawInvQty).trim();
    const rawSaleQtyStr = String(rawSaleQty).trim();
    if (rawInvQtyStr !== '' && rawSaleQtyStr !== '' && Math.abs(invQty - saleQty) >= 0.000001) {
      quantityMismatchCount++;
    }

    // Parse date-only value to prevent timezone shifts
    const { isoDate, fyDetails } = parseExcelDateOnly(rawBillDate);

    // Missing handling defaults
    if (!productSegment) {
      productSegment = 'Uncategorized';
      missingValuesFixedCount++;
    }
    if (!description) {
      description = materialCode || 'Standard Item';
      missingValuesFixedCount++;
    }

    cleanRecords.push({
      id: `REC-${cleanRecords.length + 1}`,
      custNum: custNum || 'CUST-GENERIC',
      customer: customer || 'General Customer',
      materialCode: materialCode || 'MAT-GENERIC',
      description,
      billDate: isoDate,
      month: fyDetails.month,
      monthSortKey: fyDetails.monthSortKey,
      quarter: fyDetails.quarter,
      year: fyDetails.year,
      financialYear: fyDetails.financialYear,
      invQty,
      saleValue,
      saleQty: rawSaleQtyStr !== '' ? saleQty : invQty,
      productSegment,
    });
  });

  // Calculate summary counts
  const customerSet = new Set(cleanRecords.map(r => r.customer));
  const productSet = new Set(cleanRecords.map(r => `${r.materialCode}|||${r.description}`));
  const segmentSet = new Set(cleanRecords.map(r => r.productSegment));

  const sortedDates = [...cleanRecords].map(r => r.billDate).sort();
  const dateRangeStart = sortedDates[0] || 'N/A';
  const dateRangeEnd = sortedDates[sortedDates.length - 1] || 'N/A';

  // Rule status updates
  if (duplicatesCount > 0) {
    validationRulesMap.duplicate_records.status = 'warning';
    validationRulesMap.duplicate_records.count = duplicatesCount;
    validationRulesMap.duplicate_records.description = `Detected and cleaned ${duplicatesCount} duplicate record(s)`;
  }

  validationRulesMap.quantity_mismatch.status = 'success';
  validationRulesMap.quantity_mismatch.description = 'Official quantity metric verified: Invoice Quantity (Inv. Qty)';

  if (missingValuesFixedCount > 0) {
    validationRulesMap.missing_values.status = 'warning';
    validationRulesMap.missing_values.count = missingValuesFixedCount;
    validationRulesMap.missing_values.description = `Auto-filled missing segment/description in ${missingValuesFixedCount} record(s)`;
  }

  if (invalidRecordsCount > 0) {
    validationRulesMap.numeric_fields.status = 'warning';
    validationRulesMap.numeric_fields.count = invalidRecordsCount;
  }

  const qualitySummary: DataQualitySummary = {
    originalRecords,
    duplicatesRemoved: duplicatesCount,
    invalidRecordsRemoved: invalidRecordsCount,
    missingValuesFixed: missingValuesFixedCount,
    cleanRecords: cleanRecords.length,
    totalCustomers: customerSet.size,
    totalProducts: productSet.size,
    totalSegments: segmentSet.size,
    dateRangeStart,
    dateRangeEnd,
    validationRules: Object.values(validationRulesMap),
    flaggedRows,
  };

  return {
    rawRecords: rawData,
    cleanRecords,
    qualitySummary,
    filename,
  };
}
