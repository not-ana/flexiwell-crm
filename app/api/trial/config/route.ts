import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { StudioSettings } from "@/lib/db/schemas";

// GET /api/trial/config - Public endpoint for trial booking configuration
// No auth required — this is fetched by the public /trial page
export async function GET() {
  try {
    const db = await getDatabase();
    const settings = await db.collection<StudioSettings>("settings").findOne({});

    const trialBooking = settings?.trialBooking;
    const currency = settings?.general?.currency || "USD";

    // Return only what the public page needs (no internal fields)
    return NextResponse.json({
      trialEnabled: trialBooking?.trialEnabled ?? true,
      trialPrice: trialBooking?.trialPrice ?? 0,
      dropInEnabled: trialBooking?.dropInEnabled ?? true,
      dropInPrice: trialBooking?.dropInPrice ?? 35,
      acceptedPaymentMethods: trialBooking?.acceptedPaymentMethods ?? ["card", "cash"],
      requirePaymentUpfront: trialBooking?.requirePaymentUpfront ?? false,
      postTrialCouponCode: trialBooking?.postTrialCouponCode || "",
      postTrialDiscountPercent: trialBooking?.postTrialDiscountPercent ?? 0,
      currency,
      studioName: settings?.general?.studioName || "FlexiWell Studio",
    });
  } catch (error) {
    console.error("Error fetching trial config:", error);
    // Return sensible defaults on error
    return NextResponse.json({
      trialEnabled: true,
      trialPrice: 0,
      dropInEnabled: true,
      dropInPrice: 35,
      acceptedPaymentMethods: ["card", "cash"],
      requirePaymentUpfront: false,
      postTrialCouponCode: "",
      postTrialDiscountPercent: 0,
      currency: "USD",
      studioName: "FlexiWell Studio",
    });
  }
}
