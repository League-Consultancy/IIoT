import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase(): Promise<typeof mongoose> {
    try {
        const connection = await mongoose.connect(env.MONGODB_URI, {
            dbName: env.MONGODB_DB_NAME,
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(`✅ MongoDB connected: ${connection.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

        return connection;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
}

export async function disconnectDatabase(): Promise<void> {
    try {
        await mongoose.disconnect();
        console.log('MongoDB disconnected');
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
    }
}

// Create time-series collection for device sessions if it doesn't exist
export async function initializeCollections(): Promise<void> {
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('Database not connected');
    }

    const collections = await db.listCollections({ name: 'device_sessions' }).toArray();

    if (collections.length === 0) {
        try {
            await db.createCollection('device_sessions', {
                timeseries: {
                    timeField: 'start_time',
                    metaField: 'metadata',
                    granularity: 'hours',
                },
                expireAfterSeconds: 157680000, // 5 years in seconds
            });
            console.log('✅ Created time-series collection: device_sessions');
        } catch (error) {
            // Collection might already exist or MongoDB version doesn't support time-series
            console.warn('Could not create time-series collection, using regular collection:', error);
        }
    }
}
