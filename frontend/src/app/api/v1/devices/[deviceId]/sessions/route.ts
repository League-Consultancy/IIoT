import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { DeviceSession } from '@/lib/models';
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

        const { searchParams } = new URL(request.url);
        const dateFrom = searchParams.get('date_from');
        const dateTo = searchParams.get('date_to');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '100');

        const query: Record<string, unknown> = {
            tenant_id: new Types.ObjectId(user.tenantId),
            device_id: params.deviceId,
        };

        if (dateFrom || dateTo) {
            query['start_time'] = {};
            if (dateFrom) {
                (query['start_time'] as Record<string, Date>)['$gte'] = new Date(dateFrom);
            }
            if (dateTo) {
                (query['start_time'] as Record<string, Date>)['$lte'] = new Date(dateTo);
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

        return NextResponse.json({
            success: true,
            data: sessions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Sessions error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
