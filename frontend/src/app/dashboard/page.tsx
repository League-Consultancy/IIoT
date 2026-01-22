'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { HardDrive, Clock, Activity, ArrowRight, Factory } from 'lucide-react';

export default function DashboardPage() {
    const { data: devicesData, isLoading: devicesLoading } = useQuery({
        queryKey: ['devices'],
        queryFn: () => api.getDevices(1, 10),
    });

    const { data: factoriesData, isLoading: factoriesLoading } = useQuery({
        queryKey: ['factories'],
        queryFn: () => api.getFactories(),
    });

    const devices = devicesData?.data || [];
    const totalDevices = devicesData?.pagination?.total || 0;
    const factories = factoriesData?.data || [];
    const totalFactories = factoriesData?.pagination?.total || 0;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground">Device session analytics overview</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Devices"
                    value={totalDevices}
                    icon={HardDrive}
                    color="blue"
                    loading={devicesLoading}
                />
                <StatsCard
                    title="Factories"
                    value={totalFactories}
                    icon={Factory}
                    color="purple"
                    loading={factoriesLoading}
                />
                <StatsCard
                    title="Active Sessions"
                    value="-"
                    icon={Activity}
                    color="green"
                    loading={false}
                    subtitle="Historical data only"
                />
                <StatsCard
                    title="Avg Duration"
                    value="-"
                    icon={Clock}
                    color="orange"
                    loading={false}
                    subtitle="Select a device"
                />
            </div>

            {/* Recent Devices */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Recent Devices</h2>
                    <Link
                        href="/dashboard/devices"
                        className="text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1"
                    >
                        View all
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {devicesLoading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                        ))}
                    </div>
                ) : devices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <HardDrive className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No devices registered yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {devices.slice(0, 5).map((device: { id: string; device_id: string; name: string; firmware_version?: string; is_active: boolean }) => (
                            <Link
                                key={device.id}
                                href={`/dashboard/devices/${device.device_id}`}
                                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                        <HardDrive className="w-5 h-5 text-primary-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{device.name}</p>
                                        <p className="text-sm text-muted-foreground">{device.device_id}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${device.is_active
                                            ? 'bg-green-500/20 text-green-500'
                                            : 'bg-slate-500/20 text-slate-500'
                                        }`}>
                                        {device.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    {device.firmware_version && (
                                        <p className="text-xs text-muted-foreground mt-1">v{device.firmware_version}</p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Info Banner */}
            <div className="card p-6 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border-primary-500/20">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                        <Activity className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Session-Based Analytics</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            This platform provides historical working duration analytics based on device session logs.
                            Select a device to view its timeline and duration metrics.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({
    title,
    value,
    icon: Icon,
    color,
    loading,
    subtitle,
}: {
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    color: 'blue' | 'purple' | 'green' | 'orange';
    loading: boolean;
    subtitle?: string;
}) {
    const colorClasses = {
        blue: 'from-blue-500/20 to-blue-500/5 text-blue-500',
        purple: 'from-purple-500/20 to-purple-500/5 text-purple-500',
        green: 'from-green-500/20 to-green-500/5 text-green-500',
        orange: 'from-orange-500/20 to-orange-500/5 text-orange-500',
    };

    return (
        <div className="card p-6">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    {loading ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1" />
                    ) : (
                        <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
                    )}
                    {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}
