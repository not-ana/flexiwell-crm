import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { requireAuthFromCookie, requireAuth } from "@/lib/auth/middleware";
import type { HealthAssessment } from "@/lib/db/schemas";

// Helper to get auth from either cookie or Bearer token
async function getAuthUser(request: NextRequest) {
  // First try Bearer token
  const bearerAuth = requireAuth(request);
  if (bearerAuth.user) {
    return { user: bearerAuth.user, error: null };
  }

  // Fall back to cookie
  return await requireAuthFromCookie();
}

// GET /api/profile/health - Get the current user's health assessment data
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();

    // Get the user record to find their clientId
    const dbUser = await db.collection("users").findOne(
      { _id: new ObjectId(user.userId) },
      { projection: { clientId: 1, email: 1 } }
    );

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Look up the latest health assessment by clientId or email
    let assessment: HealthAssessment | null = null;

    if (dbUser.clientId) {
      assessment = await db.collection<HealthAssessment>("health_assessments").findOne(
        { clientId: dbUser.clientId },
        { sort: { version: -1 }, projection: {
          dateOfBirth: 1, gender: 1, height: 1, weight: 1,
          emergencyContact: 1, medicalHistory: 1, goals: 1,
          physicalRestrictions: 1, status: 1, submittedAt: 1, updatedAt: 1
        }}
      );
    }

    // Fallback: try by email if no clientId match
    if (!assessment && dbUser.email) {
      assessment = await db.collection<HealthAssessment>("health_assessments").findOne(
        { clientEmail: dbUser.email },
        { sort: { version: -1 }, projection: {
          dateOfBirth: 1, gender: 1, height: 1, weight: 1,
          emergencyContact: 1, medicalHistory: 1, goals: 1,
          physicalRestrictions: 1, status: 1, submittedAt: 1, updatedAt: 1
        }}
      );
    }

    if (!assessment) {
      return NextResponse.json({});
    }

    return NextResponse.json(assessment);
  } catch (err) {
    console.error("Error fetching health data:", err);
    return NextResponse.json({ error: "Failed to fetch health data" }, { status: 500 });
  }
}
