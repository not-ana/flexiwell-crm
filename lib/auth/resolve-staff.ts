import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

/**
 * Resolve the staffId for a teacher user.
 * Classes store instructorId as the staff document _id,
 * but the JWT userId is the user document _id.
 * This function looks up the user's staffId field to bridge the gap.
 */
export async function resolveStaffId(userId: string): Promise<string> {
  const db = await getDatabase();
  const userDoc = await db.collection("users").findOne({ _id: new ObjectId(userId) });
  return userDoc?.staffId || userId;
}
