// Business Types Configuration
// Allows FlexiWell to be used for different wellness business types

export type BusinessType = "pilates";

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

};

// Helper functions
export function getBusinessType(type: BusinessType): BusinessTypeConfig {
  return businessTypes[type];
}

export function getTerminology(type: BusinessType): BusinessTerminology {
  return getBusinessType(type).terminology;
}

export function getTerm(type: BusinessType, term: keyof BusinessTerminology): string {
  return getTerminology(type)[term];
}

// Get all business types as array for select options
export function getBusinessTypeOptions(): { value: BusinessType; label: string; icon: string }[] {
  return Object.values(businessTypes).map((bt) => ({
    value: bt.id,
    label: bt.name,
    icon: bt.icon,
  }));
}
