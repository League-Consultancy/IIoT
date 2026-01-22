'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps,
} from 'recharts';
import { Clock } from 'lucide-react';

interface DurationMetricsProps {
    deviceId: string;
    dateRange: { from: Date; to: Date };
    period: 'day' | 'week' | 'month';
}

export function DurationMetrics({ deviceId, dateRange, period }: DurationMetricsProps) {
    const queryFn = {
        day: () => api.getDailyAnalytics(deviceId, dateRange.from.toISOString(), dateRange.to.toISOString()),
        week: () => api.getWeeklyAnalytics(deviceId, dateRange.from.toISOString(), dateRange.to.toISOString()),
        month: () => api.getMonthlyAnalytics(deviceId, dateRange.from.toISOString(), dateRange.to.toISOString()),
    };

    const { data, isLoading } = useQuery({
        queryKey: ['analytics', period, deviceId, dateRange],
        queryFn: queryFn[period],
        enabled: !!deviceId,
    });

    const metrics = data?.data?.metrics || [];

    // Transform data for chart
    const chartData = metrics.map((m: { period: string; total_duration_ms: number; session_count: number }) => ({
        period: m.period,
        hours: Math.round((m.total_duration_ms / 3600000) * 100) / 100,
        sessions: m.session_count,
    }));

    function formatDuration(ms: number): string {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length) {
            const hours = payload[0]?.value as number;
            const sessions = payload[1]?.value as number;
            return (
                <div className="bg-card border rounded-lg shadow-lg p-3">
                    <p className="font-medium text-foreground mb-1">{label}</p>
                    <p className="text-sm text-primary-500">
                        Duration: {hours.toFixed(2)} hours
                    </p>
                    <p className="text-sm text-green-500">
                        Sessions: {sessions}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Duration Metrics</h2>
                    <p className="text-sm text-muted-foreground">
                        Working duration by {period}
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="h-80 bg-muted animate-pulse rounded-lg" />
            ) : chartData.length === 0 ? (
                <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                        <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">No data for this period</p>
                    </div>
                </div>
            ) : (
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis
                                dataKey="period"
                                tick={{ fill: 'currentColor', fontSize: 12 }}
                                className="text-muted-foreground"
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis
                                tick={{ fill: 'currentColor', fontSize: 12 }}
                                className="text-muted-foreground"
                                label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: 'currentColor' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                                dataKey="hours"
                                fill="hsl(217.2 91.2% 59.8%)"
                                radius={[4, 4, 0, 0]}
                                name="Duration (hours)"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Summary stats */}
            {chartData.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-foreground">
                            {chartData.reduce((sum: number, d: { hours: number }) => sum + d.hours, 0).toFixed(1)}h
                        </p>
                        <p className="text-sm text-muted-foreground">Total Hours</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-foreground">
                            {chartData.reduce((sum: number, d: { sessions: number }) => sum + d.sessions, 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Sessions</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-foreground">
                            {(chartData.reduce((sum: number, d: { hours: number }) => sum + d.hours, 0) / chartData.length).toFixed(1)}h
                        </p>
                        <p className="text-sm text-muted-foreground">Avg per {period}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
