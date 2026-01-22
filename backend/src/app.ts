import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import deviceRoutes from './routes/deviceRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();

// 1. Global Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));
app.use(express.json({ limit: '1mb' })); // Limit payload size for ingestion

// 2. Database Connection Logic (exported for reuse)
let isConnected = false;
export const connectDB = async () => {
  if (isConnected) return;
  try {
    const mongoUrl = process.env.MONGO_URI;
    if (!mongoUrl) {
      // In Vercel/Production, this might not throw immediately to allow for cold starts, but good to check.
      console.warn('MONGO_URI is not defined in environment variables');
      return;
    }
    const conn = await mongoose.connect(mongoUrl);
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't exit process in serverless env
    throw error;
  }
};

// 3. Public Routes
app.get('/health', (req, res) => res.status(200).send('OK'));
app.use('/api/auth', authRoutes);

// 4. Dashboard API Routes
app.use('/api/v1', dashboardRoutes);

// 5. Device Ingestion Route
app.use('/api/v1/ingest', deviceRoutes);

// Export the app
export default app;
