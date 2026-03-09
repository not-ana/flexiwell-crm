import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Client } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";
import { sendIntakeForm } from "@/lib/services/intake.service";

// GET /api/clients/[id] - Get a single client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid client ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const client = await db.collection<Client>("clients").findOne({
      _id: new ObjectId(id),
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update a client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid client ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Remove _id from update data if present
    const { _id, createdAt, ...updateData } = body;

    const result = await db.collection<Client>("clients").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      client: result,
    });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid client ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const result = await db.collection<Client>("clients").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}

// PATCH /api/clients/[id] - Partial update (e.g., status change, plan update)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid client ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    let updateOperation: Record<string, unknown> = {};

    switch (action) {
      case "approve":
        updateOperation = {
          $set: {
            status: "active",
            updatedAt: new Date(),
          },
        };
        break;

      case "deactivate":
        updateOperation = {
          $set: {
            status: "inactive",
            updatedAt: new Date(),
          },
        };
        break;

      case "update_plan":
        if (!body.plan) {
          return NextResponse.json(
            { error: "Plan data is required" },
            { status: 400 }
          );
        }
        updateOperation = {
          $set: {
            plan: body.plan,
            updatedAt: new Date(),
          },
        };
        break;

      case "update_preferences":
        if (!body.preferences) {
          return NextResponse.json(
            { error: "Preferences data is required" },
            { status: 400 }
          );
        }
        updateOperation = {
          $set: {
            preferences: body.preferences,
            updatedAt: new Date(),
          },
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    const result = await db.collection<Client>("clients").findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateOperation,
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Auto-send intake form when client is approved
    if (action === "approve" && result.email) {
      sendIntakeForm({
        clientId: id,
        clientName: result.name,
        clientEmail: result.email,
        createdBy: body.approvedBy || "",
      }).catch((err) => {
        console.error("Error auto-sending intake form on approval:", err);
      });
    }

    return NextResponse.json({
      success: true,
      client: result,
    });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}
