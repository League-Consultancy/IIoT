'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { HardDrive, Search, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function DevicesPage() {
    const [search, setSearch] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['devices'],
        queryFn: () => api.getDevices(1, 100),
    });

    const devices = data?.data || [];
    const filteredDevices = devices.filter(
        (device: { name: string; device_id: string }) =>
            device.name.toLowerCase().includes(search.toLowerCase()) ||
            device.device_id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Devices</h1>
                    <p className="text-muted-foreground">View and analyze device session data</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search devices..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input w-full pl-10"
                />
            </div>

            {/* Devices Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : filteredDevices.length === 0 ? (
                <div className="text-center py-12">
                    <HardDrive className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-foreground">No devices found</h3>
                    <p className="text-muted-foreground">
                        {search ? 'Try a different search term' : 'No devices have been registered yet'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDevices.map((device: {
                        id: string;
                        device_id: string;
                        name: string;
                        firmware_version?: string;
                        is_active: boolean;
                        registered_at: string;
                    }) => (
                        <Link
                            key={device.id}
                            href={`/dashboard/devices/${device.device_id}`}
                            className="card p-5 hover:border-primary-500/50 transition-all group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-500/5 flex items-center justify-center">
                                        <HardDrive className="w-6 h-6 text-primary-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground group-hover:text-primary-500 transition-colors">
                                            {device.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground font-mono">{device.device_id}</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary-500 transition-colors" />
                            </div>
                            <div className="mt-4 flex items-center gap-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${device.is_active
                                        ? 'bg-green-500/20 text-green-500'
                                        : 'bg-slate-500/20 text-slate-500'
                                    }`}>
                                    {device.is_active ? 'Active' : 'Inactive'}
                                </span>
                                {device.firmware_version && (
                                    <span className="text-xs text-muted-foreground">
                                        v{device.firmware_version}
                                    </span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
