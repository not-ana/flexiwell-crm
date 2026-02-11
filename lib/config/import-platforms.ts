import { ImportField } from "@/components/import/DataImportUploader";

export interface PlatformConfig {
  name: string;
  logo: string;
  color: string;
  description: string;
  docsUrl: string;
  templateUrl: string;
  fields: ImportField[];
}

export const platformConfigs: Record<string, PlatformConfig> = {
  classpass: {
    name: "ClassPass",
    logo: "CP",
    color: "bg-primary-600",
    description: "Import your booking history and client data from ClassPass using a CSV file.",
    docsUrl: "/docs/import/classpass",
    templateUrl: "/templates/classpass-import-template.csv",
    fields: [
      { key: "client_name", label: "Client Name", required: true, type: "text", example: "John Smith" },
      { key: "email", label: "Email", required: true, type: "email", example: "john@example.com" },
      { key: "phone", label: "Phone", required: false, type: "phone", example: "+12125551234", description: "International format with +" },
      { key: "class_title", label: "Class Title", required: true, type: "text", example: "Yoga Flow" },
      { key: "date", label: "Date", required: true, type: "date", example: "2026-02-15" },
      { key: "time", label: "Time", required: true, type: "time", example: "09:00", description: "24-hour format HH:MM" },
      { key: "instructor", label: "Instructor", required: false, type: "text", example: "Jane Doe" },
      { key: "status", label: "Status", required: true, type: "text", example: "confirmed", description: "confirmed, cancelled, completed, no-show" },
      { key: "external_id", label: "ClassPass ID", required: false, type: "text", example: "CP123456" },
    ],
  },
  mindbody: {
    name: "Mindbody",
    logo: "MB",
    color: "bg-teal-600",
    description: "Import your client data, class schedules, and memberships from Mindbody using a CSV file.",
    docsUrl: "/docs/import/mindbody",
    templateUrl: "/templates/mindbody-import-template.csv",
    fields: [
      { key: "first_name", label: "First Name", required: true, type: "text", example: "John" },
      { key: "last_name", label: "Last Name", required: true, type: "text", example: "Smith" },
      { key: "email", label: "Email", required: true, type: "email", example: "john@example.com" },
      { key: "phone", label: "Phone", required: false, type: "phone", example: "+12125551234", description: "International format" },
      { key: "birth_date", label: "Birth Date", required: false, type: "date", example: "1990-05-15" },
      { key: "gender", label: "Gender", required: false, type: "text", example: "M" },
      { key: "address_line1", label: "Address", required: false, type: "text", example: "123 Main St" },
      { key: "city", label: "City", required: false, type: "text", example: "New York" },
      { key: "state", label: "State", required: false, type: "text", example: "NY" },
      { key: "postal_code", label: "Postal Code", required: false, type: "text", example: "10001" },
      { key: "emergency_contact_name", label: "Emergency Contact", required: false, type: "text", example: "Jane Doe" },
      { key: "emergency_contact_phone", label: "Emergency Phone", required: false, type: "phone", example: "+12125555678" },
    ],
  },
  glofox: {
    name: "Glofox",
    logo: "GF",
    color: "bg-violet-600",
    description: "Import your member data, class schedules, and memberships from Glofox using a CSV file.",
    docsUrl: "/docs/import/glofox",
    templateUrl: "/templates/glofox-import-template.csv",
    fields: [
      { key: "first_name", label: "First Name", required: true, type: "text", example: "Aoife" },
      { key: "last_name", label: "Last Name", required: true, type: "text", example: "O'Brien" },
      { key: "email", label: "Email", required: true, type: "email", example: "aoife@example.ie" },
      { key: "phone", label: "Phone", required: false, type: "phone", example: "+353851234567", description: "International format (Ireland: +353)" },
      { key: "birth_date", label: "Birth Date", required: false, type: "date", example: "1995-06-20" },
      { key: "gender", label: "Gender", required: false, type: "text", example: "F" },
      { key: "address_line1", label: "Address", required: false, type: "text", example: "15 Grafton Street" },
      { key: "city", label: "City", required: false, type: "text", example: "Dublin" },
      { key: "postal_code", label: "Postal Code", required: false, type: "text", example: "D02" },
      { key: "country", label: "Country", required: false, type: "text", example: "IE" },
      { key: "emergency_contact_name", label: "Emergency Contact", required: false, type: "text", example: "Cian O'Brien" },
      { key: "emergency_contact_phone", label: "Emergency Phone", required: false, type: "phone", example: "+353861234567" },
    ],
  },
  tecnofit: {
    name: "Tecnofit",
    logo: "TF",
    color: "bg-emerald-600",
    description: "Import your student data, training plans, and memberships from Tecnofit using a CSV file.",
    docsUrl: "/docs/import/tecnofit",
    templateUrl: "/templates/tecnofit-import-template.csv",
    fields: [
      { key: "first_name", label: "First Name", required: true, type: "text", example: "João" },
      { key: "last_name", label: "Last Name", required: true, type: "text", example: "Silva" },
      { key: "email", label: "Email", required: true, type: "email", example: "joao@example.com.br" },
      { key: "phone", label: "Phone", required: false, type: "phone", example: "+5511987654321", description: "Brazilian format: +55 + DDD + number" },
      { key: "tax_id", label: "CPF", required: false, type: "text", example: "12345678900", description: "Numbers only, no dots or dashes" },
      { key: "birth_date", label: "Birth Date", required: false, type: "date", example: "1990-03-15" },
      { key: "gender", label: "Gender", required: false, type: "text", example: "M" },
      { key: "address_line1", label: "Address", required: false, type: "text", example: "Av. Paulista, 1000" },
      { key: "neighborhood", label: "Neighborhood", required: false, type: "text", example: "Bela Vista" },
      { key: "city", label: "City", required: false, type: "text", example: "São Paulo" },
      { key: "state", label: "State", required: false, type: "text", example: "SP" },
      { key: "postal_code", label: "CEP", required: false, type: "text", example: "01310-100" },
      { key: "country", label: "Country", required: false, type: "text", example: "BR" },
    ],
  },
};
