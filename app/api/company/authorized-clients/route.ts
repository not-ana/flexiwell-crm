import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { verifyAccessToken } from "@/lib/auth/jwt";
import type { AuthorizedClient } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// GET /api/company/authorized-clients - List all pre-authorized clients
export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const companyId = payload.userId;

    // Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "claimed" | "unclaimed" | "all"
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build query
    const query: Record<string, unknown> = { companyId };

    if (status === "claimed") {
      query.claimedBy = { $exists: true, $ne: null };
    } else if (status === "unclaimed") {
      query.claimedBy = { $exists: false };
    }

    if (search) {
      query.$or = [
        { identifier: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await db.collection<AuthorizedClient>("authorized_clients").countDocuments(query);

    // Get paginated results
    const authorizedClients = await db
      .collection<AuthorizedClient>("authorized_clients")
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      authorizedClients: authorizedClients.map(client => ({
        id: client._id?.toString(),
        identifier: client.identifier,
        identifierType: client.identifierType,
        name: client.name,
        claimedBy: client.claimedBy,
        claimedAt: client.claimedAt,
        invitedAt: client.invitedAt,
        createdAt: client.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching authorized clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch authorized clients" },
      { status: 500 }
    );
  }
}

// POST /api/company/authorized-clients - Add new pre-authorized clients
export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const companyId = payload.userId;

    const body = await request.json();
    const { clients } = body; // Array of { identifier, identifierType, name? }

    if (!clients || !Array.isArray(clients) || clients.length === 0) {
      return NextResponse.json(
        { error: "clients array is required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const results = {
      added: 0,
      duplicates: 0,
      errors: [] as string[],
    };

    for (const client of clients) {
      const { identifier, identifierType, name } = client;

      // Validate identifier type
      if (!["email", "phone", "cpf"].includes(identifierType)) {
        results.errors.push(`Invalid identifier type for ${identifier}`);
        continue;
      }

      // Check if already exists
      const existing = await db.collection<AuthorizedClient>("authorized_clients").findOne({
        companyId,
        identifier: identifier.toLowerCase().trim(),
        identifierType,
      });

      if (existing) {
        results.duplicates++;
        continue;
      }

      // Normalize identifier
      let normalizedIdentifier = identifier.trim();
      if (identifierType === "email") {
        normalizedIdentifier = normalizedIdentifier.toLowerCase();
      } else if (identifierType === "phone") {
        // Remove non-digits
        normalizedIdentifier = normalizedIdentifier.replace(/\D/g, "");
      } else if (identifierType === "cpf") {
        // Remove non-digits
        normalizedIdentifier = normalizedIdentifier.replace(/\D/g, "");
      }

      // Create authorized client entry
      const newAuthorizedClient: Omit<AuthorizedClient, "_id"> = {
        companyId,
        identifier: normalizedIdentifier,
        identifierType,
        name: name?.trim() || undefined,
        invitedBy: payload.userId,
        invitedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      await db.collection<AuthorizedClient>("authorized_clients").insertOne(newAuthorizedClient);
      results.added++;
    }

    return NextResponse.json({
      success: true,
      message: `Added ${results.added} authorized client(s)`,
      results,
    });
  } catch (error) {
    console.error("Error adding authorized clients:", error);
    return NextResponse.json(
      { error: "Failed to add authorized clients" },
      { status: 500 }
    );
  }
}

// DELETE /api/company/authorized-clients - Remove pre-authorized clients
export async function DELETE(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const companyId = payload.userId;

    const body = await request.json();
    const { ids } = body; // Array of authorized client IDs

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "ids array is required" },
        { status: 400 }
      );
    }

    // Convert to ObjectIds and ensure they belong to this company
    const objectIds = ids.map(id => new ObjectId(id));

    const result = await db.collection<AuthorizedClient>("authorized_clients").deleteMany({
      _id: { $in: objectIds },
      companyId,
      claimedBy: { $exists: false }, // Only delete unclaimed entries
    });

    return NextResponse.json({
      success: true,
      deleted: result.deletedCount,
      message: `Removed ${result.deletedCount} authorized client(s)`,
    });
  } catch (error) {
    console.error("Error removing authorized clients:", error);
    return NextResponse.json(
      { error: "Failed to remove authorized clients" },
      { status: 500 }
    );
  }
}
