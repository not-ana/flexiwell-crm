// FlexiLaunch Integration Configuration
// Web design agency integration for wellness studios

export interface FlexiLaunchPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  included: {
    website: {
      pages: number;
      customDomain: boolean;
      seoOptimization: boolean;
      mobileResponsive: boolean;
      contentCreation: boolean; // copywriting
      photography: boolean;
      branding: boolean; // logo + color scheme
      features: string[];
    };
    crm: {
      planTier: "retention_pro" | "scale";
      freeMonths: number;
      setup: boolean; // white-glove setup
      training: boolean; // staff training
      dataImport: boolean; // competitor data migration
    };
    extras: {
      socialMediaSetup: boolean; // IG, FB pages
      googleBusinessProfile: boolean;
      emailMarketing: boolean; // Mailchimp setup
      onlineBookingWidget: boolean;
    };
  };
  timeline: {
    discovery: number; // days
    design: number; // days
    development: number; // days
    launch: number; // days
    total: number; // days
  };
  revisions: number;
  support: {
    duration: number; // months
    type: "email" | "chat" | "phone" | "dedicated";
  };
  badge?: string;
  highlighted?: boolean;
}

export const flexiLaunchPackages: FlexiLaunchPackage[] = [
  {
    id: "starter_bundle",
    name: "Digital Starter",
    description: "Perfect for new studios launching their online presence",
    price: 2499,
    discountedPrice: 1999,
    badge: "Early Adopter",
    highlighted: false,
    included: {
      website: {
        pages: 5,
        customDomain: true,
        seoOptimization: true,
        mobileResponsive: true,
        contentCreation: true,
        photography: false,
        branding: false,
        features: [
          "Home page",
          "About page",
          "Class schedule",
          "Pricing page",
          "Contact form",
          "Instagram feed integration",
          "Google Maps integration",
        ],
      },
      crm: {
        planTier: "retention_pro",
        freeMonths: 3,
        setup: true,
        training: true,
        dataImport: false,
      },
      extras: {
        socialMediaSetup: true,
        googleBusinessProfile: true,
        emailMarketing: false,
        onlineBookingWidget: true,
      },
    },
    timeline: {
      discovery: 3,
      design: 7,
      development: 10,
      launch: 2,
      total: 22,
    },
    revisions: 2,
    support: {
      duration: 3,
      type: "email",
    },
  },
  {
    id: "growth_bundle",
    name: "Growth Accelerator",
    description: "For established studios ready to scale with professional branding",
    price: 4999,
    discountedPrice: 3999,
    badge: "Most Popular",
    highlighted: true,
    included: {
      website: {
        pages: 10,
        customDomain: true,
        seoOptimization: true,
        mobileResponsive: true,
        contentCreation: true,
        photography: true, // Professional photoshoot
        branding: true, // Logo + brand identity
        features: [
          "Custom homepage with video",
          "About & Team pages",
          "Services & Class descriptions",
          "Instructor profiles",
          "Pricing & Packages",
          "Blog (5 posts included)",
          "Client testimonials",
          "Online booking integration",
          "Member portal login",
          "FAQ section",
        ],
      },
      crm: {
        planTier: "retention_pro",
        freeMonths: 6,
        setup: true,
        training: true,
        dataImport: true,
      },
      extras: {
        socialMediaSetup: true,
        googleBusinessProfile: true,
        emailMarketing: true,
        onlineBookingWidget: true,
      },
    },
    timeline: {
      discovery: 5,
      design: 10,
      development: 15,
      launch: 3,
      total: 33,
    },
    revisions: 3,
    support: {
      duration: 6,
      type: "chat",
    },
  },
  {
    id: "premium_bundle",
    name: "Premium Studio",
    description: "Complete digital transformation for multi-location studios",
    price: 9999,
    discountedPrice: 7999,
    badge: "White Label",
    highlighted: false,
    included: {
      website: {
        pages: 20,
        customDomain: true,
        seoOptimization: true,
        mobileResponsive: true,
        contentCreation: true,
        photography: true,
        branding: true,
        features: [
          "Custom design system",
          "Multi-location pages",
          "Advanced class filtering",
          "Instructor booking system",
          "E-commerce for merchandise",
          "Member-only content",
          "Event calendar",
          "Workshop registration",
          "Gift card system",
          "Referral program page",
          "Analytics dashboard",
          "Custom animations",
          "Video backgrounds",
          "Chatbot integration",
        ],
      },
      crm: {
        planTier: "scale",
        freeMonths: 12,
        setup: true,
        training: true,
        dataImport: true,
      },
      extras: {
        socialMediaSetup: true,
        googleBusinessProfile: true,
        emailMarketing: true,
        onlineBookingWidget: true,
      },
    },
    timeline: {
      discovery: 7,
      design: 14,
      development: 21,
      launch: 5,
      total: 47,
    },
    revisions: 5,
    support: {
      duration: 12,
      type: "dedicated",
    },
  },
];

export interface EarlyAdopterOffer {
  id: string;
  name: string;
  description: string;
  originalPrice: number;
  offerPrice: number;
  savings: number;
  savingsPercentage: number;
  validUntil: string; // ISO date
  limited: number; // number of spots
  claimed: number;
  benefits: string[];
  termsAndConditions: string[];
}

// Default early adopter offer configuration
// The `claimed` field should be fetched from the database using getEarlyAdopterClaimedCount()
export const earlyAdopterOfferConfig: Omit<EarlyAdopterOffer, "claimed"> = {
  id: "early_adopter_2025",
  name: "Early Adopter Exclusive",
  description:
    "Be among the first 10 studios to join FlexiWell + FlexiLaunch and get exclusive lifetime benefits",
  originalPrice: 4999,
  offerPrice: 3499,
  savings: 1500,
  savingsPercentage: 30,
  validUntil: "2025-03-31T23:59:59Z",
  limited: 10,
  benefits: [
    "30% discount on Growth Accelerator bundle",
    "6 months FlexiWell Retention Pro FREE (value: $4,494)",
    "Professional photoshoot included (value: $500)",
    "Lifetime 20% discount on CRM renewals",
    "Priority feature requests",
    "Exclusive early access to new features",
    "Featured in our success stories",
    "Dedicated onboarding specialist",
    "Free migration from any competitor",
    "Custom API integrations included",
  ],
  termsAndConditions: [
    "Offer valid for the first 10 studios only",
    "Payment plan available: 50% upfront, 50% on launch",
    "6-month CRM free period starts after website launch",
    "20% lifetime discount applies to annual CRM subscriptions only",
    "Offer expires March 31, 2025 or when 10 spots are filled",
    "Non-transferable and cannot be combined with other offers",
  ],
};

// Legacy export for backwards compatibility - use getEarlyAdopterOffer() instead
export const earlyAdopterOffer: EarlyAdopterOffer = {
  ...earlyAdopterOfferConfig,
  claimed: 0, // This is a static fallback - use getEarlyAdopterOffer() for real-time data
};

/**
 * Get the early adopter offer with the current claimed count from the database
 * @param db - MongoDB database instance
 * @returns EarlyAdopterOffer with real-time claimed count
 */
export async function getEarlyAdopterOffer(db: { collection: (name: string) => { countDocuments: (query: Record<string, unknown>) => Promise<number> } }): Promise<EarlyAdopterOffer> {
  const claimedCount = await db.collection("early_adopter_claims").countDocuments({
    offerId: earlyAdopterOfferConfig.id,
    status: { $in: ["claimed", "active"] },
  });

  return {
    ...earlyAdopterOfferConfig,
    claimed: claimedCount,
  };
}

/**
 * Claim an early adopter spot
 * @param db - MongoDB database instance
 * @param claimData - Data for the claim
 * @returns Result of the claim operation
 */
export async function claimEarlyAdopterSpot(
  db: { collection: (name: string) => { countDocuments: (query: Record<string, unknown>) => Promise<number>; insertOne: (doc: Record<string, unknown>) => Promise<{ insertedId: unknown }> } },
  claimData: {
    userId: string;
    studioName: string;
    email: string;
    packageId: string;
  }
): Promise<{ success: boolean; message: string; spotsRemaining?: number }> {
  // Check if spots are still available
  const currentClaimed = await db.collection("early_adopter_claims").countDocuments({
    offerId: earlyAdopterOfferConfig.id,
    status: { $in: ["claimed", "active"] },
  });

  if (currentClaimed >= earlyAdopterOfferConfig.limited) {
    return {
      success: false,
      message: "All early adopter spots have been claimed",
      spotsRemaining: 0,
    };
  }

  // Check if offer is still valid
  const now = new Date();
  const expiryDate = new Date(earlyAdopterOfferConfig.validUntil);
  if (now > expiryDate) {
    return {
      success: false,
      message: "The early adopter offer has expired",
    };
  }

  // Create the claim
  await db.collection("early_adopter_claims").insertOne({
    offerId: earlyAdopterOfferConfig.id,
    userId: claimData.userId,
    studioName: claimData.studioName,
    email: claimData.email,
    packageId: claimData.packageId,
    status: "claimed",
    claimedAt: new Date(),
    benefits: earlyAdopterOfferConfig.benefits,
    discount: earlyAdopterOfferConfig.savingsPercentage,
  });

  return {
    success: true,
    message: "Early adopter spot claimed successfully!",
    spotsRemaining: earlyAdopterOfferConfig.limited - currentClaimed - 1,
  };
}

export interface FlexiLaunchLead {
  id: string;
  studioName: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  currentPlatform?: string;
  packageInterest: string;
  source: "website" | "referral" | "ads" | "social" | "event" | "other";
  status: "inquiry" | "discovery" | "proposal" | "negotiation" | "won" | "lost";
  createdAt: Date;
  notes?: string;
  estimatedValue: number;
  discoveryCallScheduled?: Date;
}

export interface IntegrationBenefit {
  title: string;
  description: string;
  icon: string;
  value: string; // e.g., "Save $500", "50 hours saved"
}

export const integrationBenefits: IntegrationBenefit[] = [
  {
    title: "Seamless Integration",
    description:
      "Your website and CRM work together perfectly. Online bookings flow directly into your schedule.",
    icon: "link",
    value: "100% automated",
  },
  {
    title: "Save Time & Money",
    description:
      "Bundle pricing saves you $1,500+ compared to buying separately. Plus, 6 months CRM free.",
    icon: "dollar-sign",
    value: "Save $2,000+",
  },
  {
    title: "Single Support Team",
    description:
      "One team handles your website and CRM. No more finger-pointing between vendors.",
    icon: "headset",
    value: "50% faster resolution",
  },
  {
    title: "Unified Brand",
    description:
      "Consistent branding across your website, client portal, emails, and booking system.",
    icon: "palette",
    value: "Professional image",
  },
  {
    title: "Data Sync",
    description:
      "Client data, schedules, and payments automatically sync between website and CRM.",
    icon: "refresh-cw",
    value: "Real-time sync",
  },
  {
    title: "Future-Proof",
    description:
      "Both platforms evolve together. New features work seamlessly from day one.",
    icon: "trending-up",
    value: "Always compatible",
  },
];

export const comparisonTable = {
  options: [
    {
      name: "DIY (Wix + Separate CRM)",
      website: 300,
      crm: 4788, // $399/mo x 12
      integration: 0,
      support: 0,
      total: 1488,
      timeInvested: "60+ hours",
      issues: [
        "Manual data entry",
        "No real integration",
        "Different support teams",
        "Inconsistent branding",
      ],
    },
    {
      name: "Traditional Agency + Mindbody",
      website: 5000,
      crm: 8988, // $749/mo x 12
      integration: 500,
      support: 600,
      total: 8488,
      timeInvested: "40+ hours",
      issues: [
        "Expensive",
        "Separate contracts",
        "Complex integration",
        "Long timelines",
      ],
    },
    {
      name: "FlexiLaunch + FlexiWell Bundle",
      website: 3999,
      crm: 0, // 6 months free, then $1,716/year
      integration: 0,
      support: 0,
      total: 3999,
      timeInvested: "5 hours",
      benefits: [
        "Everything integrated",
        "One vendor, one contract",
        "Dedicated support",
        "Fast timeline (4-6 weeks)",
      ],
    },
  ],
};

export function calculateROI(
  bundlePrice: number,
  freeMonthsCRM: number,
  crmMonthlyPrice: number,
  timeInvestmentSaved: number, // hours
  hourlyValueOfTime: number // $/hour
): {
  directSavings: number;
  timeSavings: number;
  totalValue: number;
  roi: number; // percentage
  paybackPeriod: number; // months
} {
  const directSavings = freeMonthsCRM * crmMonthlyPrice;
  const timeSavings = timeInvestmentSaved * hourlyValueOfTime;
  const totalValue = directSavings + timeSavings;
  const roi = ((totalValue - bundlePrice) / bundlePrice) * 100;
  const monthlySavings = crmMonthlyPrice + timeSavings / 12;
  const paybackPeriod = bundlePrice / monthlySavings;

  return {
    directSavings: Math.round(directSavings),
    timeSavings: Math.round(timeSavings),
    totalValue: Math.round(totalValue),
    roi: Math.round(roi),
    paybackPeriod: Math.round(paybackPeriod * 10) / 10,
  };
}

// Example ROI calculation for Retention Pro bundle
export const growthBundleROI = calculateROI(
  3999, // bundle price
  6, // free months
  799, // CRM monthly price (Retention Pro)
  50, // hours saved
  50 // value per hour
);

export interface TestimonialData {
  studioName: string;
  location: string;
  owner: string;
  photo?: string;
  quote: string;
  results: {
    metric: string;
    value: string;
  }[];
  packageUsed: string;
}

export const testimonials: TestimonialData[] = [
  {
    studioName: "CoreFlow Pilates",
    location: "Austin, TX",
    owner: "Jessica Martinez",
    quote:
      "The FlexiLaunch + FlexiWell bundle transformed our business. We went from spreadsheets to a professional website and automated CRM in just 5 weeks. Best investment we've made.",
    results: [
      { metric: "Online bookings", value: "+250%" },
      { metric: "Admin time saved", value: "15 hrs/week" },
      { metric: "Client retention", value: "+35%" },
    ],
    packageUsed: "Growth Accelerator",
  },
  {
    studioName: "Zen Movement Studio",
    location: "Portland, OR",
    owner: "Michael Chen",
    quote:
      "As a tech-savvy owner, I needed a modern stack. FlexiWell's API and FlexiLaunch's custom development gave me everything I wanted. The integration is seamless.",
    results: [
      { metric: "Revenue growth", value: "+45%" },
      { metric: "Waitlist conversions", value: "85%" },
      { metric: "Support tickets", value: "-60%" },
    ],
    packageUsed: "Premium Studio",
  },
  {
    studioName: "BodyMind Wellness",
    location: "Miami, FL",
    owner: "Sarah Thompson",
    quote:
      "The early adopter bundle was a no-brainer. Professional website, 6 months free CRM, and ongoing support - all for less than competitors charge for CRM alone.",
    results: [
      { metric: "New client signups", value: "+180%" },
      { metric: "No-shows", value: "-40%" },
      { metric: "Google rankings", value: "Page 1" },
    ],
    packageUsed: "Digital Starter",
  },
];

export interface WebsiteTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  bestFor: string[];
  features: string[];
  customization: "low" | "medium" | "high";
}

export const websiteTemplates: WebsiteTemplate[] = [
  {
    id: "pilates_modern",
    name: "Modern Pilates",
    description: "Clean, minimalist design perfect for boutique Pilates studios",
    preview: "/templates/pilates-modern.jpg",
    bestFor: ["Pilates", "Barre", "Reformer Studios"],
    features: [
      "Video hero section",
      "Class filtering",
      "Instructor bios",
      "Online booking CTA",
      "Member testimonials",
    ],
    customization: "high",
  },
  {
    id: "yoga_wellness",
    name: "Wellness Sanctuary",
    description: "Calming, nature-inspired design for yoga and wellness centers",
    preview: "/templates/yoga-wellness.jpg",
    bestFor: ["Yoga", "Meditation", "Wellness Centers"],
    features: [
      "Zen aesthetics",
      "Workshop calendar",
      "Teacher training pages",
      "Blog integration",
      "Retreat booking",
    ],
    customization: "high",
  },
  {
    id: "fitness_bold",
    name: "Bold Fitness",
    description: "High-energy design for CrossFit boxes and fitness studios",
    preview: "/templates/fitness-bold.jpg",
    bestFor: ["CrossFit", "HIIT", "Bootcamp"],
    features: [
      "Bold typography",
      "WOD display",
      "Leaderboards",
      "Member results",
      "Challenge tracking",
    ],
    customization: "medium",
  },
  {
    id: "dance_elegant",
    name: "Elegant Movement",
    description: "Sophisticated design for dance studios and ballet schools",
    preview: "/templates/dance-elegant.jpg",
    bestFor: ["Dance", "Ballet", "Contemporary"],
    features: [
      "Gallery showcase",
      "Class levels",
      "Recital info",
      "Student portal",
      "Performance calendar",
    ],
    customization: "high",
  },
];
