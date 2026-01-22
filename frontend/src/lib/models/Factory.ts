import mongoose, { Schema, Model } from 'mongoose';

export interface IFactory {
    _id: mongoose.Types.ObjectId;
    tenant_id: mongoose.Types.ObjectId;
    name: string;
    location: string;
    created_at: Date;
}

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

factorySchema.index({ tenant_id: 1, name: 1 });

export const Factory: Model<IFactory> = mongoose.models.Factory || mongoose.model<IFactory>('Factory', factorySchema);
