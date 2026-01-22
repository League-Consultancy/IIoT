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

export async function GET(request: NextRequest) {
    try {
        const user = getAuthUser(request);
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const factoryId = searchParams.get('factory_id');

        const query: Record<string, unknown> = {
            tenant_id: new Types.ObjectId(user.tenantId),
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

        return NextResponse.json({
            success: true,
            data: devices.map((d) => ({
                id: d._id.toString(),
                device_id: d.device_id,
                name: d.name,
                factory_id: d.factory_id.toString(),
                firmware_version: d.firmware_version,
                registered_at: d.registered_at,
                is_active: d.is_active,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Devices error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
