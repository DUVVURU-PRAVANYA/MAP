import { processRawRecords } from '../server/dataProcessor.js';
import { RawSalesRecord } from '../src/types/analytics.js';

// Exact 3-record single FY 2025-26 dataset specified in Requirement 22:
// Record 1: Bill Date = 15/04/2025, Sale Value = 1000, Inv Qty = 10, Customer = C001, Material = M001, Description = Product A, Vehicle Segment = Segment A
// Record 2: Bill Date = 15/05/2025, Sale Value = 2000, Inv Qty = 20, Customer = C001, Material = M002, Description = Product B, Vehicle Segment = Segment A
// Record 3: Bill Date = 15/01/2026, Sale Value = 3000, Inv Qty = 30, Customer = C002, Material = M001, Description = Product A, Vehicle Segment = Segment A

const sampleRows: RawSalesRecord[] = [
  {
    'Cust Num.': 'C001',
    'Customer': 'Customer A',
    'Material code': 'M001',
    'Description': 'Product A',
    'Bill Date': '2025-04-15',
    'Inv. Qty': 10,
    'Sale value(Doc rate)': 1000,
    'Sale Qty in nos': 10,
    'ProductSegment': 'Segment A',
  },
  {
    'Cust Num.': 'C001',
    'Customer': 'Customer A',
    'Material code': 'M002',
    'Description': 'Product B',
    'Bill Date': '2025-05-15',
    'Inv. Qty': 20,
    'Sale value(Doc rate)': 2000,
    'Sale Qty in nos': 20,
    'ProductSegment': 'Segment A',
  },
  {
    'Cust Num.': 'C002',
    'Customer': 'Customer B',
    'Material code': 'M001',
    'Description': 'Product A',
    'Bill Date': '2026-01-15',
    'Inv. Qty': 30,
    'Sale value(Doc rate)': 3000,
    'Sale Qty in nos': 30,
    'ProductSegment': 'Segment A',
  },
];

console.log('Running Deterministic Automated Accuracy Test...');
const result = processRawRecords(sampleRows, 'test_single_fy.xlsx');
const clean = result.cleanRecords;

const detectedFYs = Array.from(new Set(clean.map(r => r.financialYear)));
const totalSales = clean.reduce((sum, r) => sum + r.saleValue, 0);
const totalInvQty = clean.reduce((sum, r) => sum + r.invQty, 0);
const uniqueCustomers = new Set(clean.map(r => r.customer)).size;
const uniqueProducts = new Set(clean.map(r => `${r.materialCode}|||${r.description}`)).size;
const uniqueSegments = new Set(clean.map(r => r.productSegment)).size;

console.log('--- TEST RESULTS ---');
console.log('1. Uploaded records:', sampleRows.length);
console.log('2. Clean records processed:', clean.length);
console.log('3. Rejected records:', result.qualitySummary.invalidRecordsRemoved);
console.log('4. Detected Financial Years:', detectedFYs);
console.log('5. Total Sales Value:', totalSales);
console.log('6. Total Invoice Quantity:', totalInvQty);
console.log('7. Unique Customers:', uniqueCustomers);
console.log('8. Unique Products:', uniqueProducts);
console.log('9. Unique Vehicle Segments:', uniqueSegments);

// Assertions
if (detectedFYs.length !== 1 || detectedFYs[0] !== 'FY 2025-26') {
  throw new Error(`ASSERTION FAILED: Expected ONLY ['FY 2025-26'], got: ${JSON.stringify(detectedFYs)}`);
}
if (totalSales !== 6000) throw new Error(`ASSERTION FAILED: Expected Total Sales 6000, got ${totalSales}`);
if (totalInvQty !== 60) throw new Error(`ASSERTION FAILED: Expected Total Inv Qty 60, got ${totalInvQty}`);
if (uniqueCustomers !== 2) throw new Error(`ASSERTION FAILED: Expected 2 unique customers, got ${uniqueCustomers}`);
if (uniqueProducts !== 2) throw new Error(`ASSERTION FAILED: Expected 2 unique products, got ${uniqueProducts}`);
if (uniqueSegments !== 1) throw new Error(`ASSERTION FAILED: Expected 1 unique segment, got ${uniqueSegments}`);

console.log('✅ ALL ACCURACY TEST ASSERTIONS PASSED SUCCESSFULLY!');
