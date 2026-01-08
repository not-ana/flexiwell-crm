import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/middleware";
import type { Activity } from "@/lib/db/schemas";

// GET /api/activities - List activities with filters
export async function GET(request: NextRequest) {
  try {
    // Require admin or teacher role
    const { error } = requireRole(request, ["admin", "teacher"]);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const entityType = searchParams.get("entityType");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const db = await getDatabase();

    const filter: Record<string, unknown> = {};

    if (type && type !== "all") {
      filter.type = type;
    }

    if (entityType) {
      filter.entityType = entityType;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(startDate);
      }
      if (endDate) {
        (filter.createdAt as Record<string, Date>).$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      db
        .collection<Activity>("activities")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<Activity>("activities").countDocuments(filter),
    ]);

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

// POST /api/activities - Create an activity log
export async function POST(request: NextRequest) {
  try {
    // Require admin role for manual activity creation
    const { error, user } = requireRole(request, ["admin"]);
    if (error) return error;

    const body = await request.json();
    const { type, action, description, entityId, entityType, metadata } = body;

    if (!type || !action || !description) {
      return NextResponse.json(
        { error: "type, action, and description are required" },
        { status: 400 }
      );
    }

    const validTypes = ["client", "class", "payment", "booking", "cancel", "staff", "system"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const newActivity: Omit<Activity, "_id"> = {
      type,
      action,
      description,
      entityId,
      entityType,
      userId: user?.userId,
      userName: user?.name,
      metadata,
      createdAt: new Date(),
    };

    const result = await db.collection<Activity>("activities").insertOne(newActivity);

    return NextResponse.json(
      {
        success: true,
        activity: {
          _id: result.insertedId,
          ...newActivity,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
