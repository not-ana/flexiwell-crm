import { NextResponse } from "next/server";

/**
 * Automated SMS bot feature flag.
 *
 * Permanently disabled in v1. FlexiWell ships the Retention Copilot instead:
 * we draft the SMS, the studio owner sends it from her own phone via an
 * `sms:` deep link. No Twilio, no A2P 10DLC, no per-studio number, no
 * compliance surface. The Twilio-backed automated bot may return as a paid
 * add-on later if studios explicitly demand it and the ROI justifies the
 * setup pain.
 *
 * Flip to `true` (or wire to env) only if re-introducing automated sending.
 */
export const SMS_BOT_ENABLED = false;

export function smsBotDisabledResponse() {
  return NextResponse.json(
    { error: "SMS bot is not available in this release." },
    { status: 503 },
  );
}
