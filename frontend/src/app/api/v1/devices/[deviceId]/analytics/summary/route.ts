import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { DeviceSession, Device, Factory } from '@/lib/models';
import { Types } from 'mongoose';

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

        const now = new Date();
        const defaultFrom = new Date(now);
        defaultFrom.setMonth(defaultFrom.getMonth() - 1);

        const from = dateFrom ? new Date(dateFrom) : defaultFrom;
        const to = dateTo ? new Date(dateTo) : now;

        // Get device info
        const device = await Device.findOne({
            tenant_id: new Types.ObjectId(user.tenantId),
            device_id: params.deviceId,
        });

        if (!device) {
            return NextResponse.json(
                { success: false, error: 'Device not found' },
                { status: 404 }
            );
        }

        // Get factory info
        const factory = await Factory.findById(device.factory_id);

        // Aggregate metrics
        const pipeline = [
            {
                $match: {
                    tenant_id: new Types.ObjectId(user.tenantId),
                    device_id: params.deviceId,
                    start_time: { $gte: from, $lte: to },
                },
            },
            {
                $group: {
                    _id: null,
                    total_duration_ms: { $sum: '$duration_ms' },
                    session_count: { $sum: 1 },
                    avg_session_duration_ms: { $avg: '$duration_ms' },
                    min_session_duration_ms: { $min: '$duration_ms' },
                    max_session_duration_ms: { $max: '$duration_ms' },
                },
            },
        ];

        const [result] = await DeviceSession.aggregate(pipeline);

        return NextResponse.json({
            success: true,
            data: {
                device_id: params.deviceId,
                device_name: device.name,
                factory_name: factory?.name || 'Unknown',
                period: {
                    from,
                    to,
                },
                metrics: result
                    ? {
                        total_duration_ms: result.total_duration_ms,
                        session_count: result.session_count,
                        avg_session_duration_ms: Math.round(result.avg_session_duration_ms),
                        min_session_duration_ms: result.min_session_duration_ms,
                        max_session_duration_ms: result.max_session_duration_ms,
                    }
                    : {
                        total_duration_ms: 0,
                        session_count: 0,
                        avg_session_duration_ms: 0,
                        min_session_duration_ms: 0,
                        max_session_duration_ms: 0,
                    },
            },
        });
    } catch (error) {
        console.error('Analytics summary error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
