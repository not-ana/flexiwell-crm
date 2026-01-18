import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { HealthAssessment, User } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";

// Helper to get client ID from user
async function getClientIdForUser(userId: string): Promise<string | null> {
  const db = await getDatabase();
  const user = await db.collection<User>("users").findOne({ _id: new ObjectId(userId) });
  return user?.clientId || null;
}

// GET /api/health-assessments/client/[clientId] - Get health assessment by client ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { clientId } = await params;

    // Clients can only view their own assessment
    if (user.role === "client") {
      const userClientId = await getClientIdForUser(user.userId);
      if (userClientId !== clientId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const db = await getDatabase();

    // Get the latest version of the client's health assessment
    const assessment = await db.collection<HealthAssessment>("health_assessments")
      .findOne(
        { clientId },
        { sort: { version: -1 } }
      );

    // Also get all versions if admin wants history
    const searchParams = request.nextUrl.searchParams;
    const includeHistory = searchParams.get("includeHistory") === "true";

    let history: HealthAssessment[] = [];
    if (includeHistory && user.role === "admin") {
      history = await db.collection<HealthAssessment>("health_assessments")
        .find({ clientId })
        .sort({ version: -1 })
        .toArray();
    }

    if (!assessment) {
      return NextResponse.json({
        assessment: null,
        hasAssessment: false,
        history: [],
      });
    }

    return NextResponse.json({
      assessment,
      hasAssessment: true,
      history: includeHistory ? history : [],
    });
  } catch (error) {
    console.error("Error fetching client health assessment:", error);
    return NextResponse.json(
      { error: "Failed to fetch health assessment" },
      { status: 500 }
    );
  }
}
