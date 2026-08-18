import { processRawRecords } from '../server/dataProcessor.js';
import { RawSalesRecord } from '../src/types/analytics.js';

console.log('=== Running Comprehensive Financial Reconciliation Test Suite ===\n');

// 1. Requirement 24 & 28 exact raw dataset test (Raw total = 4,443,344,110.76563)
const rawDataset: RawSalesRecord[] = [
  {
    'Invoice Num.': 'INV-1001',
    'Bill type': 'L1',
    'GRN date': '2025-04-15',
    'Customer.': 'TVS Motors Chennai',
    'Customer Group': 'TVS Group',
    'Master customer Group': 'TVS Conglomerate',
    'Material code': '38981',
    'Desciption': 'Brake Pad Assembly',
    'Segment': '2W Commercial',
    'RBL_Product segment': 'Braking Systems',
    'Sum of Sale value(Doc rate)': 1500000000, // 150 Cr
    'Sum of Sale qty in nos': 15000,
    'Plant': '3000',
  },
  {
    'Invoice Num.': 'INV-1002',
    'Bill type': 'L1',
    'GRN date': '2025-07-20',
    'Customer.': 'Hero MotoCorp Gurgaon',
    'Customer Group': 'Hero Group',
    'Master customer Group': 'Hero Enterprise',
    'Material code': '38982',
    'Desciption': 'Clutch Disc Unit',
    'Segment': '2W Commercial',
    'RBL_Product segment': 'Transmission',
    'Sum of Sale value(Doc rate)': 1200000000, // 120 Cr
    'Sum of Sale qty in nos': 12000,
    'Plant': '3100',
  },
  {
    'Invoice Num.': 'INV-1003',
    'Bill type': 'S1',
    'GRN date': '2025-10-10',
    'Customer.': 'Bajaj Auto Pune',
    'Customer Group': 'Bajaj Group',
    'Master customer Group': 'Bajaj Enterprise',
    'Material code': '38983',
    'Desciption': 'Brake Shoe Rear',
    'Segment': '3W Commercial',
    'RBL_Product segment': 'Braking Systems',
    'Sum of Sale value(Doc rate)': 900000000, // 90 Cr
    'Sum of Sale qty in nos': 9000,
    'Plant': '3200',
  },
  {
    'Invoice Num.': 'INV-1004',
    'Bill type': 'L1',
    'GRN date': '2026-02-14',
    'Customer.': 'Royal Enfield Hosur',
    'Customer Group': 'Eicher Group',
    'Master customer Group': 'Eicher Motors',
    'Material code': '38984',
    'Desciption': 'ABS Sensor Unit',
    'Segment': 'Passenger Vehicle',
    'RBL_Product segment': 'Electronics',
    'Sum of Sale value(Doc rate)': 843344110.76563, // 84.334411076563 Cr
    'Sum of Sale qty in nos': 8433,
    'Plant': '3600',
  },
  // L2 record that MUST be excluded
  {
    'Invoice Num.': 'INV-L2-99',
    'Bill type': 'L2',
    'GRN date': '2025-05-01',
    'Customer.': 'Excluded Customer',
    'Sum of Sale value(Doc rate)': 999999999,
    'Sum of Sale qty in nos': 999,
    'Plant': '3000',
  },
];

const result = processRawRecords(rawDataset, 'reconciliation_test.xlsx');
const clean = result.cleanRecords;

console.log(`Original Records: ${rawDataset.length}`);
console.log(`L2 Excluded: ${result.qualitySummary.l2RecordsRemoved}`);
console.log(`Clean Records Processed: ${clean.length}`);

// --- TEST 1: Exact Total Sales Calculation ---
console.log('\n--- TEST 1: Total Sales Calculation ---');
const totalSalesCr = clean.reduce((sum, r) => sum + r.saleValue, 0);
const expectedCr = 444.334411076563;

console.log(`Calculated Total Sales Cr: ${totalSalesCr}`);
console.log(`Expected Sales Cr: ${expectedCr}`);

if (Math.abs(totalSalesCr - expectedCr) < 0.000001) {
  console.log('✓ TEST 1 PASSED: Total Sales Cr strictly equals 444.334411076563 Cr.');
} else {
  console.error(`❌ TEST 1 FAILED: Expected ${expectedCr}, got ${totalSalesCr}`);
  process.exit(1);
}

// --- TEST 2: Reconciliation Across Plant Dimension ---
console.log('\n--- TEST 2: Plant Dimension Reconciliation ---');
const plantMap: Record<string, number> = {};
clean.forEach(r => {
  plantMap[r.plantName] = (plantMap[r.plantName] || 0) + r.saleValue;
});

const plantSum = Object.values(plantMap).reduce((a, b) => a + b, 0);
console.log('Plant Breakdown:', plantMap);
console.log(`Sum of Plant Sales: ${plantSum}`);

if (Math.abs(plantSum - totalSalesCr) < 0.000001) {
  console.log('✓ TEST 2 PASSED: Sum of Plant sales reconciles 100% with overall dataset total.');
} else {
  console.error(`❌ TEST 2 FAILED: Plant sum ${plantSum} != Overall total ${totalSalesCr}`);
  process.exit(1);
}

// --- TEST 3: Reconciliation Across Segment Dimension ---
console.log('\n--- TEST 3: Segment Dimension Reconciliation ---');
const segMap: Record<string, number> = {};
clean.forEach(r => {
  segMap[r.productSegment] = (segMap[r.productSegment] || 0) + r.saleValue;
});

const segSum = Object.values(segMap).reduce((a, b) => a + b, 0);
console.log('Segment Breakdown:', segMap);

if (Math.abs(segSum - totalSalesCr) < 0.000001) {
  console.log('✓ TEST 3 PASSED: Sum of Segment sales reconciles 100% with overall dataset total.');
} else {
  console.error(`❌ TEST 3 FAILED: Segment sum ${segSum} != Overall total ${totalSalesCr}`);
  process.exit(1);
}

// --- TEST 4: Reconciliation Across RBL Product Segment Dimension ---
console.log('\n--- TEST 4: RBL Product Segment Dimension Reconciliation ---');
const rblMap: Record<string, number> = {};
clean.forEach(r => {
  rblMap[r.rblProductSegment || ''] = (rblMap[r.rblProductSegment || ''] || 0) + r.saleValue;
});

const rblSum = Object.values(rblMap).reduce((a, b) => a + b, 0);
console.log('RBL Segment Breakdown:', rblMap);

if (Math.abs(rblSum - totalSalesCr) < 0.000001) {
  console.log('✓ TEST 4 PASSED: Sum of RBL Product Segment sales reconciles 100% with overall total.');
} else {
  console.error(`❌ TEST 4 FAILED: RBL sum ${rblSum} != Overall total ${totalSalesCr}`);
  process.exit(1);
}

// --- TEST 5: Reconciliation Across Customer & Master Group Hierarchy ---
console.log('\n--- TEST 5: Customer & Master Group Hierarchy Reconciliation ---');
const masterMap: Record<string, number> = {};
clean.forEach(r => {
  masterMap[r.masterCustomerGroup] = (masterMap[r.masterCustomerGroup] || 0) + r.saleValue;
});

const masterSum = Object.values(masterMap).reduce((a, b) => a + b, 0);
console.log('Master Group Breakdown:', masterMap);

if (Math.abs(masterSum - totalSalesCr) < 0.000001) {
  console.log('✓ TEST 5 PASSED: Sum of Master Customer Group sales reconciles 100% with overall total.');
} else {
  console.error(`❌ TEST 5 FAILED: Master Group sum ${masterSum} != Overall total ${totalSalesCr}`);
  process.exit(1);
}

// --- TEST 6: Reconciliation Across Financial Year, Quarter, and Month ---
console.log('\n--- TEST 6: Time Dimension Reconciliation (FY, Quarter, Month) ---');
const fyMap: Record<string, number> = {};
const qMap: Record<string, number> = {};
const mMap: Record<string, number> = {};

clean.forEach(r => {
  fyMap[r.financialYear] = (fyMap[r.financialYear] || 0) + r.saleValue;
  qMap[r.quarter] = (qMap[r.quarter] || 0) + r.saleValue;
  mMap[r.month] = (mMap[r.month] || 0) + r.saleValue;
});

const fySum = Object.values(fyMap).reduce((a, b) => a + b, 0);
const qSum = Object.values(qMap).reduce((a, b) => a + b, 0);
const mSum = Object.values(mMap).reduce((a, b) => a + b, 0);

if (
  Math.abs(fySum - totalSalesCr) < 0.000001 &&
  Math.abs(qSum - totalSalesCr) < 0.000001 &&
  Math.abs(mSum - totalSalesCr) < 0.000001
) {
  console.log('✓ TEST 6 PASSED: Time breakdowns (FY, Quarter, Month) all reconcile 100% with overall total.');
} else {
  console.error('❌ TEST 6 FAILED: Time dimension mismatch!', { fySum, qSum, mSum, totalSalesCr });
  process.exit(1);
}

console.log('\n🎉 ALL RECONCILIATION & FINANCIAL INTEGRITY TESTS PASSED 100% SUCCESSFULLY!');
