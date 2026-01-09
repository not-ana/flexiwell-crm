import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";
import type { Review, Staff } from "@/lib/db/schemas";

// Helper to update staff rating aggregates
async function updateStaffRating(db: ReturnType<typeof getDatabase> extends Promise<infer T> ? T : never, staffId: string) {
  const reviews = await db
    .collection<Review>("reviews")
    .find({ staffId, status: "approved" })
    .toArray();

  if (reviews.length === 0) {
    await db.collection<Staff>("staff").updateOne(
      { _id: new ObjectId(staffId) },
      {
        $set: {
          rating: {
            average: 0,
            totalReviews: 0,
            breakdown: { five: 0, four: 0, three: 0, two: 0, one: 0 },
          },
          updatedAt: new Date(),
        },
      }
    );
    return;
  }

  const breakdown = { five: 0, four: 0, three: 0, two: 0, one: 0 };
  let totalRating = 0;

  for (const review of reviews) {
    totalRating += review.rating;
    switch (review.rating) {
      case 5: breakdown.five++; break;
      case 4: breakdown.four++; break;
      case 3: breakdown.three++; break;
      case 2: breakdown.two++; break;
      case 1: breakdown.one++; break;
    }
  }

  const average = Math.round((totalRating / reviews.length) * 10) / 10;

  await db.collection<Staff>("staff").updateOne(
    { _id: new ObjectId(staffId) },
    {
      $set: {
        rating: {
          average,
          totalReviews: reviews.length,
          breakdown,
        },
        updatedAt: new Date(),
      },
    }
  );
}

// GET /api/reviews - List reviews
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const db = await getDatabase();

    // Build query
    const query: Record<string, unknown> = {};

    if (staffId) {
      query.staffId = staffId;
    }

    if (clientId) {
      query.clientId = clientId;
    }

    const userClientId = (user as { clientId?: string }).clientId;

    // Non-admin users can only see approved reviews (unless viewing their own)
    if (user.role !== "admin") {
      if (user.role === "client" && userClientId) {
        // Clients can see their own reviews + approved reviews
        query.$or = [
          { clientId: userClientId },
          { status: "approved", isPublic: true },
        ];
      } else if (user.role === "teacher") {
        // Teachers can see reviews about them + approved public reviews
        query.$or = [
          { staffId: user.userId },
          { status: "approved", isPublic: true },
        ];
      } else {
        query.status = "approved";
        query.isPublic = true;
      }
    } else if (status) {
      query.status = status;
    }

    const [reviews, total] = await Promise.all([
      db
        .collection<Review>("reviews")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray(),
      db.collection<Review>("reviews").countDocuments(query),
    ]);

    return NextResponse.json({
      reviews,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("List reviews error:", error);
    return NextResponse.json(
      { error: "Failed to list reviews" },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a review
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only clients can submit reviews
    if (user.role !== "client" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Only clients can submit reviews" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { staffId, rating, comment, bookingId, classId, className, isPublic = true } = body;

    if (!staffId || !rating) {
      return NextResponse.json(
        { error: "staffId and rating are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get staff info
    const staff = await db
      .collection<Staff>("staff")
      .findOne({ _id: new ObjectId(staffId) });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    const userClientId = (user as { clientId?: string }).clientId;

    // Get client info
    const client = await db
      .collection("clients")
      .findOne({ _id: new ObjectId(userClientId || user.userId) });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Check if client already reviewed this staff member recently (within 30 days)
    const recentReview = await db.collection<Review>("reviews").findOne({
      staffId,
      clientId: client._id.toString(),
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    if (recentReview) {
      return NextResponse.json(
        { error: "You have already submitted a review for this instructor recently" },
        { status: 400 }
      );
    }

    const review: Omit<Review, "_id"> = {
      staffId,
      staffName: staff.name,
      clientId: client._id.toString(),
      clientName: client.name,
      bookingId,
      classId,
      className,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      comment,
      status: "pending", // Reviews need approval
      isPublic,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Review>("reviews").insertOne(review as Review);

    return NextResponse.json({
      message: "Review submitted successfully. It will be visible after moderation.",
      review: {
        _id: result.insertedId,
        ...review,
      },
    });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

// PATCH /api/reviews - Moderate reviews (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reviewId, action, rejectionReason } = body;

    if (!reviewId || !action) {
      return NextResponse.json(
        { error: "reviewId and action are required" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const review = await db
      .collection<Review>("reviews")
      .findOne({ _id: new ObjectId(reviewId) });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    const updateData: Partial<Review> = {
      status: action === "approve" ? "approved" : "rejected",
      moderatedBy: user.userId,
      moderatedAt: new Date(),
      updatedAt: new Date(),
    };

    if (action === "reject" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await db.collection<Review>("reviews").updateOne(
      { _id: new ObjectId(reviewId) },
      { $set: updateData }
    );

    // Update staff rating if approved
    if (action === "approve") {
      await updateStaffRating(db, review.staffId);
    }

    return NextResponse.json({
      message: `Review ${action}d successfully`,
    });
  } catch (error) {
    console.error("Moderate review error:", error);
    return NextResponse.json(
      { error: "Failed to moderate review" },
      { status: 500 }
    );
  }
}
