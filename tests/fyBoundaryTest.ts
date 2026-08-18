import { parseExcelDateOnly, calculateFinancialYearFromYMD } from '../server/dataProcessor.js';

console.log('Testing Financial Year Boundaries and Edge Cases...');

const testCases = [
  { raw: '01-Apr-2023', expectedFY: 'FY 2023-24', expectedISO: '2023-04-01' },
  { raw: '31-Mar-2024', expectedFY: 'FY 2023-24', expectedISO: '2024-03-31' },
  { raw: '01-Apr-2024', expectedFY: 'FY 2024-25', expectedISO: '2024-04-01' },
  { raw: '31-Mar-2025', expectedFY: 'FY 2024-25', expectedISO: '2025-03-31' },
  { raw: '01-Apr-2025', expectedFY: 'FY 2025-26', expectedISO: '2025-04-01' },
  { raw: '31-Mar-2026', expectedFY: 'FY 2025-26', expectedISO: '2026-03-31' },
  { raw: '2023-04-01', expectedFY: 'FY 2023-24', expectedISO: '2023-04-01' },
  { raw: '2024-03-31', expectedFY: 'FY 2023-24', expectedISO: '2024-03-31' },
  { raw: '10-May-2022', expectedFY: 'FY 2022-23', expectedISO: '2022-05-10' },
  { raw: '', expectedFY: '', expectedISO: '' },
  { raw: null, expectedFY: '', expectedISO: '' },
  { raw: 'invalid-date', expectedFY: '', expectedISO: '' },
];

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const res = parseExcelDateOnly(tc.raw);
  const fy = res.fyDetails.financialYear;
  const iso = res.isoDate;
  if (fy === tc.expectedFY && iso === tc.expectedISO) {
    console.log(`✅ PASS: raw=${tc.raw} => FY=${fy}, ISO=${iso}`);
    passed++;
  } else {
    console.error(`❌ FAIL: raw=${tc.raw} => Expected FY=${tc.expectedFY}, ISO=${tc.expectedISO} | Got FY=${fy}, ISO=${iso}`);
    failed++;
  }
}

if (failed > 0) {
  process.exit(1);
} else {
  console.log(`\n🎉 ALL ${passed} BOUNDARY AND EDGE CASE TESTS PASSED SUCCESSFULLY!`);
}
