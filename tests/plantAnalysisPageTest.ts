import { processRawRecords } from '../server/dataProcessor';
import { RawSalesRecord } from '../src/types/analytics';

console.log('=== Running Plant Analysis Page Automated Logic & Integrity Test ===');

const mockDataset: RawSalesRecord[] = [
  {
    'Financial Year': '2024-2025',
    'Bill Date': '2024-05-10',
    'Customer': 'TVS - Hosur',
    'Customer Group': 'TVS Group',
    'Master Customer Group': 'TVS Conglomerate',
    'Product': 'Steering System',
    'Material Code': 'STR-100',
    'Description': 'Power Steering System',
    'Product Segment': 'Passenger Vehicle',
    'Inv. Qty': '1000',
    'Value In Crs': '42.50',
    'Plant': '3000',
    'Invoice Num.': 'INV-9001',
  },
  {
    'Financial Year': '2024-2025',
    'Bill Date': '2024-06-12',
    'Customer': 'TVS - Mysuru',
    'Customer Group': 'TVS Group',
    'Master Customer Group': 'TVS Conglomerate',
    'Product': 'Steering System',
    'Material Code': 'STR-100',
    'Description': 'Power Steering System',
    'Product Segment': 'Passenger Vehicle',
    'Inv. Qty': '800',
    'Value In Crs': '31.80',
    'Plant': '3100',
    'Invoice Num.': 'INV-9002',
  },
  {
    'Financial Year': '2024-2025',
    'Bill Date': '2024-07-15',
    'Customer': 'Tata Motors - Pune',
    'Customer Group': 'Tata Group',
    'Master Customer Group': 'Tata Sons',
    'Product': 'Steering System',
    'Material Code': 'STR-100',
    'Description': 'Power Steering System',
    'Product Segment': 'Passenger Vehicle',
    'Inv. Qty': '500',
    'Value In Crs': '18.60',
    'Plant': '3200',
    'Invoice Num.': 'INV-9003',
  },
  {
    'Financial Year': '2024-2025',
    'Bill Date': '2024-08-20',
    'Customer': 'Tata Motors - Jamshedpur',
    'Customer Group': 'Tata Group',
    'Master Customer Group': 'Tata Sons',
    'Product': 'Steering System',
    'Material Code': 'STR-100',
    'Description': 'Power Steering System',
    'Product Segment': 'Passenger Vehicle',
    'Inv. Qty': '300',
    'Value In Crs': '12.40',
    'Plant': '3600',
    'Invoice Num.': 'INV-9004',
  },
  {
    'Financial Year': '2024-2025',
    'Bill Date': '2024-09-05',
    'Customer': 'Ashok Leyland - Chennai',
    'Customer Group': 'Ashok Leyland',
    'Master Customer Group': 'Hinduja Group',
    'Product': 'Brake Assembly',
    'Material Code': 'BRK-200',
    'Description': 'Heavy Brake Assembly',
    'Product Segment': 'Commercial Vehicle',
    'Inv. Qty': '600',
    'Value In Crs': '20.00',
    'Plant': '3000',
    'Invoice Num.': 'INV-9005',
  },
];

const { cleanRecords: records } = processRawRecords(mockDataset, 'plant_test.xlsx');

console.log(`\nProcessed ${records.length} records successfully.`);

// 1. Plant Normalization Check
console.log('\n--- 1. Plant Mapping Verification ---');
const chennaiRecs = records.filter(r => r.plantName === 'Chennai');
const hyderabadRecs = records.filter(r => r.plantName === 'Hyderabad');
const pondicherryRecs = records.filter(r => r.plantName === 'Pondicherry');
const trichyRecs = records.filter(r => r.plantName === 'Trichy');

if (
  chennaiRecs.length === 2 &&
  hyderabadRecs.length === 1 &&
  pondicherryRecs.length === 1 &&
  trichyRecs.length === 1
) {
  console.log('✓ Plant code mapping verified (3000=Chennai, 3100=Hyderabad, 3200=Pondicherry, 3600=Trichy)');
} else {
  console.error('❌ Plant code mapping FAILED!');
  process.exit(1);
}

// 2. Scoped Sales & Contribution Calculation
console.log('\n--- 2. Sales Contribution % Verification ---');
const totalCompanySales = records.reduce((sum, r) => sum + r.saleValue, 0); // 42.5 + 31.8 + 18.6 + 12.4 + 20.0 = 125.30 Cr
console.log(`Total Sales: ₹${totalCompanySales.toFixed(2)} Cr`);

const chennaiSales = chennaiRecs.reduce((sum, r) => sum + r.saleValue, 0); // 62.50 Cr
const chennaiContribution = (chennaiSales / totalCompanySales) * 100;
console.log(`Chennai Sales: ₹${chennaiSales.toFixed(2)} Cr (${chennaiContribution.toFixed(1)}%)`);

if (Math.abs(totalCompanySales - 125.30) < 0.01 && Math.abs(chennaiContribution - 49.88) < 0.1) {
  console.log('✓ Sales contribution calculation verified');
} else {
  console.error('❌ Sales contribution calculation FAILED!');
  process.exit(1);
}

// 3. Same Product Performance Across Plants Verification (Requirement 10)
console.log('\n--- 3. Same Product Across Plants Verification (Requirement 10) ---');
const steeringRecords = records.filter(r => r.description === 'Power Steering System');
const steeringPlantSales = {
  Chennai: steeringRecords.filter(r => r.plantName === 'Chennai').reduce((s, r) => s + r.saleValue, 0),
  Hyderabad: steeringRecords.filter(r => r.plantName === 'Hyderabad').reduce((s, r) => s + r.saleValue, 0),
  Pondicherry: steeringRecords.filter(r => r.plantName === 'Pondicherry').reduce((s, r) => s + r.saleValue, 0),
  Trichy: steeringRecords.filter(r => r.plantName === 'Trichy').reduce((s, r) => s + r.saleValue, 0),
};

console.log('Steering System Sales across Plants:', steeringPlantSales);
if (
  steeringPlantSales.Chennai === 42.5 &&
  steeringPlantSales.Hyderabad === 31.8 &&
  steeringPlantSales.Pondicherry === 18.6 &&
  steeringPlantSales.Trichy === 12.4
) {
  console.log('✓ Same product cross-plant comparison verified');
} else {
  console.error('❌ Same product cross-plant comparison FAILED!');
  process.exit(1);
}

// 4. Scoped Customer Count Rule (DISTINCT Master Customer Group) Verification
console.log('\n--- 4. Master Customer Group Count Verification ---');
const chennaiMasterCustomers = new Set(chennaiRecs.map(r => r.masterCustomerGroup)).size;
console.log(`Chennai Master Customer Group Count: ${chennaiMasterCustomers}`);
if (chennaiMasterCustomers === 2) {
  console.log('✓ Scoped Customer Count Rule verified (DISTINCT Master Customer Group = 2)');
} else {
  console.error('❌ Scoped Customer Count Rule FAILED!');
  process.exit(1);
}

console.log('\n🎉 ALL PLANT ANALYSIS PAGE TESTS PASSED SUCCESSFULLY!');
