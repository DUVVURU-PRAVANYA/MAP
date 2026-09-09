import * as XLSX from 'xlsx';

interface SampleRecord {
  [key: string]: string | number;
}

const CUSTOMERS = [
  { num: 'CUST-1001', name: 'Arun Traders', group: 'Arun Retail Group', masterGroup: 'Arun Enterprises' },
  { num: 'CUST-1002', name: 'Metro Retail Hub', group: 'Metro Retail Group', masterGroup: 'Metro Holdings' },
  { num: 'CUST-1003', name: 'Sunshine Supermarket', group: 'Sunshine Retail Group', masterGroup: 'Sunshine Retail Corp' },
  { num: 'CUST-1004', name: 'Galaxy Wholesalers', group: 'Galaxy Distribution', masterGroup: 'Galaxy Conglomerate' },
  { num: 'CUST-1005', name: 'Apex General Store', group: 'Apex Retail Chain', masterGroup: 'Apex Commercial Group' },
  { num: 'CUST-1006', name: 'Royal Food Bazaar', group: 'Royal Bazaar Group', masterGroup: 'Royal Retail Group' },
  { num: 'CUST-1007', name: 'Prime Corner Shop', group: 'Prime Outlets', masterGroup: 'Prime Enterprises' },
  { num: 'CUST-1008', name: 'Vanguard Retail Ltd', group: 'Vanguard Chain', masterGroup: 'Vanguard Global' },
  { num: 'CUST-1009', name: 'Greenleaf Mart', group: 'Greenleaf Retail', masterGroup: 'Greenleaf Organics' },
  { num: 'CUST-1010', name: 'Bluebell Hypermarket', group: 'Bluebell Stores', masterGroup: 'Bluebell Holdings' },
  { num: 'CUST-1011', name: 'Standard Groceries', group: 'Standard Retail', masterGroup: 'Standard Enterprise' },
  { num: 'CUST-1012', name: 'Heritage Enterprise', group: 'Heritage Outlets', masterGroup: 'Heritage Group' },
  { num: 'CUST-1013', name: 'City Center Store', group: 'City Center Hubs', masterGroup: 'City Retail Corp' },
  { num: 'CUST-1014', name: 'Evergreen Emporium', group: 'Evergreen Stores', masterGroup: 'Evergreen Global' },
  { num: 'CUST-1015', name: 'Golden Harvest Outlets', group: 'Golden Harvest Group', masterGroup: 'Golden Harvest Inc' },
];

const PLANT_CODES = ['3000', '3100', '3200', '3600'];

const PRODUCTS_BY_SEGMENT: Record<string, { code: string; name: string; basePrice: number }[]> = {
  'Commercial Vehicles': [
    { code: 'MAT-101', name: 'Heavy Axle Assembly 5000', basePrice: 2.85 },
    { code: 'MAT-102', name: 'Hydraulic Brake System Pro', basePrice: 1.95 },
    { code: 'MAT-103', name: 'Commercial Steering Gear Unit', basePrice: 3.40 },
    { code: 'MAT-104', name: 'Diesel Engine Turbo Kit', basePrice: 4.10 },
  ],
  'Passenger Vehicles': [
    { code: 'MAT-201', name: 'Electronic Power Steering Unit', basePrice: 1.45 },
    { code: 'MAT-202', name: 'ABS Brake Controller Module', basePrice: 1.10 },
    { code: 'MAT-203', name: 'MacPherson Strut Suspension', basePrice: 0.85 },
    { code: 'MAT-204', name: 'Transmission Control Unit', basePrice: 2.20 },
  ],
  '2 Wheelers & 3 Wheelers': [
    { code: 'MAT-301', name: 'Monoshock Rear Absorber', basePrice: 0.35 },
    { code: 'MAT-302', name: 'Digital Fuel Injection Unit', basePrice: 0.45 },
    { code: 'MAT-303', name: 'Disc Brake Master Cylinder', basePrice: 0.28 },
    { code: 'MAT-304', name: 'Electric Motor Hub Assembly', basePrice: 0.65 },
  ],
  'Tractors & Off-Highway': [
    { code: 'MAT-401', name: 'Heavy Duty Hydraulic Pump', basePrice: 2.50 },
    { code: 'MAT-402', name: 'Tractor Power Take-Off Unit', basePrice: 1.80 },
    { code: 'MAT-403', name: 'Differential Lock Gearbox', basePrice: 3.10 },
    { code: 'MAT-404', name: 'All-Terrain Clutch Assembly', basePrice: 1.40 },
  ],
  'Industrial & Spares': [
    { code: 'MAT-501', name: 'Precision Ball Bearing Kit', basePrice: 0.40 },
    { code: 'MAT-502', name: 'Synthetic Gear Lubricant 50L', basePrice: 0.55 },
    { code: 'MAT-503', name: 'Heavy Gasket Seal Ring Set', basePrice: 0.22 },
  ],
};

const APPLICATIONS_BY_SEGMENT: Record<string, string[]> = {
  'Commercial Vehicles': ['Heavy Duty Trucks', 'Light Commercial Vehicles (LCV)', 'Intercity Bus Fleet', 'Tipper & Construction Trucks'],
  'Passenger Vehicles': ['Sedan & Hatchback', 'Compact SUV', 'Premium SUV', 'Electric Vehicle (EV)'],
  '2 Wheelers & 3 Wheelers': ['Commuter Motorcycles', 'Premium Sport Bikes', 'Electric Scooters (EV)', 'Passenger Auto Rickshaw', 'Cargo 3-Wheeler'],
  'Tractors & Off-Highway': ['Agricultural Tractors', 'Mining & Earthmoving', 'Harvesters & Farm Equipment', 'Forklifts & Material Handling'],
  'Industrial & Spares': ['Stationary Generators', 'Marine Propulsion', 'Industrial Compressors'],
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
    const appList = APPLICATIONS_BY_SEGMENT[segment] || ['General Automotive'];
    const application = appList[Math.floor(Math.random() * appList.length)];
    const plantCode = PLANT_CODES[Math.floor(Math.random() * PLANT_CODES.length)];
    const invoiceNum = `INV-${500100 + i}`;

    // Random date within 4 financial years
    const dayOffset = Math.floor(Math.random() * totalDays);
    const billDateObj = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const yyyy = billDateObj.getFullYear();
    const mm = String(billDateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(billDateObj.getDate()).padStart(2, '0');
    const billDate = `${yyyy}-${mm}-${dd}`;

    const invQty = Math.floor(Math.random() * 45) + 5; // 5 to 50 cases
    const qtyInNos = invQty;

    // Value In Crs calculation directly in Crores
    const yearFactor = yyyy === 2022 ? 0.75 : yyyy === 2023 ? 0.88 : yyyy === 2024 ? 1.02 : yyyy === 2025 ? 1.18 : 1.30;
    let priceMultiplier = 1.0;
    if (cust.name === 'Metro Retail Hub' || cust.name === 'Arun Traders') {
      priceMultiplier = 1.25;
    }

    const valueInCrs = Number((product.basePrice * (invQty / 20) * yearFactor * priceMultiplier * (0.85 + Math.random() * 0.3)).toFixed(2));

    records.push({
      'Cust Num.': cust.num,
      'Customer': cust.name,
      'Customer Group': cust.group,
      'Master Customer Group': cust.masterGroup,
      'Material code': product.code,
      'Description': product.name,
      'Application': application,
      'Bill Date': billDate,
      'GRN date': billDate,
      'Inv. Qty': invQty,
      'Sale qty in nos': qtyInNos,
      'Value In Crs': valueInCrs,
      'Sale value (Doc rate)': valueInCrs,
      'ProductSegment': segment,
      'Plant': plantCode,
      'Invoice Num.': invoiceNum,
    });
  }

  // Inject a few deliberate edge cases for Data Quality audit verification
  // 1. Repeated invoice rows (retained as separate transaction records)
  if (records.length > 5) {
    records.push({ ...records[2] });
    records.push({ ...records[10] });
  }

  // 2. A row with missing segment
  records.push({
    'Cust Num.': 'CUST-1099',
    'Customer': 'Apex Store Branch',
    'Customer Group': 'Apex Retail Chain',
    'Master Customer Group': 'Apex Commercial Group',
    'Material code': 'MAT-101',
    'Description': 'Heavy Axle Assembly 5000',
    'Bill Date': '2025-11-15',
    'Inv. Qty': 10,
    'Value In Crs': 1.45,
    'Sale value (Doc rate)': 1.45,
    'Sale qty in nos': 10,
    'ProductSegment': '', // missing segment
    'Plant': '3000',
    'Invoice Num.': 'INV-500999',
  });

  // 3. A deliberate quantity mismatch record for validation audit test
  records.push({
    'Cust Num.': 'CUST-1088',
    'Customer': 'Vanguard Retail Ltd',
    'Customer Group': 'Vanguard Chain',
    'Master Customer Group': 'Vanguard Global',
    'Material code': 'MAT-201',
    'Description': 'Electronic Power Steering Unit',
    'Bill Date': '2025-12-01',
    'Inv. Qty': 20,
    'Value In Crs': 2.10,
    'Sale value (Doc rate)': 2.10,
    'Sale qty in nos': 25, // Genuine quantity mismatch for audit check
    'ProductSegment': 'Passenger Vehicles',
    'Plant': '3100',
    'Invoice Num.': 'INV-500888',
  });

  return records;
}

export function writeSampleExcelFile(outputPath: string) {
  const data = generateSampleData(2500);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SalesData');
  XLSX.writeFile(workbook, outputPath);
  console.log(`Generated sample Excel file with ${data.length} records at: ${outputPath}`);
}

