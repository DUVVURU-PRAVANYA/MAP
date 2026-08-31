# Marketing Analytics Platform (MAP) — Enterprise Project Documentation

## 1. Executive Summary

The **Marketing Analytics Platform (MAP)** is an enterprise-grade web application built to ingest, clean, standardize, analyze, and visualize complex industrial & automotive B2B sales data (e.g., `company_data.xlsx`). 

It transforms raw transaction data from SAP/ERP systems into executive KPIs, customer hierarchy insights, multi-year financial trends, plant capacity analytics, product segment performance, and automated anomaly/opportunity highlights.

---

## 2. Business Objectives & Core Problems Solved

1. **ERP Data Ingestion & Automated Cleaning**: Industrial sales sheets often contain inconsistent headers, non-standardized plant codes, raw currency values (Doc Rate in Rupees), and non-commercial transaction records (e.g., Bill Type `L2`). MAP automatically standardizes these inputs on ingest.
2. **Financial Year Standardization (April – March)**: Standardizes fiscal calendar calculations strictly from the **GRN Date** (Goods Receipt Note Date), placing transaction dates into exact Indian Financial Year cycles (e.g., `FY 2024-25`, `FY 2025-26`).
3. **Currency Conversion & Unit Scaling**: Automatically converts raw sales amounts into **Crores (Cr)** by dividing document rates by $10,000,000$ (`1 Cr = 10,000,000 INR`), providing readable metrics across executive views.
4. **Multi-Level Hierarchy & Concentration Risk**: Tracks customer accounts at three granular levels (Customer, Customer Group, Master Customer Group) to evaluate account concentration and growth opportunities.
5. **Multi-Plant Regional Performance**: Maps internal plant IDs (e.g., `3000`, `3100`, `3200`, `3600`) to geographic manufacturing hubs (**Chennai, Hyderabad, Pondicherry, Trichy**).

---

## 3. Technology Stack & Architecture

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19**, **TypeScript 5.9** | Component-driven, type-safe UI architecture |
| **Build System** | **Vite 6** | Fast development server & optimized production bundling |
| **Styling & Icons** | **Tailwind CSS 3.4**, **Lucide React** | Responsive design system & UI iconography |
| **Animations** | **Framer Motion 12** | Interactive tab transitions & modal overlays |
| **Visualization** | **Recharts 2.15** | Financial trends, bar charts, pie charts, area graphs |
| **Backend Server** | **Express 4**, **Node.js (tsx)** | Excel parsing API endpoint & file upload handler |
| **Data Parsing** | **XLSX (SheetJS 0.18)** | Server-side Excel buffer parsing & header mapping |

---

## 4. Key Data Transformation & Processing Rules (ETL Engine)

All processing is executed in [`server/dataProcessor.ts`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/marketing-analytics-platform/server/dataProcessor.ts):

```
+------------------------+      +------------------------+      +------------------------+
|  Raw Excel Ingestion   | ---> | Data Quality Audit     | ---> | Normalized Clean       |
|  (company_data.xlsx)   |      | & L2 Exclusion         |      | Sales Records          |
+------------------------+      +------------------------+      +------------------------+
                                                                             |
                                                                             v
+------------------------+      +------------------------+      +------------------------+
| Automated Insights     | <--- | Analytics Context      | <--- | Multi-Tab Dashboards   |
| & Flagged Anomaly Engine|      | & Global State Store   |      | (Plants, Customers,    |
+------------------------+      +------------------------+      |  Products, Segments)   |
                                                                +------------------------+
```

### Core Business Logic Specifications:
1. **Rule 1: Bill Type L2 Exclusion**
   - Any sales record with `Bill Type = 'L2'` is treated as an internal transfer or non-commercial adjustment and is **strictly excluded** from all metrics, dashboards, and growth calculations.
2. **Rule 2: GRN Date Financial Year Calculation**
   - Financial year is derived **strictly from GRN Date** (not Invoice Date or Bill Date).
   - Months April–December belong to `FY YYYY-(YY+1)`.
   - Months January–March belong to `FY (YYYY-1)-YY`.
3. **Rule 3: Unconditional Sales Crores Scaling**
   - $\text{Sales (Cr)} = \frac{\text{Sum of Sale value (Doc rate)}}{10,000,000}$.
4. **Rule 4: Full Invoice History Retention**
   - Repeated invoice numbers represent legitimate multi-line transactions. No invoice duplication removal is performed to preserve true revenue and unit totals.
5. **Rule 5: Plant Code Mapping**
   - Code `3000` $\rightarrow$ **Chennai**
   - Code `3100` $\rightarrow$ **Hyderabad**
   - Code `3200` $\rightarrow$ **Pondicherry**
   - Code `3600` $\rightarrow$ **Trichy**
6. **Rule 6: Description & Material Code Isolation**
   - `Material Code` and `Description` are stored as independent fields. Descriptions are sourced strictly from original product descriptions without auto-populating material IDs into text fields.

---

## 5. Application Modules & Dashboard Features

The platform provides 8 major feature tabs accessible from the main navigation header:

1. **Data Ingestion & Quality Summary (`/upload`)**
   - Live file drop area supporting `.xlsx` and `.csv` files.
   - Comprehensive Data Quality Audit card displaying total records parsed, L2 records removed, invalid rows, and date range bounds.
2. **Overview Dashboard (`/overview`)**
   - High-level executive view featuring Total Sales Value (Cr), Total Invoice Quantity, Active Master Customer Groups, SKUs, and Segment counts.
   - Financial Year YoY trend graphs, top segment contribution breakdowns, and regional plant sales distributions.
3. **Plant Analysis (`/plants`)**
   - Deep dive into manufacturing plant metrics across Chennai, Hyderabad, Pondicherry, and Trichy.
   - Comparative sales values, quantity metrics, plant rankings, customer counts per plant, and transaction intensity.
4. **Product Analysis (`/products`)**
   - Product family and individual SKU performance.
   - Pareto analysis (80/20 distribution), top product rank tables, material code lookup, and quantity volume metrics.
5. **Customer Analysis (`/customers`)**
   - Master Customer Group hierarchy view.
   - Concentration analysis (Top 5 / Top 10 customer account contribution), customer group performance, and account transaction histories.
6. **Segment Analysis (`/segments`)**
   - Breakdown by product segment and vehicle application (e.g., 2-Wheeler, Passenger Vehicle, Commercial Vehicle).
7. **Time Trend Analysis (`/time`)**
   - Monthly and quarterly revenue/volume trajectory comparisons across financial years.
8. **Automated Business Insights Engine (`/insights`)**
   - Algorithmic detection of revenue anomalies, segment concentration risks, rapid growth accounts, and declining customer groups.

---

## 6. Comprehensive Test & Validation Suite

The system includes automated backend test scripts under [`tests/`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/marketing-analytics-platform/tests):

* [`finalProcessingRulesTest.ts`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/marketing-analytics-platform/tests/finalProcessingRulesTest.ts): Validates L2 exclusion, repeated invoice retention, GRN FY derivation, and Crore conversion.
* [`accuracyTest.ts`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/marketing-analytics-platform/tests/accuracyTest.ts): Verifies math precision for sales totals and quantities across sample data.
* [`fyBoundaryTest.ts`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/marketing-analytics-platform/tests/fyBoundaryTest.ts): Checks March 31 vs. April 1 boundary handling.
* [`duplicateHandlingTest.ts`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/marketing-analytics-platform/tests/duplicateHandlingTest.ts): Ensures non-removal of multi-line invoice items.
* [`plantAnalysisPageTest.ts`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/marketing-analytics-platform/tests/plantAnalysisPageTest.ts): Verifies plant mapping and ranking calculations.
* [`reconciliationTest.ts`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/marketing-analytics-platform/tests/reconciliationTest.ts): Full data reconciliation against raw dataset inputs.

---

## 7. How to Run & Develop

### Prerequisites
- Node.js (v18 or higher)
- npm

### Development Commands

```bash
# Install dependencies
npm install

# Start both frontend UI & express backend dev servers
npm run dev
npm run server

# Run backend processing tests
npx tsx tests/finalProcessingRulesTest.ts
npx tsx tests/accuracyTest.ts

# Generate mock data for testing
npm run generate-sample

# Production build check
npm run build
```

---

## 8. Directory Structure Overview

```
marketing-analytics-platform/
├── company_data.xlsx          # Master raw sales spreadsheet
├── index.html                 # HTML application entry point
├── package.json               # NPM scripts & dependencies
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite bundler setup
├── server/                    # Express backend & ETL logic
│   ├── index.ts               # File upload endpoints & server startup
│   ├── dataProcessor.ts       # Master ETL cleaning & business rules engine
│   └── insightsEngine.ts      # Automated anomaly & growth insights rules
├── src/                       # React Frontend Application
│   ├── App.tsx                # Layout shell & routing state
│   ├── main.tsx               # DOM mount entry point
│   ├── context/               # React Context (AnalyticsContext.tsx)
│   ├── types/                 # TypeScript type definitions (analytics.ts)
│   ├── components/            # UI Components
│   │   ├── common/            # Buttons, Modals, Cards, Filters
│   │   ├── dashboard/         # Overview Dashboard view
│   │   ├── layout/            # Navigation header & sidebar
│   │   ├── pages/             # Plant, Customer, Product, Segment, Time pages
│   │   └── upload/            # File upload dropzone & quality audit card
└── tests/                     # Automated rule verification test scripts
```
