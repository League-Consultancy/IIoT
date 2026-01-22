import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
    serialNumber: string;
    factoryId: string;
    tenantId: string;
    name: string;
    firmwareVersion: string;
    lastSeen: Date;
    totalRunningHours: number;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>({
    serialNumber: { type: String, required: true, unique: true },
    factoryId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    firmwareVersion: { type: String, required: true },
    lastSeen: { type: Date, default: Date.now },
    totalRunningHours: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} }
}, {
    timestamps: true
});

// Compound index for tenant + factory queries
DeviceSchema.index({ tenantId: 1, factoryId: 1 });

// Check if model exists before creating (prevents hot reload errors)
export const Device = mongoose.models.Device || mongoose.model<IDevice>('Device', DeviceSchema);

