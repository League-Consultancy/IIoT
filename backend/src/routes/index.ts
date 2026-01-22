import { Router } from 'express';
import authRoutes from './authRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import deviceRoutes from './deviceRoutes.js';
import exportRoutes from './exportRoutes.js';
import factoryRoutes from './factoryRoutes.js';

const router = Router();

// API version 1 routes
router.use('/auth', authRoutes);
router.use('/device', sessionRoutes);  // Session ingestion endpoint
router.use('/devices', deviceRoutes);  // Device management & analytics
router.use('/exports', exportRoutes);
router.use('/factories', factoryRoutes);

// Health check
router.get('/health', (_req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

export default router;
