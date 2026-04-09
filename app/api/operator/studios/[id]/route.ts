import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { requireAuth } from "@/lib/auth/middleware";
import { isOperatorEmail } from "@/lib/auth/operator";
import { getMonthlyRetentionRate } from "@/lib/services/retention-metrics.service";
import type { Establishment, User, Activity } from "@/lib/db/schemas";

// GET /api/operator/studios/[id]
// Detail view for a single studio. Powers the in-place drawer in /operator —
// shows enough to decide whether to enter, without actually entering.
//
// All read-only. The drawer never mutates anything; "Enter" is the only path
// to making changes.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = requireAuth(request);
  if (error) return error;

  if (!user!.isOperator && !isOperatorEmail(user!.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let estObjectId: ObjectId;
  try {
    estObjectId = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const db = await getDatabase();

    const establishment = await db
      .collection<Establishment>("establishments")
      .findOne({ _id: estObjectId });

    if (!establishment) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 });
    }

    const establishmentId = establishment._id!.toString();

    const owner = establishment.ownerId
      ? ((await db
          .collection<User>("users")
          .findOne(
            { _id: new ObjectId(establishment.ownerId) },
            {
              projection: {
                email: 1,
                name: 1,
                phone: 1,
                planTier: 1,
                subscriptionStatus: 1,
                trialStatus: 1,
                trialEndDate: 1,
                createdAt: 1,
                lastLoginAt: 1,
              },
            }
          )) as User | null)
      : null;

    // Top at-risk clients — what the operator most wants to see at a glance.
    // We surface 5; the full list lives inside /admin once they enter.
    const topAtRisk = await db
      .collection("clients")
      .find(
        {
          establishmentId,
          deletedAt: { $exists: false },
          "healthScore.overall": { $lt: 50 },
        },
        {
          projection: {
            name: 1,
            "healthScore.overall": 1,
            lastClassDate: 1,
            churnRiskScore: 1,
          },
        }
      )
      .sort({ "healthScore.overall": 1 })
      .limit(5)
      .toArray();

    const atRiskList = topAtRisk.map((c) => {
      const score = c.healthScore?.overall ?? 0;
      const daysSinceClass = c.lastClassDate
        ? Math.floor((Date.now() - new Date(c.lastClassDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      // Best-effort one-line reason from the data we have. The actual
      // intervention engine has a richer story; this is just a hint.
      let reason: string;
      if (daysSinceClass !== null && daysSinceClass >= 30) {
        reason = `${daysSinceClass}d without a class`;
      } else if (score < 30) {
        reason = `Health score ${score}`;
      } else {
        reason = `At risk (score ${score})`;
      }
      return {
        id: c._id!.toString(),
        name: c.name,
        score,
        reason,
      };
    });

    // 30-day retention. Reuses the canonical service so the number matches
    // what the studio sees inside /admin.
    const now = new Date();
    let retention30d: { rate: number; membersAtStart: number } | null = null;
    try {
      const result = await getMonthlyRetentionRate(db, {
        establishmentId,
        year: now.getFullYear(),
        monthIndex: now.getMonth(),
      });
      retention30d = { rate: result.rate, membersAtStart: result.membersAtStart };
    } catch {
      retention30d = null;
    }

    // New clients this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = await db
      .collection("clients")
      .countDocuments({
        establishmentId,
        deletedAt: { $exists: false },
        createdAt: { $gte: startOfMonth },
      });

    // Recent activity feed (last 5) — gives the operator a feel for whether
    // the studio is being used or sitting idle.
    const recentActivity = (await db
      .collection<Activity>("activity")
      .find({ "metadata.establishmentId": establishmentId })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()) as Activity[];

    // Integration status — which third-party services are wired up. Read
    // straight off the establishment doc / collections without any joins.
    // This is intentionally a sketch: the v1 surface is "is it on or off?"
    const smsBotConfig = await db
      .collection("sms_bot_settings")
      .findOne({ establishmentId });
    const stripeConnected = !!owner?.stripeCustomerId;

    return NextResponse.json({
      studio: {
        id: establishmentId,
        name: establishment.name,
        location: establishment.location,
        createdAt: establishment.createdAt.toISOString(),
        owner: owner
          ? {
              email: owner.email,
              name: owner.name,
              phone: owner.phone,
              planTier: owner.planTier,
              subscriptionStatus: owner.subscriptionStatus,
              trialStatus: owner.trialStatus,
              trialEndDate: owner.trialEndDate?.toISOString(),
              joinedAt: owner.createdAt?.toISOString(),
              lastLoginAt: owner.lastLoginAt?.toISOString() ?? null,
            }
          : null,
        metrics: {
          newThisMonth,
          retention30d: retention30d?.rate ?? null,
          retentionCohortSize: retention30d?.membersAtStart ?? 0,
        },
        topAtRisk: atRiskList,
        recentActivity: recentActivity.map((a) => ({
          type: a.type,
          description: a.description,
          createdAt: a.createdAt,
        })),
        integrations: {
          stripe: stripeConnected,
          smsBot: !!smsBotConfig,
          // Mindbody/ClassPass/Wellhub aren't first-class on the User doc
          // yet, so we can't reliably reflect them here. Add as the schema
          // grows — the drawer just won't render rows for unknown ones.
        },
      },
    });
  } catch (err) {
    console.error("Operator studio detail error:", err);
    return NextResponse.json({ error: "Failed to load studio" }, { status: 500 });
  }
}
