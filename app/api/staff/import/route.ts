import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Staff } from "@/lib/db/schemas";

// POST /api/staff/import - Import multiple staff members from CSV data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staffData } = body;

    if (!Array.isArray(staffData) || staffData.length === 0) {
      return NextResponse.json(
        { error: "staffData array is required" },
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
      (await db.collection<Staff>("staff")
        .find({}, { projection: { email: 1 } })
        .toArray()
      ).map(s => s.email.toLowerCase())
    );

    const staffToInsert: Omit<Staff, "_id">[] = [];
    const now = new Date();

    for (let i = 0; i < staffData.length; i++) {
      const row = staffData[i];
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
      const duplicateInBatch = staffToInsert.some(s => s.email === email);
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
          error: "A staff member with this email already exists",
        });
        continue;
      }

      // Validate role
      const role = row.role?.toLowerCase().trim() || "teacher";
      if (!["admin", "teacher"].includes(role)) {
        results.failed++;
        results.errors.push({
          row: rowNum,
          email,
          error: `Invalid role: ${row.role}. Must be admin or teacher`,
        });
        continue;
      }

      // Create staff record
      const newStaff: Omit<Staff, "_id"> = {
        name: row.name.trim(),
        email,
        phone: row.phone?.trim() || "",
        role: role as "admin" | "teacher",
        specialties: [],
        schedule: [],
        status: "inactive", // New imports start as inactive until activated
        createdAt: now,
        updatedAt: now,
      };

      // Add optional fields if present
      if (row.unit) {
        (newStaff as Staff & { unit?: string }).unit = row.unit.trim();
      }

      staffToInsert.push(newStaff);
      existingEmails.add(email); // Prevent duplicates in same batch
    }

    // Insert all valid staff members
    if (staffToInsert.length > 0) {
      const insertResult = await db.collection<Staff>("staff").insertMany(staffToInsert);
      results.success = insertResult.insertedCount;
      results.imported = staffToInsert.map(s => s.email);
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Successfully imported ${results.success} staff members. ${results.failed} failed.`,
    });
  } catch (error) {
    console.error("Error importing staff:", error);
    return NextResponse.json(
      { error: "Failed to import staff members" },
      { status: 500 }
    );
  }
}
