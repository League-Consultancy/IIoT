import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/index.js';
import * as sessionService from '../services/sessionService.js';
import { validateBody } from '../middlewares/validate.js';

// Validation schema matching the device payload contract
const sessionIngestionSchema = z.object({
    device_id: z.string().min(1),
    start_time: z.string().datetime(),
    stop_time: z.string().datetime(),
    duration: z.number().positive(),
});

export const sessionIngestionValidation = validateBody(sessionIngestionSchema);

// POST /api/v1/device/session - Primary ingestion endpoint
export async function ingestSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    try {
        const payload = req.body as z.infer<typeof sessionIngestionSchema>;

        const result = await sessionService.ingestSession(
            req.user.tenantId.toString(),
            payload,
            req.ip || req.socket.remoteAddress
        );

        // Return 200 for both new and duplicate (idempotency)
        res.status(200).json({
            success: true,
            data: {
                session_id: result.session_id,
                is_duplicate: result.is_duplicate,
                computed_duration_ms: result.computed_duration_ms,
            },
            message: result.is_duplicate
                ? 'Session already exists (idempotent)'
                : 'Session ingested successfully',
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

// GET /api/v1/devices/:deviceId/sessions - Get sessions for a device
export async function getDeviceSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    const { deviceId } = req.params;
    const { date_from, date_to, page = '1', limit = '100' } = req.query;

    const dateFrom = date_from ? new Date(date_from as string) : undefined;
    const dateTo = date_to ? new Date(date_to as string) : undefined;

    const result = await sessionService.getSessionsByDevice(
        req.user.tenantId.toString(),
        deviceId as string,
        dateFrom,
        dateTo,
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
    );

    res.json({
        success: true,
        data: result.sessions,
        pagination: {
            page: parseInt(page as string, 10),
            limit: parseInt(limit as string, 10),
            total: result.total,
            totalPages: Math.ceil(result.total / parseInt(limit as string, 10)),
        },
    });
}
