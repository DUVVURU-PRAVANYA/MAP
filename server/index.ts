import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

import { parseAndCleanExcel, processRawRecords } from './dataProcessor.js';
import { generateBusinessInsights } from './insightsEngine.js';
import { generateSampleData } from '../scripts/generateSampleData.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Set up Multer for Excel file upload in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls' || file.mimetype.includes('sheet') || file.mimetype.includes('excel')) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx and .xls Excel files are allowed.'));
    }
  },
});

// Endpoint: Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', app: 'Marketing Analytics Platform API', timestamp: new Date().toISOString() });
});

// Endpoint: Upload Excel File
app.post('/api/upload', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please select an Excel (.xlsx/.xls) file.' });
    }

    const filename = req.file.originalname;
    console.log(`\n[BACKEND DIAGNOSTIC] Upload request received for file: "${filename}" (${req.file.size} bytes)`);

    const result = parseAndCleanExcel(req.file.buffer, filename);
    const insights = generateBusinessInsights(result.cleanRecords);

    const cleanRecords = result.cleanRecords;
    const sortedDates = [...cleanRecords].map(r => r.billDate).sort();
    const minBillDate = sortedDates[0] || 'N/A';
    const maxBillDate = sortedDates[sortedDates.length - 1] || 'N/A';

    const fyDistribution: Record<string, number> = {};
    cleanRecords.forEach(r => {
      fyDistribution[r.financialYear] = (fyDistribution[r.financialYear] || 0) + 1;
    });

    console.log(`[BACKEND DIAGNOSTIC] Total parsed records: ${cleanRecords.length}`);
    console.log(`[BACKEND DIAGNOSTIC] Minimum Bill Date: ${minBillDate}`);
    console.log(`[BACKEND DIAGNOSTIC] Maximum Bill Date: ${maxBillDate}`);
    console.log(`[BACKEND DIAGNOSTIC] FY Distribution:`, fyDistribution);
    console.log(`[BACKEND DIAGNOSTIC] First 5 Bill Dates:`, cleanRecords.slice(0, 5).map(r => `${r.id}: ${r.billDate} (${r.financialYear})`));
    console.log(`[BACKEND DIAGNOSTIC] Last 5 Bill Dates:`, cleanRecords.slice(-5).map(r => `${r.id}: ${r.billDate} (${r.financialYear})`));

    return res.json({
      success: true,
      filename: result.filename,
      qualitySummary: result.qualitySummary,
      cleanRecords: result.cleanRecords,
      insights,
    });
  } catch (error: any) {
    console.error('Error processing uploaded Excel file:', error);
    return res.status(500).json({
      error: 'Failed to process the uploaded Excel file. Please verify required columns and format.',
      details: error?.message || String(error),
    });
  }
});

// Endpoint: Load Synthetic Sample Data
app.get('/api/sample', (_req: Request, res: Response) => {
  try {
    const rawRecords = generateSampleData(2500);
    const result = processRawRecords(rawRecords, 'sample_sales_dashboard_data.xlsx');
    const insights = generateBusinessInsights(result.cleanRecords);

    return res.json({
      success: true,
      filename: 'sample_sales_dashboard_data.xlsx',
      qualitySummary: result.qualitySummary,
      cleanRecords: result.cleanRecords,
      insights,
    });
  } catch (error: any) {
    console.error('Error generating sample dataset:', error);
    return res.status(500).json({ error: 'Failed to load sample dataset.' });
  }
});

// Endpoint: Export Clean/Filtered Data to CSV or Excel
app.post('/api/export', (req: Request, res: Response) => {
  try {
    const { format, records } = req.body; // format = 'csv' | 'excel'

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid or missing records data for export.' });
    }

    const exportRows = records.map(r => ({
      'Financial Year': r.financialYear || '',
      'Customer Number': r.custNum,
      'Customer Name': r.customer,
      'Material Code': r.materialCode,
      'Description': r.description,
      'Bill Date': r.billDate,
      'Year': r.year || '',
      'Month': r.month,
      'Quarter': r.quarter,
      'Invoice Quantity': r.invQty,
      'Sale Value (INR)': r.saleValue,
      'Sale Quantity (Nos)': r.saleQty,
      'Product Segment': r.productSegment,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Filtered_Sales_Data');

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="marketing_analytics_export.csv"');
      return res.send(csv);
    } else {
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="marketing_analytics_export.xlsx"');
      return res.send(buffer);
    }
  } catch (error: any) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Failed to export report.' });
  }
});

// Serve frontend static assets in production mode
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Marketing Analytics Platform backend listening on http://localhost:${PORT}`);
});
