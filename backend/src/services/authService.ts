import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { User, Tenant } from '../models/index.js';
import { generateTokens, verifyRefreshToken } from '../middlewares/auth.js';
import { ApiError } from '../middlewares/errorHandler.js';
import { IUser } from '../types/index.js';

const SALT_ROUNDS = 12;

export interface LoginResult {
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
        tenantId: string;
    };
    accessToken: string;
    refreshToken: string;
}

export async function login(
    email: string,
    password: string,
    tenantSlug?: string
): Promise<LoginResult> {
    // Find tenant if slug provided
    let tenantId: Types.ObjectId | undefined;

    if (tenantSlug) {
        const tenant = await Tenant.findOne({ slug: tenantSlug, is_active: true });
        if (!tenant) {
            throw new ApiError(404, 'Tenant not found');
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
        throw new ApiError(401, 'Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
        throw new ApiError(401, 'Invalid credentials');
    }

    // Update last login
    await User.updateOne(
        { _id: user._id },
        { $set: { last_login: new Date() } }
    );

    // Generate tokens
    const tokens = generateTokens({
        userId: user._id.toString(),
        tenantId: user.tenant_id.toString(),
        email: user.email,
        role: user.role,
    });

    return {
        user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenant_id.toString(),
        },
        ...tokens,
    };
}

export async function refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
}> {
    try {
        const decoded = verifyRefreshToken(refreshToken);

        if (decoded.type !== 'refresh') {
            throw new ApiError(401, 'Invalid refresh token');
        }

        // Verify user still exists and is active
        const user = await User.findOne({
            _id: decoded.userId,
            is_active: true,
        });

        if (!user) {
            throw new ApiError(401, 'User not found or inactive');
        }

        // Generate new tokens
        return generateTokens({
            userId: user._id.toString(),
            tenantId: user.tenant_id.toString(),
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(401, 'Invalid refresh token');
    }
}

export async function createUser(
    tenantId: string,
    email: string,
    password: string,
    name: string,
    role: IUser['role'] = 'user',
    devicePermissions: string[] = []
): Promise<IUser> {
    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
        tenant_id: new Types.ObjectId(tenantId),
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name,
        role,
        device_permissions: devicePermissions.map((id) => new Types.ObjectId(id)),
        is_active: true,
    });

    return user;
}

export async function getUserById(userId: string, tenantId: string): Promise<IUser | null> {
    return User.findOne({
        _id: new Types.ObjectId(userId),
        tenant_id: new Types.ObjectId(tenantId),
    });
}

export async function getUsersByTenant(
    tenantId: string,
    page = 1,
    limit = 20
): Promise<{ users: IUser[]; total: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        User.find({ tenant_id: new Types.ObjectId(tenantId), is_active: true })
            .skip(skip)
            .limit(limit)
            .sort({ created_at: -1 }),
        User.countDocuments({ tenant_id: new Types.ObjectId(tenantId), is_active: true }),
    ]);

    return { users, total };
}
