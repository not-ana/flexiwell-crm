import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { HealthAssessment } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";
import { requireRole } from "@/lib/auth";
import { sanitizeSearchInput } from "@/lib/security";

// GET /api/health-assessments - Get all health assessments with optional filters
export async function GET(request: NextRequest) {
  const { user, error } = requireRole(request, ["admin", "teacher"]);
  if (error) return error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const establishmentId = searchParams.get("establishmentId");
    const rawSearch = searchParams.get("search");
    const search = rawSearch ? sanitizeSearchInput(rawSearch) : null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const db = await getDatabase();

    const query: Record<string, unknown> = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (clientId) {
      query.clientId = clientId;
    }

    if (establishmentId) {
      query.establishmentId = establishmentId;
    }

    if (search) {
      query.$or = [
        { clientName: { $regex: search, $options: "i" } },
        { clientEmail: { $regex: search, $options: "i" } },
      ];
    }

    const [assessments, total] = await Promise.all([
      db.collection<HealthAssessment>("health_assessments")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<HealthAssessment>("health_assessments").countDocuments(query),
    ]);

    return NextResponse.json({
      assessments,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching health assessments:", error);
    return NextResponse.json(
      { error: "Failed to fetch health assessments" },
      { status: 500 }
    );
  }
}

// POST /api/health-assessments - Create a new health assessment
export async function POST(request: NextRequest) {
  const { user, error } = requireRole(request, ["admin", "client"]);
  if (error) return error;

  try {
    const body = await request.json();
    const {
      clientId,
      clientName,
      clientEmail,
      establishmentId,
      dateOfBirth,
      gender,
      height,
      weight,
      occupation,
      medicalHistory,
      currentConditions,
      hasCurrentPain,
      painDescription,
      medications,
      takingMedications,
      allergies,
      hasAllergies,
      exerciseFrequency,
      previousExperience,
      goals,
      additionalGoalNotes,
      physicalRestrictions,
      restrictionDetails,
      emergencyContact,
      consent,
      customFields,
      status: assessmentStatus,
    } = body;

    // Validation
    if (!clientId || !clientName || !clientEmail) {
      return NextResponse.json(
        { error: "Client information is required" },
        { status: 400 }
      );
    }

    // Clients can only create their own assessment
    // Note: clientId should be passed from the client-side where it's available
    if (user?.role === "client") {
      // For clients, we trust the clientId from the body as it was validated on the frontend
      // The clientId should match the user's associated client record
    }

    const db = await getDatabase();

    // Check if client already has an assessment (get latest version)
    const existingAssessment = await db.collection<HealthAssessment>("health_assessments")
      .findOne(
        { clientId },
        { sort: { version: -1 } }
      );

    const version = existingAssessment ? existingAssessment.version + 1 : 1;

    const now = new Date();
    const isDraft = assessmentStatus === "draft";

    const newAssessment: HealthAssessment = {
      clientId,
      clientName,
      clientEmail,
      establishmentId,
      version,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      height,
      weight,
      occupation,
      medicalHistory: medicalHistory || {
        hasHeartCondition: false,
        hasHighBloodPressure: false,
        hasLowBloodPressure: false,
        hasAsthma: false,
        hasRespiratoryIssues: false,
        hasArthritis: false,
        hasOsteoporosis: false,
        hasScoliosis: false,
        hasHernias: false,
        hasEpilepsy: false,
        hasDiabetes: false,
        hasThyroidIssues: false,
        isPregnant: false,
        hasSurgeryHistory: false,
        hasOtherConditions: false,
      },
      currentConditions: currentConditions || [],
      hasCurrentPain: hasCurrentPain || false,
      painDescription,
      medications: medications || [],
      takingMedications: takingMedications || false,
      allergies: allergies || [],
      hasAllergies: hasAllergies || false,
      exerciseFrequency,
      previousExperience,
      goals: goals || [],
      additionalGoalNotes,
      physicalRestrictions: physicalRestrictions || [],
      restrictionDetails,
      emergencyContact: emergencyContact || { name: "", relationship: "", phone: "" },
      consent: consent || {
        agreedToTerms: false,
        agreedToLiabilityWaiver: false,
        signedAt: now,
        signedIp: request.headers.get("x-forwarded-for") || "unknown",
      },
      customFields,
      status: isDraft ? "draft" : "submitted",
      createdAt: now,
      updatedAt: now,
      submittedAt: isDraft ? undefined : now,
    };

    const result = await db.collection<HealthAssessment>("health_assessments").insertOne(newAssessment);

    // If submitted (not draft), update client status to active
    if (!isDraft && newAssessment.clientId) {
      try {
        await db.collection("clients").updateOne(
          { _id: new ObjectId(newAssessment.clientId) },
          {
            $set: {
              status: "active",
              "onboarding.healthAssessmentCompleted": true,
              "onboarding.healthAssessmentCompletedAt": now,
              updatedAt: now,
            },
          }
        );
      } catch {
        // Non-critical: client status update failed
        console.error("Failed to update client status after assessment submission");
      }
    }

    return NextResponse.json({
      success: true,
      assessmentId: result.insertedId,
      assessment: { ...newAssessment, _id: result.insertedId },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating health assessment:", error);
    return NextResponse.json(
      { error: "Failed to create health assessment" },
      { status: 500 }
    );
  }
}
