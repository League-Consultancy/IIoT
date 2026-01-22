import { Types } from 'mongoose';
import { DeviceSession, Device } from '../models/index.js';
import { createAuditLog } from '../middlewares/audit.js';
import { ApiError } from '../middlewares/errorHandler.js';
import { SessionIngestionPayload, IDeviceSession } from '../types/index.js';

interface IngestionResult {
    success: boolean;
    session_id: string;
    is_duplicate: boolean;
    computed_duration_ms: number;
}

export async function ingestSession(
    tenantId: string,
    payload: SessionIngestionPayload,
    ipAddress?: string
): Promise<IngestionResult> {
    // Parse timestamps
    const startTime = new Date(payload.start_time);
    const stopTime = new Date(payload.stop_time);

    // Validate timestamps
    if (isNaN(startTime.getTime()) || isNaN(stopTime.getTime())) {
        throw new ApiError(400, 'Invalid timestamp format. Use ISO-8601.');
    }

    if (startTime >= stopTime) {
        throw new ApiError(400, 'start_time must be before stop_time');
    }

    // Compute duration server-side (source of truth)
    const computedDurationMs = stopTime.getTime() - startTime.getTime();

    // Validate duration matches (with 1 second tolerance for rounding)
    const durationDiff = Math.abs(computedDurationMs - payload.duration);
    if (durationDiff > 1000) {
        console.warn(
            `Duration mismatch for device ${payload.device_id}: ` +
            `client=${payload.duration}ms, server=${computedDurationMs}ms`
        );
    }

    // Verify device exists and belongs to tenant
    const device = await Device.findOne({
        tenant_id: new Types.ObjectId(tenantId),
        device_id: payload.device_id,
        is_active: true,
    });

    if (!device) {
        throw new ApiError(404, `Device ${payload.device_id} not found or inactive`);
    }

    // Attempt to insert (idempotent via unique index)
    try {
        const session = await DeviceSession.create({
            tenant_id: new Types.ObjectId(tenantId),
            factory_id: device.factory_id,
            device_id: payload.device_id,
            start_time: startTime,
            stop_time: stopTime,
            duration_ms: computedDurationMs,
            ingested_at: new Date(),
        });

        // Log successful ingestion
        await createAuditLog(
            tenantId,
            device._id.toString(),
            'device',
            'session.ingest',
            'device_session',
            session._id.toString(),
            {
                device_id: payload.device_id,
                start_time: startTime.toISOString(),
                stop_time: stopTime.toISOString(),
                duration_ms: computedDurationMs,
            },
            ipAddress
        );

        return {
            success: true,
            session_id: session._id.toString(),
            is_duplicate: false,
            computed_duration_ms: computedDurationMs,
        };
    } catch (error: unknown) {
        // Handle duplicate key error (idempotency)
        if (
            error instanceof Error &&
            'code' in error &&
            (error as { code: number }).code === 11000
        ) {
            // Find existing session
            const existingSession = await DeviceSession.findOne({
                device_id: payload.device_id,
                start_time: startTime,
                stop_time: stopTime,
            });

            return {
                success: true,
                session_id: existingSession?._id.toString() || 'unknown',
                is_duplicate: true,
                computed_duration_ms: computedDurationMs,
            };
        }

        throw error;
    }
}

export async function getSessionsByDevice(
    tenantId: string,
    deviceId: string,
    dateFrom?: Date,
    dateTo?: Date,
    page = 1,
    limit = 100
): Promise<{ sessions: IDeviceSession[]; total: number }> {
    const query: Record<string, unknown> = {
        tenant_id: new Types.ObjectId(tenantId),
        device_id: deviceId,
    };

    if (dateFrom || dateTo) {
        query['start_time'] = {};
        if (dateFrom) {
            (query['start_time'] as Record<string, Date>)['$gte'] = dateFrom;
        }
        if (dateTo) {
            (query['start_time'] as Record<string, Date>)['$lte'] = dateTo;
        }
    }

    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
        DeviceSession.find(query)
            .sort({ start_time: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        DeviceSession.countDocuments(query),
    ]);

    return { sessions: sessions as IDeviceSession[], total };
}

export async function getSessionCount(
    tenantId: string,
    deviceId: string,
    dateFrom?: Date,
    dateTo?: Date
): Promise<number> {
    const query: Record<string, unknown> = {
        tenant_id: new Types.ObjectId(tenantId),
        device_id: deviceId,
    };

    if (dateFrom || dateTo) {
        query['start_time'] = {};
        if (dateFrom) {
            (query['start_time'] as Record<string, Date>)['$gte'] = dateFrom;
        }
        if (dateTo) {
            (query['start_time'] as Record<string, Date>)['$lte'] = dateTo;
        }
    }

    return DeviceSession.countDocuments(query);
}
