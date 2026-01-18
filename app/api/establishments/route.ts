import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Establishment } from "@/lib/db/schemas";
import { requireRole } from "@/lib/auth";
import { checkResourceLimit, checkFeatureAccess, createPlanErrorResponse } from "@/lib/plans/enforcement";

// GET /api/establishments - List all establishments
// Query params:
//   - active=true: only return active establishments
//   - teacherId=xxx: only return establishments where this teacher is assigned
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const teacherId = searchParams.get("teacherId");

    const db = await getDatabase();

    const filter: Record<string, unknown> = {};
    if (activeOnly) {
      filter.isActive = true;
    }
    if (teacherId) {
      filter.assignedTeachers = teacherId;
    }

    // Try establishments collection first
    let establishments = await db
      .collection<Establishment>("establishments")
      .find(filter)
      .sort({ name: 1 })
      .toArray();

    // If no establishments found, try the 'units' collection (legacy)
    if (establishments.length === 0) {
      const units = await db
        .collection("units")
        .find(filter)
        .sort({ name: 1 })
        .toArray();

      // Map units to establishment format
      establishments = units.map(unit => ({
        _id: unit._id!,
        name: unit.name,
        location: unit.address || unit.location || "",
        address: unit.address || "",
        phone: unit.phone || "",
        ownerId: unit.ownerId || "",
        adminIds: unit.adminIds || [],
        assignedTeachers: unit.assignedTeachers || [],
        rooms: unit.rooms || [],
        isActive: unit.status === "active" || unit.isActive === true,
        createdAt: unit.createdAt || new Date(),
        updatedAt: unit.updatedAt || new Date(),
      }));
    }

    return NextResponse.json({ establishments });
  } catch (error) {
    console.error("Error fetching establishments:", error);
    return NextResponse.json(
      { error: "Failed to fetch establishments" },
      { status: 500 }
    );
  }
}

// POST /api/establishments - Create a new establishment
export async function POST(request: NextRequest) {
  // Require authentication - only admin can create establishments
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { name, location, address, phone, assignedTeachers } = body;

    if (!name || !location) {
      return NextResponse.json(
        { error: "Name and location are required" },
        { status: 400 }
      );
    }

    // Check plan limit for locations/establishments
    const limitCheck = await checkResourceLimit(user!.userId, "maxLocations");
    if (!limitCheck.allowed) {
      return NextResponse.json(createPlanErrorResponse(limitCheck), { status: 403 });
    }

    // Check if multi-location feature is available (for plans that only allow 1 location)
    const featureCheck = await checkFeatureAccess(user!.userId, "multiLocation");
    if (!featureCheck.allowed) {
      // Check if this would be their second+ location
      const db = await getDatabase();
      const existingCount = await db.collection("establishments").countDocuments({ ownerId: user!.userId });
      if (existingCount > 0) {
        return NextResponse.json(createPlanErrorResponse(featureCheck), { status: 403 });
      }
    }

    const db = await getDatabase();

    const newEstablishment: Omit<Establishment, "_id"> = {
      name,
      location,
      address: address || "",
      phone: phone || "",
      ownerId: user!.userId,
      adminIds: [user!.userId],
      assignedTeachers: assignedTeachers || [],
      rooms: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Establishment>("establishments").insertOne(newEstablishment);

    return NextResponse.json(
      {
        success: true,
        establishment: {
          _id: result.insertedId,
          ...newEstablishment,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating establishment:", error);
    return NextResponse.json(
      { error: "Failed to create establishment" },
      { status: 500 }
    );
  }
}
