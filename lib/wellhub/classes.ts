// Wellhub Class Sync Service
// Syncs classes from FlexiWell to Wellhub app

import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { wellhubClient, WellhubApiException } from "./client";
import type { WellhubClassCreate, WellhubClassUpdate } from "./types";
import type { Class } from "@/lib/db/schemas";

// Map FlexiWell class types to Wellhub categories
const CLASS_TYPE_MAP: Record<string, string> = {
  yoga: "yoga",
  pilates: "pilates",
  stretching: "stretching",
  meditation: "meditation",
  other: "fitness",
};

/**
 * Sync a single class to Wellhub
 */
export async function syncClassToWellhub(classId: string): Promise<{
  success: boolean;
  wellhubClassId?: string;
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

  // Build the class data for Wellhub
  const startDateTime = new Date(classDoc.scheduledDate);
  const [startHour, startMin] = classDoc.startTime.split(":").map(Number);
  startDateTime.setHours(startHour, startMin, 0, 0);

  const endDateTime = new Date(classDoc.scheduledDate);
  const [endHour, endMin] = classDoc.endTime.split(":").map(Number);
  endDateTime.setHours(endHour, endMin, 0, 0);

  const availableSpots = classDoc.maxCapacity - classDoc.currentEnrollment;

  try {
    // Check if class already has a Wellhub ID (update vs create)
    const existingWellhubId = (classDoc as unknown as { wellhubClassId?: string }).wellhubClassId;

    if (existingWellhubId) {
      // Update existing class
      const updateData: WellhubClassUpdate = {
        name: classDoc.title,
        description: classDoc.description,
        instructor_name: classDoc.instructorName,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        max_capacity: classDoc.maxCapacity,
        available_spots: availableSpots,
      };

      await wellhubClient.updateClass(existingWellhubId, updateData);

      // Update sync status
      await db.collection("classes").updateOne(
        { _id: classDoc._id },
        {
          $set: {
            wellhubLastSyncAt: new Date(),
            wellhubSyncStatus: "synced",
            wellhubSyncError: null,
            updatedAt: new Date(),
          },
        }
      );

      return { success: true, wellhubClassId: existingWellhubId };
    } else {
      // Create new class on Wellhub
      const createData: WellhubClassCreate = {
        external_id: classDoc._id!.toString(),
        name: classDoc.title,
        description: classDoc.description,
        instructor_name: classDoc.instructorName,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        max_capacity: classDoc.maxCapacity,
        available_spots: availableSpots,
        location: classDoc.location,
        category: CLASS_TYPE_MAP[classDoc.type] || "fitness",
      };

      const response = await wellhubClient.createClass(createData);

      // Store Wellhub class ID
      await db.collection("classes").updateOne(
        { _id: classDoc._id },
        {
          $set: {
            wellhubClassId: response.id,
            wellhubSyncEnabled: true,
            wellhubLastSyncAt: new Date(),
            wellhubSyncStatus: "synced",
            wellhubSyncError: null,
            updatedAt: new Date(),
          },
        }
      );

      return { success: true, wellhubClassId: response.id };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Update sync status with error
    await db.collection("classes").updateOne(
      { _id: classDoc._id },
      {
        $set: {
          wellhubSyncStatus: "failed",
          wellhubSyncError: errorMessage,
          updatedAt: new Date(),
        },
      }
    );

    console.error("Failed to sync class to Wellhub:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Cancel a class on Wellhub
 */
export async function cancelClassOnWellhub(classId: string): Promise<{
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

  const wellhubClassId = (classDoc as unknown as { wellhubClassId?: string }).wellhubClassId;

  if (!wellhubClassId) {
    return { success: false, error: "Class not synced to Wellhub" };
  }

  try {
    await wellhubClient.cancelClass(wellhubClassId);

    await db.collection("classes").updateOne(
      { _id: classDoc._id },
      {
        $set: {
          wellhubSyncStatus: "synced",
          wellhubLastSyncAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return { success: true };
  } catch (error) {
    if (error instanceof WellhubApiException && error.isNotFound()) {
      // Class already deleted on Wellhub, that's fine
      return { success: true };
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to cancel class on Wellhub:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Update available spots for a class on Wellhub
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

  const wellhubClassId = (classDoc as unknown as { wellhubClassId?: string }).wellhubClassId;

  if (!wellhubClassId) {
    return { success: false, error: "Class not synced to Wellhub" };
  }

  const availableSpots = classDoc.maxCapacity - classDoc.currentEnrollment;

  try {
    await wellhubClient.updateAvailableSpots(wellhubClassId, availableSpots);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update class availability on Wellhub:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Batch sync multiple classes to Wellhub
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
    const result = await syncClassToWellhub(classId);
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
 * Sync all upcoming classes to Wellhub
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
 * Enable Wellhub sync for a class
 */
export async function enableWellhubSync(classId: string): Promise<void> {
  const db = await getDatabase();

  await db.collection("classes").updateOne(
    { _id: new ObjectId(classId) },
    {
      $set: {
        wellhubSyncEnabled: true,
        updatedAt: new Date(),
      },
    }
  );

  // Sync immediately
  await syncClassToWellhub(classId);
}

/**
 * Disable Wellhub sync for a class
 */
export async function disableWellhubSync(classId: string): Promise<void> {
  const db = await getDatabase();

  await db.collection("classes").updateOne(
    { _id: new ObjectId(classId) },
    {
      $set: {
        wellhubSyncEnabled: false,
        updatedAt: new Date(),
      },
    }
  );
}
