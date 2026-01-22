'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { HardDrive, Clock, Activity, Calendar, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { format, subDays, subMonths } from 'date-fns';
import { PeriodSelector } from '@/components/PeriodSelector';
import { SessionTimeline } from '@/components/SessionTimeline';
import { DurationMetrics } from '@/components/DurationMetrics';
import { ExportButton } from '@/components/ExportButton';

export default function DeviceDetailPage() {
    const params = useParams();
    const deviceId = params.deviceId as string;

    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: subMonths(new Date(), 1),
        to: new Date(),
    });
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

    const { data: deviceData, isLoading: deviceLoading } = useQuery({
        queryKey: ['device', deviceId],
        queryFn: () => api.getDevice(deviceId),
        enabled: !!deviceId,
    });

    const { data: summaryData, isLoading: summaryLoading } = useQuery({
        queryKey: ['analytics-summary', deviceId, dateRange],
        queryFn: () => api.getAnalyticsSummary(
            deviceId,
            dateRange.from.toISOString(),
            dateRange.to.toISOString()
        ),
        enabled: !!deviceId,
    });

    const device = deviceData?.data;
    const summary = summaryData?.data;

    function formatDuration(ms: number): string {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Back link */}
            <Link
                href="/dashboard/devices"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Devices
            </Link>

            {/* Device Header */}
            {deviceLoading ? (
                <div className="h-24 bg-muted animate-pulse rounded-xl" />
            ) : device ? (
                <div className="card p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                            <HardDrive className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-foreground">{device.name}</h1>
                            <p className="text-muted-foreground font-mono">{device.device_id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <ExportButton deviceId={deviceId} dateRange={dateRange} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card p-6 text-center">
                    <p className="text-muted-foreground">Device not found</p>
                </div>
            )}

            {/* Period Selector */}
            <PeriodSelector
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                period={period}
                onPeriodChange={setPeriod}
            />

            {/* Summary Stats */}
            {summaryLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : summary ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Duration"
                        value={formatDuration(summary.metrics.total_duration_ms)}
                        icon={Clock}
                        color="blue"
                    />
                    <StatCard
                        title="Session Count"
                        value={summary.metrics.session_count.toString()}
                        icon={Activity}
                        color="green"
                    />
                    <StatCard
                        title="Avg Duration"
                        value={formatDuration(summary.metrics.avg_session_duration_ms)}
                        icon={Clock}
                        color="purple"
                    />
                    <StatCard
                        title="Period"
                        value={`${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`}
                        icon={Calendar}
                        color="orange"
                    />
                </div>
            ) : null}

            {/* Duration Metrics Chart */}
            <DurationMetrics deviceId={deviceId} dateRange={dateRange} period={period} />

            {/* Session Timeline */}
            <SessionTimeline deviceId={deviceId} dateRange={dateRange} />
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    color,
}: {
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    color: 'blue' | 'purple' | 'green' | 'orange';
}) {
    const colorClasses = {
        blue: 'from-blue-500/20 to-blue-500/5 text-blue-500',
        purple: 'from-purple-500/20 to-purple-500/5 text-purple-500',
        green: 'from-green-500/20 to-green-500/5 text-green-500',
        orange: 'from-orange-500/20 to-orange-500/5 text-orange-500',
    };

    return (
        <div className="card p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-xl font-bold text-foreground mt-1">{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}
