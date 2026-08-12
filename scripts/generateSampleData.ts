import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import path from 'path';
import fs from 'fs';

interface SampleRecord {
  [key: string]: string | number;
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

  // Multi-Financial Year range: Apr 1, 2022 to Mar 31, 2026 (FY 2022-23, FY 2023-24, FY 2024-25, FY 2025-26)
  const startDate = new Date('2022-04-01');
  const totalDays = 1460; // 4 financial years (48 months)

  for (let i = 0; i < recordCount; i++) {
    const cust = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    const segment = segments[Math.floor(Math.random() * segments.length)];
    const products = PRODUCTS_BY_SEGMENT[segment];
    const product = products[Math.floor(Math.random() * products.length)];

    // Random date within 4 financial years
    const dayOffset = Math.floor(Math.random() * totalDays);
    const billDateObj = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const yyyy = billDateObj.getFullYear();
    const mm = String(billDateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(billDateObj.getDate()).padStart(2, '0');
    const billDate = `${yyyy}-${mm}-${dd}`;

    const invQty = Math.floor(Math.random() * 45) + 5; // 5 to 50 cases
    const qtyInNos = invQty; // In company Excel, Inv. Qty and Sale Qty in nos represent identical quantities

    // Apply progressive annual growth factor across 4 FYs
    const yearFactor = yyyy === 2022 ? 0.75 : yyyy === 2023 ? 0.88 : yyyy === 2024 ? 1.02 : yyyy === 2025 ? 1.18 : 1.30;
    let priceMultiplier = 1.0;
    if (cust.name === 'Metro Retail Hub' || cust.name === 'Arun Traders') {
      priceMultiplier = 1.25;
    }
    const saleValue = Math.round(product.basePrice * qtyInNos * yearFactor * priceMultiplier * (0.9 + Math.random() * 0.2));

    records.push({
      'Cust Num.': cust.num,
      'Customer': cust.name,
      'Material code': product.code,
      'Description': product.name,
      'Bill Date': billDate,
      'Inv. Qty': invQty,
      'Sale value(Doc rate)': saleValue, // Company header variation without space
      'Sale Qty in nos': qtyInNos,
      'ProductSegment': segment, // Company header variation without space
    });
  }

  // Inject a few deliberate edge cases for Data Quality audit verification
  // 1. A duplicate row
  if (records.length > 5) {
    records.push({ ...records[2] });
    records.push({ ...records[10] });
  }

  // 2. A row with missing segment
  records.push({
    'Cust Num.': 'CUST-1099',
    'Customer': 'Apex Store Branch',
    'Material code': 'MAT-101',
    'Description': 'Premium Basmati Rice 5kg',
    'Bill Date': '2025-11-15',
    'Inv. Qty': 10,
    'Sale value(Doc rate)': 22500,
    'Sale Qty in nos': 10,
    'ProductSegment': '', // missing segment
  });

  // 3. A deliberate quantity mismatch record for validation audit test
  records.push({
    'Cust Num.': 'CUST-1088',
    'Customer': 'Vanguard Retail Ltd',
    'Material code': 'MAT-201',
    'Description': 'Refined Sunflower Oil 1L',
    'Bill Date': '2025-12-01',
    'Inv. Qty': 20,
    'Sale value(Doc rate)': 28000,
    'Sale Qty in nos': 25, // Genuine quantity mismatch for audit check
    'ProductSegment': 'Cooking Essentials',
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
