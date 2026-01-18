import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { HealthAssessmentToken } from "@/lib/db/schemas";
import { requireRole } from "@/lib/auth";

// GET /api/health-assessments/tokens - List all generated tokens
export async function GET(request: NextRequest) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const establishmentId = searchParams.get("establishmentId");
    const includeUsed = searchParams.get("includeUsed") === "true";
    const includeExpired = searchParams.get("includeExpired") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const db = await getDatabase();

    const query: Record<string, unknown> = {};

    if (establishmentId) {
      query.establishmentId = establishmentId;
    }

    if (!includeUsed) {
      query.isUsed = false;
    }

    if (!includeExpired) {
      query.expiresAt = { $gt: new Date() };
    }

    const [tokens, total] = await Promise.all([
      db.collection<HealthAssessmentToken>("health_assessment_tokens")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<HealthAssessmentToken>("health_assessment_tokens").countDocuments(query),
    ]);

    // Build URLs for each token
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const tokensWithUrls = tokens.map(token => ({
      ...token,
      url: `${baseUrl}/health-assessment/${token.token}`,
    }));

    return NextResponse.json({
      tokens: tokensWithUrls,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching health assessment tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch tokens" },
      { status: 500 }
    );
  }
}
