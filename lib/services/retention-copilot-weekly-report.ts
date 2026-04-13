// Retention Copilot — Weekly Results Report
// ----------------------------------------------------------------------------
// Sent to the studio owner once a week. Counts the wins from the past 7 days
// — clients she texted via the Copilot who came back — and translates them
// into a dollar number she can feel.
//
// Why this exists:
//   The daily digest tells the owner *what to do*. The weekly report tells
//   her *that it worked*. Without this loop she sends texts into a void;
//   with it, the Copilot is the most validating product she uses all week.
//
// The math is intentionally simple and a little optimistic:
//   - We count interventions sent in the last 7 days that have outcome="rebooked".
//   - We multiply by an estimated value-per-save: the average plan price of
//     the saved clients themselves. This is a conservative floor — the real
//     recovered value is whatever plans those clients renew over the next
//     several months, which we can't predict precisely yet.
//
// What this is NOT:
//   - Not a billing report. The numbers are estimates rounded for clarity.
//   - Not a leaderboard. There are no comparisons to other studios. Just her.
// ----------------------------------------------------------------------------

import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { sendEmail, type EmailResult } from "@/lib/email/resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Lookback window for the report. Sunday-evening cron is the natural cadence.
const LOOKBACK_DAYS = 7;

interface WeeklyTotals {
  texted: number;
  rebooked: number;
  inConversation: number;
  noResponse: number;
  lost: number;
  responseRate: number; // 0..1
  recoveredValue: number; // currency-agnostic, see currency field
  currency: string;
  topWin?: { clientName: string; signal: string };
}

interface RenderedReport {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoney(amount: number, currency: string): string {
  const symbol = currency === "BRL" ? "R$" : currency === "EUR" ? "€" : "$";
  return `${symbol}${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

// ----------------------------------------------------------------------------
// Compute totals for a single establishment
// ----------------------------------------------------------------------------

export async function computeWeeklyTotals(
  establishmentId: string,
): Promise<WeeklyTotals> {
  const db = await getDatabase();
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const interventions = await db
    .collection("churn_interventions")
    .find({ establishmentId, createdAt: { $gte: since } })
    .toArray();

  const texted = interventions.length;
  const rebooked = interventions.filter((i) => i.outcome === "rebooked").length;
  const inConversation = interventions.filter((i) => i.outcome === "in_conversation").length;
  const noResponse = interventions.filter((i) => i.outcome === "no_response").length;
  const lost = interventions.filter((i) => i.outcome === "lost").length;

  const responsesAcknowledged = interventions.filter((i) => i.outcome && i.outcome !== "no_response").length;
  const responseRate = texted > 0 ? responsesAcknowledged / texted : 0;

  // Look up plan prices for the saved clients to estimate recovered revenue.
  const savedClientIds = interventions
    .filter((i) => i.outcome === "rebooked")
    .map((i) => {
      try {
        return new ObjectId(i.clientId);
      } catch {
        return null;
      }
    })
    .filter((id): id is ObjectId => id !== null);

  let recoveredValue = 0;
  let currency = "USD";
  let topWinName: string | undefined;
  let topWinSignal: string | undefined;

  if (savedClientIds.length > 0) {
    const savedClients = await db
      .collection("clients")
      .find({ _id: { $in: savedClientIds } })
      .toArray();

    for (const c of savedClients) {
      const planPrice = (c.plan?.price as number | undefined) ?? 0;
      // The Copilot save extends the relationship — we credit roughly one
      // plan cycle of revenue per save. This is a conservative estimate.
      recoveredValue += planPrice;
    }

    if (savedClients.length > 0 && !topWinName) {
      const first = savedClients[0];
      topWinName = (first.name as string)?.split(" ")[0];
      const matchingIntervention = interventions.find(
        (i) => i.clientId === first._id.toString() && i.outcome === "rebooked",
      );
      topWinSignal = matchingIntervention?.signal;
    }
  }

  // Read currency from establishment if available
  const est = await db.collection("establishments").findOne({
    _id: new ObjectId(establishmentId),
  });
  if (est?.currency && typeof est.currency === "string") {
    currency = est.currency;
  }

  return {
    texted,
    rebooked,
    inConversation,
    noResponse,
    lost,
    responseRate,
    recoveredValue,
    currency,
    topWin: topWinName ? { clientName: topWinName, signal: topWinSignal || "" } : undefined,
  };
}

// ----------------------------------------------------------------------------
// Render the weekly report
// ----------------------------------------------------------------------------

const SIGNAL_FRIENDLY: Record<string, string> = {
  new_not_activated: "a brand-new client who hadn't started",
  attendance_dropping: "someone whose attendance was sliding",
  gone_cold: "someone who'd disappeared",
  plan_underutilized: "someone barely using their plan",
  no_shows_spiking: "someone racking up no-shows",
  payment_failed: "someone with a payment problem",
  streak_broken: "someone whose streak had broken",
};

export function renderWeeklyReport(
  ownerFirstName: string,
  studioName: string,
  totals: WeeklyTotals,
): RenderedReport {
  const headlineMoney = formatMoney(totals.recoveredValue, totals.currency);

  // Subject — the dollar number is the hook
  const subject =
    totals.rebooked === 0
      ? totals.texted === 0
        ? "Your week with the Copilot"
        : `Your week: ${totals.texted} texts sent`
      : totals.rebooked === 1
        ? `You saved 1 client this week — ${headlineMoney} recovered`
        : `You saved ${totals.rebooked} clients this week — ${headlineMoney} recovered`;

  const reportUrl = `${APP_URL}/admin/client-checkup`;

  // Body
  let body: string;

  if (totals.texted === 0) {
    body = `
      <p style="font-size:16px;color:#0f172a;margin:0 0 16px 0;">Morning ${escapeHtml(ownerFirstName)},</p>
      <p style="font-size:16px;color:#334155;margin:0 0 24px 0;line-height:1.55;">
        The Copilot didn't have any clients to flag for you this week — which usually means your retention is healthy. Keep an eye on the daily digest and we'll surface them the moment they start drifting.
      </p>
      <div style="text-align:center;margin:32px 0 8px 0;">
        <a href="${reportUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
          Open the Copilot
        </a>
      </div>
    `;
  } else {
    const winsBlock =
      totals.rebooked > 0
        ? `
          <div style="background:linear-gradient(135deg,#ecfdf5,#ffffff);border:1px solid #a7f3d0;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px 0;">
            <p style="font-size:13px;color:#047857;margin:0 0 4px 0;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Recovered this week</p>
            <p style="font-size:42px;color:#065f46;margin:8px 0;font-weight:700;line-height:1;">${headlineMoney}</p>
            <p style="font-size:14px;color:#047857;margin:0;">
              ${totals.rebooked === 1 ? "1 client came back" : `${totals.rebooked} clients came back`} after your text
            </p>
          </div>
        `
        : `
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px 0;">
            <p style="font-size:14px;color:#475569;margin:0;line-height:1.55;">
              You sent ${totals.texted} ${totals.texted === 1 ? "text" : "texts"} this week and the conversations are still in motion. Wins are coming — the second cutucão usually does it.
            </p>
          </div>
        `;

    const topWinLine = totals.topWin
      ? `<p style="font-size:14px;color:#334155;margin:16px 0 0 0;line-height:1.55;">
           <strong>Standout win:</strong> ${escapeHtml(totals.topWin.clientName)} — ${escapeHtml(SIGNAL_FRIENDLY[totals.topWin.signal] || "at risk")}, now back in the studio.
         </p>`
      : "";

    body = `
      <p style="font-size:16px;color:#0f172a;margin:0 0 16px 0;">Morning ${escapeHtml(ownerFirstName)},</p>
      <p style="font-size:16px;color:#334155;margin:0 0 24px 0;line-height:1.55;">
        Here's how your week with the Copilot went. ${totals.rebooked > 0 ? "You did real work — and it shows." : "The seeds are planted; harvest is on the way."}
      </p>

      ${winsBlock}

      <table cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;margin:0 0 24px 0;">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
            <span style="color:#64748b;font-size:14px;">Texts sent</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;text-align:right;">
            <span style="color:#0f172a;font-size:14px;font-weight:600;">${totals.texted}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
            <span style="color:#64748b;font-size:14px;">Clients rebooked</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;text-align:right;">
            <span style="color:#059669;font-size:14px;font-weight:600;">${totals.rebooked}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
            <span style="color:#64748b;font-size:14px;">Still in conversation</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;text-align:right;">
            <span style="color:#0f172a;font-size:14px;font-weight:600;">${totals.inConversation}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;">
            <span style="color:#64748b;font-size:14px;">No reply yet</span>
          </td>
          <td style="padding:12px 0;text-align:right;">
            <span style="color:#0f172a;font-size:14px;font-weight:600;">${totals.noResponse}</span>
          </td>
        </tr>
      </table>

      ${topWinLine}

      <div style="text-align:center;margin:32px 0 8px 0;">
        <a href="${reportUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
          Open the Copilot
        </a>
      </div>

      <p style="font-size:12px;color:#94a3b8;margin:24px 0 0 0;text-align:center;line-height:1.5;">
        Recovered value is an estimate based on the saved clients' current plan prices.<br>
        Real lifetime value is usually higher — this is a conservative floor.
      </p>
    `;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your week with the Copilot</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;">
      <div style="font-size:12px;color:#94a3b8;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 24px 0;">
        Retention Copilot · Weekly report
      </div>
      ${body}
    </div>
    <p style="font-size:11px;color:#cbd5e1;margin:24px 0 0 0;text-align:center;line-height:1.5;">
      ${escapeHtml(studioName)} · sent by FlexiWell every Sunday<br>
      You can turn this off in Settings → Notifications.
    </p>
  </div>
</body>
</html>`;

  const text =
    totals.texted === 0
      ? `Morning ${ownerFirstName},\n\nThe Copilot didn't have any clients to flag for you this week. Your retention is looking healthy.\n\nOpen the Copilot: ${reportUrl}`
      : `Morning ${ownerFirstName},\n\nYour week with the Copilot:\n\n` +
        `• Texts sent: ${totals.texted}\n` +
        `• Clients rebooked: ${totals.rebooked}\n` +
        `• Still in conversation: ${totals.inConversation}\n` +
        `• No reply yet: ${totals.noResponse}\n\n` +
        (totals.rebooked > 0
          ? `Recovered this week: ${headlineMoney}\n\n`
          : "") +
        `Open the Copilot: ${reportUrl}`;

  return { subject, html, text };
}

// ----------------------------------------------------------------------------
// Send for one establishment
// ----------------------------------------------------------------------------

export interface WeeklyReportSendResult {
  establishmentId: string;
  ownerEmail?: string;
  skipped?: "no_owner" | "no_owner_email";
  totals?: WeeklyTotals;
  email?: EmailResult;
}

export async function sendWeeklyReportForEstablishment(
  establishmentId: string,
): Promise<WeeklyReportSendResult> {
  const db = await getDatabase();

  const establishment = await db.collection("establishments").findOne({
    _id: new ObjectId(establishmentId),
  });

  if (!establishment?.ownerId) {
    return { establishmentId, skipped: "no_owner" };
  }

  const owner = await db.collection("users").findOne({
    _id: new ObjectId(establishment.ownerId as string),
  });

  if (!owner?.email) {
    return { establishmentId, skipped: "no_owner_email" };
  }

  const totals = await computeWeeklyTotals(establishmentId);

  const ownerFirstName =
    (typeof owner.name === "string" ? owner.name.split(" ")[0] : "") || "there";
  const studioName = (establishment.name as string) || "your studio";

  const { subject, html, text } = renderWeeklyReport(ownerFirstName, studioName, totals);

  const emailResult = await sendEmail({
    to: owner.email,
    subject,
    html,
    text,
  });

  await db.collection("retention_copilot_weekly_reports").insertOne({
    establishmentId,
    ownerId: establishment.ownerId,
    ownerEmail: owner.email,
    sentAt: new Date(),
    success: emailResult.success,
    error: emailResult.error,
    totals,
    subject,
  });

  return { establishmentId, ownerEmail: owner.email, totals, email: emailResult };
}

// ----------------------------------------------------------------------------
// Send for every establishment (cron entrypoint)
// ----------------------------------------------------------------------------

export interface WeeklyReportRunSummary {
  totalEstablishments: number;
  sent: number;
  skipped: number;
  failed: number;
  results: WeeklyReportSendResult[];
}

export async function sendWeeklyReportForAllEstablishments(): Promise<WeeklyReportRunSummary> {
  const db = await getDatabase();
  const establishments = await db
    .collection("establishments")
    .find({}, { projection: { _id: 1 } })
    .toArray();

  const results: WeeklyReportSendResult[] = [];
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const est of establishments) {
    try {
      const result = await sendWeeklyReportForEstablishment(est._id.toString());
      results.push(result);
      if (result.skipped) {
        skipped++;
      } else if (result.email?.success) {
        sent++;
      } else {
        failed++;
      }
    } catch (err) {
      failed++;
      results.push({
        establishmentId: est._id.toString(),
        email: {
          success: false,
          error: err instanceof Error ? err.message : "unknown error",
        },
      });
    }
  }

  return {
    totalEstablishments: establishments.length,
    sent,
    skipped,
    failed,
    results,
  };
}
