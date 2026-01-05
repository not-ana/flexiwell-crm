// Niche configuration for dynamic landing pages
// Usage: /?niche=pilates or /pilates

export interface NicheConfig {
  id: string;
  slug: string;
  name: string;
  headline: string;
  subheadline: string;
  description: string;
  keywords: string[];
  icon: string;
  color: string;
  features: string[];
}

export const niches: Record<string, NicheConfig> = {
  pilates: {
    id: "pilates",
    slug: "pilates",
    name: "Pilates Studio",
    headline: "Complete Management for Your Pilates Studio",
    subheadline: "The all-in-one platform built specifically for Pilates instructors and studio owners",
    description: "Manage reformer classes, track client progress, automate bookings, and grow your Pilates studio with AI-powered tools.",
    keywords: ["pilates software", "pilates studio management", "reformer booking", "pilates CRM"],
    icon: "🧘‍♀️",
    color: "primary",
    features: [
      "Reformer & mat class scheduling",
      "Equipment tracking",
      "Client progress monitoring",
      "Package & membership management",
    ],
  },
  yoga: {
    id: "yoga",
    slug: "yoga",
    name: "Yoga Studio",
    headline: "Complete Management for Your Yoga Studio",
    subheadline: "The all-in-one platform designed for yoga teachers and studio owners",
    description: "Schedule classes, manage memberships, track attendance, and build your yoga community with intelligent automation.",
    keywords: ["yoga software", "yoga studio management", "yoga booking system", "yoga CRM"],
    icon: "🧘",
    color: "purple",
    features: [
      "Multi-style class scheduling",
      "Retreat & workshop management",
      "Teacher scheduling",
      "Membership & drop-in tracking",
    ],
  },
  crossfit: {
    id: "crossfit",
    slug: "crossfit",
    name: "CrossFit Box",
    headline: "Complete Management for Your CrossFit Box",
    subheadline: "The all-in-one platform built for CrossFit box owners and coaches",
    description: "Manage WODs, track athlete PRs, schedule classes, and grow your box with powerful automation tools.",
    keywords: ["crossfit software", "box management", "crossfit scheduling", "crossfit CRM"],
    icon: "🏋️",
    color: "red",
    features: [
      "WOD programming & tracking",
      "Athlete PR records",
      "Class capacity management",
      "Competition tracking",
    ],
  },
  dance: {
    id: "dance",
    slug: "dance",
    name: "Dance Studio",
    headline: "Complete Management for Your Dance Studio",
    subheadline: "The all-in-one platform designed for dance teachers and studio owners",
    description: "Schedule classes, manage recitals, track student progress, and grow your dance studio with smart automation.",
    keywords: ["dance studio software", "dance school management", "dance booking", "dance CRM"],
    icon: "💃",
    color: "pink",
    features: [
      "Multi-style class scheduling",
      "Recital & performance planning",
      "Student level tracking",
      "Costume & fee management",
    ],
  },
  "personal-training": {
    id: "personal-training",
    slug: "personal-training",
    name: "Personal Training",
    headline: "Complete Management for Personal Trainers",
    subheadline: "The all-in-one platform built for personal trainers and fitness coaches",
    description: "Schedule sessions, track client progress, manage payments, and grow your training business with AI-powered tools.",
    keywords: ["personal trainer software", "PT management", "fitness coaching CRM", "trainer scheduling"],
    icon: "💪",
    color: "orange",
    features: [
      "1-on-1 session scheduling",
      "Client progress tracking",
      "Workout programming",
      "Package & payment management",
    ],
  },
  "martial-arts": {
    id: "martial-arts",
    slug: "martial-arts",
    name: "Martial Arts",
    headline: "Complete Management for Your Martial Arts School",
    subheadline: "The all-in-one platform designed for martial arts instructors and dojo owners",
    description: "Manage classes, track belt progression, schedule gradings, and grow your martial arts school with smart automation.",
    keywords: ["martial arts software", "dojo management", "karate school CRM", "belt tracking"],
    icon: "🥋",
    color: "gray",
    features: [
      "Multi-discipline scheduling",
      "Belt & rank progression",
      "Grading & testing management",
      "Student family accounts",
    ],
  },
  fitness: {
    id: "fitness",
    slug: "fitness",
    name: "Fitness Center",
    headline: "Complete Management for Your Fitness Center",
    subheadline: "The all-in-one platform built for gym owners and fitness professionals",
    description: "Manage memberships, schedule classes, track attendance, and grow your fitness center with powerful automation.",
    keywords: ["gym software", "fitness center management", "gym CRM", "fitness scheduling"],
    icon: "🏃",
    color: "blue",
    features: [
      "Membership management",
      "Group class scheduling",
      "Equipment booking",
      "Access control integration",
    ],
  },
  spa: {
    id: "spa",
    slug: "spa",
    name: "Spa & Wellness",
    headline: "Complete Management for Your Spa & Wellness Center",
    subheadline: "The all-in-one platform designed for spa owners and wellness professionals",
    description: "Schedule appointments, manage treatments, track inventory, and grow your wellness business with AI-powered tools.",
    keywords: ["spa software", "wellness center management", "spa booking", "wellness CRM"],
    icon: "🧖",
    color: "teal",
    features: [
      "Treatment scheduling",
      "Therapist management",
      "Inventory tracking",
      "Package & gift card sales",
    ],
  },
  "physical-therapy": {
    id: "physical-therapy",
    slug: "physical-therapy",
    name: "Physical Therapy",
    headline: "Complete Management for Your Physical Therapy Practice",
    subheadline: "The all-in-one platform built for physical therapists and rehab clinics",
    description: "Manage patient schedules, track treatment progress, handle insurance, and grow your practice with smart automation.",
    keywords: ["physical therapy software", "PT practice management", "rehab clinic CRM", "therapy scheduling"],
    icon: "🏥",
    color: "green",
    features: [
      "Patient scheduling",
      "Treatment plan tracking",
      "Progress documentation",
      "Insurance & billing",
    ],
  },
  default: {
    id: "default",
    slug: "",
    name: "Studio",
    headline: "Complete Management for Your Wellness Business",
    subheadline: "The all-in-one platform built for studios, gyms, and wellness professionals",
    description: "Schedule classes, manage clients, automate bookings, and grow your business with AI-powered tools.",
    keywords: ["studio management software", "wellness business CRM", "fitness booking system"],
    icon: "✨",
    color: "primary",
    features: [
      "Class & appointment scheduling",
      "Client management",
      "Payment processing",
      "AI-powered automation",
    ],
  },
};

export const nicheList = Object.values(niches).filter((n) => n.id !== "default");

export function getNicheBySlug(slug: string | null): NicheConfig {
  if (!slug) return niches.default;
  const niche = niches[slug.toLowerCase()];
  return niche || niches.default;
}

export function getNicheByParam(searchParams: URLSearchParams): NicheConfig {
  const nicheParam = searchParams.get("niche");
  return getNicheBySlug(nicheParam);
}
