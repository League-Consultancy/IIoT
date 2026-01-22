import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { Factory } from '@/lib/models';
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

        const skip = (page - 1) * limit;

        const [factories, total] = await Promise.all([
            Factory.find({ tenant_id: new Types.ObjectId(user.tenantId) })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit),
            Factory.countDocuments({ tenant_id: new Types.ObjectId(user.tenantId) }),
        ]);

        return NextResponse.json({
            success: true,
            data: factories.map((f) => ({
                id: f._id.toString(),
                name: f.name,
                location: f.location,
                created_at: f.created_at,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Factories error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
