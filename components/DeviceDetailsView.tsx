import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { AnalyticsChart } from './AnalyticsChart';
import { api, Device, Factory, MachineSession, TelemetryPoint } from '../services/api';

interface DeviceDetailsViewProps {
    deviceId: string;
    onBack: () => void;
}

export const DeviceDetailsView: React.FC<DeviceDetailsViewProps> = ({ deviceId, onBack }) => {
    const [device, setDevice] = useState<Device | null>(null);
    const [factory, setFactory] = useState<Factory | null>(null);
    const [sessions, setSessions] = useState<MachineSession[]>([]);
    const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // 1. Fetch Device Info
                const deviceData = await api.getDevice(deviceId);
                setDevice(deviceData);

                // 2. Fetch Factory Info (if factoryId exists)
                let factoryData: Factory | null = null;
                if (deviceData.factoryId) {
                    try {
                        factoryData = await api.getFactory(deviceData.factoryId);
                    } catch (e) {
                        console.warn('Could not fetch factory details');
                    }
                }
                setFactory(factoryData);

                // 3. Fetch Sessions (Logs)
                const sessionsData = await api.getSessions(deviceId);
                setSessions(sessionsData);

                // 4. Fetch Telemetry (for Chart) - defaulting to STATE
                const telemetryData = await api.getTelemetry(deviceId, 24, 'STATE');
                setTelemetry(telemetryData);

            } catch (err) {
                console.error('Failed to fetch device details:', err);
                setError('Failed to load device details');
            } finally {
                setLoading(false);
            }
        };

        if (deviceId) {
            fetchData();
        }
    }, [deviceId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    if (error || !device) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Device not found</h3>
                <Button variant="secondary" onClick={onBack} className="mt-4">Back to Devices</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" onClick={onBack} className="p-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                            {device.name}
                            <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${device.status === 'ONLINE' ? 'bg-green-100 text-green-800' :
                                    device.status === 'OFFLINE' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'}`}>
                                {device.status}
                            </span>
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            SN: {device.serialNumber} • {factory?.name || 'Unknown Factory'}
                        </p>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <Button variant="secondary">Remote Config</Button>
                    <Button variant="primary">Live Console</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Machine State (Last 24h)</h3>
                        {telemetry.length > 0 ? (
                            <AnalyticsChart type="state" data={telemetry} height={400} />
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-400 border border-dashed border-gray-300 dark:border-slate-700 rounded">
                                No telemetry data available
                            </div>
                        )}
                    </div>

                    {/* Machine Sessions / Logs Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 flex justify-between items-center">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Machine Sessions (Logs)</h3>
                            <span className="text-xs text-gray-500">Last 7 days</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {sessions.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">No session logs found.</div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                                    <thead className="bg-gray-50 dark:bg-slate-700">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start Time</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stop Time</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                        {sessions.map((session) => {
                                            const durationMins = Math.floor(session.duration / 60);
                                            return (
                                                <tr key={session.id}>
                                                    <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-white font-mono text-xs">
                                                        {new Date(session.startTime).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-gray-500 dark:text-gray-400 font-mono text-xs">
                                                        {new Date(session.stopTime).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-right text-gray-700 dark:text-gray-300">
                                                        {durationMins} min
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Meta & Actions */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-5">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Device Properties</h3>
                        <dl className="space-y-4">
                            <div className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-2">
                                <dt className="text-sm text-gray-500 dark:text-gray-400">Firmware</dt>
                                <dd className="text-sm font-medium text-gray-900 dark:text-white font-mono">{device.firmwareVersion}</dd>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-2">
                                <dt className="text-sm text-gray-500 dark:text-gray-400">Model</dt>
                                <dd className="text-sm font-medium text-gray-900 dark:text-white">{device.metadata?.model || '-'}</dd>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-2">
                                <dt className="text-sm text-gray-500 dark:text-gray-400">Running Hours</dt>
                                <dd className="text-sm font-medium text-gray-900 dark:text-white">{device.totalRunningHours?.toLocaleString()}h</dd>
                            </div>
                            <div className="flex justify-between pb-2">
                                <dt className="text-sm text-gray-500 dark:text-gray-400">Last Seen</dt>
                                <dd className="text-sm font-medium text-gray-900 dark:text-white">{new Date(device.lastSeen).toLocaleTimeString()}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-5">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Maintenance</h3>
                        <div className="space-y-3">
                            <Button className="w-full justify-center" variant="secondary">Reboot Device</Button>
                            <Button className="w-full justify-center" variant="secondary">Push OTA Update</Button>
                            <Button className="w-full justify-center" variant="danger">Emergency Stop</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};