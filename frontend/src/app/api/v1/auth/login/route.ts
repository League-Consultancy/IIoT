import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { User, Tenant } from '@/lib/models';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { email, password, tenant_slug } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password required' },
                { status: 400 }
            );
        }

        // Find tenant if slug provided
        let tenantId;
        if (tenant_slug) {
            const tenant = await Tenant.findOne({ slug: tenant_slug, is_active: true });
            if (!tenant) {
                return NextResponse.json(
                    { success: false, error: 'Tenant not found' },
                    { status: 404 }
                );
            }
            tenantId = tenant._id;
        }

        // Build query
        const query: Record<string, unknown> = {
            email: email.toLowerCase(),
            is_active: true
        };
        if (tenantId) {
            query['tenant_id'] = tenantId;
        }

        // Find user with password
        const user = await User.findOne(query).select('+password_hash');

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Update last login
        await User.updateOne(
            { _id: user._id },
            { $set: { last_login: new Date() } }
        );

        // Generate token
        const accessToken = jwt.sign(
            {
                userId: user._id.toString(),
                tenantId: user.tenant_id.toString(),
                email: user.email,
                role: user.role,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const refreshToken = jwt.sign(
            {
                userId: user._id.toString(),
                tenantId: user.tenant_id.toString(),
                email: user.email,
                role: user.role,
                type: 'refresh',
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    tenantId: user.tenant_id.toString(),
                },
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
