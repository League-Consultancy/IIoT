import mongoose, { Schema, Document } from 'mongoose';

export interface IMeasurement extends Document {
  metadata: {
    deviceId: string;
    factoryId: string;
    tenantId: string;
    type: 'STATE' | 'CURRENT' | 'RUNTIME';
  };
  timestamp: Date;
  value: number;
}

const MeasurementSchema = new Schema<IMeasurement>({
  timestamp: { type: Date, required: true },
  metadata: {
    deviceId: { type: String, required: true },
    factoryId: { type: String, required: true },
    tenantId: { type: String, required: true },
    type: { type: String, enum: ['STATE', 'CURRENT', 'RUNTIME'], required: true },
  },
  value: { type: Number, required: true }
}, {
  timeseries: {
    timeField: 'timestamp',
    metaField: 'metadata',
    granularity: 'seconds' // High precision for machine state
  },
  expireAfterSeconds: 157680000 // 5 years retention
});

// Compound index for efficient querying by device and time
MeasurementSchema.index({ 'metadata.deviceId': 1, timestamp: -1 });

// Check if model exists before creating (prevents hot reload errors)
export const Measurement = mongoose.models.Measurement || mongoose.model<IMeasurement>('Measurement', MeasurementSchema);