import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { DeviceSession, Device } from '@/lib/models';
import { Types } from 'mongoose';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        console.log('Ingestion attempt started...');

        try {
            await connectDB();
            console.log('DB connected');
        } catch (dbError) {
            console.error('DB Connection failed:', dbError);
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        let body;
        try {
            body = await request.json();
            console.log('Payload received:', JSON.stringify(body));
        } catch (jsonError) {
            console.error('Invalid JSON:', jsonError);
            return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
        }

        const { device_id, start_time, stop_time, duration } = body;

        // Validation
        if (!device_id || !start_time || !stop_time || !duration) {
            console.warn('Missing fields:', { device_id, start_time, stop_time, duration });
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const startTime = new Date(start_time as string);
        const stopTime = new Date(stop_time as string);

        if (isNaN(startTime.getTime()) || isNaN(stopTime.getTime())) {
            return NextResponse.json(
                { success: false, error: 'Invalid timestamp format' },
                { status: 400 }
            );
        }

        if (startTime >= stopTime) {
            return NextResponse.json(
                { success: false, error: 'start_time must be before stop_time' },
                { status: 400 }
            );
        }

        const computedDurationMs = stopTime.getTime() - startTime.getTime();
        const durationDiff = Math.abs(computedDurationMs - (duration as number));

        if (durationDiff > 1000) {
            console.warn(`Duration mismatch for device ${device_id}: Client=${duration}, Server=${computedDurationMs}`);
        }

        // Verify device (NO AUTH REQUIRED - Lookup by device_id)
        console.log(`Looking up device: ${device_id}`);
        const device = await Device.findOne({
            device_id: device_id,
            is_active: true,
        });

        if (!device) {
            console.warn(`Device not found: ${device_id}`);
            return NextResponse.json(
                { success: false, error: `Device ${device_id} not found or inactive` },
                { status: 404 }
            );
        }
        console.log(`Device found: ${device._id} (Tenant: ${device.tenant_id})`);

        try {
            console.log('Creating session...');
            const session = await DeviceSession.create({
                tenant_id: device.tenant_id,
                factory_id: device.factory_id,
                device_id: device_id,
                start_time: startTime,
                stop_time: stopTime,
                duration_ms: computedDurationMs,
                ingested_at: new Date(),
            });
            console.log(`Session created: ${session._id}`);

            return NextResponse.json({
                success: true,
                data: {
                    session_id: session._id.toString(),
                    is_duplicate: false,
                    computed_duration_ms: computedDurationMs,
                },
                message: 'Session ingested successfully',
            });
        } catch (error: any) {
            // Idempotency check (duplicate key error)
            if (error.code === 11000) {
                console.log('Duplicate session detected (idempotent)');
                const existingSession = await DeviceSession.findOne({
                    device_id: device_id,
                    start_time: startTime,
                    stop_time: stopTime,
                });

                return NextResponse.json({
                    success: true,
                    data: {
                        session_id: existingSession?._id.toString(),
                        is_duplicate: true,
                        computed_duration_ms: computedDurationMs,
                    },
                    message: 'Session already exists (idempotent)',
                });
            }
            throw error;
        }
    } catch (error) {
        console.error('Ingestion error details:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
}
