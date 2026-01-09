import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";
import type { Review } from "@/lib/db/schemas";

// GET /api/reviews/[id] - Get a single review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid review ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const review = await db
      .collection<Review>("reviews")
      .findOne({ _id: new ObjectId(id) });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Check access permissions
    const clientId = (user as { clientId?: string }).clientId;
    const canView =
      user.role === "admin" ||
      review.clientId === (clientId || user.userId) ||
      review.staffId === user.userId ||
      (review.status === "approved" && review.isPublic);

    if (!canView) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Get review error:", error);
    return NextResponse.json(
      { error: "Failed to get review" },
      { status: 500 }
    );
  }
}

// PUT /api/reviews/[id] - Update review (client can edit, teacher can respond)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid review ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const review = await db
      .collection<Review>("reviews")
      .findOne({ _id: new ObjectId(id) });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const clientId = (user as { clientId?: string }).clientId;

    // Teacher responding to a review
    if (user.role === "teacher" && review.staffId === user.userId) {
      const { response } = body;

      if (!response) {
        return NextResponse.json(
          { error: "Response content is required" },
          { status: 400 }
        );
      }

      await db.collection<Review>("reviews").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            response: {
              content: response,
              respondedAt: new Date(),
            },
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        message: "Response added successfully",
      });
    }

    // Client editing their own review (only if pending)
    if (
      user.role === "client" &&
      review.clientId === (clientId || user.userId)
    ) {
      if (review.status !== "pending") {
        return NextResponse.json(
          { error: "Cannot edit a review that has already been moderated" },
          { status: 400 }
        );
      }

      const { rating, comment, isPublic } = body;

      const updateData: Partial<Review> = {
        updatedAt: new Date(),
      };

      if (rating !== undefined) {
        if (rating < 1 || rating > 5) {
          return NextResponse.json(
            { error: "Rating must be between 1 and 5" },
            { status: 400 }
          );
        }
        updateData.rating = rating as 1 | 2 | 3 | 4 | 5;
      }

      if (comment !== undefined) {
        updateData.comment = comment;
      }

      if (isPublic !== undefined) {
        updateData.isPublic = isPublic;
      }

      await db.collection<Review>("reviews").updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      return NextResponse.json({
        message: "Review updated successfully",
      });
    }

    return NextResponse.json(
      { error: "You do not have permission to edit this review" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Update review error:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[id] - Delete review (client or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid review ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const review = await db
      .collection<Review>("reviews")
      .findOne({ _id: new ObjectId(id) });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Only admin or the review owner can delete
    const clientId = (user as { clientId?: string }).clientId;
    const canDelete =
      user.role === "admin" ||
      review.clientId === (clientId || user.userId);

    if (!canDelete) {
      return NextResponse.json(
        { error: "You do not have permission to delete this review" },
        { status: 403 }
      );
    }

    await db.collection<Review>("reviews").deleteOne({ _id: new ObjectId(id) });

    // Update staff rating if the review was approved
    if (review.status === "approved") {
      // Recalculate rating
      const reviews = await db
        .collection<Review>("reviews")
        .find({ staffId: review.staffId, status: "approved" })
        .toArray();

      const breakdown = { five: 0, four: 0, three: 0, two: 0, one: 0 };
      let totalRating = 0;

      for (const r of reviews) {
        totalRating += r.rating;
        switch (r.rating) {
          case 5: breakdown.five++; break;
          case 4: breakdown.four++; break;
          case 3: breakdown.three++; break;
          case 2: breakdown.two++; break;
          case 1: breakdown.one++; break;
        }
      }

      const average = reviews.length > 0
        ? Math.round((totalRating / reviews.length) * 10) / 10
        : 0;

      await db.collection("staff").updateOne(
        { _id: new ObjectId(review.staffId) },
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

    return NextResponse.json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
