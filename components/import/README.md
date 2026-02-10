# Data Import Components

This directory contains reusable components for importing data from various fitness management platforms using CSV spreadsheets.

## DataImportUploader Component

A comprehensive, multi-step import component with validation, preview, and error handling.

### Features

- **Drag & Drop Upload**: Easy file upload with drag and drop support
- **CSV Parsing**: Automatic parsing of CSV files
- **Validation**: Real-time validation of required fields and data types
- **Preview**: Shows preview of data before import with error highlighting
- **Error Reporting**: Clear error messages with row and field information
- **Multi-Step Flow**: Upload → Preview → Success
- **Template Download**: Built-in link to download CSV template
- **Documentation Link**: Direct link to import documentation

### Usage

```typescript
import { DataImportUploader } from "@/components/import/DataImportUploader";

// Define your fields
const fields = [
  {
    key: "first_name",
    label: "First Name",
    required: true,
    type: "text",
    example: "John",
    description: "Client's first name"
  },
  {
    key: "email",
    label: "Email",
    required: true,
    type: "email",
    example: "john@example.com"
  },
  {
    key: "birth_date",
    label: "Birth Date",
    required: false,
    type: "date",
    example: "1990-05-15",
    description: "Format: YYYY-MM-DD"
  },
  // ... more fields
];

// Create import handler
const handleImport = async (data: Record<string, string>[]) => {
  const response = await fetch("/api/admin/import/platform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records: data }),
  });

  if (!response.ok) {
    throw new Error("Import failed");
  }
};

// Use the component
<DataImportUploader
  platform="Mindbody"
  platformLogo="MB"
  platformColor="bg-teal-600"
  description="Import your client data from Mindbody"
  docsUrl="/docs/import/mindbody"
  templateUrl="/templates/mindbody-import-template.csv"
  fields={fields}
  onImport={handleImport}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `platform` | `string` | Yes | Name of the platform (e.g., "Mindbody") |
| `platformLogo` | `string` | No | Logo text or initials (e.g., "MB") |
| `platformColor` | `string` | No | Tailwind color class for logo background |
| `description` | `string` | Yes | Description of what data will be imported |
| `docsUrl` | `string` | Yes | URL to full documentation |
| `templateUrl` | `string` | Yes | URL to download CSV template |
| `fields` | `ImportField[]` | Yes | Array of field definitions |
| `onImport` | `function` | Yes | Async function called when user clicks Import |

### Field Definition

```typescript
interface ImportField {
  key: string;          // CSV column name
  label: string;        // Display label
  required: boolean;    // Whether field is required
  type: "text" | "email" | "phone" | "date" | "time" | "number" | "boolean";
  example: string;      // Example value
  description?: string; // Optional description/help text
}
```

### Validation Rules

The component automatically validates:

- **Required fields**: Must have a value
- **Email**: Must contain @ symbol
- **Date**: Must be in YYYY-MM-DD format
- **Time**: Must be in HH:MM format (24-hour)

### Steps

#### 1. Upload Step
- Shows instructions
- Provides documentation and template download buttons
- Drag & drop or click to upload CSV
- Shows expected format table

#### 2. Preview Step
- Displays validation summary (errors or success)
- Shows preview of first 10 rows
- Highlights rows and cells with errors
- Lists all validation errors
- Allows user to cancel or proceed

#### 3. Success Step
- Shows success message
- Displays count of imported records
- Provides navigation options

### Creating Import Pages

For each platform, create a page in `/app/admin/import/[platform]/page.tsx`:

```typescript
// app/admin/import/classpass/page.tsx
"use client";

import { DataImportUploader } from "@/components/import/DataImportUploader";

const classpassFields = [
  // Define fields...
];

export default function ClassPassImportPage() {
  const handleImport = async (data: Record<string, string>[]) => {
    // API call to import data
  };

  return (
    <DataImportUploader
      platform="ClassPass"
      platformLogo="CP"
      platformColor="bg-primary-600"
      description="Import bookings and client data from ClassPass"
      docsUrl="/docs/import/classpass"
      templateUrl="/templates/classpass-import-template.csv"
      fields={classpassFields}
      onImport={handleImport}
    />
  );
}
```

### Creating CSV Templates

Create a template CSV file in `/public/templates/` with:
1. Header row with field names matching `ImportField.key`
2. 1-2 example rows with realistic data
3. Save with UTF-8 encoding

Example:
```csv
first_name,last_name,email,phone,birth_date
John,Smith,john@example.com,+12125551234,1990-05-15
Sarah,Johnson,sarah@example.com,+12125556789,1985-08-20
```

### Error Handling

The component provides comprehensive error handling:

- File type validation (CSV only)
- Empty file detection
- Field validation per row
- Clear error messages with row numbers
- Error highlighting in preview table
- Prevents import if errors exist

### Styling

The component uses Tailwind CSS and is fully responsive. It follows the FlexiWell design system with:
- Primary color for actions
- Gray scale for UI elements
- Red for errors
- Green for success
- Blue for information

### Accessibility

- Keyboard navigation support
- Clear focus states
- Semantic HTML
- Screen reader friendly

## Example Implementations

See these pages for complete examples:
- `/app/admin/import/mindbody/page.tsx` - Mindbody import
- `/app/admin/import/classpass/page.tsx` - ClassPass import (create similar)
- `/app/admin/import/glofox/page.tsx` - Glofox import (create similar)
- `/app/admin/import/tecnofit/page.tsx` - Tecnofit import (create similar)

## API Integration

The `onImport` function receives an array of records. Create an API endpoint to handle the import:

```typescript
// app/api/admin/import/mindbody/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { records } = await request.json();

    // Validate records
    // Transform data
    // Save to database
    // Send confirmation emails, etc.

    return NextResponse.json({
      success: true,
      imported: records.length
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Import failed" },
      { status: 500 }
    );
  }
}
```

## Best Practices

1. **Keep templates simple**: Include only essential fields
2. **Provide clear examples**: Use realistic data in templates
3. **Document format requirements**: YYYY-MM-DD for dates, +country code for phones, etc.
4. **Test with real data**: Export sample data from each platform to test
5. **Handle errors gracefully**: Provide clear error messages
6. **Allow re-import**: Users should be able to fix and re-upload
7. **Log imports**: Track who imported what and when

## Extending the Component

To add new validation types:

1. Add type to `ImportField.type` union
2. Add validation logic in `parseCSV` function
3. Update documentation

Example:
```typescript
if (field.type === "url" && !row[field.key].startsWith("http")) {
  validationErrors.push({
    row: i,
    field: field.key,
    message: `Invalid URL format`,
  });
}
```
