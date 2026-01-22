import mongoose, { Schema, Model } from 'mongoose';

export interface IDevice {
    _id: mongoose.Types.ObjectId;
    tenant_id: mongoose.Types.ObjectId;
    factory_id: mongoose.Types.ObjectId;
    device_id: string;
    name: string;
    firmware_version?: string;
    registered_at: Date;
    metadata?: Record<string, unknown>;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

const deviceSchema = new Schema<IDevice>(
    {
        tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        factory_id: { type: Schema.Types.ObjectId, ref: 'Factory', required: true, index: true },
        device_id: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true },
        firmware_version: { type: String, trim: true },
        registered_at: { type: Date, default: Date.now },
        metadata: { type: Schema.Types.Mixed },
        is_active: { type: Boolean, default: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

deviceSchema.index({ tenant_id: 1, device_id: 1 }, { unique: true });
deviceSchema.index({ tenant_id: 1, factory_id: 1 });
deviceSchema.index({ tenant_id: 1, is_active: 1 });

export const Device: Model<IDevice> = mongoose.models.Device || mongoose.model<IDevice>('Device', deviceSchema);
