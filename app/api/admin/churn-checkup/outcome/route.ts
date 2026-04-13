// POST /api/admin/churn-checkup/outcome
//
// Record the outcome of a Retention Copilot intervention. The owner sent the
// SMS yesterday from her own phone — today she comes back and tells the
// Copilot what happened with one tap. We use this to (a) measure recovered
// revenue, (b) tune which signals actually predict churn, and (c) close the
// loop visually so the owner sees her work paying off.
//
// Outcomes:
//   - "rebooked"      → client booked a class after the text. The win.
//   - "in_conversation" → owner is still texting back-and-forth, no booking yet.
//   - "no_response"   → ghosted. Schedule a softer follow-up tomorrow.
//   - "lost"          → client said they're not coming back. Stop nudging.

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

const VALID_OUTCOMES = ["rebooked", "in_conversation", "no_response", "lost"] as const;
type Outcome = (typeof VALID_OUTCOMES)[number];

export async function POST(request: NextRequest) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { interventionId, clientId, outcome } = body as {
      interventionId?: string;
      clientId?: string;
      outcome?: Outcome;
    };

    if (!outcome || !VALID_OUTCOMES.includes(outcome)) {
      return NextResponse.json(
        { error: `outcome must be one of: ${VALID_OUTCOMES.join(", ")}` },
        { status: 400 },
      );
    }

    if (!interventionId && !clientId) {
      return NextResponse.json(
        { error: "interventionId or clientId is required" },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const now = new Date();

    // Update the most recent intervention for this client/intervention.
    const filter = interventionId
      ? { _id: new ObjectId(interventionId) }
      : { clientId, outcome: { $exists: false } };

    const updateResult = await db.collection("churn_interventions").updateOne(
      filter,
      {
        $set: {
          outcome,
          outcomeRecordedAt: now,
          outcomeRecordedBy: user?.userId,
        },
      },
      interventionId ? undefined : { sort: { createdAt: -1 } },
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "No matching intervention found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, outcome });
  } catch (err) {
    console.error("Error recording intervention outcome:", err);
    return NextResponse.json({ error: "Failed to record outcome" }, { status: 500 });
  }
}

// GET /api/admin/churn-checkup/outcome?since=YYYY-MM-DD
//
// Returns interventions the current establishment sent in the given window
// that don't yet have an outcome recorded. Used by the Copilot UI to show
// the "what happened?" follow-up cards above the at-risk list.
export async function GET(request: NextRequest) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  if (!user?.establishmentId) {
    return NextResponse.json({ error: "No establishment found" }, { status: 400 });
  }

  try {
    const db = await getDatabase();
    const sinceParam = new URL(request.url).searchParams.get("since");
    const since = sinceParam
      ? new Date(sinceParam)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const pending = await db
      .collection("churn_interventions")
      .find({
        establishmentId: user.establishmentId,
        createdAt: { $gte: since },
        outcome: { $exists: false },
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      interventions: pending.map((i) => ({
        id: i._id.toString(),
        clientId: i.clientId,
        clientName: i.clientName,
        signal: i.signal,
        message: i.message,
        sentAt: i.createdAt,
      })),
    });
  } catch (err) {
    console.error("Error fetching pending outcomes:", err);
    return NextResponse.json({ error: "Failed to fetch pending outcomes" }, { status: 500 });
  }
}
