import mongoose, { Schema, Model } from 'mongoose';
import { IFactory } from '../types/index.js';

const factorySchema = new Schema<IFactory>(
    {
        tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        name: { type: String, required: true, trim: true },
        location: { type: String, required: true, trim: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
    }
);

// Indexes
factorySchema.index({ tenant_id: 1, name: 1 });

export const Factory: Model<IFactory> = mongoose.model<IFactory>('Factory', factorySchema);
