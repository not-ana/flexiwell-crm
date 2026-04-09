import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { requireAuth } from "@/lib/auth/middleware";
import { isOperatorEmail } from "@/lib/auth/operator";
import type { Establishment, User } from "@/lib/db/schemas";

// GET /api/operator/studios — list every studio in the system, with the
// minimum stats the operator console needs to decide which one to enter.
//
// This is the only data source for /operator. The list intentionally stays
// small (one row per studio, four columns visible) — heavier analytics live
// inside each studio's own /admin once the operator impersonates in.
export async function GET(request: NextRequest) {
  const { user, error } = requireAuth(request);
  if (error) return error;

  // Hard gate: only operators may list all studios. The flag in the JWT is
  // set at login time from OPERATOR_EMAILS, but we re-check the email here
  // as defense in depth in case a stale JWT slips through.
  if (!user!.isOperator && !isOperatorEmail(user!.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // While impersonating, the operator console should be inaccessible —
  // they're acting as a single studio, not browsing the fleet.
  if (user!.impersonating) {
    return NextResponse.json({ error: "Exit impersonation first" }, { status: 409 });
  }

  try {
    const db = await getDatabase();

    const establishments = await db
      .collection<Establishment>("establishments")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    if (establishments.length === 0) {
      return NextResponse.json({ studios: [] });
    }

    const ownerIds = establishments
      .map((e) => e.ownerId)
      .filter(Boolean)
      .map((id) => {
        try {
          return new ObjectId(id);
        } catch {
          return null;
        }
      })
      .filter((id): id is ObjectId => id !== null);

    const owners = await db
      .collection<User>("users")
      .find(
        { _id: { $in: ownerIds } },
        { projection: { email: 1, name: 1, subscriptionStatus: 1, trialStatus: 1, trialEndDate: 1, planTier: 1 } }
      )
      .toArray();

    const ownersById = new Map(owners.map((o) => [o._id!.toString(), o]));

    // Aggregate per-studio stats in a single pass over the clients collection.
    // Everything in here has to be cheap enough to run on every load of
    // /operator — heavier metrics (retention curves, intervention queues)
    // live in the drawer endpoint and only run when an operator opens a row.
    //
    // MRR is normalized to monthly: quarterly plans contribute price/3,
    // annual plans contribute price/12. Drop-ins/trials/challenges don't
    // count as members so they contribute zero (matches retention-metrics
    // service definitions).
    const now = new Date();
    const establishmentIds = establishments.map((e) => e._id!.toString());
    const MEMBER_TYPES = ["monthly", "quarterly", "annual", "premium", "vip"];

    const clientStats = await db
      .collection("clients")
      .aggregate<{
        _id: string;
        total: number;
        active: number;
        atRisk: number;
        mrr: number;
        lastActivity: Date | null;
      }>([
        {
          $match: {
            establishmentId: { $in: establishmentIds },
            deletedAt: { $exists: false },
          },
        },
        {
          $addFields: {
            // "is paying member right now": member-tier plan with valid window
            _isMember: {
              $and: [
                { $in: ["$plan.type", MEMBER_TYPES] },
                { $lte: ["$plan.startDate", now] },
                { $gte: ["$plan.endDate", now] },
              ],
            },
            _monthlyEquivalent: {
              $switch: {
                branches: [
                  { case: { $eq: ["$plan.type", "monthly"] }, then: "$plan.price" },
                  { case: { $eq: ["$plan.type", "quarterly"] }, then: { $divide: ["$plan.price", 3] } },
                  { case: { $eq: ["$plan.type", "annual"] }, then: { $divide: ["$plan.price", 12] } },
                  { case: { $eq: ["$plan.type", "premium"] }, then: "$plan.price" },
                  { case: { $eq: ["$plan.type", "vip"] }, then: "$plan.price" },
                ],
                default: 0,
              },
            },
          },
        },
        {
          $group: {
            _id: "$establishmentId",
            total: { $sum: 1 },
            active: { $sum: { $cond: ["$_isMember", 1, 0] } },
            atRisk: {
              $sum: {
                $cond: [{ $lt: [{ $ifNull: ["$healthScore.overall", 100] }, 50] }, 1, 0],
              },
            },
            mrr: {
              $sum: { $cond: ["$_isMember", "$_monthlyEquivalent", 0] },
            },
            lastActivity: { $max: "$updatedAt" },
          },
        },
      ])
      .toArray();

    const statsById = new Map(clientStats.map((s) => [s._id, s]));

    const studios = establishments.map((est) => {
      const id = est._id!.toString();
      const stats = statsById.get(id);
      const owner = est.ownerId ? ownersById.get(est.ownerId) : undefined;

      // Risk: red if any critical signs (>= 3 at-risk clients OR no activity
      // in 14+ days), yellow if any at-risk OR no activity in 7+ days, else
      // green. This single derived field is what the operator sorts by.
      const lastActivity = stats?.lastActivity ? new Date(stats.lastActivity) : null;
      const daysSinceActivity = lastActivity
        ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const atRisk = stats?.atRisk ?? 0;

      let risk: "red" | "yellow" | "green" = "green";
      if (atRisk >= 3 || (daysSinceActivity !== null && daysSinceActivity >= 14)) {
        risk = "red";
      } else if (atRisk >= 1 || (daysSinceActivity !== null && daysSinceActivity >= 7)) {
        risk = "yellow";
      }

      // Days remaining on trial (negative = already expired). Owner-level,
      // not establishment-level — that's how the schema models it today.
      let trialDaysLeft: number | null = null;
      if (owner?.trialEndDate) {
        trialDaysLeft = Math.ceil(
          (new Date(owner.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
      }

      // One-line plain-language summary the UI shows under each row. The
      // operator should be able to read just this and know the state.
      let summary: string;
      if (owner?.trialStatus === "active" && trialDaysLeft !== null) {
        summary = trialDaysLeft <= 0
          ? "Trial expired"
          : `Trial expires in ${trialDaysLeft}d`;
      } else if (atRisk > 0) {
        summary = `${atRisk} at risk · last active ${daysSinceActivity ?? "?"}d ago`;
      } else if (daysSinceActivity !== null && daysSinceActivity >= 14) {
        summary = `Quiet — ${daysSinceActivity}d since last activity`;
      } else if ((stats?.active ?? 0) === 0 && (stats?.total ?? 0) === 0) {
        summary = "Empty — not set up yet";
      } else {
        summary = "Healthy";
      }

      return {
        id,
        name: est.name,
        ownerEmail: owner?.email ?? null,
        ownerName: owner?.name ?? null,
        planTier: owner?.planTier ?? null,
        subscriptionStatus: owner?.subscriptionStatus ?? null,
        trialStatus: owner?.trialStatus ?? null,
        trialEndDate: owner?.trialEndDate ?? null,
        trialDaysLeft,
        clientCount: stats?.total ?? 0,
        activeCount: stats?.active ?? 0,
        atRiskCount: atRisk,
        mrr: Math.round(stats?.mrr ?? 0),
        lastActivity: lastActivity?.toISOString() ?? null,
        risk,
        summary,
        createdAt: est.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ studios });
  } catch (err) {
    console.error("Operator studios list error:", err);
    return NextResponse.json({ error: "Failed to load studios" }, { status: 500 });
  }
}
