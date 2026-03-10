import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { RefreshToken } from "@/lib/db/schemas";
import { requireAuth } from "@/lib/auth/middleware";

// POST /api/auth/logout - Logout user (invalidate refresh token)
export async function POST(request: NextRequest) {
  // Require authentication
  const { user: authUser, error } = requireAuth(request);

  if (error) {
    return error;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { refreshToken } = body;

    const db = await getDatabase();

    if (refreshToken) {
      // Delete specific refresh token
      await db.collection<RefreshToken>("refresh_tokens").deleteOne({
        userId: authUser!.userId,
        token: refreshToken,
      });
    } else {
      // Delete all refresh tokens for this user (logout from all devices)
      await db.collection<RefreshToken>("refresh_tokens").deleteMany({
        userId: authUser!.userId,
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear auth cookie
    response.cookies.delete("auth_token");

    return response;
  } catch (error) {
    console.error("Error logging out:", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}
