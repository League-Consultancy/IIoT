'use client';

import { format, subDays, subMonths, subWeeks, startOfDay, endOfDay } from 'date-fns';
import { Calendar, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface PeriodSelectorProps {
    dateRange: { from: Date; to: Date };
    onDateRangeChange: (range: { from: Date; to: Date }) => void;
    period: 'day' | 'week' | 'month';
    onPeriodChange: (period: 'day' | 'week' | 'month') => void;
}

const presets = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 3 months', value: '3m' },
    { label: 'Last 6 months', value: '6m' },
    { label: 'Last year', value: '1y' },
];

export function PeriodSelector({
    dateRange,
    onDateRangeChange,
    period,
    onPeriodChange,
}: PeriodSelectorProps) {
    const [presetOpen, setPresetOpen] = useState(false);

    function applyPreset(preset: string) {
        const now = new Date();
        let from: Date;

        switch (preset) {
            case '7d':
                from = subDays(now, 7);
                break;
            case '30d':
                from = subDays(now, 30);
                break;
            case '3m':
                from = subMonths(now, 3);
                break;
            case '6m':
                from = subMonths(now, 6);
                break;
            case '1y':
                from = subMonths(now, 12);
                break;
            default:
                from = subDays(now, 30);
        }

        onDateRangeChange({ from: startOfDay(from), to: endOfDay(now) });
        setPresetOpen(false);
    }

    return (
        <div className="card p-4">
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Date Range Presets */}
                <div className="relative">
                    <button
                        onClick={() => setPresetOpen(!presetOpen)}
                        className="btn-secondary w-full sm:w-auto flex items-center justify-between gap-2"
                    >
                        <Calendar className="w-4 h-4" />
                        <span>
                            {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
                        </span>
                        <ChevronDown className="w-4 h-4" />
                    </button>

                    {presetOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setPresetOpen(false)}
                            />
                            <div className="absolute top-full left-0 mt-2 w-48 py-2 bg-card border rounded-lg shadow-lg z-20">
                                {presets.map((preset) => (
                                    <button
                                        key={preset.value}
                                        onClick={() => applyPreset(preset.value)}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Custom Date Inputs */}
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={format(dateRange.from, 'yyyy-MM-dd')}
                        onChange={(e) =>
                            onDateRangeChange({
                                ...dateRange,
                                from: new Date(e.target.value),
                            })
                        }
                        className="input text-sm"
                    />
                    <span className="text-muted-foreground">to</span>
                    <input
                        type="date"
                        value={format(dateRange.to, 'yyyy-MM-dd')}
                        onChange={(e) =>
                            onDateRangeChange({
                                ...dateRange,
                                to: new Date(e.target.value),
                            })
                        }
                        className="input text-sm"
                    />
                </div>

                {/* Period Toggle */}
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    {(['day', 'week', 'month'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => onPeriodChange(p)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${period === p
                                    ? 'bg-primary-500 text-white'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
