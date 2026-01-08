import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import {
  predictClassCancellations,
  predictClientBehavior,
  getWaitlistDashboardAnalytics,
  analyzeWaitlistIntelligence,
  getHistoricalConversionRate,
} from "@/lib/ai/waitlist-intelligence";

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

// GET /api/waitlist/ai - Get waitlist AI analytics
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only admin and teachers can access AI analytics
    if (!["admin", "teacher"].includes(user.role)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "dashboard";
    const classId = searchParams.get("classId");
    const clientId = searchParams.get("clientId");

    switch (action) {
      case "dashboard": {
        // Get overall waitlist analytics dashboard
        const analytics = await getWaitlistDashboardAnalytics();
        return NextResponse.json(analytics);
      }

      case "predict-cancellations": {
        if (!classId) {
          return NextResponse.json(
            { error: "classId is required for cancellation prediction" },
            { status: 400 }
          );
        }
        const prediction = await predictClassCancellations(classId);
        return NextResponse.json(prediction);
      }

      case "predict-client": {
        if (!clientId) {
          return NextResponse.json(
            { error: "clientId is required for client prediction" },
            { status: 400 }
          );
        }
        const clientPrediction = await predictClientBehavior(clientId);
        return NextResponse.json(clientPrediction);
      }

      case "analyze-class": {
        if (!classId) {
          return NextResponse.json(
            { error: "classId is required for class analysis" },
            { status: 400 }
          );
        }
        const analysis = await analyzeWaitlistIntelligence(classId);
        // Convert Map to object for JSON serialization
        const clientPredictionsObj: Record<string, unknown> = {};
        analysis.clientPredictions.forEach((value, key) => {
          clientPredictionsObj[key] = value;
        });
        return NextResponse.json({
          ...analysis,
          clientPredictions: clientPredictionsObj,
        });
      }

      case "conversion-rate": {
        const daysBack = parseInt(searchParams.get("days") || "90");
        const rate = await getHistoricalConversionRate(daysBack);
        return NextResponse.json({ conversionRate: rate, daysBack });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Waitlist AI error:", error);
    return NextResponse.json(
      { error: "Failed to process AI request" },
      { status: 500 }
    );
  }
}

// POST /api/waitlist/ai - Run AI analysis on demand
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, classIds, clientIds } = body;

    switch (action) {
      case "batch-predict-cancellations": {
        if (!classIds || !Array.isArray(classIds)) {
          return NextResponse.json(
            { error: "classIds array is required" },
            { status: 400 }
          );
        }
        const predictions = await Promise.all(
          classIds.map((id: string) => predictClassCancellations(id))
        );
        return NextResponse.json({ predictions });
      }

      case "batch-predict-clients": {
        if (!clientIds || !Array.isArray(clientIds)) {
          return NextResponse.json(
            { error: "clientIds array is required" },
            { status: 400 }
          );
        }
        const predictions = await Promise.all(
          clientIds.map((id: string) => predictClientBehavior(id))
        );
        return NextResponse.json({ predictions });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Waitlist AI batch error:", error);
    return NextResponse.json(
      { error: "Failed to process batch AI request" },
      { status: 500 }
    );
  }
}
