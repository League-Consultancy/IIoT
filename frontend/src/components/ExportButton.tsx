'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import ExcelJS from 'exceljs';

interface ExportButtonProps {
    deviceId: string;
    dateRange: { from: Date; to: Date };
}

export function ExportButton({ deviceId, dateRange }: ExportButtonProps) {
    const [open, setOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const formats = [
        { value: 'csv' as const, label: 'CSV', icon: FileText },
        { value: 'xlsx' as const, label: 'Excel', icon: FileSpreadsheet },
        { value: 'json' as const, label: 'JSON', icon: FileJson },
    ];

    async function fetchData() {
        // Fetch all sessions for determination
        // In a real app with millions of row, we might need chunking, but for this demo/analytics:
        const response = await api.getDeviceSessions(
            deviceId,
            dateRange.from.toISOString(),
            dateRange.to.toISOString(),
            1,
            10000 // Limit to 10k for client-side safety
        );
        return response.data || [];
    }

    const downloadFile = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    async function handleExport(formatType: string) {
        try {
            setIsExporting(true);
            setOpen(false);

            const data = await fetchData();
            const filename = `export_${deviceId}_${format(new Date(), 'yyyyMMdd_HHmmss')}`;

            if (formatType === 'json') {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                downloadFile(blob, `${filename}.json`);
            }
            else if (formatType === 'csv') {
                // Simple CSV generation
                const headers = ['Session ID', 'Start Time', 'Stop Time', 'Duration (ms)', 'Ingested At'];
                const rows = data.map((row: any) => [
                    row._id,
                    row.start_time,
                    row.stop_time,
                    row.duration_ms,
                    row.ingested_at
                ]);

                const csvContent = [
                    headers.join(','),
                    ...rows.map((r: any[]) => r.map(c => `"${c}"`).join(','))
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                downloadFile(blob, `${filename}.csv`);
            }
            else if (formatType === 'xlsx') {
                const workbook = new ExcelJS.Workbook();
                const sheet = workbook.addWorksheet('Sessions');

                sheet.columns = [
                    { header: 'Session ID', key: '_id', width: 30 },
                    { header: 'Start Time', key: 'start_time', width: 25 },
                    { header: 'Stop Time', key: 'stop_time', width: 25 },
                    { header: 'Duration (ms)', key: 'duration_ms', width: 15 },
                    { header: 'Ingested At', key: 'ingested_at', width: 25 }
                ];

                sheet.addRows(data);

                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                downloadFile(blob, `${filename}.xlsx`);
            }

        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => !isExporting && setOpen(!open)}
                disabled={isExporting}
                className="btn-primary flex items-center gap-2"
            >
                {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Download className="w-4 h-4" />
                )}
                {isExporting ? 'Exporting...' : 'Export'}
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
        </div>
    );
}
