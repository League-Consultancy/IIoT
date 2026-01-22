import { Router } from 'express';
import { Device } from '../models/Device';
import { MachineSession } from '../models/MachineSession';

const router = Router();

// Endpoint: POST /api/v1/ingest
router.post('/', async (req, res) => {
    try {
        const { deviceId, startTime, stopTime, duration } = req.body;

        // Validate required fields
        if (!deviceId) {
            return res.status(400).json({ error: 'deviceId is required' });
        }
        if (!startTime || !stopTime) {
            return res.status(400).json({ error: 'startTime and stopTime are required' });
        }

        // Find the device to get factoryId and tenantId
        // Try ID first, then serialNumber
        let targetDevice = await Device.findById(deviceId);
        
        if (!targetDevice) {
            targetDevice = await Device.findOne({ serialNumber: deviceId });
            if (!targetDevice) {
                return res.status(404).json({ error: 'Device not found' });
            }
        }

        // Calculate duration if not provided
        const startDate = new Date(startTime);
        const stopDate = new Date(stopTime);
        const calculatedDuration = duration || Math.floor((stopDate.getTime() - startDate.getTime()) / 1000);

        // Create machine session
        const session = new MachineSession({
            deviceId: targetDevice._id.toString(),
            factoryId: targetDevice.factoryId,
            tenantId: targetDevice.tenantId,
            startTime: startDate,
            stopTime: stopDate,
            duration: calculatedDuration
        });

        await session.save();

        // Update device lastSeen and add to totalRunningHours
        await Device.findByIdAndUpdate(
            targetDevice._id,
            {
                lastSeen: stopDate,
                status: 'ONLINE',
                $inc: { totalRunningHours: calculatedDuration / 3600 }
            },
            { new: true }
        );

        // Note: WebSocket broadcast omitted for serverless environment compatibility

        res.status(202).json({
            success: true,
            sessionId: session._id,
            duration: calculatedDuration
        });
    } catch (error) {
        console.error('Session ingestion failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;