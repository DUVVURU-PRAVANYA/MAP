import { processRawRecords } from '../server/dataProcessor.js';
import { RawSalesRecord } from '../src/types/analytics.js';

const multiYearRows: RawSalesRecord[] = [
  // FY 2023-24 (01-Apr-2023 to 31-Mar-2024)
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
  // FY 2024-25 (01-Apr-2024 to 31-Mar-2025)
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
  // FY 2025-26 (01-Apr-2025 to 31-Mar-2026)
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

console.log('Testing Multi-FY Dataset Normalization and YoY Calculations...');
const result = processRawRecords(multiYearRows, 'multi_fy_test.xlsx');
const clean = result.cleanRecords;

const fy23_24 = clean.filter(r => r.financialYear === 'FY 2023-24');
const fy24_25 = clean.filter(r => r.financialYear === 'FY 2024-25');
const fy25_26 = clean.filter(r => r.financialYear === 'FY 2025-26');

console.log(`FY 2023-24 Records: ${fy23_24.length}, Total Sales: ${fy23_24.reduce((s, r) => s + r.saleValue, 0)}`);
console.log(`FY 2024-25 Records: ${fy24_25.length}, Total Sales: ${fy24_25.reduce((s, r) => s + r.saleValue, 0)}`);
console.log(`FY 2025-26 Records: ${fy25_26.length}, Total Sales: ${fy25_26.reduce((s, r) => s + r.saleValue, 0)}`);

if (fy23_24.length !== 2) throw new Error(`FY 2023-24 count mismatch: expected 2, got ${fy23_24.length}`);
if (fy24_25.length !== 2) throw new Error(`FY 2024-25 count mismatch: expected 2, got ${fy24_25.length}`);
if (fy25_26.length !== 2) throw new Error(`FY 2025-26 count mismatch: expected 2, got ${fy25_26.length}`);

console.log('✅ ALL MULTI-FY DATASET TESTS PASSED SUCCESSFULLY!');
