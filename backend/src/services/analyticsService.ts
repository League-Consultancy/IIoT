import { Types } from 'mongoose';
import { DeviceSession, Device, Factory } from '../models/index.js';
import { DurationMetric, DeviceAnalyticsSummary } from '../types/index.js';

type PeriodType = 'day' | 'week' | 'month';

interface DateRange {
    from: Date;
    to: Date;
}

function getDateRangeForPeriod(period: PeriodType, referenceDate: Date = new Date()): DateRange {
    const from = new Date(referenceDate);
    const to = new Date(referenceDate);

    switch (period) {
        case 'day':
            from.setHours(0, 0, 0, 0);
            to.setHours(23, 59, 59, 999);
            break;
        case 'week':
            const dayOfWeek = from.getDay();
            from.setDate(from.getDate() - dayOfWeek);
            from.setHours(0, 0, 0, 0);
            to.setDate(from.getDate() + 6);
            to.setHours(23, 59, 59, 999);
            break;
        case 'month':
            from.setDate(1);
            from.setHours(0, 0, 0, 0);
            to.setMonth(to.getMonth() + 1);
            to.setDate(0);
            to.setHours(23, 59, 59, 999);
            break;
    }

    return { from, to };
}

export async function getDailyDuration(
    tenantId: string,
    deviceId: string,
    dateFrom: Date,
    dateTo: Date
): Promise<DurationMetric[]> {
    const pipeline = [
        {
            $match: {
                tenant_id: new Types.ObjectId(tenantId),
                device_id: deviceId,
                start_time: { $gte: dateFrom, $lte: dateTo },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: '$start_time' },
                    month: { $month: '$start_time' },
                    day: { $dayOfMonth: '$start_time' },
                },
                total_duration_ms: { $sum: '$duration_ms' },
                session_count: { $sum: 1 },
                avg_session_duration_ms: { $avg: '$duration_ms' },
            },
        },
        {
            $sort: { '_id.year': 1 as const, '_id.month': 1 as const, '_id.day': 1 as const },
        },
        {
            $project: {
                _id: 0,
                period: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: {
                            $dateFromParts: {
                                year: '$_id.year',
                                month: '$_id.month',
                                day: '$_id.day',
                            },
                        },
                    },
                },
                start_date: {
                    $dateFromParts: {
                        year: '$_id.year',
                        month: '$_id.month',
                        day: '$_id.day',
                    },
                },
                end_date: {
                    $dateFromParts: {
                        year: '$_id.year',
                        month: '$_id.month',
                        day: '$_id.day',
                        hour: 23,
                        minute: 59,
                        second: 59,
                    },
                },
                total_duration_ms: 1,
                session_count: 1,
                avg_session_duration_ms: { $round: ['$avg_session_duration_ms', 0] },
            },
        },
    ];

    return DeviceSession.aggregate(pipeline);
}

export async function getWeeklyDuration(
    tenantId: string,
    deviceId: string,
    dateFrom: Date,
    dateTo: Date
): Promise<DurationMetric[]> {
    const pipeline = [
        {
            $match: {
                tenant_id: new Types.ObjectId(tenantId),
                device_id: deviceId,
                start_time: { $gte: dateFrom, $lte: dateTo },
            },
        },
        {
            $group: {
                _id: {
                    year: { $isoWeekYear: '$start_time' },
                    week: { $isoWeek: '$start_time' },
                },
                total_duration_ms: { $sum: '$duration_ms' },
                session_count: { $sum: 1 },
                avg_session_duration_ms: { $avg: '$duration_ms' },
                min_date: { $min: '$start_time' },
                max_date: { $max: '$start_time' },
            },
        },
        {
            $sort: { '_id.year': 1 as const, '_id.week': 1 as const },
        },
        {
            $project: {
                _id: 0,
                period: { $concat: [{ $toString: '$_id.year' }, '-W', { $toString: '$_id.week' }] },
                start_date: '$min_date',
                end_date: '$max_date',
                total_duration_ms: 1,
                session_count: 1,
                avg_session_duration_ms: { $round: ['$avg_session_duration_ms', 0] },
            },
        },
    ];

    return DeviceSession.aggregate(pipeline);
}

export async function getMonthlyDuration(
    tenantId: string,
    deviceId: string,
    dateFrom: Date,
    dateTo: Date
): Promise<DurationMetric[]> {
    const pipeline = [
        {
            $match: {
                tenant_id: new Types.ObjectId(tenantId),
                device_id: deviceId,
                start_time: { $gte: dateFrom, $lte: dateTo },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: '$start_time' },
                    month: { $month: '$start_time' },
                },
                total_duration_ms: { $sum: '$duration_ms' },
                session_count: { $sum: 1 },
                avg_session_duration_ms: { $avg: '$duration_ms' },
            },
        },
        {
            $sort: { '_id.year': 1 as const, '_id.month': 1 as const },
        },
        {
            $project: {
                _id: 0,
                period: {
                    $dateToString: {
                        format: '%Y-%m',
                        date: {
                            $dateFromParts: {
                                year: '$_id.year',
                                month: '$_id.month',
                                day: 1,
                            },
                        },
                    },
                },
                start_date: {
                    $dateFromParts: {
                        year: '$_id.year',
                        month: '$_id.month',
                        day: 1,
                    },
                },
                end_date: {
                    $dateFromParts: {
                        year: '$_id.year',
                        month: { $add: ['$_id.month', 1] },
                        day: 0,
                    },
                },
                total_duration_ms: 1,
                session_count: 1,
                avg_session_duration_ms: { $round: ['$avg_session_duration_ms', 0] },
            },
        },
    ];

    return DeviceSession.aggregate(pipeline);
}

export async function getDeviceSummary(
    tenantId: string,
    deviceId: string,
    dateFrom: Date,
    dateTo: Date
): Promise<DeviceAnalyticsSummary | null> {
    // Get device info
    const device = await Device.findOne({
        tenant_id: new Types.ObjectId(tenantId),
        device_id: deviceId,
    });

    if (!device) {
        return null;
    }

    // Get factory info
    const factory = await Factory.findById(device.factory_id);

    // Aggregate metrics
    const pipeline = [
        {
            $match: {
                tenant_id: new Types.ObjectId(tenantId),
                device_id: deviceId,
                start_time: { $gte: dateFrom, $lte: dateTo },
            },
        },
        {
            $group: {
                _id: null,
                total_duration_ms: { $sum: '$duration_ms' },
                session_count: { $sum: 1 },
                avg_session_duration_ms: { $avg: '$duration_ms' },
                min_session_duration_ms: { $min: '$duration_ms' },
                max_session_duration_ms: { $max: '$duration_ms' },
            },
        },
    ];

    const [result] = await DeviceSession.aggregate(pipeline);

    return {
        device_id: deviceId,
        device_name: device.name,
        factory_name: factory?.name || 'Unknown',
        period: {
            from: dateFrom,
            to: dateTo,
        },
        metrics: result
            ? {
                total_duration_ms: result.total_duration_ms,
                session_count: result.session_count,
                avg_session_duration_ms: Math.round(result.avg_session_duration_ms),
                min_session_duration_ms: result.min_session_duration_ms,
                max_session_duration_ms: result.max_session_duration_ms,
            }
            : {
                total_duration_ms: 0,
                session_count: 0,
                avg_session_duration_ms: 0,
                min_session_duration_ms: 0,
                max_session_duration_ms: 0,
            },
    };
}

export async function getPeriodMetrics(
    tenantId: string,
    deviceId: string,
    period: PeriodType,
    referenceDate?: Date
): Promise<DurationMetric | null> {
    const { from, to } = getDateRangeForPeriod(period, referenceDate);

    const pipeline = [
        {
            $match: {
                tenant_id: new Types.ObjectId(tenantId),
                device_id: deviceId,
                start_time: { $gte: from, $lte: to },
            },
        },
        {
            $group: {
                _id: null,
                total_duration_ms: { $sum: '$duration_ms' },
                session_count: { $sum: 1 },
                avg_session_duration_ms: { $avg: '$duration_ms' },
            },
        },
    ];

    const [result] = await DeviceSession.aggregate(pipeline);

    if (!result) {
        return {
            period,
            start_date: from,
            end_date: to,
            total_duration_ms: 0,
            session_count: 0,
            avg_session_duration_ms: 0,
        };
    }

    return {
        period,
        start_date: from,
        end_date: to,
        total_duration_ms: result.total_duration_ms,
        session_count: result.session_count,
        avg_session_duration_ms: Math.round(result.avg_session_duration_ms),
    };
}
