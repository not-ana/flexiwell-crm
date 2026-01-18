import type { HealthAssessmentFormConfig, FormSectionConfig } from "@/lib/db/schemas";

// Default sections for the health assessment form
export const defaultSections: FormSectionConfig[] = [
  {
    id: "personal_info",
    title: "Personal Information",
    description: "Basic personal details for your records",
    enabled: true,
    required: false,
    order: 1,
    isBuiltIn: true,
    fields: [
      { id: "dateOfBirth", type: "date", label: "Date of Birth", required: false },
      {
        id: "gender",
        type: "select",
        label: "Gender",
        required: false,
        options: [
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
          { value: "other", label: "Other" },
          { value: "prefer_not_to_say", label: "Prefer not to say" },
        ],
      },
      { id: "height", type: "number", label: "Height (cm)", placeholder: "170", required: false },
      { id: "weight", type: "number", label: "Weight (kg)", placeholder: "70", required: false },
      { id: "occupation", type: "text", label: "Occupation", placeholder: "Your profession", required: false },
    ],
  },
  {
    id: "medical_history",
    title: "Medical History",
    description: "Please check all conditions that apply to you",
    enabled: true,
    required: false,
    order: 2,
    isBuiltIn: true,
    fields: [
      { id: "hasHeartCondition", type: "checkbox", label: "Heart condition", required: false },
      { id: "hasHighBloodPressure", type: "checkbox", label: "High blood pressure", required: false },
      { id: "hasLowBloodPressure", type: "checkbox", label: "Low blood pressure", required: false },
      { id: "hasAsthma", type: "checkbox", label: "Asthma", required: false },
      { id: "hasRespiratoryIssues", type: "checkbox", label: "Other respiratory issues", required: false },
      { id: "hasArthritis", type: "checkbox", label: "Arthritis", required: false },
      { id: "hasOsteoporosis", type: "checkbox", label: "Osteoporosis", required: false },
      { id: "hasScoliosis", type: "checkbox", label: "Scoliosis", required: false },
      { id: "hasHernias", type: "checkbox", label: "Herniated disc / Hernia", required: false },
      { id: "hasEpilepsy", type: "checkbox", label: "Epilepsy", required: false },
      { id: "hasDiabetes", type: "checkbox", label: "Diabetes", required: false },
      { id: "hasThyroidIssues", type: "checkbox", label: "Thyroid issues", required: false },
      { id: "isPregnant", type: "checkbox", label: "Currently pregnant", required: false },
      {
        id: "pregnancyWeeks",
        type: "number",
        label: "Weeks pregnant",
        placeholder: "e.g., 12",
        required: false,
        conditionalOn: { field: "isPregnant", value: true },
      },
      { id: "hasSurgeryHistory", type: "checkbox", label: "History of surgeries", required: false },
      {
        id: "surgeryDetails",
        type: "textarea",
        label: "Surgery details",
        placeholder: "Please describe your surgeries and when they occurred",
        required: false,
        conditionalOn: { field: "hasSurgeryHistory", value: true },
      },
      { id: "hasOtherConditions", type: "checkbox", label: "Other medical conditions", required: false },
      {
        id: "otherConditionsDetails",
        type: "textarea",
        label: "Other conditions details",
        placeholder: "Please describe any other medical conditions",
        required: false,
        conditionalOn: { field: "hasOtherConditions", value: true },
      },
    ],
  },
  {
    id: "current_conditions",
    title: "Current Injuries & Pain",
    description: "Tell us about any current injuries or areas of pain",
    enabled: true,
    required: false,
    order: 3,
    isBuiltIn: true,
    fields: [
      { id: "hasCurrentPain", type: "checkbox", label: "I currently have pain or injuries", required: false },
      {
        id: "painDescription",
        type: "textarea",
        label: "Describe your pain or injuries",
        placeholder: "Location, intensity, how long you've had it...",
        required: false,
        conditionalOn: { field: "hasCurrentPain", value: true },
      },
    ],
  },
  {
    id: "medications",
    title: "Medications",
    description: "List any medications you are currently taking",
    enabled: true,
    required: false,
    order: 4,
    isBuiltIn: true,
    fields: [
      { id: "takingMedications", type: "checkbox", label: "I am currently taking medications", required: false },
    ],
  },
  {
    id: "allergies",
    title: "Allergies",
    description: "List any allergies you have",
    enabled: true,
    required: false,
    order: 5,
    isBuiltIn: true,
    fields: [
      { id: "hasAllergies", type: "checkbox", label: "I have allergies", required: false },
    ],
  },
  {
    id: "fitness_background",
    title: "Fitness Background",
    description: "Tell us about your exercise history",
    enabled: true,
    required: false,
    order: 6,
    isBuiltIn: true,
    fields: [
      {
        id: "exerciseFrequency",
        type: "select",
        label: "How often do you exercise?",
        required: false,
        options: [
          { value: "none", label: "I don't exercise regularly" },
          { value: "1-2_week", label: "1-2 times per week" },
          { value: "3-4_week", label: "3-4 times per week" },
          { value: "5+_week", label: "5 or more times per week" },
        ],
      },
      {
        id: "previousExperience",
        type: "textarea",
        label: "Previous exercise experience",
        placeholder: "Describe any previous experience with Pilates, yoga, or other physical activities",
        required: false,
      },
    ],
  },
  {
    id: "goals",
    title: "Goals & Objectives",
    description: "What would you like to achieve?",
    enabled: true,
    required: false,
    order: 7,
    isBuiltIn: true,
    fields: [
      {
        id: "goals",
        type: "checkboxGroup",
        label: "Select your goals",
        required: false,
        options: [
          { value: "weight_loss", label: "Weight Loss" },
          { value: "muscle_gain", label: "Build Strength / Muscle" },
          { value: "flexibility", label: "Improve Flexibility" },
          { value: "posture", label: "Correct Posture" },
          { value: "rehabilitation", label: "Rehabilitation / Recovery" },
          { value: "stress_relief", label: "Stress Relief / Relaxation" },
          { value: "general_fitness", label: "General Fitness" },
        ],
      },
      {
        id: "additionalGoalNotes",
        type: "textarea",
        label: "Additional notes about your goals",
        placeholder: "Any specific goals or expectations?",
        required: false,
      },
    ],
  },
  {
    id: "restrictions",
    title: "Physical Restrictions",
    description: "Tell us about any physical limitations or restrictions",
    enabled: true,
    required: false,
    order: 8,
    isBuiltIn: true,
    fields: [
      {
        id: "physicalRestrictions",
        type: "checkboxGroup",
        label: "Select any restrictions that apply",
        required: false,
        options: [
          { value: "no_heavy_lifting", label: "Cannot lift heavy weights" },
          { value: "avoid_twisting", label: "Should avoid twisting movements" },
          { value: "limited_range_of_motion", label: "Limited range of motion" },
          { value: "balance_issues", label: "Balance issues" },
          { value: "joint_problems", label: "Joint problems" },
        ],
      },
      {
        id: "restrictionDetails",
        type: "textarea",
        label: "Additional details about restrictions",
        placeholder: "Please provide more details about your physical restrictions",
        required: false,
      },
    ],
  },
  {
    id: "emergency_contact",
    title: "Emergency Contact",
    description: "Please provide an emergency contact",
    enabled: true,
    required: true,
    order: 9,
    isBuiltIn: true,
    fields: [
      {
        id: "emergencyContact.name",
        type: "text",
        label: "Contact Name",
        placeholder: "Full name",
        required: true,
      },
      {
        id: "emergencyContact.phone",
        type: "text",
        label: "Contact Phone",
        placeholder: "+1 (555) 123-4567",
        required: true,
      },
      {
        id: "emergencyContact.relationship",
        type: "select",
        label: "Relationship",
        required: true,
        options: [
          { value: "spouse", label: "Spouse/Partner" },
          { value: "parent", label: "Parent" },
          { value: "sibling", label: "Sibling" },
          { value: "child", label: "Child" },
          { value: "friend", label: "Friend" },
          { value: "other", label: "Other" },
        ],
      },
    ],
  },
  {
    id: "consent",
    title: "Consent & Signature",
    description: "Please read and agree to the terms",
    enabled: true,
    required: true,
    order: 10,
    isBuiltIn: true,
    fields: [
      {
        id: "consent.agreedToTerms",
        type: "checkbox",
        label: "I have read and agree to the Terms of Service",
        required: true,
      },
      {
        id: "consent.agreedToLiabilityWaiver",
        type: "checkbox",
        label: "I acknowledge the Liability Waiver",
        required: true,
      },
    ],
  },
];

// Default liability waiver text
export const defaultLiabilityWaiverText = `
RELEASE AND WAIVER OF LIABILITY

I understand that physical exercise involves certain risks, including but not limited to muscle strains, sprains, fractures, and other injuries. I acknowledge that I am voluntarily participating in physical activities and assume all risks associated with such participation.

I certify that I am in good physical condition and have no medical conditions that would prevent my safe participation in physical exercise. I have disclosed all relevant medical information in this health assessment form.

I agree to follow all instructions and guidelines provided by the instructors and staff. I understand that I should immediately inform the instructor if I experience any pain, discomfort, or other symptoms during the session.

I hereby release, waive, and discharge the studio, its owners, employees, instructors, and agents from any and all liability, claims, demands, actions, or causes of action arising out of or related to any loss, damage, or injury that may be sustained by me during or as a result of my participation in physical activities at this studio.

By checking the acknowledgment box below, I confirm that I have read, understood, and agree to the terms of this waiver.
`.trim();

// Default terms text
export const defaultTermsText = `
TERMS OF SERVICE

1. I agree to provide accurate and complete information in this health assessment.
2. I understand that my health information will be kept confidential and used only for the purpose of providing appropriate instruction.
3. I agree to inform the studio of any changes to my health condition.
4. I understand that this assessment may be reviewed periodically and I may be asked to update it.
5. I consent to the processing of my personal and health data as described in the Privacy Policy.
`.trim();

// Get default form configuration
export function getDefaultFormConfig(establishmentId: string): HealthAssessmentFormConfig {
  return {
    establishmentId,
    sections: defaultSections,
    liabilityWaiverText: defaultLiabilityWaiverText,
    termsText: defaultTermsText,
    updatedAt: new Date(),
    updatedBy: "system",
  };
}

// Body areas for conditions (used in UI)
export const bodyAreas = [
  { value: "head_neck", label: "Head / Neck" },
  { value: "shoulder", label: "Shoulder" },
  { value: "upper_back", label: "Upper Back" },
  { value: "lower_back", label: "Lower Back" },
  { value: "hip", label: "Hip" },
  { value: "knee", label: "Knee" },
  { value: "ankle_foot", label: "Ankle / Foot" },
  { value: "wrist_hand", label: "Wrist / Hand" },
  { value: "elbow", label: "Elbow" },
  { value: "other", label: "Other" },
];

// Severity levels
export const severityLevels = [
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
];
