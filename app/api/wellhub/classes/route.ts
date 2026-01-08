// Wellhub Class Sync API
// POST /api/wellhub/classes - Sync classes to Wellhub

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  syncClassToWellhub,
  syncAllUpcomingClasses,
  cancelClassOnWellhub,
  enableWellhubSync,
  disableWellhubSync,
} from "@/lib/wellhub/classes";
import { isIntegrationConnected } from "@/lib/integrations/credentials";

// POST /api/wellhub/classes - Sync a single class or all classes
export async function POST(request: NextRequest) {
  try {
    const { error } = requireRole(request, ["admin"]);
    if (error) return error;

    // Check if Wellhub is connected
    const isConnected = await isIntegrationConnected("wellhub");
    if (!isConnected) {
      return NextResponse.json(
        { error: "Wellhub integration not configured" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, classId } = body;

    switch (action) {
      case "sync_one": {
        if (!classId) {
          return NextResponse.json(
            { error: "classId is required" },
            { status: 400 }
          );
        }
        const result = await syncClassToWellhub(classId);
        return NextResponse.json(result);
      }

      case "sync_all": {
        const result = await syncAllUpcomingClasses();
        return NextResponse.json(result);
      }

      case "cancel": {
        if (!classId) {
          return NextResponse.json(
            { error: "classId is required" },
            { status: 400 }
          );
        }
        const result = await cancelClassOnWellhub(classId);
        return NextResponse.json(result);
      }

      case "enable": {
        if (!classId) {
          return NextResponse.json(
            { error: "classId is required" },
            { status: 400 }
          );
        }
        await enableWellhubSync(classId);
        return NextResponse.json({ success: true });
      }

      case "disable": {
        if (!classId) {
          return NextResponse.json(
            { error: "classId is required" },
            { status: 400 }
          );
        }
        await disableWellhubSync(classId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: sync_one, sync_all, cancel, enable, disable" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Wellhub classes API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/wellhub/classes - Get sync status
export async function GET(request: NextRequest) {
  try {
    const { error } = requireRole(request, ["admin"]);
    if (error) return error;

    const isConnected = await isIntegrationConnected("wellhub");

    return NextResponse.json({
      connected: isConnected,
      message: isConnected
        ? "Wellhub integration is active"
        : "Wellhub integration not configured. Please add credentials.",
    });
  } catch (error) {
    console.error("Wellhub status API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
