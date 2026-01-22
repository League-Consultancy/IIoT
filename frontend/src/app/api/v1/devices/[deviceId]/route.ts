import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { Device } from '@/lib/models';
import { Types } from 'mongoose';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET!;

interface JwtPayload {
    userId: string;
    tenantId: string;
    email: string;
    role: string;
}

function getAuthUser(request: NextRequest): JwtPayload | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.substring(7);
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
        return null;
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { deviceId: string } }
) {
    try {
        const user = getAuthUser(request);
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();

        const device = await Device.findOne({
            tenant_id: new Types.ObjectId(user.tenantId),
            device_id: params.deviceId,
            is_active: true,
        }).populate('factory_id', 'name location');

        if (!device) {
            return NextResponse.json(
                { success: false, error: 'Device not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
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
    } catch (error) {
        console.error('Device error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
