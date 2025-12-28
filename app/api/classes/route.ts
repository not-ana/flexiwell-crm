import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Class } from "@/lib/db/schemas";

// GET /api/classes - List all classes with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const instructorId = searchParams.get("instructorId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = await getDatabase();

    // Build filter query
    const filter: Record<string, unknown> = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (type && type !== "all") {
      filter.type = type;
    }

    if (instructorId) {
      filter.instructorId = instructorId;
    }

    if (dateFrom || dateTo) {
      filter.scheduledDate = {};
      if (dateFrom) {
        (filter.scheduledDate as Record<string, Date>).$gte = new Date(dateFrom);
      }
      if (dateTo) {
        (filter.scheduledDate as Record<string, Date>).$lte = new Date(dateTo);
      }
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { instructorName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [classes, total] = await Promise.all([
      db
        .collection<Class>("classes")
        .find(filter)
        .sort({ scheduledDate: 1, startTime: 1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<Class>("classes").countDocuments(filter),
    ]);

    return NextResponse.json({
      classes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}

// POST /api/classes - Create a new class
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      type,
      instructorId,
      instructorName,
      scheduledDate,
      startTime,
      endTime,
      duration,
      maxCapacity,
      location,
      notes,
    } = body;

    // Validation
    if (!title || !type || !instructorId || !instructorName || !scheduledDate || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Title, type, instructor details, scheduled date, start time, and end time are required" },
        { status: 400 }
      );
    }

    const validTypes = ["yoga", "pilates", "stretching", "meditation", "other"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const newClass: Omit<Class, "_id"> = {
      title,
      description: description || "",
      type,
      instructorId,
      instructorName,
      scheduledDate: new Date(scheduledDate),
      startTime,
      endTime,
      duration: duration || 60,
      maxCapacity: maxCapacity || 10,
      currentEnrollment: 0,
      enrolledClients: [],
      waitlist: [],
      status: "scheduled",
      location: location || "",
      notes: notes || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Class>("classes").insertOne(newClass);

    return NextResponse.json(
      {
        success: true,
        class: {
          _id: result.insertedId,
          ...newClass,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    );
  }
}
