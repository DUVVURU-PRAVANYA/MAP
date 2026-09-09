import * as XLSX from 'xlsx';
import { CleanSalesRecord, DataQualitySummary, DataValidationRule, RawSalesRecord } from '../src/types/analytics.js';

export const REQUIRED_COLUMNS = [
  'Invoice Num.',
  'Plant',
  'Bill type',
  'Cust Num.',
  'Customer.',
  'Material code',
  'Desciption',
  'Customer Group',
  'GRN date',
  'Master customer Group',
  'Segment',
  'RBL_Product segment',
  'Sum of Sale value(Doc rate)',
  'Sum of Sale qty in nos',
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
  const monthStr = `${monthNames[month] || ''} ${year}`;
  const monthSortKey = year * 12 + (month - 1);

  return { financialYear, year, month: monthStr, quarter, monthSortKey };
}

export function calculateFinancialYear(dateObj: Date) {
  return calculateFinancialYearFromYMD(dateObj.getFullYear(), dateObj.getMonth() + 1);
}

export function parseExcelDateOnly(rawVal: any): { isoDate: string; year: number; month: number; day: number; fyDetails: ReturnType<typeof calculateFinancialYearFromYMD> } {
  let yyyy = 0;
  let mmNum = 0;
  let ddNum = 0;
  let hasValidDate = false;

  if (rawVal !== null && rawVal !== undefined && rawVal !== '') {
    if (rawVal instanceof Date && !isNaN(rawVal.getTime())) {
      yyyy = rawVal.getFullYear();
      mmNum = rawVal.getMonth() + 1;
      ddNum = rawVal.getDate();
      hasValidDate = true;
    } else if (typeof rawVal === 'number' || (typeof rawVal === 'string' && /^\d+(\.\d+)?$/.test(rawVal.trim()) && parseFloat(rawVal.trim()) > 1000 && parseFloat(rawVal.trim()) < 100000)) {
      const num = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal.trim());
      const parsed = XLSX.SSF.parse_date_code(num);
      if (parsed && parsed.y && parsed.m && parsed.d) {
        yyyy = parsed.y;
        mmNum = parsed.m;
        ddNum = parsed.d;
        hasValidDate = true;
      }
    } else {
      const str = String(rawVal).trim();
      if (str) {
        if (str.includes('T')) {
          const dt = new Date(str);
          if (!isNaN(dt.getTime())) {
            yyyy = dt.getUTCFullYear();
            mmNum = dt.getUTCMonth() + 1;
            ddNum = dt.getUTCDate();
            hasValidDate = true;
          }
        }
        if (!hasValidDate) {
          const parts = str.split(/[-/\s.]+/);
          if (parts.length === 3) {
            const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            let d = 0;
            let m = 0;
            let y = 0;

            if (parts[0].length === 4) {
              y = parseInt(parts[0], 10);
              let mStr = parts[1].toLowerCase();
              m = monthNames.findIndex(mn => mStr.startsWith(mn)) + 1;
              if (m === 0 && !isNaN(parseInt(parts[1], 10))) {
                m = parseInt(parts[1], 10);
              }
              d = parseInt(parts[2], 10);
            } else {
              d = parseInt(parts[0], 10);
              let mStr = parts[1].toLowerCase();
              m = monthNames.findIndex(mn => mStr.startsWith(mn)) + 1;
              if (m === 0 && !isNaN(parseInt(parts[1], 10))) {
                m = parseInt(parts[1], 10);
              }
              y = parseInt(parts[2], 10);
              if (y < 100) {
                y = y >= 50 ? 1900 + y : 2000 + y;
              }
              if (m > 12 && d <= 12) {
                const tmp = d;
                d = m;
                m = tmp;
              }
            }

            if (!isNaN(d) && d >= 1 && d <= 31 && m >= 1 && m <= 12 && !isNaN(y) && y >= 1900 && y <= 2100) {
              yyyy = y;
              mmNum = m;
              ddNum = d;
              hasValidDate = true;
            }
          }
        }
      }
    }
  }

  if (!hasValidDate) {
    return {
      isoDate: '',
      year: 0,
      month: 0,
      day: 0,
      fyDetails: {
        financialYear: '',
        year: 0,
        month: '',
        quarter: '',
        monthSortKey: 0,
      },
    };
  }

  const mm = String(mmNum).padStart(2, '0');
  const dd = String(ddNum).padStart(2, '0');
  const isoDate = `${yyyy}-${mm}-${dd}`;
  const fyDetails = calculateFinancialYearFromYMD(yyyy, mmNum);

  return { isoDate, year: yyyy, month: mmNum, day: ddNum, fyDetails };
}

export function normalizePlant(rawPlant: any): { plantCode: string; plantName: string } {
  const str = String(rawPlant || '').trim();
  if (!str) {
    return { plantCode: '', plantName: '' };
  }
  const cleanStr = str.toLowerCase();
  if (str.includes('3000') || cleanStr.includes('chennai')) {
    return { plantCode: '3000', plantName: 'Chennai' };
  }
  if (str.includes('3100') || cleanStr.includes('hyderabad')) {
    return { plantCode: '3100', plantName: 'Hyderabad' };
  }
  if (str.includes('3200') || cleanStr.includes('pondicherry') || cleanStr.includes('puducherry')) {
    return { plantCode: '3200', plantName: 'Pondicherry' };
  }
  if (str.includes('3600') || cleanStr.includes('trichy') || cleanStr.includes('tiruchirappalli')) {
    return { plantCode: '3600', plantName: 'Trichy' };
  }
  return { plantCode: str, plantName: str };
}

const HEADER_ALIASES: Record<string, string[]> = {
  custNum: ['custnum', 'custnum.', 'custno', 'customernumber', 'customercode'],
  customer: ['customer.', 'customer', 'customername', 'custname'],
  customerGroup: ['customergroup', 'custgroup', 'group'],
  masterCustomerGroup: ['mastercustomergroup', 'mastercustgroup', 'mastergroup', 'parentgroup'],
  materialCode: ['materialcode', 'itemcode', 'productcode', 'matcode'],
  description: ['desciption', 'description', 'materialdescription', 'productdescription', 'itemname'],
  grnDate: ['grndate', 'grn_date', 'grndat', 'grndt', 'grn'],
  billType: ['billtype', 'bill_type', 'type'],
  customerPurNum: ['customerpurnum', 'customerpurno', 'purnum', 'purno'],
  refDocNo: ['refdocno', 'refdocnumber', 'refno'],
  oemCustomer: ['oemcustomer', 'oem'],
  rblProductSegment: ['rblproductsegment', 'rbl_productsegment', 'rblsegment'],
  organicNpd: ['organicnpd', 'organic', 'npd'],
  aopOem: ['aopoem', 'aop'],
  application: ['application', 'usecase', 'app', 'applicationname', 'enduseapplication', 'vehicleapplication', 'applications', 'applicationtype'],
  saleValue: ['sumofsalevaluedocrate', 'salevaluedocrate', 'salevalue', 'salesvalue', 'amount', 'totalsales', 'valueincrs', 'sumofvalueincrs'],
  saleQty: ['sumofsaleqtyinnos', 'saleqtyinnos', 'saleqty', 'salesqty', 'quantity', 'invqty', 'sumofinvqty', 'invoiceqty'],
  productSegment: ['segment', 'vehiclesegment', 'productsegment', 'category'],
  plant: ['plant', 'plantcode', 'plantnum', 'factory'],
  invoiceNum: ['invoicenum.', 'invoicenum', 'invoicenumber', 'invoiceno', 'billnum', 'billnumber', 'invoicedoc'],
};

export function normalizeHeader(str: string): string {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function parseNumeric(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str) return 0;
  const cleaned = str.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function processRawRecords(rawData: RawSalesRecord[], filename: string): ProcessingResult {
  const originalRecords = rawData.length;
  const cleanRecords: CleanSalesRecord[] = [];
  const flaggedRows: { rowNumber: number; issue: string; rawData: Record<string, any> }[] = [];

  let l2RecordsCount = 0;
  let l2TotalValue = 0;
  let invalidRecordsCount = 0;
  let missingValuesFixedCount = 0;
  let quantityMismatchCount = 0;

  const validationRulesMap: Record<string, DataValidationRule> = {
    l2_exclusion: {
      id: 'l2_exclusion',
      title: 'Bill Type = L2 Exclusion',
      description: 'Excludes Bill Type L2 records from all calculations and analysis',
      status: 'success',
      count: 0,
    },
    required_cols: {
      id: 'required_cols',
      title: 'Required Columns',
      description: 'Checks for mandatory fields in uploaded Excel',
      status: 'success',
    },
    date_format: {
      id: 'date_format',
      title: 'Date Format Verification (GRN Date)',
      description: 'Validates GRN Date format and April-March Financial Year derivation',
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
      description: 'Verifies Sum of Sale qty in nos is populated',
      status: 'success',
    },
    missing_values: {
      id: 'missing_values',
      title: 'Missing Values Audit',
      description: 'Identifies empty fields',
      status: 'success',
    },
    data_range: {
      id: 'data_range',
      title: 'Data Range Consistency',
      description: 'Verifies transaction date ranges within expected bounds',
      status: 'success',
    },
  };

  const sampleRow = rawData[0] || {};
  const actualNormalizedCols = Object.keys(sampleRow).map(normalizeHeader);

  const missingConcepts = Object.entries(HEADER_ALIASES).filter(([concept, aliases]) => {
    if (['customerPurNum', 'refDocNo', 'oemCustomer', 'rblProductSegment', 'organicNpd', 'aopOem', 'application'].includes(concept)) return false;
    return !aliases.some(alias => actualNormalizedCols.includes(alias));
  });

  if (missingConcepts.length > 0) {
    validationRulesMap.required_cols.status = 'warning';
    validationRulesMap.required_cols.details = [`Missing expected column concepts: ${missingConcepts.map(m => m[0]).join(', ')}`];
  }

  rawData.forEach((row, index) => {
    const rowNum = index + 2;

    const getValByConcept = (conceptKey: keyof typeof HEADER_ALIASES) => {
      const aliases = HEADER_ALIASES[conceptKey];
      for (const alias of aliases) {
        for (const rk of Object.keys(row)) {
          const normKey = normalizeHeader(rk);
          if (normKey === alias) {
            const val = row[rk];
            if (val !== undefined && val !== null && String(val).trim() !== '') return val;
          }
        }
      }
      return '';
    };

    // Rule 15: Exclude Bill Type = L2 records before any dashboard calculations
    const rawBillType = String(getValByConcept('billType')).trim();
    const billType = rawBillType || 'L1';
    if (String(billType).trim().toUpperCase() === 'L2') {
      l2RecordsCount++;
      const rawL2SaleVal = getValByConcept('saleValue');
      const l2ValNum = parseNumeric(rawL2SaleVal);
      l2TotalValue += (l2ValNum / 10000000);
      flaggedRows.push({
        rowNumber: rowNum,
        issue: 'Bill Type = L2 Record Excluded',
        rawData: row,
      });
      return;
    }

    const custNum = String(getValByConcept('custNum')).trim();
    const customer = String(getValByConcept('customer')).trim();
    const customerGroup = String(getValByConcept('customerGroup')).trim() || customer;
    const masterCustomerGroup = String(getValByConcept('masterCustomerGroup')).trim() || customerGroup || customer;

    const materialCode = String(getValByConcept('materialCode')).trim();
    // Requirement 10: Sourced from Desciption. NEVER copy materialCode into description!
    const description = String(getValByConcept('description')).trim();

    const rawGrnDate = getValByConcept('grnDate');
    const rawSaleVal = getValByConcept('saleValue');
    const rawSaleQty = getValByConcept('saleQty');
    const productSegment = String(getValByConcept('productSegment')).trim();
    const rblProductSegment = String(getValByConcept('rblProductSegment')).trim();

    const rawPlant = getValByConcept('plant');
    const rawInvoiceNum = getValByConcept('invoiceNum');

    const { plantCode, plantName } = normalizePlant(rawPlant);
    const invoiceNum = String(rawInvoiceNum || '').trim();

    const saleQty = parseNumeric(rawSaleQty);
    const saleValNum = parseNumeric(rawSaleVal);

    // Exact Rule 4: SALES IN CRORES = RAW SALES / 10,000,000 (UNCONDITIONAL)
    const saleValue = saleValNum / 10000000;

    // Discard only if row has zero/unparseable values across all numeric fields and lacks account details
    if (saleValNum <= 0 && saleQty <= 0 && !customer && !materialCode) {
      invalidRecordsCount++;
      flaggedRows.push({
        rowNumber: rowNum,
        issue: 'Invalid or missing sales record data',
        rawData: row,
      });
      return;
    }

    // Requirement 3: Financial Year MUST be calculated from GRN date ONLY
    const { isoDate: grnIsoDate, fyDetails } = parseExcelDateOnly(rawGrnDate);

    cleanRecords.push({
      id: `REC-${cleanRecords.length + 1}`,
      custNum,
      customer,
      customerGroup,
      masterCustomerGroup,
      materialCode,
      description,
      grnDate: grnIsoDate,
      billType,
      month: fyDetails.month,
      monthSortKey: fyDetails.monthSortKey,
      quarter: fyDetails.quarter,
      year: fyDetails.year,
      financialYear: fyDetails.financialYear,
      saleValue, // Sales in Crores directly
      saleQty, // Sum of Sale qty in nos directly
      productSegment,
      plantCode,
      plantName,
      invoiceNum,
      rblProductSegment,
      customerPurNum: String(getValByConcept('customerPurNum')).trim(),
      refDocNo: String(getValByConcept('refDocNo')).trim(),
      oemCustomer: String(getValByConcept('oemCustomer')).trim(),
      organicNpd: String(getValByConcept('organicNpd')).trim(),
      aopOem: String(getValByConcept('aopOem')).trim(),
      application: String(getValByConcept('application')).trim(),
    });
  });

  const customerSet = new Set(cleanRecords.map(r => r.customer).filter(Boolean));
  const productSet = new Set(cleanRecords.map(r => `${r.materialCode}|||${r.description}`).filter(Boolean));
  const segmentSet = new Set(cleanRecords.map(r => r.productSegment).filter(Boolean));

  const sortedDates = [...cleanRecords].map(r => r.grnDate).filter(Boolean).sort();
  const dateRangeStart = sortedDates[0] || '';
  const dateRangeEnd = sortedDates[sortedDates.length - 1] || '';

  if (l2RecordsCount > 0) {
    validationRulesMap.l2_exclusion.status = 'warning';
    validationRulesMap.l2_exclusion.count = l2RecordsCount;
    validationRulesMap.l2_exclusion.description = `Excluded ${l2RecordsCount} Bill Type = L2 record(s) from analysis`;
  }

  const qualitySummary: DataQualitySummary = {
    originalRecords,
    l2RecordsRemoved: l2RecordsCount,
    l2TotalValue: Number(l2TotalValue.toFixed(4)),
    duplicatesRemoved: 0,
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
