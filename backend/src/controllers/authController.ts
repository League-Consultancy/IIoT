import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/index.js';
import * as authService from '../services/authService.js';
import { validateBody } from '../middlewares/validate.js';

// Validation schemas
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    tenant_slug: z.string().optional(),
});

const refreshSchema = z.object({
    refresh_token: z.string(),
});

export const loginValidation = validateBody(loginSchema);
export const refreshValidation = validateBody(refreshSchema);

export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { email, password, tenant_slug } = req.body as z.infer<typeof loginSchema>;

        const result = await authService.login(email, password, tenant_slug);

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        if (error instanceof Error && 'statusCode' in error) {
            const apiError = error as { statusCode: number; message: string };
            res.status(apiError.statusCode).json({
                success: false,
                error: apiError.message,
            });
            return;
        }
        throw error;
    }
}

export async function refresh(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { refresh_token } = req.body as z.infer<typeof refreshSchema>;

        const tokens = await authService.refreshAccessToken(refresh_token);

        res.json({
            success: true,
            data: tokens,
        });
    } catch (error) {
        if (error instanceof Error && 'statusCode' in error) {
            const apiError = error as { statusCode: number; message: string };
            res.status(apiError.statusCode).json({
                success: false,
                error: apiError.message,
            });
            return;
        }
        throw error;
    }
}

export async function me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    const user = await authService.getUserById(
        req.user.userId.toString(),
        req.user.tenantId.toString()
    );

    if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
    }

    res.json({
        success: true,
        data: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            tenant_id: user.tenant_id.toString(),
        },
    });
}

export async function logout(_req: AuthenticatedRequest, res: Response): Promise<void> {
    // For stateless JWT, logout is handled client-side
    // In a production system, you might want to blacklist the token
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
}
