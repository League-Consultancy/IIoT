import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export function errorHandler(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal server error';

    // Log error for debugging
    if (statusCode >= 500) {
        console.error('Server Error:', err);
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack }),
    });
}

export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`,
    });
}

// Custom error class
export class ApiError extends Error implements AppError {
    constructor(
        public statusCode: number,
        message: string,
        public isOperational = true
    ) {
        super(message);
        this.name = 'ApiError';
        Error.captureStackTrace(this, this.constructor);
    }
}
