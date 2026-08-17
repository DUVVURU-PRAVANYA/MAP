import { processRawRecords } from '../server/dataProcessor';
import { RawSalesRecord } from '../src/types/analytics';

console.log('=== Running Plant, Value In Crs, and Customer Hierarchy Verification Test ===');

const mockRawRecords: RawSalesRecord[] = [
  {
    'Financial Year': '2023-2024',
    'Bill Date': '2023-05-15',
    'Customer': 'TVS Motors - Hosur',
    'Customer Group': 'TVS Motors Group',
    'Master Customer Group': 'TVS Motors Conglomerate',
    'Product': 'Disc Pads',
    'Material Code': 'MAT-101',
    'Description': 'Disc Pad Front',
    'Product Segment': '2 Wheeler',
    'Inv. Qty': '500',
    'Value In Crs': '12.50',
    'Plant': '3000',
    'Invoice Num.': 'INV-10001',
  },
  {
    'Financial Year': '2023-2024',
    'Bill Date': '2023-06-20',
    'Customer': 'TVS Motors - Mysuru',
    'Customer Group': 'TVS Motors Group',
    'Master Customer Group': 'TVS Motors Conglomerate',
    'Product': 'Disc Pads',
    'Material Code': 'MAT-101',
    'Description': 'Disc Pad Front',
    'Product Segment': '2 Wheeler',
    'Inv. Qty': '300',
    'Value In Crs': '7.50',
    'Plant': '3100',
    'Invoice Num.': 'INV-10002',
  },
  {
    'Financial Year': '2023-2024',
    'Bill Date': '2023-07-10',
    'Customer': 'Ashok Leyland - Ennore',
    'Customer Group': 'Ashok Leyland Group',
    'Master Customer Group': 'Hinduja Group',
    'Product': 'Brake Linings',
    'Material Code': 'MAT-201',
    'Description': 'Commercial Brake Lining',
    'Product Segment': 'Commercial Vehicle',
    'Inv. Qty': '200',
    'Value In Crs': '5.00',
    'Plant': '3200',
    'Invoice Num.': 'INV-10003',
  },
  {
    'Financial Year': '2023-2024',
    'Bill Date': '2023-08-14',
    'Customer': 'Ashok Leyland - Hosur',
    'Customer Group': 'Ashok Leyland Group',
    'Master Customer Group': 'Hinduja Group',
    'Product': 'Brake Linings',
    'Material Code': 'MAT-201',
    'Description': 'Commercial Brake Lining',
    'Product Segment': 'Commercial Vehicle',
    'Inv. Qty': '400',
    'Value In Crs': '10.00',
    'Plant': '3600',
    'Invoice Num.': 'INV-10004',
  },
];

const { cleanRecords: records, qualitySummary } = processRawRecords(mockRawRecords, 'test_sales.xlsx');

console.log(`\nProcessed ${records.length} records successfully.`);

// 1. Verify Plant Normalization
console.log('\n--- 1. Plant Normalization Verification ---');
const plantCodes = records.map(r => r.plantCode);
const plantNames = records.map(r => r.plantName);
console.log('Plant Codes:', plantCodes);
console.log('Plant Names:', plantNames);

if (
  records[0].plantName === 'Chennai' &&
  records[1].plantName === 'Hyderabad' &&
  records[2].plantName === 'Pondicherry' &&
  records[3].plantName === 'Trichy'
) {
  console.log('✓ Plant normalization passed: 3000->Chennai, 3100->Hyderabad, 3200->Pondicherry, 3600->Trichy');
} else {
  console.error('❌ Plant normalization FAILED!');
  process.exit(1);
}

// 2. Verify Direct Value In Crs (No division by 10,000,000)
console.log('\n--- 2. Direct Value In Crs Financial Verification ---');
const totalSales = records.reduce((sum, r) => sum + r.saleValue, 0);
console.log(`Calculated Total Sales Value: ₹${totalSales} Cr`);
if (Math.abs(totalSales - 35.0) < 0.001) {
  console.log('✓ Direct Value In Crs calculation passed (Sum = 35.00 Cr)');
} else {
  console.error(`❌ Value In Crs calculation FAILED! Expected 35.00 Cr, got ${totalSales}`);
  process.exit(1);
}

// 3. Verify Customer Count Rule (DISTINCT Master Customer Group)
console.log('\n--- 3. Customer Count Rule (DISTINCT Master Customer Group) Verification ---');
const distinctMasterCustomerGroups = new Set(records.map(r => r.masterCustomerGroup)).size;
const distinctIndividualCustomers = new Set(records.map(r => r.customer)).size;

console.log(`Distinct Master Customer Groups: ${distinctMasterCustomerGroups}`);
console.log(`Distinct Individual Customers: ${distinctIndividualCustomers}`);

if (distinctMasterCustomerGroups === 2 && distinctIndividualCustomers === 4) {
  console.log('✓ Customer Count Rule passed: Customer Count KPI = 2 (DISTINCT Master Customer Group)');
} else {
  console.error('❌ Customer Count Rule FAILED!');
  process.exit(1);
}

// 4. Verify Invoice Num & Product-Wise Analysis
console.log('\n--- 4. Invoice Num & Product-Wise Analysis Verification ---');
const inv1 = records.find(r => r.invoiceNum === 'INV-10001');
if (inv1 && inv1.saleValue === 12.5 && inv1.plantName === 'Chennai') {
  console.log('✓ Invoice Num indexing passed for INV-10001');
} else {
  console.error('❌ Invoice Num indexing FAILED!');
  process.exit(1);
}

console.log('\n✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
