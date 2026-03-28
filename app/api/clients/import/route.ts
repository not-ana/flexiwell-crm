import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Client } from "@/lib/db/schemas";
import { requireRole } from "@/lib/auth";

// POST /api/clients/import - Import multiple clients from CSV data
export async function POST(request: NextRequest) {
  const { user, error: authError } = requireRole(request, ["admin"]);
  if (authError) return authError;

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

    // Get existing emails to check for duplicates (scoped to establishment)
    const emailQuery: Record<string, unknown> = {};
    if (user?.establishmentId) {
      emailQuery.establishmentId = user.establishmentId;
    }
    const existingEmails = new Set(
      (await db.collection<Client>("clients")
        .find(emailQuery, { projection: { email: 1 } })
        .toArray()
      ).map(c => c.email.toLowerCase())
    );

    const clientsToInsert: Client[] = [];
    const now = new Date();

    for (let i = 0; i < clientsData.length; i++) {
      const row = clientsData[i];
      const rowNum = i + 1;

      // Build name from first_name + last_name if name not provided directly
      if (!row.name && (row.first_name || row.last_name)) {
        row.name = [row.first_name, row.last_name].filter(Boolean).join(" ");
      }

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

      // Parse plan type from planType field or pricing_option (Mindbody)
      let planType: "monthly" | "quarterly" | "annual" | "drop-in" = "monthly";
      const rawPlan = (row.planType || row.pricing_option || "").toLowerCase().trim();
      if (rawPlan) {
        // Direct match
        if (["monthly", "quarterly", "annual", "drop-in"].includes(rawPlan)) {
          planType = rawPlan as typeof planType;
        }
        // Fuzzy match from pricing option names (e.g. "Unlimited Monthly", "8-Class Pack")
        else if (rawPlan.includes("annual") || rawPlan.includes("yearly") || rawPlan.includes("anual")) {
          planType = "annual";
        } else if (rawPlan.includes("quarter") || rawPlan.includes("trimest")) {
          planType = "quarterly";
        } else if (rawPlan.includes("drop") || rawPlan.includes("single") || rawPlan.includes("avulso")) {
          planType = "drop-in";
        }
        // else stays "monthly" (most common default)
      }

      // Default plan settings based on type
      const planDefaults: Record<string, { classes: number; days: number; price: number }> = {
        "monthly": { classes: 8, days: 30, price: 299 },
        "quarterly": { classes: 24, days: 90, price: 799 },
        "annual": { classes: 96, days: 365, price: 2499 },
        "drop-in": { classes: 1, days: 7, price: 50 },
      };

      const planSettings = planDefaults[planType];

      // Parse member status
      let clientStatus: "active" | "inactive" | "pending" = "pending";
      const rawStatus = (row.member_status || "").toLowerCase().trim();
      if (rawStatus === "active" || rawStatus === "ativo") {
        clientStatus = "active";
      } else if (rawStatus === "inactive" || rawStatus === "inativo" || rawStatus === "suspended" || rawStatus === "expired") {
        clientStatus = "inactive";
      }

      // Parse remaining classes (from CSV or defaults)
      const remainingClasses = parseInt(row.remaining_classes) || parseInt(row.totalClasses) || planSettings.classes;

      // Parse join date
      const joinDate = row.join_date ? new Date(row.join_date) : now;
      const validJoinDate = isNaN(joinDate.getTime()) ? now : joinDate;

      // Create client record
      const newClient: Client = {
        ...(user?.establishmentId ? { establishmentId: user.establishmentId } : {}),
        name: row.name.trim(),
        email,
        phone: row.phone?.trim() || "",
        whatsappId: row.whatsappId?.trim() || undefined,
        instagramId: row.instagramId?.trim() || undefined,
        plan: {
          type: planType,
          totalClasses: remainingClasses,
          usedClasses: 0,
          remainingClasses,
          startDate: validJoinDate,
          endDate: new Date(now.getTime() + planSettings.days * 24 * 60 * 60 * 1000),
          price: parseFloat(row.payment_amount) || parseFloat(row.price) || planSettings.price,
        },
        status: clientStatus,
        preferences: {
          notifications: {
            email: true,
            whatsapp: false,
            instagram: false,
            sms: false,
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
    const message = error instanceof Error ? error.message : "Failed to import clients";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
