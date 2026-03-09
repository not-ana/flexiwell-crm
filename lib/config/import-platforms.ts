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
  { key: "address_line1", label: "Address", required: false, type: "text", example: "123 Main St" },
  { key: "city", label: "City", required: false, type: "text", example: "New York" },
  { key: "state", label: "State", required: false, type: "text", example: "NY" },
  { key: "postal_code", label: "Postal Code", required: false, type: "text", example: "10001" },
  { key: "country", label: "Country", required: false, type: "text", example: "US" },
  { key: "emergency_contact_name", label: "Emergency Contact", required: false, type: "text", example: "Jane Doe" },
  { key: "emergency_contact_phone", label: "Emergency Phone", required: false, type: "phone", example: "+12125555678" },
];

const bookingFields: ImportField[] = [
  { key: "client_name", label: "Client Name", required: true, type: "text", example: "John Smith" },
  { key: "email", label: "Email", required: true, type: "email", example: "john@example.com" },
  { key: "phone", label: "Phone", required: false, type: "phone", example: "+12125551234", description: "International format with +" },
  { key: "class_title", label: "Class Title", required: true, type: "text", example: "Yoga Flow" },
  { key: "date", label: "Date", required: true, type: "date", example: "2026-02-15" },
  { key: "time", label: "Time", required: true, type: "time", example: "09:00", description: "24-hour format HH:MM" },
  { key: "instructor", label: "Instructor", required: false, type: "text", example: "Jane Doe" },
  { key: "status", label: "Status", required: true, type: "text", example: "confirmed", description: "confirmed, cancelled, completed, no-show" },
  { key: "external_id", label: "External ID", required: false, type: "text", example: "EXT123456" },
];

export const platformConfigs: Record<string, PlatformConfig> = {
  classpass: {
    name: "ClassPass",
    description: "Import booking history and client data from ClassPass.",
    templateUrl: "/templates/classpass-import-template.csv",
    fields: bookingFields,
  },
  mindbody: {
    name: "Mindbody",
    description: "Import client data, class schedules, and memberships from Mindbody.",
    templateUrl: "/templates/mindbody-import-template.csv",
    fields: commonClientFields,
  },
  glofox: {
    name: "Glofox",
    description: "Import member data, class schedules, and memberships from Glofox.",
    templateUrl: "/templates/glofox-import-template.csv",
    fields: commonClientFields,
  },
  tecnofit: {
    name: "Tecnofit",
    description: "Import student data, training plans, and memberships from Tecnofit.",
    templateUrl: "/templates/tecnofit-import-template.csv",
    fields: [
      ...commonClientFields,
      { key: "tax_id", label: "CPF", required: false, type: "text", example: "12345678900", description: "Numbers only, no dots or dashes" },
      { key: "neighborhood", label: "Neighborhood", required: false, type: "text", example: "Bela Vista" },
    ],
  },
  other: {
    name: "Other Platform",
    description: "Import from any platform — just upload your CSV and map the columns.",
    templateUrl: "/templates/generic-import-template.csv",
    fields: commonClientFields,
  },
};