import { Types } from 'mongoose';
import { Writable } from 'stream';
import { stringify } from 'csv-stringify';
import ExcelJS from 'exceljs';
import { DeviceSession, Device, Factory, ExportJob } from '../models/index.js';
import { ApiError } from '../middlewares/errorHandler.js';
import { createAuditLog } from '../middlewares/audit.js';
import { env } from '../config/env.js';
import { IDeviceSession, IExportJob } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const EXPORT_DIR = path.join(process.cwd(), 'exports');

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

interface ExportOptions {
    tenantId: string;
    userId: string;
    deviceId: string;
    format: 'csv' | 'xlsx' | 'json';
    dateFrom: Date;
    dateTo: Date;
}

interface SessionExportRow {
    device_id: string;
    device_name: string;
    factory_name: string;
    start_time: string;
    stop_time: string;
    duration_ms: number;
    duration_formatted: string;
    ingested_at: string;
}

function formatDuration(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export async function createExportJob(options: ExportOptions): Promise<IExportJob> {
    // Verify device exists
    const device = await Device.findOne({
        tenant_id: new Types.ObjectId(options.tenantId),
        device_id: options.deviceId,
    });

    if (!device) {
        throw new ApiError(404, 'Device not found');
    }

    // Check record count
    const recordCount = await DeviceSession.countDocuments({
        tenant_id: new Types.ObjectId(options.tenantId),
        device_id: options.deviceId,
        start_time: { $gte: options.dateFrom, $lte: options.dateTo },
    });

    if (recordCount > env.EXPORT_MAX_RECORDS) {
        throw new ApiError(400, `Export exceeds maximum record limit of ${env.EXPORT_MAX_RECORDS}`);
    }

    // Create export job
    const exportJob = await ExportJob.create({
        tenant_id: new Types.ObjectId(options.tenantId),
        user_id: new Types.ObjectId(options.userId),
        device_id: options.deviceId,
        format: options.format,
        date_from: options.dateFrom,
        date_to: options.dateTo,
        status: 'pending',
        created_at: new Date(),
    });

    // Process export asynchronously
    processExport(exportJob._id.toString(), options).catch((error) => {
        console.error('Export processing failed:', error);
    });

    return exportJob;
}

async function processExport(jobId: string, options: ExportOptions): Promise<void> {
    try {
        // Update status to processing
        await ExportJob.updateOne(
            { _id: new Types.ObjectId(jobId) },
            { $set: { status: 'processing' } }
        );

        // Get device and factory info
        const device = await Device.findOne({
            tenant_id: new Types.ObjectId(options.tenantId),
            device_id: options.deviceId,
        });
        const factory = device ? await Factory.findById(device.factory_id) : null;

        // Query sessions with cursor for streaming
        const cursor = DeviceSession.find({
            tenant_id: new Types.ObjectId(options.tenantId),
            device_id: options.deviceId,
            start_time: { $gte: options.dateFrom, $lte: options.dateTo },
        })
            .sort({ start_time: 1 })
            .cursor();

        const filename = `export_${options.deviceId}_${uuidv4()}.${options.format}`;
        const filePath = path.join(EXPORT_DIR, filename);

        let recordCount = 0;

        // Process based on format
        switch (options.format) {
            case 'csv':
                recordCount = await exportToCsv(cursor, filePath, device?.name || '', factory?.name || '');
                break;
            case 'xlsx':
                recordCount = await exportToXlsx(cursor, filePath, device?.name || '', factory?.name || '');
                break;
            case 'json':
                recordCount = await exportToJson(cursor, filePath, device?.name || '', factory?.name || '');
                break;
        }

        // Get file size
        const stats = fs.statSync(filePath);

        // Update job with success
        await ExportJob.updateOne(
            { _id: new Types.ObjectId(jobId) },
            {
                $set: {
                    status: 'completed',
                    file_path: filePath,
                    file_size: stats.size,
                    record_count: recordCount,
                    completed_at: new Date(),
                    expires_at: new Date(Date.now() + env.EXPORT_SIGNED_URL_EXPIRES * 1000),
                },
            }
        );

        // Log audit
        await createAuditLog(
            options.tenantId,
            options.userId,
            'user',
            'export.complete',
            'export_job',
            jobId,
            { device_id: options.deviceId, format: options.format, record_count: recordCount }
        );
    } catch (error) {
        // Update job with failure
        await ExportJob.updateOne(
            { _id: new Types.ObjectId(jobId) },
            {
                $set: {
                    status: 'failed',
                    error_message: error instanceof Error ? error.message : 'Unknown error',
                    completed_at: new Date(),
                },
            }
        );
    }
}

async function exportToCsv(
    cursor: ReturnType<typeof DeviceSession.find>['cursor'],
    filePath: string,
    deviceName: string,
    factoryName: string
): Promise<number> {
    return new Promise((resolve, reject) => {
        let count = 0;
        const writeStream = fs.createWriteStream(filePath);
        const csvStream = stringify({
            header: true,
            columns: [
                'device_id',
                'device_name',
                'factory_name',
                'start_time',
                'stop_time',
                'duration_ms',
                'duration_formatted',
                'ingested_at',
            ],
        });

        csvStream.pipe(writeStream);

        cursor.on('data', (session: IDeviceSession) => {
            count++;
            csvStream.write({
                device_id: session.device_id,
                device_name: deviceName,
                factory_name: factoryName,
                start_time: session.start_time.toISOString(),
                stop_time: session.stop_time.toISOString(),
                duration_ms: session.duration_ms,
                duration_formatted: formatDuration(session.duration_ms),
                ingested_at: session.ingested_at.toISOString(),
            });
        });

        cursor.on('end', () => {
            csvStream.end();
        });

        cursor.on('error', reject);
        writeStream.on('finish', () => resolve(count));
        writeStream.on('error', reject);
    });
}

async function exportToXlsx(
    cursor: ReturnType<typeof DeviceSession.find>['cursor'],
    filePath: string,
    deviceName: string,
    factoryName: string
): Promise<number> {
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        filename: filePath,
    });

    const sheet = workbook.addWorksheet('Sessions');

    // Add headers
    sheet.columns = [
        { header: 'Device ID', key: 'device_id', width: 20 },
        { header: 'Device Name', key: 'device_name', width: 25 },
        { header: 'Factory Name', key: 'factory_name', width: 25 },
        { header: 'Start Time', key: 'start_time', width: 25 },
        { header: 'Stop Time', key: 'stop_time', width: 25 },
        { header: 'Duration (ms)', key: 'duration_ms', width: 15 },
        { header: 'Duration', key: 'duration_formatted', width: 12 },
        { header: 'Ingested At', key: 'ingested_at', width: 25 },
    ];

    let count = 0;

    for await (const session of cursor) {
        count++;
        sheet.addRow({
            device_id: session.device_id,
            device_name: deviceName,
            factory_name: factoryName,
            start_time: session.start_time.toISOString(),
            stop_time: session.stop_time.toISOString(),
            duration_ms: session.duration_ms,
            duration_formatted: formatDuration(session.duration_ms),
            ingested_at: session.ingested_at.toISOString(),
        }).commit();
    }

    await sheet.commit();
    await workbook.commit();

    return count;
}

async function exportToJson(
    cursor: ReturnType<typeof DeviceSession.find>['cursor'],
    filePath: string,
    deviceName: string,
    factoryName: string
): Promise<number> {
    const writeStream = fs.createWriteStream(filePath);
    let count = 0;
    let first = true;

    writeStream.write('[\n');

    for await (const session of cursor) {
        count++;
        if (!first) {
            writeStream.write(',\n');
        }
        first = false;

        const row: SessionExportRow = {
            device_id: session.device_id,
            device_name: deviceName,
            factory_name: factoryName,
            start_time: session.start_time.toISOString(),
            stop_time: session.stop_time.toISOString(),
            duration_ms: session.duration_ms,
            duration_formatted: formatDuration(session.duration_ms),
            ingested_at: session.ingested_at.toISOString(),
        };

        writeStream.write('  ' + JSON.stringify(row));
    }

    writeStream.write('\n]');
    writeStream.end();

    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(count));
        writeStream.on('error', reject);
    });
}

export async function getExportJob(
    tenantId: string,
    jobId: string
): Promise<IExportJob | null> {
    return ExportJob.findOne({
        _id: new Types.ObjectId(jobId),
        tenant_id: new Types.ObjectId(tenantId),
    });
}

export async function getExportDownloadPath(
    tenantId: string,
    jobId: string
): Promise<string | null> {
    const job = await ExportJob.findOne({
        _id: new Types.ObjectId(jobId),
        tenant_id: new Types.ObjectId(tenantId),
        status: 'completed',
    });

    if (!job || !job.file_path) {
        return null;
    }

    // Check if file still exists
    if (!fs.existsSync(job.file_path)) {
        return null;
    }

    // Check if expired
    if (job.expires_at && job.expires_at < new Date()) {
        return null;
    }

    return job.file_path;
}

export async function getUserExportJobs(
    tenantId: string,
    userId: string,
    page = 1,
    limit = 20
): Promise<{ jobs: IExportJob[]; total: number }> {
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
        ExportJob.find({
            tenant_id: new Types.ObjectId(tenantId),
            user_id: new Types.ObjectId(userId),
        })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit),
        ExportJob.countDocuments({
            tenant_id: new Types.ObjectId(tenantId),
            user_id: new Types.ObjectId(userId),
        }),
    ]);

    return { jobs, total };
}
