
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { DashboardView } from './components/DashboardView';
import { FactoriesView } from './components/FactoriesView';
import { DevicesView } from './components/DevicesView';
import { OTAManagerView } from './components/OTAManagerView';
import { AdminSettingsView } from './components/AdminSettingsView';
import { FactoryDetailsView } from './components/FactoryDetailsView';
import { DeviceDetailsView } from './components/DeviceDetailsView';
import { NotificationsView } from './components/NotificationsView';
import { AuthView } from './components/AuthView';
import { User, UserRole, Page } from './types';
import { auth, AuthUser } from './services/api';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Convert AuthUser to User type
  const handleAuthSuccess = (authUser: AuthUser) => {
    const user: User = {
      id: authUser.id,
      email: authUser.email,
      role: authUser.role as UserRole,
      tenantId: authUser.tenantId,
      factoryIds: authUser.factoryIds,
      name: authUser.name
    };
    setCurrentUser(user);
  };

  const handleLogout = () => {
    auth.logout();
    setCurrentUser(null);
    setCurrentPage('dashboard');
  };

  // Authentication Flow
  if (!currentUser) {
    return (
      <AuthView onSuccess={handleAuthSuccess} />
    );
  }

  const handleNavigate = (page: Page, id?: string) => {
    setCurrentPage(page);
    if (id) {
      setSelectedId(id);
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />;
      case 'factories':
        return <FactoriesView onNavigate={handleNavigate} />;
      case 'devices':
        return <DevicesView onNavigate={handleNavigate} />;
      case 'ota':
        return <OTAManagerView />;
      case 'admin':
        return <AdminSettingsView />;
      case 'notifications':
        return <NotificationsView onBack={() => handleNavigate('dashboard')} />;
      case 'factory-details':
        if (!selectedId) return <FactoriesView onNavigate={handleNavigate} />;
        return <FactoryDetailsView
          factoryId={selectedId}
          onNavigate={handleNavigate}
          onBack={() => handleNavigate('factories')}
        />;
      case 'device-details':
        if (!selectedId) return <DevicesView onNavigate={handleNavigate} />;
        return <DeviceDetailsView
          deviceId={selectedId}
          onBack={() => handleNavigate('devices')}
        />;
      default:
        return <DashboardView onNavigate={handleNavigate} />;
    }
  };

  const getPageTitle = (page: Page) => {
    switch (page) {
      case 'dashboard': return 'Machine Analytics Overview';
      case 'factories': return 'Factory Overview';
      case 'devices': return 'Device Inventory';
      case 'ota': return 'OTA Update Manager';
      case 'admin': return 'Administration';
      case 'notifications': return 'System Notifications';
      case 'factory-details': return 'Factory Details';
      case 'device-details': return 'Device Telemetry';
      default: return 'Dashboard';
    }
  }

  return (
    <Layout
      user={currentUser}
      onLogout={handleLogout}
      title={getPageTitle(currentPage)}
      currentPage={currentPage}
      onNavigate={(page) => handleNavigate(page)}
    >
      <div key={currentPage} className="animate-fade-in-up h-full">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;
