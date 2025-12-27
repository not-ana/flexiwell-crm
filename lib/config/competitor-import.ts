// Competitor Import Configuration
// Allows studios to migrate from competing platforms

export type CompetitorPlatform =
  | "mindbody"
  | "glofox"
  | "zen_planner"
  | "marianatek"
  | "momence"
  | "vagaro"
  | "acuity"
  | "fitdegree"
  | "wellness_living"
  | "pike13"
  | "other";

export interface CompetitorConfig {
  id: CompetitorPlatform;
  name: string;
  logo: string;
  color: string;
  importMethods: ImportMethod[];
  dataTypes: DataType[];
  estimatedTime: string;
  difficulty: "easy" | "medium" | "hard";
  popularity: number; // 1-10
  region: "us" | "global" | "latam";
}

export type ImportMethod = "csv" | "api" | "manual" | "migration_service";

export type DataType =
  | "clients"
  | "memberships"
  | "classes"
  | "schedule"
  | "transactions"
  | "staff"
  | "pricing"
  | "attendance_history";

export const competitorPlatforms: CompetitorConfig[] = [
  {
    id: "mindbody",
    name: "Mindbody",
    logo: "/competitors/mindbody.svg",
    color: "#00A3E0",
    importMethods: ["csv", "api", "migration_service"],
    dataTypes: ["clients", "memberships", "classes", "schedule", "transactions", "staff", "attendance_history"],
    estimatedTime: "24-48 hours",
    difficulty: "medium",
    popularity: 10,
    region: "global",
  },
  {
    id: "glofox",
    name: "Glofox",
    logo: "/competitors/glofox.svg",
    color: "#FF6B35",
    importMethods: ["csv", "api"],
    dataTypes: ["clients", "memberships", "classes", "schedule", "staff"],
    estimatedTime: "12-24 hours",
    difficulty: "easy",
    popularity: 8,
    region: "global",
  },
  {
    id: "zen_planner",
    name: "Zen Planner",
    logo: "/competitors/zenplanner.svg",
    color: "#1B4B66",
    importMethods: ["csv", "migration_service"],
    dataTypes: ["clients", "memberships", "classes", "schedule", "transactions"],
    estimatedTime: "24-48 hours",
    difficulty: "medium",
    popularity: 7,
    region: "us",
  },
  {
    id: "marianatek",
    name: "Mariana Tek",
    logo: "/competitors/marianatek.svg",
    color: "#6B4EAE",
    importMethods: ["csv", "api"],
    dataTypes: ["clients", "memberships", "classes", "schedule", "staff", "attendance_history"],
    estimatedTime: "12-24 hours",
    difficulty: "easy",
    popularity: 7,
    region: "us",
  },
  {
    id: "momence",
    name: "Momence",
    logo: "/competitors/momence.svg",
    color: "#FF5757",
    importMethods: ["csv", "api"],
    dataTypes: ["clients", "memberships", "classes", "schedule", "transactions", "staff"],
    estimatedTime: "12-24 hours",
    difficulty: "easy",
    popularity: 6,
    region: "us",
  },
  {
    id: "vagaro",
    name: "Vagaro",
    logo: "/competitors/vagaro.svg",
    color: "#5C9EAD",
    importMethods: ["csv"],
    dataTypes: ["clients", "memberships", "classes", "schedule"],
    estimatedTime: "24-48 hours",
    difficulty: "medium",
    popularity: 6,
    region: "us",
  },
  {
    id: "acuity",
    name: "Acuity Scheduling",
    logo: "/competitors/acuity.svg",
    color: "#006699",
    importMethods: ["csv", "api"],
    dataTypes: ["clients", "schedule"],
    estimatedTime: "4-8 hours",
    difficulty: "easy",
    popularity: 5,
    region: "global",
  },
  {
    id: "fitdegree",
    name: "FitDegree",
    logo: "/competitors/fitdegree.svg",
    color: "#FF6B6B",
    importMethods: ["csv"],
    dataTypes: ["clients", "memberships", "classes"],
    estimatedTime: "12-24 hours",
    difficulty: "medium",
    popularity: 4,
    region: "latam",
  },
  {
    id: "wellness_living",
    name: "WellnessLiving",
    logo: "/competitors/wellnessliving.svg",
    color: "#00B4D8",
    importMethods: ["csv", "api", "migration_service"],
    dataTypes: ["clients", "memberships", "classes", "schedule", "transactions", "staff"],
    estimatedTime: "24-48 hours",
    difficulty: "medium",
    popularity: 7,
    region: "global",
  },
  {
    id: "pike13",
    name: "Pike13",
    logo: "/competitors/pike13.svg",
    color: "#4A90A4",
    importMethods: ["csv"],
    dataTypes: ["clients", "memberships", "schedule", "transactions"],
    estimatedTime: "24-48 hours",
    difficulty: "medium",
    popularity: 5,
    region: "us",
  },
];

// Import wizard steps
export interface ImportStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
}

export const importSteps: ImportStep[] = [
  {
    id: "select_platform",
    title: "Select Platform",
    description: "Choose the platform you're migrating from",
    required: true,
  },
  {
    id: "connect",
    title: "Connect or Upload",
    description: "Connect via API or upload your exported data",
    required: true,
  },
  {
    id: "map_fields",
    title: "Map Fields",
    description: "Match your data fields to FlexiWell fields",
    required: true,
  },
  {
    id: "preview",
    title: "Preview",
    description: "Review the data before importing",
    required: true,
  },
  {
    id: "import",
    title: "Import",
    description: "Import your data into FlexiWell",
    required: true,
  },
  {
    id: "verify",
    title: "Verify",
    description: "Check that everything imported correctly",
    required: true,
  },
];

// Field mapping configuration
export interface FieldMapping {
  source: string;
  target: string;
  transform?: "direct" | "date" | "currency" | "phone" | "custom";
  required: boolean;
}

export const defaultClientFieldMappings: FieldMapping[] = [
  { source: "first_name", target: "firstName", required: true },
  { source: "last_name", target: "lastName", required: true },
  { source: "email", target: "email", required: true },
  { source: "phone", target: "phone", transform: "phone", required: false },
  { source: "date_of_birth", target: "dateOfBirth", transform: "date", required: false },
  { source: "address", target: "address", required: false },
  { source: "membership_type", target: "membershipId", transform: "custom", required: false },
  { source: "join_date", target: "createdAt", transform: "date", required: false },
  { source: "notes", target: "notes", required: false },
];

// Migration service info
export interface MigrationService {
  name: string;
  description: string;
  price: string;
  includes: string[];
  turnaround: string;
}

export const migrationService: MigrationService = {
  name: "White Glove Migration",
  description: "Let our team handle the entire migration process for you",
  price: "$299",
  includes: [
    "Dedicated migration specialist",
    "Full data export from your current platform",
    "Data cleaning and validation",
    "Custom field mapping",
    "Historical data preservation",
    "Staff training session (1 hour)",
    "30-day post-migration support",
  ],
  turnaround: "3-5 business days",
};

// Import status tracking
export type ImportStatus =
  | "pending"
  | "connecting"
  | "uploading"
  | "mapping"
  | "validating"
  | "importing"
  | "completed"
  | "failed"
  | "cancelled";

export interface ImportJob {
  id: string;
  platform: CompetitorPlatform;
  status: ImportStatus;
  progress: number;
  dataTypes: DataType[];
  recordCounts: {
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
  };
  errors: ImportError[];
  startedAt: Date;
  completedAt?: Date;
}

export interface ImportError {
  row: number;
  field: string;
  value: string;
  error: string;
}

// Helper functions
export function getCompetitorByPopularity(region?: string): CompetitorConfig[] {
  let platforms = [...competitorPlatforms];
  if (region) {
    platforms = platforms.filter(p => p.region === region || p.region === "global");
  }
  return platforms.sort((a, b) => b.popularity - a.popularity);
}

export function getImportMethodLabel(method: ImportMethod): string {
  const labels: Record<ImportMethod, string> = {
    csv: "CSV Upload",
    api: "API Connection",
    manual: "Manual Entry",
    migration_service: "Migration Service",
  };
  return labels[method];
}

export function getDataTypeLabel(type: DataType): string {
  const labels: Record<DataType, string> = {
    clients: "Clients",
    memberships: "Memberships & Packages",
    classes: "Class Types",
    schedule: "Schedule & Bookings",
    transactions: "Payment History",
    staff: "Staff & Instructors",
    pricing: "Pricing Plans",
    attendance_history: "Attendance History",
  };
  return labels[type];
}

export function estimateImportDuration(
  platform: CompetitorConfig,
  recordCount: number
): string {
  // Base time in minutes
  const baseMinutes = platform.difficulty === "easy" ? 30 :
                      platform.difficulty === "medium" ? 60 : 120;

  // Add time based on record count (roughly 1 min per 1000 records)
  const recordMinutes = Math.ceil(recordCount / 1000);

  const totalMinutes = baseMinutes + recordMinutes;

  if (totalMinutes < 60) {
    return `~${totalMinutes} minutes`;
  } else if (totalMinutes < 120) {
    return "~1 hour";
  } else {
    return `~${Math.ceil(totalMinutes / 60)} hours`;
  }
}
