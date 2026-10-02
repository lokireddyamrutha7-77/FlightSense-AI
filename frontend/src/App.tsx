import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, navigationItems } from './components/layout/Sidebar';
import type { ModuleId } from './components/layout/Sidebar';
import { DashboardModule } from './components/modules/DashboardModule';
import { DelayPredictionModule } from './components/modules/DelayPredictionModule';
import { RouteIntelModule } from './components/modules/RouteIntelModule';
import { AirportIntelModule } from './components/modules/AirportIntelModule';
import { AirlineIntelModule } from './components/modules/AirlineIntelModule';
import { AnalyticsModule } from './components/modules/AnalyticsModule';
import { ModelPerformanceModule } from './components/modules/ModelPerformanceModule';
import { PredictionHistoryModule } from './components/modules/PredictionHistoryModule';
import { WhatIfAnalysisModule } from './components/modules/WhatIfAnalysisModule';
import { ExplainabilityModule } from './components/modules/ExplainabilityModule';
import { InteractiveMapModule } from './components/modules/InteractiveMapModule';

export const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [selectedPredictionId, setSelectedPredictionId] = useState<string | undefined>(undefined);

  const activeNavItem = navigationItems.find((item) => item.id === activeModule);

  const handleSelectPredictionForShap = (predId: string) => {
    setSelectedPredictionId(predId);
    setActiveModule('explainability');
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule onNavigate={(mod) => setActiveModule(mod)} />;
      case 'prediction':
        return <DelayPredictionModule />;
      case 'route-intel':
        return <RouteIntelModule />;
      case 'map':
        return <InteractiveMapModule />;
      case 'airport-intel':
        return <AirportIntelModule />;
      case 'airline-intel':
        return <AirlineIntelModule />;
      case 'analytics':
        return <AnalyticsModule />;
      case 'model-perf':
        return <ModelPerformanceModule />;
      case 'history':
        return <PredictionHistoryModule onSelectPrediction={handleSelectPredictionForShap} />;
      case 'what-if':
        return <WhatIfAnalysisModule />;
      case 'explainability':
        return <ExplainabilityModule predictionId={selectedPredictionId} />;
      default:
        return <DashboardModule onNavigate={(mod) => setActiveModule(mod)} />;
    }
  };

  return (
    <div className="min-h-screen bg-aviation-900 flex flex-col font-sans text-slate-100">
      <Header activeModuleTitle={activeNavItem?.label || 'Dashboard Overview'} />

      <div className="flex flex-1">
        <Sidebar activeModule={activeModule} onSelectModule={setActiveModule} />

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderModule()}
        </main>
      </div>
    </div>
  );
};

export default App;
