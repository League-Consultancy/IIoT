import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { DeviceSession } from '@/lib/models';
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
                    _id: {
                        year: { $year: '$start_time' },
                        month: { $month: '$start_time' },
                        day: { $dayOfMonth: '$start_time' },
                    },
                    total_duration_ms: { $sum: '$duration_ms' },
                    session_count: { $sum: 1 },
                    avg_session_duration_ms: { $avg: '$duration_ms' },
                },
            },
            {
                $sort: { '_id.year': 1 as const, '_id.month': 1 as const, '_id.day': 1 as const },
            },
            {
                $project: {
                    _id: 0,
                    period: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: {
                                $dateFromParts: {
                                    year: '$_id.year',
                                    month: '$_id.month',
                                    day: '$_id.day',
                                },
                            },
                        },
                    },
                    total_duration_ms: 1,
                    session_count: 1,
                    avg_session_duration_ms: { $round: ['$avg_session_duration_ms', 0] },
                },
            },
        ];

        const metrics = await DeviceSession.aggregate(pipeline);

        return NextResponse.json({
            success: true,
            data: {
                device_id: params.deviceId,
                period_type: 'daily',
                date_range: { from, to },
                metrics,
            },
        });
    } catch (error) {
        console.error('Daily analytics error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
