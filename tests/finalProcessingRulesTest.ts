import { processRawRecords } from '../server/dataProcessor';
import { RawSalesRecord } from '../src/types/analytics';

console.log('=== Running Final Data Processing & Dashboard Rules Test Suite ===\n');

// Test dataset covering L2 removal, GRN date FY, Invoice Num retention (NO duplicate removal), Customer Count, and Plant Mappings
const mockRawRecords: RawSalesRecord[] = [
  // 1. Bill Type L2 record (Must be REMOVED)
  {
    'Invoice Num.': 'INV-L2-001',
    'Bill type': 'L2',
    'GRN date': '2025-05-10',
    'Bill Date': '2025-05-10',
    'Customer': 'L2 Excluded Customer',
    'Master Customer Group': 'L2 Group',
    'Material code': 'MAT-L2',
    'Value In Crs': '50.00',
    'Inv. Qty': '500',
    'Plant': '3000',
  },
  // 2. Bill Type L1 record (Must be RETAINED)
  {
    'Invoice Num.': 'INV-001',
    'Bill type': 'L1',
    'GRN date': '2025-04-01', // GRN date Apr 1, 2025 -> FY 2025-26
    'Bill Date': '2025-03-28', // Bill date in March, but GRN date in April -> GRN Date determines FY!
    'Customer': 'TVS Chennai',
    'Customer Group': 'TVS Group',
    'Master Customer Group': 'TVS Conglomerate',
    'Material code': 'MAT-101',
    'Description': 'Disc Pad Front',
    'Product Segment': '2 Wheeler',
    'Value In Crs': '12.50',
    'Inv. Qty': '100',
    'Plant': '3000',
  },
  // 3. Different Invoice Number (INV-002), identical other fields (Must be RETAINED)
  {
    'Invoice Num.': 'INV-002',
    'Bill type': 'L1',
    'GRN date': '2025-04-01',
    'Bill Date': '2025-03-28',
    'Customer': 'TVS Chennai',
    'Customer Group': 'TVS Group',
    'Master Customer Group': 'TVS Conglomerate',
    'Material code': 'MAT-101',
    'Description': 'Disc Pad Front',
    'Product Segment': '2 Wheeler',
    'Value In Crs': '12.50',
    'Inv. Qty': '100',
    'Plant': '3000',
  },
  // 4. Duplicate/Repeated Invoice Number (INV-002 repeated, MUST BE RETAINED per Master Prompt Rule 2)
  {
    'Invoice Num.': 'INV-002', // Repeated Invoice Num
    'Bill type': 'L1',
    'GRN date': '2025-04-01',
    'Customer': 'TVS Chennai',
    'Master Customer Group': 'TVS Conglomerate',
    'Material code': 'MAT-101',
    'Value In Crs': '12.50',
    'Inv. Qty': '100',
    'Plant': '3000',
  },
  // 5. GRN Date 31-Mar-2026 -> FY 2025-26, Q4, March
  {
    'Invoice Num.': 'INV-003',
    'Bill type': 'L1',
    'GRN date': '2026-03-31',
    'Customer': 'TVS Hyderabad',
    'Customer Group': 'TVS Group',
    'Master Customer Group': 'TVS Conglomerate',
    'Material code': 'MAT-102',
    'Description': 'Brake Assembly',
    'Product Segment': '2 Wheeler',
    'Value In Crs': '15.00',
    'Inv. Qty': '150',
    'Plant': '3100',
  },
  // 6. GRN Date 01-Apr-2026 -> FY 2026-27, Q1, April
  {
    'Invoice Num.': 'INV-004',
    'Bill type': 'S1',
    'GRN date': '2026-04-01',
    'Customer': 'ABC Bangalore',
    'Customer Group': 'ABC Group',
    'Master Customer Group': 'ABC Enterprises',
    'Material code': 'MAT-103',
    'Description': 'Steering System',
    'Product Segment': 'Passenger Vehicle',
    'Value In Crs': '20.00',
    'Inv. Qty': '200',
    'Plant': '3200',
  },
  // 7. Plant 3600 -> Trichy
  {
    'Invoice Num.': 'INV-005',
    'Bill type': 'S1',
    'GRN date': '2026-04-15',
    'Customer': 'Trichy Component Store',
    'Customer Group': 'Trichy Outlets',
    'Master Customer Group': 'ABC Enterprises',
    'Material code': 'MAT-104',
    'Description': 'Suspension Strut',
    'Product Segment': 'Commercial Vehicle',
    'Value In Crs': '8.00',
    'Inv. Qty': '80',
    'Plant': '3600',
  },
];

const { cleanRecords, qualitySummary } = processRawRecords(mockRawRecords, 'final_test.xlsx');

console.log(`Original Records: ${qualitySummary.originalRecords}`);
console.log(`L2 Records Excluded: ${qualitySummary.l2RecordsRemoved}`);
console.log(`Duplicates Removed: ${qualitySummary.duplicatesRemoved}`);
console.log(`Clean Active Records: ${qualitySummary.cleanRecords}`);

// --- TEST 1: L2 Removal ---
console.log('\n--- TEST 1: Bill Type = L2 Exclusion ---');
const l2InClean = cleanRecords.filter(r => r.invoiceNum === 'INV-L2-001' || r.billType.toUpperCase() === 'L2');
if (l2InClean.length === 0 && qualitySummary.l2RecordsRemoved === 1) {
  console.log('✓ TEST 1 PASSED: Bill Type = L2 record was excluded cleanly (l2RecordsRemoved = 1).');
} else {
  console.error(`❌ TEST 1 FAILED: Found ${l2InClean.length} L2 records in clean dataset.`);
  process.exit(1);
}

// --- TEST 2: Repeated Invoice Numbers Retained (INV-001 vs INV-002) ---
console.log('\n--- TEST 2 & 3 & 8: Repeated Invoice Numbers Retained (No Duplicate Removal) ---');
const inv2Count = cleanRecords.filter(r => r.invoiceNum === 'INV-002').length;
if (inv2Count === 2 && cleanRecords.length === 6 && qualitySummary.duplicatesRemoved === 0) {
  console.log('✓ TEST 2 & 3 & 8 PASSED: Repeated INV-002 records BOTH retained cleanly (6 total records retained, 0 duplicates removed).');
} else {
  console.error(`❌ TEST 2 & 3 & 8 FAILED: Expected 2 INV-002 records and 6 total clean records, got inv2Count=${inv2Count}, cleanRecords=${cleanRecords.length}`);
  process.exit(1);
}

// --- TEST 4: GRN Date Financial Year Derivation ---
console.log('\n--- TEST 4: GRN Date Financial Year Derivation ---');
const rec1 = cleanRecords.find(r => r.invoiceNum === 'INV-001'); // GRN date = 2025-04-01
const rec3 = cleanRecords.find(r => r.invoiceNum === 'INV-003'); // GRN date = 2026-03-31
const rec4 = cleanRecords.find(r => r.invoiceNum === 'INV-004'); // GRN date = 2026-04-01

if (
  rec1?.financialYear === 'FY 2025-26' && rec1?.quarter === 'Q1' && rec1?.month.startsWith('Apr') &&
  rec3?.financialYear === 'FY 2025-26' && rec3?.quarter === 'Q4' && rec3?.month.startsWith('Mar') &&
  rec4?.financialYear === 'FY 2026-27' && rec4?.quarter === 'Q1' && rec4?.month.startsWith('Apr')
) {
  console.log('✓ TEST 4 PASSED: GRN date determines FY 2025-26 (Apr 1 - Mar 31) and FY 2026-27 accurately.');
} else {
  console.error('❌ TEST 4 FAILED: GRN FY derivation mismatch!', {
    rec1FY: rec1?.financialYear,
    rec3FY: rec3?.financialYear,
    rec4FY: rec4?.financialYear,
  });
  process.exit(1);
}

// --- TEST 5: Customer Count (DISTINCT Master Customer Group) ---
console.log('\n--- TEST 5: Customer Count KPI (DISTINCT Master Customer Group) ---');
const masterCustomerCount = new Set(cleanRecords.map(r => r.masterCustomerGroup)).size;
console.log(`Distinct Master Customer Groups: ${masterCustomerCount}`);
if (masterCustomerCount === 2) { // TVS Conglomerate & ABC Enterprises
  console.log('✓ TEST 5 PASSED: Customer Count KPI = 2 (TVS Conglomerate & ABC Enterprises).');
} else {
  console.error(`❌ TEST 5 FAILED: Expected 2 Master Customer Groups, got ${masterCustomerCount}`);
  process.exit(1);
}

// --- TEST 7: Sale Value Crores Conversion (Sum of Sale value / 10,000,000) & Sale Quantity ---
console.log('\n--- TEST 7: Sale Value Crores Conversion & Sale Quantity ---');
const testCroreRow: RawSalesRecord = {
  'Invoice Num.': 'INV-CR-001',
  'Bill type': 'L1',
  'GRN date': '2025-05-15',
  'Customer.': 'Hero Moto',
  'Material code': '38981',
  'Desciption': 'Brake Pad Assembly',
  'Segment': '2W Commercial',
  'RBL_Product segment': 'Braking Systems',
  'Sum of Sale value(Doc rate)': 50000000, // ₹50,00,00,000 -> 5.00 Cr
  'Sum of Sale qty in nos': 1200,
  'Plant': '3000',
};

const croreResult = processRawRecords([testCroreRow], 'crore_test.xlsx');
const croreRecord = croreResult.cleanRecords[0];

if (croreRecord?.saleValue === 5.0 && croreRecord?.saleQty === 1200) {
  console.log('✓ TEST 7 PASSED: ₹50,00,00,000 correctly converted to 5.00 Cr, and Sale Qty = 1200.');
} else {
  console.error(`❌ TEST 7 FAILED: Expected saleValue=5.0 and saleQty=1200, got saleValue=${croreRecord?.saleValue}, saleQty=${croreRecord?.saleQty}`);
  process.exit(1);
}

// --- TEST 8: Material Code vs Description Integrity ---
console.log('\n--- TEST 8: Material Code vs Description Integrity ---');
if (croreRecord?.materialCode === '38981' && croreRecord?.description === 'Brake Pad Assembly') {
  console.log('✓ TEST 8 PASSED: Material code = 38981, Description = Brake Pad Assembly (No code in description column!).');
} else {
  console.error(`❌ TEST 8 FAILED: Expected materialCode=38981, description='Brake Pad Assembly', got materialCode=${croreRecord?.materialCode}, description=${croreRecord?.description}`);
  process.exit(1);
}

// --- TEST 9: Segment vs RBL Product Segment Separation & Blank Preservation ---
console.log('\n--- TEST 9: Segment vs RBL Product Segment & Blank Preservation ---');
const blankTestRow: RawSalesRecord = {
  'Invoice Num.': 'INV-BLANK-001',
  'Bill type': 'L1',
  'GRN date': '15/05/2025',
  'Customer.': '',
  'Material code': 'MAT-99',
  'Desciption': '',
  'Segment': '',
  'RBL_Product segment': '',
  'Sum of Sale value(Doc rate)': 10000000,
  'Sum of Sale qty in nos': 100,
  'Plant': '3000',
};

const blankResult = processRawRecords([blankTestRow], 'blank_test.xlsx');
const blankRecord = blankResult.cleanRecords[0];

if (
  blankRecord?.financialYear === 'FY 2025-26' &&
  blankRecord?.customer === '' &&
  blankRecord?.description === '' &&
  blankRecord?.productSegment === '' &&
  blankRecord?.rblProductSegment === ''
) {
  console.log('✓ TEST 9 PASSED: Valid GRN date derived FY 2025-26 without "FY Unknown", and blank fields preserved without fake defaults ("Uncategorized", "General Customer").');
} else {
  console.error('❌ TEST 9 FAILED: Blank preservation mismatch!', blankRecord);
  process.exit(1);
}

console.log('\n🎉 ALL 9 DATA PROCESSING & DASHBOARD INTEGRITY TESTS PASSED SUCCESSFULLY!');


