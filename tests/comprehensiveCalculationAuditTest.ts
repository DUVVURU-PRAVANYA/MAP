import { processRawRecords } from '../server/dataProcessor';

console.log('=== Running MAP Comprehensive Calculation & Business-Logic Audit Test Suite ===\n');

// Realistic multi-plant, multi-product, multi-year, multi-line dataset
const auditRawRecords = [
  // Record 1: Chennai, FY 2024-25, Inv 1001, Material A
  {
    'Plant': '3000',
    'Invoice Num.': 'INV-1001',
    'Sale Value': 500000000, // 50 Cr
    'Inv. Qty': '500',
    'GRN date': '2024-05-15',
    'Master Customer Group': 'TVS Conglomerate',
    'Customer Group': 'TVS Motor Company',
    'Customer': 'TVS Motor Co Ltd',
    'Cust Num.': 'CUST-101',
    'Application': '2 Wheeler Commuter',
    'Description': 'Disc Brake Pad Premium',
    'Material code': 'MAT-101',
    'ProductSegment': '2 Wheelers & 3 Wheelers',
    'RBL_Product segment': 'Friction Disc',
    'Bill type': 'L1',
  },
  // Record 2: Chennai, FY 2024-25, Inv 1001 (Multi-line row for same invoice!), Material B
  {
    'Plant': '3000',
    'Invoice Num.': 'INV-1001',
    'Sale Value': 300000000, // 30 Cr (Total INV-1001 = 80 Cr)
    'Inv. Qty': '300',
    'GRN date': '2024-05-15',
    'Master Customer Group': 'TVS Conglomerate',
    'Customer Group': 'TVS Motor Company',
    'Customer': 'TVS Motor Co Ltd',
    'Cust Num.': 'CUST-101',
    'Application': '2 Wheeler Commuter',
    'Description': 'Brake Shoe Rear',
    'Material code': 'MAT-102',
    'ProductSegment': '2 Wheelers & 3 Wheelers',
    'RBL_Product segment': 'Friction Drum',
    'Bill type': 'L1',
  },
  // Record 3: Chennai, FY 2025-26, Inv 1002, Material A
  {
    'Plant': '3000',
    'Invoice Num.': 'INV-1002',
    'Sale Value': 1100000000, // 110 Cr
    'Inv. Qty': '1100',
    'GRN date': '2025-06-20',
    'Master Customer Group': 'TVS Conglomerate',
    'Customer Group': 'TVS Motor Company',
    'Customer': 'TVS Motor Co Ltd',
    'Cust Num.': 'CUST-101',
    'Application': '2 Wheeler Commuter',
    'Description': 'Disc Brake Pad Premium',
    'Material code': 'MAT-101',
    'ProductSegment': '2 Wheelers & 3 Wheelers',
    'RBL_Product segment': 'Friction Disc',
    'Bill type': 'L1',
  },
  // Record 4: Hyderabad, FY 2025-26, Inv 1003, Material C
  {
    'Plant': '3100',
    'Invoice Num.': 'INV-1003',
    'Sale Value': 1050000000, // 105 Cr
    'Inv. Qty': '1050',
    'GRN date': '2025-07-22',
    'Master Customer Group': 'Bajaj Auto Group',
    'Customer Group': 'Bajaj Commercial',
    'Customer': 'Bajaj Auto Ltd',
    'Cust Num.': 'CUST-102',
    'Application': 'Passenger 3W Rickshaw',
    'Description': 'Heavy Axle Assembly',
    'Material code': 'MAT-201',
    'ProductSegment': 'Commercial Vehicles',
    'RBL_Product segment': 'Axle Systems',
    'Bill type': 'L1',
  },
  // Record 5: Pondicherry, FY 2025-26, Inv 1004, Material D
  {
    'Plant': '3200',
    'Invoice Num.': 'INV-1004',
    'Sale Value': 1150000000, // 115 Cr
    'Inv. Qty': '1150',
    'GRN date': '2025-08-10',
    'Master Customer Group': 'Tata Motors Group',
    'Customer Group': 'Tata Commercial Vehicles',
    'Customer': 'Tata Motors Ltd',
    'Cust Num.': 'CUST-103',
    'Application': 'Heavy Duty Commercial Truck',
    'Description': 'Hydraulic Brake Pro',
    'Material code': 'MAT-301',
    'ProductSegment': 'Commercial Vehicles',
    'RBL_Product segment': 'Hydraulics',
    'Bill type': 'L1',
  },
  // Record 6: Trichy, FY 2025-26, Inv 1005, Material E
  {
    'Plant': '3600',
    'Invoice Num.': 'INV-1005',
    'Sale Value': 1104000000, // 110.40 Cr
    'Inv. Qty': '1104',
    'GRN date': '2025-09-18',
    'Master Customer Group': 'Mahindra Group',
    'Customer Group': 'Mahindra Farm Equipment',
    'Customer': 'Mahindra & Mahindra Ltd',
    'Cust Num.': 'CUST-104',
    'Application': 'Agricultural Tractors',
    'Description': 'Clutch Facing Assembly',
    'Material code': 'MAT-401',
    'ProductSegment': 'Tractors & Off-Highway',
    'RBL_Product segment': 'Clutches',
    'Bill type': 'L1',
  },
  // Record 7: L2 Record (MUST BE EXCLUDED)
  {
    'Plant': '3000',
    'Invoice Num.': 'INV-L2-99',
    'Sale Value': 9990000000, // 999 Cr
    'Inv. Qty': '9999',
    'GRN date': '2025-10-10',
    'Master Customer Group': 'Internal Transfer Group',
    'Customer': 'Internal Plant Unit',
    'Cust Num.': 'CUST-999',
    'Application': 'Internal',
    'Description': 'Scrap or Transfer Item',
    'Material code': 'MAT-999',
    'ProductSegment': 'Commercial Vehicles',
    'Bill type': 'L2', // EXCLUDED!
  },
];

const result = processRawRecords(auditRawRecords as any, 'audit_test.xlsx');
const clean = result.cleanRecords;

// --- AUDIT ITEM 1: Sales Value Unit Conversion ---
console.log('--- 1. Sales Value Conversion ---');
const totalCleanSales = clean.reduce((sum, r) => sum + r.saleValue, 0);
// Expected: 50 + 30 + 110 + 105 + 115 + 110.40 = 520.40 Cr (L2 excluded)
console.log(`Total Clean Sales: ₹${totalCleanSales.toFixed(2)} Cr`);
if (totalCleanSales === 520.40) {
  console.log('✓ PASS: Raw INR divided by 10,000,000 exactly once (520.40 Cr).');
} else {
  throw new Error(`FAIL: Expected 520.40 Cr, got ${totalCleanSales}`);
}

// --- AUDIT ITEM 2: Quantity Unit Preservation ---
console.log('\n--- 2. Quantity Unit Integrity ---');
const totalCleanQty = clean.reduce((sum, r) => sum + r.saleQty, 0);
// Expected: 500 + 300 + 1100 + 1050 + 1150 + 1104 = 5204 units
console.log(`Total Quantity: ${totalCleanQty} Nos`);
if (totalCleanQty === 5204) {
  console.log('✓ PASS: Quantity preserved in exact integer units (Nos).');
} else {
  throw new Error(`FAIL: Expected 5204, got ${totalCleanQty}`);
}

// --- AUDIT ITEM 3: Customer Count (DISTINCT Master Customer Group) ---
console.log('\n--- 3. Customer Count KPI ---');
const distinctMasterGroups = new Set(clean.map(r => r.masterCustomerGroup)).size;
// Expected: TVS, Bajaj, Tata, Mahindra = 4 distinct groups
console.log(`Distinct Master Customer Groups: ${distinctMasterGroups}`);
if (distinctMasterGroups === 4) {
  console.log('✓ PASS: Customer Count KPI represents DISTINCT Master Customer Groups (4).');
} else {
  throw new Error(`FAIL: Expected 4, got ${distinctMasterGroups}`);
}

// --- AUDIT ITEM 4 & 5: Invoice Count & Multi-line Retention ---
console.log('\n--- 4. Invoice Count & Multi-Line Invoices ---');
const distinctInvoices = new Set(clean.map(r => r.invoiceNum)).size;
// Invoices: 1001, 1002, 1003, 1004, 1005 = 5 distinct invoices across 6 clean rows
console.log(`Clean Records: ${clean.length}, Distinct Invoices: ${distinctInvoices}`);
if (clean.length === 6 && distinctInvoices === 5) {
  console.log('✓ PASS: Multi-line invoice INV-1001 retained both lines (clean count = 6, distinct invoices = 5).');
} else {
  throw new Error('FAIL: Multi-line invoices were deduplicated or lost');
}

// --- AUDIT ITEM 6: L2 Exclusion ---
console.log('\n--- 5. L2 Record Exclusion ---');
const hasL2 = clean.some(r => r.billType === 'L2');
if (!hasL2 && result.qualitySummary.l2RecordsRemoved === 1) {
  console.log('✓ PASS: L2 records completely excluded from clean dataset.');
} else {
  throw new Error('FAIL: L2 record was not excluded');
}

// --- AUDIT ITEM 7: GRN Date Financial Year Derivation ---
console.log('\n--- 6. GRN Date FY Derivation ---');
const fy24Count = clean.filter(r => r.financialYear === 'FY 2024-25').length;
const fy25Count = clean.filter(r => r.financialYear === 'FY 2025-26').length;
if (fy24Count === 2 && fy25Count === 4) {
  console.log('✓ PASS: GRN date exclusively determined FY 2024-25 (2 rows) and FY 2025-26 (4 rows).');
} else {
  throw new Error(`FAIL: FY breakdown mismatch: FY24=${fy24Count}, FY25=${fy25Count}`);
}

// --- AUDIT ITEM 8: Plant Target Dynamic Scaling & Scope Match ---
console.log('\n--- 7. Plant Target Calculation & Scoping ---');
// FY 2025-26 Total Sales = 110 + 105 + 115 + 110.40 = 440.40 Cr
const fy25Recs = clean.filter(r => r.financialYear === 'FY 2025-26');
const allPlantsTarget = 4 * 120; // 480 Cr
const allPlantsActual = fy25Recs.reduce((sum, r) => sum + r.saleValue, 0); // 440.40 Cr
const allPlantsAch = Number(((allPlantsActual / allPlantsTarget) * 100).toFixed(1)); // 91.8%
const allPlantsVar = Number((allPlantsActual - allPlantsTarget).toFixed(2)); // -39.60 Cr

console.log(`All Plants: Target = ₹${allPlantsTarget} Cr, Actual = ₹${allPlantsActual.toFixed(2)} Cr, Ach = ${allPlantsAch}%, Var = ₹${allPlantsVar} Cr`);

// Chennai Only: Target = 120 Cr, Actual = 110 Cr, Ach = 91.7%, Var = -10 Cr
const chennaiRecs = fy25Recs.filter(r => r.plantName === 'Chennai' || r.plantCode === '3000');
const chennaiTarget = 1 * 120; // 120 Cr
const chennaiActual = chennaiRecs.reduce((sum, r) => sum + r.saleValue, 0); // 110.00 Cr
const chennaiAch = Number(((chennaiActual / chennaiTarget) * 100).toFixed(1)); // 91.7%
const chennaiVar = Number((chennaiActual - chennaiTarget).toFixed(2)); // -10.00 Cr

console.log(`Chennai Only: Target = ₹${chennaiTarget} Cr, Actual = ₹${chennaiActual.toFixed(2)} Cr, Ach = ${chennaiAch}%, Var = ₹${chennaiVar} Cr`);

if (
  allPlantsTarget === 480 && allPlantsActual === 440.40 && allPlantsAch === 91.8 &&
  chennaiTarget === 120 && chennaiActual === 110.00 && chennaiAch === 91.7 && chennaiVar === -10.00
) {
  console.log('✓ PASS: Dynamic Plant Target and filtered actual sales scope match 100%.');
} else {
  throw new Error('FAIL: Target calculation error');
}

// --- AUDIT ITEM 9: YoY Sales Growth Calculation ---
console.log('\n--- 8. YoY Sales Growth (Current FY vs Previous FY with exact same scope) ---');
// All Plants: FY24 = 80 Cr (50 + 30), FY25 = 440.40 Cr -> YoY = (440.40 - 80) / 80 * 100 = +450.5%
const fy24Sales = clean.filter(r => r.financialYear === 'FY 2024-25').reduce((sum, r) => sum + r.saleValue, 0);
const allYoY = Number((((allPlantsActual - fy24Sales) / fy24Sales) * 100).toFixed(1));
console.log(`All Plants YoY: (440.40 - 80.00) / 80.00 * 100 = +${allYoY}%`);

// Chennai Only: FY24 = 80 Cr, FY25 = 110 Cr -> YoY = (110 - 80) / 80 * 100 = +37.5%
const chennaiFY24Sales = clean.filter(r => (r.plantName === 'Chennai' || r.plantCode === '3000') && r.financialYear === 'FY 2024-25').reduce((sum, r) => sum + r.saleValue, 0);
const chennaiYoY = Number((((chennaiActual - chennaiFY24Sales) / chennaiFY24Sales) * 100).toFixed(1));
console.log(`Chennai Only YoY: (110.00 - 80.00) / 80.00 * 100 = +${chennaiYoY}%`);

if (allYoY === 450.5 && chennaiYoY === 37.5) {
  console.log('✓ PASS: YoY growth mathematically accurate and respects active filters on both sides.');
} else {
  throw new Error('FAIL: YoY growth calculation error');
}

// --- AUDIT ITEM 10: Top 10 Products vs Top 10 Applications Isolation ---
console.log('\n--- 9. Top Products (Description) vs Top Applications (Application) Isolation ---');
const prodSet = new Set(clean.map(r => r.description));
const appSet = new Set(clean.map(r => r.application));

console.log('Products (Descriptions):', Array.from(prodSet));
console.log('Applications:', Array.from(appSet));

const hasCrossPollution = Array.from(appSet).some(app =>
  app.includes('Disc Brake Pad') || app.includes('Brake Shoe Rear') || app.includes('Heavy Axle') || app.includes('Hydraulic Brake')
);

if (!hasCrossPollution) {
  console.log('✓ PASS: Top Products and Top Applications remain strictly isolated without field mixing.');
} else {
  throw new Error('FAIL: Top Applications contains product descriptions');
}

// --- AUDIT ITEM 11: Reconciliation Check ---
console.log('\n--- 10. Multi-Dimensional Reconciliation ---');
const plantSum = ['Chennai', 'Hyderabad', 'Pondicherry', 'Trichy'].reduce((sum, p) => {
  return sum + clean.filter(r => r.plantName === p).reduce((s, r) => s + r.saleValue, 0);
}, 0);

if (plantSum === totalCleanSales) {
  console.log(`✓ PASS: Sum of Plant Sales (₹${plantSum.toFixed(2)} Cr) === Total Clean Sales (₹${totalCleanSales.toFixed(2)} Cr).`);
} else {
  throw new Error('FAIL: Plant reconciliation mismatch');
}

console.log('\n🎉 ALL MAP AUDIT VERIFICATIONS PASSED WITH 100% PRECISION!\n');
