import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    email: string;
    password: string;
    name: string;
    role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
    tenantId: string;
    factoryIds: string[];
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['ADMIN', 'OPERATOR', 'VIEWER'],
        default: 'OPERATOR'
    },
    tenantId: {
        type: String,
        required: true,
        default: 't_default'
    },
    factoryIds: [{
        type: String
    }]
}, {
    timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Index for faster lookups (email index is automatic from unique:true)
UserSchema.index({ tenantId: 1 });

// Check if model exists before creating (prevents hot reload errors)
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

