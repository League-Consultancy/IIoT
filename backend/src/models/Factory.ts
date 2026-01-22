import mongoose, { Schema, Document } from 'mongoose';

export interface IFactory extends Document {
    tenantId: string;
    name: string;
    timezone: string;
    location: string;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
}

const FactorySchema = new Schema<IFactory>({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    timezone: { type: String, required: true, default: 'UTC' },
    location: { type: String, required: true },
    image: { type: String }
}, {
    timestamps: true
});

// Check if model exists before creating (prevents hot reload errors)
export const Factory = mongoose.models.Factory || mongoose.model<IFactory>('Factory', FactorySchema);

