import { ImportField } from "@/components/import/DataImportUploader";

export interface PlatformConfig {
  name: string;
  description: string;
  templateUrl: string;
  fields: ImportField[];
}

const commonClientFields: ImportField[] = [
  { key: "first_name", label: "First Name", required: true, type: "text", example: "John" },
  { key: "last_name", label: "Last Name", required: true, type: "text", example: "Smith" },
  { key: "email", label: "Email", required: true, type: "email", example: "john@example.com" },
  { key: "phone", label: "Phone", required: false, type: "phone", example: "+12125551234", description: "International format with +" },
  { key: "birth_date", label: "Birth Date", required: false, type: "date", example: "1990-05-15" },
  { key: "gender", label: "Gender", required: false, type: "text", example: "M" },
  { key: "member_status", label: "Member Status", required: false, type: "text", example: "Active", description: "Active, Inactive, Suspended, etc." },
  { key: "pricing_option", label: "Pricing Option", required: false, type: "text", example: "Unlimited Monthly", description: "Plan or package name from previous provider" },
  { key: "payment_amount", label: "Payment Amount", required: false, type: "number", example: "149.00", description: "Monthly or per-cycle payment" },
  { key: "join_date", label: "Join Date", required: false, type: "date", example: "2024-01-15", description: "When the client first joined" },
  { key: "remaining_classes", label: "Remaining Classes", required: false, type: "number", example: "6", description: "Classes left on current package" },
  { key: "address_line1", label: "Address", required: false, type: "text", example: "123 Main St" },
  { key: "city", label: "City", required: false, type: "text", example: "New York" },
  { key: "state", label: "State", required: false, type: "text", example: "NY" },
  { key: "postal_code", label: "Postal Code", required: false, type: "text", example: "10001" },
  { key: "country", label: "Country", required: false, type: "text", example: "US" },
  { key: "emergency_contact_name", label: "Emergency Contact", required: false, type: "text", example: "Jane Doe" },
  { key: "emergency_contact_phone", label: "Emergency Phone", required: false, type: "phone", example: "+12125555678" },
];

const classHistoryFields: ImportField[] = [
  { key: "client_email", label: "Client Email", required: true, type: "email", example: "john@example.com", description: "Must match an existing client" },
  { key: "class_title", label: "Class Name", required: true, type: "text", example: "Reformer Pilates" },
  { key: "date", label: "Class Date", required: true, type: "date", example: "2025-11-15" },
  { key: "time", label: "Class Time", required: false, type: "time", example: "09:00" },
  { key: "end_time", label: "End Time", required: false, type: "time", example: "10:00" },
  { key: "instructor", label: "Instructor", required: false, type: "text", example: "Maria" },
  { key: "status", label: "Status", required: false, type: "text", example: "Completed", description: "Completed, Cancelled, Late Cancel, No Show" },
];

export const platformConfigs: Record<string, PlatformConfig> = {
  mindbody: {
    name: "Mindbody",
    description: "Import client data and memberships from Mindbody. Export via Reports > Mailing Lists.",
    templateUrl: "/templates/mindbody-import-template.csv",
    fields: [
      ...commonClientFields,
      { key: "next_autopay_date", label: "Next Autopay Date", required: false, type: "date", example: "2026-04-15", description: "Next billing date from Mindbody" },
    ],
  },
  vagaro: {
    name: "Vagaro",
    description: "Import client data from Vagaro. Export via Customers > Export.",
    templateUrl: "/templates/mindbody-import-template.csv",
    fields: commonClientFields,
  },
  marianatek: {
    name: "Mariana Tek",
    description: "Import client data from Mariana Tek. Export via Reports > Members.",
    templateUrl: "/templates/mindbody-import-template.csv",
    fields: commonClientFields,
  },
  glofox: {
    name: "GloFox",
    description: "Import client data from GloFox. Export via Members > Export.",
    templateUrl: "/templates/mindbody-import-template.csv",
    fields: commonClientFields,
  },
  tecnofit: {
    name: "Tecnofit",
    description: "Importe dados de clientes do Tecnofit. Exporte via Clientes > Exportar.",
    templateUrl: "/templates/mindbody-import-template.csv",
    fields: commonClientFields,
  },
  other: {
    name: "Other / CSV",
    description: "Import from any platform using a CSV file. We'll help you map the columns.",
    templateUrl: "/templates/mindbody-import-template.csv",
    fields: commonClientFields,
  },
};

export const classHistoryConfigs: Record<string, PlatformConfig> = {
  mindbody: {
    name: "Mindbody",
    description: "Import class visit history from Mindbody. Export via Reports > Client Visit History.",
    templateUrl: "/templates/mindbody-class-history-template.csv",
    fields: classHistoryFields,
  },
};