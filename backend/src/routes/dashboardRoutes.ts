import { Router } from 'express';
import { Device } from '../models/Device';
import { Factory } from '../models/Factory';
import { Measurement } from '../models/Measurement';
import { MachineSession } from '../models/MachineSession';

const router = Router();

// Get machine sessions for a device
router.get('/sessions/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { days = 7 } = req.query;
        const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

        const sessions = await MachineSession.find({
            deviceId,
            startTime: { $gte: since }
        }).sort({ startTime: -1 }).limit(500);

        res.json(sessions.map(s => ({
            id: s._id,
            deviceId: s.deviceId,
            startTime: s.startTime.toISOString(),
            stopTime: s.stopTime.toISOString(),
            duration: s.duration
        })));
    } catch (error) {
        console.error('Error fetching device sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// Get all sessions (with filters)
router.get('/sessions', async (req, res) => {
    try {
        const { deviceId, factoryId, days = 7 } = req.query;
        const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

        const filter: any = { startTime: { $gte: since } };
        if (deviceId) filter.deviceId = deviceId;
        if (factoryId) filter.factoryId = factoryId;

        const sessions = await MachineSession.find(filter).sort({ startTime: -1 }).limit(500);
        res.json(sessions.map(s => ({
            id: s._id,
            deviceId: s.deviceId,
            factoryId: s.factoryId,
            startTime: s.startTime.toISOString(),
            stopTime: s.stopTime.toISOString(),
            duration: s.duration
        })));
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// Get all devices (with optional filters)
router.get('/devices', async (req, res) => {
    try {
        const { factoryId, tenantId, status } = req.query;

        const filter: any = {};
        if (factoryId) filter.factoryId = factoryId;
        if (tenantId) filter.tenantId = tenantId;
        if (status) filter.status = status;

        const devices = await Device.find(filter).sort({ lastSeen: -1 });

        res.json(devices.map(d => ({
            id: d._id,
            serialNumber: d.serialNumber,
            factoryId: d.factoryId,
            name: d.name,
            status: d.status,
            firmwareVersion: d.firmwareVersion,
            lastSeen: d.lastSeen.toISOString(),
            totalRunningHours: d.totalRunningHours,
            metadata: d.metadata
        })));
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ error: 'Failed to fetch devices' });
    }
});

// Get single device by ID
router.get('/devices/:id', async (req, res) => {
    try {
        const device = await Device.findById(req.params.id);
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        res.json({
            id: device._id,
            serialNumber: device.serialNumber,
            factoryId: device.factoryId,
            name: device.name,
            status: device.status,
            firmwareVersion: device.firmwareVersion,
            lastSeen: device.lastSeen.toISOString(),
            totalRunningHours: device.totalRunningHours,
            metadata: device.metadata
        });
    } catch (error) {
        console.error('Error fetching device:', error);
        res.status(500).json({ error: 'Failed to fetch device' });
    }
});

// Create a new device
router.post('/devices', async (req, res) => {
    try {
        const device = new Device(req.body);
        await device.save();

        res.status(201).json({
            id: device._id,
            serialNumber: device.serialNumber,
            factoryId: device.factoryId,
            name: device.name,
            status: device.status,
            firmwareVersion: device.firmwareVersion,
            lastSeen: device.lastSeen.toISOString(),
            totalRunningHours: device.totalRunningHours,
            metadata: device.metadata
        });
    } catch (error: any) {
        console.error('Error creating device:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Serial number already exists' });
        }
        res.status(500).json({ error: 'Failed to create device' });
    }
});

// Update device
router.put('/devices/:id', async (req, res) => {
    try {
        const device = await Device.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        res.json({
            id: device._id,
            serialNumber: device.serialNumber,
            factoryId: device.factoryId,
            name: device.name,
            status: device.status,
            firmwareVersion: device.firmwareVersion,
            lastSeen: device.lastSeen.toISOString(),
            totalRunningHours: device.totalRunningHours,
            metadata: device.metadata
        });
    } catch (error) {
        console.error('Error updating device:', error);
        res.status(500).json({ error: 'Failed to update device' });
    }
});

// Delete device
router.delete('/devices/:id', async (req, res) => {
    try {
        const device = await Device.findByIdAndDelete(req.params.id);
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting device:', error);
        res.status(500).json({ error: 'Failed to delete device' });
    }
});

// Get all factories
router.get('/factories', async (req, res) => {
    try {
        const { tenantId } = req.query;

        const filter: any = {};
        if (tenantId) filter.tenantId = tenantId;

        const factories = await Factory.find(filter);

        res.json(factories.map(f => ({
            id: f._id,
            tenantId: f.tenantId,
            name: f.name,
            timezone: f.timezone,
            location: f.location,
            image: f.image
        })));
    } catch (error) {
        console.error('Error fetching factories:', error);
        res.status(500).json({ error: 'Failed to fetch factories' });
    }
});

// Get single factory by ID
router.get('/factories/:id', async (req, res) => {
    try {
        const factory = await Factory.findById(req.params.id);
        if (!factory) {
            return res.status(404).json({ error: 'Factory not found' });
        }

        res.json({
            id: factory._id,
            tenantId: factory.tenantId,
            name: factory.name,
            timezone: factory.timezone,
            location: factory.location,
            image: factory.image
        });
    } catch (error) {
        console.error('Error fetching factory:', error);
        res.status(500).json({ error: 'Failed to fetch factory' });
    }
});

// Create factory
router.post('/factories', async (req, res) => {
    try {
        const factory = new Factory(req.body);
        await factory.save();

        res.status(201).json({
            id: factory._id,
            tenantId: factory.tenantId,
            name: factory.name,
            timezone: factory.timezone,
            location: factory.location,
            image: factory.image
        });
    } catch (error) {
        console.error('Error creating factory:', error);
        res.status(500).json({ error: 'Failed to create factory' });
    }
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const { factoryId, tenantId } = req.query;

        const filter: any = {};
        if (factoryId && factoryId !== 'all') filter.factoryId = factoryId;
        if (tenantId) filter.tenantId = tenantId;

        const [total, online, offline, maintenance] = await Promise.all([
            Device.countDocuments(filter),
            Device.countDocuments({ ...filter, status: 'ONLINE' }),
            Device.countDocuments({ ...filter, status: 'OFFLINE' }),
            Device.countDocuments({ ...filter, status: 'MAINTENANCE' })
        ]);

        res.json({ total, online, offline, maintenance });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Get telemetry data for a device
router.get('/telemetry/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { hours = 24, type } = req.query;

        const since = new Date(Date.now() - Number(hours) * 60 * 60 * 1000);

        const filter: any = {
            'metadata.deviceId': deviceId,
            timestamp: { $gte: since }
        };

        if (type) filter['metadata.type'] = type;

        const measurements = await Measurement.find(filter)
            .sort({ timestamp: 1 })
            .limit(1000);

        res.json(measurements.map(m => ({
            timestamp: m.timestamp.toISOString(),
            value: m.value,
            type: m.metadata.type
        })));
    } catch (error) {
        console.error('Error fetching telemetry:', error);
        res.status(500).json({ error: 'Failed to fetch telemetry' });
    }
});

export default router;
