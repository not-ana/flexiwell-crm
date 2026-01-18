import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { HealthAssessmentToken } from "@/lib/db/schemas";
import { requireRole } from "@/lib/auth";
import { generateSecureToken } from "@/lib/security";

// POST /api/health-assessments/token/generate - Generate a public access token
export async function POST(request: NextRequest) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const {
      clientId,
      clientEmail,
      clientName,
      establishmentId,
      expiresInDays = 7,
    } = body;

    if (!establishmentId) {
      return NextResponse.json(
        { error: "Establishment ID is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

    const token = generateSecureToken(32);

    const tokenDoc: HealthAssessmentToken = {
      token,
      clientId,
      clientEmail,
      clientName,
      establishmentId,
      createdBy: user?.userId || "",
      expiresAt,
      isUsed: false,
      createdAt: now,
    };

    const result = await db.collection<HealthAssessmentToken>("health_assessment_tokens").insertOne(tokenDoc);

    // Build the public URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const publicUrl = `${baseUrl}/health-assessment/${token}`;

    return NextResponse.json({
      success: true,
      tokenId: result.insertedId,
      token,
      url: publicUrl,
      expiresAt,
    }, { status: 201 });
  } catch (error) {
    console.error("Error generating health assessment token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
