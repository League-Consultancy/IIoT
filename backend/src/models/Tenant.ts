import mongoose, { Schema, Model } from 'mongoose';
import { ITenant, TenantTheme } from '../types/index.js';

const themeSchema = new Schema<TenantTheme>(
    {
        primaryColor: { type: String, required: true, default: '#3B82F6' },
        secondaryColor: { type: String, required: true, default: '#1E40AF' },
        logoUrl: { type: String },
        faviconUrl: { type: String },
        companyName: { type: String, required: true },
    },
    { _id: false }
);

const tenantSchema = new Schema<ITenant>(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        theme: { type: themeSchema, required: true },
        is_active: { type: Boolean, default: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Indexes
tenantSchema.index({ slug: 1 }, { unique: true });
tenantSchema.index({ is_active: 1 });

export const Tenant: Model<ITenant> = mongoose.model<ITenant>('Tenant', tenantSchema);
