import { Request } from 'express';
import { Types } from 'mongoose';
import { UserRole } from './models.js';

// JWT Payload
export interface JwtPayload {
    userId: string;
    tenantId: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}

// Authenticated Request
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: Types.ObjectId;
        tenantId: Types.ObjectId;
        email: string;
        role: UserRole;
    };
}

// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Session Ingestion Payload
export interface SessionIngestionPayload {
    device_id: string;
    start_time: string; // ISO-8601
    stop_time: string;  // ISO-8601
    duration: number;   // milliseconds (will be recomputed by server)
}

// Analytics Query Parameters
export interface AnalyticsQueryParams {
    date_from?: string;
    date_to?: string;
    period?: 'day' | 'week' | 'month';
}

// Analytics Response Types
export interface DurationMetric {
    period: string;
    start_date: Date;
    end_date: Date;
    total_duration_ms: number;
    session_count: number;
    avg_session_duration_ms: number;
}

export interface DeviceAnalyticsSummary {
    device_id: string;
    device_name: string;
    factory_name: string;
    period: {
        from: Date;
        to: Date;
    };
    metrics: {
        total_duration_ms: number;
        session_count: number;
        avg_session_duration_ms: number;
        min_session_duration_ms: number;
        max_session_duration_ms: number;
    };
}

// Export Request
export interface ExportRequest {
    format: 'csv' | 'xlsx' | 'json';
    date_from: string;
    date_to: string;
}
