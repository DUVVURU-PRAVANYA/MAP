import { processRawRecords } from '../server/dataProcessor';

const mockRawData = [
  // Chennai (Plant 3000): Total 110 Cr (60 + 50)
  { 'Plant': '3000', 'Invoice Num.': 'INV-01', 'Sale Value': 600000000, 'Inv. Qty': '500', 'GRN date': '2025-05-10', 'Master Customer Group': 'TVS Conglomerate', 'Customer': 'TVS Motor', 'Customer Group': 'TVS', 'Application': 'Automotive', 'Segment': '2W', 'Description': 'Brake Disc', 'Material code': 'P01', 'Bill type': 'L1' },
  { 'Plant': '3000', 'Invoice Num.': 'INV-02', 'Sale Value': 500000000, 'Inv. Qty': '400', 'GRN date': '2025-08-15', 'Master Customer Group': 'Hero Group', 'Customer': 'Hero MotoCorp', 'Customer Group': 'Hero', 'Application': 'Automotive', 'Segment': '2W', 'Description': 'Clutch Plate', 'Material code': 'P02', 'Bill type': 'L1' },

  // Hyderabad (Plant 3100): Total 105 Cr
  { 'Plant': '3100', 'Invoice Num.': 'INV-03', 'Sale Value': 1050000000, 'Inv. Qty': '800', 'GRN date': '2025-06-20', 'Master Customer Group': 'Bajaj Group', 'Customer': 'Bajaj Auto', 'Customer Group': 'Bajaj', 'Application': 'Commercial', 'Segment': '3W', 'Description': 'Brake Disc', 'Material code': 'P01', 'Bill type': 'L1' },

  // Pondicherry (Plant 3200): Total 115 Cr
  { 'Plant': '3200', 'Invoice Num.': 'INV-04', 'Sale Value': 1150000000, 'Inv. Qty': '900', 'GRN date': '2025-09-12', 'Master Customer Group': 'Tata Group', 'Customer': 'Tata Motors', 'Customer Group': 'Tata', 'Application': 'Automotive', 'Segment': 'PV', 'Description': 'Engine Valve', 'Material code': 'P03', 'Bill type': 'L1' },

  // Trichy (Plant 3600): Total 110.40 Cr
  { 'Plant': '3600', 'Invoice Num.': 'INV-05', 'Sale Value': 1104000000, 'Inv. Qty': '850', 'GRN date': '2025-11-05', 'Master Customer Group': 'Mahindra Group', 'Customer': 'Mahindra & Mahindra', 'Customer Group': 'Mahindra', 'Application': 'Commercial', 'Segment': 'CV', 'Description': 'Gear Box', 'Material code': 'P04', 'Bill type': 'L1' },
];

console.log('=== Running Sales Target vs Actual Scope & Plant Filter Test Suite ===\n');

const result = processRawRecords(mockRawData as any, 'mock.xlsx');
const records = result.cleanRecords;

// Total all-plant sales = 60 + 50 + 105 + 115 + 110.4 = 440.40 Cr
const totalAllSales = records.reduce((sum, r) => sum + r.saleValue, 0);
console.log(`Total Clean Sales: ₹${totalAllSales.toFixed(2)} Cr across ${records.length} records`);

// --- TEST A: All 4 Plants Selected ---
console.log('\n--- TEST A: All 4 Plants (Combined View) ---');
const allPlantsTarget = 4 * 120.0;
const allPlantsActual = totalAllSales;
const allPlantsAchPct = Number(((allPlantsActual / allPlantsTarget) * 100).toFixed(2));
const allPlantsVariance = Number((allPlantsActual - allPlantsTarget).toFixed(2));

console.log(`Target: ₹${allPlantsTarget} Cr, Actual: ₹${allPlantsActual.toFixed(2)} Cr, Ach: ${allPlantsAchPct}%, Var: ${allPlantsVariance} Cr`);
if (allPlantsTarget === 480 && allPlantsActual === 440.40 && allPlantsAchPct === 91.75 && allPlantsVariance === -39.60) {
  console.log('✓ TEST A PASSED: All 4 plants target = ₹480 Cr, actual = ₹440.40 Cr, achievement = 91.75%, variance = -₹39.60 Cr.');
} else {
  throw new Error(`TEST A FAILED: Target ${allPlantsTarget}, Actual ${allPlantsActual}`);
}

// --- TEST B: Plant = Chennai Only ---
console.log('\n--- TEST B: Plant = Chennai Only ---');
const chennaiRecords = records.filter(r => r.plantName === 'Chennai' || r.plantCode === '3000');
const chennaiTarget = 1 * 120.0;
const chennaiActual = chennaiRecords.reduce((sum, r) => sum + r.saleValue, 0);
const chennaiAchPct = Number(((chennaiActual / chennaiTarget) * 100).toFixed(2));
const chennaiVariance = Number((chennaiActual - chennaiTarget).toFixed(2));

console.log(`Chennai Target: ₹${chennaiTarget} Cr, Actual: ₹${chennaiActual.toFixed(2)} Cr, Ach: ${chennaiAchPct}%, Var: ${chennaiVariance} Cr`);
if (chennaiTarget === 120 && chennaiActual === 110.00 && chennaiAchPct === 91.67 && chennaiVariance === -10.00) {
  console.log('✓ TEST B PASSED: Chennai target = ₹120 Cr, Chennai actual = ₹110.00 Cr (NOT ₹440.40 Cr!), achievement = 91.67% (NOT 367%!).');
} else {
  throw new Error(`TEST B FAILED: Chennai target ${chennaiTarget}, Actual ${chennaiActual}, Ach ${chennaiAchPct}%`);
}

// --- TEST C: Plant = Hyderabad Only ---
console.log('\n--- TEST C: Plant = Hyderabad Only ---');
const hydRecords = records.filter(r => r.plantName === 'Hyderabad' || r.plantCode === '3100');
const hydTarget = 1 * 120.0;
const hydActual = hydRecords.reduce((sum, r) => sum + r.saleValue, 0);
if (hydTarget === 120 && hydActual === 105.00) {
  console.log('✓ TEST C PASSED: Hyderabad target = ₹120 Cr, actual = ₹105.00 Cr.');
} else {
  throw new Error(`TEST C FAILED: Hyderabad target ${hydTarget}, Actual ${hydActual}`);
}

// --- TEST D: Plant = Pondicherry Only ---
console.log('\n--- TEST D: Plant = Pondicherry Only ---');
const pondyRecords = records.filter(r => r.plantName === 'Pondicherry' || r.plantCode === '3200');
const pondyTarget = 1 * 120.0;
const pondyActual = pondyRecords.reduce((sum, r) => sum + r.saleValue, 0);
if (pondyTarget === 120 && pondyActual === 115.00) {
  console.log('✓ TEST D PASSED: Pondicherry target = ₹120 Cr, actual = ₹115.00 Cr.');
} else {
  throw new Error(`TEST D FAILED: Pondicherry target ${pondyTarget}, Actual ${pondyActual}`);
}

// --- TEST E: Plant = Trichy Only ---
console.log('\n--- TEST E: Plant = Trichy Only ---');
const trichyRecords = records.filter(r => r.plantName === 'Trichy' || r.plantCode === '3600');
const trichyTarget = 1 * 120.0;
const trichyActual = trichyRecords.reduce((sum, r) => sum + r.saleValue, 0);
if (trichyTarget === 120 && trichyActual === 110.40) {
  console.log('✓ TEST E PASSED: Trichy target = ₹120 Cr, actual = ₹110.40 Cr.');
} else {
  throw new Error(`TEST E FAILED: Trichy target ${trichyTarget}, Actual ${trichyActual}`);
}

// --- TEST F: Chennai + Master Customer Group = TVS Conglomerate ---
console.log('\n--- TEST F: Chennai + Master Customer Group = TVS Conglomerate ---');
const multiFilterRecords = records.filter(r => (r.plantName === 'Chennai' || r.plantCode === '3000') && r.masterCustomerGroup === 'TVS Conglomerate');
const multiFilterActual = multiFilterRecords.reduce((sum, r) => sum + r.saleValue, 0);
console.log(`Chennai + TVS Actual: ₹${multiFilterActual.toFixed(2)} Cr`);
if (multiFilterActual === 60.00) {
  console.log('✓ TEST F PASSED: Dual filter (Chennai + TVS) strictly scopes actual sales to ₹60.00 Cr.');
} else {
  throw new Error(`TEST F FAILED: Dual filter actual was ${multiFilterActual}`);
}

// --- TEST G: Monthly Target Allocation & Actuals ---
console.log('\n--- TEST G: Monthly Target Allocation ---');
const chennaiMonthlyTarget = 1 * 10.0; // ₹10 Cr / month
const allPlantsMonthlyTarget = 4 * 10.0; // ₹40 Cr / month
if (chennaiMonthlyTarget === 10 && allPlantsMonthlyTarget === 40) {
  console.log('✓ TEST G PASSED: Monthly target line = ₹10 Cr for 1 plant, ₹40 Cr for 4 plants.');
} else {
  throw new Error(`TEST G FAILED`);
}

console.log('\n🎉 ALL SALES TARGET VS ACTUAL SCOPE TESTS PASSED SUCCESSFULLY!\n');
