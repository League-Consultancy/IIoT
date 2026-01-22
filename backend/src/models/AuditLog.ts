import mongoose, { Schema, Model } from 'mongoose';
import { IAuditLog } from '../types/index.js';

const auditLogSchema = new Schema<IAuditLog>(
    {
        tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
        actor_id: { type: Schema.Types.ObjectId, required: true },
        actor_type: {
            type: String,
            enum: ['user', 'device', 'system'],
            required: true
        },
        action: { type: String, required: true, index: true },
        resource_type: { type: String, required: true },
        resource_id: { type: String, required: true },
        details: { type: Schema.Types.Mixed },
        ip_address: { type: String },
        user_agent: { type: String },
        timestamp: { type: Date, default: Date.now, required: true },
    },
    {
        timestamps: false,
        versionKey: false,
        // Make the collection immutable at the application level
        strict: true,
    }
);

// Indexes for audit log queries
auditLogSchema.index({ tenant_id: 1, timestamp: -1 });
auditLogSchema.index({ tenant_id: 1, actor_id: 1, timestamp: -1 });
auditLogSchema.index({ tenant_id: 1, resource_type: 1, resource_id: 1, timestamp: -1 });
auditLogSchema.index({ tenant_id: 1, action: 1, timestamp: -1 });

// Prevent updates and deletes at application level
auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function () {
    throw new Error('Audit logs are immutable and cannot be modified');
});

auditLogSchema.pre(['deleteOne', 'deleteMany', 'findOneAndDelete'], function () {
    throw new Error('Audit logs are immutable and cannot be deleted');
});

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
