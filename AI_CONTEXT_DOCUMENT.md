# AI Context & Master Prompt Document for Marketing Analytics Platform (MAP)

> **Instructions for User:** Copy and paste this entire document into any AI model (ChatGPT, Claude, Gemini, Copilot, etc.) as your initial system prompt or context window attachment whenever starting a new conversation about this project.

---

## 1. Project Overview & Context

You are working on the **Marketing Analytics Platform (MAP)**, a specialized enterprise web application designed to ingest, clean, validate, analyze, and visualize complex industrial and automotive B2B sales datasets (e.g. SAP/ERP export files like `company_data.xlsx`).

The platform processes large sales ledgers containing millions in revenue and unit volume, converting raw invoice rows into executive dashboards, 3-level customer account hierarchies, manufacturing plant distributions, product segment analytics, multi-year financial trends, and automated business insight alerts.

---

## 2. Technology Stack & Framework Setup

- **Frontend**: React 19, TypeScript 5.9, Vite 6, Tailwind CSS 3.4, Lucide React (`lucide-react`), Framer Motion 12 (`framer-motion`), Recharts 2.15 (`recharts`).
- **Backend**: Express 4, Node.js (`tsx watch`), SheetJS (`xlsx`).
- **Data Persistence & State**: In-memory React Context ([`AnalyticsContext.tsx`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/marketing-analytics-platform/src/context/AnalyticsContext.tsx)) + Server Parsing Engine ([`server/dataProcessor.ts`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/marketing-analytics-platform/server/dataProcessor.ts)).
- **Testing**: Native Node TypeScript scripts in `tests/` executed via `npx tsx tests/<testName>.ts`.

---

## 3. Strict Business Logic & Invariant Data Rules

Any AI assistant or developer modifying this repository **MUST** preserve and strictly enforce the following 6 core business invariants:

### Rule 1: Bill Type L2 Exclusion
- Records where `Bill Type` equals `'L2'` represent internal transfers or non-commercial adjustments.
- **Invariant**: L2 records must be identified during raw parsing and **strictly excluded** from clean datasets, KPIs, charts, and financial calculations.

### Rule 2: GRN Date Financial Year Derivation
- Financial Years (FY) run from **April 1 to March 31** (Indian Fiscal Calendar).
- **Invariant**: Financial Year, Quarter, and Month MUST be calculated **strictly from `GRN Date`** (Goods Receipt Note Date). Never use Invoice Date, Bill Date, or system upload timestamp for FY derivation.
  - April 1 – Dec 31 of Year Y $\rightarrow$ `FY Y-(Y+1)`
  - Jan 1 – Mar 31 of Year Y $\rightarrow$ `FY (Y-1)-Y`

### Rule 3: Sales Crores Scaling Formula
- Document sales rates are provided in raw Indian Rupees (INR).
- **Invariant**: $\text{Sale Value (Crores)} = \frac{\text{Sum of Sale Value (Doc Rate)}}{10,000,000}$ (`1 Cr = 10,000,000 INR`). This scaling is applied unconditionally during parsing.

### Rule 4: Multi-Line Invoice Retention
- Multiple rows may share the exact same `Invoice Num.`.
- **Invariant**: Repeated invoice numbers represent valid multi-item transactions. **DO NOT** deduplicate or drop rows with identical invoice numbers. Preserving all valid lines ensures exact revenue and unit quantity reconciliation.

### Rule 5: Standardized Plant Code Mapping
- Raw plant data contains numeric codes or variations.
- **Invariant**: Standardize plant codes and display names as follows:
  - Code `3000` $\rightarrow$ Name **Chennai**
  - Code `3100` $\rightarrow$ Name **Hyderabad**
  - Code `3200` $\rightarrow$ Name **Pondicherry**
  - Code `3600` $\rightarrow$ Name **Trichy**

### Rule 6: Field Isolation (Material Code vs. Description)
- **Invariant**: `Material Code` and `Description` are strictly separate concepts. Never fall back to copying `Material Code` into `Description` or vice versa.

---

## 4. Key Data Types & Interfaces

Refer to [`src/types/analytics.ts`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/marketing-analytics-platform/src/types/analytics.ts) for full type definitions:

```typescript
export interface CleanSalesRecord {
  id: string;
  custNum: string;
  customer: string;
  customerGroup: string;
  masterCustomerGroup: string;
  materialCode: string;
  description: string;
  grnDate: string; // YYYY-MM-DD
  billType: string;
  month: string;
  monthSortKey?: number;
  quarter: string;
  year?: number;
  financialYear: string; // e.g. "FY 2024-25"
  saleValue: number; // In Crores (Doc rate / 10,000,000)
  saleQty: number; // Invoice volume in nos
  productSegment: string;
  plantCode: string;
  plantName: string;
  invoiceNum: string;
  rblProductSegment?: string;
  customerPurNum?: string;
  refDocNo?: string;
  oemCustomer?: string;
  organicNpd?: string;
  aopOem?: string;
  application?: string;
}

export interface KPIMetrics {
  totalSalesValue: number; // Crores
  totalInvQty: number;
  customerCount: number; // Distinct Master Customer Group Count
  individualCustomerCount: number;
  customerGroupCount: number;
  masterCustomerGroupCount: number;
  productCount: number;
  segmentCount: number;
  plantCount: number;
  invoiceCount: number;
  transactionCount: number;
}
```

---

## 5. Directory Structure & Key File Responsibilities

```
marketing-analytics-platform/
├── server/
│   ├── index.ts               # Express server, file upload router, API endpoints
│   ├── dataProcessor.ts       # Master ETL ingestion, cleaning, FY calculation, L2 exclusion
│   └── insightsEngine.ts      # Automated business anomaly, growth & concentration alert rules
├── src/
│   ├── App.tsx                # Main App shell, navigation header, tab routing
│   ├── context/
│   │   └── AnalyticsContext.tsx # Central React Context (state, filters, clean records, KPIs)
│   ├── types/
│   │   └── analytics.ts       # Central TypeScript interface definitions
│   └── components/
│       ├── dashboard/
│       │   └── OverviewDashboard.tsx # Executive overview cards, YoY charts, segment share
│       ├── pages/
│       │   ├── PlantAnalysis.tsx     # Chennai, Hyderabad, Pondicherry, Trichy metrics
│       │   ├── ProductAnalysis.tsx   # SKU level analysis, Pareto 80/20 rules
│       │   ├── CustomerAnalysis.tsx  # 3-tier customer hierarchy & account concentration
│       │   ├── SegmentAnalysis.tsx   # Product & vehicle segment breakdowns
│       │   ├── TimeAnalysis.tsx      # Monthly/Quarterly trajectory trends
│       │   ├── BusinessInsights.tsx  # Automated growth/decline anomaly list
│       │   └── DataQualityPage.tsx   # Data audit log & flagged raw rows view
│       └── upload/
│           └── DataQualitySummary.tsx # Excel dropzone & parsing summary component
└── tests/                     # Automated backend verification test scripts
    ├── finalProcessingRulesTest.ts # Master test for L2, invoice retention, FY, Cr scaling
    ├── accuracyTest.ts        # Math precision verification
    ├── fyBoundaryTest.ts      # March 31 / April 1 boundary check
    └── plantAnalysisPageTest.ts # Plant mapping verification
```

---

## 6. Guidelines for AI Assistants Working on Code Edits

1. **Do Not Swalllow Exceptions or Alter Data Rules**: Never remove the L2 exclusion, change the Crores division factor ($10,000,000$), or modify the GRN Date FY logic.
2. **Preserve Customer Hierarchy**: Always respect `Customer` $\rightarrow$ `Customer Group` $\rightarrow$ `Master Customer Group`. KPI customer count represents **Distinct Master Customer Groups**.
3. **Verify Against Test Suite**: After making any code changes in `server/` or `src/context/`, run `npx tsx tests/finalProcessingRulesTest.ts` to ensure no regression.
4. **Follow Design Principles**: The UI uses modern Tailwind CSS dark/light theme styling with Lucide React icons, Framer Motion transitions, and responsive Recharts components. Maintain clean, accessible visual presentation.
