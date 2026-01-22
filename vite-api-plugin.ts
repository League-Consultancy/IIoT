// Vite plugin to integrate Express API routes
// This allows both frontend and backend to run on the same port

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import type { ViteDevServer, Plugin } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';

// Import models
import { Device } from './backend/src/models/Device';
import { Factory } from './backend/src/models/Factory';
import { Measurement } from './backend/src/models/Measurement';
import { MachineSession } from './backend/src/models/MachineSession';
import { User } from './backend/src/models/User';
import jwt from 'jsonwebtoken';

const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/iiot_platform';
const JWT_SECRET = process.env.JWT_SECRET || 'iiot-platform-secret-key-change-in-production';
const WS_PORT = parseInt(process.env.WS_PORT || '3002');

// WebSocket clients store
let wss: WebSocketServer | null = null;
const wsClients = new Set<WebSocket>();

// Broadcast to all connected WebSocket clients
function broadcastToClients(data: any) {
    const message = JSON.stringify(data);
    wsClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Connect to MongoDB
let isConnected = false;
async function connectDB() {
    if (isConnected) return;
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected for Vite API');
        isConnected = true;
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
}

export function apiPlugin(): Plugin {
    return {
        name: 'api-server',
        configureServer(server: ViteDevServer) {
            // Initialize WebSocket server
            if (!wss) {
                wss = new WebSocketServer({ port: WS_PORT });
                console.log(`WebSocket server running on port ${WS_PORT}`);

                wss.on('connection', (ws) => {
                    console.log('Dashboard client connected');
                    wsClients.add(ws);

                    ws.on('close', () => {
                        console.log('Dashboard client disconnected');
                        wsClients.delete(ws);
                    });

                    ws.on('error', (err) => {
                        console.error('WebSocket error:', err);
                        wsClients.delete(ws);
                    });
                });
            }

            const app = express();
            app.use(cors({ origin: '*' }));
            app.use(express.json());


            // Health check
            app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

            // ==========================================
            // AUTHENTICATION ROUTES
            // ==========================================

            // Signup
            app.post('/api/auth/signup', async (req, res) => {
                try {
                    await connectDB();
                    const { email, password, name } = req.body;

                    // Validate input
                    if (!email || !password || !name) {
                        return res.status(400).json({ error: 'Email, password, and name are required' });
                    }

                    if (password.length < 6) {
                        return res.status(400).json({ error: 'Password must be at least 6 characters' });
                    }

                    // Check if user already exists
                    const existingUser = await User.findOne({ email: email.toLowerCase() });
                    if (existingUser) {
                        return res.status(400).json({ error: 'Email already registered' });
                    }

                    // Get all factories for default access
                    const factories = await Factory.find();
                    const factoryIds = factories.map(f => f._id.toString());

                    // Create new user
                    const user = new User({
                        email: email.toLowerCase(),
                        password,
                        name,
                        role: 'OPERATOR',
                        tenantId: 't_default',
                        factoryIds
                    });

                    await user.save();

                    // Generate JWT token
                    const token = jwt.sign(
                        {
                            id: user._id,
                            email: user.email,
                            role: user.role,
                            tenantId: user.tenantId
                        },
                        JWT_SECRET,
                        { expiresIn: '7d' }
                    );

                    res.status(201).json({
                        token,
                        user: {
                            id: user._id,
                            email: user.email,
                            name: user.name,
                            role: user.role,
                            tenantId: user.tenantId,
                            factoryIds: user.factoryIds
                        }
                    });
                } catch (error) {
                    console.error('Signup error:', error);
                    res.status(500).json({ error: 'Failed to create account' });
                }
            });

            // Login
            app.post('/api/auth/login', async (req, res) => {
                try {
                    await connectDB();
                    const { email, password } = req.body;

                    // Validate input
                    if (!email || !password) {
                        return res.status(400).json({ error: 'Email and password are required' });
                    }

                    // Find user
                    const user = await User.findOne({ email: email.toLowerCase() });
                    if (!user) {
                        return res.status(401).json({ error: 'Invalid email or password' });
                    }

                    // Check password
                    const isMatch = await user.comparePassword(password);
                    if (!isMatch) {
                        return res.status(401).json({ error: 'Invalid email or password' });
                    }

                    // Generate JWT token
                    const token = jwt.sign(
                        {
                            id: user._id,
                            email: user.email,
                            role: user.role,
                            tenantId: user.tenantId
                        },
                        JWT_SECRET,
                        { expiresIn: '7d' }
                    );

                    res.json({
                        token,
                        user: {
                            id: user._id,
                            email: user.email,
                            name: user.name,
                            role: user.role,
                            tenantId: user.tenantId,
                            factoryIds: user.factoryIds
                        }
                    });
                } catch (error) {
                    console.error('Login error:', error);
                    res.status(500).json({ error: 'Login failed' });
                }
            });

            // SSO Login (simulated - creates/logs in demo user)
            app.post('/api/auth/sso', async (req, res) => {
                try {
                    await connectDB();

                    // For SSO, we create or find a demo admin user
                    const ssoEmail = 'admin@iiot-cloud.com';
                    let user = await User.findOne({ email: ssoEmail });

                    if (!user) {
                        // Get all factories for admin access
                        const factories = await Factory.find();
                        const factoryIds = factories.map(f => f._id.toString());

                        user = new User({
                            email: ssoEmail,
                            password: 'sso-managed-password-' + Date.now(),
                            name: 'SSO Admin',
                            role: 'ADMIN',
                            tenantId: 't_enterprise',
                            factoryIds
                        });
                        await user.save();
                    }

                    // Generate JWT token
                    const token = jwt.sign(
                        {
                            id: user._id,
                            email: user.email,
                            role: user.role,
                            tenantId: user.tenantId
                        },
                        JWT_SECRET,
                        { expiresIn: '7d' }
                    );

                    res.json({
                        token,
                        user: {
                            id: user._id,
                            email: user.email,
                            name: user.name,
                            role: user.role,
                            tenantId: user.tenantId,
                            factoryIds: user.factoryIds
                        }
                    });
                } catch (error) {
                    console.error('SSO error:', error);
                    res.status(500).json({ error: 'SSO login failed' });
                }
            });

            // Get current user from token
            app.get('/api/auth/me', async (req, res) => {
                try {
                    const authHeader = req.headers.authorization;
                    if (!authHeader || !authHeader.startsWith('Bearer ')) {
                        return res.status(401).json({ error: 'No token provided' });
                    }

                    const token = authHeader.substring(7);
                    const decoded = jwt.verify(token, JWT_SECRET) as any;

                    await connectDB();
                    const user = await User.findById(decoded.id).select('-password');

                    if (!user) {
                        return res.status(401).json({ error: 'User not found' });
                    }

                    res.json({
                        id: user._id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        tenantId: user.tenantId,
                        factoryIds: user.factoryIds
                    });
                } catch (error) {
                    console.error('Auth check error:', error);
                    res.status(401).json({ error: 'Invalid token' });
                }
            });

            // ==========================================
            // DEVICE & FACTORY ROUTES (existing)
            // ==========================================


            // Get all devices
            app.get('/api/v1/devices', async (req, res) => {
                try {
                    await connectDB();
                    const { factoryId, status } = req.query;
                    const filter: any = {};
                    if (factoryId) filter.factoryId = factoryId;
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

            // Get single device
            app.get('/api/v1/devices/:id', async (req, res) => {
                try {
                    await connectDB();
                    const device = await Device.findById(req.params.id);
                    if (!device) return res.status(404).json({ error: 'Device not found' });

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
                    res.status(500).json({ error: 'Failed to fetch device' });
                }
            });

            // Create device
            app.post('/api/v1/devices', async (req, res) => {
                try {
                    await connectDB();
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
                    if (error.code === 11000) {
                        return res.status(400).json({ error: 'Serial number already exists' });
                    }
                    res.status(500).json({ error: 'Failed to create device' });
                }
            });

            // Get all factories
            app.get('/api/v1/factories', async (req, res) => {
                try {
                    await connectDB();
                    const factories = await Factory.find();
                    res.json(factories.map(f => ({
                        id: f._id,
                        tenantId: f.tenantId,
                        name: f.name,
                        timezone: f.timezone,
                        location: f.location,
                        image: f.image
                    })));
                } catch (error) {
                    res.status(500).json({ error: 'Failed to fetch factories' });
                }
            });

            // Get single factory
            app.get('/api/v1/factories/:id', async (req, res) => {
                try {
                    await connectDB();
                    const factory = await Factory.findById(req.params.id);
                    if (!factory) return res.status(404).json({ error: 'Factory not found' });

                    res.json({
                        id: factory._id,
                        tenantId: factory.tenantId,
                        name: factory.name,
                        timezone: factory.timezone,
                        location: factory.location,
                        image: factory.image
                    });
                } catch (error) {
                    res.status(500).json({ error: 'Failed to fetch factory' });
                }
            });

            // Create factory
            app.post('/api/v1/factories', async (req, res) => {
                try {
                    await connectDB();
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
                    res.status(500).json({ error: 'Failed to create factory' });
                }
            });

            // Get dashboard stats
            app.get('/api/v1/stats', async (req, res) => {
                try {
                    await connectDB();
                    const { factoryId } = req.query;
                    const filter: any = {};
                    if (factoryId && factoryId !== 'all') filter.factoryId = factoryId;

                    const [total, online, offline, maintenance] = await Promise.all([
                        Device.countDocuments(filter),
                        Device.countDocuments({ ...filter, status: 'ONLINE' }),
                        Device.countDocuments({ ...filter, status: 'OFFLINE' }),
                        Device.countDocuments({ ...filter, status: 'MAINTENANCE' })
                    ]);

                    res.json({ total, online, offline, maintenance });
                } catch (error) {
                    res.status(500).json({ error: 'Failed to fetch stats' });
                }
            });

            // Get machine sessions for a device
            app.get('/api/v1/sessions/:deviceId', async (req, res) => {
                try {
                    await connectDB();
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
                    res.status(500).json({ error: 'Failed to fetch sessions' });
                }
            });

            // Get all sessions (with filters)
            app.get('/api/v1/sessions', async (req, res) => {
                try {
                    await connectDB();
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
                    res.status(500).json({ error: 'Failed to fetch sessions' });
                }
            });

            // ==========================================
            // NEW: Machine Session Ingestion Endpoint
            // Payload: { deviceId, startTime, stopTime, duration }
            // ==========================================
            app.post('/api/v1/ingest', async (req, res) => {
                try {
                    await connectDB();
                    const { deviceId, startTime, stopTime, duration } = req.body;

                    // Validate required fields
                    if (!deviceId) {
                        return res.status(400).json({ error: 'deviceId is required' });
                    }
                    if (!startTime || !stopTime) {
                        return res.status(400).json({ error: 'startTime and stopTime are required' });
                    }

                    // Find the device to get factoryId and tenantId
                    const device = await Device.findById(deviceId);
                    if (!device) {
                        // Try finding by serialNumber
                        const deviceBySerial = await Device.findOne({ serialNumber: deviceId });
                        if (!deviceBySerial) {
                            return res.status(404).json({ error: 'Device not found' });
                        }
                    }

                    const targetDevice = device || await Device.findOne({ serialNumber: deviceId });

                    // Calculate duration if not provided
                    const startDate = new Date(startTime);
                    const stopDate = new Date(stopTime);
                    const calculatedDuration = duration || Math.floor((stopDate.getTime() - startDate.getTime()) / 1000);

                    // Create machine session
                    const session = new MachineSession({
                        deviceId: targetDevice!._id.toString(),
                        factoryId: targetDevice!.factoryId,
                        tenantId: targetDevice!.tenantId,
                        startTime: startDate,
                        stopTime: stopDate,
                        duration: calculatedDuration
                    });

                    await session.save();

                    // Update device lastSeen and add to totalRunningHours
                    const updatedDevice = await Device.findByIdAndUpdate(
                        targetDevice!._id,
                        {
                            lastSeen: stopDate,
                            status: 'ONLINE',
                            $inc: { totalRunningHours: calculatedDuration / 3600 }
                        },
                        { new: true }
                    );

                    // Broadcast to connected WebSocket clients
                    broadcastToClients({
                        type: 'NEW_SESSION',
                        data: {
                            session: {
                                id: session._id,
                                deviceId: targetDevice!._id.toString(),
                                factoryId: targetDevice!.factoryId,
                                startTime: startDate.toISOString(),
                                stopTime: stopDate.toISOString(),
                                duration: calculatedDuration
                            },
                            device: updatedDevice ? {
                                id: updatedDevice._id,
                                name: updatedDevice.name,
                                status: updatedDevice.status,
                                totalRunningHours: updatedDevice.totalRunningHours,
                                lastSeen: updatedDevice.lastSeen.toISOString()
                            } : null
                        }
                    });

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

            // Legacy telemetry endpoint (kept for compatibility)
            app.get('/api/v1/telemetry/:deviceId', async (req, res) => {
                try {
                    await connectDB();
                    const { deviceId } = req.params;
                    const { hours = 24, type } = req.query;
                    const since = new Date(Date.now() - Number(hours) * 60 * 60 * 1000);

                    const filter: any = {
                        'metadata.deviceId': deviceId,
                        timestamp: { $gte: since }
                    };
                    if (type) filter['metadata.type'] = type;

                    const measurements = await Measurement.find(filter).sort({ timestamp: 1 }).limit(1000);
                    res.json(measurements.map(m => ({
                        timestamp: m.timestamp.toISOString(),
                        value: m.value,
                        type: m.metadata.type
                    })));
                } catch (error) {
                    res.status(500).json({ error: 'Failed to fetch telemetry' });
                }
            });

            // If no API route matched, pass control back to Vite
            app.use((req, res, next) => {
                next();
            });

            // Mount Express app as middleware
            server.middlewares.use(app);
        }
    };
}

