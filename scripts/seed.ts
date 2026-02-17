/**
 * FlexiWell CRM - Comprehensive Database Seed Script
 *
 * Run with: npx ts-node --esm scripts/seed.ts
 * Or add to package.json: "seed": "ts-node --esm scripts/seed.ts"
 *
 * This script populates the MongoDB database with comprehensive data
 * for testing all features across all user roles.
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

// Helper to generate random dates
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper to get date relative to today
function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function daysAgo(days: number): Date {
  return daysFromNow(-days);
}

// Generate IDs upfront for referential integrity
const ids = {
  // Users
  adminUser: new ObjectId(),
  teacher1User: new ObjectId(),
  teacher2User: new ObjectId(),
  teacher3User: new ObjectId(),
  client1User: new ObjectId(),
  client2User: new ObjectId(),
  client3User: new ObjectId(),
  client4User: new ObjectId(),
  client5User: new ObjectId(),
  client6User: new ObjectId(),
  client7User: new ObjectId(),
  client8User: new ObjectId(),
  client9User: new ObjectId(),
  client10User: new ObjectId(),
  client11User: new ObjectId(),
  client12User: new ObjectId(),

  // Staff
  staff1: new ObjectId(),
  staff2: new ObjectId(),
  staff3: new ObjectId(),
  adminStaff: new ObjectId(),

  // Clients
  client1: new ObjectId(),
  client2: new ObjectId(),
  client3: new ObjectId(),
  client4: new ObjectId(),
  client5: new ObjectId(),
  client6: new ObjectId(),
  client7: new ObjectId(),
  client8: new ObjectId(),
  client9: new ObjectId(),
  client10: new ObjectId(),
  client11: new ObjectId(),
  client12: new ObjectId(),

  // Units/Establishments
  unit1: new ObjectId(),
  unit2: new ObjectId(),

  // Rooms
  room1: new ObjectId(),
  room2: new ObjectId(),
  room3: new ObjectId(),
  room4: new ObjectId(),
  room5: new ObjectId(),

  // Classes (recurring templates)
  class1: new ObjectId(),
  class2: new ObjectId(),
  class3: new ObjectId(),
  class4: new ObjectId(),
  class5: new ObjectId(),
  class6: new ObjectId(),
  class7: new ObjectId(),
  class8: new ObjectId(),
};

// ============================================
// SEED DATA
// ============================================

const seedData = {
  // ============================================
  // USERS - All roles with linked accounts
  // ============================================
  users: [
    // ADMIN
    {
      _id: ids.adminUser,
      email: "admin@flexiwell.com",
      name: "Sarah Mitchell",
      role: "admin",
      phone: "(212) 555-0000",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      staffId: ids.adminStaff.toString(),
      isActive: true,
      lastLoginAt: new Date(),
      subscriptionStatus: "active",
      planTier: "business",
      stripeCustomerId: "cus_demo_admin",
      stripeSubscriptionId: "sub_demo_admin",
      trialStatus: "converted",
      createdAt: daysAgo(365),
      updatedAt: new Date(),
    },
    // TEACHERS
    {
      _id: ids.teacher1User,
      email: "emily@flexiwell.com",
      name: "Emily Johnson",
      role: "teacher",
      phone: "(212) 555-1111",
      avatar: "https://randomuser.me/api/portraits/women/32.jpg",
      staffId: ids.staff1.toString(),
      isActive: true,
      lastLoginAt: daysAgo(1),
      createdAt: daysAgo(300),
      updatedAt: new Date(),
    },
    {
      _id: ids.teacher2User,
      email: "james@flexiwell.com",
      name: "James Cooper",
      role: "teacher",
      phone: "(212) 555-2222",
      avatar: "https://randomuser.me/api/portraits/men/35.jpg",
      staffId: ids.staff2.toString(),
      isActive: true,
      lastLoginAt: daysAgo(2),
      createdAt: daysAgo(250),
      updatedAt: new Date(),
    },
    {
      _id: ids.teacher3User,
      email: "rachel@flexiwell.com",
      name: "Rachel Adams",
      role: "teacher",
      phone: "(212) 555-3333",
      avatar: "https://randomuser.me/api/portraits/women/28.jpg",
      staffId: ids.staff3.toString(),
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: daysAgo(180),
      updatedAt: new Date(),
    },
    // CLIENTS
    {
      _id: ids.client1User,
      email: "olivia@email.com",
      name: "Olivia Rhye",
      role: "client",
      phone: "(11) 98888-1111",
      avatar: "https://randomuser.me/api/portraits/women/1.jpg",
      clientId: ids.client1.toString(),
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: daysAgo(120),
      updatedAt: new Date(),
    },
    {
      _id: ids.client2User,
      email: "phoenix@email.com",
      name: "Phoenix Baker",
      role: "client",
      phone: "(11) 98888-2222",
      avatar: "https://randomuser.me/api/portraits/men/2.jpg",
      clientId: ids.client2.toString(),
      isActive: true,
      lastLoginAt: daysAgo(1),
      createdAt: daysAgo(200),
      updatedAt: new Date(),
    },
    {
      _id: ids.client3User,
      email: "lana@email.com",
      name: "Lana Steiner",
      role: "client",
      phone: "(11) 98888-3333",
      avatar: "https://randomuser.me/api/portraits/women/3.jpg",
      clientId: ids.client3.toString(),
      isActive: true,
      lastLoginAt: daysAgo(15),
      createdAt: daysAgo(90),
      updatedAt: new Date(),
    },
    {
      _id: ids.client4User,
      email: "demi@email.com",
      name: "Demi Wilkinson",
      role: "client",
      phone: "(11) 98888-4444",
      avatar: "https://randomuser.me/api/portraits/women/4.jpg",
      clientId: ids.client4.toString(),
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: daysAgo(7),
      updatedAt: new Date(),
    },
    {
      _id: ids.client5User,
      email: "candice@email.com",
      name: "Candice Wu",
      role: "client",
      phone: "(11) 98888-5555",
      avatar: "https://randomuser.me/api/portraits/women/5.jpg",
      clientId: ids.client5.toString(),
      isActive: true,
      lastLoginAt: daysAgo(1),
      createdAt: daysAgo(180),
      updatedAt: new Date(),
    },
    {
      _id: ids.client6User,
      email: "natali@email.com",
      name: "Natali Craig",
      role: "client",
      phone: "(11) 98888-6666",
      avatar: "https://randomuser.me/api/portraits/women/6.jpg",
      clientId: ids.client6.toString(),
      isActive: true,
      lastLoginAt: daysAgo(3),
      createdAt: daysAgo(150),
      updatedAt: new Date(),
    },
    {
      _id: ids.client7User,
      email: "drew@email.com",
      name: "Drew Cano",
      role: "client",
      phone: "(11) 98888-7777",
      avatar: "https://randomuser.me/api/portraits/men/7.jpg",
      clientId: ids.client7.toString(),
      isActive: true,
      lastLoginAt: daysAgo(5),
      createdAt: daysAgo(100),
      updatedAt: new Date(),
    },
    {
      _id: ids.client8User,
      email: "orlando@email.com",
      name: "Orlando Diggs",
      role: "client",
      phone: "(11) 98888-8888",
      avatar: "https://randomuser.me/api/portraits/men/8.jpg",
      clientId: ids.client8.toString(),
      isActive: true,
      lastLoginAt: daysAgo(10),
      createdAt: daysAgo(60),
      updatedAt: new Date(),
    },
    {
      _id: ids.client9User,
      email: "andi@email.com",
      name: "Andi Lane",
      role: "client",
      phone: "(11) 98888-9999",
      avatar: "https://randomuser.me/api/portraits/women/9.jpg",
      clientId: ids.client9.toString(),
      isActive: true,
      lastLoginAt: daysAgo(2),
      createdAt: daysAgo(45),
      updatedAt: new Date(),
    },
    {
      _id: ids.client10User,
      email: "kate@email.com",
      name: "Kate Morrison",
      role: "client",
      phone: "(11) 98889-0000",
      avatar: "https://randomuser.me/api/portraits/women/10.jpg",
      clientId: ids.client10.toString(),
      isActive: true,
      lastLoginAt: daysAgo(1),
      createdAt: daysAgo(30),
      updatedAt: new Date(),
    },
    {
      _id: ids.client11User,
      email: "koray@email.com",
      name: "Koray Okumus",
      role: "client",
      phone: "(11) 98889-1111",
      avatar: "https://randomuser.me/api/portraits/men/11.jpg",
      clientId: ids.client11.toString(),
      isActive: true,
      lastLoginAt: daysAgo(7),
      createdAt: daysAgo(20),
      updatedAt: new Date(),
    },
    {
      _id: ids.client12User,
      email: "amelie@email.com",
      name: "Amélie Laurent",
      role: "client",
      phone: "(11) 98889-2222",
      avatar: "https://randomuser.me/api/portraits/women/12.jpg",
      clientId: ids.client12.toString(),
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: daysAgo(14),
      updatedAt: new Date(),
    },
  ],

  // ============================================
  // STAFF MEMBERS
  // ============================================
  staff: [
    {
      _id: ids.adminStaff,
      name: "Sarah Mitchell",
      email: "admin@flexiwell.com",
      phone: "(212) 555-0000",
      role: "admin",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      bio: "Founder and administrator of FlexiWell Studio. Passionate about wellness and health.",
      status: "active",
      createdAt: daysAgo(365),
      updatedAt: new Date(),
    },
    {
      _id: ids.staff1,
      name: "Emily Johnson",
      email: "emily@flexiwell.com",
      phone: "(212) 555-1111",
      role: "teacher",
      avatar: "https://randomuser.me/api/portraits/women/32.jpg",
      bio: "Certified Pilates and Yoga instructor with over 10 years of experience. Specialized in rehabilitation and postural strengthening.",
      specialties: ["Pilates", "Yoga", "Stretching", "Meditation"],
      schedule: [
        { day: "monday", slots: [{ start: "07:00", end: "12:00" }, { start: "14:00", end: "19:00" }] },
        { day: "tuesday", slots: [{ start: "07:00", end: "12:00" }] },
        { day: "wednesday", slots: [{ start: "07:00", end: "12:00" }, { start: "14:00", end: "19:00" }] },
        { day: "thursday", slots: [{ start: "14:00", end: "20:00" }] },
        { day: "friday", slots: [{ start: "07:00", end: "12:00" }] },
      ],
      status: "active",
      unit: "FlexiWell Downtown",
      establishmentId: ids.unit1.toString(),
      rating: {
        average: 4.8,
        totalReviews: 47,
        breakdown: { five: 38, four: 7, three: 2, two: 0, one: 0 },
      },
      createdAt: daysAgo(300),
      updatedAt: new Date(),
    },
    {
      _id: ids.staff2,
      name: "James Cooper",
      email: "james@flexiwell.com",
      phone: "(212) 555-2222",
      role: "teacher",
      avatar: "https://randomuser.me/api/portraits/men/35.jpg",
      bio: "Personal Trainer and Functional Training instructor. Specialist in physical conditioning and athletic preparation.",
      specialties: ["Functional", "Core", "HIIT", "Strength Training"],
      schedule: [
        { day: "monday", slots: [{ start: "06:00", end: "11:00" }, { start: "17:00", end: "21:00" }] },
        { day: "tuesday", slots: [{ start: "06:00", end: "11:00" }, { start: "17:00", end: "21:00" }] },
        { day: "wednesday", slots: [{ start: "17:00", end: "21:00" }] },
        { day: "thursday", slots: [{ start: "06:00", end: "11:00" }, { start: "17:00", end: "21:00" }] },
        { day: "friday", slots: [{ start: "06:00", end: "11:00" }] },
        { day: "saturday", slots: [{ start: "08:00", end: "12:00" }] },
      ],
      status: "active",
      unit: "FlexiWell Downtown",
      establishmentId: ids.unit1.toString(),
      rating: {
        average: 4.6,
        totalReviews: 32,
        breakdown: { five: 22, four: 8, three: 1, two: 1, one: 0 },
      },
      createdAt: daysAgo(250),
      updatedAt: new Date(),
    },
    {
      _id: ids.staff3,
      name: "Rachel Adams",
      email: "rachel@flexiwell.com",
      phone: "(212) 555-3333",
      role: "teacher",
      avatar: "https://randomuser.me/api/portraits/women/28.jpg",
      bio: "Yoga and Meditation teacher. Certified in Hatha Yoga and Mindfulness.",
      specialties: ["Yoga", "Meditation", "Breathwork", "Stretching"],
      schedule: [
        { day: "monday", slots: [{ start: "08:00", end: "12:00" }] },
        { day: "tuesday", slots: [{ start: "08:00", end: "12:00" }, { start: "18:00", end: "21:00" }] },
        { day: "wednesday", slots: [{ start: "08:00", end: "12:00" }] },
        { day: "thursday", slots: [{ start: "08:00", end: "12:00" }, { start: "18:00", end: "21:00" }] },
        { day: "friday", slots: [{ start: "08:00", end: "12:00" }] },
      ],
      status: "active",
      unit: "FlexiWell Midtown",
      establishmentId: ids.unit2.toString(),
      rating: {
        average: 4.9,
        totalReviews: 28,
        breakdown: { five: 26, four: 2, three: 0, two: 0, one: 0 },
      },
      createdAt: daysAgo(180),
      updatedAt: new Date(),
    },
  ],

  // ============================================
  // CLIENTS
  // ============================================
  clients: [
    {
      _id: ids.client1,
      name: "Olivia Rhye",
      email: "olivia@email.com",
      phone: "(11) 98888-1111",
      avatar: "https://randomuser.me/api/portraits/women/1.jpg",
      plan: {
        type: "monthly",
        totalClasses: 8,
        usedClasses: 3,
        remainingClasses: 5,
        startDate: daysAgo(15),
        endDate: daysFromNow(15),
        price: 299,
      },
      status: "active",
      preferences: {
        preferredInstructors: [ids.staff1.toString()],
        preferredClassTypes: ["pilates", "yoga"],
        notifications: { email: true, whatsapp: true, instagram: false, sms: false },
      },
      createdAt: daysAgo(120),
      updatedAt: new Date(),
    },
    {
      _id: ids.client2,
      name: "Phoenix Baker",
      email: "phoenix@email.com",
      phone: "(11) 98888-2222",
      avatar: "https://randomuser.me/api/portraits/men/2.jpg",
      plan: {
        type: "quarterly",
        totalClasses: 24,
        usedClasses: 6,
        remainingClasses: 18,
        startDate: daysAgo(30),
        endDate: daysFromNow(60),
        price: 799,
      },
      status: "active",
      preferences: {
        preferredInstructors: [ids.staff2.toString()],
        preferredClassTypes: ["other"],
        notifications: { email: true, whatsapp: true, instagram: false, sms: false },
      },
      createdAt: daysAgo(200),
      updatedAt: new Date(),
    },
    {
      _id: ids.client3,
      name: "Lana Steiner",
      email: "lana@email.com",
      phone: "(11) 98888-3333",
      avatar: "https://randomuser.me/api/portraits/women/3.jpg",
      plan: {
        type: "monthly",
        totalClasses: 8,
        usedClasses: 8,
        remainingClasses: 0,
        startDate: daysAgo(45),
        endDate: daysAgo(15),
        price: 299,
      },
      status: "inactive",
      preferences: {
        preferredClassTypes: ["yoga", "stretching"],
        notifications: { email: true, whatsapp: false, instagram: false, sms: false },
      },
      createdAt: daysAgo(90),
      updatedAt: new Date(),
    },
    {
      _id: ids.client4,
      name: "Demi Wilkinson",
      email: "demi@email.com",
      phone: "(11) 98888-4444",
      avatar: "https://randomuser.me/api/portraits/women/4.jpg",
      plan: {
        type: "monthly",
        totalClasses: 12,
        usedClasses: 0,
        remainingClasses: 12,
        startDate: new Date(),
        endDate: daysFromNow(30),
        price: 399,
      },
      status: "pending",
      preferences: {
        preferredClassTypes: ["pilates"],
        notifications: { email: true, whatsapp: true, instagram: true, sms: false },
      },
      createdAt: daysAgo(7),
      updatedAt: new Date(),
    },
    {
      _id: ids.client5,
      name: "Candice Wu",
      email: "candice@email.com",
      phone: "(11) 98888-5555",
      avatar: "https://randomuser.me/api/portraits/women/5.jpg",
      plan: {
        type: "annual",
        totalClasses: 96,
        usedClasses: 32,
        remainingClasses: 64,
        startDate: daysAgo(120),
        endDate: daysFromNow(245),
        price: 2499,
      },
      status: "active",
      preferences: {
        preferredInstructors: [ids.staff1.toString(), ids.staff3.toString()],
        preferredClassTypes: ["yoga", "meditation", "pilates"],
        notifications: { email: true, whatsapp: true, instagram: false, sms: false },
      },
      isWellhubMember: false,
      createdAt: daysAgo(180),
      updatedAt: new Date(),
    },
    {
      _id: ids.client6,
      name: "Natali Craig",
      email: "natali@email.com",
      phone: "(11) 98888-6666",
      avatar: "https://randomuser.me/api/portraits/women/6.jpg",
      plan: {
        type: "quarterly",
        totalClasses: 24,
        usedClasses: 18,
        remainingClasses: 6,
        startDate: daysAgo(75),
        endDate: daysFromNow(15),
        price: 799,
      },
      status: "active",
      preferences: {
        preferredInstructors: [ids.staff2.toString()],
        preferredClassTypes: ["other", "pilates"],
        notifications: { email: true, whatsapp: true, instagram: false, sms: false },
      },
      createdAt: daysAgo(150),
      updatedAt: new Date(),
    },
    {
      _id: ids.client7,
      name: "Drew Cano",
      email: "drew@email.com",
      phone: "(11) 98888-7777",
      avatar: "https://randomuser.me/api/portraits/men/7.jpg",
      plan: {
        type: "monthly",
        totalClasses: 8,
        usedClasses: 5,
        remainingClasses: 3,
        startDate: daysAgo(20),
        endDate: daysFromNow(10),
        price: 299,
      },
      status: "active",
      preferences: {
        preferredClassTypes: ["other", "stretching"],
        notifications: { email: true, whatsapp: true, instagram: false, sms: false },
      },
      createdAt: daysAgo(100),
      updatedAt: new Date(),
    },
    {
      _id: ids.client8,
      name: "Orlando Diggs",
      email: "orlando@email.com",
      phone: "(11) 98888-8888",
      avatar: "https://randomuser.me/api/portraits/men/8.jpg",
      plan: {
        type: "drop-in",
        totalClasses: 5,
        usedClasses: 3,
        remainingClasses: 2,
        startDate: daysAgo(30),
        endDate: daysFromNow(60),
        price: 175,
      },
      status: "active",
      preferences: {
        notifications: { email: true, whatsapp: false, instagram: false, sms: false },
      },
      createdAt: daysAgo(60),
      updatedAt: new Date(),
    },
    {
      _id: ids.client9,
      name: "Andi Lane",
      email: "andi@email.com",
      phone: "(11) 98888-9999",
      avatar: "https://randomuser.me/api/portraits/women/9.jpg",
      plan: {
        type: "monthly",
        totalClasses: 12,
        usedClasses: 4,
        remainingClasses: 8,
        startDate: daysAgo(10),
        endDate: daysFromNow(20),
        price: 399,
      },
      status: "active",
      preferences: {
        preferredInstructors: [ids.staff3.toString()],
        preferredClassTypes: ["yoga", "meditation"],
        notifications: { email: true, whatsapp: true, instagram: true, sms: false },
      },
      createdAt: daysAgo(45),
      updatedAt: new Date(),
    },
    {
      _id: ids.client10,
      name: "Kate Morrison",
      email: "kate@email.com",
      phone: "(11) 98889-0000",
      avatar: "https://randomuser.me/api/portraits/women/10.jpg",
      plan: {
        type: "quarterly",
        totalClasses: 24,
        usedClasses: 2,
        remainingClasses: 22,
        startDate: daysAgo(10),
        endDate: daysFromNow(80),
        price: 799,
      },
      status: "active",
      preferences: {
        preferredClassTypes: ["pilates", "stretching"],
        notifications: { email: true, whatsapp: true, instagram: false, sms: false },
      },
      createdAt: daysAgo(30),
      updatedAt: new Date(),
    },
    {
      _id: ids.client11,
      name: "Koray Okumus",
      email: "koray@email.com",
      phone: "(11) 98889-1111",
      avatar: "https://randomuser.me/api/portraits/men/11.jpg",
      plan: {
        type: "monthly",
        totalClasses: 8,
        usedClasses: 2,
        remainingClasses: 6,
        startDate: daysAgo(5),
        endDate: daysFromNow(25),
        price: 299,
      },
      status: "active",
      preferences: {
        preferredClassTypes: ["other"],
        notifications: { email: true, whatsapp: true, instagram: false, sms: false },
      },
      createdAt: daysAgo(20),
      updatedAt: new Date(),
    },
    {
      _id: ids.client12,
      name: "Amélie Laurent",
      email: "amelie@email.com",
      phone: "(11) 98889-2222",
      avatar: "https://randomuser.me/api/portraits/women/12.jpg",
      plan: {
        type: "monthly",
        totalClasses: 12,
        usedClasses: 1,
        remainingClasses: 11,
        startDate: daysAgo(3),
        endDate: daysFromNow(27),
        price: 399,
      },
      status: "active",
      preferences: {
        preferredInstructors: [ids.staff1.toString()],
        preferredClassTypes: ["pilates", "yoga"],
        notifications: { email: true, whatsapp: true, instagram: false, sms: false },
      },
      createdAt: daysAgo(14),
      updatedAt: new Date(),
    },
  ],

  // ============================================
  // ESTABLISHMENTS/UNITS
  // ============================================
  units: [
    {
      _id: ids.unit1,
      name: "FlexiWell Downtown",
      location: "Downtown, New York",
      address: "123 Broadway, Downtown, New York - NY, 10001",
      phone: "(212) 555-1111",
      assignedTeachers: [ids.staff1.toString(), ids.staff2.toString()],
      rooms: ["Studio A", "Studio B", "Reformer Room", "Meditation Room"],
      isActive: true,
      createdAt: daysAgo(365),
      updatedAt: new Date(),
    },
    {
      _id: ids.unit2,
      name: "FlexiWell Midtown",
      location: "Midtown, New York",
      address: "567 5th Avenue, Midtown, New York - NY, 10022",
      phone: "(212) 555-2222",
      assignedTeachers: [ids.staff3.toString()],
      rooms: ["Main Studio", "Zen Room", "Reformer Room"],
      isActive: true,
      createdAt: daysAgo(200),
      updatedAt: new Date(),
    },
  ],

  // ============================================
  // ROOMS
  // ============================================
  rooms: [
    {
      _id: ids.room1,
      name: "Studio A",
      establishmentId: ids.unit1.toString(),
      capacity: 15,
      equipment: ["Mats", "Yoga Blocks", "Resistance Bands"],
      isActive: true,
      createdAt: daysAgo(365),
      updatedAt: new Date(),
    },
    {
      _id: ids.room2,
      name: "Studio B",
      establishmentId: ids.unit1.toString(),
      capacity: 12,
      equipment: ["Mats", "Pilates Balls", "Foam Rollers"],
      isActive: true,
      createdAt: daysAgo(365),
      updatedAt: new Date(),
    },
    {
      _id: ids.room3,
      name: "Reformer Room",
      establishmentId: ids.unit1.toString(),
      capacity: 8,
      equipment: ["Reformer Allegro", "Cadillac", "Chair"],
      isActive: true,
      createdAt: daysAgo(365),
      updatedAt: new Date(),
    },
    {
      _id: ids.room4,
      name: "Main Studio",
      establishmentId: ids.unit2.toString(),
      capacity: 20,
      equipment: ["Mats", "Yoga Blocks", "Blankets", "Meditation Cushions"],
      isActive: true,
      createdAt: daysAgo(200),
      updatedAt: new Date(),
    },
    {
      _id: ids.room5,
      name: "Zen Room",
      establishmentId: ids.unit2.toString(),
      capacity: 10,
      equipment: ["Meditation Cushions", "Blankets", "Aromatherapy Diffuser"],
      isActive: true,
      createdAt: daysAgo(200),
      updatedAt: new Date(),
    },
  ],

  // ============================================
  // STUDIO SETTINGS
  // ============================================
  studioSettings: {
    general: {
      studioName: "FlexiWell Studio",
      email: "contact@flexiwell.com",
      phone: "(212) 555-0000",
      address: "123 Broadway, Downtown, New York - NY",
      timezone: "America/New_York",
      currency: "USD",
      language: "en-US",
      region: "US",
      businessType: "pilates",
    },
    branding: {
      primaryColor: "#6366f1",
    },
    notifications: {
      emailEnabled: true,
      whatsappEnabled: true,
      smsEnabled: false,
      primaryMessagingChannel: "whatsapp",
      messagingBotEnabled: true,
      reminderHours: 24,
      confirmationEmail: true,
      marketingEmails: false,
    },
    waitlist: {
      enabled: true,
      maxSize: 10,
      autoNotify: true,
      notificationWindowMinutes: 60,
      priorityByPlanType: true,
    },
    integrations: {
      stripeConnected: true,
      whatsappConnected: true,
      googleCalendarConnected: false,
      resendConnected: true,
    },
    createdAt: daysAgo(365),
    updatedAt: new Date(),
  },
};

// ============================================
// GENERATE DYNAMIC DATA
// ============================================

interface GeneratedClass {
  _id: ObjectId;
  title: string;
  type: string;
  description: string;
  instructorId: string;
  instructorName: string;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
  maxCapacity: number;
  currentEnrollment: number;
  enrolledClients: {
    clientId: string;
    clientName: string;
    status: string;
    enrolledAt: Date;
  }[];
  waitlist: {
    clientId: string;
    clientName: string;
    addedAt: Date;
  }[];
  status: string;
  location: string;
  establishmentId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface GeneratedPayment {
  _id: ObjectId;
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  type: string;
  planDetails: {
    type: string;
    classes: number;
    period: string;
  };
  status: string;
  paymentMethod: string;
  transactionId: string;
  createdAt: Date;
  paidAt: Date;
}

interface GeneratedReview {
  _id: ObjectId;
  staffId: string;
  staffName: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  status: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function generateClasses(): GeneratedClass[] {
  const classes: GeneratedClass[] = [];
  const now = new Date();
  const currentDay = now.getDay();

  // Class templates
  const classTemplates = [
    {
      title: "Morning Yoga",
      type: "yoga",
      description: "Start your day with an invigorating Hatha Yoga practice.",
      instructorId: ids.staff1.toString(),
      instructorName: "Emily Johnson",
      startTime: "07:00",
      endTime: "08:00",
      duration: 60,
      maxCapacity: 15,
      location: "Studio A",
      establishmentId: ids.unit1.toString(),
      dayOfWeek: 1,
    },
    {
      title: "Pilates Reformer",
      type: "pilates",
      description: "Pilates class on Reformer machines. Focus on strength and posture.",
      instructorId: ids.staff1.toString(),
      instructorName: "Emily Johnson",
      startTime: "09:00",
      endTime: "10:00",
      duration: 60,
      maxCapacity: 8,
      location: "Reformer Room",
      establishmentId: ids.unit1.toString(),
      dayOfWeek: 1,
    },
    {
      title: "Functional Training",
      type: "other",
      description: "Intense functional strength training. All levels welcome.",
      instructorId: ids.staff2.toString(),
      instructorName: "James Cooper",
      startTime: "18:00",
      endTime: "19:00",
      duration: 60,
      maxCapacity: 15,
      location: "Studio A",
      establishmentId: ids.unit1.toString(),
      dayOfWeek: 1,
    },
    {
      title: "Core Power",
      type: "other",
      description: "Focus on core strengthening and stabilization.",
      instructorId: ids.staff2.toString(),
      instructorName: "James Cooper",
      startTime: "07:00",
      endTime: "08:00",
      duration: 60,
      maxCapacity: 12,
      location: "Studio B",
      establishmentId: ids.unit1.toString(),
      dayOfWeek: 2,
    },
    {
      title: "Yoga Flow",
      type: "yoga",
      description: "Dynamic Vinyasa Yoga connecting movement and breath.",
      instructorId: ids.staff3.toString(),
      instructorName: "Rachel Adams",
      startTime: "09:00",
      endTime: "10:00",
      duration: 60,
      maxCapacity: 20,
      location: "Main Studio",
      establishmentId: ids.unit2.toString(),
      dayOfWeek: 2,
    },
    {
      title: "Guided Meditation",
      type: "meditation",
      description: "Meditation session for relaxation and mental clarity.",
      instructorId: ids.staff3.toString(),
      instructorName: "Rachel Adams",
      startTime: "19:00",
      endTime: "20:00",
      duration: 60,
      maxCapacity: 10,
      location: "Zen Room",
      establishmentId: ids.unit2.toString(),
      dayOfWeek: 2,
    },
    {
      title: "Mat Pilates",
      type: "pilates",
      description: "Mat Pilates focusing on stretching and strengthening.",
      instructorId: ids.staff1.toString(),
      instructorName: "Emily Johnson",
      startTime: "10:00",
      endTime: "11:00",
      duration: 60,
      maxCapacity: 15,
      location: "Studio A",
      establishmentId: ids.unit1.toString(),
      dayOfWeek: 3,
    },
    {
      title: "HIIT Express",
      type: "other",
      description: "High-intensity interval training. 45 minutes.",
      instructorId: ids.staff2.toString(),
      instructorName: "James Cooper",
      startTime: "19:00",
      endTime: "19:45",
      duration: 45,
      maxCapacity: 15,
      location: "Studio A",
      establishmentId: ids.unit1.toString(),
      dayOfWeek: 3,
    },
    {
      title: "Deep Stretch",
      type: "stretching",
      description: "Session focused on flexibility and muscle relaxation.",
      instructorId: ids.staff1.toString(),
      instructorName: "Emily Johnson",
      startTime: "17:00",
      endTime: "18:00",
      duration: 60,
      maxCapacity: 15,
      location: "Studio B",
      establishmentId: ids.unit1.toString(),
      dayOfWeek: 4,
    },
    {
      title: "Restorative Yoga",
      type: "yoga",
      description: "Gentle and restorative practice. Ideal for recovery.",
      instructorId: ids.staff3.toString(),
      instructorName: "Rachel Adams",
      startTime: "19:00",
      endTime: "20:00",
      duration: 60,
      maxCapacity: 12,
      location: "Main Studio",
      establishmentId: ids.unit2.toString(),
      dayOfWeek: 4,
    },
    {
      title: "Intermediate Pilates Reformer",
      type: "pilates",
      description: "Intermediate level Reformer class.",
      instructorId: ids.staff1.toString(),
      instructorName: "Emily Johnson",
      startTime: "08:00",
      endTime: "09:00",
      duration: 60,
      maxCapacity: 8,
      location: "Reformer Room",
      establishmentId: ids.unit1.toString(),
      dayOfWeek: 5,
    },
    {
      title: "Saturday Functional",
      type: "other",
      description: "Functional training to start your weekend right.",
      instructorId: ids.staff2.toString(),
      instructorName: "James Cooper",
      startTime: "09:00",
      endTime: "10:00",
      duration: 60,
      maxCapacity: 15,
      location: "Studio A",
      establishmentId: ids.unit1.toString(),
      dayOfWeek: 6,
    },
  ];

  const clientIds = [
    ids.client1, ids.client2, ids.client4, ids.client5, ids.client6,
    ids.client7, ids.client9, ids.client10, ids.client11, ids.client12
  ];
  const clientNames = [
    "Olivia Rhye", "Phoenix Baker", "Demi Wilkinson", "Candice Wu", "Natali Craig",
    "Drew Cano", "Andi Lane", "Kate Morrison", "Koray Okumus", "Amélie Laurent"
  ];

  // Generate classes for past 2 weeks and next 2 weeks
  for (let weekOffset = -2; weekOffset <= 2; weekOffset++) {
    classTemplates.forEach((template) => {
      const classDate = new Date(now);
      // Calculate the date for this class
      const daysUntilClass = (template.dayOfWeek - currentDay + 7) % 7;
      classDate.setDate(classDate.getDate() + daysUntilClass + (weekOffset * 7));
      classDate.setHours(0, 0, 0, 0);

      // Determine class status based on date
      const isPast = classDate < now;

      // Random enrollment (more realistic)
      const enrollmentCount = Math.floor(Math.random() * (template.maxCapacity - 2)) + 2;
      const waitlistCount = isPast ? 0 : Math.floor(Math.random() * 3);

      // Generate enrolled clients
      const shuffledClients = [...clientIds].sort(() => Math.random() - 0.5);
      const enrolledClients = shuffledClients.slice(0, enrollmentCount).map((clientId) => ({
        clientId: clientId.toString(),
        clientName: clientNames[clientIds.indexOf(clientId)],
        status: isPast ? "confirmed" : (Math.random() > 0.1 ? "confirmed" : "pending"),
        enrolledAt: randomDate(daysAgo(14), new Date()),
      }));

      // Generate waitlist
      const waitlistClients = shuffledClients.slice(enrollmentCount, enrollmentCount + waitlistCount).map((clientId) => ({
        clientId: clientId.toString(),
        clientName: clientNames[clientIds.indexOf(clientId)],
        addedAt: randomDate(daysAgo(7), new Date()),
      }));

      classes.push({
        _id: new ObjectId(),
        title: template.title,
        type: template.type,
        description: template.description,
        instructorId: template.instructorId,
        instructorName: template.instructorName,
        scheduledDate: classDate,
        startTime: template.startTime,
        endTime: template.endTime,
        duration: template.duration,
        maxCapacity: template.maxCapacity,
        currentEnrollment: enrollmentCount,
        enrolledClients,
        waitlist: waitlistClients,
        status: isPast ? "completed" : "scheduled",
        location: template.location,
        establishmentId: template.establishmentId,
        createdAt: daysAgo(30),
        updatedAt: new Date(),
      });
    });
  }

  return classes;
}

function generateBookings(classes: ReturnType<typeof generateClasses>) {
  const bookings: Array<{
    _id: ObjectId;
    clientId: string;
    clientName: string;
    classId: string;
    className: string;
    instructorId: string;
    instructorName: string;
    scheduledDate: Date;
    startTime: string;
    endTime: string;
    status: string;
    source: string;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  classes.forEach((classItem) => {
    classItem.enrolledClients.forEach((enrolled: { clientId: string; clientName: string; status: string; enrolledAt: Date }) => {
      const isPast = classItem.scheduledDate < new Date();

      bookings.push({
        _id: new ObjectId(),
        clientId: enrolled.clientId,
        clientName: enrolled.clientName,
        classId: classItem._id.toString(),
        className: classItem.title,
        instructorId: classItem.instructorId,
        instructorName: classItem.instructorName,
        scheduledDate: classItem.scheduledDate,
        startTime: classItem.startTime,
        endTime: classItem.endTime,
        status: isPast
          ? (Math.random() > 0.05 ? "completed" : "no-show")
          : (enrolled.status === "confirmed" ? "confirmed" : "pending"),
        source: Math.random() > 0.3 ? "web" : (Math.random() > 0.5 ? "bot" : "admin"),
        createdAt: enrolled.enrolledAt,
        updatedAt: new Date(),
      });
    });
  });

  return bookings;
}

function generatePayments(): GeneratedPayment[] {
  const payments: GeneratedPayment[] = [];
  const clients = seedData.clients;

  clients.forEach((client) => {
    // Current plan payment
    payments.push({
      _id: new ObjectId(),
      clientId: client._id.toString(),
      clientName: client.name,
      amount: client.plan.price,
      currency: "USD",
      type: client.plan.type === "drop-in" ? "drop-in" : "subscription",
      planDetails: {
        type: client.plan.type,
        classes: client.plan.totalClasses,
        period: client.plan.type === "monthly" ? "30 days"
          : client.plan.type === "quarterly" ? "90 days"
          : client.plan.type === "annual" ? "365 days" : "Drop-in",
      },
      status: "completed",
      paymentMethod: Math.random() > 0.3 ? "credit_card" : "pix",
      transactionId: `txn_${Math.random().toString(36).substring(7)}`,
      createdAt: client.plan.startDate,
      paidAt: client.plan.startDate,
    });

    // Some clients have previous payments
    if (Math.random() > 0.5 && client.status === "active") {
      payments.push({
        _id: new ObjectId(),
        clientId: client._id.toString(),
        clientName: client.name,
        amount: 299,
        currency: "USD",
        type: "subscription",
        planDetails: {
          type: "monthly",
          classes: 8,
          period: "30 days",
        },
        status: "completed",
        paymentMethod: "credit_card",
        transactionId: `txn_${Math.random().toString(36).substring(7)}`,
        createdAt: daysAgo(60),
        paidAt: daysAgo(60),
      });
    }
  });

  return payments;
}

function generateReviews(): GeneratedReview[] {
  const reviews: GeneratedReview[] = [];
  const comments = [
    "Excellent class! The instructor is very attentive and corrects posture gently.",
    "Loved the energy of the class. Left feeling renewed!",
    "Great workout, challenging but respecting everyone's limits.",
    "Amazing instructor, explains the exercises very well.",
    "Very pleasant and welcoming environment. Highly recommend!",
    "Classes are challenging but always with adaptations for all levels.",
    "Best studio I've ever been to. Wonderful team!",
    "Perfect training for those seeking results. Very professional.",
    "The guided meditation really helped me with anxiety.",
    "Pilates on the reformer is life-changing! Completely improved my posture.",
  ];

  const clients = [
    { id: ids.client1, name: "Olivia Rhye" },
    { id: ids.client2, name: "Phoenix Baker" },
    { id: ids.client5, name: "Candice Wu" },
    { id: ids.client6, name: "Natali Craig" },
    { id: ids.client7, name: "Drew Cano" },
    { id: ids.client9, name: "Andi Lane" },
  ];

  const teachers = [
    { id: ids.staff1, name: "Emily Johnson" },
    { id: ids.staff2, name: "James Cooper" },
    { id: ids.staff3, name: "Rachel Adams" },
  ];

  // Generate reviews for each teacher
  teachers.forEach((teacher) => {
    const numReviews = Math.floor(Math.random() * 8) + 5;
    const shuffledClients = [...clients].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(numReviews, clients.length); i++) {
      const client = shuffledClients[i];
      const rating = Math.random() > 0.15 ? 5 : (Math.random() > 0.3 ? 4 : 3);

      reviews.push({
        _id: new ObjectId(),
        staffId: teacher.id.toString(),
        staffName: teacher.name,
        clientId: client.id.toString(),
        clientName: client.name,
        rating,
        comment: comments[Math.floor(Math.random() * comments.length)],
        status: "approved",
        isPublic: true,
        createdAt: randomDate(daysAgo(90), daysAgo(1)),
        updatedAt: new Date(),
      });
    }
  });

  return reviews;
}

function generateWaitlistEntries() {
  const entries = [];

  // A few clients on waitlist for popular classes
  entries.push({
    _id: new ObjectId(),
    clientId: ids.client7.toString(),
    clientName: "Drew Cano",
    clientEmail: "drew@email.com",
    clientPhone: "(212) 555-7777",
    requestType: "extra_class",
    reason: "I would like to take another Pilates Reformer class this week.",
    isUrgent: false,
    preferredClassTypes: ["pilates"],
    preferredInstructorIds: [ids.staff1.toString()],
    preferredDays: ["monday", "wednesday", "friday"],
    preferredTimeSlots: [{ start: "08:00", end: "12:00" }],
    priorityScore: 45,
    priorityBreakdown: {
      planTypePoints: 10,
      waitingTimePoints: 15,
      attendancePoints: 10,
      vipPoints: 0,
      cancelledByStudioPoints: 0,
      urgentReasonPoints: 10,
    },
    status: "waiting",
    position: 1,
    createdAt: daysAgo(3),
    updatedAt: new Date(),
    expiresAt: daysFromNow(14),
  });

  entries.push({
    _id: new ObjectId(),
    clientId: ids.client10.toString(),
    clientName: "Kate Morrison",
    clientEmail: "kate@email.com",
    clientPhone: "(212) 555-9000",
    requestType: "reschedule",
    reason: "I won't be able to attend Wednesday's class, would like to reschedule.",
    isUrgent: false,
    preferredClassTypes: ["pilates", "yoga"],
    preferredDays: ["tuesday", "thursday"],
    preferredTimeSlots: [{ start: "09:00", end: "11:00" }],
    priorityScore: 55,
    priorityBreakdown: {
      planTypePoints: 20,
      waitingTimePoints: 10,
      attendancePoints: 15,
      vipPoints: 0,
      cancelledByStudioPoints: 0,
      urgentReasonPoints: 10,
    },
    status: "waiting",
    position: 2,
    createdAt: daysAgo(1),
    updatedAt: new Date(),
    expiresAt: daysFromNow(14),
  });

  return entries;
}

function generateActivities(bookings: ReturnType<typeof generateBookings>) {
  const activities = [];

  // Recent booking activities
  bookings.slice(0, 20).forEach((booking) => {
    activities.push({
      _id: new ObjectId(),
      type: "booking",
      action: "create",
      description: `${booking.clientName} booked ${booking.className}`,
      entityId: booking._id.toString(),
      entityType: "booking",
      userName: booking.clientName,
      createdAt: booking.createdAt,
    });
  });

  // Client activities
  seedData.clients.slice(0, 5).forEach((client) => {
    activities.push({
      _id: new ObjectId(),
      type: "client",
      action: "create",
      description: `New client registered: ${client.name}`,
      entityId: client._id.toString(),
      entityType: "client",
      createdAt: client.createdAt,
    });
  });

  // Payment activities
  activities.push({
    _id: new ObjectId(),
    type: "payment",
    action: "create",
    description: "Payment received: $399.00 - Monthly Plan 12 classes",
    entityType: "payment",
    userName: "Amelie Laurent",
    createdAt: daysAgo(3),
  });

  activities.push({
    _id: new ObjectId(),
    type: "payment",
    action: "create",
    description: "Payment received: $799.00 - Quarterly Plan",
    entityType: "payment",
    userName: "Kate Morrison",
    createdAt: daysAgo(10),
  });

  // System activities
  activities.push({
    _id: new ObjectId(),
    type: "system",
    action: "backup",
    description: "Automatic backup completed successfully",
    createdAt: daysAgo(1),
  });

  return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ============================================
// SEED PROFILES
// ============================================

type SeedProfile = "full" | "onboarding" | "admin-ready";

const profileDescriptions: Record<SeedProfile, string> = {
  full: "Full data — all users, clients, classes, bookings, payments (default)",
  onboarding: "Onboarding test — only users + staff + studio settings, empty dashboards",
  "admin-ready": "Admin populated — admin sees full data, teacher/client dashboards empty",
};

function getProfile(): SeedProfile {
  const profileArg = process.argv.find(arg => arg.startsWith("--profile="));
  if (profileArg) {
    const value = profileArg.split("=")[1] as SeedProfile;
    if (!["full", "onboarding", "admin-ready"].includes(value)) {
      console.error(`❌ Invalid profile: ${value}`);
      console.error("   Valid profiles: full, onboarding, admin-ready");
      process.exit(1);
    }
    return value;
  }
  return "full";
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function seed(profile: SeedProfile = "full") {
  console.log("🌱 Starting comprehensive database seed...\n");
  console.log(`📋 Profile: ${profile}`);
  console.log(`   ${profileDescriptions[profile]}\n`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db();

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    const collections = [
      "users", "staff", "clients", "classes", "bookings", "units",
      "rooms", "payments", "reviews", "waitlist", "activities",
      "studio_settings", "requests", "conversations", "support_tickets"
    ];

    for (const collection of collections) {
      await db.collection(collection).deleteMany({});
    }
    console.log("✅ Existing data cleared\n");

    // Generate dynamic data (only for profiles that need it)
    let classes: ReturnType<typeof generateClasses> = [];
    let bookings: ReturnType<typeof generateBookings> = [];
    let payments: ReturnType<typeof generatePayments> = [];
    let reviews: ReturnType<typeof generateReviews> = [];
    let waitlistEntries: ReturnType<typeof generateWaitlistEntries> = [];
    let activities: ReturnType<typeof generateActivities> = [];

    if (profile !== "onboarding") {
      console.log("📊 Generating dynamic data...");
      classes = generateClasses();
      bookings = generateBookings(classes);
      payments = generatePayments();
      reviews = generateReviews();
      waitlistEntries = generateWaitlistEntries();
      activities = generateActivities(bookings);
      console.log("✅ Dynamic data generated\n");
    }

    // --- Always created: users, staff, studio settings ---

    // Hash passwords for users
    console.log("🔐 Creating users...");
    const usersWithPasswords = await Promise.all(
      seedData.users.map(async (user) => ({
        ...user,
        password: await hashPassword("password123"),
      }))
    );
    await db.collection("users").insertMany(usersWithPasswords);
    console.log(`   ✅ Created ${usersWithPasswords.length} users (3 teachers, 1 admin, 12 clients)`);

    // Insert staff
    console.log("👥 Creating staff...");
    await db.collection("staff").insertMany(seedData.staff);
    console.log(`   ✅ Created ${seedData.staff.length} staff members`);

    // Insert studio settings
    console.log("⚙️  Creating studio settings...");
    await db.collection("studio_settings").insertOne(seedData.studioSettings);
    console.log("   ✅ Studio settings configured");

    // --- Conditionally created based on profile ---

    if (profile !== "onboarding") {
      // Insert clients
      console.log("🧘 Creating clients...");
      await db.collection("clients").insertMany(seedData.clients);
      console.log(`   ✅ Created ${seedData.clients.length} clients with diverse plans`);

      // Insert units
      console.log("🏢 Creating establishments...");
      await db.collection("units").insertMany(seedData.units);
      console.log(`   ✅ Created ${seedData.units.length} establishments`);

      // Insert rooms
      console.log("🚪 Creating rooms...");
      await db.collection("rooms").insertMany(seedData.rooms);
      console.log(`   ✅ Created ${seedData.rooms.length} rooms`);

      if (profile === "admin-ready") {
        // For admin-ready: classes and bookings use phantom IDs so teacher/client dashboards are empty
        // Admin still sees aggregated stats, but individual teacher/client queries return nothing
        const phantomStaffId = new ObjectId().toString();
        const phantomClientIds = Array.from({ length: 12 }, () => new ObjectId().toString());
        const phantomClientNames = [
          "Demo Student 1", "Demo Student 2", "Demo Student 3", "Demo Student 4",
          "Demo Student 5", "Demo Student 6", "Demo Student 7", "Demo Student 8",
          "Demo Student 9", "Demo Student 10", "Demo Student 11", "Demo Student 12",
        ];

        const modifiedClasses = classes.map(c => ({
          ...c,
          instructorId: phantomStaffId,
          instructorName: "Studio Instructor",
          enrolledClients: c.enrolledClients.map((ec: { clientId: string; clientName: string; status: string; enrolledAt: Date }, i: number) => ({
            ...ec,
            clientId: phantomClientIds[i % phantomClientIds.length],
            clientName: phantomClientNames[i % phantomClientNames.length],
          })),
          waitlist: c.waitlist.map((w: { clientId: string; clientName: string; addedAt: Date }, i: number) => ({
            ...w,
            clientId: phantomClientIds[i % phantomClientIds.length],
            clientName: phantomClientNames[i % phantomClientNames.length],
          })),
        }));

        const modifiedBookings = bookings.map((b, i) => ({
          ...b,
          clientId: phantomClientIds[i % phantomClientIds.length],
          clientName: phantomClientNames[i % phantomClientNames.length],
          instructorId: phantomStaffId,
          instructorName: "Studio Instructor",
        }));

        console.log("📅 Creating classes (admin-ready: phantom instructors)...");
        await db.collection("classes").insertMany(modifiedClasses);
        console.log(`   ✅ Created ${modifiedClasses.length} classes`);

        console.log("📋 Creating bookings (admin-ready: phantom clients)...");
        await db.collection("bookings").insertMany(modifiedBookings);
        console.log(`   ✅ Created ${modifiedBookings.length} bookings`);
      } else {
        // Full profile: original behavior
        console.log("📅 Creating classes...");
        await db.collection("classes").insertMany(classes);
        console.log(`   ✅ Created ${classes.length} classes (past and upcoming)`);

        console.log("📋 Creating bookings...");
        await db.collection("bookings").insertMany(bookings);
        console.log(`   ✅ Created ${bookings.length} bookings`);
      }

      // Insert payments
      console.log("💳 Creating payments...");
      await db.collection("payments").insertMany(payments);
      console.log(`   ✅ Created ${payments.length} payment records`);

      // Insert reviews
      console.log("⭐ Creating reviews...");
      await db.collection("reviews").insertMany(reviews);
      console.log(`   ✅ Created ${reviews.length} instructor reviews`);

      // Insert waitlist entries
      console.log("📝 Creating waitlist entries...");
      await db.collection("waitlist").insertMany(waitlistEntries);
      console.log(`   ✅ Created ${waitlistEntries.length} waitlist entries`);

      // Insert activities
      console.log("📜 Creating activity logs...");
      await db.collection("activities").insertMany(activities);
      console.log(`   ✅ Created ${activities.length} activity records`);
    } else {
      console.log("⏭️  Skipping business data (onboarding profile)\n");
    }

    // Create indexes
    console.log("\n📇 Creating indexes...");
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("staff").createIndex({ email: 1 }, { unique: true });
    await db.collection("clients").createIndex({ email: 1 }, { unique: true });
    await db.collection("clients").createIndex({ status: 1 });
    await db.collection("classes").createIndex({ scheduledDate: 1 });
    await db.collection("classes").createIndex({ instructorId: 1 });
    await db.collection("bookings").createIndex({ clientId: 1 });
    await db.collection("bookings").createIndex({ classId: 1 });
    await db.collection("bookings").createIndex({ scheduledDate: 1 });
    await db.collection("payments").createIndex({ clientId: 1 });
    await db.collection("reviews").createIndex({ staffId: 1 });
    await db.collection("activities").createIndex({ createdAt: -1 });
    console.log("   ✅ All indexes created\n");

    // Summary
    console.log("═".repeat(50));
    console.log("🎉 DATABASE SEED COMPLETED SUCCESSFULLY!");
    console.log(`   Profile: ${profile}`);
    console.log("═".repeat(50));
    console.log("\n📊 Summary:");
    console.log(`   • Users: ${usersWithPasswords.length} (1 admin, 3 teachers, 12 clients)`);
    console.log(`   • Staff: ${seedData.staff.length}`);
    if (profile !== "onboarding") {
      console.log(`   • Clients: ${seedData.clients.length}`);
      console.log(`   • Establishments: ${seedData.units.length}`);
      console.log(`   • Rooms: ${seedData.rooms.length}`);
      console.log(`   • Classes: ${classes.length}`);
      console.log(`   • Bookings: ${bookings.length}`);
      console.log(`   • Payments: ${payments.length}`);
      console.log(`   • Reviews: ${reviews.length}`);
      console.log(`   • Waitlist: ${waitlistEntries.length}`);
      console.log(`   • Activities: ${activities.length}`);
      if (profile === "admin-ready") {
        console.log("\n   ⚠️  Classes use phantom instructor IDs (teacher dashboards empty)");
        console.log("   ⚠️  Bookings use phantom client IDs (client dashboards empty)");
      }
    } else {
      console.log("   • (No business data — onboarding profile)");
    }

    console.log("\n📝 Test Credentials:");
    console.log("   ┌─────────────────────────────────────────────┐");
    console.log("   │ ADMIN                                       │");
    console.log("   │ Email: admin@flexiwell.com                  │");
    console.log("   │ Password: password123                       │");
    console.log("   ├─────────────────────────────────────────────┤");
    console.log("   │ TEACHERS                                    │");
    console.log("   │ Email: emily@flexiwell.com                  │");
    console.log("   │ Email: james@flexiwell.com                  │");
    console.log("   │ Email: rachel@flexiwell.com                 │");
    console.log("   │ Password: password123                       │");
    console.log("   ├─────────────────────────────────────────────┤");
    console.log("   │ CLIENTS                                     │");
    console.log("   │ Email: olivia@email.com                     │");
    console.log("   │ Email: phoenix@email.com                    │");
    console.log("   │ Email: candice@email.com                    │");
    console.log("   │ ... and 9 more clients                      │");
    console.log("   │ Password: password123                       │");
    console.log("   └─────────────────────────────────────────────┘");
    console.log("");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run seed with selected profile
seed(getProfile());
