import mongoose, { Schema, Model } from 'mongoose';
import { IExportJob } from '../types/index.js';

const exportJobSchema = new Schema<IExportJob>(
    {
        tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
        user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        device_id: { type: String, required: true },
        format: {
            type: String,
            enum: ['csv', 'xlsx', 'json'],
            required: true
        },
        date_from: { type: Date, required: true },
        date_to: { type: Date, required: true },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending',
            required: true
        },
        file_path: { type: String },
        file_size: { type: Number },
        record_count: { type: Number },
        error_message: { type: String },
        created_at: { type: Date, default: Date.now },
        completed_at: { type: Date },
        expires_at: { type: Date },
    },
    {
        timestamps: false,
        versionKey: false,
    }
);

// Indexes
exportJobSchema.index({ tenant_id: 1, user_id: 1, created_at: -1 });
exportJobSchema.index({ tenant_id: 1, status: 1 });
exportJobSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const ExportJob: Model<IExportJob> = mongoose.model<IExportJob>('ExportJob', exportJobSchema);
