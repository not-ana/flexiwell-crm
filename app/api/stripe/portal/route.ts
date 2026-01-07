// Stripe Customer Portal API Route
// POST /api/stripe/portal - Create a portal session for subscription management

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createPortalSession } from "@/lib/stripe/server";
import { portalConfig } from "@/lib/stripe/config";
import { getDatabase as getDb } from "@/lib/db/mongodb";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

async function getUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    ) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function POST() {
  try {
    // Require authenticated user
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's Stripe customer ID
    const db = await getDb();
    const userDoc = await db.collection("users").findOne({ email: user.email });

    if (!userDoc?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer found. Please subscribe to a plan first." },
        { status: 400 }
      );
    }

    // Create portal session
    const session = await createPortalSession({
      customerId: userDoc.stripeCustomerId,
      returnUrl: portalConfig.returnUrl,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
