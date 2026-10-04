import React, { useState } from 'react';
import { PageId } from './types';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { PredictionPage } from './pages/PredictionPage';
import { DatasetPage } from './pages/DatasetPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { HeartDiseasePage } from './pages/HeartDiseasePage';
import { AboutProjectPage } from './pages/AboutProjectPage';
import { SettingsPage } from './pages/SettingsPage';
import { useModels } from './hooks/useApi';

const AppContent: React.FC = () => {
  const { themeConfig } = useTheme();
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [activeModelId, setActiveModelId] = useState<string>('random-forest');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const { models } = useModels();
  const activeModel = models.find((m) => m.id === activeModelId) || models[0];

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={(page) => setCurrentPage(page)}
            activeModelId={activeModelId}
          />
        );
      case 'prediction':
        return <PredictionPage activeModelId={activeModelId} />;
      case 'dataset':
        return <DatasetPage />;
      case 'model-performance':
        return (
          <ModelPerformancePage
            activeModelId={activeModelId}
            onSetActiveModelId={setActiveModelId}
          />
        );
      case 'heart-disease':
        return <HeartDiseasePage />;
      case 'about':
        return <AboutProjectPage />;
      case 'settings':
        return (
          <SettingsPage
            activeModelId={activeModelId}
            onSetActiveModelId={setActiveModelId}
          />
        );
      default:
        return (
          <DashboardPage
            onNavigate={(page) => setCurrentPage(page)}
            activeModelId={activeModelId}
          />
        );
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${themeConfig.bgClass}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Layout with dynamic margin for Sidebar */}
      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top Navigation Bar */}
        <Navbar
          currentPage={currentPage}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigate={(page) => setCurrentPage(page)}
          activeModelName={activeModel?.name || 'กำลังโหลด...'}
        />

        {/* Dynamic Page Body */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
