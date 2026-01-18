import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { HealthAssessment, User } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";
import { requireRole } from "@/lib/auth";

// Helper to get client ID from user
async function getClientIdForUser(userId: string): Promise<string | null> {
  const db = await getDatabase();
  const user = await db.collection<User>("users").findOne({ _id: new ObjectId(userId) });
  return user?.clientId || null;
}

// GET /api/health-assessments/my - Get the logged-in client's health assessment
export async function GET(request: NextRequest) {
  const { user, error } = requireRole(request, ["client"]);
  if (error) return error;

  try {
    const clientId = await getClientIdForUser(user!.userId);

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID not found in user profile" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get the latest version of the client's health assessment
    const assessment = await db.collection<HealthAssessment>("health_assessments")
      .findOne(
        { clientId },
        { sort: { version: -1 } }
      );

    if (!assessment) {
      return NextResponse.json({
        assessment: null,
        hasAssessment: false,
      });
    }

    return NextResponse.json({
      assessment,
      hasAssessment: true,
    });
  } catch (error) {
    console.error("Error fetching client health assessment:", error);
    return NextResponse.json(
      { error: "Failed to fetch health assessment" },
      { status: 500 }
    );
  }
}
