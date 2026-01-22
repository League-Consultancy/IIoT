import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { api, Factory, Device } from '../services/api';
import { DeviceStatus, Page } from '../types';

interface FactoryDetailsViewProps {
    factoryId: string;
    onNavigate: (page: Page, id?: string) => void;
    onBack: () => void;
}

export const FactoryDetailsView: React.FC<FactoryDetailsViewProps> = ({ factoryId, onNavigate, onBack }) => {
    const [factory, setFactory] = useState<Factory | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [factoryData, devicesData] = await Promise.all([
                    api.getFactory(factoryId),
                    api.getDevices(factoryId)
                ]);
                setFactory(factoryData);
                setDevices(devicesData);
            } catch (err) {
                console.error('Failed to fetch factory details:', err);
                setError('Failed to load factory details');
            } finally {
                setLoading(false);
            }
        };
        if (factoryId) {
            fetchData();
        }
    }, [factoryId]);

    const stats = {
        total: devices.length,
        totalRunningHours: devices.reduce((sum, d) => sum + (d.totalRunningHours || 0), 0),
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    if (error || !factory) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Factory not found</h3>
                <Button variant="secondary" onClick={onBack} className="mt-4">Back to Factories</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back Button Area */}
            <div>
                <Button variant="secondary" onClick={onBack} className="flex items-center space-x-2">
                    <span>←</span>
                    <span>Back to Factories</span>
                </Button>
            </div>

            {/* Header / Banner */}
            <div className="relative rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <div className="h-48 w-full relative">
                    {factory.image ? (
                        <img src={factory.image} alt={factory.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-slate-800 to-slate-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    <div className="absolute bottom-6 left-6 text-white">
                        <h1 className="text-3xl font-bold">{factory.name}</h1>
                        <p className="opacity-90 flex items-center mt-1">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {factory.location}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Total Devices</span>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 border-l-4 border-l-brand-500">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Total Running Hours</span>
                    <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{stats.totalRunningHours.toLocaleString()}h</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Device List */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Installed Devices</h3>
                        <Button variant="secondary" className="text-xs">Add Device</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Running Hours</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Activity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {devices.map(device => (
                                    <tr
                                        key={device.id}
                                        onClick={() => onNavigate('device-details', device.id)}
                                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar: Details */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Facility Information</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Timezone</span>
                                <span className="text-gray-900 dark:text-white font-medium">{factory.timezone}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Tenant ID</span>
                                <span className="text-gray-900 dark:text-white font-medium">{factory.tenantId}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};