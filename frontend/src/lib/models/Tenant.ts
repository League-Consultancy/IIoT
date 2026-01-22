import mongoose, { Schema, Model } from 'mongoose';

// Tenant theme configuration
export interface TenantTheme {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
    faviconUrl?: string;
    companyName: string;
}

export interface ITenant {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    theme: TenantTheme;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

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

tenantSchema.index({ is_active: 1 });

export const Tenant: Model<ITenant> = mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', tenantSchema);
