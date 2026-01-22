import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { api, Factory, Device } from '../services/api';
import { MOCK_FACTORIES, MOCK_DEVICES } from '../services/mockData';
import { DeviceStatus, Page } from '../types';

interface FactoriesViewProps {
  onNavigate: (page: Page, id?: string) => void;
}

export const FactoriesView: React.FC<FactoriesViewProps> = ({ onNavigate }) => {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [useRealData, setUseRealData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [factoriesData, devicesData] = await Promise.all([
          api.getFactories(),
          api.getDevices()
        ]);
        setFactories(factoriesData);
        setDevices(devicesData);
        setUseRealData(true);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setUseRealData(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Use mock data as fallback
  const displayFactories = useRealData && factories.length > 0 ? factories : MOCK_FACTORIES;
  const displayDevices = useRealData && devices.length > 0 ? devices : MOCK_DEVICES.map(d => ({
    ...d,
    status: d.status as 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'DISABLED'
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Data source indicator */}
      <div className="mb-4 flex items-center text-xs text-gray-500">
        <div className={`w-2 h-2 rounded-full mr-2 ${useRealData ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        {useRealData ? 'Connected to MongoDB' : 'Using sample data'}
      </div>

      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600 dark:text-gray-400">Manage your industrial sites and locations.</p>
        <Button>Add Factory</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayFactories.map(factory => {
          const factoryDevices = displayDevices.filter(d => d.factoryId === factory.id);
          const totalRunningHours = factoryDevices.reduce((sum, d) => sum + (d.totalRunningHours || 0), 0);

          return (
            <div
              key={factory.id}
              onClick={() => onNavigate('factory-details', factory.id)}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-slate-700 flex flex-col cursor-pointer transform transition hover:scale-[1.01]"
            >
              <div className="h-32 bg-gray-200 relative">
                {factory.image ? (
                  <img src={factory.image} alt={factory.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-brand-900 flex items-center justify-center text-white text-3xl font-bold opacity-50">
                    {factory.name.charAt(0)}
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 px-2 py-1 rounded text-xs font-semibold text-slate-900 dark:text-white">
                  {factory.id.substring(0, 12)}...
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{factory.name}</h3>
                <p className="text-sm text-gray-500 mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {factory.location}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4 mt-auto">
                  <div className="bg-gray-50 dark:bg-slate-700 p-2 rounded text-center">
                    <span className="block text-xl font-bold text-gray-800 dark:text-gray-100">{factoryDevices.length}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Devices</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-700 p-2 rounded text-center">
                    <span className="block text-xl font-bold text-brand-600">{totalRunningHours.toLocaleString()}h</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Running</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <span className="text-xs text-gray-400">Timezone: {factory.timezone}</span>
                  <span className="text-xs text-gray-400">{factoryDevices.length} devices</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};