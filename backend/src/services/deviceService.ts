import { Types } from 'mongoose';
import { Device, Factory } from '../models/index.js';
import { ApiError } from '../middlewares/errorHandler.js';
import { IDevice, IFactory } from '../types/index.js';

export async function getDevicesByTenant(
    tenantId: string,
    page = 1,
    limit = 50,
    factoryId?: string
): Promise<{ devices: IDevice[]; total: number }> {
    const query: Record<string, unknown> = {
        tenant_id: new Types.ObjectId(tenantId),
        is_active: true,
    };

    if (factoryId) {
        query['factory_id'] = new Types.ObjectId(factoryId);
    }

    const skip = (page - 1) * limit;

    const [devices, total] = await Promise.all([
        Device.find(query)
            .populate('factory_id', 'name location')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit),
        Device.countDocuments(query),
    ]);

    return { devices, total };
}

export async function getDeviceById(
    tenantId: string,
    deviceId: string
): Promise<IDevice | null> {
    return Device.findOne({
        tenant_id: new Types.ObjectId(tenantId),
        device_id: deviceId,
        is_active: true,
    }).populate('factory_id', 'name location');
}

export async function createDevice(
    tenantId: string,
    factoryId: string,
    deviceId: string,
    name: string,
    metadata?: Record<string, unknown>
): Promise<IDevice> {
    // Verify factory belongs to tenant
    const factory = await Factory.findOne({
        _id: new Types.ObjectId(factoryId),
        tenant_id: new Types.ObjectId(tenantId),
    });

    if (!factory) {
        throw new ApiError(404, 'Factory not found');
    }

    // Check if device_id already exists
    const existing = await Device.findOne({
        tenant_id: new Types.ObjectId(tenantId),
        device_id: deviceId,
    });

    if (existing) {
        throw new ApiError(409, `Device ${deviceId} already exists`);
    }

    const device = await Device.create({
        tenant_id: new Types.ObjectId(tenantId),
        factory_id: new Types.ObjectId(factoryId),
        device_id: deviceId,
        name,
        metadata,
        registered_at: new Date(),
        is_active: true,
    });

    return device;
}

export async function updateDevice(
    tenantId: string,
    deviceId: string,
    updates: Partial<Pick<IDevice, 'name' | 'firmware_version' | 'metadata'>>
): Promise<IDevice | null> {
    return Device.findOneAndUpdate(
        {
            tenant_id: new Types.ObjectId(tenantId),
            device_id: deviceId,
        },
        { $set: updates },
        { new: true }
    );
}

export async function deactivateDevice(
    tenantId: string,
    deviceId: string
): Promise<boolean> {
    const result = await Device.updateOne(
        {
            tenant_id: new Types.ObjectId(tenantId),
            device_id: deviceId,
        },
        { $set: { is_active: false } }
    );

    return result.modifiedCount > 0;
}

// Factory operations
export async function getFactoriesByTenant(
    tenantId: string,
    page = 1,
    limit = 50
): Promise<{ factories: IFactory[]; total: number }> {
    const skip = (page - 1) * limit;

    const [factories, total] = await Promise.all([
        Factory.find({ tenant_id: new Types.ObjectId(tenantId) })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit),
        Factory.countDocuments({ tenant_id: new Types.ObjectId(tenantId) }),
    ]);

    return { factories, total };
}

export async function createFactory(
    tenantId: string,
    name: string,
    location: string
): Promise<IFactory> {
    return Factory.create({
        tenant_id: new Types.ObjectId(tenantId),
        name,
        location,
    });
}

export async function getFactoryById(
    tenantId: string,
    factoryId: string
): Promise<IFactory | null> {
    return Factory.findOne({
        _id: new Types.ObjectId(factoryId),
        tenant_id: new Types.ObjectId(tenantId),
    });
}
