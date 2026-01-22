'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Factory, MapPin, ChevronRight, HardDrive } from 'lucide-react';
import { format } from 'date-fns';

export default function FactoriesPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['factories'],
        queryFn: () => api.getFactories(),
    });

    const { data: devicesData } = useQuery({
        queryKey: ['devices'],
        queryFn: () => api.getDevices(1, 1000),
    });

    const factories = data?.data || [];
    const devices = devicesData?.data || [];

    // Count devices per factory
    function getDeviceCount(factoryId: string): number {
        return devices.filter((d: { factory_id: string }) => d.factory_id === factoryId).length;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Factories</h1>
                <p className="text-muted-foreground">Manufacturing facilities and their devices</p>
            </div>

            {/* Factories Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : factories.length === 0 ? (
                <div className="text-center py-12">
                    <Factory className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-foreground">No factories found</h3>
                    <p className="text-muted-foreground">No factories have been registered yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {factories.map((factory: { id: string; name: string; location: string; created_at: string }) => (
                        <Link
                            key={factory.id}
                            href={`/dashboard/factories/${factory.id}`}
                            className="card p-5 hover:border-purple-500/50 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
                                    <Factory className="w-6 h-6 text-purple-500" />
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                            </div>

                            <h3 className="font-semibold text-foreground group-hover:text-purple-500 transition-colors">
                                {factory.name}
                            </h3>

                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <MapPin className="w-3 h-3" />
                                {factory.location}
                            </div>

                            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <HardDrive className="w-4 h-4" />
                                    <span>{getDeviceCount(factory.id)} devices</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {format(new Date(factory.created_at), 'MMM yyyy')}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
