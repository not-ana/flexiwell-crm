import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Staff } from "@/lib/db/schemas";

// GET /api/staff - List all staff with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = await getDatabase();

    // Build filter query
    const filter: Record<string, unknown> = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (role && role !== "all") {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [staff, total] = await Promise.all([
      db
        .collection<Staff>("staff")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<Staff>("staff").countDocuments(filter),
    ]);

    return NextResponse.json({
      staff,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

// POST /api/staff - Create a new staff member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, role, specialties, schedule } = body;

    // Validation
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 }
      );
    }

    if (!["admin", "teacher", "receptionist"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, teacher, or receptionist" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if email already exists
    const existingStaff = await db
      .collection<Staff>("staff")
      .findOne({ email: email.toLowerCase() });

    if (existingStaff) {
      return NextResponse.json(
        { error: "A staff member with this email already exists" },
        { status: 409 }
      );
    }

    const newStaff: Omit<Staff, "_id"> = {
      name,
      email: email.toLowerCase(),
      phone: phone || "",
      role,
      specialties: specialties || [],
      schedule: schedule || [],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Staff>("staff").insertOne(newStaff);

    return NextResponse.json(
      {
        success: true,
        staff: {
          _id: result.insertedId,
          ...newStaff,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating staff:", error);
    return NextResponse.json(
      { error: "Failed to create staff member" },
      { status: 500 }
    );
  }
}
