import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Client } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// GET /api/clients - Get all clients with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const db = await getDatabase();

    // Build query
    const query: Record<string, unknown> = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const [clients, total] = await Promise.all([
      db.collection<Client>("clients")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<Client>("clients").countDocuments(query),
    ]);

    return NextResponse.json({
      clients,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, plan, preferences } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if email already exists
    const existingClient = await db.collection<Client>("clients").findOne({ email });
    if (existingClient) {
      return NextResponse.json(
        { error: "A client with this email already exists" },
        { status: 409 }
      );
    }

    const now = new Date();
    const newClient: Client = {
      name,
      email,
      phone: phone || "",
      whatsappId: body.whatsappId,
      instagramId: body.instagramId,
      avatar: body.avatar,
      plan: plan || {
        type: "monthly",
        totalClasses: 8,
        usedClasses: 0,
        remainingClasses: 8,
        startDate: now,
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        price: 299,
      },
      status: "pending",
      preferences: preferences || {
        notifications: {
          email: true,
          whatsapp: false,
          instagram: false,
        },
      },
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<Client>("clients").insertOne(newClient);

    return NextResponse.json({
      success: true,
      clientId: result.insertedId,
      client: { ...newClient, _id: result.insertedId },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
