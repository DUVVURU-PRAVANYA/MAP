import { processRawRecords } from '../server/dataProcessor.js';
import { RawSalesRecord } from '../src/types/analytics.js';

const multiYearRows: RawSalesRecord[] = [
  // FY 2023-24
  {
    'Cust Num.': 'C001',
    'Customer': 'Customer Alpha',
    'Material code': 'M001',
    'Description': 'Widget Standard',
    'Bill Date': '2023-05-10',
    'Inv. Qty': 100,
    'Sale value(Doc rate)': 10000,
    'Sale Qty in nos': 100,
    'ProductSegment': 'Commercial',
  },
  {
    'Cust Num.': 'C002',
    'Customer': 'Customer Beta',
    'Material code': 'M002',
    'Description': 'Widget Deluxe',
    'Bill Date': '2024-02-15',
    'Inv. Qty': 50,
    'Sale value(Doc rate)': 8000,
    'Sale Qty in nos': 50,
    'ProductSegment': 'Passenger',
  },
  // FY 2024-25
  {
    'Cust Num.': 'C001',
    'Customer': 'Customer Alpha',
    'Material code': 'M001',
    'Description': 'Widget Standard',
    'Bill Date': '2024-06-20',
    'Inv. Qty': 120,
    'Sale value(Doc rate)': 15000,
    'Sale Qty in nos': 120,
    'ProductSegment': 'Commercial',
  },
  {
    'Cust Num.': 'C003',
    'Customer': 'Customer Gamma',
    'Material code': 'M002',
    'Description': 'Widget Deluxe',
    'Bill Date': '2025-01-10',
    'Inv. Qty': 80,
    'Sale value(Doc rate)': 12000,
    'Sale Qty in nos': 80,
    'ProductSegment': 'Passenger',
  },
  // FY 2025-26
  {
    'Cust Num.': 'C002',
    'Customer': 'Customer Beta',
    'Material code': 'M001',
    'Description': 'Widget Standard',
    'Bill Date': '2025-04-15',
    'Inv. Qty': 150,
    'Sale value(Doc rate)': 20000,
    'Sale Qty in nos': 150,
    'ProductSegment': 'Commercial',
  },
  {
    'Cust Num.': 'C003',
    'Customer': 'Customer Gamma',
    'Material code': 'M003',
    'Description': 'Widget Pro',
    'Bill Date': '2026-03-01',
    'Inv. Qty': 100,
    'Sale value(Doc rate)': 18000,
    'Sale Qty in nos': 100,
    'ProductSegment': 'Passenger',
  },
];

console.log('Testing "All Years" and FY Specific Filtering Logic...');
const result = processRawRecords(multiYearRows, 'all_years_test.xlsx');
const allRecords = result.cleanRecords;

// Helper to filter records by selected FY
function filterRecords(records: typeof allRecords, selectedFY: string) {
  const isAll = !selectedFY || selectedFY === 'ALL' || selectedFY === 'All Years';
  return records.filter(r => isAll || r.financialYear === selectedFY);
}

// 1. All Years
const allFiltered = filterRecords(allRecords, '');
console.log(`1. "All Years" => Total Records: ${allFiltered.length}, Total Sales: ${allFiltered.reduce((s, r) => s + r.saleValue, 0)}`);
if (allFiltered.length !== 6) throw new Error(`All Years failed: expected 6 records, got ${allFiltered.length}`);

// 2. FY 2023-24
const fy23Filtered = filterRecords(allRecords, 'FY 2023-24');
console.log(`2. "FY 2023-24" => Total Records: ${fy23Filtered.length}, Total Sales: ${fy23Filtered.reduce((s, r) => s + r.saleValue, 0)}`);
if (fy23Filtered.length !== 2) throw new Error(`FY 2023-24 failed: expected 2 records, got ${fy23Filtered.length}`);

// 3. FY 2024-25
const fy24Filtered = filterRecords(allRecords, 'FY 2024-25');
console.log(`3. "FY 2024-25" => Total Records: ${fy24Filtered.length}, Total Sales: ${fy24Filtered.reduce((s, r) => s + r.saleValue, 0)}`);
if (fy24Filtered.length !== 2) throw new Error(`FY 2024-25 failed: expected 2 records, got ${fy24Filtered.length}`);

// 4. FY 2025-26
const fy25Filtered = filterRecords(allRecords, 'FY 2025-26');
console.log(`4. "FY 2025-26" => Total Records: ${fy25Filtered.length}, Total Sales: ${fy25Filtered.reduce((s, r) => s + r.saleValue, 0)}`);
if (fy25Filtered.length !== 2) throw new Error(`FY 2025-26 failed: expected 2 records, got ${fy25Filtered.length}`);

console.log('🎉 ALL YEARS AND FY FILTER SELECTION TESTS PASSED SUCCESSFULLY!');
