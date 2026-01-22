// Database seeding script with Machine Sessions
// Run with: npm run seed:db
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Device } from './models/Device';
import { Factory } from './models/Factory';
import { MachineSession } from './models/MachineSession';
import { User } from './models/User';

dotenv.config({ path: '.env.local' });

const MONGO_URI = process.env.MONGO_URL;

if (!MONGO_URI) {
    console.error('ERROR: MONGO_URL is not defined in environment variables.');
    process.exit(1);
}

const factories = [
    {
        tenantId: 't_tesla',
        name: 'Austin Giga (Alpha)',
        timezone: 'America/Chicago',
        location: 'Austin, TX, USA',
        image: 'https://images.unsplash.com/photo-1565514020176-88863c1a32a6?auto=format&fit=crop&q=80&w=1000'
    }
];

const devices = [
    {
        serialNumber: 'SN-ESP32-9901',
        name: 'CNC Milling Unit A',
        status: 'ONLINE',
        firmwareVersion: '1.2.4',
        lastSeen: new Date(),
        totalRunningHours: 0,
        metadata: { model: 'Haas VF-2' }
    }
];

// Generate sample machine sessions for the past 2 days
function generateSessions(deviceId: string, factoryId: string, tenantId: string) {
    const sessions = [];
    const now = new Date();

    // Just 3 sessions total
    const sessionConfigs = [
        { hoursAgo: 48, durationMin: 120 },
        { hoursAgo: 24, durationMin: 90 },
        { hoursAgo: 2, durationMin: 45 }
    ];

    for (const config of sessionConfigs) {
        const startTime = new Date(now.getTime() - config.hoursAgo * 60 * 60 * 1000);
        const duration = config.durationMin * 60;
        const stopTime = new Date(startTime.getTime() + duration * 1000);

        sessions.push({
            deviceId,
            factoryId,
            tenantId,
            startTime,
            stopTime,
            duration
        });
    }

    return sessions;
}

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected!');

        // Clear existing data
        console.log('Clearing existing data...');
        await Factory.deleteMany({});
        await Device.deleteMany({});
        await MachineSession.deleteMany({});
        await User.deleteMany({});

        // Insert default user
        console.log('Inserting default user...');
        const adminUser = await User.create({
            email: 'admin@tesla.com',
            password: 'password123',
            name: 'Admin User',
            role: 'ADMIN',
            tenantId: 't_tesla'
        });
        console.log(`Inserted admin user: ${adminUser.email}`);

        // Insert factories
        console.log('Inserting factories...');
        const insertedFactories = await Factory.insertMany(factories);
        console.log(`Inserted ${insertedFactories.length} factories`);

        // Insert devices with factory IDs
        console.log('Inserting devices...');
        const devicesWithFactories = devices.map((device, index) => ({
            ...device,
            factoryId: insertedFactories[index % 2]._id.toString(),
            tenantId: 't_tesla'
        }));

        const insertedDevices = await Device.insertMany(devicesWithFactories);
        console.log(`Inserted ${insertedDevices.length} devices`);

        // Generate and insert machine sessions
        console.log('Generating machine sessions...');
        let allSessions: any[] = [];
        let totalRunningHours: { [key: string]: number } = {};

        for (const device of insertedDevices) {
            const sessions = generateSessions(
                device._id.toString(),
                device.factoryId,
                device.tenantId
            );
            allSessions = allSessions.concat(sessions);

            // Calculate total running hours for this device
            const totalSeconds = sessions.reduce((sum, s) => sum + s.duration, 0);
            totalRunningHours[device._id.toString()] = totalSeconds / 3600;
        }

        await MachineSession.insertMany(allSessions);
        console.log(`Inserted ${allSessions.length} machine sessions`);

        // Update device total running hours
        console.log('Updating device running hours...');
        for (const [deviceId, hours] of Object.entries(totalRunningHours)) {
            await Device.findByIdAndUpdate(deviceId, { totalRunningHours: hours });
        }

        console.log('\n✅ Database seeded successfully!');
        console.log('\nAdmin User:');
        console.log(`  - Email: ${adminUser.email}`);
        console.log(`  - Password: password123`);
        console.log('\nFactories:');
        insertedFactories.forEach(f => console.log(`  - ${f.name} (ID: ${f._id})`));
        console.log('\nDevices:');
        insertedDevices.forEach(d => console.log(`  - ${d.name} (Serial: ${d.serialNumber}, ID: ${d._id})`));
        console.log(`\nTotal sessions: ${allSessions.length}`);

        console.log('\n📡 Sample API Request (from device):');
        console.log('POST /api/v1/ingest');
        console.log('Content-Type: application/json');
        console.log(JSON.stringify({
            deviceId: insertedDevices[0]._id.toString(),
            startTime: new Date().toISOString(),
            stopTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
            duration: 3600 // optional, in seconds
        }, null, 2));

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

seed();
