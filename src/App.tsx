import React from 'react';
import { useAnalytics, AnalyticsProvider } from './context/AnalyticsContext';
import { LandingUpload } from './components/upload/LandingUpload';
import { ProcessingAnimation } from './components/upload/ProcessingAnimation';
import { DataQualitySummary } from './components/upload/DataQualitySummary';
import { AppShell } from './components/layout/AppShell';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { PlantAnalysis } from './components/pages/PlantAnalysis';
import { ProductAnalysis } from './components/pages/ProductAnalysis';
import { CustomerAnalysis } from './components/pages/CustomerAnalysis';
import { SegmentAnalysis } from './components/pages/SegmentAnalysis';
import { TimeAnalysis } from './components/pages/TimeAnalysis';
import { BusinessInsights } from './components/pages/BusinessInsights';
import { DataQualityPage } from './components/pages/DataQualityPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { DataTable } from './components/common/DataTable';

const MainContentSwitcher: React.FC = () => {
  const { activeView, filteredRecords } = useAnalytics();

  switch (activeView) {
    case 'overview':
      return (
        <div className="space-y-8">
          <OverviewDashboard />
          <DataTable records={filteredRecords} title="Filtered Active Records" />
        </div>
      );
    case 'plants':
      return <PlantAnalysis />;
    case 'products':
      return <ProductAnalysis />;
    case 'customers':
      return <CustomerAnalysis />;
    case 'segments':
      return <SegmentAnalysis />;
    case 'time':
      return <TimeAnalysis />;
    case 'insights':
      return <BusinessInsights />;
    case 'quality':
      return <DataQualityPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <OverviewDashboard />;
  }
};

const AppContent: React.FC = () => {
  const { activeView } = useAnalytics();

  if (activeView === 'landing') {
    return <LandingUpload />;
  }

  if (activeView === 'processing') {
    return <ProcessingAnimation />;
  }

  if (activeView === 'quality_summary') {
    return <DataQualitySummary />;
  }

  return (
    <AppShell>
      <MainContentSwitcher />
    </AppShell>
  );
};

export function App() {
  return (
    <AnalyticsProvider>
      <AppContent />
    </AnalyticsProvider>
  );
}

export default App;
