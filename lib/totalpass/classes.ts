// TotalPass Class Sync Service
// Syncs classes from FlexiWell to TotalPass app

import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { totalpassClient, TotalPassApiException } from "./client";
import type { TotalPassClassCreate, TotalPassClassUpdate } from "./types";
import type { Class } from "@/lib/db/schemas";

// Map FlexiWell class types to TotalPass categories
const CLASS_TYPE_MAP: Record<string, string> = {
  yoga: "yoga",
  pilates: "pilates",
  stretching: "alongamento",
  meditation: "meditacao",
  functional: "funcional",
  dance: "danca",
  crossfit: "crossfit",
  spinning: "spinning",
  other: "fitness",
};

/**
 * Sync a single class to TotalPass
 */
export async function syncClassToTotalPass(classId: string): Promise<{
  success: boolean;
  totalpassClassId?: string;
  error?: string;
}> {
  const db = await getDatabase();

  const classDoc = await db.collection<Class>("classes").findOne({
    _id: new ObjectId(classId),
  });

  if (!classDoc) {
    return { success: false, error: "Class not found" };
  }

  // Don't sync cancelled or completed classes
  if (classDoc.status !== "scheduled") {
    return { success: false, error: `Class status is ${classDoc.status}` };
  }

  // Build the class data for TotalPass
  const startDateTime = new Date(classDoc.scheduledDate);
  const [startHour, startMin] = classDoc.startTime.split(":").map(Number);
  startDateTime.setHours(startHour, startMin, 0, 0);

  const endDateTime = new Date(classDoc.scheduledDate);
  const [endHour, endMin] = classDoc.endTime.split(":").map(Number);
  endDateTime.setHours(endHour, endMin, 0, 0);

  // Calculate duration in minutes
  const durationMs = endDateTime.getTime() - startDateTime.getTime();
  const durationMinutes = Math.round(durationMs / (1000 * 60));

  const availableSpots = classDoc.maxCapacity - classDoc.currentEnrollment;

  try {
    // Check if class already has a TotalPass ID (update vs create)
    const existingTotalPassId = (classDoc as unknown as { totalpassClassId?: string }).totalpassClassId;

    if (existingTotalPassId) {
      // Update existing class
      const updateData: TotalPassClassUpdate = {
        name: classDoc.title,
        description: classDoc.description,
        instructor: classDoc.instructorName,
        datetime: startDateTime.toISOString(),
        duration: durationMinutes,
        capacity: classDoc.maxCapacity,
        availableSpots: availableSpots,
      };

      await totalpassClient.updateClass(existingTotalPassId, updateData);

      // Update sync status
      await db.collection("classes").updateOne(
        { _id: classDoc._id },
        {
          $set: {
            totalpassLastSyncAt: new Date(),
            totalpassSyncStatus: "synced",
            totalpassSyncError: null,
            updatedAt: new Date(),
          },
        }
      );

      return { success: true, totalpassClassId: existingTotalPassId };
    } else {
      // Create new class on TotalPass
      const createData: TotalPassClassCreate = {
        externalId: classDoc._id!.toString(),
        name: classDoc.title,
        description: classDoc.description,
        instructor: classDoc.instructorName,
        datetime: startDateTime.toISOString(),
        duration: durationMinutes,
        capacity: classDoc.maxCapacity,
        availableSpots: availableSpots,
        location: classDoc.location,
        category: CLASS_TYPE_MAP[classDoc.type] || "fitness",
      };

      const response = await totalpassClient.createClass(createData);

      // Store TotalPass class ID
      await db.collection("classes").updateOne(
        { _id: classDoc._id },
        {
          $set: {
            totalpassClassId: response.id,
            totalpassSyncEnabled: true,
            totalpassLastSyncAt: new Date(),
            totalpassSyncStatus: "synced",
            totalpassSyncError: null,
            updatedAt: new Date(),
          },
        }
      );

      return { success: true, totalpassClassId: response.id };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Update sync status with error
    await db.collection("classes").updateOne(
      { _id: classDoc._id },
      {
        $set: {
          totalpassSyncStatus: "failed",
          totalpassSyncError: errorMessage,
          updatedAt: new Date(),
        },
      }
    );

    console.error("Failed to sync class to TotalPass:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Cancel a class on TotalPass
 */
export async function cancelClassOnTotalPass(classId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const db = await getDatabase();

  const classDoc = await db.collection("classes").findOne({
    _id: new ObjectId(classId),
  });

  if (!classDoc) {
    return { success: false, error: "Class not found" };
  }

  const totalpassClassId = (classDoc as unknown as { totalpassClassId?: string }).totalpassClassId;

  if (!totalpassClassId) {
    return { success: false, error: "Class not synced to TotalPass" };
  }

  try {
    await totalpassClient.cancelClass(totalpassClassId);

    await db.collection("classes").updateOne(
      { _id: classDoc._id },
      {
        $set: {
          totalpassSyncStatus: "synced",
          totalpassLastSyncAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return { success: true };
  } catch (error) {
    if (error instanceof TotalPassApiException && error.isNotFound()) {
      // Class already deleted on TotalPass, that's fine
      return { success: true };
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to cancel class on TotalPass:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Update available spots for a class on TotalPass
 */
export async function updateClassAvailability(classId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const db = await getDatabase();

  const classDoc = await db.collection("classes").findOne({
    _id: new ObjectId(classId),
  });

  if (!classDoc) {
    return { success: false, error: "Class not found" };
  }

  const totalpassClassId = (classDoc as unknown as { totalpassClassId?: string }).totalpassClassId;

  if (!totalpassClassId) {
    return { success: false, error: "Class not synced to TotalPass" };
  }

  const availableSpots = classDoc.maxCapacity - classDoc.currentEnrollment;

  try {
    await totalpassClient.updateAvailableSpots(totalpassClassId, availableSpots);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update class availability on TotalPass:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Batch sync multiple classes to TotalPass
 */
export async function batchSyncClasses(classIds: string[]): Promise<{
  synced: number;
  failed: number;
  errors: Array<{ classId: string; error: string }>;
}> {
  const results = {
    synced: 0,
    failed: 0,
    errors: [] as Array<{ classId: string; error: string }>,
  };

  for (const classId of classIds) {
    const result = await syncClassToTotalPass(classId);
    if (result.success) {
      results.synced++;
    } else {
      results.failed++;
      results.errors.push({ classId, error: result.error || "Unknown error" });
    }

    // Add small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Sync all upcoming classes to TotalPass
 */
export async function syncAllUpcomingClasses(): Promise<{
  synced: number;
  failed: number;
  errors: Array<{ classId: string; error: string }>;
}> {
  const db = await getDatabase();

  const now = new Date();
  const classes = await db
    .collection("classes")
    .find({
      scheduledDate: { $gte: now },
      status: "scheduled",
    })
    .toArray();

  const classIds = classes.map((c) => c._id.toString());
  return batchSyncClasses(classIds);
}

/**
 * Enable TotalPass sync for a class
 */
export async function enableTotalPassSync(classId: string): Promise<void> {
  const db = await getDatabase();

  await db.collection("classes").updateOne(
    { _id: new ObjectId(classId) },
    {
      $set: {
        totalpassSyncEnabled: true,
        updatedAt: new Date(),
      },
    }
  );

  // Sync immediately
  await syncClassToTotalPass(classId);
}

/**
 * Disable TotalPass sync for a class
 */
export async function disableTotalPassSync(classId: string): Promise<void> {
  const db = await getDatabase();

  await db.collection("classes").updateOne(
    { _id: new ObjectId(classId) },
    {
      $set: {
        totalpassSyncEnabled: false,
        updatedAt: new Date(),
      },
    }
  );
}
