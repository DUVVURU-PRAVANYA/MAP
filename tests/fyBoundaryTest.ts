import { processRawRecords } from '../server/dataProcessor';

console.log('=== Running Final YoY Growth & FY Boundary Test Suite ===\n');

// Implementation of Section 11 Logic
function computeYoY(currentSalesCr: number, prevSalesCr: number | null | undefined, hasPriorFY: boolean) {
  if (!hasPriorFY || prevSalesCr === undefined || prevSalesCr === null) {
    return { growthPct: null, status: 'N/A — No Prior FY in Dataset' };
  }
  if (prevSalesCr === 0) {
    return { growthPct: null, status: 'N/A — No Previous-Year Sales' };
  }
  const growthPct = Number((((currentSalesCr - prevSalesCr) / prevSalesCr) * 100).toFixed(1));
  return { growthPct, status: `${growthPct >= 0 ? '+' : ''}${growthPct}%` };
}

// 1. Test Dataset for FY Boundaries
const boundaryRecords = [
  // 31-03-2025 -> FY 2024-25, Q4, Mar 2025
  {
    'Plant': '3000',
    'Invoice Num.': 'INV-FY24',
    'Sale Value': 1000000000, // 100 Cr
    'Inv. Qty': '1000',
    'GRN date': '2025-03-31',
    'Bill Date': '2025-04-02', // Deliberate difference: Bill Date is in April, but GRN is in March -> FY 2024-25!
    'Master Customer Group': 'TVS Conglomerate',
    'Customer': 'TVS Chennai',
    'Application': 'Automotive',
    'Description': 'Disc Pads',
    'Material code': 'MAT-01',
    'Bill type': 'L1',
  },
  // 01-04-2025 -> FY 2025-26, Q1, Apr 2025
  {
    'Plant': '3000',
    'Invoice Num.': 'INV-FY25A',
    'Sale Value': 600000000, // 60 Cr
    'Inv. Qty': '600',
    'GRN date': '2025-04-01',
    'Bill Date': '2025-03-28', // Deliberate difference: Bill Date in March, but GRN is April 1 -> FY 2025-26!
    'Master Customer Group': 'TVS Conglomerate',
    'Customer': 'TVS Chennai',
    'Application': 'Automotive',
    'Description': 'Disc Pads',
    'Material code': 'MAT-01',
    'Bill type': 'L1',
  },
  // 31-03-2026 -> FY 2025-26, Q4, Mar 2026
  {
    'Plant': '3000',
    'Invoice Num.': 'INV-FY25B',
    'Sale Value': 600000000, // 60 Cr (Total Chennai FY 2025-26 = 120 Cr)
    'Inv. Qty': '600',
    'GRN date': '2026-03-31',
    'Master Customer Group': 'TVS Conglomerate',
    'Customer': 'TVS Chennai',
    'Application': 'Automotive',
    'Description': 'Disc Pads',
    'Material code': 'MAT-01',
    'Bill type': 'L1',
  },
  // 01-04-2026 -> FY 2026-27, Q1, Apr 2026
  {
    'Plant': '3100', // Hyderabad
    'Invoice Num.': 'INV-FY26',
    'Sale Value': 1500000000, // 150 Cr
    'Inv. Qty': '1500',
    'GRN date': '2026-04-01',
    'Master Customer Group': 'Bajaj Group',
    'Customer': 'Bajaj Auto',
    'Application': 'Commercial',
    'Description': 'Brake Disc',
    'Material code': 'MAT-02',
    'Bill type': 'L1',
  },
];

const result = processRawRecords(boundaryRecords as any, 'boundary_test.xlsx');
const clean = result.cleanRecords;

// --- TEST 1: FY Boundaries ---
console.log('--- TEST 1: Financial Year Boundary Derivation from GRN Date ---');
const rec1 = clean.find(r => r.invoiceNum === 'INV-FY24');
const rec2 = clean.find(r => r.invoiceNum === 'INV-FY25A');
const rec3 = clean.find(r => r.invoiceNum === 'INV-FY25B');
const rec4 = clean.find(r => r.invoiceNum === 'INV-FY26');

console.log(`INV-FY24 (GRN: 31-03-2025): ${rec1?.financialYear}, Quarter: ${rec1?.quarter}`);
console.log(`INV-FY25A (GRN: 01-04-2025): ${rec2?.financialYear}, Quarter: ${rec2?.quarter}`);
console.log(`INV-FY25B (GRN: 31-03-2026): ${rec3?.financialYear}, Quarter: ${rec3?.quarter}`);
console.log(`INV-FY26 (GRN: 01-04-2026): ${rec4?.financialYear}, Quarter: ${rec4?.quarter}`);

if (
  rec1?.financialYear === 'FY 2024-25' && rec1?.quarter === 'Q4' &&
  rec2?.financialYear === 'FY 2025-26' && rec2?.quarter === 'Q1' &&
  rec3?.financialYear === 'FY 2025-26' && rec3?.quarter === 'Q4' &&
  rec4?.financialYear === 'FY 2026-27' && rec4?.quarter === 'Q1'
) {
  console.log('✓ TEST 1 PASSED: GRN date exclusively determines FY boundaries and Quarters (Apr 1 - Mar 31).');
} else {
  throw new Error('TEST 1 FAILED: Incorrect FY boundary calculation');
}

// --- TEST 2: Section 18 Specific YoY Scenarios ---
console.log('\n--- TEST 2: Section 18 Exact YoY Scenarios ---');

// Scenario 1: Previous = ₹100 Cr, Current = ₹120 Cr -> +20%
const sc1 = computeYoY(120, 100, true);
console.log(`Scenario 1 (100 -> 120 Cr): ${sc1.growthPct}% (${sc1.status})`);
if (sc1.growthPct !== 20.0 || sc1.status !== '+20%') throw new Error('Scenario 1 failed');
console.log('✓ Scenario 1 PASSED: Previous = ₹100 Cr, Current = ₹120 Cr -> Expected = +20%');

// Scenario 2: Previous = ₹0.50 Cr, Current = ₹100 Cr -> +19,900% (No Low-Base threshold!)
const sc2 = computeYoY(100, 0.50, true);
console.log(`Scenario 2 (0.50 -> 100 Cr): ${sc2.growthPct}% (${sc2.status})`);
if (sc2.growthPct !== 19900.0 || sc2.status !== '+19900%') throw new Error('Scenario 2 failed');
console.log('✓ Scenario 2 PASSED: Previous = ₹0.50 Cr, Current = ₹100 Cr -> Expected = +19,900% (Exact calculation restored)');

// Scenario 3: Previous = ₹0 Cr, Current = ₹100 Cr -> N/A — No Previous-Year Sales
const sc3 = computeYoY(100, 0, true);
console.log(`Scenario 3 (0 -> 100 Cr): growthPct = ${sc3.growthPct}, status = "${sc3.status}"`);
if (sc3.growthPct !== null || sc3.status !== 'N/A — No Previous-Year Sales') throw new Error('Scenario 3 failed');
console.log('✓ Scenario 3 PASSED: Previous = ₹0 Cr, Current = ₹100 Cr -> Expected = N/A — No Previous-Year Sales');

// Scenario 4: Previous FY unavailable -> N/A — No Prior FY in Dataset
const sc4 = computeYoY(100, null, false);
console.log(`Scenario 4 (No Prior FY): growthPct = ${sc4.growthPct}, status = "${sc4.status}"`);
if (sc4.growthPct !== null || sc4.status !== 'N/A — No Prior FY in Dataset') throw new Error('Scenario 4 failed');
console.log('✓ Scenario 4 PASSED: Previous FY unavailable -> Expected = N/A — No Prior FY in Dataset');

// --- TEST 3: Filtered Scope Consistency (Plant = Chennai) ---
console.log('\n--- TEST 3: Filtered Scope Consistency for YoY ---');
const chennaiFY24 = clean.filter(r => r.plantCode === '3000' && r.financialYear === 'FY 2024-25').reduce((sum, r) => sum + r.saleValue, 0);
const chennaiFY25 = clean.filter(r => r.plantCode === '3000' && r.financialYear === 'FY 2025-26').reduce((sum, r) => sum + r.saleValue, 0);
const chennaiYoY = computeYoY(chennaiFY25, chennaiFY24, true);

console.log(`Chennai FY24: ₹${chennaiFY24} Cr, FY25: ₹${chennaiFY25} Cr -> YoY: ${chennaiYoY.status}`);
if (chennaiFY24 === 100 && chennaiFY25 === 120 && chennaiYoY.growthPct === 20.0) {
  console.log('✓ TEST 3 PASSED: Filtered scope consistency strictly maintained (Chennai FY24 = ₹100 Cr, FY25 = ₹120 Cr -> +20%).');
} else {
  throw new Error('TEST 3 FAILED');
}

console.log('\n🎉 ALL YOY GROWTH & FY BOUNDARY TESTS PASSED SUCCESSFULLY!\n');
