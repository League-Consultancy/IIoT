import { Response, NextFunction } from 'express';
import { AuditLog } from '../models/index.js';
import { AuthenticatedRequest } from '../types/index.js';

interface AuditOptions {
    action: string;
    resourceType: string;
    getResourceId?: (req: AuthenticatedRequest) => string;
    getDetails?: (req: AuthenticatedRequest, res: Response) => Record<string, unknown>;
}

export function audit(options: AuditOptions) {
    return async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json to capture response and log after successful response
        res.json = function (body: unknown) {
            // Log audit after response is sent
            setImmediate(async () => {
                try {
                    if (req.user && res.statusCode < 400) {
                        await AuditLog.create({
                            tenant_id: req.user.tenantId,
                            actor_id: req.user.userId,
                            actor_type: 'user',
                            action: options.action,
                            resource_type: options.resourceType,
                            resource_id: options.getResourceId?.(req) || req.params['id'] || 'unknown',
                            details: options.getDetails?.(req, res),
                            ip_address: req.ip || req.socket.remoteAddress,
                            user_agent: req.get('User-Agent'),
                            timestamp: new Date(),
                        });
                    }
                } catch (error) {
                    console.error('Failed to create audit log:', error);
                }
            });

            return originalJson(body);
        };

        next();
    };
}

// Helper to create audit log directly
export async function createAuditLog(
    tenantId: string,
    actorId: string,
    actorType: 'user' | 'device' | 'system',
    action: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
): Promise<void> {
    try {
        await AuditLog.create({
            tenant_id: tenantId,
            actor_id: actorId,
            actor_type: actorType,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            details,
            ip_address: ipAddress,
            user_agent: userAgent,
            timestamp: new Date(),
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
}
