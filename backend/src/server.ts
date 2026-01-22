import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import deviceRoutes from './routes/deviceRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import authRoutes from './routes/authRoutes';
import { tenantContext } from './middleware/tenantContext';
import { exit } from 'process';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// 1. Global Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));
app.use(express.json({ limit: '1mb' })); // Limit payload size for ingestion

// 2. Database Connection
const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      throw new Error('MONGO_URL is not defined in environment variables');
    }
    const conn = await mongoose.connect(mongoUrl);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    exit(1);
  }
};

// 3. Public Routes (e.g. Health Check, Login)
app.get('/health', (req, res) => res.status(200).send('OK'));
app.use('/api/auth', authRoutes);

// 4. Dashboard API Routes (devices, factories, stats, telemetry)
// Must be mounted before device ingestion to catch GET /devices
app.use('/api/v1', dashboardRoutes);

// 5. Device Ingestion Route (separate path to avoid conflict)
app.use('/api/v1/ingest', deviceRoutes);

// Start
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});