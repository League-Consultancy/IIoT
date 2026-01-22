'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ExportButtonProps {
    deviceId: string;
    dateRange: { from: Date; to: Date };
}

export function ExportButton({ deviceId, dateRange }: ExportButtonProps) {
    const [open, setOpen] = useState(false);
    const [showNotice, setShowNotice] = useState(false);

    const formats = [
        { value: 'csv' as const, label: 'CSV', icon: FileText },
        { value: 'xlsx' as const, label: 'Excel', icon: FileSpreadsheet },
        { value: 'json' as const, label: 'JSON', icon: FileJson },
    ];

    function handleExport(format: string) {
        // Show notice that exports are not available in serverless mode
        setOpen(false);
        setShowNotice(true);
        setTimeout(() => setShowNotice(false), 5000);
    }

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="btn-primary flex items-center gap-2"
            >
                <Download className="w-4 h-4" />
                Export
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpen(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-48 py-2 bg-card border rounded-lg shadow-lg z-20">
                        <div className="px-3 py-2 border-b">
                            <p className="text-xs text-muted-foreground">
                                Export {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                            </p>
                        </div>
                        {formats.map((fmt) => (
                            <button
                                key={fmt.value}
                                onClick={() => handleExport(fmt.value)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                            >
                                <fmt.icon className="w-4 h-4 text-muted-foreground" />
                                {fmt.label}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {showNotice && (
                <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-card border rounded-lg shadow-lg z-20">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-foreground">Export Unavailable</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                File exports are not available in serverless deployment. View data in the UI instead.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
