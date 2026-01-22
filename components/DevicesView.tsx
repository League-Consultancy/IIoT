import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { api, Device, Factory } from '../services/api';
import { MOCK_DEVICES, MOCK_FACTORIES } from '../services/mockData';
import { DeviceStatus, Page } from '../types';

interface DevicesViewProps {
  onNavigate: (page: Page, id?: string) => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({ onNavigate }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [useRealData, setUseRealData] = useState(true);

  const [filterText, setFilterText] = useState('');
  const [filterFactory, setFilterFactory] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [devicesData, factoriesData] = await Promise.all([
          api.getDevices(),
          api.getFactories()
        ]);
        setDevices(devicesData);
        setFactories(factoriesData);
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
  const displayDevices = useRealData && devices.length > 0 ? devices : MOCK_DEVICES.map(d => ({
    ...d,
    status: d.status as 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'DISABLED'
  }));
  const displayFactories = useRealData && factories.length > 0 ? factories : MOCK_FACTORIES;

  const filteredDevices = displayDevices.filter(d => {
    const matchesText = d.name.toLowerCase().includes(filterText.toLowerCase()) || d.serialNumber.toLowerCase().includes(filterText.toLowerCase());
    const matchesFactory = filterFactory === 'all' || d.factoryId === filterFactory;
    return matchesText && matchesFactory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data source indicator */}
      <div className="flex items-center text-xs text-gray-500">
        <div className={`w-2 h-2 rounded-full mr-2 ${useRealData ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        {useRealData ? 'Connected to MongoDB' : 'Using sample data'}
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or serial..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 bg-white text-gray-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white placeholder-gray-500"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          value={filterFactory}
          onChange={(e) => setFilterFactory(e.target.value)}
        >
          <option value="all">All Factories</option>
          {displayFactories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Device Info</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Factory</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Running Hours</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Activity</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No devices found. Run <code className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">npx tsx backend/src/seed.ts</code> to seed the database.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => {
                  const factory = displayFactories.find(f => f.id === device.factoryId);
                  return (
                    <tr
                      key={device.id}
                      onClick={() => onNavigate('device-details', device.id)}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{device.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{device.serialNumber}</div>
                        <div className="text-xs text-gray-400 mt-1">{device.metadata?.model || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{factory?.name || device.factoryId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {(device.totalRunningHours || 0).toLocaleString()}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>{new Date(device.lastSeen).toLocaleDateString()}</div>
                        <div className="text-xs">FW: {device.firmwareVersion}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => { e.stopPropagation(); onNavigate('device-details', device.id); }}
                          className="text-brand-600 hover:text-brand-900 mr-4"
                        >
                          Logs
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onNavigate('device-details', device.id); }}
                          className="text-brand-600 hover:text-brand-900"
                        >
                          Config
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};