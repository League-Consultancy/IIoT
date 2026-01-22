import mongoose, { Schema, Document } from 'mongoose';

export interface IMachineSession extends Document {
    deviceId: string;
    factoryId: string;
    tenantId: string;
    startTime: Date;
    stopTime: Date;
    duration: number; // in seconds
    createdAt: Date;
}

const MachineSessionSchema = new Schema<IMachineSession>({
    deviceId: { type: String, required: true, index: true },
    factoryId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    startTime: { type: Date, required: true },
    stopTime: { type: Date, required: true },
    duration: { type: Number, required: true }, // in seconds
}, {
    timestamps: true
});

// Compound indexes for efficient queries
MachineSessionSchema.index({ deviceId: 1, startTime: -1 });
MachineSessionSchema.index({ factoryId: 1, startTime: -1 });
MachineSessionSchema.index({ tenantId: 1, deviceId: 1, startTime: -1 });

// Check if model exists before creating (prevents hot reload errors)
export const MachineSession = mongoose.models.MachineSession || mongoose.model<IMachineSession>('MachineSession', MachineSessionSchema);

