import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type {
  HealthAssessment,
  HealthAssessmentToken,
  HealthAssessmentFormConfig,
  Client,
} from "@/lib/db/schemas";
import { checkRateLimit, getClientIp } from "@/lib/security";
import { getDefaultFormConfig } from "@/lib/health-assessment/defaultConfig";

// Rate limit for public submissions
const PUBLIC_SUBMIT_LIMIT = { windowMs: 60 * 60 * 1000, maxRequests: 3 };

// GET /api/public/health-assessment/[token] - Validate token and get form config
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const db = await getDatabase();

    // Find the token
    const tokenDoc = await db.collection<HealthAssessmentToken>("health_assessment_tokens").findOne({
      token,
    });

    if (!tokenDoc) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    // Check if token is expired
    if (new Date() > tokenDoc.expiresAt) {
      return NextResponse.json(
        { error: "This link has expired" },
        { status: 410 }
      );
    }

    // Get the form configuration for this establishment
    const existingConfig = await db.collection<HealthAssessmentFormConfig>("health_assessment_form_configs").findOne({
      establishmentId: tokenDoc.establishmentId,
    });

    // If no custom config, use default
    const formConfig = existingConfig || getDefaultFormConfig(tokenDoc.establishmentId);

    // If token was already used, return existing assessment data for editing
    let existingAssessment: HealthAssessment | null = null;
    if (tokenDoc.isUsed && tokenDoc.clientId) {
      existingAssessment = await db.collection<HealthAssessment>("health_assessments")
        .findOne(
          { clientId: tokenDoc.clientId },
          { sort: { version: -1 } }
        );
    }

    return NextResponse.json({
      valid: true,
      clientEmail: tokenDoc.clientEmail,
      clientName: tokenDoc.clientName,
      establishmentId: tokenDoc.establishmentId,
      formConfig: {
        sections: formConfig.sections.filter(s => s.enabled),
        liabilityWaiverText: formConfig.liabilityWaiverText,
        termsText: formConfig.termsText,
      },
      expiresAt: tokenDoc.expiresAt,
      isEdit: tokenDoc.isUsed,
      existingData: existingAssessment || undefined,
    });
  } catch (error) {
    console.error("Error validating health assessment token:", error);
    return NextResponse.json(
      { error: "Failed to validate link" },
      { status: 500 }
    );
  }
}

// POST /api/public/health-assessment/[token] - Submit assessment via public link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const clientIp = getClientIp(request);

    // Rate limiting
    const rateLimitResult = checkRateLimit(`health-assessment-submit:${clientIp}`, PUBLIC_SUBMIT_LIMIT);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

    const db = await getDatabase();

    // Find and validate the token
    const tokenDoc = await db.collection<HealthAssessmentToken>("health_assessment_tokens").findOne({
      token,
    });

    if (!tokenDoc) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    // Allow re-submission if token is used but not expired (edit mode)
    if (new Date() > tokenDoc.expiresAt) {
      return NextResponse.json(
        { error: "This link has expired" },
        { status: 410 }
      );
    }

    const body = await request.json();
    const {
      clientName,
      clientEmail,
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
    } = body;

    // Validate required fields
    const finalClientName = clientName || tokenDoc.clientName;
    const finalClientEmail = clientEmail || tokenDoc.clientEmail;

    if (!finalClientName || !finalClientEmail) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    if (!emergencyContact?.name || !emergencyContact?.phone || !emergencyContact?.relationship) {
      return NextResponse.json(
        { error: "Emergency contact information is required" },
        { status: 400 }
      );
    }

    if (!consent?.agreedToTerms || !consent?.agreedToLiabilityWaiver) {
      return NextResponse.json(
        { error: "You must agree to the terms and liability waiver" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Check if client already exists
    const client = await db.collection<Client>("clients").findOne({
      email: finalClientEmail.toLowerCase(),
    });

    let clientId: string;

    if (client) {
      clientId = client._id!.toString();
    } else {
      // Create a new client with pending status
      const newClient: Partial<Client> = {
        name: finalClientName,
        email: finalClientEmail.toLowerCase(),
        phone: emergencyContact.phone,
        status: "pending",
        plan: {
          type: "drop-in",
          totalClasses: 0,
          usedClasses: 0,
          remainingClasses: 0,
          startDate: now,
          endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          price: 0,
        },
        preferences: {
          notifications: {
            email: true,
            whatsapp: false,
            instagram: false,
            sms: false,
          },
        },
        createdAt: now,
        updatedAt: now,
      };

      const clientResult = await db.collection<Client>("clients").insertOne(newClient as Client);
      clientId = clientResult.insertedId.toString();
    }

    // Check for existing assessment (get latest version)
    const existingAssessment = await db.collection<HealthAssessment>("health_assessments")
      .findOne(
        { clientId },
        { sort: { version: -1 } }
      );

    const version = existingAssessment ? existingAssessment.version + 1 : 1;

    // Create the health assessment
    const newAssessment: HealthAssessment = {
      clientId,
      clientName: finalClientName,
      clientEmail: finalClientEmail.toLowerCase(),
      establishmentId: tokenDoc.establishmentId,
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
      emergencyContact,
      consent: {
        agreedToTerms: consent.agreedToTerms,
        agreedToLiabilityWaiver: consent.agreedToLiabilityWaiver,
        signedAt: now,
        signedIp: clientIp,
      },
      customFields,
      status: "submitted",
      createdAt: now,
      updatedAt: now,
      submittedAt: now,
    };

    const assessmentResult = await db.collection<HealthAssessment>("health_assessments").insertOne(newAssessment);

    // Mark token as used (if not already)
    if (!tokenDoc.isUsed) {
      await db.collection<HealthAssessmentToken>("health_assessment_tokens").updateOne(
        { token },
        {
          $set: {
            isUsed: true,
            usedAt: now,
            clientId,
          },
        }
      );
    }

    // Build medical flags summary for quick teacher reference
    const medicalFlags = {
      hasHeartCondition: medicalHistory?.hasHeartCondition || false,
      hasHighBloodPressure: medicalHistory?.hasHighBloodPressure || false,
      hasAsthma: medicalHistory?.hasAsthma || false,
      hasArthritis: medicalHistory?.hasArthritis || false,
      hasOsteoporosis: medicalHistory?.hasOsteoporosis || false,
      hasScoliosis: medicalHistory?.hasScoliosis || false,
      hasHernias: medicalHistory?.hasHernias || false,
      hasDiabetes: medicalHistory?.hasDiabetes || false,
      isPregnant: medicalHistory?.isPregnant || false,
      hasSurgeryHistory: medicalHistory?.hasSurgeryHistory || false,
      hasCurrentPain: hasCurrentPain || false,
      hasMedications: takingMedications || false,
      hasAllergies: hasAllergies || false,
    };

    // Sync health assessment data to client profile
    const { ObjectId } = await import("mongodb");
    await db.collection<Client>("clients").updateOne(
      { _id: new ObjectId(clientId) },
      {
        $set: {
          status: "active",
          "onboarding.healthAssessmentCompleted": true,
          "onboarding.healthAssessmentCompletedAt": now,
          // Sync key fields to client profile
          healthAssessmentId: assessmentResult.insertedId.toString(),
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender,
          height,
          weight,
          occupation,
          emergencyContact,
          medicalFlags,
          goals: goals || [],
          physicalRestrictions: physicalRestrictions || [],
          updatedAt: now,
        },
      }
    );

    return NextResponse.json({
      success: true,
      assessmentId: assessmentResult.insertedId,
      clientId,
      message: "Health assessment submitted successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("Error submitting public health assessment:", error);
    return NextResponse.json(
      { error: "Failed to submit health assessment" },
      { status: 500 }
    );
  }
}
