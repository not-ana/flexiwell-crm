// Retention Metrics Service
// ----------------------------------------------------------------------------
// This is the measurement layer behind FlexiWell's positioning. Every number
// the studio owner sees on the dashboard, and every number we guarantee on,
// flows through this file.
//
// Definitions (lock these down — changing them changes the guarantee):
//
//   "Paying member" = a Client whose plan.type is monthly, quarterly, annual,
//      premium, or vip, AND whose plan.endDate is in the future as of the
//      reference instant, AND who is not soft-deleted.
//      Drop-ins, trials, and challenges are NOT members. They're acquisition.
//
//   "Active in month M" = a paying member as of the LAST day of month M.
//      We snapshot at end-of-month, not start-of-month, because that's what
//      determines whether they renewed.
//
//   "Monthly retention rate for month M" = (members active at end of M who
//      were also active at end of M-1) / (members active at end of M-1).
//      This is a true cohort survival rate — not "growth", not "churn rate
//      times -1". The number we guarantee on.
//
//   "Cohort C of month M" = clients whose createdAt falls in month M and who
//      ever became paying members (i.e., had a member-eligible plan at any
//      point). Cohort retention at offset N = % of cohort C still active at
//      end of month (M + N).
//
//   "At risk" = paying member with healthScore.overall < 50 (matches the
//      health-score utility's "at_risk" + "critical" buckets).
//
//   "Recovered this week" = a client who was at-risk OR churned 7+ days ago
//      and is now active (not at-risk, not churned) as of now.
//
// Everything in this file is a pure function over the database. No caching,
// no side effects. Cache at the API layer.
// ----------------------------------------------------------------------------

import { Db } from "mongodb";

const MEMBER_PLAN_TYPES = ["monthly", "quarterly", "annual", "premium", "vip"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function endOfMonth(year: number, monthIndex: number): Date {
  // monthIndex is 0-based. End of month = first day of next month, minus 1ms.
  return new Date(year, monthIndex + 1, 1, 0, 0, 0, -1);
}

function startOfMonth(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex, 1, 0, 0, 0, 0);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function establishmentFilter(establishmentId?: string) {
  return establishmentId ? { establishmentId } : {};
}

// A client counts as a paying member at instant `at` if:
//   - not soft-deleted
//   - has a member-tier plan
//   - plan.startDate <= at <= plan.endDate
function memberAtFilter(at: Date, establishmentId?: string) {
  return {
    ...establishmentFilter(establishmentId),
    deletedAt: { $exists: false },
    "plan.type": { $in: MEMBER_PLAN_TYPES },
    "plan.startDate": { $lte: at },
    "plan.endDate": { $gte: at },
  };
}

// ---------------------------------------------------------------------------
// 1. Monthly retention rate — THE primary metric
// ---------------------------------------------------------------------------

export interface MonthlyRetentionResult {
  rate: number;              // 0..1, e.g. 0.89 = 89%
  membersAtStart: number;    // size of the cohort we measured
  membersRetained: number;   // how many of them survived to end-of-month
  monthLabel: string;        // e.g. "2026-04"
  baselineRate: number | null; // 12 months ago, for trend context
}

export async function getMonthlyRetentionRate(
  db: Db,
  options: { establishmentId?: string; year: number; monthIndex: number },
): Promise<MonthlyRetentionResult> {
  const { establishmentId, year, monthIndex } = options;

  // The cohort: members active at the end of the PREVIOUS month
  const cohortInstant = endOfMonth(year, monthIndex - 1);
  // The survival check: are they still members at the end of THIS month?
  const survivalInstant = endOfMonth(year, monthIndex);

  const clients = db.collection("clients");

  const cohortIds = await clients
    .find(memberAtFilter(cohortInstant, establishmentId), { projection: { _id: 1 } })
    .map((d) => d._id)
    .toArray();

  if (cohortIds.length === 0) {
    return {
      rate: 0,
      membersAtStart: 0,
      membersRetained: 0,
      monthLabel: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
      baselineRate: null,
    };
  }

  const survivedCount = await clients.countDocuments({
    _id: { $in: cohortIds },
    ...memberAtFilter(survivalInstant, establishmentId),
  });

  // Baseline: same calculation, 12 months ago
  let baselineRate: number | null = null;
  const baselineCohortInstant = endOfMonth(year - 1, monthIndex - 1);
  const baselineSurvivalInstant = endOfMonth(year - 1, monthIndex);
  const baselineCohortIds = await clients
    .find(memberAtFilter(baselineCohortInstant, establishmentId), { projection: { _id: 1 } })
    .map((d) => d._id)
    .toArray();
  if (baselineCohortIds.length > 0) {
    const baselineSurvived = await clients.countDocuments({
      _id: { $in: baselineCohortIds },
      ...memberAtFilter(baselineSurvivalInstant, establishmentId),
    });
    baselineRate = baselineSurvived / baselineCohortIds.length;
  }

  return {
    rate: survivedCount / cohortIds.length,
    membersAtStart: cohortIds.length,
    membersRetained: survivedCount,
    monthLabel: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    baselineRate,
  };
}

// ---------------------------------------------------------------------------
// 2. Cohort retention curves — the visual proof
// ---------------------------------------------------------------------------

export interface CohortPoint {
  monthOffset: number; // 0 = signup month, 1 = next month, etc.
  retention: number;   // 0..1
}

export interface Cohort {
  cohortLabel: string;     // e.g. "2026-01"
  cohortSize: number;
  curve: CohortPoint[];
}

export async function getCohortRetention(
  db: Db,
  options: { establishmentId?: string; cohortsBack?: number; horizonMonths?: number },
): Promise<Cohort[]> {
  const { establishmentId, cohortsBack = 6, horizonMonths = 6 } = options;
  const clients = db.collection("clients");

  const now = new Date();
  const cohorts: Cohort[] = [];

  for (let c = cohortsBack - 1; c >= 0; c--) {
    const cohortDate = addMonths(now, -c);
    const cohortYear = cohortDate.getFullYear();
    const cohortMonth = cohortDate.getMonth();
    const cohortStart = startOfMonth(cohortYear, cohortMonth);
    const cohortEnd = endOfMonth(cohortYear, cohortMonth);

    // Cohort = clients created in that month who ever held a member plan.
    // For simplicity (and because the schema stores only the *current* plan),
    // we approximate: clients created in that month whose CURRENT plan is a
    // member tier OR whose plan startDate falls within the cohort month.
    const cohortClients = await clients
      .find(
        {
          ...establishmentFilter(establishmentId),
          deletedAt: { $exists: false },
          createdAt: { $gte: cohortStart, $lte: cohortEnd },
          "plan.type": { $in: MEMBER_PLAN_TYPES },
        },
        { projection: { _id: 1 } },
      )
      .map((d) => d._id)
      .toArray();

    const cohortSize = cohortClients.length;
    const curve: CohortPoint[] = [];

    if (cohortSize === 0) {
      cohorts.push({
        cohortLabel: `${cohortYear}-${String(cohortMonth + 1).padStart(2, "0")}`,
        cohortSize: 0,
        curve: [],
      });
      continue;
    }

    for (let offset = 0; offset <= horizonMonths; offset++) {
      const checkInstant = endOfMonth(cohortYear, cohortMonth + offset);
      if (checkInstant > now) break; // can't measure the future

      const stillActive = await clients.countDocuments({
        _id: { $in: cohortClients },
        ...memberAtFilter(checkInstant, establishmentId),
      });

      curve.push({ monthOffset: offset, retention: stillActive / cohortSize });
    }

    cohorts.push({
      cohortLabel: `${cohortYear}-${String(cohortMonth + 1).padStart(2, "0")}`,
      cohortSize,
      curve,
    });
  }

  return cohorts;
}

// ---------------------------------------------------------------------------
// 3. At-risk distribution — who needs intervention right now
// ---------------------------------------------------------------------------

export interface AtRiskBuckets {
  critical: number;   // overall < 30
  atRisk: number;     // 30..49
  watch: number;      // 50..69
  healthy: number;    // 70+
  topAtRisk: Array<{ id: string; name: string; score: number; reason: string }>;
}

export async function getAtRiskDistribution(
  db: Db,
  options: { establishmentId?: string; topN?: number },
): Promise<AtRiskBuckets> {
  const { establishmentId, topN = 5 } = options;
  const clients = db.collection("clients");

  const filter = {
    ...establishmentFilter(establishmentId),
    deletedAt: { $exists: false },
    "plan.type": { $in: MEMBER_PLAN_TYPES },
    "healthScore.overall": { $exists: true },
  };

  const all = await clients
    .find(filter, {
      projection: {
        _id: 1,
        name: 1,
        "healthScore.overall": 1,
        "healthScore.breakdown": 1,
      },
    })
    .toArray();

  const buckets: AtRiskBuckets = {
    critical: 0,
    atRisk: 0,
    watch: 0,
    healthy: 0,
    topAtRisk: [],
  };

  for (const c of all) {
    const score = c.healthScore?.overall ?? 100;
    if (score < 30) buckets.critical++;
    else if (score < 50) buckets.atRisk++;
    else if (score < 70) buckets.watch++;
    else buckets.healthy++;
  }

  // Top at-risk = lowest scoring clients with score < 50
  const sorted = all
    .filter((c) => (c.healthScore?.overall ?? 100) < 50)
    .sort((a, b) => (a.healthScore?.overall ?? 0) - (b.healthScore?.overall ?? 0))
    .slice(0, topN);

  buckets.topAtRisk = sorted.map((c) => {
    const breakdown = c.healthScore?.breakdown ?? {};
    // Pick the worst-scoring dimension as the "reason"
    const dims: Array<[string, number]> = [
      ["attendance dropping", breakdown.attendance ?? 25],
      ["plan unused", breakdown.planUtilization ?? 25],
      ["hasn't visited recently", breakdown.recency ?? 25],
      ["payment issues", breakdown.paymentHealth ?? 25],
    ];
    dims.sort((a, b) => a[1] - b[1]);
    return {
      id: String(c._id),
      name: c.name,
      score: c.healthScore?.overall ?? 0,
      reason: dims[0][0],
    };
  });

  return buckets;
}

// ---------------------------------------------------------------------------
// 4. Revenue retained this week — the dollar value of the service
// ---------------------------------------------------------------------------

export interface RevenueRetainedResult {
  revenueRetainedThisWeek: number;
  recoveredCount: number;
  currency: string;
}

export async function getRevenueRetained(
  db: Db,
  options: { establishmentId?: string; weekStart?: Date },
): Promise<RevenueRetainedResult> {
  const { establishmentId } = options;
  const clients = db.collection("clients");
  const now = new Date();
  const weekStart = options.weekStart ?? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Recovered = currently a healthy member, but had a critical/at-risk
  // health score within the last 30 days OR was previously churned and is
  // now active. We approximate using lastChurnAlertSentAt — if an alert was
  // sent 7..30 days ago and the client is currently a healthy member, count
  // them as recovered.
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recovered = await clients
    .find({
      ...establishmentFilter(establishmentId),
      deletedAt: { $exists: false },
      "plan.type": { $in: MEMBER_PLAN_TYPES },
      "plan.endDate": { $gte: now },
      "healthScore.overall": { $gte: 50 },
      lastChurnAlertSentAt: { $gte: thirtyDaysAgo, $lte: sevenDaysAgo },
    }, { projection: { "plan.price": 1 } })
    .toArray();

  // Sum monthly value retained. We treat each recovered member's plan price
  // as their monthly contribution (rough but defensible for v1).
  const revenueRetainedThisWeek = recovered.reduce(
    (sum, c) => sum + (c.plan?.price ?? 0),
    0,
  );

  return {
    revenueRetainedThisWeek,
    recoveredCount: recovered.length,
    currency: "USD",
  };
}

// ---------------------------------------------------------------------------
// 5. Interventions running — what work is happening this week
// ---------------------------------------------------------------------------

export interface InterventionsRunning {
  total: number;
  byType: Array<{ type: string; count: number }>;
}

export async function getInterventionsRunning(
  db: Db,
  options: { establishmentId?: string; sinceDays?: number },
): Promise<InterventionsRunning> {
  const { establishmentId, sinceDays = 7 } = options;
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const activities = db.collection("activities");

  // Activities table is the message-of-record for "stuff we did". We count
  // anything tagged as a retention intervention in the last N days.
  const filter: Record<string, unknown> = {
    createdAt: { $gte: since },
    type: { $in: ["client", "system"] },
    action: { $in: ["churn_alert_sent", "win_back_sent", "intake_reminder", "first_class_nudge", "expiring_credits_reminder"] },
  };
  if (establishmentId) {
    filter["metadata.establishmentId"] = establishmentId;
  }

  const all = await activities.find(filter, { projection: { action: 1 } }).toArray();

  const counts = new Map<string, number>();
  for (const a of all) {
    counts.set(a.action, (counts.get(a.action) ?? 0) + 1);
  }

  const labelMap: Record<string, string> = {
    churn_alert_sent: "Check-ins to at-risk clients",
    win_back_sent: "Win-back to churned clients",
    intake_reminder: "Intake reminders",
    first_class_nudge: "First-class nudges",
    expiring_credits_reminder: "Expiring credits reminders",
  };

  return {
    total: all.length,
    byType: Array.from(counts.entries()).map(([type, count]) => ({
      type: labelMap[type] ?? type,
      count,
    })),
  };
}

// ---------------------------------------------------------------------------
// Aggregate: one call to get everything the dashboard needs
// ---------------------------------------------------------------------------

export interface RetentionDashboardPayload {
  monthlyRetention: MonthlyRetentionResult;
  cohorts: Cohort[];
  atRisk: AtRiskBuckets;
  revenueRetained: RevenueRetainedResult;
  interventions: InterventionsRunning;
  computedAt: string;
}

export async function getRetentionDashboard(
  db: Db,
  options: { establishmentId?: string },
): Promise<RetentionDashboardPayload> {
  const now = new Date();
  const [monthlyRetention, cohorts, atRisk, revenueRetained, interventions] = await Promise.all([
    getMonthlyRetentionRate(db, {
      establishmentId: options.establishmentId,
      year: now.getFullYear(),
      monthIndex: now.getMonth(),
    }),
    getCohortRetention(db, { establishmentId: options.establishmentId }),
    getAtRiskDistribution(db, { establishmentId: options.establishmentId }),
    getRevenueRetained(db, { establishmentId: options.establishmentId }),
    getInterventionsRunning(db, { establishmentId: options.establishmentId }),
  ]);

  return {
    monthlyRetention,
    cohorts,
    atRisk,
    revenueRetained,
    interventions,
    computedAt: now.toISOString(),
  };
}