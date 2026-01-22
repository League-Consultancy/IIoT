import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { env } from '../config/env.js';
import { AuthenticatedRequest, JwtPayload, UserRole } from '../types/index.js';

export function authenticate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'No token provided',
            });
            return;
        }

        const token = authHeader.substring(7);

        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

        req.user = {
            userId: new Types.ObjectId(decoded.userId),
            tenantId: new Types.ObjectId(decoded.tenantId),
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: 'Token expired',
            });
            return;
        }

        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: 'Invalid token',
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: 'Authentication error',
        });
    }
}

// Generate JWT tokens
export function generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): {
    accessToken: string;
    refreshToken: string;
} {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(
        { ...payload, type: 'refresh' },
        env.JWT_SECRET,
        { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
}

// Verify refresh token
export function verifyRefreshToken(token: string): JwtPayload & { type: string } {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload & { type: string };
}
