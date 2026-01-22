import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/index.js';
import * as deviceService from '../services/deviceService.js';
import { validateBody } from '../middlewares/validate.js';

// Validation schemas
const createDeviceSchema = z.object({
    factory_id: z.string(),
    device_id: z.string().min(1),
    name: z.string().min(1),
    metadata: z.record(z.unknown()).optional(),
});

const updateDeviceSchema = z.object({
    name: z.string().min(1).optional(),
    firmware_version: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
});

const createFactorySchema = z.object({
    name: z.string().min(1),
    location: z.string().min(1),
});

export const createDeviceValidation = validateBody(createDeviceSchema);
export const updateDeviceValidation = validateBody(updateDeviceSchema);
export const createFactoryValidation = validateBody(createFactorySchema);

// GET /api/v1/devices
export async function listDevices(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    const { page = '1', limit = '50', factory_id } = req.query;

    const result = await deviceService.getDevicesByTenant(
        req.user.tenantId.toString(),
        parseInt(page as string, 10),
        parseInt(limit as string, 10),
        factory_id as string | undefined
    );

    res.json({
        success: true,
        data: result.devices.map((d) => ({
            id: d._id.toString(),
            device_id: d.device_id,
            name: d.name,
            factory_id: d.factory_id.toString(),
            firmware_version: d.firmware_version,
            registered_at: d.registered_at,
            is_active: d.is_active,
        })),
        pagination: {
            page: parseInt(page as string, 10),
            limit: parseInt(limit as string, 10),
            total: result.total,
            totalPages: Math.ceil(result.total / parseInt(limit as string, 10)),
        },
    });
}

// GET /api/v1/devices/:deviceId
export async function getDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    const { deviceId } = req.params;

    const device = await deviceService.getDeviceById(
        req.user.tenantId.toString(),
        deviceId as string
    );

    if (!device) {
        res.status(404).json({ success: false, error: 'Device not found' });
        return;
    }

    res.json({
        success: true,
        data: {
            id: device._id.toString(),
            device_id: device.device_id,
            name: device.name,
            factory_id: device.factory_id.toString(),
            firmware_version: device.firmware_version,
            registered_at: device.registered_at,
            metadata: device.metadata,
            is_active: device.is_active,
        },
    });
}

// POST /api/v1/devices
export async function createDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    try {
        const { factory_id, device_id, name, metadata } = req.body as z.infer<typeof createDeviceSchema>;

        const device = await deviceService.createDevice(
            req.user.tenantId.toString(),
            factory_id,
            device_id,
            name,
            metadata
        );

        res.status(201).json({
            success: true,
            data: {
                id: device._id.toString(),
                device_id: device.device_id,
                name: device.name,
                factory_id: device.factory_id.toString(),
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

// PATCH /api/v1/devices/:deviceId
export async function updateDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    const { deviceId } = req.params;
    const updates = req.body as z.infer<typeof updateDeviceSchema>;

    const device = await deviceService.updateDevice(
        req.user.tenantId.toString(),
        deviceId as string,
        updates
    );

    if (!device) {
        res.status(404).json({ success: false, error: 'Device not found' });
        return;
    }

    res.json({
        success: true,
        data: {
            id: device._id.toString(),
            device_id: device.device_id,
            name: device.name,
        },
    });
}

// DELETE /api/v1/devices/:deviceId
export async function deleteDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    const { deviceId } = req.params;

    const success = await deviceService.deactivateDevice(
        req.user.tenantId.toString(),
        deviceId as string
    );

    if (!success) {
        res.status(404).json({ success: false, error: 'Device not found' });
        return;
    }

    res.json({
        success: true,
        message: 'Device deactivated',
    });
}

// Factory endpoints
// GET /api/v1/factories
export async function listFactories(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    const { page = '1', limit = '50' } = req.query;

    const result = await deviceService.getFactoriesByTenant(
        req.user.tenantId.toString(),
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
    );

    res.json({
        success: true,
        data: result.factories.map((f) => ({
            id: f._id.toString(),
            name: f.name,
            location: f.location,
            created_at: f.created_at,
        })),
        pagination: {
            page: parseInt(page as string, 10),
            limit: parseInt(limit as string, 10),
            total: result.total,
            totalPages: Math.ceil(result.total / parseInt(limit as string, 10)),
        },
    });
}

// POST /api/v1/factories
export async function createFactory(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    const { name, location } = req.body as z.infer<typeof createFactorySchema>;

    const factory = await deviceService.createFactory(
        req.user.tenantId.toString(),
        name,
        location
    );

    res.status(201).json({
        success: true,
        data: {
            id: factory._id.toString(),
            name: factory.name,
            location: factory.location,
        },
    });
}

// GET /api/v1/factories/:factoryId
export async function getFactory(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    const { factoryId } = req.params;

    const factory = await deviceService.getFactoryById(
        req.user.tenantId.toString(),
        factoryId as string
    );

    if (!factory) {
        res.status(404).json({ success: false, error: 'Factory not found' });
        return;
    }

    res.json({
        success: true,
        data: {
            id: factory._id.toString(),
            name: factory.name,
            location: factory.location,
            created_at: factory.created_at,
        },
    });
}
