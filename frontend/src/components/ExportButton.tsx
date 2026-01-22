'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Download, FileSpreadsheet, FileJson, FileText, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ExportButtonProps {
    deviceId: string;
    dateRange: { from: Date; to: Date };
}

export function ExportButton({ deviceId, dateRange }: ExportButtonProps) {
    const [open, setOpen] = useState(false);
    const [exportId, setExportId] = useState<string | null>(null);

    const createExportMutation = useMutation({
        mutationFn: (format: 'csv' | 'xlsx' | 'json') =>
            api.createExport(
                deviceId,
                format,
                dateRange.from.toISOString(),
                dateRange.to.toISOString()
            ),
        onSuccess: (data) => {
            if (data.success) {
                setExportId(data.data.export_id);
                // Poll for completion
                pollExportStatus(data.data.export_id);
            }
        },
    });

    async function pollExportStatus(id: string) {
        const checkStatus = async () => {
            try {
                const response = await api.getExportStatus(id);
                if (response.data.status === 'completed') {
                    // Trigger download
                    window.open(api.getExportDownloadUrl(id), '_blank');
                    setExportId(null);
                    setOpen(false);
                } else if (response.data.status === 'failed') {
                    alert('Export failed: ' + response.data.error_message);
                    setExportId(null);
                } else {
                    // Still processing, check again
                    setTimeout(checkStatus, 1000);
                }
            } catch (error) {
                console.error('Failed to check export status:', error);
                setExportId(null);
            }
        };

        checkStatus();
    }

    const formats = [
        { value: 'csv' as const, label: 'CSV', icon: FileText },
        { value: 'xlsx' as const, label: 'Excel', icon: FileSpreadsheet },
        { value: 'json' as const, label: 'JSON', icon: FileJson },
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="btn-primary flex items-center gap-2"
                disabled={createExportMutation.isPending || !!exportId}
            >
                {createExportMutation.isPending || exportId ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Exporting...
                    </>
                ) : (
                    <>
                        <Download className="w-4 h-4" />
                        Export
                    </>
                )}
            </button>

            {open && !createExportMutation.isPending && !exportId && (
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
                                onClick={() => {
                                    createExportMutation.mutate(fmt.value);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                            >
                                <fmt.icon className="w-4 h-4 text-muted-foreground" />
                                {fmt.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
