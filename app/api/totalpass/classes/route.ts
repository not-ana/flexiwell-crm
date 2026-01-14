// TotalPass Class Sync API
// POST /api/totalpass/classes - Sync classes to TotalPass

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  syncClassToTotalPass,
  syncAllUpcomingClasses,
  cancelClassOnTotalPass,
  enableTotalPassSync,
  disableTotalPassSync,
} from "@/lib/totalpass/classes";
import { isIntegrationConnected } from "@/lib/integrations/credentials";

// POST /api/totalpass/classes - Sync a single class or all classes
export async function POST(request: NextRequest) {
  try {
    const { error } = requireRole(request, ["admin"]);
    if (error) return error;

    // Check if TotalPass is connected
    const isConnected = await isIntegrationConnected("totalpass");
    if (!isConnected) {
      return NextResponse.json(
        { error: "TotalPass integration not configured" },
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
        const result = await syncClassToTotalPass(classId);
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
        const result = await cancelClassOnTotalPass(classId);
        return NextResponse.json(result);
      }

      case "enable": {
        if (!classId) {
          return NextResponse.json(
            { error: "classId is required" },
            { status: 400 }
          );
        }
        await enableTotalPassSync(classId);
        return NextResponse.json({ success: true });
      }

      case "disable": {
        if (!classId) {
          return NextResponse.json(
            { error: "classId is required" },
            { status: 400 }
          );
        }
        await disableTotalPassSync(classId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: sync_one, sync_all, cancel, enable, disable" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("TotalPass classes API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/totalpass/classes - Get sync status
export async function GET(request: NextRequest) {
  try {
    const { error } = requireRole(request, ["admin"]);
    if (error) return error;

    const isConnected = await isIntegrationConnected("totalpass");

    return NextResponse.json({
      connected: isConnected,
      message: isConnected
        ? "TotalPass integration is active"
        : "TotalPass integration not configured. Please add credentials.",
    });
  } catch (error) {
    console.error("TotalPass status API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
