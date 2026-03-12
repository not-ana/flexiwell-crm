// POST /api/admin/clients/bulk - Bulk operations on clients
// Supports: activate, deactivate, delete (soft), update_lifecycle, send_win_back

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

type BulkAction = "activate" | "deactivate" | "delete" | "update_lifecycle" | "send_win_back";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, clientIds, params: actionParams } = body as {
      action: BulkAction;
      clientIds: string[];
      params?: Record<string, unknown>;
    };

    if (!action || !clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json(
        { error: "action and clientIds array are required" },
        { status: 400 }
      );
    }

    if (clientIds.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 clients per bulk operation" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const objectIds = clientIds.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));

    if (objectIds.length === 0) {
      return NextResponse.json(
        { error: "No valid client IDs provided" },
        { status: 400 }
      );
    }

    let result;
    const now = new Date();

    switch (action) {
      case "activate":
        result = await db.collection("clients").updateMany(
          { _id: { $in: objectIds }, deletedAt: { $exists: false } },
          { $set: { status: "active", updatedAt: now } }
        );
        break;

      case "deactivate":
        result = await db.collection("clients").updateMany(
          { _id: { $in: objectIds }, deletedAt: { $exists: false } },
          { $set: { status: "inactive", updatedAt: now } }
        );
        break;

      case "delete":
        // Soft-delete: mark as deleted, don't remove from DB
        result = await db.collection("clients").updateMany(
          { _id: { $in: objectIds }, deletedAt: { $exists: false } },
          {
            $set: {
              deletedAt: now,
              deletedBy: (actionParams?.adminId as string) || "system",
              deleteReason: (actionParams?.reason as string) || "bulk_delete",
              status: "inactive",
              updatedAt: now,
            },
          }
        );

        // Log activity
        await db.collection("activities").insertOne({
          type: "system",
          action: "bulk_soft_delete",
          description: `Soft-deleted ${result.modifiedCount} clients`,
          metadata: { clientIds: clientIds.slice(0, 50), reason: actionParams?.reason },
          createdAt: now,
        });
        break;

      case "update_lifecycle":
        if (!actionParams?.lifecycleStage) {
          return NextResponse.json(
            { error: "params.lifecycleStage is required for update_lifecycle" },
            { status: 400 }
          );
        }
        result = await db.collection("clients").updateMany(
          { _id: { $in: objectIds }, deletedAt: { $exists: false } },
          { $set: { lifecycleStage: actionParams.lifecycleStage, updatedAt: now } }
        );
        break;

      case "send_win_back":
        // Mark clients for win-back and return them for the notification service
        const clients = await db.collection("clients")
          .find({
            _id: { $in: objectIds },
            deletedAt: { $exists: false },
            lifecycleStage: { $in: ["churned", "at_risk"] },
          })
          .project({ _id: 1, name: 1, email: 1, phone: 1 })
          .toArray();

        await db.collection("clients").updateMany(
          { _id: { $in: clients.map(c => c._id) } },
          { $set: { lastChurnAlertSentAt: now, updatedAt: now } }
        );

        return NextResponse.json({
          success: true,
          action,
          eligibleCount: clients.length,
          clients: clients.map(c => ({ id: c._id.toString(), name: c.name, email: c.email })),
          message: `${clients.length} clients eligible for win-back campaign`,
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      requestedCount: clientIds.length,
      modifiedCount: result?.modifiedCount || 0,
    });
  } catch (error) {
    console.error("Bulk operation error:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk operation" },
      { status: 500 }
    );
  }
}
