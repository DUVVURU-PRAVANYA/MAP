import { processRawRecords } from '../server/dataProcessor';
import { RawSalesRecord } from '../src/types/analytics';

console.log('=== Running Final Duplicate Handling & Invoice Num ONLY Verification Test ===\n');

// Dataset for Test 1 & 2 & 3 & 4
const mockDataset: RawSalesRecord[] = [
  // TEST 1 & 4: Different Invoice Numbers (INV001 vs INV002), identical in all other fields
  {
    'Invoice Num.': 'INV001',
    'Cust Num.': 'CUST-100',
    'Customer': 'ABC Automotive',
    'Master Customer Group': 'ABC Group',
    'Material code': 'MAT001',
    'Description': 'Steering System',
    'Bill Date': '2025-04-01',
    'Value In Crs': '10.00',
    'Inv. Qty': '100',
    'Plant': '3000',
  },
  {
    'Invoice Num.': 'INV002',
    'Cust Num.': 'CUST-100',
    'Customer': 'ABC Automotive',
    'Master Customer Group': 'ABC Group',
    'Material code': 'MAT001',
    'Description': 'Steering System',
    'Bill Date': '2025-04-01',
    'Value In Crs': '10.00',
    'Inv. Qty': '100',
    'Plant': '3000',
  },

  // TEST 2: Same Invoice Number (INV003 appearing twice with identical data)
  {
    'Invoice Num.': 'INV003',
    'Cust Num.': 'CUST-200',
    'Customer': 'Tata Motors - Pune',
    'Master Customer Group': 'Tata Group',
    'Material code': 'MAT002',
    'Description': 'Brake Assembly',
    'Bill Date': '2025-04-02',
    'Value In Crs': '5.00',
    'Inv. Qty': '50',
    'Plant': '3100',
  },
  {
    'Invoice Num.': 'INV003', // Duplicate Invoice Num
    'Cust Num.': 'CUST-200',
    'Customer': 'Tata Motors - Pune',
    'Master Customer Group': 'Tata Group',
    'Material code': 'MAT002',
    'Description': 'Brake Assembly',
    'Bill Date': '2025-04-02',
    'Value In Crs': '5.00',
    'Inv. Qty': '50',
    'Plant': '3100',
  },

  // TEST 3: Same Invoice Number (INV004), different other values
  {
    'Invoice Num.': 'INV004',
    'Cust Num.': 'CUST-300',
    'Customer': 'ABC Automotive',
    'Master Customer Group': 'ABC Group',
    'Material code': 'MAT001',
    'Description': 'Steering System',
    'Bill Date': '2025-04-03',
    'Value In Crs': '10.00',
    'Inv. Qty': '100',
    'Plant': '3000',
  },
  {
    'Invoice Num.': 'INV004', // Same Invoice Num, different customer/value
    'Cust Num.': 'CUST-400',
    'Customer': 'XYZ Outlets',
    'Master Customer Group': 'XYZ Group',
    'Material code': 'MAT002',
    'Description': 'Brake Assembly',
    'Bill Date': '2025-04-03',
    'Value In Crs': '20.00',
    'Inv. Qty': '200',
    'Plant': '3100',
  },
];

const { cleanRecords, qualitySummary } = processRawRecords(mockDataset, 'duplicate_test.xlsx');

console.log(`Original Records: ${qualitySummary.originalRecords}`);
console.log(`Clean Records Retained: ${qualitySummary.cleanRecords}`);
console.log(`Duplicates Removed: ${qualitySummary.duplicatesRemoved}`);

// --- TEST 1 & 4: Different Invoice Numbers ---
console.log('\n--- TEST 1 & 4: Different Invoice Numbers (INV001 vs INV002) ---');
const inv1And2 = cleanRecords.filter(r => r.invoiceNum === 'INV001' || r.invoiceNum === 'INV002');
if (inv1And2.length === 2) {
  console.log('✓ TEST 1 & 4 PASSED: INV001 and INV002 were BOTH retained (0 false duplicates).');
} else {
  console.error(`❌ TEST 1 & 4 FAILED: Expected 2 records, got ${inv1And2.length}`);
  process.exit(1);
}

// --- TEST 2: Same Invoice Number Duplicate ---
console.log('\n--- TEST 2: Same Invoice Number (INV003) ---');
const inv3 = cleanRecords.filter(r => r.invoiceNum === 'INV003');
if (inv3.length === 1) {
  console.log('✓ TEST 2 PASSED: Second occurrence of INV003 was correctly removed as duplicate.');
} else {
  console.error(`❌ TEST 2 FAILED: Expected 1 retained record for INV003, got ${inv3.length}`);
  process.exit(1);
}

// --- TEST 3: Same Invoice Number, Different Other Values ---
console.log('\n--- TEST 3: Same Invoice Number (INV004) with different other values ---');
const inv4 = cleanRecords.filter(r => r.invoiceNum === 'INV004');
if (inv4.length === 1) {
  console.log('✓ TEST 3 PASSED: Second occurrence of INV004 removed based on Invoice Num. ONLY rule.');
} else {
  console.error(`❌ TEST 3 FAILED: Expected 1 retained record for INV004, got ${inv4.length}`);
  process.exit(1);
}

// --- TEST 5: Customer Count Rule (DISTINCT Master Customer Group) ---
console.log('\n--- TEST 5: Customer Count Rule (DISTINCT Master Customer Group) ---');
const customerTestDataset: RawSalesRecord[] = [
  { 'Invoice Num.': 'INV-101', 'Customer': 'Chennai TVS', 'Master Customer Group': 'TVS Group' },
  { 'Invoice Num.': 'INV-102', 'Customer': 'Hyderabad TVS', 'Master Customer Group': 'TVS Group' },
  { 'Invoice Num.': 'INV-103', 'Customer': 'ABC Chennai', 'Master Customer Group': 'ABC Group' },
];

const { cleanRecords: custClean } = processRawRecords(customerTestDataset, 'cust_test.xlsx');
const customerCount = new Set(custClean.map(r => r.masterCustomerGroup)).size;
console.log(`Distinct Master Customer Groups: ${customerCount}`);
if (customerCount === 2) {
  console.log('✓ TEST 5 PASSED: Customer Count = 2 (TVS Group & ABC Group).');
} else {
  console.error(`❌ TEST 5 FAILED: Expected 2 distinct Master Customer Groups, got ${customerCount}`);
  process.exit(1);
}

console.log('\n🎉 ALL DUPLICATE HANDLING & INVOICE NUM ONLY TESTS PASSED SUCCESSFULLY!');
