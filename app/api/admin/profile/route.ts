import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { requireAuthFromCookie, requireAuth } from "@/lib/auth/middleware";
import type { Staff, User } from "@/lib/db/schemas";

export async function GET(request: NextRequest) {
  try {
    // Try cookie auth first, then header auth
    let authResult = await requireAuthFromCookie();
    if (authResult.error) {
      authResult = requireAuth(request);
    }
    const { user, error } = authResult;
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();
    const adminId = user.userId;

    // Get admin/staff data - try staff collection first, then users collection
    let admin: Staff | User | null = null;
    if (ObjectId.isValid(adminId)) {
      admin = await db.collection<Staff>("staff").findOne({
        _id: new ObjectId(adminId),
      });

      // If not found in staff, try users collection
      if (!admin) {
        admin = await db.collection<User>("users").findOne({
          _id: new ObjectId(adminId),
        });
      }
    }

    // If not found by ID, try by email in both collections
    if (!admin) {
      admin = await db.collection<Staff>("staff").findOne({
        email: user.email,
      });
    }

    if (!admin) {
      admin = await db.collection<User>("users").findOne({
        email: user.email,
      });
    }

    // Get stats
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalClients, totalStaff, totalClasses, totalRevenue] = await Promise.all([
      db.collection("clients").countDocuments(),
      db.collection("staff").countDocuments(),
      db.collection("classes").countDocuments({
        scheduledDate: { $gte: thisMonth },
      }),
      db.collection("payments").aggregate([
        {
          $match: {
            createdAt: { $gte: thisMonth },
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]).toArray().then(result => result[0]?.total || 0),
    ]);

    // Get recent activity
    const recentPayments = await db.collection("payments")
      .find()
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();

    const recentActivity = recentPayments.map(p => ({
      id: p._id.toString(),
      type: "payment" as const,
      description: `Payment received from ${p.clientName || "client"}`,
      timestamp: p.createdAt ? formatTimeAgo(new Date(p.createdAt)) : "Recently",
    }));

    if (!admin) {
      // Return default profile if not found
      return NextResponse.json({
        user: {
          name: user.email.split("@")[0],
          email: user.email,
          initials: user.email.substring(0, 2).toUpperCase(),
          location: "United States",
          locationFlag: "\u{1f1fa}\u{1f1f8}",
          phone: "",
          role: "Admin",
          about: "",
        },
        stats: {
          totalClients,
          totalStaff,
          totalClasses,
          totalRevenue,
        },
        recentActivity,
      });
    }

    return NextResponse.json({
      user: {
        name: admin.name,
        email: admin.email,
        avatar: admin.avatar,
        initials: admin.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
        location: "United States",
        locationFlag: "\u{1f1fa}\u{1f1f8}",
        phone: admin.phone || "",
        role: admin.role === "admin" ? "Administrator" : admin.role.charAt(0).toUpperCase() + admin.role.slice(1),
        about: ("bio" in admin ? admin.bio : "") || "",
      },
      stats: {
        totalClients,
        totalStaff,
        totalClasses,
        totalRevenue,
      },
      recentActivity,
    });
  } catch (error) {
    console.error("Admin profile error:", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
