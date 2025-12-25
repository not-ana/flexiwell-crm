// Types for dynamic form configuration

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "url"
  | "file"
  | "checkbox"
  | "checkboxGroup"
  | "socialLink";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  maxLength?: number;
  prefix?: string; // For URL fields like "twitter.com/"
  accept?: string; // For file uploads
  options?: { label: string; description?: string }[]; // For checkbox groups
}

export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

export interface FormConfig {
  id: string;
  name: string;
  sections: FormSection[];
}

// Default client form configuration
export const defaultClientFormConfig: FormConfig = {
  id: "client-form",
  name: "Add Client",
  sections: [
    {
      id: "personal-details",
      title: "Personal details",
      fields: [
        {
          id: "public-profile",
          type: "text",
          label: "Public profile",
          description: "This will be displayed on your profile.",
          required: true,
          placeholder: "Client Name",
        },
        {
          id: "profile-url",
          type: "url",
          label: "",
          prefix: "flexiwell.com/profile/",
          placeholder: "username",
        },
        {
          id: "tagline",
          type: "textarea",
          label: "Tagline",
          description: "A quick snapshot of your company.",
          maxLength: 200,
          placeholder: "Enter a brief description...",
        },
        {
          id: "company-logo",
          type: "file",
          label: "Company logo",
          description: "Update your company logo and then choose where you want it to display.",
          accept: "image/svg+xml,image/png,image/jpeg,image/gif",
        },
        {
          id: "branding",
          type: "checkboxGroup",
          label: "Branding",
          description: "Add your logo to reports and emails.",
          options: [
            { label: "Reports", description: "Include my logo in summary reports." },
            { label: "Emails", description: "Include my logo in customer emails." },
          ],
        },
        {
          id: "social-twitter",
          type: "socialLink",
          label: "Social profiles",
          prefix: "twitter.com/",
          placeholder: "username",
        },
        {
          id: "social-facebook",
          type: "socialLink",
          label: "",
          prefix: "facebook.com/",
          placeholder: "username",
        },
        {
          id: "social-linkedin",
          type: "socialLink",
          label: "",
          prefix: "linkedin.com/company/",
          placeholder: "username",
        },
      ],
    },
    {
      id: "health-status",
      title: "Health status",
      fields: [
        {
          id: "health-conditions",
          type: "textarea",
          label: "Health conditions",
          description: "Any relevant health information.",
          placeholder: "List any health conditions...",
        },
        {
          id: "allergies",
          type: "textarea",
          label: "Allergies",
          placeholder: "List any allergies...",
        },
        {
          id: "emergency-contact",
          type: "text",
          label: "Emergency contact",
          required: true,
          placeholder: "Name and phone number",
        },
      ],
    },
    {
      id: "team",
      title: "Team",
      fields: [
        {
          id: "team-members",
          type: "textarea",
          label: "Team members",
          description: "Add team members who can access this client.",
          placeholder: "Enter email addresses...",
        },
      ],
    },
    {
      id: "plan",
      title: "Plan",
      fields: [
        {
          id: "subscription-plan",
          type: "text",
          label: "Subscription plan",
          description: "Current plan for this client.",
          placeholder: "e.g., Premium, Basic",
        },
        {
          id: "classes-per-month",
          type: "text",
          label: "Classes per month",
          placeholder: "e.g., 12",
        },
        {
          id: "plan-notes",
          type: "textarea",
          label: "Notes",
          placeholder: "Additional notes about the plan...",
        },
      ],
    },
  ],
};

// Helper to get form config from localStorage or default
export function getClientFormConfig(): FormConfig {
  if (typeof window === "undefined") return defaultClientFormConfig;

  const stored = localStorage.getItem("clientFormConfig");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultClientFormConfig;
    }
  }
  return defaultClientFormConfig;
}

// Helper to save form config to localStorage
export function saveClientFormConfig(config: FormConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("clientFormConfig", JSON.stringify(config));
}

// Helper to reset form config to default
export function resetClientFormConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("clientFormConfig");
}
