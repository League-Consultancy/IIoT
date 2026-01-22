'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Factory, MapPin, HardDrive, ArrowLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function FactoryDetailPage() {
    const params = useParams();
    const factoryId = params.factoryId as string;

    const { data: factoryData, isLoading: factoryLoading } = useQuery({
        queryKey: ['factory', factoryId],
        queryFn: async () => {
            // Get all factories and find the one we need
            const response = await api.getFactories();
            const factory = response.data?.find((f: { id: string }) => f.id === factoryId);
            return factory ? { success: true, data: factory } : { success: false };
        },
        enabled: !!factoryId,
    });

    const { data: devicesData, isLoading: devicesLoading } = useQuery({
        queryKey: ['devices', 'factory', factoryId],
        queryFn: () => api.getDevices(1, 100, factoryId),
        enabled: !!factoryId,
    });

    const factory = factoryData?.data;
    const devices = devicesData?.data || [];

    if (factoryLoading) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                <div className="h-32 bg-muted animate-pulse rounded-xl" />
                <div className="h-64 bg-muted animate-pulse rounded-xl" />
            </div>
        );
    }

    if (!factory) {
        return (
            <div className="text-center py-12">
                <Factory className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold text-foreground">Factory not found</h2>
                <Link href="/dashboard/factories" className="text-primary-500 hover:underline mt-2 inline-block">
                    Back to Factories
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Back link */}
            <Link
                href="/dashboard/factories"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Factories
            </Link>

            {/* Factory Header */}
            <div className="card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                        <Factory className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-foreground">{factory.name}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <MapPin className="w-4 h-4" />
                            <span>{factory.location}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Created {format(new Date(factory.created_at), 'MMM d, yyyy')}</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <HardDrive className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{devices.length}</p>
                            <p className="text-sm text-muted-foreground">Total Devices</p>
                        </div>
                    </div>
                </div>
                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <HardDrive className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {devices.filter((d: { is_active: boolean }) => d.is_active).length}
                            </p>
                            <p className="text-sm text-muted-foreground">Active Devices</p>
                        </div>
                    </div>
                </div>
                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center">
                            <HardDrive className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {devices.filter((d: { is_active: boolean }) => !d.is_active).length}
                            </p>
                            <p className="text-sm text-muted-foreground">Inactive Devices</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Devices List */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Devices in this Factory</h2>

                {devicesLoading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                        ))}
                    </div>
                ) : devices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <HardDrive className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No devices registered in this factory</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {devices.map((device: {
                            id: string;
                            device_id: string;
                            name: string;
                            firmware_version?: string;
                            is_active: boolean
                        }) => (
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
                                        <p className="text-sm text-muted-foreground font-mono">{device.device_id}</p>
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
        </div>
    );
}
