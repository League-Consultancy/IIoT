import mongoose, { Schema, Model } from 'mongoose';
import { IDeviceSession } from '../types/index.js';

const deviceSessionSchema = new Schema<IDeviceSession>(
    {
        tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
        factory_id: { type: Schema.Types.ObjectId, ref: 'Factory', required: true },
        device_id: { type: String, required: true },
        start_time: { type: Date, required: true },
        stop_time: { type: Date, required: true },
        duration_ms: { type: Number, required: true },
        ingested_at: { type: Date, default: Date.now },
    },
    {
        // No timestamps - we use ingested_at for tracking
        timestamps: false,
        // Explicitly disable versionKey for immutable data
        versionKey: false,
    }
);

// CRITICAL: Unique compound index for idempotency
// This ensures duplicate session payloads don't create duplicate records
deviceSessionSchema.index(
    { device_id: 1, start_time: 1, stop_time: 1 },
    { unique: true }
);

// Query indexes for analytics
deviceSessionSchema.index({ tenant_id: 1, device_id: 1, start_time: -1 });
deviceSessionSchema.index({ tenant_id: 1, factory_id: 1, start_time: -1 });
deviceSessionSchema.index({ tenant_id: 1, start_time: -1 });

// Validation: start_time must be before stop_time
deviceSessionSchema.pre('save', function (next) {
    if (this.start_time >= this.stop_time) {
        const error = new Error('start_time must be before stop_time');
        next(error);
    } else {
        next();
    }
});

export const DeviceSession: Model<IDeviceSession> = mongoose.model<IDeviceSession>(
    'DeviceSession',
    deviceSessionSchema
);
