import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, navigationItems } from './components/layout/Sidebar';
import type { ModuleId } from './components/layout/Sidebar';
import { LandingPage } from './components/layout/LandingPage';
import { AuthModal } from './components/layout/AuthModal';
import { DashboardModule } from './components/modules/DashboardModule';
import { DelayPredictionModule } from './components/modules/DelayPredictionModule';
import { ProfileModule } from './components/modules/ProfileModule';
import { SavedFlightsModule } from './components/modules/SavedFlightsModule';
import { RouteIntelModule } from './components/modules/RouteIntelModule';
import { AirportIntelModule } from './components/modules/AirportIntelModule';
import { AirlineIntelModule } from './components/modules/AirlineIntelModule';
import { AnalyticsModule } from './components/modules/AnalyticsModule';
import { ModelPerformanceModule } from './components/modules/ModelPerformanceModule';
import { PredictionHistoryModule } from './components/modules/PredictionHistoryModule';
import { WhatIfAnalysisModule } from './components/modules/WhatIfAnalysisModule';
import { ExplainabilityModule } from './components/modules/ExplainabilityModule';
import { InteractiveMapModule } from './components/modules/InteractiveMapModule';
import type { UserResponse, FlightPredictionRequest } from './types/api';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [isLandingPage, setIsLandingPage] = useState<boolean>(true);

  const [activeModule, setActiveModule] = useState<ModuleId>('prediction');
  const [selectedPredictionId, setSelectedPredictionId] = useState<string | undefined>(undefined);
  const [predictionPrefill, setPredictionPrefill] = useState<Partial<FlightPredictionRequest> | undefined>(undefined);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    const savedUser = localStorage.getItem('flightsense_user');
    const token = localStorage.getItem('flightsense_token');
    if (savedUser && token) {
      try {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        setIsLandingPage(false);
      } catch (e) {
        localStorage.removeItem('flightsense_user');
        localStorage.removeItem('flightsense_token');
      }
    }
  }, []);

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('flightsense_token');
    localStorage.removeItem('flightsense_user');
    setCurrentUser(null);
    setIsLandingPage(true);
  };

  const handleSelectPredictionForShap = (predId: string) => {
    setSelectedPredictionId(predId);
    setActiveModule('explainability');
  };

  const handlePredictFromSaved = (flightData: Partial<FlightPredictionRequest>) => {
    setPredictionPrefill(flightData);
    setActiveModule('prediction');
  };

  const handleModuleSelect = (mod: ModuleId) => {
    // Protected routes check
    if (!currentUser && (mod === 'profile' || mod === 'saved-flights')) {
      handleOpenAuth('signin');
      return;
    }
    setActiveModule(mod);
  };

  if (isLandingPage && !currentUser) {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode) => handleOpenAuth(mode)}
          onExploreDemo={() => setIsLandingPage(false)}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authMode}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={(u) => {
            setCurrentUser(u);
            setIsLandingPage(false);
          }}
        />
      </>
    );
  }

  const activeNavItem = navigationItems.find((item) => item.id === activeModule);

  const renderModule = () => {
    switch (activeModule) {
      case 'prediction':
        return <DelayPredictionModule initialFlightData={predictionPrefill} />;
      case 'dashboard':
        return <DashboardModule onNavigate={(mod) => handleModuleSelect(mod)} />;
      case 'profile':
        return (
          <ProfileModule
            onLogout={handleLogout}
            onNavigateSavedFlights={() => setActiveModule('saved-flights')}
          />
        );
      case 'saved-flights':
        return <SavedFlightsModule onPredictFlight={handlePredictFromSaved} />;
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
        return <DelayPredictionModule initialFlightData={predictionPrefill} />;
    }
  };

  return (
    <div className="min-h-screen bg-aviation-900 flex flex-col font-sans text-slate-100">
      <Header
        activeModuleTitle={activeNavItem?.label || 'Flight Delay Prediction'}
        currentUser={currentUser}
        onNavigateModule={(mod) => handleModuleSelect(mod)}
        onOpenAuthModal={(mode) => handleOpenAuth(mode)}
        onLogout={handleLogout}
        onOpenLanding={() => setIsLandingPage(true)}
      />

      <div className="flex flex-1">
        <Sidebar
          activeModule={activeModule}
          onSelectModule={handleModuleSelect}
          onOpenPublicLanding={() => setIsLandingPage(true)}
        />

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderModule()}
        </main>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => {
          setCurrentUser(u);
          setIsLandingPage(false);
        }}
      />
    </div>
  );
};

export default App;
