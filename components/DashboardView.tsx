
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { AnalyticsChart } from './AnalyticsChart';
import { DeviceStatus, Page, TelemetryPoint } from '../types';
import { api, Device, Factory, DashboardStats, wsService, WebSocketMessage } from '../services/api';
import { MOCK_FACTORIES, generateMockTelemetry, generateMockRuntime } from '../services/mockData';

interface DashboardViewProps {
  onNavigate: (page: Page, id?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [selectedFactory, setSelectedFactory] = useState<string>('all');
  const [devices, setDevices] = useState<Device[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ total: 0, online: 0, offline: 0, maintenance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useRealData, setUseRealData] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [recentSession, setRecentSession] = useState<{ deviceName: string; duration: number } | null>(null);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!useRealData) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [devicesData, factoriesData, statsData] = await Promise.all([
          api.getDevices(selectedFactory !== 'all' ? selectedFactory : undefined),
          api.getFactories(),
          api.getStats(selectedFactory !== 'all' ? selectedFactory : undefined)
        ]);

        setDevices(devicesData);
        setFactories(factoriesData);
        setStats(statsData);
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError(err.message || 'Failed to load data');
        // Fall back to mock data
        setUseRealData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedFactory, useRealData]);

  // Subscribe to WebSocket for real-time updates
  useEffect(() => {
    const handleMessage = (message: WebSocketMessage) => {
      if (message.type === 'NEW_SESSION') {
        const { session, device } = message.data;

        // Update device in list if it exists
        if (device) {
          setDevices(prev => prev.map(d =>
            d.id === device.id
              ? { ...d, ...device, status: device.status as Device['status'] }
              : d
          ));

          // Show notification for recent session
          setRecentSession({
            deviceName: device.name,
            duration: session.duration
          });

          // Clear notification after 5 seconds
          setTimeout(() => setRecentSession(null), 5000);
        }

        // Refresh stats
        api.getStats(selectedFactory !== 'all' ? selectedFactory : undefined)
          .then(setStats)
          .catch(console.error);
      }
    };

    const unsubscribe = wsService.subscribe(handleMessage);

    // Check connection status periodically
    const checkConnection = setInterval(() => {
      setWsConnected(wsService.isConnected());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(checkConnection);
    };
  }, [selectedFactory]);

  // Use mock data as fallback
  const displayFactories = useRealData && factories.length > 0 ? factories : MOCK_FACTORIES;

  // Generate chart data (using mock for now as telemetry requires device selection)
  const telemetryData = useMemo(() => generateMockTelemetry(60), []);
  const runtimeData = useMemo(() => generateMockRuntime(), []);

  const handleExportCSV = () => {
    const headers = ['Device Name', 'Serial Number', 'Factory', 'Status', 'Last Seen', 'Firmware', 'Running Hours'];
    const rows = devices.map(device => {
      const factory = displayFactories.find(f => f.id === device.factoryId);
      return [
        `"${device.name}"`,
        `"${device.serialNumber}"`,
        `"${factory ? factory.name : device.factoryId}"`,
        `"${device.status}"`,
        `"${new Date(device.lastSeen).toLocaleString()}"`,
        `"${device.firmwareVersion}"`,
        `"${device.totalRunningHours}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `device_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading dashboard data...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-800 dark:text-yellow-200 text-sm">
                Using sample data. Backend connection failed: {error}
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setUseRealData(true)}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Real-time Session Notification Toast */}
      {recentSession && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg animate-fade-in-up">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-green-800 dark:text-green-200 text-sm">
              <strong>{recentSession.deviceName}</strong> logged {Math.round(recentSession.duration / 60)} min session
            </span>
          </div>
        </div>
      )}

      {/* Data Source Indicator */}
      <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${useRealData && !error ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          {useRealData && !error ? 'Connected to MongoDB' : 'Using sample data'}
        </div>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${wsConnected ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}></div>
          {wsConnected ? 'Live updates enabled' : 'Connecting to live updates...'}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex space-x-4">
        <select
          className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md bg-white text-gray-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-colors"
          value={selectedFactory}
          onChange={(e) => setSelectedFactory(e.target.value)}
        >
          <option value="all">All Factories</option>
          {displayFactories.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <div className="flex-1" />
        <Button variant="secondary" onClick={handleExportCSV}>Export CSV</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Devices</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <p className="text-sm font-medium text-brand-600 dark:text-brand-400">Total Running Hours</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {devices.reduce((sum, d) => sum + (d.totalRunningHours || 0), 0).toLocaleString()}h
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Factories</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{factories.length}</p>
        </div>
      </div>

      {/* Main Analytics Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <AnalyticsChart type="state" data={telemetryData} />
        </div>
        <div>
          <AnalyticsChart type="runtime" data={runtimeData} />
        </div>
      </div>

      {/* Device List Table */}
      <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Active Device Registry</h3>
          <span className="text-xs text-gray-500">Showing {devices.length} devices</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Device Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Running Hours</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Activity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Firmware</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No devices found. Run <code className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">npm run seed:db</code> to seed the database.
                  </td>
                </tr>
              ) : (
                devices.map((device) => (
                  <tr
                    key={device.id}
                    onClick={() => onNavigate('device-details', device.id)}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{device.name}</div>
                      <div className="text-xs text-gray-500">{device.serialNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {(device.totalRunningHours || 0).toLocaleString()}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(device.lastSeen).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      v{device.firmwareVersion}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
