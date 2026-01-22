import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { Tenant, Factory, Device, User } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        // Check if we should allow seeding (simple protection: only if no tenants exist)
        const existingTenant = await Tenant.findOne({});
        if (existingTenant) {
            // Allow force seed with query param ?force=true
            const { searchParams } = new URL(request.url);
            if (searchParams.get('force') !== 'true') {
                return NextResponse.json({
                    success: false,
                    message: 'Database already seeded. Use ?force=true to wipe and re-seed.'
                }, { status: 400 });
            }
        }

        // Clear existing data
        await Promise.all([
            Tenant.deleteMany({}),
            Factory.deleteMany({}),
            Device.deleteMany({}),
            User.deleteMany({}),
        ]);

        // Create tenant
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
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                tenant_id: tenant._id,
                email: 'programmer@demo.com',
                password_hash: passwordHash,
                name: 'Programmer User',
                role: 'programmer',
                device_permissions: devices.map(d => d._id),
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                tenant_id: tenant._id,
                email: 'user@demo.com',
                password_hash: passwordHash,
                name: 'Regular User',
                role: 'user',
                device_permissions: [devices[0]._id],
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
        ]);

        return NextResponse.json({
            success: true,
            message: 'Database seeded successfully!',
            credentials: {
                admin: 'admin@demo.com / password123',
                user: 'user@demo.com / password123'
            }
        });

    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json(
            { success: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}
