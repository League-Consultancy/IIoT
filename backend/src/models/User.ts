import mongoose, { Schema, Model } from 'mongoose';
import { IUser, UserRole } from '../types/index.js';

const userSchema = new Schema<IUser>(
    {
        tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        password_hash: { type: String, required: true, select: false },
        name: { type: String, required: true, trim: true },
        role: {
            type: String,
            enum: ['user', 'programmer', 'admin'] as UserRole[],
            default: 'user',
            required: true
        },
        device_permissions: [{ type: Schema.Types.ObjectId, ref: 'Device' }],
        last_login: { type: Date },
        is_active: { type: Boolean, default: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Indexes - email must be unique per tenant
userSchema.index({ tenant_id: 1, email: 1 }, { unique: true });
userSchema.index({ tenant_id: 1, role: 1 });
userSchema.index({ tenant_id: 1, is_active: 1 });

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
