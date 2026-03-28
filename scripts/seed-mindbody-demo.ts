/**
 * FlexiWell CRM - Mindbody Migration Demo Seed
 *
 * Simulates a real pilates studio ("Harmony Pilates & Wellness") migrating
 * from Mindbody with 6 months of history. This is what your first customer
 * looks like after a full Mindbody sync.
 *
 * Studio profile:
 *   Owner: Lauren Mitchell (ran studio on Mindbody for 2+ years)
 *   Location: Austin, TX
 *   3 instructors, 1 admin, 1 location
 *   ~65 clients (45 active, 8 at-risk, 12 churned in last 6 months)
 *   15 weekly class slots
 *   Revenue ~$14,200/month (small-mid studio)
 *
 * Run with: npx tsx scripts/seed-mindbody-demo.ts
 */

import { MongoClient, ObjectId } from "mongodb";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const dbName = process.env.MONGODB_DB_NAME || "flexiwell-dev";
if (process.env.NODE_ENV === "production" || dbName === "flexiwell") {
  console.error("\x1b[31m%s\x1b[0m", "ABORT: Cannot seed production database!");
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/flexiwell";

// ============================================
// HELPERS
// ============================================

const NOW = new Date();
const SIX_MONTHS_AGO = new Date(NOW);
SIX_MONTHS_AGO.setMonth(SIX_MONTHS_AGO.getMonth() - 6);

function daysAgo(days: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() - days);
  return d;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function monthsAgo(m: number): Date {
  const d = new Date(NOW);
  d.setMonth(d.getMonth() - m);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

function usPhone(seed: number): string {
  const area = 512; // Austin TX
  const mid = 555;
  const last = String(1000 + seed).slice(-4);
  return `(${area}) ${mid}-${last}`;
}

function mindbodyId(prefix: string, n: number): string {
  return `MB-${prefix}-${String(n).padStart(5, "0")}`;
}

async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12);
}

// Weighted random for realistic distributions
function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ============================================
// IDS
// ============================================

const ids = {
  // Users
  adminUser: new ObjectId(),
  owner: new ObjectId(),
  teacher1User: new ObjectId(),
  teacher2User: new ObjectId(),
  teacher3User: new ObjectId(),

  // Staff
  adminStaff: new ObjectId(),
  staff1: new ObjectId(),
  staff2: new ObjectId(),
  staff3: new ObjectId(),

  // Establishment
  studio: new ObjectId(),

  // Rooms
  reformerRoom: new ObjectId(),
  matRoom: new ObjectId(),
  privateRoom: new ObjectId(),
};

// ============================================
// STUDIO & STAFF (the business)
// ============================================

const establishment = {
  _id: ids.studio,
  name: "Harmony Pilates & Wellness",
  location: "2847 South Lamar Blvd, Austin, TX 78704",
  address: "2847 South Lamar Blvd, Austin, TX 78704",
  phone: "(512) 555-0100",
  assignedTeachers: [ids.staff1.toString(), ids.staff2.toString(), ids.staff3.toString()],
  rooms: [ids.reformerRoom.toString(), ids.matRoom.toString(), ids.privateRoom.toString()],
  isActive: true,
  ownerId: ids.adminUser.toString(),
  adminIds: [],
  createdAt: monthsAgo(6),
  updatedAt: NOW,
};

const studioSettings = {
  _id: new ObjectId(),
  general: {
    studioName: "Harmony Pilates & Wellness",
    email: "hello@harmonypilates.com",
    phone: "(512) 555-0100",
    address: "2847 South Lamar Blvd, Austin, TX 78704",
    timezone: "America/Chicago",
    currency: "USD",
    language: "en-US" as const,
    region: "US" as const,
    businessType: "pilates_studio",
    country: "US",
  },
  branding: { primaryColor: "#7C3AED" },
  notifications: {
    emailEnabled: true,
    whatsappEnabled: false,
    smsEnabled: false, // Not set up yet — this is what you'll check
    primaryMessagingChannel: "sms" as const,
    messagingBotEnabled: false,
    confirmationEmail: true,
    marketingEmails: true,
    reminderHours: 2,
  },
  waitlist: {
    enabled: true,
    maxSize: 10,
    autoNotify: true,
    notificationWindowMinutes: 60,
    priorityByPlanType: true,
  },
  trialBooking: {
    trialEnabled: true,
    dropInEnabled: true,
    trialPrice: 0,
    dropInPrice: 35,
    acceptedPaymentMethods: ["card" as const, "cash" as const],
    requirePaymentUpfront: false,
    maxTrialsPerClient: 1,
  },
  integrations: {
    stripeConnected: false,
    whatsappConnected: false,
    googleCalendarConnected: false,
    resendConnected: false,
  },
  createdAt: monthsAgo(6),
  updatedAt: NOW,
};

const staffMembers = [
  {
    _id: ids.staff1,
    name: "Lauren Mitchell",
    email: "lauren@harmonypilates.com",
    phone: "(512) 555-0101",
    role: "admin" as const,
    bio: "Studio owner with 12 years of Pilates teaching experience. BASI Pilates certified, specializing in rehabilitation and pre/post-natal Pilates.",
    specialties: ["pilates", "reformer", "rehabilitation", "prenatal"],
    schedule: [
      { day: "monday", slots: [{ start: "06:00", end: "12:00" }, { start: "16:00", end: "20:00" }] },
      { day: "tuesday", slots: [{ start: "09:00", end: "14:00" }] },
      { day: "wednesday", slots: [{ start: "06:00", end: "12:00" }, { start: "16:00", end: "20:00" }] },
      { day: "thursday", slots: [{ start: "09:00", end: "14:00" }] },
      { day: "friday", slots: [{ start: "06:00", end: "12:00" }] },
    ],
    status: "active" as const,
    unit: ids.studio.toString(),
    establishmentId: ids.studio.toString(),
    rating: { average: 4.9, totalReviews: 87, breakdown: { five: 78, four: 7, three: 2, two: 0, one: 0 } },
    createdAt: monthsAgo(6),
    updatedAt: NOW,
  },
  {
    _id: ids.staff2,
    name: "Diego Salazar",
    email: "diego@harmonypilates.com",
    phone: "(512) 555-0102",
    role: "teacher" as const,
    bio: "Former dancer turned Pilates instructor. Stott Pilates certified with focus on mat work, flexibility, and movement flow.",
    specialties: ["pilates", "mat", "stretching", "yoga"],
    schedule: [
      { day: "monday", slots: [{ start: "09:00", end: "15:00" }] },
      { day: "tuesday", slots: [{ start: "06:00", end: "12:00" }, { start: "17:00", end: "20:00" }] },
      { day: "wednesday", slots: [{ start: "09:00", end: "15:00" }] },
      { day: "thursday", slots: [{ start: "06:00", end: "12:00" }, { start: "17:00", end: "20:00" }] },
      { day: "saturday", slots: [{ start: "08:00", end: "13:00" }] },
    ],
    status: "active" as const,
    unit: ids.studio.toString(),
    establishmentId: ids.studio.toString(),
    rating: { average: 4.7, totalReviews: 62, breakdown: { five: 51, four: 8, three: 2, two: 1, one: 0 } },
    createdAt: monthsAgo(6),
    updatedAt: NOW,
  },
  {
    _id: ids.staff3,
    name: "Priya Sharma",
    email: "priya@harmonypilates.com",
    phone: "(512) 555-0103",
    role: "teacher" as const,
    bio: "Yoga and Pilates fusion specialist. 500-hour RYT with Balanced Body Pilates certification. Known for challenging but accessible classes.",
    specialties: ["yoga", "pilates", "meditation", "barre"],
    schedule: [
      { day: "monday", slots: [{ start: "17:00", end: "20:00" }] },
      { day: "tuesday", slots: [{ start: "09:00", end: "14:00" }] },
      { day: "wednesday", slots: [{ start: "17:00", end: "20:00" }] },
      { day: "friday", slots: [{ start: "09:00", end: "14:00" }, { start: "16:00", end: "19:00" }] },
      { day: "saturday", slots: [{ start: "09:00", end: "12:00" }] },
    ],
    status: "active" as const,
    unit: ids.studio.toString(),
    establishmentId: ids.studio.toString(),
    rating: { average: 4.8, totalReviews: 45, breakdown: { five: 38, four: 5, three: 2, two: 0, one: 0 } },
    createdAt: monthsAgo(6),
    updatedAt: NOW,
  },
];

// ============================================
// CLIENTS — realistic Mindbody migration
// ============================================

type PlanType = "monthly" | "quarterly" | "annual" | "drop-in";
type ClientStatus = "active" | "inactive" | "pending";

interface ClientDef {
  name: string;
  email: string;
  phone: string;
  planType: PlanType;
  price: number;
  totalClasses: number;
  usedClasses: number;
  status: ClientStatus;
  joinedMonthsAgo: number; // when they first appeared in Mindbody
  lastClassDaysAgo: number;
  currentStreak: number;
  longestStreak: number;
  preferredTypes: string[];
  preferredInstructor: string; // staff name
  mindbodyClientId: string;
  gender?: string;
  dateOfBirth?: string;
  noShowRate: number; // 0-1
  hasMedicalFlags?: boolean;
  notes?: string;
}

// Realistic Austin pilates studio client base
const clientDefs: ClientDef[] = [
  // === POWER USERS (loyal, high attendance, 6+ months) ===
  { name: "Sarah Jennings", email: "sarah.jennings@gmail.com", phone: usPhone(1), planType: "annual", price: 2399, totalClasses: 96, usedClasses: 58, status: "active", joinedMonthsAgo: 14, lastClassDaysAgo: 1, currentStreak: 22, longestStreak: 22, preferredTypes: ["pilates", "reformer"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 1), gender: "female", dateOfBirth: "1985-03-14", noShowRate: 0.02, notes: "Original founding member. Referred 4 friends." },
  { name: "Michael Torres", email: "mtorres@outlook.com", phone: usPhone(2), planType: "annual", price: 2399, totalClasses: 96, usedClasses: 44, status: "active", joinedMonthsAgo: 11, lastClassDaysAgo: 2, currentStreak: 16, longestStreak: 16, preferredTypes: ["pilates", "mat"], preferredInstructor: "Diego Salazar", mindbodyClientId: mindbodyId("CL", 2), gender: "male", dateOfBirth: "1978-07-22", noShowRate: 0.03 },
  { name: "Rachel Kim", email: "rachel.k@icloud.com", phone: usPhone(3), planType: "quarterly", price: 749, totalClasses: 24, usedClasses: 20, status: "active", joinedMonthsAgo: 9, lastClassDaysAgo: 1, currentStreak: 14, longestStreak: 14, preferredTypes: ["yoga", "pilates"], preferredInstructor: "Priya Sharma", mindbodyClientId: mindbodyId("CL", 3), gender: "female", dateOfBirth: "1990-11-05", noShowRate: 0.01 },
  { name: "David Chen", email: "dchen.atx@gmail.com", phone: usPhone(4), planType: "quarterly", price: 749, totalClasses: 24, usedClasses: 18, status: "active", joinedMonthsAgo: 8, lastClassDaysAgo: 3, currentStreak: 10, longestStreak: 10, preferredTypes: ["reformer", "stretching"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 4), gender: "male", dateOfBirth: "1982-01-30", noShowRate: 0.04 },
  { name: "Ashley Williams", email: "ashley.w.pilates@gmail.com", phone: usPhone(5), planType: "annual", price: 2399, totalClasses: 96, usedClasses: 52, status: "active", joinedMonthsAgo: 13, lastClassDaysAgo: 1, currentStreak: 18, longestStreak: 20, preferredTypes: ["pilates", "barre"], preferredInstructor: "Priya Sharma", mindbodyClientId: mindbodyId("CL", 5), gender: "female", dateOfBirth: "1992-06-18", noShowRate: 0.02, notes: "Instagram influencer, 12k followers. Tags studio." },
  { name: "James O'Brien", email: "jobrien512@gmail.com", phone: usPhone(6), planType: "quarterly", price: 749, totalClasses: 24, usedClasses: 22, status: "active", joinedMonthsAgo: 7, lastClassDaysAgo: 2, currentStreak: 12, longestStreak: 12, preferredTypes: ["mat", "pilates"], preferredInstructor: "Diego Salazar", mindbodyClientId: mindbodyId("CL", 6), gender: "male", dateOfBirth: "1975-09-12", noShowRate: 0.0, hasMedicalFlags: true, notes: "Recovering from L4-L5 disc herniation. Cleared by PT." },

  // === STEADY REGULARS (2-3x/week, solid retention) ===
  { name: "Maria Gonzalez", email: "maria.g.atx@yahoo.com", phone: usPhone(7), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 6, status: "active", joinedMonthsAgo: 10, lastClassDaysAgo: 3, currentStreak: 8, longestStreak: 12, preferredTypes: ["pilates", "stretching"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 7), gender: "female", dateOfBirth: "1988-04-25", noShowRate: 0.05 },
  { name: "Brandon Lee", email: "brandonlee@proton.me", phone: usPhone(8), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 7, status: "active", joinedMonthsAgo: 5, lastClassDaysAgo: 4, currentStreak: 6, longestStreak: 6, preferredTypes: ["reformer", "pilates"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 8), gender: "male", dateOfBirth: "1995-12-03", noShowRate: 0.03 },
  { name: "Nicole Patel", email: "nicole.patel@gmail.com", phone: usPhone(9), planType: "monthly", price: 319, totalClasses: 12, usedClasses: 10, status: "active", joinedMonthsAgo: 6, lastClassDaysAgo: 2, currentStreak: 8, longestStreak: 10, preferredTypes: ["yoga", "meditation"], preferredInstructor: "Priya Sharma", mindbodyClientId: mindbodyId("CL", 9), gender: "female", dateOfBirth: "1991-08-17", noShowRate: 0.02 },
  { name: "Chris Henderson", email: "chenderson@gmail.com", phone: usPhone(10), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 5, status: "active", joinedMonthsAgo: 4, lastClassDaysAgo: 5, currentStreak: 4, longestStreak: 4, preferredTypes: ["pilates", "mat"], preferredInstructor: "Diego Salazar", mindbodyClientId: mindbodyId("CL", 10), gender: "male", dateOfBirth: "1987-02-14", noShowRate: 0.06 },
  { name: "Stephanie Morris", email: "steph.morris@outlook.com", phone: usPhone(11), planType: "quarterly", price: 749, totalClasses: 24, usedClasses: 16, status: "active", joinedMonthsAgo: 8, lastClassDaysAgo: 2, currentStreak: 6, longestStreak: 8, preferredTypes: ["pilates", "reformer"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 11), gender: "female", dateOfBirth: "1983-10-09", noShowRate: 0.04 },
  { name: "Kevin Nguyen", email: "knguyen.fit@gmail.com", phone: usPhone(12), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 6, status: "active", joinedMonthsAgo: 3, lastClassDaysAgo: 4, currentStreak: 5, longestStreak: 5, preferredTypes: ["reformer"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 12), gender: "male", dateOfBirth: "1993-05-28", noShowRate: 0.03 },
  { name: "Amanda Foster", email: "afoster.yoga@gmail.com", phone: usPhone(13), planType: "monthly", price: 319, totalClasses: 12, usedClasses: 9, status: "active", joinedMonthsAgo: 7, lastClassDaysAgo: 3, currentStreak: 7, longestStreak: 9, preferredTypes: ["yoga", "pilates"], preferredInstructor: "Priya Sharma", mindbodyClientId: mindbodyId("CL", 13), gender: "female", dateOfBirth: "1989-01-11", noShowRate: 0.02 },
  { name: "Daniel Wright", email: "dwright.atx@gmail.com", phone: usPhone(14), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 7, status: "active", joinedMonthsAgo: 5, lastClassDaysAgo: 2, currentStreak: 6, longestStreak: 6, preferredTypes: ["pilates", "mat"], preferredInstructor: "Diego Salazar", mindbodyClientId: mindbodyId("CL", 14), gender: "male", dateOfBirth: "1980-07-19", noShowRate: 0.04, hasMedicalFlags: true, notes: "Has high blood pressure, on medication. Monitor intensity." },
  { name: "Lisa Chang", email: "lisa.chang512@gmail.com", phone: usPhone(15), planType: "quarterly", price: 749, totalClasses: 24, usedClasses: 14, status: "active", joinedMonthsAgo: 6, lastClassDaysAgo: 4, currentStreak: 4, longestStreak: 8, preferredTypes: ["pilates", "stretching"], preferredInstructor: "Diego Salazar", mindbodyClientId: mindbodyId("CL", 15), gender: "female", dateOfBirth: "1986-12-01", noShowRate: 0.05 },
  { name: "Ryan Cooper", email: "rcooper@icloud.com", phone: usPhone(16), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 6, status: "active", joinedMonthsAgo: 4, lastClassDaysAgo: 3, currentStreak: 5, longestStreak: 5, preferredTypes: ["reformer", "pilates"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 16), gender: "male", dateOfBirth: "1994-03-07", noShowRate: 0.03 },
  { name: "Emily Rodriguez", email: "emily.rod.atx@gmail.com", phone: usPhone(17), planType: "monthly", price: 319, totalClasses: 12, usedClasses: 8, status: "active", joinedMonthsAgo: 5, lastClassDaysAgo: 2, currentStreak: 6, longestStreak: 6, preferredTypes: ["yoga", "barre"], preferredInstructor: "Priya Sharma", mindbodyClientId: mindbodyId("CL", 17), gender: "female", dateOfBirth: "1996-09-23", noShowRate: 0.01 },
  { name: "Thomas Jackson", email: "tjackson.512@outlook.com", phone: usPhone(18), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 5, status: "active", joinedMonthsAgo: 3, lastClassDaysAgo: 5, currentStreak: 3, longestStreak: 3, preferredTypes: ["pilates"], preferredInstructor: "Diego Salazar", mindbodyClientId: mindbodyId("CL", 18), gender: "male", dateOfBirth: "1979-11-30", noShowRate: 0.06 },
  { name: "Jasmine Washington", email: "jas.wash@gmail.com", phone: usPhone(19), planType: "quarterly", price: 749, totalClasses: 24, usedClasses: 12, status: "active", joinedMonthsAgo: 5, lastClassDaysAgo: 3, currentStreak: 5, longestStreak: 7, preferredTypes: ["pilates", "reformer"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 19), gender: "female", dateOfBirth: "1990-04-14", noShowRate: 0.03 },
  { name: "Andrew Martinez", email: "andymartinez@gmail.com", phone: usPhone(20), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 7, status: "active", joinedMonthsAgo: 2, lastClassDaysAgo: 3, currentStreak: 4, longestStreak: 4, preferredTypes: ["mat", "stretching"], preferredInstructor: "Diego Salazar", mindbodyClientId: mindbodyId("CL", 20), gender: "male", dateOfBirth: "1984-08-06", noShowRate: 0.04 },

  // === NEWER CLIENTS (1-3 months, building habits) ===
  { name: "Olivia Barnes", email: "olivia.barnes@gmail.com", phone: usPhone(21), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 4, status: "active", joinedMonthsAgo: 2, lastClassDaysAgo: 5, currentStreak: 2, longestStreak: 2, preferredTypes: ["pilates"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 21), gender: "female", dateOfBirth: "1997-02-19", noShowRate: 0.08 },
  { name: "Ethan Brooks", email: "ethan.b.brooks@gmail.com", phone: usPhone(22), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 3, status: "active", joinedMonthsAgo: 1, lastClassDaysAgo: 6, currentStreak: 1, longestStreak: 1, preferredTypes: ["reformer"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 22), gender: "male", dateOfBirth: "1991-06-11", noShowRate: 0.10 },
  { name: "Maya Singh", email: "mayasingh.yoga@gmail.com", phone: usPhone(23), planType: "monthly", price: 319, totalClasses: 12, usedClasses: 5, status: "active", joinedMonthsAgo: 2, lastClassDaysAgo: 4, currentStreak: 3, longestStreak: 3, preferredTypes: ["yoga", "meditation"], preferredInstructor: "Priya Sharma", mindbodyClientId: mindbodyId("CL", 23), gender: "female", dateOfBirth: "1993-10-08", noShowRate: 0.05 },
  { name: "Jason Clark", email: "jclark.austin@gmail.com", phone: usPhone(24), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 4, status: "active", joinedMonthsAgo: 2, lastClassDaysAgo: 3, currentStreak: 3, longestStreak: 3, preferredTypes: ["pilates", "mat"], preferredInstructor: "Diego Salazar", mindbodyClientId: mindbodyId("CL", 24), gender: "male", dateOfBirth: "1986-04-22", noShowRate: 0.06 },
  { name: "Sophia Anderson", email: "sophia.a.atx@icloud.com", phone: usPhone(25), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 5, status: "active", joinedMonthsAgo: 3, lastClassDaysAgo: 4, currentStreak: 3, longestStreak: 4, preferredTypes: ["pilates", "barre"], preferredInstructor: "Priya Sharma", mindbodyClientId: mindbodyId("CL", 25), gender: "female", dateOfBirth: "1998-01-15", noShowRate: 0.04 },
  { name: "Nathan Rivera", email: "nrivera512@gmail.com", phone: usPhone(26), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 3, status: "active", joinedMonthsAgo: 1, lastClassDaysAgo: 7, currentStreak: 1, longestStreak: 1, preferredTypes: ["reformer"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 26), gender: "male", dateOfBirth: "1990-12-05", noShowRate: 0.12 },
  { name: "Hannah Scott", email: "hannah.scott.yoga@gmail.com", phone: usPhone(27), planType: "monthly", price: 319, totalClasses: 12, usedClasses: 6, status: "active", joinedMonthsAgo: 2, lastClassDaysAgo: 3, currentStreak: 4, longestStreak: 4, preferredTypes: ["yoga", "pilates"], preferredInstructor: "Priya Sharma", mindbodyClientId: mindbodyId("CL", 27), gender: "female", dateOfBirth: "1994-07-30", noShowRate: 0.03 },
  { name: "Tyler Mitchell", email: "tyler.m.atx@outlook.com", phone: usPhone(28), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 2, status: "active", joinedMonthsAgo: 1, lastClassDaysAgo: 8, currentStreak: 0, longestStreak: 1, preferredTypes: ["pilates"], preferredInstructor: "Diego Salazar", mindbodyClientId: mindbodyId("CL", 28), gender: "male", dateOfBirth: "1988-03-18", noShowRate: 0.15, notes: "Joined after free trial. Still building habit." },

  // === DROP-IN CLIENTS (occasional, no commitment) ===
  { name: "Rebecca Hughes", email: "rebecca.h@gmail.com", phone: usPhone(29), planType: "drop-in", price: 35, totalClasses: 5, usedClasses: 3, status: "active", joinedMonthsAgo: 4, lastClassDaysAgo: 12, currentStreak: 0, longestStreak: 2, preferredTypes: ["pilates"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 29), gender: "female", dateOfBirth: "1985-09-27", noShowRate: 0.0 },
  { name: "Lucas White", email: "lucas.white.atx@gmail.com", phone: usPhone(30), planType: "drop-in", price: 35, totalClasses: 5, usedClasses: 2, status: "active", joinedMonthsAgo: 3, lastClassDaysAgo: 18, currentStreak: 0, longestStreak: 1, preferredTypes: ["reformer"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 30), gender: "male", dateOfBirth: "1976-05-14", noShowRate: 0.0 },
  { name: "Grace Yang", email: "grace.yang512@gmail.com", phone: usPhone(31), planType: "drop-in", price: 35, totalClasses: 5, usedClasses: 4, status: "active", joinedMonthsAgo: 5, lastClassDaysAgo: 8, currentStreak: 1, longestStreak: 2, preferredTypes: ["yoga", "meditation"], preferredInstructor: "Priya Sharma", mindbodyClientId: mindbodyId("CL", 31), gender: "female", dateOfBirth: "1992-11-22", noShowRate: 0.0 },

  // === AT-RISK CLIENTS (attendance dropping, gone cold) ===
  { name: "Jennifer Cooper", email: "jcooper.pilates@gmail.com", phone: usPhone(32), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 2, status: "active", joinedMonthsAgo: 6, lastClassDaysAgo: 22, currentStreak: 0, longestStreak: 6, preferredTypes: ["pilates", "reformer"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 32), gender: "female", dateOfBirth: "1981-08-03", noShowRate: 0.12, notes: "Was regular 2x/week, dropped off after injury scare." },
  { name: "Mark Phillips", email: "markp.atx@gmail.com", phone: usPhone(33), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 1, status: "active", joinedMonthsAgo: 4, lastClassDaysAgo: 28, currentStreak: 0, longestStreak: 4, preferredTypes: ["mat", "pilates"], preferredInstructor: "Diego Salazar", mindbodyClientId: mindbodyId("CL", 33), gender: "male", dateOfBirth: "1977-03-16", noShowRate: 0.15, notes: "Work travel increased. Hasn't cancelled but barely attending." },
  { name: "Alicia Young", email: "alicia.young@yahoo.com", phone: usPhone(34), planType: "quarterly", price: 749, totalClasses: 24, usedClasses: 6, status: "active", joinedMonthsAgo: 5, lastClassDaysAgo: 19, currentStreak: 0, longestStreak: 5, preferredTypes: ["yoga", "pilates"], preferredInstructor: "Priya Sharma", mindbodyClientId: mindbodyId("CL", 34), gender: "female", dateOfBirth: "1993-06-29", noShowRate: 0.10, notes: "Mentioned considering CrossFit. Needs re-engagement." },
  { name: "Brian Adams", email: "badams.512@gmail.com", phone: usPhone(35), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 3, status: "active", joinedMonthsAgo: 3, lastClassDaysAgo: 16, currentStreak: 0, longestStreak: 3, preferredTypes: ["reformer"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 35), gender: "male", dateOfBirth: "1984-10-11", noShowRate: 0.08 },
  { name: "Megan Taylor", email: "megan.t.yoga@gmail.com", phone: usPhone(36), planType: "monthly", price: 319, totalClasses: 12, usedClasses: 4, status: "active", joinedMonthsAgo: 4, lastClassDaysAgo: 14, currentStreak: 0, longestStreak: 5, preferredTypes: ["yoga", "meditation"], preferredInstructor: "Priya Sharma", mindbodyClientId: mindbodyId("CL", 36), gender: "female", dateOfBirth: "1989-12-20", noShowRate: 0.08, notes: "Had 2 consecutive no-shows before going cold." },
  { name: "Carlos Ramirez", email: "carlos.r.fit@gmail.com", phone: usPhone(37), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 2, status: "active", joinedMonthsAgo: 2, lastClassDaysAgo: 20, currentStreak: 0, longestStreak: 2, preferredTypes: ["pilates", "mat"], preferredInstructor: "Diego Salazar", mindbodyClientId: mindbodyId("CL", 37), gender: "male", dateOfBirth: "1991-07-08", noShowRate: 0.18, notes: "New member who never built consistency. 3 no-shows." },
  { name: "Patricia Dunn", email: "patricia.d@icloud.com", phone: usPhone(38), planType: "quarterly", price: 749, totalClasses: 24, usedClasses: 8, status: "active", joinedMonthsAgo: 6, lastClassDaysAgo: 25, currentStreak: 0, longestStreak: 8, preferredTypes: ["pilates", "stretching"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 38), gender: "female", dateOfBirth: "1974-05-02", noShowRate: 0.06, hasMedicalFlags: true, notes: "Osteoporosis diagnosis. Was consistent, dropped after holidays." },
  { name: "Justin Lee", email: "justinlee.atx@gmail.com", phone: usPhone(39), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 1, status: "active", joinedMonthsAgo: 2, lastClassDaysAgo: 30, currentStreak: 0, longestStreak: 1, preferredTypes: ["reformer"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 39), gender: "male", dateOfBirth: "1996-02-14", noShowRate: 0.25, notes: "Signed up, came once, hasn't returned. Payment still active." },

  // === CHURNED CLIENTS (cancelled/inactive in last 6 months) ===
  { name: "Katherine Hall", email: "kathy.hall@gmail.com", phone: usPhone(40), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 0, status: "inactive", joinedMonthsAgo: 8, lastClassDaysAgo: 65, currentStreak: 0, longestStreak: 10, preferredTypes: ["pilates", "reformer"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 40), gender: "female", dateOfBirth: "1980-04-18", noShowRate: 0.06, notes: "Cancelled — moved to Dallas." },
  { name: "Robert Martin", email: "rmartin.atx@outlook.com", phone: usPhone(41), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 0, status: "inactive", joinedMonthsAgo: 7, lastClassDaysAgo: 75, currentStreak: 0, longestStreak: 6, preferredTypes: ["mat", "pilates"], preferredInstructor: "Diego Salazar", mindbodyClientId: mindbodyId("CL", 41), gender: "male", dateOfBirth: "1972-09-05", noShowRate: 0.08, notes: "Said it was 'too expensive'. Was on monthly $249." },
  { name: "Christine Wong", email: "c.wong512@gmail.com", phone: usPhone(42), planType: "quarterly", price: 749, totalClasses: 24, usedClasses: 0, status: "inactive", joinedMonthsAgo: 9, lastClassDaysAgo: 90, currentStreak: 0, longestStreak: 12, preferredTypes: ["yoga", "pilates"], preferredInstructor: "Priya Sharma", mindbodyClientId: mindbodyId("CL", 42), gender: "female", dateOfBirth: "1987-01-25", noShowRate: 0.04, notes: "Got pregnant, switched to prenatal yoga elsewhere." },
  { name: "Steven Park", email: "steven.park@gmail.com", phone: usPhone(43), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 0, status: "inactive", joinedMonthsAgo: 5, lastClassDaysAgo: 55, currentStreak: 0, longestStreak: 3, preferredTypes: ["reformer"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 43), gender: "male", dateOfBirth: "1995-11-12", noShowRate: 0.20, notes: "Chronic no-show. Left without notice." },
  { name: "Diane Foster", email: "diane.foster.atx@gmail.com", phone: usPhone(44), planType: "monthly", price: 319, totalClasses: 12, usedClasses: 0, status: "inactive", joinedMonthsAgo: 6, lastClassDaysAgo: 70, currentStreak: 0, longestStreak: 8, preferredTypes: ["yoga", "meditation"], preferredInstructor: "Priya Sharma", mindbodyClientId: mindbodyId("CL", 44), gender: "female", dateOfBirth: "1976-08-30", noShowRate: 0.05, notes: "Loved the yoga but said schedule didn't work after class times changed." },
  { name: "Patrick Sullivan", email: "psullivan@proton.me", phone: usPhone(45), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 0, status: "inactive", joinedMonthsAgo: 4, lastClassDaysAgo: 48, currentStreak: 0, longestStreak: 4, preferredTypes: ["pilates"], preferredInstructor: "Diego Salazar", mindbodyClientId: mindbodyId("CL", 45), gender: "male", dateOfBirth: "1983-06-17", noShowRate: 0.10 },
  { name: "Laura Bennett", email: "laura.bennett@gmail.com", phone: usPhone(46), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 0, status: "inactive", joinedMonthsAgo: 6, lastClassDaysAgo: 82, currentStreak: 0, longestStreak: 5, preferredTypes: ["pilates", "reformer"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 46), gender: "female", dateOfBirth: "1990-03-09", noShowRate: 0.08, notes: "Said she switched to Orangetheory." },
  { name: "Matthew Green", email: "matt.green.512@gmail.com", phone: usPhone(47), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 0, status: "inactive", joinedMonthsAgo: 5, lastClassDaysAgo: 60, currentStreak: 0, longestStreak: 2, preferredTypes: ["mat"], preferredInstructor: "Diego Salazar", mindbodyClientId: mindbodyId("CL", 47), gender: "male", dateOfBirth: "1999-07-21", noShowRate: 0.14, notes: "Only came to 4 classes total. Never engaged." },
  { name: "Angela Cruz", email: "angela.cruz.fit@gmail.com", phone: usPhone(48), planType: "quarterly", price: 749, totalClasses: 24, usedClasses: 0, status: "inactive", joinedMonthsAgo: 7, lastClassDaysAgo: 85, currentStreak: 0, longestStreak: 14, preferredTypes: ["pilates", "barre"], preferredInstructor: "Priya Sharma", mindbodyClientId: mindbodyId("CL", 48), gender: "female", dateOfBirth: "1988-12-04", noShowRate: 0.03, notes: "Was one of the best clients. Husband lost job, couldn't afford it." },
  { name: "Eric Thompson", email: "eric.t.512@outlook.com", phone: usPhone(49), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 0, status: "inactive", joinedMonthsAgo: 3, lastClassDaysAgo: 42, currentStreak: 0, longestStreak: 3, preferredTypes: ["reformer", "pilates"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 49), gender: "male", dateOfBirth: "1981-02-28", noShowRate: 0.12 },
  { name: "Michelle Adams", email: "michelle.a.yoga@gmail.com", phone: usPhone(50), planType: "monthly", price: 319, totalClasses: 12, usedClasses: 0, status: "inactive", joinedMonthsAgo: 4, lastClassDaysAgo: 50, currentStreak: 0, longestStreak: 6, preferredTypes: ["yoga", "stretching"], preferredInstructor: "Priya Sharma", mindbodyClientId: mindbodyId("CL", 50), gender: "female", dateOfBirth: "1992-05-16", noShowRate: 0.06 },
  { name: "Derek Wilson", email: "derek.w.atx@gmail.com", phone: usPhone(51), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 0, status: "inactive", joinedMonthsAgo: 5, lastClassDaysAgo: 58, currentStreak: 0, longestStreak: 4, preferredTypes: ["pilates"], preferredInstructor: "Diego Salazar", mindbodyClientId: mindbodyId("CL", 51), gender: "male", dateOfBirth: "1978-10-03", noShowRate: 0.09 },

  // === PENDING (signed contract on Mindbody but haven't started yet) ===
  { name: "Victoria Reed", email: "victoria.reed@gmail.com", phone: usPhone(52), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 0, status: "pending", joinedMonthsAgo: 0, lastClassDaysAgo: 999, currentStreak: 0, longestStreak: 0, preferredTypes: ["pilates"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 52), gender: "female", dateOfBirth: "1994-08-25", noShowRate: 0.0, notes: "Signed up online last week. First class scheduled for next Monday." },
  { name: "Anthony Kim", email: "anthony.kim.512@gmail.com", phone: usPhone(53), planType: "monthly", price: 249, totalClasses: 8, usedClasses: 0, status: "pending", joinedMonthsAgo: 0, lastClassDaysAgo: 999, currentStreak: 0, longestStreak: 0, preferredTypes: ["reformer"], preferredInstructor: "Lauren Mitchell", mindbodyClientId: mindbodyId("CL", 53), gender: "male", dateOfBirth: "1987-11-09", noShowRate: 0.0 },
];

// ============================================
// CLASS TEMPLATES (weekly schedule)
// ============================================

const classTemplates = [
  // Monday
  { title: "Reformer Foundations", type: "pilates" as const, instructor: ids.staff1, instructorName: "Lauren Mitchell", day: 1, startTime: "06:30", endTime: "07:30", duration: 60, maxCapacity: 8, room: ids.reformerRoom },
  { title: "Mat Pilates Flow", type: "pilates" as const, instructor: ids.staff2, instructorName: "Diego Salazar", day: 1, startTime: "09:30", endTime: "10:30", duration: 60, maxCapacity: 14, room: ids.matRoom },
  { title: "Evening Vinyasa", type: "yoga" as const, instructor: ids.staff3, instructorName: "Priya Sharma", day: 1, startTime: "17:30", endTime: "18:30", duration: 60, maxCapacity: 14, room: ids.matRoom },

  // Tuesday
  { title: "Sunrise Reformer", type: "pilates" as const, instructor: ids.staff2, instructorName: "Diego Salazar", day: 2, startTime: "06:30", endTime: "07:30", duration: 60, maxCapacity: 8, room: ids.reformerRoom },
  { title: "Gentle Yoga & Stretch", type: "yoga" as const, instructor: ids.staff3, instructorName: "Priya Sharma", day: 2, startTime: "10:00", endTime: "11:00", duration: 60, maxCapacity: 14, room: ids.matRoom },
  { title: "Power Pilates", type: "pilates" as const, instructor: ids.staff2, instructorName: "Diego Salazar", day: 2, startTime: "17:30", endTime: "18:30", duration: 60, maxCapacity: 14, room: ids.matRoom },

  // Wednesday
  { title: "Reformer Intermediate", type: "pilates" as const, instructor: ids.staff1, instructorName: "Lauren Mitchell", day: 3, startTime: "06:30", endTime: "07:30", duration: 60, maxCapacity: 8, room: ids.reformerRoom },
  { title: "Pilates & Stretch", type: "pilates" as const, instructor: ids.staff2, instructorName: "Diego Salazar", day: 3, startTime: "09:30", endTime: "10:30", duration: 60, maxCapacity: 14, room: ids.matRoom },
  { title: "Meditation & Breathwork", type: "meditation" as const, instructor: ids.staff3, instructorName: "Priya Sharma", day: 3, startTime: "17:30", endTime: "18:15", duration: 45, maxCapacity: 12, room: ids.privateRoom },

  // Thursday
  { title: "Sunrise Reformer", type: "pilates" as const, instructor: ids.staff2, instructorName: "Diego Salazar", day: 4, startTime: "06:30", endTime: "07:30", duration: 60, maxCapacity: 8, room: ids.reformerRoom },
  { title: "Lauren's Signature Reformer", type: "pilates" as const, instructor: ids.staff1, instructorName: "Lauren Mitchell", day: 4, startTime: "10:00", endTime: "11:00", duration: 60, maxCapacity: 8, room: ids.reformerRoom },
  { title: "Barre & Pilates Fusion", type: "pilates" as const, instructor: ids.staff2, instructorName: "Diego Salazar", day: 4, startTime: "17:30", endTime: "18:30", duration: 60, maxCapacity: 14, room: ids.matRoom },

  // Friday
  { title: "Reformer Foundations", type: "pilates" as const, instructor: ids.staff1, instructorName: "Lauren Mitchell", day: 5, startTime: "06:30", endTime: "07:30", duration: 60, maxCapacity: 8, room: ids.reformerRoom },
  { title: "Yoga Flow", type: "yoga" as const, instructor: ids.staff3, instructorName: "Priya Sharma", day: 5, startTime: "09:30", endTime: "10:30", duration: 60, maxCapacity: 14, room: ids.matRoom },
  { title: "Happy Hour Pilates", type: "pilates" as const, instructor: ids.staff3, instructorName: "Priya Sharma", day: 5, startTime: "16:30", endTime: "17:30", duration: 60, maxCapacity: 14, room: ids.matRoom },

  // Saturday
  { title: "Weekend Reformer", type: "pilates" as const, instructor: ids.staff2, instructorName: "Diego Salazar", day: 6, startTime: "08:30", endTime: "09:30", duration: 60, maxCapacity: 8, room: ids.reformerRoom },
  { title: "Saturday Flow Yoga", type: "yoga" as const, instructor: ids.staff3, instructorName: "Priya Sharma", day: 6, startTime: "10:00", endTime: "11:00", duration: 60, maxCapacity: 14, room: ids.matRoom },
];

// ============================================
// GENERATE EVERYTHING
// ============================================

async function seed() {
  console.log("\n🧘 Seeding Mindbody migration demo: Harmony Pilates & Wellness");
  console.log("   Austin, TX — 6 months of history\n");

  const mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  const db = mongoClient.db(dbName);

  // Clean existing data
  const collections = ["users", "staff", "clients", "classes", "bookings", "payments",
    "establishments", "studio_settings", "activities", "waitlist", "usage_tracking",
    "integration_credentials", "mindbody_sync_logs"];
  for (const col of collections) {
    await db.collection(col).deleteMany({});
  }
  console.log("   Cleared existing data");

  // ---- ESTABLISHMENT ----
  await db.collection("establishments").insertOne(establishment);
  console.log("   ✓ Studio: Harmony Pilates & Wellness");

  // ---- STUDIO SETTINGS ----
  await db.collection("studio_settings").insertOne(studioSettings);

  // ---- STAFF ----
  await db.collection("staff").insertMany(staffMembers);
  console.log(`   ✓ Staff: ${staffMembers.length} (1 owner + 2 instructors)`);

  // ---- USERS (login accounts) ----
  const hashedPw = await hashPassword("harmony2026");
  const users = [
    {
      _id: ids.adminUser,
      email: "lauren@harmonypilates.com",
      name: "Lauren Mitchell",
      password: hashedPw,
      role: "admin",
      staffId: ids.staff1.toString(),
      establishmentId: ids.studio.toString(),
      isActive: true,
      lastLoginAt: daysAgo(0),
      subscriptionStatus: "active",
      planTier: "retention_pro",
      createdAt: monthsAgo(6),
      updatedAt: NOW,
    },
    {
      _id: ids.teacher1User,
      email: "diego@harmonypilates.com",
      name: "Diego Salazar",
      password: hashedPw,
      role: "teacher",
      staffId: ids.staff2.toString(),
      establishmentId: ids.studio.toString(),
      isActive: true,
      lastLoginAt: daysAgo(1),
      createdAt: monthsAgo(6),
      updatedAt: NOW,
    },
    {
      _id: ids.teacher2User,
      email: "priya@harmonypilates.com",
      name: "Priya Sharma",
      password: hashedPw,
      role: "teacher",
      staffId: ids.staff3.toString(),
      establishmentId: ids.studio.toString(),
      isActive: true,
      lastLoginAt: daysAgo(2),
      createdAt: monthsAgo(6),
      updatedAt: NOW,
    },
  ];
  await db.collection("users").insertMany(users);
  console.log(`   ✓ Users: ${users.length} (password: harmony2026)`);

  // ---- CLIENTS ----
  const clientDocs = clientDefs.map((c, i) => {
    const joinedDate = c.joinedMonthsAgo === 0 ? daysAgo(5) : monthsAgo(c.joinedMonthsAgo);
    const lastClass = c.lastClassDaysAgo === 999 ? null : daysAgo(c.lastClassDaysAgo);

    // Plan dates
    const planStart = c.status === "inactive" ? monthsAgo(c.joinedMonthsAgo) : daysAgo(
      c.planType === "monthly" ? 20 : c.planType === "quarterly" ? 50 : c.planType === "annual" ? 200 : 30
    );
    const planEnd = c.status === "inactive" ? daysAgo(c.lastClassDaysAgo) : new Date(planStart);
    if (c.status !== "inactive") {
      if (c.planType === "monthly") planEnd.setMonth(planEnd.getMonth() + 1);
      else if (c.planType === "quarterly") planEnd.setMonth(planEnd.getMonth() + 3);
      else if (c.planType === "annual") planEnd.setFullYear(planEnd.getFullYear() + 1);
      else planEnd.setMonth(planEnd.getMonth() + 6); // drop-in packs
    }

    // Health score based on behavior
    let healthOverall: number;
    if (c.status === "inactive") healthOverall = Math.floor(Math.random() * 15) + 5;
    else if (c.lastClassDaysAgo > 14) healthOverall = Math.floor(Math.random() * 25) + 20;
    else if (c.currentStreak >= 10) healthOverall = Math.floor(Math.random() * 10) + 90;
    else if (c.currentStreak >= 5) healthOverall = Math.floor(Math.random() * 15) + 70;
    else healthOverall = Math.floor(Math.random() * 20) + 50;

    const attendanceScore = Math.min(25, Math.floor((1 - c.noShowRate) * 25));
    const utilizationScore = c.totalClasses > 0 ? Math.min(25, Math.floor((c.usedClasses / c.totalClasses) * 25)) : 0;
    const recencyScore = c.lastClassDaysAgo === 999 ? 0 : c.lastClassDaysAgo <= 3 ? 25 : c.lastClassDaysAgo <= 7 ? 20 : c.lastClassDaysAgo <= 14 ? 12 : c.lastClassDaysAgo <= 30 ? 5 : 2;
    const paymentScore = c.status === "inactive" ? 5 : c.noShowRate > 0.15 ? 15 : 25;

    const lifecycleStage = c.status === "inactive" ? "churned" :
      c.status === "pending" ? "lead" :
      c.lastClassDaysAgo > 14 ? "at_risk" :
      c.joinedMonthsAgo <= 1 ? "active" : "active";

    return {
      _id: new ObjectId(),
      name: c.name,
      email: c.email,
      phone: c.phone,
      plan: {
        type: c.planType,
        totalClasses: c.totalClasses,
        usedClasses: c.usedClasses,
        remainingClasses: Math.max(0, c.totalClasses - c.usedClasses),
        startDate: planStart,
        endDate: planEnd,
        price: c.price,
      },
      status: c.status,
      mindbodyClientId: c.mindbodyClientId,
      dateOfBirth: c.dateOfBirth || undefined,
      gender: c.gender || undefined,
      emergencyContact: { name: "", phone: "", relationship: "" },
      medicalFlags: {
        hasHeartCondition: false,
        hasHighBloodPressure: c.name === "Daniel Wright",
        hasLowBloodPressure: false,
        hasAsthma: false,
        hasRespiratoryIssues: false,
        hasArthritis: false,
        hasOsteoporosis: c.name === "Patricia Dunn",
        hasScoliosis: false,
        hasHernias: c.name === "James O'Brien",
        hasEpilepsy: false,
        hasDiabetes: false,
        hasThyroidIssues: false,
        isPregnant: false,
        hasSurgeryHistory: c.name === "James O'Brien",
      },
      healthScore: {
        overall: healthOverall,
        breakdown: {
          attendance: attendanceScore,
          planUtilization: utilizationScore,
          recency: recencyScore,
          paymentHealth: paymentScore,
        },
        lastCalculatedAt: NOW,
      },
      lifecycleStage,
      churnRiskScore: 100 - healthOverall,
      currentStreak: c.currentStreak,
      longestStreak: c.longestStreak,
      lastClassDate: lastClass,
      totalLifetimeRevenue: c.status === "inactive"
        ? c.price * c.joinedMonthsAgo * (c.planType === "quarterly" ? 0.33 : c.planType === "annual" ? 0.08 : 1)
        : c.price * (c.planType === "quarterly" ? Math.ceil(c.joinedMonthsAgo / 3) : c.planType === "annual" ? 1 : c.joinedMonthsAgo),
      preferences: {
        preferredInstructors: [c.preferredInstructor],
        preferredClassTypes: c.preferredTypes,
        notifications: { email: true, whatsapp: false, instagram: false, sms: true },
      },
      onboarding: {
        currentPhase: "completed" as const,
        welcomeEmailSent: true,
        welcomeEmailOpened: Math.random() > 0.2,
        healthAssessmentCompleted: Math.random() > 0.4,
        firstClassBooked: c.usedClasses > 0 || c.longestStreak > 0,
        firstClassCompleted: c.usedClasses > 0 || c.longestStreak > 0,
        onboardingCompletedAt: c.status !== "pending" ? monthsAgo(c.joinedMonthsAgo) : undefined,
        intakeStatus: (Math.random() > 0.4 ? "completed" : "not_sent") as "completed" | "not_sent",
      },
      establishmentId: ids.studio.toString(),
      createdAt: joinedDate,
      updatedAt: lastClass || joinedDate,
    };
  });

  await db.collection("clients").insertMany(clientDocs);
  const activeCount = clientDefs.filter(c => c.status === "active").length;
  const atRiskCount = clientDefs.filter(c => c.status === "active" && c.lastClassDaysAgo > 14).length;
  const inactiveCount = clientDefs.filter(c => c.status === "inactive").length;
  const pendingCount = clientDefs.filter(c => c.status === "pending").length;
  console.log(`   ✓ Clients: ${clientDefs.length} total (${activeCount} active, ${atRiskCount} at-risk, ${inactiveCount} churned, ${pendingCount} pending)`);

  // ---- CLASSES (6 months of weekly classes) ----
  const allClasses: any[] = [];
  const allBookings: any[] = [];
  const allPayments: any[] = [];

  // Generate 26 weeks of classes
  for (let weekOffset = 25; weekOffset >= -1; weekOffset--) {
    const weekStart = new Date(NOW);
    weekStart.setDate(weekStart.getDate() - (weekOffset * 7));
    // Set to Monday of that week
    const dayOfWeek = weekStart.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    for (const template of classTemplates) {
      const classDate = new Date(weekStart);
      classDate.setDate(classDate.getDate() + template.day - 1);

      // Skip future classes beyond tomorrow
      if (classDate > daysAgo(-1)) continue;

      const isPast = classDate < daysAgo(0);
      const classId = new ObjectId();

      // Pick enrolled clients for this class
      const eligibleClients = clientDocs.filter(c => {
        const clientDef = clientDefs.find(d => d.email === c.email)!;
        if (c.status === "pending") return false;
        // Check if client was active during this week
        const wasActiveAtTime = c.createdAt <= classDate;
        if (!wasActiveAtTime) return false;
        // Churned clients only attend up to their last class
        if (c.status === "inactive" && c.lastClassDate && classDate > c.lastClassDate) return false;
        // Check preferred class types
        const matchesType = clientDef.preferredTypes.some(t =>
          template.title.toLowerCase().includes(t) || template.type === t
        );
        // Check preferred instructor
        const matchesInstructor = clientDef.preferredInstructor === template.instructorName;
        return matchesType || matchesInstructor;
      });

      // Enrollment: 55-95% capacity
      const enrollmentTarget = Math.floor(template.maxCapacity * (0.55 + Math.random() * 0.4));
      const enrolledClients = pickN(eligibleClients, Math.min(enrollmentTarget, eligibleClients.length));

      const enrolledClientEntries = enrolledClients.map(c => ({
        clientId: c._id.toString(),
        clientName: c.name,
        status: "confirmed" as const,
        enrolledAt: new Date(classDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      }));

      const classDoc = {
        _id: classId,
        title: template.title,
        type: template.type,
        instructorId: template.instructor.toString(),
        instructorName: template.instructorName,
        scheduledDate: classDate,
        startTime: template.startTime,
        endTime: template.endTime,
        duration: template.duration,
        maxCapacity: template.maxCapacity,
        currentEnrollment: enrolledClients.length,
        enrolledClients: enrolledClientEntries,
        waitlist: [],
        status: isPast ? "completed" as const : "scheduled" as const,
        location: "Harmony Pilates & Wellness",
        roomId: template.room.toString(),
        establishmentId: ids.studio.toString(),
        createdAt: new Date(classDate.getTime() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: classDate,
      };

      allClasses.push(classDoc);

      // Generate bookings for each enrolled client
      if (isPast) {
        for (const client of enrolledClients) {
          const clientDef = clientDefs.find(d => d.email === client.email)!;
          const rand = Math.random();
          let status: string;
          if (rand < clientDef.noShowRate) status = "no-show";
          else if (rand < clientDef.noShowRate + 0.03) status = "cancelled";
          else status = "completed";

          allBookings.push({
            _id: new ObjectId(),
            clientId: client._id.toString(),
            clientName: client.name,
            classId: classId.toString(),
            className: template.title,
            instructorId: template.instructor.toString(),
            instructorName: template.instructorName,
            scheduledDate: classDate,
            startTime: template.startTime,
            endTime: template.endTime,
            status,
            source: "mindbody-import",
            mindbodyVisitId: mindbodyId("VIS", allBookings.length),
            createdAt: new Date(classDate.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000),
            updatedAt: classDate,
          });
        }
      }
    }
  }

  // Insert in batches
  if (allClasses.length > 0) {
    const classBatchSize = 500;
    for (let i = 0; i < allClasses.length; i += classBatchSize) {
      await db.collection("classes").insertMany(allClasses.slice(i, i + classBatchSize));
    }
  }
  console.log(`   ✓ Classes: ${allClasses.length} (26 weeks × ${classTemplates.length} weekly slots)`);

  if (allBookings.length > 0) {
    const bookingBatchSize = 1000;
    for (let i = 0; i < allBookings.length; i += bookingBatchSize) {
      await db.collection("bookings").insertMany(allBookings.slice(i, i + bookingBatchSize));
    }
  }
  const completedBookings = allBookings.filter(b => b.status === "completed").length;
  const noShowBookings = allBookings.filter(b => b.status === "no-show").length;
  const cancelledBookings = allBookings.filter(b => b.status === "cancelled").length;
  console.log(`   ✓ Bookings: ${allBookings.length} (${completedBookings} completed, ${noShowBookings} no-shows, ${cancelledBookings} cancelled)`);

  // ---- PAYMENTS (monthly for each active/churned client) ----
  for (const clientDef of clientDefs) {
    if (clientDef.status === "pending") continue;
    const client = clientDocs.find(c => c.email === clientDef.email)!;

    const billingMonths = clientDef.status === "inactive"
      ? Math.min(clientDef.joinedMonthsAgo, 6)
      : Math.min(clientDef.joinedMonthsAgo, 6);

    // Monthly billing cycle
    if (clientDef.planType === "monthly") {
      for (let m = billingMonths; m >= (clientDef.status === "inactive" ? Math.floor(clientDef.lastClassDaysAgo / 30) : 0); m--) {
        const payDate = monthsAgo(m);
        allPayments.push({
          _id: new ObjectId(),
          clientId: client._id.toString(),
          clientName: client.name,
          amount: clientDef.price,
          currency: "USD",
          type: "subscription",
          planDetails: { type: clientDef.planType, classes: clientDef.totalClasses, period: "monthly" },
          status: "completed",
          paymentMethod: pick(["credit_card", "credit_card", "credit_card", "bank_transfer"]),
          createdAt: payDate,
          paidAt: payDate,
        });
      }
    }
    // Quarterly billing
    else if (clientDef.planType === "quarterly") {
      for (let m = billingMonths; m >= 0; m -= 3) {
        const payDate = monthsAgo(m);
        allPayments.push({
          _id: new ObjectId(),
          clientId: client._id.toString(),
          clientName: client.name,
          amount: clientDef.price,
          currency: "USD",
          type: "subscription",
          planDetails: { type: clientDef.planType, classes: clientDef.totalClasses, period: "quarterly" },
          status: "completed",
          paymentMethod: "credit_card",
          createdAt: payDate,
          paidAt: payDate,
        });
      }
    }
    // Annual — single payment
    else if (clientDef.planType === "annual") {
      const payDate = monthsAgo(Math.min(clientDef.joinedMonthsAgo, 6));
      allPayments.push({
        _id: new ObjectId(),
        clientId: client._id.toString(),
        clientName: client.name,
        amount: clientDef.price,
        currency: "USD",
        type: "subscription",
        planDetails: { type: clientDef.planType, classes: clientDef.totalClasses, period: "annual" },
        status: "completed",
        paymentMethod: "credit_card",
        createdAt: payDate,
        paidAt: payDate,
      });
    }
    // Drop-in — per pack
    else if (clientDef.planType === "drop-in") {
      allPayments.push({
        _id: new ObjectId(),
        clientId: client._id.toString(),
        clientName: client.name,
        amount: clientDef.price * clientDef.totalClasses,
        currency: "USD",
        type: "package",
        planDetails: { type: "drop-in", classes: clientDef.totalClasses, period: "pack" },
        status: "completed",
        paymentMethod: pick(["credit_card", "cash"]),
        createdAt: monthsAgo(clientDef.joinedMonthsAgo),
        paidAt: monthsAgo(clientDef.joinedMonthsAgo),
      });
    }
  }

  if (allPayments.length > 0) {
    await db.collection("payments").insertMany(allPayments);
  }
  const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);
  console.log(`   ✓ Payments: ${allPayments.length} ($${totalRevenue.toLocaleString()} total revenue over 6 months)`);

  // ---- ACTIVITY LOG ----
  const activities = [
    { type: "system", action: "mindbody_sync", description: "Mindbody data sync completed. 53 clients, 2,847 visits, 41 contracts imported.", createdAt: monthsAgo(0) },
    { type: "system", action: "migration_started", description: "Studio migration from Mindbody initiated by Lauren Mitchell", createdAt: monthsAgo(0) },
    { type: "client", action: "bulk_import", description: "53 clients imported from Mindbody", entityType: "client", createdAt: monthsAgo(0) },
  ];
  await db.collection("activities").insertMany(activities.map(a => ({ _id: new ObjectId(), ...a })));

  // ---- MINDBODY SYNC LOG ----
  await db.collection("mindbody_sync_logs").insertOne({
    _id: new ObjectId(),
    establishmentId: ids.studio.toString(),
    syncedBy: ids.adminUser.toString(),
    syncedAt: NOW,
    lookbackMonths: 6,
    stats: {
      clientsImported: clientDefs.length - 2, // exclude pending
      clientsUpdated: 0,
      clientsSkipped: 0,
      visitsImported: allBookings.length,
      contractsImported: clientDefs.filter(c => c.planType !== "drop-in").length,
    },
    totals: {
      totalClients: clientDefs.length,
      totalVisits: allBookings.length,
    },
    status: "completed",
    duration: 47200, // ~47 seconds
  });

  // ---- INTEGRATION CREDENTIALS (Mindbody connected, Twilio NOT set up) ----
  await db.collection("integration_credentials").insertOne({
    _id: new ObjectId(),
    establishmentId: ids.studio.toString(),
    provider: "mindbody",
    credentials: {
      siteId: "-31847",
      apiKey: "mb_demo_key_XXXX",
      username: "lauren@harmonypilates.com",
    },
    connectedAt: NOW,
    lastSyncAt: NOW,
    status: "connected",
    createdAt: NOW,
    updatedAt: NOW,
  });

  // ---- USAGE TRACKING ----
  const currentMonth = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, "0")}`;
  await db.collection("usage_tracking").insertOne({
    _id: new ObjectId(),
    userId: ids.adminUser.toString(),
    monthly: {
      [currentMonth]: {
        messagingBotMessages: 0, // SMS not set up yet!
        aiChats: 0,
        apiCalls: 12, // just the sync
      },
    },
    total: {
      messagingBotMessages: 0,
      aiChats: 0,
      apiCalls: 12,
    },
    storageUsedMB: Math.floor(allBookings.length * 0.002 + clientDefs.length * 0.05 + allClasses.length * 0.003),
  });

  // ---- SUMMARY ----
  console.log("\n" + "=".repeat(55));
  console.log("  HARMONY PILATES & WELLNESS — Migration Complete");
  console.log("=".repeat(55));
  console.log(`
  Studio:      Harmony Pilates & Wellness, Austin TX
  Owner:       Lauren Mitchell (lauren@harmonypilates.com)
  Password:    harmony2026 (all accounts)

  Clients:     ${clientDefs.length} total
    Active:    ${activeCount} (${atRiskCount} at-risk)
    Churned:   ${inactiveCount}
    Pending:   ${pendingCount}

  Staff:       3 (Lauren, Diego, Priya)
  Classes:     ${allClasses.length} (6 months + ${classTemplates.length}/week)
  Bookings:    ${allBookings.length}
    Completed: ${completedBookings} (${((completedBookings / allBookings.length) * 100).toFixed(1)}%)
    No-shows:  ${noShowBookings} (${((noShowBookings / allBookings.length) * 100).toFixed(1)}%)
    Cancelled: ${cancelledBookings}

  Payments:    ${allPayments.length} ($${totalRevenue.toLocaleString()} total)
  Monthly rev: ~$${Math.floor(totalRevenue / 6).toLocaleString()}/mo

  SMS Bot:     ❌ NOT configured (this is what you check!)
  Stripe:      ❌ NOT connected
  Twilio:      ❌ NOT connected

  Mindbody:    ✅ Connected (synced just now)
  `);

  await mongoClient.close();
  console.log("Done!\n");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
