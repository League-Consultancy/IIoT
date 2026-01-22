'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { Clock, Play, Square } from 'lucide-react';

interface SessionTimelineProps {
    deviceId: string;
    dateRange: { from: Date; to: Date };
}

export function SessionTimeline({ deviceId, dateRange }: SessionTimelineProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['sessions', deviceId, dateRange],
        queryFn: () =>
            api.getDeviceSessions(
                deviceId,
                dateRange.from.toISOString(),
                dateRange.to.toISOString(),
                1,
                50
            ),
        enabled: !!deviceId,
    });

    const sessions = data?.data || [];

    function formatDuration(ms: number): string {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);

        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        }
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    }

    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Session Timeline</h2>
                    <p className="text-sm text-muted-foreground">Recent work sessions</p>
                </div>
                {data?.pagination && (
                    <span className="text-sm text-muted-foreground">
                        Showing {sessions.length} of {data.pagination.total} sessions
                    </span>
                )}
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                    ))}
                </div>
            ) : sessions.length === 0 ? (
                <div className="text-center py-12">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-foreground">No sessions found</h3>
                    <p className="text-muted-foreground">
                        No work sessions recorded for this period
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sessions.map((session: {
                        _id: string;
                        start_time: string;
                        stop_time: string;
                        duration_ms: number;
                        ingested_at: string;
                    }) => (
                        <div
                            key={session._id}
                            className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                            {/* Timeline indicator */}
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-500/20" />
                                <div className="w-0.5 h-8 bg-border" />
                                <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/20" />
                            </div>

                            {/* Session details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <Play className="w-4 h-4 text-green-500" />
                                    <span className="text-sm font-medium text-foreground">
                                        {format(new Date(session.start_time), 'MMM d, yyyy HH:mm:ss')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Square className="w-4 h-4 text-red-500" />
                                    <span className="text-sm font-medium text-foreground">
                                        {format(new Date(session.stop_time), 'MMM d, yyyy HH:mm:ss')}
                                    </span>
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="text-right">
                                <div className="flex items-center gap-2 justify-end">
                                    <Clock className="w-4 h-4 text-primary-500" />
                                    <span className="text-lg font-bold text-primary-500">
                                        {formatDuration(session.duration_ms)}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Ingested: {format(new Date(session.ingested_at), 'MMM d, HH:mm')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
