// Retention Copilot — Daily Digest
// ----------------------------------------------------------------------------
// Sends one short email to the studio owner every morning listing the clients
// the Copilot wants her to text today, with deep links that open the Retention
// Copilot screen pre-focused on each client.
//
// Why a daily email instead of in-app only:
//   The Copilot only delivers value when the owner actually looks at it. A
//   single short email at the start of her day turns "open the CRM" into a
//   habit she doesn't have to remember. The email is intentionally not a
//   replacement for the in-app surface — it's a doormat that points back to it.
//
// What it is NOT:
//   - Not an automated SMS bot. The owner still sends every text from her own
//     phone via the in-app `sms:` deep link.
//   - Not a marketing email. It's a one-line summary plus a few names. Three
//     bullets, one button, done.
// ----------------------------------------------------------------------------

import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { sendEmail, type EmailResult } from "@/lib/email/resend";
import {
  generateWeeklyCheckup,
  type ClientChurnCheckup,
  type WeeklyCheckupReport,
} from "./churn-intervention.service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// We surface at most this many clients in the digest. The whole point is
// "what to do this morning" — a long list defeats that.
const MAX_CLIENTS_IN_DIGEST = 5;

// Severity ranking so the most important names land at the top of the list.
const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

// ----------------------------------------------------------------------------
// Email rendering
// ----------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pluralize(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

function severityDot(severity: string): string {
  const color =
    severity === "critical"
      ? "#dc2626"
      : severity === "high"
        ? "#ea580c"
        : severity === "medium"
          ? "#d97706"
          : "#6b7280";
  return `<span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:${color};margin-right:8px;vertical-align:middle;"></span>`;
}

interface RenderedDigest {
  subject: string;
  html: string;
  text: string;
}

export function renderDigest(
  ownerFirstName: string,
  studioName: string,
  report: WeeklyCheckupReport,
): RenderedDigest {
  // Sort by severity, then by lowest health score, and take the top N.
  const ranked = [...report.clients]
    .sort((a, b) => {
      const aRank = SEVERITY_RANK[a.primaryIntervention.severity] ?? 9;
      const bRank = SEVERITY_RANK[b.primaryIntervention.severity] ?? 9;
      if (aRank !== bRank) return aRank - bRank;
      return a.healthScore - b.healthScore;
    })
    .slice(0, MAX_CLIENTS_IN_DIGEST);

  const totalAtRisk = report.summary.totalAtRisk;
  const copilotUrl = `${APP_URL}/admin/client-checkup`;

  // Subject line — the count is the hook
  const subject =
    totalAtRisk === 0
      ? "All clear today — nobody needs you"
      : `${totalAtRisk} ${pluralize(totalAtRisk, "client needs", "clients need")} you today`;

  // Empty-state digest
  if (totalAtRisk === 0) {
    const emptyHtml = baseShell(
      studioName,
      `
        <p style="font-size:16px;color:#0f172a;margin:0 0 16px 0;">Morning ${escapeHtml(ownerFirstName)},</p>
        <p style="font-size:16px;color:#334155;margin:0 0 24px 0;line-height:1.55;">
          The Copilot looked at every client this morning and nobody is at risk today. Enjoy your coffee — you earned it.
        </p>
        <p style="font-size:14px;color:#64748b;margin:0;">
          We'll check again tomorrow morning at the same time.
        </p>
      `,
    );
    return {
      subject,
      html: emptyHtml,
      text: `Morning ${ownerFirstName},\n\nThe Copilot looked at every client this morning and nobody is at risk today. Enjoy your coffee.\n\nWe'll check again tomorrow.`,
    };
  }

  // List of clients
  const rows = ranked
    .map((c) => {
      const firstName = c.clientName.split(" ")[0] || c.clientName;
      const reason = escapeHtml(c.primaryIntervention.reason);
      const linkUrl = `${copilotUrl}?client=${encodeURIComponent(c.clientId)}`;
      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #e2e8f0;">
            <div style="font-size:15px;color:#0f172a;font-weight:600;line-height:1.3;">
              ${severityDot(c.primaryIntervention.severity)}${escapeHtml(firstName)}
            </div>
            <div style="font-size:13px;color:#64748b;margin:4px 0 0 16px;line-height:1.45;">
              ${reason}
            </div>
            <div style="margin:8px 0 0 16px;">
              <a href="${linkUrl}" style="font-size:13px;color:#7c3aed;text-decoration:none;font-weight:600;">
                Open the message →
              </a>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  const remainder = totalAtRisk - ranked.length;
  const remainderLine =
    remainder > 0
      ? `<p style="font-size:13px;color:#94a3b8;margin:16px 0 0 0;text-align:center;">
           +${remainder} more in the Copilot
         </p>`
      : "";

  const insight = report.topInsight
    ? `<div style="background:#f1f5f9;border-radius:8px;padding:14px 16px;margin:0 0 24px 0;">
         <p style="font-size:13px;color:#475569;margin:0;line-height:1.5;">
           <strong style="color:#0f172a;">This week:</strong> ${escapeHtml(report.topInsight)}
         </p>
       </div>`
    : "";

  const html = baseShell(
    studioName,
    `
      <p style="font-size:16px;color:#0f172a;margin:0 0 8px 0;">Morning ${escapeHtml(ownerFirstName)},</p>
      <p style="font-size:16px;color:#334155;margin:0 0 24px 0;line-height:1.55;">
        ${totalAtRisk === 1 ? "One client needs" : `${totalAtRisk} clients need`} a friendly check-in today. The Copilot already wrote each text — you just tap and send.
      </p>

      ${insight}

      <table cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
        ${rows}
      </table>

      ${remainderLine}

      <div style="text-align:center;margin:32px 0 8px 0;">
        <a href="${copilotUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
          Open the Copilot
        </a>
      </div>

      <p style="font-size:12px;color:#94a3b8;margin:24px 0 0 0;text-align:center;line-height:1.5;">
        Every text goes from your own phone, in your own voice.<br>
        Five minutes today saves clients you'd otherwise lose this month.
      </p>
    `,
  );

  const textRows = ranked
    .map((c) => {
      const firstName = c.clientName.split(" ")[0] || c.clientName;
      return `• ${firstName} — ${c.primaryIntervention.reason}`;
    })
    .join("\n");

  const text = `Morning ${ownerFirstName},

${totalAtRisk === 1 ? "One client needs" : `${totalAtRisk} clients need`} a friendly check-in today. The Copilot already wrote each text.

${textRows}${remainder > 0 ? `\n+${remainder} more in the Copilot` : ""}

Open the Copilot: ${copilotUrl}

Every text goes from your own phone, in your own voice.`;

  return { subject, html, text };
}

function baseShell(studioName: string, inner: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Retention Copilot</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;">
      <div style="font-size:12px;color:#94a3b8;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 24px 0;">
        Retention Copilot
      </div>
      ${inner}
    </div>
    <p style="font-size:11px;color:#cbd5e1;margin:24px 0 0 0;text-align:center;line-height:1.5;">
      ${escapeHtml(studioName)} · sent by FlexiWell every morning<br>
      You can turn this off in Settings → Notifications.
    </p>
  </div>
</body>
</html>`;
}

// ----------------------------------------------------------------------------
// Send for one establishment
// ----------------------------------------------------------------------------

export interface DigestSendResult {
  establishmentId: string;
  ownerEmail?: string;
  skipped?: "no_owner" | "no_owner_email" | "no_clients_at_risk";
  email?: EmailResult;
}

export async function sendDigestForEstablishment(
  establishmentId: string,
): Promise<DigestSendResult> {
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

  const report = await generateWeeklyCheckup(establishmentId);

  // If literally nobody is at risk, skip the send. Daily silence is golden;
  // emailing "nothing to do" every day trains the owner to ignore the inbox.
  if (report.summary.totalAtRisk === 0) {
    return {
      establishmentId,
      ownerEmail: owner.email,
      skipped: "no_clients_at_risk",
    };
  }

  const ownerFirstName =
    (typeof owner.name === "string" ? owner.name.split(" ")[0] : "") || "there";
  const studioName = (establishment.name as string) || "your studio";

  const { subject, html, text } = renderDigest(ownerFirstName, studioName, report);

  const emailResult = await sendEmail({
    to: owner.email,
    subject,
    html,
    text,
  });

  // Log the send so we have a paper trail and can show "last digest sent at"
  // in settings later.
  await db.collection("retention_copilot_digests").insertOne({
    establishmentId,
    ownerId: establishment.ownerId,
    ownerEmail: owner.email,
    sentAt: new Date(),
    success: emailResult.success,
    error: emailResult.error,
    clientsCount: report.summary.totalAtRisk,
    subject,
  });

  return { establishmentId, ownerEmail: owner.email, email: emailResult };
}

// ----------------------------------------------------------------------------
// Send for every establishment (cron entrypoint)
// ----------------------------------------------------------------------------

export interface DigestRunSummary {
  totalEstablishments: number;
  sent: number;
  skipped: number;
  failed: number;
  results: DigestSendResult[];
}

export async function sendDigestForAllEstablishments(): Promise<DigestRunSummary> {
  const db = await getDatabase();
  const establishments = await db
    .collection("establishments")
    .find({}, { projection: { _id: 1 } })
    .toArray();

  const results: DigestSendResult[] = [];
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const est of establishments) {
    try {
      const result = await sendDigestForEstablishment(est._id.toString());
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
