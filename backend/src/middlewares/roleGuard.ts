import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types/index.js';

// Role hierarchy: admin > programmer > user
const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    programmer: 2,
    admin: 3,
};

export function requireRole(...allowedRoles: UserRole[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        const userRole = req.user.role;

        // Check if user's role is in allowed roles
        if (allowedRoles.includes(userRole)) {
            next();
            return;
        }

        res.status(403).json({
            success: false,
            error: 'Insufficient permissions',
        });
    };
}

// Minimum role requirement (uses hierarchy)
export function requireMinRole(minRole: UserRole) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        const userRoleLevel = roleHierarchy[req.user.role];
        const minRoleLevel = roleHierarchy[minRole];

        if (userRoleLevel >= minRoleLevel) {
            next();
            return;
        }

        res.status(403).json({
            success: false,
            error: 'Insufficient permissions',
        });
    };
}

// Admin only shortcut
export const adminOnly = requireRole('admin');

// Programmer or admin
export const programmerOrAdmin = requireMinRole('programmer');
