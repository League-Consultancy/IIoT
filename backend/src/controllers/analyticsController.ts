import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import * as analyticsService from '../services/analyticsService.js';
import { ApiError } from '../middlewares/errorHandler.js';

// Helper to parse date query params
function parseDateRange(dateFrom?: string, dateTo?: string): { from: Date; to: Date } {
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setMonth(defaultFrom.getMonth() - 1);

    return {
        from: dateFrom ? new Date(dateFrom) : defaultFrom,
        to: dateTo ? new Date(dateTo) : now,
    };
}

// GET /api/v1/devices/:deviceId/analytics/daily
export async function getDailyAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    const { deviceId } = req.params;
    const { date_from, date_to } = req.query;
    const { from, to } = parseDateRange(date_from as string, date_to as string);

    const metrics = await analyticsService.getDailyDuration(
        req.user.tenantId.toString(),
        deviceId as string,
        from,
        to
    );

    res.json({
        success: true,
        data: {
            device_id: deviceId,
            period_type: 'daily',
            date_range: { from, to },
            metrics,
        },
    });
}

// GET /api/v1/devices/:deviceId/analytics/weekly
export async function getWeeklyAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    const { deviceId } = req.params;
    const { date_from, date_to } = req.query;
    const { from, to } = parseDateRange(date_from as string, date_to as string);

    const metrics = await analyticsService.getWeeklyDuration(
        req.user.tenantId.toString(),
        deviceId as string,
        from,
        to
    );

    res.json({
        success: true,
        data: {
            device_id: deviceId,
            period_type: 'weekly',
            date_range: { from, to },
            metrics,
        },
    });
}

// GET /api/v1/devices/:deviceId/analytics/monthly
export async function getMonthlyAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    const { deviceId } = req.params;
    const { date_from, date_to } = req.query;
    const { from, to } = parseDateRange(date_from as string, date_to as string);

    const metrics = await analyticsService.getMonthlyDuration(
        req.user.tenantId.toString(),
        deviceId as string,
        from,
        to
    );

    res.json({
        success: true,
        data: {
            device_id: deviceId,
            period_type: 'monthly',
            date_range: { from, to },
            metrics,
        },
    });
}

// GET /api/v1/devices/:deviceId/analytics/summary
export async function getAnalyticsSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    const { deviceId } = req.params;
    const { date_from, date_to } = req.query;
    const { from, to } = parseDateRange(date_from as string, date_to as string);

    const summary = await analyticsService.getDeviceSummary(
        req.user.tenantId.toString(),
        deviceId as string,
        from,
        to
    );

    if (!summary) {
        res.status(404).json({ success: false, error: 'Device not found' });
        return;
    }

    res.json({
        success: true,
        data: summary,
    });
}

// GET /api/v1/devices/:deviceId/analytics/period
export async function getPeriodAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }

    const { deviceId } = req.params;
    const { period = 'day', reference_date } = req.query;

    const validPeriods = ['day', 'week', 'month'];
    if (!validPeriods.includes(period as string)) {
        res.status(400).json({ success: false, error: 'Invalid period. Use: day, week, or month' });
        return;
    }

    const refDate = reference_date ? new Date(reference_date as string) : new Date();

    const metrics = await analyticsService.getPeriodMetrics(
        req.user.tenantId.toString(),
        deviceId as string,
        period as 'day' | 'week' | 'month',
        refDate
    );

    res.json({
        success: true,
        data: metrics,
    });
}
