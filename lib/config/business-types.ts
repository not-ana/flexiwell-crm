// Business Types Configuration
// Allows FlexiWell to be used for different wellness business types

export type BusinessType =
  | "pilates"
  | "yoga"
  | "personal_training"
  | "fitness"
  | "spa"
  | "physical_therapy"
  | "other";

export interface BusinessTypeConfig {
  id: BusinessType;
  name: string;
  description: string;
  icon: string; // emoji for quick identification
  terminology: BusinessTerminology;
}

// Terminology mapping for different business types
export interface BusinessTerminology {
  // Sessions
  class: string;
  classes: string;
  classType: string;

  // People
  teacher: string;
  teachers: string;
  client: string;
  clients: string;
  student: string;
  students: string;

  // Actions
  book: string;
  booking: string;
  schedule: string;

  // Facilities
  studio: string;
  room: string;
  location: string;

  // Other
  session: string;
  workout: string;
  appointment: string;
}

// Default English terminology
const defaultTerminology: BusinessTerminology = {
  class: "Class",
  classes: "Classes",
  classType: "Class Type",
  teacher: "Instructor",
  teachers: "Instructors",
  client: "Client",
  clients: "Clients",
  student: "Student",
  students: "Students",
  book: "Book",
  booking: "Booking",
  schedule: "Schedule",
  studio: "Studio",
  room: "Room",
  location: "Location",
  session: "Session",
  workout: "Workout",
  appointment: "Appointment",
};

// Business type configurations
export const businessTypes: Record<BusinessType, BusinessTypeConfig> = {
  pilates: {
    id: "pilates",
    name: "Pilates Studio",
    description: "Pilates studios and reformer classes",
    icon: "🧘‍♀️",
    terminology: {
      ...defaultTerminology,
      class: "Class",
      classes: "Classes",
      teacher: "Instructor",
      teachers: "Instructors",
      student: "Student",
      students: "Students",
      session: "Session",
    },
  },

  yoga: {
    id: "yoga",
    name: "Yoga Studio",
    description: "Yoga studios and meditation centers",
    icon: "🧘",
    terminology: {
      ...defaultTerminology,
      class: "Class",
      classes: "Classes",
      teacher: "Teacher",
      teachers: "Teachers",
      student: "Practitioner",
      students: "Practitioners",
      session: "Practice",
    },
  },

  personal_training: {
    id: "personal_training",
    name: "Personal Training",
    description: "Personal trainers and one-on-one coaching",
    icon: "💪",
    terminology: {
      ...defaultTerminology,
      class: "Session",
      classes: "Sessions",
      classType: "Training Type",
      teacher: "Trainer",
      teachers: "Trainers",
      client: "Client",
      clients: "Clients",
      student: "Client",
      students: "Clients",
      session: "Training Session",
      appointment: "Session",
    },
  },

  fitness: {
    id: "fitness",
    name: "Fitness Center",
    description: "General fitness gyms and health clubs",
    icon: "🏃",
    terminology: {
      ...defaultTerminology,
      class: "Class",
      classes: "Classes",
      teacher: "Instructor",
      teachers: "Instructors",
      client: "Member",
      clients: "Members",
      studio: "Gym",
      session: "Workout",
    },
  },

  spa: {
    id: "spa",
    name: "Spa & Wellness",
    description: "Day spas and wellness centers",
    icon: "🧖",
    terminology: {
      ...defaultTerminology,
      class: "Treatment",
      classes: "Treatments",
      classType: "Service Type",
      teacher: "Therapist",
      teachers: "Therapists",
      client: "Guest",
      clients: "Guests",
      student: "Guest",
      students: "Guests",
      studio: "Spa",
      room: "Treatment Room",
      session: "Appointment",
      appointment: "Booking",
    },
  },

  physical_therapy: {
    id: "physical_therapy",
    name: "Physical Therapy",
    description: "Physical therapy and rehabilitation clinics",
    icon: "🏥",
    terminology: {
      ...defaultTerminology,
      class: "Session",
      classes: "Sessions",
      classType: "Treatment Type",
      teacher: "Therapist",
      teachers: "Therapists",
      client: "Patient",
      clients: "Patients",
      student: "Patient",
      students: "Patients",
      studio: "Clinic",
      room: "Treatment Room",
      session: "Appointment",
      appointment: "Session",
    },
  },

  other: {
    id: "other",
    name: "Other",
    description: "Custom wellness business",
    icon: "✨",
    terminology: defaultTerminology,
  },
};

// Custom terminology interface for "other" business type
export interface CustomTerminology {
  classes: string;
  teachers: string;
  clients: string;
  studio: string;
}

// Helper functions
export function getBusinessType(type: BusinessType): BusinessTypeConfig {
  return businessTypes[type] || businessTypes.other;
}

export function getTerminology(type: BusinessType): BusinessTerminology {
  return getBusinessType(type).terminology;
}

export function getTerm(type: BusinessType, term: keyof BusinessTerminology): string {
  return getTerminology(type)[term];
}

// Get terminology with custom overrides for "other" business type
export function getEffectiveTerminology(
  type: BusinessType,
  customTerminology?: CustomTerminology
): BusinessTerminology {
  const baseTerminology = getTerminology(type);

  // If it's "other" and custom terminology is provided, merge it
  if (type === "other" && customTerminology) {
    return {
      ...baseTerminology,
      classes: customTerminology.classes || baseTerminology.classes,
      teachers: customTerminology.teachers || baseTerminology.teachers,
      clients: customTerminology.clients || baseTerminology.clients,
      studio: customTerminology.studio || baseTerminology.studio,
    };
  }

  return baseTerminology;
}

// Get a specific term with custom override support
export function getEffectiveTerm(
  type: BusinessType,
  term: keyof BusinessTerminology,
  customTerminology?: CustomTerminology
): string {
  return getEffectiveTerminology(type, customTerminology)[term];
}

// Get all business types as array for select options
export function getBusinessTypeOptions(): { value: BusinessType; label: string; icon: string }[] {
  return Object.values(businessTypes).map((bt) => ({
    value: bt.id,
    label: bt.name,
    icon: bt.icon,
  }));
}
