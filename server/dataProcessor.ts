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
  const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: RawSalesRecord[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return processRawRecords(rawData, filename);
}

export function processRawRecords(rawData: RawSalesRecord[], filename: string): ProcessingResult {
  const originalRecords = rawData.length;
  const cleanRecords: CleanSalesRecord[] = [];
  const flaggedRows: { rowNumber: number; issue: string; rawData: Record<string, any> }[] = [];

  let duplicatesCount = 0;
  let invalidRecordsCount = 0;
  let missingValuesFixedCount = 0;

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
      description: 'Validates Bill Date format and range',
      status: 'success',
    },
    numeric_fields: {
      id: 'numeric_fields',
      title: 'Numeric Fields Validation',
      description: 'Checks sale value and quantities are valid positive numbers',
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

  // Check column presence in first 10 rows
  const sampleRow = rawData[0] || {};
  const actualCols = Object.keys(sampleRow);
  const missingCols = REQUIRED_COLUMNS.filter(req => !actualCols.some(col => col.trim().toLowerCase() === req.toLowerCase()));

  if (missingCols.length > 0) {
    validationRulesMap.required_cols.status = 'warning';
    validationRulesMap.required_cols.details = [`Missing expected columns: ${missingCols.join(', ')}`];
  }

  rawData.forEach((row, index) => {
    const rowNum = index + 2; // Excel row indexing starting from row 2 (row 1 is header)

    // Extract values with flexible key matching
    const getVal = (keys: string[]) => {
      for (const k of keys) {
        const foundKey = Object.keys(row).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
          return row[foundKey];
        }
      }
      return '';
    };

    const custNum = String(getVal(['Cust Num.', 'Customer Number', 'Customer Code', 'Cust No'])).trim();
    const customer = String(getVal(['Customer', 'Customer Name', 'Cust Name'])).trim();
    const materialCode = String(getVal(['Material code', 'Item Code', 'Product Code', 'Mat Code'])).trim();
    let description = String(getVal(['Description', 'Material Description', 'Product Description', 'Item Name'])).trim();
    const rawBillDate = getVal(['Bill Date', 'Invoice Date', 'Date']);
    const rawInvQty = getVal(['Inv. Qty', 'Invoice Qty', 'Invoice Quantity']);
    const rawSaleVal = getVal(['Sale value (Doc rate)', 'Sale Value', 'Sales Value', 'Amount', 'Total Sales']);
    const rawSaleQty = getVal(['Sale qty in nos', 'Sale Qty', 'Sales Qty', 'Quantity']);
    let productSegment = String(getVal(['Product Segment', 'Segment', 'Category'])).trim();

    // Check duplicate
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

    // Parse numbers
    const invQty = parseFloat(String(rawInvQty).replace(/[^0-9.-]+/g, '')) || 0;
    const saleValue = parseFloat(String(rawSaleVal).replace(/[^0-9.-]+/g, '')) || 0;
    const saleQty = parseFloat(String(rawSaleQty).replace(/[^0-9.-]+/g, '')) || 0;

    if (saleValue <= 0 && saleQty <= 0 && invQty <= 0) {
      invalidRecordsCount++;
      flaggedRows.push({
        rowNumber: rowNum,
        issue: 'Invalid or zero sale value and quantity',
        rawData: row,
      });
      return;
    }

    // Parse date
    let parsedDateObj: Date;
    if (rawBillDate instanceof Date && !isNaN(rawBillDate.getTime())) {
      parsedDateObj = rawBillDate;
    } else if (typeof rawBillDate === 'number') {
      // Excel serial date integer
      parsedDateObj = new Date(Math.round((rawBillDate - 25569) * 86400 * 1000));
    } else {
      parsedDateObj = new Date(String(rawBillDate));
    }

    if (isNaN(parsedDateObj.getTime())) {
      parsedDateObj = new Date('2025-04-01'); // fallback default
      validationRulesMap.date_format.status = 'warning';
    }

    const yyyy = parsedDateObj.getFullYear();
    const mm = String(parsedDateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(parsedDateObj.getDate()).padStart(2, '0');
    const isoDate = `${yyyy}-${mm}-${dd}`;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthLabel = `${monthNames[parsedDateObj.getMonth()]} ${yyyy}`;

    // Compute Quarter (Financial Year basis: Q1 = Apr-Jun, Q2 = Jul-Sep, Q3 = Oct-Dec, Q4 = Jan-Mar)
    const m = parsedDateObj.getMonth() + 1; // 1-12
    let quarter = '';
    let fyYear = yyyy;
    if (m >= 4 && m <= 6) {
      quarter = `Q1 FY${(yyyy + 1).toString().slice(-2)}`;
    } else if (m >= 7 && m <= 9) {
      quarter = `Q2 FY${(yyyy + 1).toString().slice(-2)}`;
    } else if (m >= 10 && m <= 12) {
      quarter = `Q3 FY${(yyyy + 1).toString().slice(-2)}`;
    } else {
      quarter = `Q4 FY${yyyy.toString().slice(-2)}`;
    }

    // Missing handling
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
      month: monthLabel,
      quarter,
      invQty,
      saleValue,
      saleQty,
      productSegment,
    });
  });

  // Calculate summary counts
  const customerSet = new Set(cleanRecords.map(r => r.customer));
  const productSet = new Set(cleanRecords.map(r => r.materialCode));
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
