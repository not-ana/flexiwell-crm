/**
 * FlexiWell CRM - Comprehensive Database Seed Script
 *
 * Run with: npx ts-node --esm scripts/seed.ts
 * Or add to package.json: "seed": "ts-node --esm scripts/seed.ts"
 *
 * Profiles:
 *   --profile=full          All data (default)
 *   --profile=onboarding    Only users + staff + settings
 *   --profile=admin-ready   Admin sees data, teacher/client dashboards empty
 *
 * Target dashboard (month period):
 *   Revenue ~$28,400 | Active clients ~94 | New clients +8
 *   Attendance ~91.2% | No-show ~7.8% | Waitlist fills 18/25 (72%)
 */

import { MongoClient, ObjectId } from "mongodb";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Safety guard: never seed production database
const dbName = process.env.MONGODB_DB_NAME || "flexiwell-dev";
if (process.env.NODE_ENV === "production" || dbName === "flexiwell") {
  console.error("\x1b[31m%s\x1b[0m", "ABORT: Cannot seed production database!");
  console.error("Set MONGODB_DB_NAME to a dev/test database name (e.g. flexiwell-dev)");
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/flexiwell";

// ============================================
// HELPERS
// ============================================

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function daysAgo(days: number): Date {
  return daysFromNow(-days);
}

function monthStart(monthsAgo: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function randomInMonth(monthsAgo: number): Date {
  const start = monthStart(monthsAgo);
  const end = monthStart(monthsAgo - 1);
  return randomDate(start, end);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function usPhone(i: number): string {
  const area = 212 + Math.floor(i / 100);
  const mid = 555;
  const last = String(1000 + i).slice(-4);
  return `(${area}) ${mid}-${last}`;
}

// ============================================
// GENERATE IDS UPFRONT
// ============================================

const ids = {
  adminUser: new ObjectId(),
  teacher1User: new ObjectId(),
  teacher2User: new ObjectId(),
  teacher3User: new ObjectId(),
  teacher4User: new ObjectId(),
  teacher5User: new ObjectId(),
  teacher6User: new ObjectId(),

  adminStaff: new ObjectId(),
  staff1: new ObjectId(),
  staff2: new ObjectId(),
  staff3: new ObjectId(),
  staff4: new ObjectId(),
  staff5: new ObjectId(),
  staff6: new ObjectId(),

  unit1: new ObjectId(),
  unit2: new ObjectId(),

  room1: new ObjectId(),
  room2: new ObjectId(),
  room3: new ObjectId(),
  room4: new ObjectId(),
  room5: new ObjectId(),
  room6: new ObjectId(),

  // Class template IDs (for waitlist references)
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
// HERO CLIENTS (hand-defined with avatars)
// ============================================

const heroClientDefs = [
  { name: "Olivia Rhye", email: "olivia@email.com", avatar: "women/1.jpg", planType: "monthly" as const, price: 299, total: 8, used: 3, status: "active" as const, daysAgoCreated: 120, pref: ["pilates", "yoga"] },
  { name: "Phoenix Baker", email: "phoenix@email.com", avatar: "men/2.jpg", planType: "quarterly" as const, price: 799, total: 24, used: 6, status: "active" as const, daysAgoCreated: 200, pref: ["functional"] },
  { name: "Lana Steiner", email: "lana@email.com", avatar: "women/3.jpg", planType: "monthly" as const, price: 299, total: 8, used: 8, status: "inactive" as const, daysAgoCreated: 90, pref: ["yoga", "stretching"] },
  { name: "Demi Wilkinson", email: "demi@email.com", avatar: "women/4.jpg", planType: "monthly" as const, price: 399, total: 12, used: 0, status: "pending" as const, daysAgoCreated: 5, pref: ["pilates"] },
  { name: "Candice Wu", email: "candice@email.com", avatar: "women/5.jpg", planType: "annual" as const, price: 2499, total: 96, used: 32, status: "active" as const, daysAgoCreated: 180, pref: ["yoga", "meditation", "pilates"] },
  { name: "Natali Craig", email: "natali@email.com", avatar: "women/6.jpg", planType: "quarterly" as const, price: 799, total: 24, used: 18, status: "active" as const, daysAgoCreated: 150, pref: ["functional", "pilates"] },
  { name: "Drew Cano", email: "drew@email.com", avatar: "men/7.jpg", planType: "monthly" as const, price: 299, total: 8, used: 5, status: "active" as const, daysAgoCreated: 100, pref: ["functional", "stretching"] },
  { name: "Orlando Diggs", email: "orlando@email.com", avatar: "men/8.jpg", planType: "drop-in" as const, price: 175, total: 5, used: 3, status: "active" as const, daysAgoCreated: 60, pref: ["pilates"] },
  { name: "Andi Lane", email: "andi@email.com", avatar: "women/9.jpg", planType: "monthly" as const, price: 399, total: 12, used: 4, status: "active" as const, daysAgoCreated: 45, pref: ["yoga", "meditation"] },
  { name: "Kate Morrison", email: "kate@email.com", avatar: "women/10.jpg", planType: "quarterly" as const, price: 799, total: 24, used: 2, status: "active" as const, daysAgoCreated: 30, pref: ["pilates", "stretching"] },
  { name: "Koray Okumus", email: "koray@email.com", avatar: "men/11.jpg", planType: "monthly" as const, price: 299, total: 8, used: 2, status: "active" as const, daysAgoCreated: 20, pref: ["functional"] },
  { name: "Marcus Chen", email: "marcus@email.com", avatar: "men/12.jpg", planType: "annual" as const, price: 2699, total: 120, used: 40, status: "active" as const, daysAgoCreated: 240, pref: ["pilates", "functional"] },
  { name: "Sofia Rodriguez", email: "sofia@email.com", avatar: "women/13.jpg", planType: "quarterly" as const, price: 899, total: 36, used: 12, status: "active" as const, daysAgoCreated: 110, pref: ["yoga", "pilates"] },
  { name: "Taylor Brooks", email: "taylor@email.com", avatar: "women/14.jpg", planType: "monthly" as const, price: 349, total: 10, used: 6, status: "active" as const, daysAgoCreated: 85, pref: ["pilates", "barre"] },
  { name: "Jordan Hayes", email: "jordan@email.com", avatar: "men/15.jpg", planType: "monthly" as const, price: 399, total: 12, used: 8, status: "active" as const, daysAgoCreated: 160, pref: ["functional", "pilates"] },
  { name: "Emma Thompson", email: "emma.t@email.com", avatar: "women/16.jpg", planType: "annual" as const, price: 2199, total: 96, used: 55, status: "active" as const, daysAgoCreated: 280, pref: ["yoga", "meditation"] },
  { name: "Ryan Patel", email: "ryan.p@email.com", avatar: "men/17.jpg", planType: "quarterly" as const, price: 799, total: 24, used: 10, status: "active" as const, daysAgoCreated: 70, pref: ["functional", "stretching"] },
  { name: "Madison Clark", email: "madison@email.com", avatar: "women/18.jpg", planType: "monthly" as const, price: 249, total: 8, used: 1, status: "pending" as const, daysAgoCreated: 3, pref: ["pilates"] },
  { name: "Derek Washington", email: "derek@email.com", avatar: "men/19.jpg", planType: "monthly" as const, price: 299, total: 8, used: 8, status: "inactive" as const, daysAgoCreated: 130, pref: ["functional"] },
  { name: "Jasmine Lee", email: "jasmine@email.com", avatar: "women/20.jpg", planType: "quarterly" as const, price: 899, total: 36, used: 20, status: "inactive" as const, daysAgoCreated: 200, pref: ["yoga", "pilates"] },
];

// Build hero client objects
const heroClientIds: ObjectId[] = heroClientDefs.map(() => new ObjectId());
const heroUserIds: ObjectId[] = heroClientDefs.map(() => new ObjectId());

function buildHeroClients() {
  return heroClientDefs.map((def, i) => {
    const startDate = def.planType === "annual" ? daysAgo(120) :
                      def.planType === "quarterly" ? daysAgo(30) : daysAgo(15);
    const endDays = def.planType === "annual" ? 245 :
                    def.planType === "quarterly" ? 60 : 15;
    return {
      _id: heroClientIds[i],
      name: def.name,
      email: def.email,
      phone: usPhone(i + 1),
      avatar: `https://randomuser.me/api/portraits/${def.avatar}`,
      plan: {
        type: def.planType,
        totalClasses: def.total,
        usedClasses: def.used,
        remainingClasses: def.total - def.used,
        startDate,
        endDate: daysFromNow(endDays),
        price: def.price,
      },
      status: def.status,
      preferences: {
        preferredClassTypes: def.pref,
        notifications: { email: true, whatsapp: false, instagram: false, sms: true },
      },
      createdAt: daysAgo(def.daysAgoCreated),
      updatedAt: def.status === "inactive" ? daysAgo(45) : new Date(),
    };
  });
}

function buildHeroUsers() {
  return heroClientDefs.map((def, i) => ({
    _id: heroUserIds[i],
    email: def.email,
    name: def.name,
    role: "client",
    phone: usPhone(i + 1),
    avatar: `https://randomuser.me/api/portraits/${def.avatar}`,
    clientId: heroClientIds[i].toString(),
    isActive: def.status !== "inactive",
    lastLoginAt: def.status === "inactive" ? daysAgo(30) : daysAgo(Math.floor(Math.random() * 7)),
    createdAt: daysAgo(def.daysAgoCreated),
    updatedAt: new Date(),
  }));
}

// ============================================
// PROGRAMMATIC CLIENTS (~80 more)
// ============================================

const FIRST_NAMES_F = [
  "Ashley", "Brittany", "Chelsea", "Diana", "Elena", "Fiona", "Grace", "Hannah",
  "Isabelle", "Julia", "Karen", "Laura", "Megan", "Nicole", "Patricia", "Quinn",
  "Rebecca", "Samantha", "Tiffany", "Ursula", "Victoria", "Whitney", "Ximena",
  "Yolanda", "Zoe", "Abigail", "Bella", "Chloe", "Daisy", "Eva", "Faith",
  "Gina", "Heather", "Iris", "Jade", "Kaitlyn", "Lily", "Molly", "Nina", "Paige",
];

const FIRST_NAMES_M = [
  "Adam", "Brian", "Chris", "Daniel", "Ethan", "Frank", "George", "Henry",
  "Ivan", "Jack", "Kevin", "Luis", "Mike", "Nathan", "Oscar", "Paul",
  "Raymond", "Steve", "Tom", "Victor", "William", "Xavier", "Zachary",
  "Aaron", "Ben", "Carlos", "David", "Eric", "Fred", "Grant", "Hugo",
  "Ian", "James", "Kyle", "Leo", "Matt", "Neil", "Owen", "Pete",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Martinez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson",
  "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
  "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott",
  "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker",
  "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts", "Gomez", "Phillips",
  "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes",
  "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz",
  "Morgan", "Cooper", "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos",
  "Kim", "Cox", "Ward", "Richardson", "Watson", "Brooks", "Chavez", "Wood",
];

const CLASS_TYPES = ["pilates", "yoga", "functional", "stretching", "meditation", "barre"];

type PlanType = "monthly" | "quarterly" | "annual" | "drop-in" | "trial";

interface PlanConfig {
  type: PlanType;
  price: number;
  total: number;
  durationDays: number;
}

const PLAN_OPTIONS: PlanConfig[] = [
  // Monthly plans (40%)
  { type: "monthly", price: 249, total: 8, durationDays: 30 },
  { type: "monthly", price: 299, total: 8, durationDays: 30 },
  { type: "monthly", price: 349, total: 10, durationDays: 30 },
  { type: "monthly", price: 399, total: 12, durationDays: 30 },
  // Quarterly plans (25%)
  { type: "quarterly", price: 699, total: 24, durationDays: 90 },
  { type: "quarterly", price: 799, total: 24, durationDays: 90 },
  { type: "quarterly", price: 899, total: 36, durationDays: 90 },
  // Annual plans (20%)
  { type: "annual", price: 2199, total: 96, durationDays: 365 },
  { type: "annual", price: 2499, total: 96, durationDays: 365 },
  { type: "annual", price: 2699, total: 120, durationDays: 365 },
  // Drop-in (10%)
  { type: "drop-in", price: 175, total: 5, durationDays: 90 },
  { type: "drop-in", price: 315, total: 9, durationDays: 90 },
  { type: "drop-in", price: 350, total: 10, durationDays: 90 },
  // Trial (5%)
  { type: "trial", price: 49, total: 3, durationDays: 14 },
];

function pickPlan(): PlanConfig {
  const r = Math.random();
  if (r < 0.40) return pick(PLAN_OPTIONS.filter(p => p.type === "monthly"));
  if (r < 0.65) return pick(PLAN_OPTIONS.filter(p => p.type === "quarterly"));
  if (r < 0.85) return pick(PLAN_OPTIONS.filter(p => p.type === "annual"));
  if (r < 0.95) return pick(PLAN_OPTIONS.filter(p => p.type === "drop-in"));
  return PLAN_OPTIONS[PLAN_OPTIONS.length - 1]; // trial
}

const programmaticClientIds: ObjectId[] = [];
const programmaticUserIds: ObjectId[] = [];
const programmaticClientData: Array<{
  _id: ObjectId;
  name: string;
  email: string;
  phone: string;
  plan: { type: string; totalClasses: number; usedClasses: number; remainingClasses: number; startDate: Date; endDate: Date; price: number };
  status: string;
  preferences: { preferredClassTypes: string[]; notifications: { email: boolean; whatsapp: boolean; instagram: boolean; sms: boolean } };
  createdAt: Date;
  updatedAt: Date;
}> = [];

const usedNames = new Set<string>();

function generateProgrammaticClients(count: number) {
  // Target: 94 active total, 4 inactive, 2 pending = 100
  // Heroes give us: 15 active, 3 inactive, 2 pending = 20
  // So programmatic needs: 79 active, 1 inactive, 0 pending = 80
  const activeTarget = count - 1;
  const inactiveTarget = 1;

  for (let i = 0; i < count; i++) {
    const clientId = new ObjectId();
    const userId = new ObjectId();
    programmaticClientIds.push(clientId);
    programmaticUserIds.push(userId);

    let name: string;
    do {
      const isFemale = Math.random() < 0.65;
      const first = isFemale ? pick(FIRST_NAMES_F) : pick(FIRST_NAMES_M);
      const last = pick(LAST_NAMES);
      name = `${first} ${last}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    const plan = pickPlan();
    const status = i < activeTarget ? "active" : "inactive";

    // Spread createdAt over last 12 months (more recent = more, showing growth)
    // Weighted towards recent months
    const monthsAgoWeight = Math.pow(Math.random(), 1.5) * 12;
    const createdAt = daysAgo(Math.floor(monthsAgoWeight * 30));

    const usedClasses = status === "active"
      ? Math.floor(Math.random() * (plan.total * 0.7))
      : plan.total;

    const startDate = daysAgo(Math.floor(Math.random() * plan.durationDays * 0.5));

    programmaticClientData.push({
      _id: clientId,
      name,
      email: name.toLowerCase().replace(/ /g, ".") + "@email.com",
      phone: usPhone(100 + i),
      plan: {
        type: plan.type,
        totalClasses: plan.total,
        usedClasses,
        remainingClasses: plan.total - usedClasses,
        startDate,
        endDate: new Date(startDate.getTime() + plan.durationDays * 86400000),
        price: plan.price,
      },
      status,
      preferences: {
        preferredClassTypes: pickN(CLASS_TYPES, 1 + Math.floor(Math.random() * 3)),
        notifications: { email: true, whatsapp: false, instagram: false, sms: true },
      },
      createdAt,
      updatedAt: status === "inactive" ? daysAgo(45) : new Date(),
    });
  }
}

// ============================================
// STATIC SEED DATA
// ============================================

const teacherDefs = [
  {
    userId: ids.teacher1User, staffId: ids.staff1,
    name: "Emily Ferreira", email: "emily@flexiwell.com", phone: usPhone(1001),
    avatar: "women/32.jpg",
    bio: "Certified Pilates and Yoga instructor with over 10 years of experience. Specialized in rehabilitation and postural strengthening.",
    specialties: ["Pilates", "Yoga", "Stretching", "Meditation"],
    unit: "FlexiWell Downtown", unitId: ids.unit1,
    schedule: [
      { day: "monday", slots: [{ start: "07:00", end: "12:00" }, { start: "14:00", end: "19:00" }] },
      { day: "tuesday", slots: [{ start: "07:00", end: "12:00" }] },
      { day: "wednesday", slots: [{ start: "07:00", end: "12:00" }, { start: "14:00", end: "19:00" }] },
      { day: "thursday", slots: [{ start: "14:00", end: "20:00" }] },
      { day: "friday", slots: [{ start: "07:00", end: "12:00" }] },
    ],
    rating: { average: 4.8, totalReviews: 47, breakdown: { five: 38, four: 7, three: 2, two: 0, one: 0 } },
    daysAgoCreated: 300,
  },
  {
    userId: ids.teacher2User, staffId: ids.staff2,
    name: "James Cooper", email: "james@flexiwell.com", phone: usPhone(1002),
    avatar: "men/35.jpg",
    bio: "Personal Trainer and Functional Training instructor. Specialist in physical conditioning and athletic preparation.",
    specialties: ["Functional", "Core", "HIIT", "Strength Training"],
    unit: "FlexiWell Downtown", unitId: ids.unit1,
    schedule: [
      { day: "monday", slots: [{ start: "06:00", end: "11:00" }, { start: "17:00", end: "21:00" }] },
      { day: "tuesday", slots: [{ start: "06:00", end: "11:00" }, { start: "17:00", end: "21:00" }] },
      { day: "wednesday", slots: [{ start: "17:00", end: "21:00" }] },
      { day: "thursday", slots: [{ start: "06:00", end: "11:00" }, { start: "17:00", end: "21:00" }] },
      { day: "friday", slots: [{ start: "06:00", end: "11:00" }] },
      { day: "saturday", slots: [{ start: "08:00", end: "12:00" }] },
    ],
    rating: { average: 4.6, totalReviews: 32, breakdown: { five: 22, four: 8, three: 1, two: 1, one: 0 } },
    daysAgoCreated: 250,
  },
  {
    userId: ids.teacher3User, staffId: ids.staff3,
    name: "Rachel Adams", email: "rachel@flexiwell.com", phone: usPhone(1003),
    avatar: "women/28.jpg",
    bio: "Yoga and Meditation teacher. Certified in Hatha Yoga and Mindfulness.",
    specialties: ["Yoga", "Meditation", "Breathwork", "Stretching"],
    unit: "FlexiWell Midtown", unitId: ids.unit2,
    schedule: [
      { day: "monday", slots: [{ start: "08:00", end: "12:00" }] },
      { day: "tuesday", slots: [{ start: "08:00", end: "12:00" }, { start: "18:00", end: "21:00" }] },
      { day: "wednesday", slots: [{ start: "08:00", end: "12:00" }] },
      { day: "thursday", slots: [{ start: "08:00", end: "12:00" }, { start: "18:00", end: "21:00" }] },
      { day: "friday", slots: [{ start: "08:00", end: "12:00" }] },
    ],
    rating: { average: 4.9, totalReviews: 28, breakdown: { five: 26, four: 2, three: 0, two: 0, one: 0 } },
    daysAgoCreated: 180,
  },
  {
    userId: ids.teacher4User, staffId: ids.staff4,
    name: "Carlos Reyes", email: "carlos@flexiwell.com", phone: usPhone(1004),
    avatar: "men/40.jpg",
    bio: "Pilates Reformer specialist with 8 years teaching experience. Focus on athletic performance and injury prevention.",
    specialties: ["Pilates", "Reformer", "Core", "Rehabilitation"],
    unit: "FlexiWell Downtown", unitId: ids.unit1,
    schedule: [
      { day: "monday", slots: [{ start: "12:00", end: "17:00" }] },
      { day: "tuesday", slots: [{ start: "12:00", end: "17:00" }] },
      { day: "wednesday", slots: [{ start: "07:00", end: "12:00" }] },
      { day: "thursday", slots: [{ start: "07:00", end: "12:00" }] },
      { day: "friday", slots: [{ start: "12:00", end: "17:00" }] },
      { day: "saturday", slots: [{ start: "09:00", end: "13:00" }] },
    ],
    rating: { average: 4.7, totalReviews: 35, breakdown: { five: 28, four: 5, three: 2, two: 0, one: 0 } },
    daysAgoCreated: 220,
  },
  {
    userId: ids.teacher5User, staffId: ids.staff5,
    name: "Mia Tanaka", email: "mia@flexiwell.com", phone: usPhone(1005),
    avatar: "women/45.jpg",
    bio: "Barre and Pilates instructor. Combines dance-inspired movement with pilates precision for a full-body workout.",
    specialties: ["Barre", "Pilates", "Dance", "Flexibility"],
    unit: "FlexiWell Midtown", unitId: ids.unit2,
    schedule: [
      { day: "monday", slots: [{ start: "09:00", end: "14:00" }, { start: "17:00", end: "20:00" }] },
      { day: "tuesday", slots: [{ start: "17:00", end: "20:00" }] },
      { day: "wednesday", slots: [{ start: "09:00", end: "14:00" }, { start: "17:00", end: "20:00" }] },
      { day: "thursday", slots: [{ start: "09:00", end: "14:00" }] },
      { day: "friday", slots: [{ start: "09:00", end: "14:00" }, { start: "17:00", end: "20:00" }] },
    ],
    rating: { average: 4.8, totalReviews: 22, breakdown: { five: 19, four: 2, three: 1, two: 0, one: 0 } },
    daysAgoCreated: 150,
  },
  {
    userId: ids.teacher6User, staffId: ids.staff6,
    name: "Alex Rivera", email: "alex@flexiwell.com", phone: usPhone(1006),
    avatar: "men/50.jpg",
    bio: "Functional training and HIIT specialist. Former college athlete focused on high-performance wellness programs.",
    specialties: ["Functional", "HIIT", "Strength", "Conditioning"],
    unit: "FlexiWell Downtown", unitId: ids.unit1,
    schedule: [
      { day: "monday", slots: [{ start: "06:00", end: "09:00" }, { start: "18:00", end: "21:00" }] },
      { day: "tuesday", slots: [{ start: "06:00", end: "09:00" }] },
      { day: "wednesday", slots: [{ start: "06:00", end: "09:00" }, { start: "18:00", end: "21:00" }] },
      { day: "thursday", slots: [{ start: "18:00", end: "21:00" }] },
      { day: "friday", slots: [{ start: "06:00", end: "09:00" }, { start: "18:00", end: "21:00" }] },
      { day: "saturday", slots: [{ start: "08:00", end: "11:00" }] },
    ],
    rating: { average: 4.5, totalReviews: 18, breakdown: { five: 13, four: 3, three: 1, two: 1, one: 0 } },
    daysAgoCreated: 120,
  },
];

function buildStaff() {
  return [
    {
      _id: ids.adminStaff,
      name: "Sarah Mitchell",
      email: "admin@flexiwell.com",
      phone: usPhone(1000),
      role: "admin",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      bio: "Founder and administrator of FlexiWell Studio. Passionate about wellness and health.",
      status: "active",
      createdAt: daysAgo(365),
      updatedAt: new Date(),
    },
    ...teacherDefs.map(t => ({
      _id: t.staffId,
      name: t.name,
      email: t.email,
      phone: t.phone,
      role: "teacher",
      avatar: `https://randomuser.me/api/portraits/${t.avatar}`,
      bio: t.bio,
      specialties: t.specialties,
      schedule: t.schedule,
      status: "active",
      unit: t.unit,
      establishmentId: t.unitId.toString(),
      rating: t.rating,
      createdAt: daysAgo(t.daysAgoCreated),
      updatedAt: new Date(),
    })),
  ];
}

function buildTeacherUsers() {
  return teacherDefs.map(t => ({
    _id: t.userId,
    email: t.email,
    name: t.name,
    role: "teacher",
    phone: t.phone,
    avatar: `https://randomuser.me/api/portraits/${t.avatar}`,
    staffId: t.staffId.toString(),
    isActive: true,
    lastLoginAt: daysAgo(Math.floor(Math.random() * 3)),
    createdAt: daysAgo(t.daysAgoCreated),
    updatedAt: new Date(),
  }));
}

// ============================================
// SEED DATA OBJECT
// ============================================

const seedData = {
  units: [
    {
      _id: ids.unit1,
      name: "FlexiWell Downtown",
      location: "Downtown, New York",
      address: "123 Broadway, Downtown, New York - NY, 10001",
      phone: "(212) 555-1111",
      assignedTeachers: [ids.staff1.toString(), ids.staff2.toString(), ids.staff4.toString(), ids.staff6.toString()],
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
      assignedTeachers: [ids.staff3.toString(), ids.staff5.toString()],
      rooms: ["Main Studio", "Zen Room", "Reformer Room"],
      isActive: true,
      createdAt: daysAgo(200),
      updatedAt: new Date(),
    },
  ],

  rooms: [
    { _id: ids.room1, name: "Studio A", establishmentId: ids.unit1.toString(), capacity: 15, equipment: ["Mats", "Yoga Blocks", "Resistance Bands"], isActive: true, createdAt: daysAgo(365), updatedAt: new Date() },
    { _id: ids.room2, name: "Studio B", establishmentId: ids.unit1.toString(), capacity: 12, equipment: ["Mats", "Pilates Balls", "Foam Rollers"], isActive: true, createdAt: daysAgo(365), updatedAt: new Date() },
    { _id: ids.room3, name: "Reformer Room", establishmentId: ids.unit1.toString(), capacity: 8, equipment: ["Reformer Allegro", "Cadillac", "Chair"], isActive: true, createdAt: daysAgo(365), updatedAt: new Date() },
    { _id: ids.room4, name: "Main Studio", establishmentId: ids.unit2.toString(), capacity: 20, equipment: ["Mats", "Yoga Blocks", "Blankets", "Meditation Cushions"], isActive: true, createdAt: daysAgo(200), updatedAt: new Date() },
    { _id: ids.room5, name: "Zen Room", establishmentId: ids.unit2.toString(), capacity: 10, equipment: ["Meditation Cushions", "Blankets", "Aromatherapy Diffuser"], isActive: true, createdAt: daysAgo(200), updatedAt: new Date() },
    { _id: ids.room6, name: "Reformer Room", establishmentId: ids.unit2.toString(), capacity: 6, equipment: ["Reformer Allegro", "Pilates Ring"], isActive: true, createdAt: daysAgo(150), updatedAt: new Date() },
  ],

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
      whatsappEnabled: false,
      smsEnabled: true,
      primaryMessagingChannel: "sms",
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
      whatsappConnected: false,
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

// Class templates across both locations
const classTemplates = [
  // Downtown (unit1) classes
  { title: "Morning Yoga", type: "yoga", desc: "Start your day with an invigorating Hatha Yoga practice.", sid: ids.staff1, sname: "Emily Ferreira", start: "07:00", end: "08:00", dur: 60, cap: 15, loc: "Studio A", eid: ids.unit1, dow: 1 },
  { title: "Pilates Reformer", type: "pilates", desc: "Pilates class on Reformer machines. Focus on strength and posture.", sid: ids.staff1, sname: "Emily Ferreira", start: "09:00", end: "10:00", dur: 60, cap: 8, loc: "Reformer Room", eid: ids.unit1, dow: 1 },
  { title: "Functional Training", type: "functional", desc: "Intense functional strength training. All levels welcome.", sid: ids.staff2, sname: "James Cooper", start: "18:00", end: "19:00", dur: 60, cap: 15, loc: "Studio A", eid: ids.unit1, dow: 1 },
  { title: "Lunchtime Pilates", type: "pilates", desc: "Quick and effective mat pilates for your lunch break.", sid: ids.staff4, sname: "Carlos Reyes", start: "12:30", end: "13:15", dur: 45, cap: 12, loc: "Studio B", eid: ids.unit1, dow: 1 },
  { title: "Early HIIT", type: "functional", desc: "High-intensity interval training to start your day strong.", sid: ids.staff6, sname: "Alex Rivera", start: "06:30", end: "07:15", dur: 45, cap: 15, loc: "Studio A", eid: ids.unit1, dow: 1 },
  { title: "Core Power", type: "functional", desc: "Focus on core strengthening and stabilization.", sid: ids.staff2, sname: "James Cooper", start: "07:00", end: "08:00", dur: 60, cap: 12, loc: "Studio B", eid: ids.unit1, dow: 2 },
  { title: "Reformer Intermediate", type: "pilates", desc: "Intermediate level Reformer class.", sid: ids.staff4, sname: "Carlos Reyes", start: "14:00", end: "15:00", dur: 60, cap: 8, loc: "Reformer Room", eid: ids.unit1, dow: 2 },
  { title: "Mat Pilates", type: "pilates", desc: "Mat Pilates focusing on stretching and strengthening.", sid: ids.staff1, sname: "Emily Ferreira", start: "10:00", end: "11:00", dur: 60, cap: 15, loc: "Studio A", eid: ids.unit1, dow: 3 },
  { title: "HIIT Express", type: "functional", desc: "High-intensity interval training. 45 minutes.", sid: ids.staff2, sname: "James Cooper", start: "19:00", end: "19:45", dur: 45, cap: 15, loc: "Studio A", eid: ids.unit1, dow: 3 },
  { title: "Reformer Flow", type: "pilates", desc: "Flowing reformer sequences for all levels.", sid: ids.staff4, sname: "Carlos Reyes", start: "08:00", end: "09:00", dur: 60, cap: 8, loc: "Reformer Room", eid: ids.unit1, dow: 3 },
  { title: "Deep Stretch", type: "stretching", desc: "Session focused on flexibility and muscle relaxation.", sid: ids.staff1, sname: "Emily Ferreira", start: "17:00", end: "18:00", dur: 60, cap: 15, loc: "Studio B", eid: ids.unit1, dow: 4 },
  { title: "Strength & Conditioning", type: "functional", desc: "Full-body strength workout with conditioning elements.", sid: ids.staff6, sname: "Alex Rivera", start: "18:30", end: "19:30", dur: 60, cap: 15, loc: "Studio A", eid: ids.unit1, dow: 4 },
  { title: "Intermediate Pilates Reformer", type: "pilates", desc: "Intermediate level Reformer class.", sid: ids.staff1, sname: "Emily Ferreira", start: "08:00", end: "09:00", dur: 60, cap: 8, loc: "Reformer Room", eid: ids.unit1, dow: 5 },
  { title: "Power Hour", type: "functional", desc: "Full-body functional workout.", sid: ids.staff6, sname: "Alex Rivera", start: "17:30", end: "18:30", dur: 60, cap: 15, loc: "Studio A", eid: ids.unit1, dow: 5 },
  { title: "Saturday Functional", type: "functional", desc: "Functional training to start your weekend right.", sid: ids.staff2, sname: "James Cooper", start: "09:00", end: "10:00", dur: 60, cap: 15, loc: "Studio A", eid: ids.unit1, dow: 6 },
  { title: "Saturday Reformer", type: "pilates", desc: "Weekend reformer class for all levels.", sid: ids.staff4, sname: "Carlos Reyes", start: "10:30", end: "11:30", dur: 60, cap: 8, loc: "Reformer Room", eid: ids.unit1, dow: 6 },
  // Midtown (unit2) classes
  { title: "Yoga Flow", type: "yoga", desc: "Dynamic Vinyasa Yoga connecting movement and breath.", sid: ids.staff3, sname: "Rachel Adams", start: "09:00", end: "10:00", dur: 60, cap: 20, loc: "Main Studio", eid: ids.unit2, dow: 2 },
  { title: "Guided Meditation", type: "meditation", desc: "Meditation session for relaxation and mental clarity.", sid: ids.staff3, sname: "Rachel Adams", start: "19:00", end: "20:00", dur: 60, cap: 10, loc: "Zen Room", eid: ids.unit2, dow: 2 },
  { title: "Barre Fusion", type: "barre", desc: "Ballet-inspired barre workout combined with pilates.", sid: ids.staff5, sname: "Mia Tanaka", start: "10:00", end: "11:00", dur: 60, cap: 15, loc: "Main Studio", eid: ids.unit2, dow: 1 },
  { title: "Barre Sculpt", type: "barre", desc: "Sculpting barre class targeting glutes, legs, and core.", sid: ids.staff5, sname: "Mia Tanaka", start: "18:00", end: "19:00", dur: 60, cap: 15, loc: "Main Studio", eid: ids.unit2, dow: 3 },
  { title: "Midtown Mat Pilates", type: "pilates", desc: "Classic mat pilates at our Midtown location.", sid: ids.staff5, sname: "Mia Tanaka", start: "10:00", end: "11:00", dur: 60, cap: 15, loc: "Main Studio", eid: ids.unit2, dow: 5 },
  { title: "Restorative Yoga", type: "yoga", desc: "Gentle and restorative practice. Ideal for recovery.", sid: ids.staff3, sname: "Rachel Adams", start: "19:00", end: "20:00", dur: 60, cap: 12, loc: "Main Studio", eid: ids.unit2, dow: 4 },
  { title: "Midtown Reformer", type: "pilates", desc: "Reformer class at Midtown location.", sid: ids.staff5, sname: "Mia Tanaka", start: "11:30", end: "12:30", dur: 60, cap: 6, loc: "Reformer Room", eid: ids.unit2, dow: 4 },
  { title: "Morning Meditation", type: "meditation", desc: "Start your day centered and calm.", sid: ids.staff3, sname: "Rachel Adams", start: "08:00", end: "08:45", dur: 45, cap: 10, loc: "Zen Room", eid: ids.unit2, dow: 1 },
];

function getAllClientRefs(): Array<{ id: ObjectId; name: string }> {
  const heroActive = heroClientDefs
    .filter(d => d.status === "active")
    .map((d, i) => ({ id: heroClientIds[heroClientDefs.indexOf(d)], name: d.name }));
  const progActive = programmaticClientData
    .filter(c => c.status === "active")
    .map(c => ({ id: c._id, name: c.name }));
  return [...heroActive, ...progActive];
}

function generateClasses(): GeneratedClass[] {
  const classes: GeneratedClass[] = [];
  const now = new Date();
  const currentDay = now.getDay();

  // Generate classes for past 3 weeks and next 2 weeks
  for (let weekOffset = -3; weekOffset <= 2; weekOffset++) {
    classTemplates.forEach((template) => {
      const classDate = new Date(now);
      const daysUntilClass = (template.dow - currentDay + 7) % 7;
      classDate.setDate(classDate.getDate() + daysUntilClass + (weekOffset * 7));
      classDate.setHours(0, 0, 0, 0);

      const isPast = classDate < now;
      const allClients = getAllClientRefs();

      // Realistic enrollment: 60-100% capacity
      const enrollmentCount = Math.min(
        Math.floor(template.cap * (0.6 + Math.random() * 0.4)),
        allClients.length
      );
      const waitlistCount = isPast ? 0 : Math.floor(Math.random() * 3);

      const shuffledClients = [...allClients].sort(() => Math.random() - 0.5);
      const enrolledClients = shuffledClients.slice(0, enrollmentCount).map((c) => ({
        clientId: c.id.toString(),
        clientName: c.name,
        status: isPast ? "confirmed" : (Math.random() > 0.1 ? "confirmed" : "pending"),
        enrolledAt: randomDate(daysAgo(14), new Date()),
      }));

      const waitlistClients = shuffledClients.slice(enrollmentCount, enrollmentCount + waitlistCount).map((c) => ({
        clientId: c.id.toString(),
        clientName: c.name,
        addedAt: randomDate(daysAgo(7), new Date()),
      }));

      classes.push({
        _id: new ObjectId(),
        title: template.title,
        type: template.type,
        description: template.desc,
        instructorId: template.sid.toString(),
        instructorName: template.sname,
        scheduledDate: classDate,
        startTime: template.start,
        endTime: template.end,
        duration: template.dur,
        maxCapacity: template.cap,
        currentEnrollment: enrollmentCount,
        enrolledClients,
        waitlist: waitlistClients,
        status: isPast ? "completed" : "scheduled",
        location: template.loc,
        establishmentId: template.eid.toString(),
        createdAt: daysAgo(30),
        updatedAt: new Date(),
      });
    });
  }

  return classes;
}

function generateBookings(classes: GeneratedClass[]) {
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

  // Target: ~91.2% completed, ~7.8% no-show for past bookings
  // That means out of completed+no-show, ~92.1% completed and ~7.9% no-show
  // (some future bookings are "confirmed"/"pending" which don't count)
  classes.forEach((classItem) => {
    classItem.enrolledClients.forEach((enrolled) => {
      const isPast = classItem.scheduledDate < new Date();

      let status: string;
      if (isPast) {
        // ~92.1% completed, ~7.9% no-show for past bookings
        status = Math.random() < 0.079 ? "no-show" : "completed";
      } else {
        status = enrolled.status === "confirmed" ? "confirmed" : "pending";
      }

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
        status,
        source: Math.random() > 0.3 ? "web" : (Math.random() > 0.5 ? "bot" : "admin"),
        createdAt: enrolled.enrolledAt,
        updatedAt: new Date(),
      });
    });
  });

  return bookings;
}

/**
 * Generate payments to hit revenue targets per month.
 * Revenue trend (last 6 months):
 *   Oct (5 months ago): ~$18,000
 *   Nov (4 months ago): ~$20,000
 *   Dec (3 months ago): ~$22,000
 *   Jan (2 months ago): ~$24,000
 *   Feb (1 month ago):  ~$24,900
 *   Mar (current month): ~$28,400
 */
function generatePayments(): GeneratedPayment[] {
  const payments: GeneratedPayment[] = [];
  const allClients = [
    ...buildHeroClients().filter(c => c.status === "active"),
    ...programmaticClientData.filter(c => c.status === "active"),
  ];

  const monthlyTargets = [
    { monthsAgo: 5, target: 18000 },
    { monthsAgo: 4, target: 20000 },
    { monthsAgo: 3, target: 22000 },
    { monthsAgo: 2, target: 24000 },
    { monthsAgo: 1, target: 24900 },
    { monthsAgo: 0, target: 28400 },
  ];

  const planPeriod = (type: string) =>
    type === "monthly" ? "30 days" : type === "quarterly" ? "90 days" : type === "annual" ? "365 days" : "Drop-in";

  for (const { monthsAgo, target } of monthlyTargets) {
    let running = 0;
    const shuffled = [...allClients].sort(() => Math.random() - 0.5);

    for (const client of shuffled) {
      if (running >= target) break;

      // Determine payment amount: use the client's plan price, possibly adjusted
      let amount = client.plan.price;

      // For annual/quarterly plans, we record monthly portions sometimes,
      // but mostly full payments for subscription types
      if (client.plan.type === "annual") {
        // Annual clients pay once but appear as a big payment in one month
        // Only add if we haven't exceeded target significantly
        if (running + amount > target * 1.3) {
          // Use a monthly-equivalent instead
          amount = Math.round(client.plan.price / 12);
        }
      } else if (client.plan.type === "quarterly") {
        if (running + amount > target * 1.15) {
          amount = Math.round(client.plan.price / 3);
        }
      }

      if (running + amount > target * 1.05) continue;

      const paidAt = randomInMonth(monthsAgo);

      payments.push({
        _id: new ObjectId(),
        clientId: client._id.toString(),
        clientName: client.name,
        amount,
        currency: "USD",
        type: client.plan.type === "drop-in" || client.plan.type === "trial" ? "drop-in" : "subscription",
        planDetails: {
          type: client.plan.type,
          classes: client.plan.totalClasses,
          period: planPeriod(client.plan.type),
        },
        status: "completed",
        paymentMethod: Math.random() > 0.3 ? "credit_card" : "debit_card",
        transactionId: `txn_${Math.random().toString(36).substring(2, 10)}`,
        createdAt: paidAt,
        paidAt,
      });

      running += amount;
    }

    // If we're still under target, add fill payments from random clients
    while (running < target * 0.98) {
      const client = pick(allClients);
      const fillAmount = Math.min(
        pick([249, 299, 349, 399]),
        target - running + 50
      );
      const paidAt = randomInMonth(monthsAgo);

      payments.push({
        _id: new ObjectId(),
        clientId: client._id.toString(),
        clientName: client.name,
        amount: fillAmount,
        currency: "USD",
        type: "subscription",
        planDetails: { type: "monthly", classes: 8, period: "30 days" },
        status: "completed",
        paymentMethod: "credit_card",
        transactionId: `txn_${Math.random().toString(36).substring(2, 10)}`,
        createdAt: paidAt,
        paidAt,
      });

      running += fillAmount;
    }
  }

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
    "Love the vibe at FlexiWell. Every class is well-organized and fun.",
    "The barre classes are my favorite. Mia is an incredible instructor!",
    "Carlos really knows reformer work. Best reformer teacher in NYC.",
    "Alex's HIIT classes push me to my limits in the best way possible.",
  ];

  const clientRefs = getAllClientRefs().slice(0, 20);

  teacherDefs.forEach((teacher) => {
    const numReviews = 5 + Math.floor(Math.random() * 6);
    const selected = pickN(clientRefs, Math.min(numReviews, clientRefs.length));

    selected.forEach((client) => {
      const rating = Math.random() > 0.15 ? 5 : (Math.random() > 0.3 ? 4 : 3);
      reviews.push({
        _id: new ObjectId(),
        staffId: teacher.staffId.toString(),
        staffName: teacher.name,
        clientId: client.id.toString(),
        clientName: client.name,
        rating,
        comment: pick(comments),
        status: "approved",
        isPublic: true,
        createdAt: randomDate(daysAgo(90), daysAgo(1)),
        updatedAt: new Date(),
      });
    });
  });

  return reviews;
}

/**
 * Generate waitlist entries.
 * Target: 25 entries this month (createdAt >= month start), 18 confirmed (72%), 7 other statuses
 */
function generateWaitlistEntries() {
  const entries: Array<{
    _id: ObjectId;
    clientId: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    clientSource: string;
    classId: string;
    className: string;
    priority: number;
    position: number;
    status: string;
    notifiedAt?: Date;
    expiresAt?: Date;
    confirmedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  const clientRefs = getAllClientRefs();
  const classNames = ["Pilates Reformer", "Morning Yoga", "HIIT Express", "Yoga Flow", "Mat Pilates", "Core Power", "Functional Training", "Deep Stretch", "Barre Fusion", "Reformer Flow", "Barre Sculpt", "Power Hour"];
  const sources = ["direct", "direct", "direct", "package", "package", "trial"];
  const classIdPool = [ids.class1, ids.class2, ids.class3, ids.class4, ids.class5, ids.class6, ids.class7, ids.class8];

  // 18 confirmed entries this month (updatedAt >= month start for dashboard query)
  for (let i = 0; i < 18; i++) {
    const client = clientRefs[i % clientRefs.length];
    const createdDaysAgo = Math.floor(Math.random() * 7) + 1; // created 1-7 days ago
    const confirmedDaysAgo = Math.max(0, createdDaysAgo - 1);
    const createdAt = daysAgo(createdDaysAgo);
    const confirmedAt = daysAgo(confirmedDaysAgo);

    entries.push({
      _id: new ObjectId(),
      clientId: client.id.toString(),
      clientName: client.name,
      clientEmail: client.name.toLowerCase().replace(/ /g, ".") + "@email.com",
      clientPhone: usPhone(2000 + i),
      clientSource: pick(sources),
      classId: pick(classIdPool).toString(),
      className: pick(classNames),
      priority: 80 + Math.floor(Math.random() * 40),
      position: 1,
      status: "confirmed",
      notifiedAt: confirmedAt,
      confirmedAt,
      createdAt,
      updatedAt: confirmedAt, // updatedAt is what the dashboard checks
    });
  }

  // 3 currently waiting entries (created this month)
  for (let i = 0; i < 3; i++) {
    const client = clientRefs[18 + i];
    entries.push({
      _id: new ObjectId(),
      clientId: client.id.toString(),
      clientName: client.name,
      clientEmail: client.name.toLowerCase().replace(/ /g, ".") + "@email.com",
      clientPhone: usPhone(2100 + i),
      clientSource: pick(sources),
      classId: pick(classIdPool).toString(),
      className: pick(classNames),
      priority: 50 + Math.floor(Math.random() * 60),
      position: 1 + i,
      status: "waiting",
      createdAt: daysAgo(Math.floor(Math.random() * 3) + 1),
      updatedAt: new Date(),
    });
  }

  // 2 notified entries (created this month)
  for (let i = 0; i < 2; i++) {
    const client = clientRefs[21 + i];
    const notifiedAt = new Date(Date.now() - (5 + i * 10) * 60 * 1000);
    entries.push({
      _id: new ObjectId(),
      clientId: client.id.toString(),
      clientName: client.name,
      clientEmail: client.name.toLowerCase().replace(/ /g, ".") + "@email.com",
      clientPhone: usPhone(2200 + i),
      clientSource: "direct",
      classId: pick(classIdPool).toString(),
      className: pick(classNames),
      priority: 100 + Math.floor(Math.random() * 15),
      position: 1,
      status: "notified",
      notifiedAt,
      expiresAt: new Date(notifiedAt.getTime() + 30 * 60 * 1000),
      createdAt: daysAgo(2),
      updatedAt: new Date(),
    });
  }

  // 2 expired entries (created this month, total = 25)
  for (let i = 0; i < 2; i++) {
    const client = clientRefs[23 + i];
    const notifiedAt = daysAgo(3 + i);
    entries.push({
      _id: new ObjectId(),
      clientId: client.id.toString(),
      clientName: client.name,
      clientEmail: client.name.toLowerCase().replace(/ /g, ".") + "@email.com",
      clientPhone: usPhone(2300 + i),
      clientSource: "direct",
      classId: pick(classIdPool).toString(),
      className: pick(classNames),
      priority: 90 + Math.floor(Math.random() * 20),
      position: 1,
      status: "expired",
      notifiedAt,
      expiresAt: notifiedAt,
      createdAt: daysAgo(5 + i),
      updatedAt: notifiedAt,
    });
  }

  // A few older entries from previous months for historical context
  for (let i = 0; i < 8; i++) {
    const client = clientRefs[i + 30];
    const mAgo = 1 + Math.floor(Math.random() * 3);
    const createdAt = randomInMonth(mAgo);
    const isConfirmed = Math.random() < 0.6;

    entries.push({
      _id: new ObjectId(),
      clientId: client.id.toString(),
      clientName: client.name,
      clientEmail: client.name.toLowerCase().replace(/ /g, ".") + "@email.com",
      clientPhone: usPhone(2400 + i),
      clientSource: pick(sources),
      classId: pick(classIdPool).toString(),
      className: pick(classNames),
      priority: 60 + Math.floor(Math.random() * 50),
      position: 1,
      status: isConfirmed ? "confirmed" : "expired",
      notifiedAt: isConfirmed ? new Date(createdAt.getTime() + 86400000) : createdAt,
      confirmedAt: isConfirmed ? new Date(createdAt.getTime() + 86400000) : undefined,
      expiresAt: isConfirmed ? undefined : createdAt,
      createdAt,
      updatedAt: new Date(createdAt.getTime() + 86400000),
    });
  }

  return entries;
}

function generateNotificationLogs() {
  const logs: Array<{
    _id: ObjectId;
    type: string;
    clientId: string;
    clientName: string;
    content: string;
    channel: string;
    status: string;
    error?: string;
    sentAt: Date;
    createdAt: Date;
  }> = [];

  const clientRefs = getAllClientRefs().slice(0, 20);
  const classNames = ["Pilates Reformer", "Morning Yoga", "Core Power", "Yoga Flow", "Mat Pilates", "HIIT Express", "Barre Fusion"];

  // SMS notifications (primary channel)
  for (let i = 0; i < 18; i++) {
    const client = clientRefs[i % clientRefs.length];
    const sentAt = daysAgo(Math.floor(Math.random() * 14));
    logs.push({
      _id: new ObjectId(),
      type: "waitlist_spot_available",
      clientId: client.id.toString(),
      clientName: client.name,
      content: pick(classNames),
      channel: "sms",
      status: "sent",
      sentAt,
      createdAt: sentAt,
    });
  }

  // A few failed SMS
  for (let i = 0; i < 3; i++) {
    const client = clientRefs[15 + i];
    const sentAt = daysAgo(Math.floor(Math.random() * 20) + 5);
    logs.push({
      _id: new ObjectId(),
      type: "waitlist_spot_available",
      clientId: client.id.toString(),
      clientName: client.name,
      content: pick(classNames),
      channel: "sms",
      status: "failed",
      error: "Phone number unreachable",
      sentAt,
      createdAt: sentAt,
    });
  }

  // Email notifications
  for (let i = 0; i < 10; i++) {
    const client = clientRefs[i % clientRefs.length];
    const sentAt = daysAgo(Math.floor(Math.random() * 14));
    logs.push({
      _id: new ObjectId(),
      type: "booking_reminder",
      clientId: client.id.toString(),
      clientName: client.name,
      content: pick(classNames),
      channel: "email",
      status: "sent",
      sentAt,
      createdAt: sentAt,
    });
  }

  return logs;
}

function generateActivities(bookings: ReturnType<typeof generateBookings>) {
  const activities: Array<{
    _id: ObjectId;
    type: string;
    action: string;
    description: string;
    entityId?: string;
    entityType: string;
    userName?: string;
    createdAt: Date;
  }> = [];

  // Recent booking activities
  bookings.slice(0, 25).forEach((booking) => {
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

  // Client registration activities (new clients this month)
  const allClients = [...buildHeroClients(), ...programmaticClientData];
  const monthStartDate = monthStart(0);
  allClients
    .filter(c => c.createdAt >= monthStartDate)
    .slice(0, 10)
    .forEach((client) => {
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
    userName: "Andi Lane",
    createdAt: daysAgo(1),
  });
  activities.push({
    _id: new ObjectId(),
    type: "payment",
    action: "create",
    description: "Payment received: $799.00 - Quarterly Plan",
    entityType: "payment",
    userName: "Kate Morrison",
    createdAt: daysAgo(3),
  });
  activities.push({
    _id: new ObjectId(),
    type: "payment",
    action: "create",
    description: "Payment received: $2,499.00 - Annual Plan",
    entityType: "payment",
    userName: "Candice Wu",
    createdAt: daysAgo(5),
  });

  activities.push({
    _id: new ObjectId(),
    type: "system",
    action: "backup",
    description: "Automatic backup completed successfully",
    entityType: "system",
    createdAt: daysAgo(1),
  });

  return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ============================================
// SEED PROFILES
// ============================================

type SeedProfile = "full" | "onboarding" | "admin-ready";

const profileDescriptions: Record<SeedProfile, string> = {
  full: "Full data -- all users, clients, classes, bookings, payments (default)",
  onboarding: "Onboarding test -- only users + staff + studio settings, empty dashboards",
  "admin-ready": "Admin populated -- admin sees full data, teacher/client dashboards empty",
};

function getProfile(): SeedProfile {
  const profileArg = process.argv.find(arg => arg.startsWith("--profile="));
  if (profileArg) {
    const value = profileArg.split("=")[1] as SeedProfile;
    if (!["full", "onboarding", "admin-ready"].includes(value)) {
      console.error(`Invalid profile: ${value}`);
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
  console.log("Starting comprehensive database seed...\n");
  console.log(`Profile: ${profile}`);
  console.log(`   ${profileDescriptions[profile]}\n`);

  // Generate programmatic clients first (needed by generators)
  generateProgrammaticClients(80);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB\n");

    const db = client.db(dbName);

    // Clear existing data
    console.log("Clearing existing data...");
    const collections = [
      "users", "staff", "clients", "classes", "bookings", "units",
      "rooms", "payments", "reviews", "waitlist", "notification_logs", "activities",
      "studio_settings", "requests", "conversations", "support_tickets",
      "integration_credentials", "sms_bot_config"
    ];

    for (const collection of collections) {
      await db.collection(collection).deleteMany({});
    }
    console.log("Existing data cleared\n");

    // Generate dynamic data
    let classes: GeneratedClass[] = [];
    let bookings: ReturnType<typeof generateBookings> = [];
    let payments: GeneratedPayment[] = [];
    let reviews: GeneratedReview[] = [];
    let waitlistEntries: ReturnType<typeof generateWaitlistEntries> = [];
    let notificationLogs: ReturnType<typeof generateNotificationLogs> = [];
    let activities: ReturnType<typeof generateActivities> = [];

    if (profile !== "onboarding") {
      console.log("Generating dynamic data...");
      classes = generateClasses();
      bookings = generateBookings(classes);
      payments = generatePayments();
      reviews = generateReviews();
      waitlistEntries = generateWaitlistEntries();
      notificationLogs = generateNotificationLogs();
      activities = generateActivities(bookings);
      console.log("Dynamic data generated\n");
    }

    // --- Always created: users, staff, studio settings ---

    // Build all users
    const adminUser = {
      _id: ids.adminUser,
      email: "admin@flexiwell.com",
      name: "Sarah Mitchell",
      role: "admin",
      phone: usPhone(1000),
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      staffId: ids.adminStaff.toString(),
      isActive: true,
      lastLoginAt: new Date(),
      subscriptionStatus: "active",
      planTier: "retention_pro",
      stripeCustomerId: "cus_demo_admin",
      stripeSubscriptionId: "sub_demo_admin",
      trialStatus: "converted",
      createdAt: daysAgo(365),
      updatedAt: new Date(),
    };

    const teacherUsers = buildTeacherUsers();
    const heroUsers = buildHeroUsers();
    const programmaticUsers = programmaticClientData.map((c, i) => ({
      _id: programmaticUserIds[i],
      email: c.email,
      name: c.name,
      role: "client",
      phone: c.phone,
      clientId: c._id.toString(),
      isActive: c.status !== "inactive",
      lastLoginAt: c.status === "inactive" ? daysAgo(30) : daysAgo(Math.floor(Math.random() * 7)),
      createdAt: c.createdAt,
      updatedAt: new Date(),
    }));

    // Empty accounts for testing empty-state dashboards
    // They have a unique establishmentId so all queries return zero data
    const emptyAdminStaffId = new ObjectId();
    const emptyTeacherStaffId = new ObjectId();
    const emptyEstablishmentId = new ObjectId().toString();

    const emptyAdminUser = {
      _id: new ObjectId(),
      email: "newadmin@flexiwell.com",
      name: "New Admin",
      role: "admin",
      phone: usPhone(2000),
      staffId: emptyAdminStaffId.toString(),
      establishmentId: emptyEstablishmentId,
      isActive: true,
      lastLoginAt: new Date(),
      subscriptionStatus: "active",
      planTier: "retention_pro",
      trialStatus: "converted",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const emptyTeacherUser = {
      _id: new ObjectId(),
      email: "newteacher@flexiwell.com",
      name: "New Teacher",
      role: "teacher",
      phone: usPhone(2001),
      staffId: emptyTeacherStaffId.toString(),
      establishmentId: emptyEstablishmentId,
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const emptyStaff = [
      {
        _id: emptyAdminStaffId,
        name: "New Admin",
        email: "newadmin@flexiwell.com",
        phone: usPhone(2000),
        role: "admin",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: emptyTeacherStaffId,
        name: "New Teacher",
        email: "newteacher@flexiwell.com",
        phone: usPhone(2001),
        role: "teacher",
        specialties: ["Yoga"],
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const allUsers = [adminUser, emptyAdminUser, emptyTeacherUser, ...teacherUsers, ...heroUsers, ...programmaticUsers];

    console.log("Creating users...");
    const usersWithPasswords = await Promise.all(
      allUsers.map(async (user) => ({
        ...user,
        password: await hashPassword("password123"),
      }))
    );
    await db.collection("users").insertMany(usersWithPasswords);
    console.log(`   Created ${usersWithPasswords.length} users (2 admins, 7 teachers, ${heroUsers.length + programmaticUsers.length} clients)`);

    // Insert staff
    console.log("Creating staff...");
    const staffData = buildStaff();
    await db.collection("staff").insertMany([...staffData, ...emptyStaff]);
    console.log(`   Created ${staffData.length + emptyStaff.length} staff members (${emptyStaff.length} empty)`);

    // Insert studio settings
    console.log("Creating studio settings...");
    await db.collection("studio_settings").insertOne(seedData.studioSettings);
    console.log("   Studio settings configured (SMS as primary messaging)");

    // Insert Twilio SMS credentials (Sara's account has SMS active)
    console.log("Creating SMS integration...");
    await db.collection("integration_credentials").insertOne({
      establishmentId: ids.adminUser.toString(),
      provider: "twilio_sms",
      accountSid: "AC_demo_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "encrypted_demo_token",
      phoneNumber: "+12125550100",
      botEnabled: true,
      isConnected: true,
      createdAt: daysAgo(90),
      updatedAt: new Date(),
    });

    // Insert SMS bot menu config
    await db.collection("sms_bot_config").insertOne({
      establishmentId: ids.adminUser.toString(),
      commands: [
        { id: "1", trigger: "1", label: "My Classes", action: "MY_BOOKINGS", enabled: true, order: 1 },
        { id: "2", trigger: "2", label: "Book Class", action: "BOOK_CLASS", enabled: true, order: 2 },
        { id: "3", trigger: "3", label: "Cancel", action: "CANCEL_BOOKING", enabled: true, order: 3 },
        { id: "4", trigger: "4", label: "Credits", action: "REMAINING_CREDITS", enabled: true, order: 4 },
        { id: "5", trigger: "5", label: "Support", action: "CONTACT_SUPPORT", enabled: true, order: 5 },
      ],
      welcomeMessage: "Hi {name}! Welcome to FlexiWell Studio. How can I help you today?",
      createdAt: daysAgo(90),
      updatedAt: new Date(),
    });
    console.log("   SMS bot configured (Twilio active, 5 menu commands)");

    // --- Conditionally created based on profile ---

    if (profile !== "onboarding") {
      // Insert clients
      const allClients = [...buildHeroClients(), ...programmaticClientData];
      console.log("Creating clients...");
      await db.collection("clients").insertMany(allClients);
      const activeCount = allClients.filter(c => c.status === "active").length;
      const inactiveCount = allClients.filter(c => c.status === "inactive").length;
      const pendingCount = allClients.filter(c => c.status === "pending").length;
      console.log(`   Created ${allClients.length} clients (${activeCount} active, ${inactiveCount} inactive, ${pendingCount} pending)`);

      // Insert units
      console.log("Creating establishments...");
      await db.collection("units").insertMany(seedData.units);
      console.log(`   Created ${seedData.units.length} establishments`);

      // Insert rooms
      console.log("Creating rooms...");
      await db.collection("rooms").insertMany(seedData.rooms);
      console.log(`   Created ${seedData.rooms.length} rooms`);

      if (profile === "admin-ready") {
        const phantomStaffId = new ObjectId().toString();
        const phantomClientIds = Array.from({ length: 20 }, () => new ObjectId().toString());
        const phantomClientNames = Array.from({ length: 20 }, (_, i) => `Demo Student ${i + 1}`);

        const modifiedClasses = classes.map(c => ({
          ...c,
          instructorId: phantomStaffId,
          instructorName: "Studio Instructor",
          enrolledClients: c.enrolledClients.map((ec, i) => ({
            ...ec,
            clientId: phantomClientIds[i % phantomClientIds.length],
            clientName: phantomClientNames[i % phantomClientNames.length],
          })),
          waitlist: c.waitlist.map((w, i) => ({
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

        console.log("Creating classes (admin-ready: phantom instructors)...");
        await db.collection("classes").insertMany(modifiedClasses);
        console.log(`   Created ${modifiedClasses.length} classes`);

        console.log("Creating bookings (admin-ready: phantom clients)...");
        await db.collection("bookings").insertMany(modifiedBookings);
        console.log(`   Created ${modifiedBookings.length} bookings`);
      } else {
        console.log("Creating classes...");
        await db.collection("classes").insertMany(classes);
        console.log(`   Created ${classes.length} classes (past and upcoming)`);

        console.log("Creating bookings...");
        await db.collection("bookings").insertMany(bookings);
        console.log(`   Created ${bookings.length} bookings`);
      }

      console.log("Creating payments...");
      await db.collection("payments").insertMany(payments);
      console.log(`   Created ${payments.length} payment records`);

      console.log("Creating reviews...");
      await db.collection("reviews").insertMany(reviews);
      console.log(`   Created ${reviews.length} instructor reviews`);

      console.log("Creating waitlist entries...");
      await db.collection("waitlist").insertMany(waitlistEntries);
      console.log(`   Created ${waitlistEntries.length} waitlist entries`);

      console.log("Creating notification logs...");
      await db.collection("notification_logs").insertMany(notificationLogs);
      console.log(`   Created ${notificationLogs.length} notification logs`);

      console.log("Creating activity logs...");
      await db.collection("activities").insertMany(activities);
      console.log(`   Created ${activities.length} activity records`);
    } else {
      console.log("Skipping business data (onboarding profile)\n");
    }

    // Create indexes
    console.log("\nCreating indexes...");
    // Unique indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("staff").createIndex({ email: 1 }, { unique: true });
    await db.collection("clients").createIndex({ email: 1 }, { unique: true });
    // Clients
    await db.collection("clients").createIndex({ status: 1 });
    await db.collection("clients").createIndex({ establishmentId: 1 });
    await db.collection("clients").createIndex({ "healthScore.overall": 1 });
    await db.collection("clients").createIndex({ lifecycleStage: 1 });
    await db.collection("clients").createIndex({ deletedAt: 1 }, { sparse: true });
    // Staff
    await db.collection("staff").createIndex({ establishmentId: 1 });
    await db.collection("staff").createIndex({ deletedAt: 1 }, { sparse: true });
    // Classes
    await db.collection("classes").createIndex({ scheduledDate: 1 });
    await db.collection("classes").createIndex({ instructorId: 1 });
    await db.collection("classes").createIndex({ establishmentId: 1 });
    await db.collection("classes").createIndex({ status: 1, scheduledDate: 1 });
    // Bookings
    await db.collection("bookings").createIndex({ clientId: 1 });
    await db.collection("bookings").createIndex({ classId: 1 });
    await db.collection("bookings").createIndex({ scheduledDate: 1 });
    await db.collection("bookings").createIndex({ status: 1 });
    await db.collection("bookings").createIndex({ clientId: 1, scheduledDate: -1 });
    // Payments
    await db.collection("payments").createIndex({ clientId: 1 });
    await db.collection("payments").createIndex({ status: 1 });
    // Reviews
    await db.collection("reviews").createIndex({ staffId: 1 });
    // Activities
    await db.collection("activities").createIndex({ createdAt: -1 });
    await db.collection("activities").createIndex({ entityId: 1, entityType: 1 });
    // Users - billing
    await db.collection("users").createIndex({ stripeCustomerId: 1 }, { sparse: true });
    await db.collection("users").createIndex({ establishmentId: 1 });
    await db.collection("users").createIndex({ trialEndDate: 1 }, { sparse: true });
    // Establishments
    await db.collection("establishments").createIndex({ ownerId: 1 });
    // Waitlist
    await db.collection("waitlist_entries").createIndex({ classId: 1, status: 1 });
    await db.collection("waitlist_entries").createIndex({ clientId: 1 });
    // Health assessments
    await db.collection("health_assessments").createIndex({ clientId: 1 });
    await db.collection("health_assessments").createIndex({ status: 1 });
    await db.collection("health_assessment_tokens").createIndex({ token: 1 }, { unique: true });
    await db.collection("health_assessment_tokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    // Usage tracking
    await db.collection("usage_tracking").createIndex({ userId: 1 }, { unique: true });
    // Subscription events
    await db.collection("subscription_events").createIndex({ userId: 1, createdAt: -1 });
    await db.collection("subscription_events").createIndex({ stripeEventId: 1 }, { unique: true, sparse: true });
    // Coupons
    await db.collection("coupons").createIndex({ code: 1 }, { unique: true });
    await db.collection("coupons").createIndex({ isActive: 1, expiresAt: 1 });
    // Refund requests
    await db.collection("refund_requests").createIndex({ userId: 1 });
    await db.collection("refund_requests").createIndex({ status: 1 });
    // Pricing audit
    await db.collection("pricing_audit").createIndex({ userId: 1, createdAt: -1 });
    // Support tickets
    await db.collection("support_tickets").createIndex({ status: 1 });
    await db.collection("support_tickets").createIndex({ clientId: 1 });
    // Bot sessions
    await db.collection("bot_sessions").createIndex({ platformUserId: 1, platform: 1 });
    await db.collection("bot_sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log("   All indexes created\n");

    // Summary
    console.log("=".repeat(50));
    console.log("DATABASE SEED COMPLETED SUCCESSFULLY!");
    console.log(`   Profile: ${profile}`);
    console.log("=".repeat(50));
    console.log("\nSummary:");
    console.log(`   Users: ${usersWithPasswords.length} (1 admin, 6 teachers, ${heroUsers.length + programmaticUsers.length} clients)`);
    console.log(`   Staff: ${staffData.length}`);
    if (profile !== "onboarding") {
      const allClients = [...buildHeroClients(), ...programmaticClientData];
      console.log(`   Clients: ${allClients.length} (${allClients.filter(c => c.status === "active").length} active)`);
      console.log(`   Establishments: ${seedData.units.length}`);
      console.log(`   Rooms: ${seedData.rooms.length}`);
      console.log(`   Classes: ${classes.length}`);
      console.log(`   Bookings: ${bookings.length}`);
      console.log(`   Payments: ${payments.length}`);
      console.log(`   Reviews: ${reviews.length}`);
      console.log(`   Waitlist: ${waitlistEntries.length}`);
      console.log(`   Notification logs: ${notificationLogs.length}`);
      console.log(`   Activities: ${activities.length}`);
      if (profile === "admin-ready") {
        console.log("\n   Note: Classes use phantom instructor IDs (teacher dashboards empty)");
        console.log("   Note: Bookings use phantom client IDs (client dashboards empty)");
      }
    } else {
      console.log("   (No business data -- onboarding profile)");
    }

    console.log("\nTest Credentials:");
    console.log("   +-------------------------------------------------+");
    console.log("   | ADMIN                                           |");
    console.log("   | Email: admin@flexiwell.com                      |");
    console.log("   | Password: password123                           |");
    console.log("   +-------------------------------------------------+");
    console.log("   | ADMIN (empty dashboard)                         |");
    console.log("   | Email: newadmin@flexiwell.com                   |");
    console.log("   | Password: password123                           |");
    console.log("   +-------------------------------------------------+");
    console.log("   | TEACHERS                                        |");
    console.log("   | Email: emily@flexiwell.com                      |");
    console.log("   | Email: james@flexiwell.com                      |");
    console.log("   | Email: rachel@flexiwell.com                     |");
    console.log("   | Email: carlos@flexiwell.com                     |");
    console.log("   | Email: mia@flexiwell.com                        |");
    console.log("   | Email: alex@flexiwell.com                       |");
    console.log("   | Password: password123                           |");
    console.log("   +-------------------------------------------------+");
    console.log("   | TEACHER (empty dashboard)                       |");
    console.log("   | Email: newteacher@flexiwell.com                 |");
    console.log("   | Password: password123                           |");
    console.log("   +-------------------------------------------------+");
    console.log("   | CLIENTS                                         |");
    console.log("   | Email: olivia@email.com                         |");
    console.log("   | Email: phoenix@email.com                        |");
    console.log("   | Email: candice@email.com                        |");
    console.log("   | ... and 97 more clients                         |");
    console.log("   | Password: password123                           |");
    console.log("   +-------------------------------------------------+");
    console.log("");

  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run seed with selected profile
seed(getProfile());
