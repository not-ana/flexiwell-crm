"use client";

import { DataImportUploader } from "@/components/import/DataImportUploader";

const mindbodyFields = [
  { key: "first_name", label: "First Name", required: true, type: "text" as const, example: "John" },
  { key: "last_name", label: "Last Name", required: true, type: "text" as const, example: "Smith" },
  { key: "email", label: "Email", required: true, type: "email" as const, example: "john@example.com" },
  { key: "phone", label: "Phone", required: false, type: "phone" as const, example: "+12125551234", description: "International format with +" },
  { key: "birth_date", label: "Birth Date", required: false, type: "date" as const, example: "1990-05-15" },
  { key: "gender", label: "Gender", required: false, type: "text" as const, example: "M" },
  { key: "address_line1", label: "Address", required: false, type: "text" as const, example: "123 Main St" },
  { key: "city", label: "City", required: false, type: "text" as const, example: "New York" },
  { key: "state", label: "State", required: false, type: "text" as const, example: "NY" },
  { key: "postal_code", label: "Postal Code", required: false, type: "text" as const, example: "10001" },
  { key: "emergency_contact_name", label: "Emergency Contact", required: false, type: "text" as const, example: "Jane Doe" },
  { key: "emergency_contact_phone", label: "Emergency Phone", required: false, type: "phone" as const, example: "+12125555678" },
];

export default function MindbodyImportPage() {
  const handleImport = async (data: Record<string, string>[]) => {
    // Here you would call your API to actually import the data
    // For now, we'll just simulate it
    console.log("Importing data:", data);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Example API call:
    // const response = await fetch("/api/admin/import/mindbody", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ records: data }),
    // });
    //
    // if (!response.ok) {
    //   throw new Error("Import failed");
    // }
  };

  return (
    <DataImportUploader
      platform="Mindbody"
      platformLogo="MB"
      platformColor="bg-teal-600"
      description="Import your client data, class schedules, and memberships from Mindbody using a CSV file."
      docsUrl="/docs/import/mindbody"
      templateUrl="/templates/mindbody-import-template.csv"
      fields={mindbodyFields}
      onImport={handleImport}
    />
  );
}
