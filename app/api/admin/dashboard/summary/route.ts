import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { callAI, getAIProviderInfo } from "@/lib/ai/providers";

// POST /api/admin/dashboard/summary - Generate AI analysis of studio metrics
export async function POST(request: NextRequest) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const metrics = await request.json();

    const providerInfo = getAIProviderInfo();
    if (!providerInfo.configured) {
      return NextResponse.json({
        summary: generateFallbackSummary(metrics),
        provider: null,
      });
    }

    const prompt = buildPrompt(metrics);

    const response = await callAI([
      { role: "system", content: prompt },
      { role: "user", content: "Analyze these studio metrics and give me a concise health summary." },
    ]);

    return NextResponse.json({
      summary: response.content,
      provider: providerInfo.provider,
    });
  } catch (err) {
    console.error("Error generating dashboard summary:", err);
    return NextResponse.json({
      summary: "Unable to generate AI summary at this time.",
      provider: null,
    });
  }
}

function buildPrompt(m: Record<string, unknown>): string {
  return `You are a studio business consultant analyzing metrics for a fitness/wellness studio owner.

METRICS FOR THIS PERIOD:
- Revenue: ${m.revenue} (change: ${m.revenueChange} vs last period)
- Active clients: ${m.clients} (${m.clientsChange} new this period)
- Attendance rate: ${m.attendance}
- No-show rate: ${m.noShowRate}
- Churn rate: ${m.churnRate || "N/A"}%
- Waitlist: ${m.waitlistFills} of ${m.waitlistSpotsGenerated} spots filled (${m.waitlistFillRate}% fill rate)
- Revenue recovered from waitlist: ${m.revenueRecovered}
- Avg LTV: ${m.avgLTV || "N/A"}
- Period: ${m.period}

RULES:
1. Write 2-3 short sentences in English, informal but professional
2. Start with overall health assessment (good/attention/critical)
3. Highlight the most important insight — what should the owner focus on?
4. If something needs action, give ONE specific actionable suggestion
5. Don't just repeat numbers — interpret them. "Revenue grew 15%" alone is useless. "Revenue grew 15% — your retention campaigns are working" is useful.
6. Keep it under 200 characters total
7. DO NOT use markdown, emojis, or formatting — plain text only`;
}

function generateFallbackSummary(m: Record<string, unknown>): string {
  const parts: string[] = [];
  const revChange = parseFloat(String(m.revenueChange || "0"));
  const noShow = parseFloat(String(m.noShowRate || "0"));
  const churn = parseFloat(String(m.churnRate || "0"));
  const attendance = parseFloat(String(m.attendance || "0"));

  if (!isNaN(revChange)) {
    if (revChange > 5) parts.push(`Revenue grew ${m.revenueChange} — good sign.`);
    else if (revChange < -5) parts.push(`Revenue dropped ${m.revenueChange} — review your promotions.`);
    else parts.push("Revenue is stable.");
  }

  if (!isNaN(noShow) && noShow > 10) {
    parts.push(`No-show rate at ${m.noShowRate} — enable automatic reminders.`);
  } else if (!isNaN(attendance) && attendance < 70) {
    parts.push(`Attendance at ${m.attendance} — engagement needs improvement.`);
  }

  if (!isNaN(churn) && churn > 10) {
    parts.push(`Churn at ${churn}% — prioritize retention.`);
  }

  return parts.length > 0
    ? parts.slice(0, 2).join(" ")
    : "Add clients and classes to see your studio analysis here.";
}
