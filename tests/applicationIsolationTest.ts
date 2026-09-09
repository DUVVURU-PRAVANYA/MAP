import { processRawRecords } from '../server/dataProcessor';

console.log('=== Running Application Column vs Description Isolation Test Suite ===\n');

// Mock raw dataset containing genuine Application values separate from Product Descriptions
const mockRawRecords = [
  {
    'Plant': '3000',
    'Invoice Num.': 'INV-101',
    'Sale Value': 400000000, // 40 Cr
    'Inv. Qty': '500',
    'GRN date': '2025-05-10',
    'Master Customer Group': 'TVS Conglomerate',
    'Customer': 'TVS Motor',
    'Application': '2 Wheeler Commuter',
    'Description': 'Disc Pads Front',
    'Material code': 'MAT-D01',
    'Bill type': 'L1',
  },
  {
    'Plant': '3000',
    'Invoice Num.': 'INV-102',
    'Sale Value': 300000000, // 30 Cr
    'Inv. Qty': '400',
    'GRN date': '2025-06-15',
    'Master Customer Group': 'Hero Group',
    'Customer': 'Hero MotoCorp',
    'Application': '2 Wheeler Commuter',
    'Description': 'Brake Linings Heavy',
    'Material code': 'MAT-L02',
    'Bill type': 'L1',
  },
  {
    'Plant': '3100',
    'Invoice Num.': 'INV-103',
    'Sale Value': 200000000, // 20 Cr
    'Inv. Qty': '300',
    'GRN date': '2025-07-20',
    'Master Customer Group': 'Bajaj Group',
    'Customer': 'Bajaj Auto',
    'Application': 'Passenger 3W Rickshaw',
    'Description': 'Brake Shoe Rear',
    'Material code': 'MAT-S03',
    'Bill type': 'L1',
  },
  {
    'Plant': '3200',
    'Invoice Num.': 'INV-104',
    'Sale Value': 100000000, // 10 Cr
    'Inv. Qty': '200',
    'GRN date': '2025-08-25',
    'Master Customer Group': 'Tata Group',
    'Customer': 'Tata Motors',
    'Application': 'Heavy Duty Commercial Truck',
    'Description': 'Clutch Facings',
    'Material code': 'MAT-C04',
    'Bill type': 'L1',
  },
  {
    'Plant': '3600',
    'Invoice Num.': 'INV-105',
    'Sale Value': 50000000, // 5 Cr
    'Inv. Qty': '100',
    'GRN date': '2025-09-30',
    'Master Customer Group': 'Mahindra Group',
    'Customer': 'Mahindra & Mahindra',
    'Application': '', // Blank application test
    'Description': 'Clutch Buttons',
    'Material code': 'MAT-B05',
    'Bill type': 'L1',
  },
];

const result = processRawRecords(mockRawRecords as any, 'application_test.xlsx');
const records = result.cleanRecords;

// --- TEST 1: Application Column Extraction Integrity ---
console.log('--- TEST 1: Application Column Values Integrity ---');
const applications = records.map(r => r.application);
console.log('Parsed Application column values:', applications);

// Verify that 'Disc Pads Front', 'Brake Linings Heavy' are NOT in application!
const hasDescriptionInApp = applications.some(app =>
  app.includes('Disc Pads') || app.includes('Brake Linings') || app.includes('Brake Shoe') || app.includes('Clutch Facings')
);

if (hasDescriptionInApp) {
  throw new Error('TEST 1 FAILED: Product descriptions were incorrectly mapped into the Application column!');
}
console.log('✓ TEST 1 PASSED: Product descriptions are NOT present in the Application column.');

// --- TEST 2: Genuine Application Values Present ---
console.log('\n--- TEST 2: Genuine Application Values Presence ---');
const uniqueApps = Array.from(new Set(records.map(r => r.application).filter(Boolean)));
console.log('Unique genuine applications:', uniqueApps);

if (
  uniqueApps.includes('2 Wheeler Commuter') &&
  uniqueApps.includes('Passenger 3W Rickshaw') &&
  uniqueApps.includes('Heavy Duty Commercial Truck')
) {
  console.log('✓ TEST 2 PASSED: Genuine application values correctly parsed from Application column.');
} else {
  throw new Error(`TEST 2 FAILED: Missing expected applications. Found: ${JSON.stringify(uniqueApps)}`);
}

// --- TEST 3: Top 10 Applications Aggregation & Percentage Calculation ---
console.log('\n--- TEST 3: Application Ranking & Contribution % Calculation ---');
const totalCleanSales = records.reduce((sum, r) => sum + r.saleValue, 0); // 40 + 30 + 20 + 10 + 5 = 105 Cr
console.log(`Total Clean Sales: ₹${totalCleanSales.toFixed(2)} Cr`);

const appMap: Record<string, { application: string; sales: number; qty: number }> = {};
records.forEach(r => {
  const app = r.application ? r.application.trim() : '';
  if (!app) return; // Blank ignored
  if (!appMap[app]) appMap[app] = { application: app, sales: 0, qty: 0 };
  appMap[app].sales += r.saleValue;
  appMap[app].qty += r.saleQty;
});

const topApps = Object.values(appMap)
  .sort((a, b) => b.sales - a.sales)
  .map((item, idx) => ({
    application: item.application,
    sales: item.sales,
    salesContributionPct: Number(((item.sales / totalCleanSales) * 100).toFixed(1)),
    rank: idx + 1,
  }));

console.log('Top Applications:', topApps);

// '2 Wheeler Commuter' should be #1 with 70 Cr (40 + 30) -> 70 / 105 * 100 = 66.7%
const top1 = topApps[0];
if (top1.application === '2 Wheeler Commuter' && top1.sales === 70 && top1.salesContributionPct === 66.7) {
  console.log('✓ TEST 3 PASSED: Top application is "2 Wheeler Commuter" (₹70.00 Cr, 66.7% contribution).');
} else {
  throw new Error(`TEST 3 FAILED: Top 1 was ${JSON.stringify(top1)}`);
}

// --- TEST 4: Top 10 Products remains strictly based on Description ---
console.log('\n--- TEST 4: Top Products remains strictly based on Description ---');
const prodMap: Record<string, number> = {};
records.forEach(r => {
  const desc = r.description.trim();
  prodMap[desc] = (prodMap[desc] || 0) + r.saleValue;
});
const topProds = Object.entries(prodMap).sort((a, b) => b[1] - a[1]);
console.log('Top Products by Description:', topProds);
if (topProds[0][0] === 'Disc Pads Front' && topProds[0][1] === 40) {
  console.log('✓ TEST 4 PASSED: Top Products remains strictly grouped by Description (Disc Pads Front = ₹40 Cr).');
} else {
  throw new Error(`TEST 4 FAILED: Top product was ${JSON.stringify(topProds[0])}`);
}

console.log('\n🎉 ALL APPLICATION ISOLATION TESTS PASSED SUCCESSFULLY!\n');
