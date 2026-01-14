// ClassPass Schedule Sync API
// POST /api/classpass/classes - Sync classes to ClassPass

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  syncClassToClassPass,
  syncAllUpcomingClasses,
  cancelClassOnClassPass,
  enableClassPassSync,
  disableClassPassSync,
} from "@/lib/classpass/classes";
import { isIntegrationConnected } from "@/lib/integrations/credentials";

// POST /api/classpass/classes - Sync a single class or all classes
export async function POST(request: NextRequest) {
  try {
    const { error } = requireRole(request, ["admin"]);
    if (error) return error;

    // Check if ClassPass is connected
    const isConnected = await isIntegrationConnected("classpass");
    if (!isConnected) {
      return NextResponse.json(
        { error: "ClassPass integration not configured" },
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
        const result = await syncClassToClassPass(classId);
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
        const result = await cancelClassOnClassPass(classId);
        return NextResponse.json(result);
      }

      case "enable": {
        if (!classId) {
          return NextResponse.json(
            { error: "classId is required" },
            { status: 400 }
          );
        }
        await enableClassPassSync(classId);
        return NextResponse.json({ success: true });
      }

      case "disable": {
        if (!classId) {
          return NextResponse.json(
            { error: "classId is required" },
            { status: 400 }
          );
        }
        await disableClassPassSync(classId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: sync_one, sync_all, cancel, enable, disable" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("ClassPass classes API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/classpass/classes - Get sync status
export async function GET(request: NextRequest) {
  try {
    const { error } = requireRole(request, ["admin"]);
    if (error) return error;

    const isConnected = await isIntegrationConnected("classpass");

    return NextResponse.json({
      connected: isConnected,
      message: isConnected
        ? "ClassPass integration is active"
        : "ClassPass integration not configured. Please add credentials.",
    });
  } catch (error) {
    console.error("ClassPass status API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
