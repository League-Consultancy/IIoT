import { Measurement } from '../models/Measurement';
import { createClient } from 'redis';

// Assuming Redis client is initialized elsewhere in a real app
const redisClient = createClient({ url: process.env.REDIS_URL });

interface IngestPayload {
  deviceId: string;
  factoryId: string;
  tenantId: string;
  readings: Array<{
    timestamp: number;
    value: number;
    type: 'STATE' | 'CURRENT' | 'RUNTIME';
  }>;
}

export class IngestionService {
  
  /**
   * Process a batch of readings from a device.
   * Uses bulkWrite for MongoDB efficiency.
   * Updates 'Last Seen' in Redis for dashboard real-time view.
   */
  static async processBatch(payload: IngestPayload) {
    const operations = payload.readings.map(reading => ({
      insertOne: {
        document: {
          timestamp: new Date(reading.timestamp),
          value: reading.value,
          metadata: {
            deviceId: payload.deviceId,
            factoryId: payload.factoryId,
            tenantId: payload.tenantId,
            type: reading.type
          }
        }
      }
    }));

    // 1. Write to Time Series Store (MongoDB)
    // We use unordered write to continue processing even if one fails (though TS ignores dups usually)
    await Measurement.bulkWrite(operations, { ordered: false });

    // 2. Update Device State in Redis (Fast access for Dashboard)
    const redisKey = `device:${payload.tenantId}:${payload.deviceId}:status`;
    const lastReading = payload.readings[payload.readings.length - 1]; // Assume time ordered
    
    // Update 'lastSeen'
    await redisClient.hSet(redisKey, {
      lastSeen: Date.now().toString(),
      lastValue: lastReading.value.toString()
    });

    // Set expire to detect offline devices (e.g., 2x reporting interval)
    await redisClient.expire(redisKey, 300); // 5 minutes TTL
  }
}