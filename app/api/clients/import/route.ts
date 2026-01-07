import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Client } from "@/lib/db/schemas";

// POST /api/clients/import - Import multiple clients from CSV data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientsData } = body;

    if (!Array.isArray(clientsData) || clientsData.length === 0) {
      return NextResponse.json(
        { error: "clientsData array is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; email: string; error: string }[],
      imported: [] as string[],
    };

    // Get existing emails to check for duplicates
    const existingEmails = new Set(
      (await db.collection<Client>("clients")
        .find({}, { projection: { email: 1 } })
        .toArray()
      ).map(c => c.email.toLowerCase())
    );

    const clientsToInsert: Client[] = [];
    const now = new Date();

    for (let i = 0; i < clientsData.length; i++) {
      const row = clientsData[i];
      const rowNum = i + 1;

      // Validate required fields
      if (!row.name || !row.email) {
        results.failed++;
        results.errors.push({
          row: rowNum,
          email: row.email || "missing",
          error: "Name and email are required",
        });
        continue;
      }

      const email = row.email.toLowerCase().trim();

      // Check for duplicate in CSV itself
      const duplicateInBatch = clientsToInsert.some(c => c.email === email);
      if (duplicateInBatch) {
        results.failed++;
        results.errors.push({
          row: rowNum,
          email,
          error: "Duplicate email in import file",
        });
        continue;
      }

      // Check if email already exists in database
      if (existingEmails.has(email)) {
        results.failed++;
        results.errors.push({
          row: rowNum,
          email,
          error: "A client with this email already exists",
        });
        continue;
      }

      // Parse plan type
      let planType: "monthly" | "quarterly" | "annual" | "drop-in" = "monthly";
      if (row.planType) {
        const pt = row.planType.toLowerCase().trim();
        if (["monthly", "quarterly", "annual", "drop-in"].includes(pt)) {
          planType = pt as typeof planType;
        }
      }

      // Default plan settings based on type
      const planDefaults: Record<string, { classes: number; days: number; price: number }> = {
        "monthly": { classes: 8, days: 30, price: 299 },
        "quarterly": { classes: 24, days: 90, price: 799 },
        "annual": { classes: 96, days: 365, price: 2499 },
        "drop-in": { classes: 1, days: 7, price: 50 },
      };

      const planSettings = planDefaults[planType];

      // Create client record
      const newClient: Client = {
        name: row.name.trim(),
        email,
        phone: row.phone?.trim() || "",
        whatsappId: row.whatsappId?.trim() || undefined,
        instagramId: row.instagramId?.trim() || undefined,
        plan: {
          type: planType,
          totalClasses: parseInt(row.totalClasses) || planSettings.classes,
          usedClasses: 0,
          remainingClasses: parseInt(row.totalClasses) || planSettings.classes,
          startDate: now,
          endDate: new Date(now.getTime() + planSettings.days * 24 * 60 * 60 * 1000),
          price: parseFloat(row.price) || planSettings.price,
        },
        status: "pending",
        preferences: {
          notifications: {
            email: true,
            whatsapp: false,
            instagram: false,
          },
        },
        createdAt: now,
        updatedAt: now,
      };

      clientsToInsert.push(newClient);
      existingEmails.add(email); // Prevent duplicates in same batch
    }

    // Insert all valid clients
    if (clientsToInsert.length > 0) {
      const insertResult = await db.collection<Client>("clients").insertMany(clientsToInsert);
      results.success = insertResult.insertedCount;
      results.imported = clientsToInsert.map(c => c.email);
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Successfully imported ${results.success} clients. ${results.failed} failed.`,
    });
  } catch (error) {
    console.error("Error importing clients:", error);
    return NextResponse.json(
      { error: "Failed to import clients" },
      { status: 500 }
    );
  }
}
