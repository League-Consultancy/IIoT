import { Response } from 'express';
import { z } from 'zod';
import path from 'path';
import { AuthenticatedRequest } from '../types/index.js';
import * as exportService from '../services/exportService.js';
import { validateBody } from '../middlewares/validate.js';

// Validation schema
const createExportSchema = z.object({
    format: z.enum(['csv', 'xlsx', 'json']),
    date_from: z.string().datetime(),
    date_to: z.string().datetime(),
});

export const createExportValidation = validateBody(createExportSchema);

// POST /api/v1/devices/:deviceId/sessions/export
export async function createExport(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    try {
        const { deviceId } = req.params;
        const { format, date_from, date_to } = req.body as z.infer<typeof createExportSchema>;

        const job = await exportService.createExportJob({
            tenantId: req.user.tenantId.toString(),
            userId: req.user.userId.toString(),
            deviceId: deviceId as string,
            format,
            dateFrom: new Date(date_from),
            dateTo: new Date(date_to),
        });

        res.status(202).json({
            success: true,
            data: {
                export_id: job._id.toString(),
                status: job.status,
                message: 'Export job created. Check status for download link.',
            },
        });
    } catch (error) {
        if (error instanceof Error && 'statusCode' in error) {
            const apiError = error as { statusCode: number; message: string };
            res.status(apiError.statusCode).json({
                success: false,
                error: apiError.message,
            });
            return;
        }
        throw error;
    }
}

// GET /api/v1/exports/:exportId
export async function getExportStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    const { exportId } = req.params;

    const job = await exportService.getExportJob(
        req.user.tenantId.toString(),
        exportId as string
    );

    if (!job) {
        res.status(404).json({ success: false, error: 'Export job not found' });
        return;
    }

    res.json({
        success: true,
        data: {
            export_id: job._id.toString(),
            device_id: job.device_id,
            format: job.format,
            status: job.status,
            record_count: job.record_count,
            file_size: job.file_size,
            created_at: job.created_at,
            completed_at: job.completed_at,
            expires_at: job.expires_at,
            error_message: job.error_message,
            download_url: job.status === 'completed' ? `/api/v1/exports/${job._id}/download` : null,
        },
    });
}

// GET /api/v1/exports/:exportId/download
export async function downloadExport(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    const { exportId } = req.params;

    const filePath = await exportService.getExportDownloadPath(
        req.user.tenantId.toString(),
        exportId as string
    );

    if (!filePath) {
        res.status(404).json({ success: false, error: 'Export file not found or expired' });
        return;
    }

    const filename = path.basename(filePath);

    // Set content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
        '.csv': 'text/csv',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.json': 'application/json',
    };

    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.sendFile(filePath);
}

// GET /api/v1/exports - List user's export jobs
export async function listExports(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    const { page = '1', limit = '20' } = req.query;

    const result = await exportService.getUserExportJobs(
        req.user.tenantId.toString(),
        req.user.userId.toString(),
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
    );

    res.json({
        success: true,
        data: result.jobs.map((job) => ({
            export_id: job._id.toString(),
            device_id: job.device_id,
            format: job.format,
            status: job.status,
            record_count: job.record_count,
            created_at: job.created_at,
            completed_at: job.completed_at,
        })),
        pagination: {
            page: parseInt(page as string, 10),
            limit: parseInt(limit as string, 10),
            total: result.total,
            totalPages: Math.ceil(result.total / parseInt(limit as string, 10)),
        },
    });
}
