import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Client } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";
import { requireRole } from "@/lib/auth";
import { sanitizeSearchInput } from "@/lib/security";
import { checkResourceLimit, createPlanErrorResponse } from "@/lib/plans/enforcement";
import { sendIntakeForm } from "@/lib/services/intake.service";

// GET /api/clients - Get all clients with optional filters
export async function GET(request: NextRequest) {
  // Require authentication - only admin and teacher can list clients
  const { user, error } = requireRole(request, ["admin", "teacher"]);
  if (error) return error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const rawSearch = searchParams.get("search");
    const search = rawSearch ? sanitizeSearchInput(rawSearch) : null;
    const limit = parseInt(searchParams.get("limit") || "200");
    const skip = parseInt(searchParams.get("skip") || "0");

    const db = await getDatabase();

    // Build query - filter by establishment if user has one
    const query: Record<string, unknown> = {};

    if (user?.establishmentId) {
      query.establishmentId = user.establishmentId;
    }

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
  // Require authentication - only admin can create clients
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { name, email, phone, plan, preferences } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check plan limit for clients
    const limitCheck = await checkResourceLimit(user!.userId, "maxClients");
    if (!limitCheck.allowed) {
      return NextResponse.json(createPlanErrorResponse(limitCheck), { status: 403 });
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

    // Build plan with optional discount
    const basePlan = plan || {
      type: "monthly",
      totalClasses: 8,
      usedClasses: 0,
      remainingClasses: 8,
      startDate: now,
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      price: 299,
    };

    // Calculate final price if discount is provided
    if (basePlan.discountType && basePlan.discountValue != null && basePlan.discountValue > 0) {
      const originalPrice = basePlan.originalPrice ?? basePlan.price;
      basePlan.originalPrice = originalPrice;
      if (basePlan.discountType === "percentage") {
        basePlan.price = Math.round(originalPrice * (1 - basePlan.discountValue / 100) * 100) / 100;
      } else if (basePlan.discountType === "fixed") {
        basePlan.price = Math.max(0, originalPrice - basePlan.discountValue);
      }
      // "custom" type: price is set directly, originalPrice tracks the list price
    }

    const newClient: Client = {
      name,
      email,
      phone: phone || "",
      whatsappId: body.whatsappId,
      instagramId: body.instagramId,
      avatar: body.avatar,
      plan: basePlan,
      status: "pending",
      preferences: preferences || {
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

    const result = await db.collection<Client>("clients").insertOne(newClient);

    // Auto-send health assessment intake form (async, don't block response)
    sendIntakeForm({
      clientId: result.insertedId.toString(),
      clientName: name,
      clientEmail: email,
      createdBy: user!.userId,
    }).catch((err) => {
      console.error("Error auto-sending intake form:", err);
    });

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
