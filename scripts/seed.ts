/**
 * FlexiWell CRM - Database Seed Script
 *
 * Run with: npx ts-node --esm scripts/seed.ts
 * Or add to package.json: "seed": "ts-node --esm scripts/seed.ts"
 *
 * This script populates the MongoDB database with initial data for testing.
 */

import { MongoClient, ObjectId } from "mongodb";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/flexiwell";

// Helper to hash passwords
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Seed data
const seedData = {
  // Admin user (password: admin123)
  users: [
    {
      _id: new ObjectId(),
      email: "admin@flexiwell.com",
      name: "Admin FlexiWell",
      role: "admin",
      phone: "(11) 99999-0000",
      status: "active",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      email: "teacher@flexiwell.com",
      name: "Maria Silva",
      role: "teacher",
      phone: "(11) 99999-1111",
      status: "active",
      isActive: true,
      specialties: ["Pilates", "Yoga"],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      email: "olivia@email.com",
      name: "Olivia Rhye",
      role: "client",
      phone: "(11) 98888-1111",
      status: "active",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],

  // Staff members
  staff: [
    {
      _id: new ObjectId(),
      name: "Maria Silva",
      email: "maria@flexiwell.com",
      phone: "(11) 99999-1111",
      role: "teacher",
      specialties: ["Pilates", "Yoga", "Stretching"],
      status: "active",
      unit: "FlexiWell Centro",
      rating: 4.9,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: "João Costa",
      email: "joao@flexiwell.com",
      phone: "(11) 99999-2222",
      role: "teacher",
      specialties: ["Functional", "Core"],
      status: "active",
      unit: "FlexiWell Centro",
      rating: 4.7,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: "Ana Paula",
      email: "ana@flexiwell.com",
      phone: "(11) 99999-3333",
      role: "receptionist",
      status: "active",
      unit: "FlexiWell Centro",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],

  // Clients
  clients: [
    {
      _id: new ObjectId(),
      name: "Olivia Rhye",
      email: "olivia@email.com",
      phone: "(11) 98888-1111",
      status: "active",
      plan: "Monthly - 8 classes",
      unit: "FlexiWell Centro",
      instructor: "Maria Silva",
      classesRemaining: 5,
      classesTotal: 8,
      revenue: 299,
      lastActivity: "Today",
      joinedDate: "Jan 2024",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: "Phoenix Baker",
      email: "phoenix@email.com",
      phone: "(11) 98888-2222",
      status: "active",
      plan: "Quarterly - 24 classes",
      unit: "FlexiWell Centro",
      instructor: "João Costa",
      classesRemaining: 18,
      classesTotal: 24,
      revenue: 799,
      lastActivity: "Yesterday",
      joinedDate: "Nov 2023",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: "Lana Steiner",
      email: "lana@email.com",
      phone: "(11) 98888-3333",
      status: "expired",
      plan: "Monthly - 8 classes",
      unit: "FlexiWell Jardins",
      classesRemaining: 0,
      classesTotal: 8,
      revenue: 299,
      lastActivity: "15 days ago",
      joinedDate: "Dec 2023",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: "Demi Wilkinson",
      email: "demi@email.com",
      phone: "(11) 98888-4444",
      status: "pending",
      plan: "Monthly - 12 classes",
      unit: "FlexiWell Centro",
      classesRemaining: 12,
      classesTotal: 12,
      revenue: 0,
      joinedDate: "Today",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: "Candice Wu",
      email: "candice@email.com",
      phone: "(11) 98888-5555",
      status: "active",
      plan: "Semi-annual - 48 classes",
      unit: "FlexiWell Jardins",
      instructor: "Maria Silva",
      classesRemaining: 32,
      classesTotal: 48,
      revenue: 1499,
      lastActivity: "2 hours ago",
      joinedDate: "Sep 2023",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],

  // Classes
  classes: [
    {
      _id: new ObjectId(),
      title: "Morning Yoga",
      type: "yoga",
      description: "Start your day with energizing yoga flow",
      instructor: { name: "Maria Silva" },
      schedule: {
        dayOfWeek: 1, // Monday
        startTime: "07:00",
        endTime: "08:00",
        recurring: true,
      },
      duration: 60,
      capacity: 15,
      enrolled: 12,
      waitlist: 2,
      room: "Studio A",
      status: "scheduled",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      title: "Pilates Reformer",
      type: "pilates",
      description: "Full body workout on reformer machines",
      instructor: { name: "Maria Silva" },
      schedule: {
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:00",
        recurring: true,
      },
      duration: 60,
      capacity: 8,
      enrolled: 8,
      waitlist: 3,
      room: "Reformer Room",
      status: "scheduled",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      title: "Core Training",
      type: "other",
      description: "Intensive core strengthening workout",
      instructor: { name: "João Costa" },
      schedule: {
        dayOfWeek: 2,
        startTime: "11:00",
        endTime: "12:00",
        recurring: true,
      },
      duration: 60,
      capacity: 15,
      enrolled: 10,
      waitlist: 0,
      room: "Studio A",
      status: "scheduled",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      title: "Evening Stretch",
      type: "stretching",
      description: "Relaxing stretching session to end your day",
      instructor: { name: "Maria Silva" },
      schedule: {
        dayOfWeek: 3,
        startTime: "18:00",
        endTime: "19:00",
        recurring: true,
      },
      duration: 60,
      capacity: 20,
      enrolled: 15,
      waitlist: 0,
      room: "Main Hall",
      status: "scheduled",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],

  // Units/Locations
  units: [
    {
      _id: new ObjectId(),
      name: "FlexiWell Centro",
      address: "Rua Augusta, 1234 - Centro, São Paulo",
      phone: "(11) 3333-1111",
      email: "centro@flexiwell.com",
      status: "active",
      rooms: ["Studio A", "Studio B", "Reformer Room", "Main Hall"],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: "FlexiWell Jardins",
      address: "Alameda Santos, 567 - Jardins, São Paulo",
      phone: "(11) 3333-2222",
      email: "jardins@flexiwell.com",
      status: "active",
      rooms: ["Studio A", "Studio B", "Reformer Room"],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};

async function seed() {
  console.log("🌱 Starting database seed...\n");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db();

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("🗑️  Clearing existing data...");
    await db.collection("users").deleteMany({});
    await db.collection("staff").deleteMany({});
    await db.collection("clients").deleteMany({});
    await db.collection("classes").deleteMany({});
    await db.collection("units").deleteMany({});
    console.log("✅ Existing data cleared\n");

    // Hash passwords for users
    console.log("🔐 Creating users...");
    const usersWithPasswords = await Promise.all(
      seedData.users.map(async (user) => ({
        ...user,
        password: await hashPassword("password123"),
      }))
    );
    await db.collection("users").insertMany(usersWithPasswords);
    console.log(`   ✅ Created ${usersWithPasswords.length} users`);

    // Insert staff
    console.log("👥 Creating staff...");
    await db.collection("staff").insertMany(seedData.staff);
    console.log(`   ✅ Created ${seedData.staff.length} staff members`);

    // Insert clients
    console.log("🧘 Creating clients...");
    await db.collection("clients").insertMany(seedData.clients);
    console.log(`   ✅ Created ${seedData.clients.length} clients`);

    // Insert classes
    console.log("📅 Creating classes...");
    await db.collection("classes").insertMany(seedData.classes);
    console.log(`   ✅ Created ${seedData.classes.length} classes`);

    // Insert units
    console.log("🏢 Creating units...");
    await db.collection("units").insertMany(seedData.units);
    console.log(`   ✅ Created ${seedData.units.length} units`);

    // Create indexes
    console.log("\n📇 Creating indexes...");
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("staff").createIndex({ email: 1 }, { unique: true });
    await db.collection("clients").createIndex({ email: 1 }, { unique: true });
    await db.collection("clients").createIndex({ status: 1 });
    await db.collection("classes").createIndex({ "schedule.dayOfWeek": 1 });
    console.log("   ✅ Indexes created\n");

    console.log("========================================");
    console.log("🎉 Database seed completed successfully!");
    console.log("========================================\n");
    console.log("📝 Test credentials:");
    console.log("   Admin: admin@flexiwell.com / password123");
    console.log("   Teacher: teacher@flexiwell.com / password123");
    console.log("");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run seed
seed();
