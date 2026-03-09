import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { requireAuthFromCookie, requireAuth } from "@/lib/auth/middleware";

// Helper to get auth from either cookie or Bearer token
async function getAuthUser(request: NextRequest) {
  // First try Bearer token
  const bearerAuth = requireAuth(request);
  if (bearerAuth.user) {
    return { user: bearerAuth.user, error: null };
  }

  // Fall back to cookie
  return await requireAuthFromCookie();
}

// GET /api/profile/notifications - Get notification preferences
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();
    const dbUser = await db.collection("users").findOne(
      { _id: new ObjectId(user.userId) },
      { projection: { "preferences.notifications": 1 } }
    );

    const notifs = dbUser?.preferences?.notifications || { email: true, sms: false };
    return NextResponse.json({ email: notifs.email ?? true, sms: notifs.sms ?? false });
  } catch (err) {
    console.error("Error fetching notification preferences:", err);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

// PUT /api/profile/notifications - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const db = await getDatabase();

    await db.collection("users").updateOne(
      { _id: new ObjectId(user.userId) },
      {
        $set: {
          "preferences.notifications.email": !!body.email,
          "preferences.notifications.sms": !!body.sms,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating notification preferences:", err);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
