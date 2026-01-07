import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import type { Class, Staff } from "@/lib/db/schemas";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

async function getUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    ) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

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
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      instructorId: providedInstructorId,
      instructorName: providedInstructorName,
      scheduledDate,
      startTime,
      endTime,
      duration,
      maxCapacity,
      location,
      roomId,
      notes,
    } = body;

    // Validation
    if (!title || !type || !scheduledDate || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Title, type, scheduled date, start time, and end time are required" },
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

    // Get instructor info from logged in user if not provided
    let instructorId = providedInstructorId;
    let instructorName = providedInstructorName;

    if (!instructorId || !instructorName) {
      // Try to get from staff collection
      let staff: Staff | null = null;
      if (ObjectId.isValid(user.userId)) {
        staff = await db.collection<Staff>("staff").findOne({
          _id: new ObjectId(user.userId),
        });
      }
      if (!staff) {
        staff = await db.collection<Staff>("staff").findOne({
          email: user.email,
        });
      }

      if (staff) {
        instructorId = staff._id?.toString() || user.userId;
        instructorName = staff.name;
      } else {
        // Use user info from token
        instructorId = user.userId;
        instructorName = user.email.split("@")[0];
      }
    }

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
      roomId: roomId || "",
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
