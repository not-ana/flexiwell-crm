import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { HealthAssessmentFormConfig } from "@/lib/db/schemas";
import { requireRole } from "@/lib/auth";
import { getDefaultFormConfig } from "@/lib/health-assessment/defaultConfig";

// GET /api/health-assessments/config - Get form configuration
export async function GET(request: NextRequest) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const establishmentId = searchParams.get("establishmentId");

    if (!establishmentId) {
      return NextResponse.json(
        { error: "Establishment ID is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get the form configuration for this establishment
    const existingConfig = await db.collection<HealthAssessmentFormConfig>("health_assessment_form_configs").findOne({
      establishmentId,
    });

    // If no custom config exists, return the default
    const formConfig = existingConfig || getDefaultFormConfig(establishmentId);

    return NextResponse.json({ formConfig });
  } catch (error) {
    console.error("Error fetching health assessment form config:", error);
    return NextResponse.json(
      { error: "Failed to fetch form configuration" },
      { status: 500 }
    );
  }
}

// PUT /api/health-assessments/config - Update form configuration
export async function PUT(request: NextRequest) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { establishmentId, sections, liabilityWaiverText, termsText } = body;

    if (!establishmentId) {
      return NextResponse.json(
        { error: "Establishment ID is required" },
        { status: 400 }
      );
    }

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json(
        { error: "Sections configuration is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();

    const formConfig: Omit<HealthAssessmentFormConfig, "_id"> = {
      establishmentId,
      sections,
      liabilityWaiverText: liabilityWaiverText || getDefaultFormConfig(establishmentId).liabilityWaiverText,
      termsText: termsText || getDefaultFormConfig(establishmentId).termsText,
      updatedAt: now,
      updatedBy: user?.userId || "",
    };

    // Upsert the configuration
    const result = await db.collection<HealthAssessmentFormConfig>("health_assessment_form_configs").findOneAndUpdate(
      { establishmentId },
      { $set: formConfig },
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json({
      success: true,
      formConfig: result,
    });
  } catch (error) {
    console.error("Error updating health assessment form config:", error);
    return NextResponse.json(
      { error: "Failed to update form configuration" },
      { status: 500 }
    );
  }
}
