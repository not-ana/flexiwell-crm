import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Establishment } from "@/lib/db/schemas";

// GET /api/establishments - List all establishments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const db = await getDatabase();

    const filter: Record<string, unknown> = {};
    if (activeOnly) {
      filter.isActive = true;
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
        _id: unit._id,
        name: unit.name,
        location: unit.address || unit.location || "",
        address: unit.address || "",
        phone: unit.phone || "",
        assignedTeachers: [],
        rooms: unit.rooms || [],
        isActive: unit.status === "active",
        createdAt: unit.createdAt || new Date(),
        updatedAt: unit.updatedAt || new Date(),
      })) as Establishment[];
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
  try {
    const body = await request.json();
    const { name, location, address, phone, assignedTeachers } = body;

    if (!name || !location) {
      return NextResponse.json(
        { error: "Name and location are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const newEstablishment: Omit<Establishment, "_id"> = {
      name,
      location,
      address: address || "",
      phone: phone || "",
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
