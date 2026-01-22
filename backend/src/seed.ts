import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase } from './config/database.js';
import { Tenant, Factory, Device, User } from './models/index.js';

async function seed(): Promise<void> {
    console.log('🌱 Starting database seed...');

    await connectDatabase();

    // Clear existing data (for development only!)
    console.log('Clearing existing data...');
    await Promise.all([
        Tenant.deleteMany({}),
        Factory.deleteMany({}),
        Device.deleteMany({}),
        User.deleteMany({}),
    ]);

    // Create tenant
    console.log('Creating tenant...');
    const tenant = await Tenant.create({
        name: 'Demo Enterprise',
        slug: 'demo',
        theme: {
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF',
            companyName: 'Demo Enterprise',
        },
        is_active: true,
    });

    // Create factories
    console.log('Creating factories...');
    const factory1 = await Factory.create({
        tenant_id: tenant._id,
        name: 'Main Factory',
        location: 'New York, USA',
    });

    const factory2 = await Factory.create({
        tenant_id: tenant._id,
        name: 'Secondary Factory',
        location: 'Chicago, USA',
    });

    // Create devices
    console.log('Creating devices...');
    const devices = await Device.insertMany([
        {
            tenant_id: tenant._id,
            factory_id: factory1._id,
            device_id: 'DEVICE-001',
            name: 'CNC Machine Alpha',
            firmware_version: '1.0.0',
            is_active: true,
        },
        {
            tenant_id: tenant._id,
            factory_id: factory1._id,
            device_id: 'DEVICE-002',
            name: 'Welding Robot Beta',
            firmware_version: '1.0.0',
            is_active: true,
        },
        {
            tenant_id: tenant._id,
            factory_id: factory2._id,
            device_id: 'DEVICE-003',
            name: 'Assembly Line Controller',
            firmware_version: '1.0.0',
            is_active: true,
        },
    ]);

    // Create users
    console.log('Creating users...');
    const passwordHash = await bcrypt.hash('password123', 12);

    await User.insertMany([
        {
            tenant_id: tenant._id,
            email: 'admin@demo.com',
            password_hash: passwordHash,
            name: 'Admin User',
            role: 'admin',
            device_permissions: devices.map(d => d._id),
            is_active: true,
        },
        {
            tenant_id: tenant._id,
            email: 'programmer@demo.com',
            password_hash: passwordHash,
            name: 'Programmer User',
            role: 'programmer',
            device_permissions: devices.map(d => d._id),
            is_active: true,
        },
        {
            tenant_id: tenant._id,
            email: 'user@demo.com',
            password_hash: passwordHash,
            name: 'Regular User',
            role: 'user',
            device_permissions: [devices[0]!._id], // Only access to first device
            is_active: true,
        },
    ]);

    console.log('✅ Seed completed successfully!');
    console.log('');
    console.log('Test credentials:');
    console.log('  Admin: admin@demo.com / password123');
    console.log('  Programmer: programmer@demo.com / password123');
    console.log('  User: user@demo.com / password123');
    console.log('');
    console.log('Tenant slug: demo');

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
});
