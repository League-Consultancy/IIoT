import mongoose, { Schema, Model } from 'mongoose';

export interface IDeviceSession {
    _id: mongoose.Types.ObjectId;
    tenant_id: mongoose.Types.ObjectId;
    factory_id: mongoose.Types.ObjectId;
    device_id: string;
    start_time: Date;
    stop_time: Date;
    duration_ms: number;
    ingested_at: Date;
}

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
        timestamps: false,
        versionKey: false,
    }
);

// Unique compound index for idempotency
deviceSessionSchema.index(
    { device_id: 1, start_time: 1, stop_time: 1 },
    { unique: true }
);

deviceSessionSchema.index({ tenant_id: 1, device_id: 1, start_time: -1 });
deviceSessionSchema.index({ tenant_id: 1, factory_id: 1, start_time: -1 });
deviceSessionSchema.index({ tenant_id: 1, start_time: -1 });

export const DeviceSession: Model<IDeviceSession> = mongoose.models.DeviceSession || mongoose.model<IDeviceSession>('DeviceSession', deviceSessionSchema);
