import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import path from 'path';
import fs from 'fs';

interface SampleRecord {
  'Cust Num.': string;
  'Customer': string;
  'Material code': string;
  'Description': string;
  'Bill Date': string;
  'Inv. Qty': number;
  'Sale value (Doc rate)': number;
  'Sale qty in nos': number;
  'Product Segment': string;
}

const CUSTOMERS = [
  { num: 'CUST-1001', name: 'Arun Traders' },
  { num: 'CUST-1002', name: 'Metro Retail Hub' },
  { num: 'CUST-1003', name: 'Sunshine Supermarket' },
  { num: 'CUST-1004', name: 'Galaxy Wholesalers' },
  { num: 'CUST-1005', name: 'Apex General Store' },
  { num: 'CUST-1006', name: 'Royal Food Bazaar' },
  { num: 'CUST-1007', name: 'Prime Corner Shop' },
  { num: 'CUST-1008', name: 'Vanguard Retail Ltd' },
  { num: 'CUST-1009', name: 'Greenleaf Mart' },
  { num: 'CUST-1010', name: 'Bluebell Hypermarket' },
  { num: 'CUST-1011', name: 'Standard Groceries' },
  { num: 'CUST-1012', name: 'Heritage Enterprise' },
  { num: 'CUST-1013', name: 'City Center Store' },
  { num: 'CUST-1014', name: 'Evergreen Emporium' },
  { num: 'CUST-1015', name: 'Golden Harvest Outlets' },
];

const PRODUCTS_BY_SEGMENT: Record<string, { code: string; name: string; basePrice: number }[]> = {
  'Staples': [
    { code: 'MAT-101', name: 'Premium Basmati Rice 5kg', basePrice: 450 },
    { code: 'MAT-102', name: 'Organic Whole Wheat Atta 10kg', basePrice: 380 },
    { code: 'MAT-103', name: 'Refined Sugar 5kg', basePrice: 220 },
    { code: 'MAT-104', name: 'Toor Dal Premium 1kg', basePrice: 160 },
  ],
  'Cooking Essentials': [
    { code: 'MAT-201', name: 'Refined Sunflower Oil 1L', basePrice: 140 },
    { code: 'MAT-202', name: 'Mustard Oil Cold Pressed 1L', basePrice: 180 },
    { code: 'MAT-203', name: 'Iodized Salt 1kg', basePrice: 25 },
    { code: 'MAT-204', name: 'Pure Cow Ghee 500ml', basePrice: 350 },
  ],
  'Beverages': [
    { code: 'MAT-301', name: 'Instant Gold Coffee 100g', basePrice: 280 },
    { code: 'MAT-302', name: 'Premium Assam Tea 500g', basePrice: 240 },
    { code: 'MAT-303', name: 'Organic Green Tea 25 Bags', basePrice: 195 },
    { code: 'MAT-304', name: 'Mango Nectar Juice 1L', basePrice: 95 },
  ],
  'Personal Care': [
    { code: 'MAT-401', name: 'Herbal Moisture Shampoo 350ml', basePrice: 210 },
    { code: 'MAT-402', name: 'Gentle Skin Cleansing Soap 125g', basePrice: 45 },
    { code: 'MAT-403', name: 'Anti-Dandruff Conditioner 200ml', basePrice: 190 },
    { code: 'MAT-404', name: 'Natural Whitening Toothpaste 150g', basePrice: 85 },
  ],
  'Household Care': [
    { code: 'MAT-501', name: 'Ultra Detergent Powder 1kg', basePrice: 130 },
    { code: 'MAT-502', name: 'Dishwash Gel Lemon 500ml', basePrice: 110 },
    { code: 'MAT-503', name: 'Disinfectant Floor Cleaner 1L', basePrice: 160 },
  ],
  'Snacks & Confectionery': [
    { code: 'MAT-601', name: 'Dark Chocolate Almond 100g', basePrice: 150 },
    { code: 'MAT-602', name: 'Crispy Potato Wafers 150g', basePrice: 40 },
    { code: 'MAT-603', name: 'Butter Cookies Family Pack', basePrice: 120 },
  ]
};

export function generateSampleData(recordCount = 2500): SampleRecord[] {
  const records: SampleRecord[] = [];
  const segments = Object.keys(PRODUCTS_BY_SEGMENT);

  // Financial Year 2025-26: Apr 1, 2025 to Mar 31, 2026
  const startDate = new Date('2025-04-01');

  for (let i = 0; i < recordCount; i++) {
    const cust = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    const segment = segments[Math.floor(Math.random() * segments.length)];
    const products = PRODUCTS_BY_SEGMENT[segment];
    const product = products[Math.floor(Math.random() * products.length)];

    // Random date within 365 days
    const dayOffset = Math.floor(Math.random() * 365);
    const billDateObj = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const yyyy = billDateObj.getFullYear();
    const mm = String(billDateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(billDateObj.getDate()).padStart(2, '0');
    const billDate = `${yyyy}-${mm}-${dd}`;

    const invQty = Math.floor(Math.random() * 45) + 5; // 5 to 50 boxes/cases
    const qtyInNos = invQty * (Math.floor(Math.random() * 6) + 6); // 6 to 12 items per case
    // Add seasonal variations or specific customer boosts
    let priceMultiplier = 1.0;
    if (cust.name === 'Metro Retail Hub' || cust.name === 'Arun Traders') {
      priceMultiplier = 1.25;
    }
    const saleValue = Math.round(product.basePrice * qtyInNos * priceMultiplier * (0.9 + Math.random() * 0.2));

    records.push({
      'Cust Num.': cust.num,
      'Customer': cust.name,
      'Material code': product.code,
      'Description': product.name,
      'Bill Date': billDate,
      'Inv. Qty': invQty,
      'Sale value (Doc rate)': saleValue,
      'Sale qty in nos': qtyInNos,
      'Product Segment': segment,
    });
  }

  // Inject a few deliberate edge cases for Data Cleaning verification
  // 1. A duplicate row
  if (records.length > 5) {
    records.push({ ...records[2] });
    records.push({ ...records[10] });
  }

  // 2. A row with missing value
  records.push({
    'Cust Num.': 'CUST-1099',
    'Customer': 'Apex Store Branch',
    'Material code': 'MAT-101',
    'Description': 'Premium Basmati Rice 5kg',
    'Bill Date': '2025-11-15',
    'Inv. Qty': 10,
    'Sale value (Doc rate)': 22500,
    'Sale qty in nos': 50,
    'Product Segment': '', // missing segment
  });

  return records;
}

export function writeSampleExcelFile(outputPath: string) {
  const data = generateSampleData(2500);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SalesData');

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  XLSX.writeFile(workbook, outputPath);
  console.log(`Generated sample Excel file with ${data.length} records at: ${outputPath}`);
}

// Execute if run directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('generateSampleData')) {
  const publicPath = path.join(process.cwd(), 'public', 'sample_sales_dashboard_data.xlsx');
  writeSampleExcelFile(publicPath);
}
