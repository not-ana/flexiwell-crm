// ClassPass Schedule (Class) Sync Service
// Syncs classes from FlexiWell to ClassPass marketplace

import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { classpassClient, ClassPassApiException } from "./client";
import type { ClassPassScheduleCreate, ClassPassScheduleUpdate } from "./types";
import type { Class } from "@/lib/db/schemas";

// Map FlexiWell class types to ClassPass categories
const CLASS_TYPE_MAP: Record<string, string> = {
  yoga: "yoga",
  pilates: "pilates",
  stretching: "stretching",
  meditation: "meditation",
  functional: "strength",
  dance: "dance",
  crossfit: "crossfit",
  spinning: "cycling",
  barre: "barre",
  boxing: "boxing",
  other: "fitness",
};

/**
 * Sync a single class to ClassPass
 */
export async function syncClassToClassPass(classId: string): Promise<{
  success: boolean;
  classpassScheduleId?: string;
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

  // Build the class data for ClassPass
  const startDateTime = new Date(classDoc.scheduledDate);
  const [startHour, startMin] = classDoc.startTime.split(":").map(Number);
  startDateTime.setHours(startHour, startMin, 0, 0);

  const endDateTime = new Date(classDoc.scheduledDate);
  const [endHour, endMin] = classDoc.endTime.split(":").map(Number);
  endDateTime.setHours(endHour, endMin, 0, 0);

  const openSpots = classDoc.maxCapacity - classDoc.currentEnrollment;

  try {
    // Check if class already has a ClassPass ID (update vs create)
    const existingClassPassId = (classDoc as unknown as { classpassScheduleId?: string }).classpassScheduleId;

    if (existingClassPassId) {
      // Update existing schedule
      const updateData: ClassPassScheduleUpdate = {
        name: classDoc.title,
        description: classDoc.description,
        instructor: classDoc.instructorName,
        startAt: startDateTime.toISOString(),
        endAt: endDateTime.toISOString(),
        totalSpots: classDoc.maxCapacity,
        openSpots: openSpots,
      };

      await classpassClient.updateSchedule(existingClassPassId, updateData);

      // Update sync status
      await db.collection("classes").updateOne(
        { _id: classDoc._id },
        {
          $set: {
            classpassLastSyncAt: new Date(),
            classpassSyncStatus: "synced",
            classpassSyncError: null,
            updatedAt: new Date(),
          },
        }
      );

      return { success: true, classpassScheduleId: existingClassPassId };
    } else {
      // Create new schedule on ClassPass
      const createData: ClassPassScheduleCreate = {
        externalId: classDoc._id!.toString(),
        name: classDoc.title,
        description: classDoc.description,
        instructor: classDoc.instructorName,
        startAt: startDateTime.toISOString(),
        endAt: endDateTime.toISOString(),
        totalSpots: classDoc.maxCapacity,
        openSpots: openSpots,
        location: classDoc.location,
        category: CLASS_TYPE_MAP[classDoc.type] || "fitness",
      };

      const response = await classpassClient.createSchedule(createData);

      // Store ClassPass schedule ID
      await db.collection("classes").updateOne(
        { _id: classDoc._id },
        {
          $set: {
            classpassScheduleId: response.id,
            classpassSyncEnabled: true,
            classpassLastSyncAt: new Date(),
            classpassSyncStatus: "synced",
            classpassSyncError: null,
            updatedAt: new Date(),
          },
        }
      );

      return { success: true, classpassScheduleId: response.id };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Update sync status with error
    await db.collection("classes").updateOne(
      { _id: classDoc._id },
      {
        $set: {
          classpassSyncStatus: "failed",
          classpassSyncError: errorMessage,
          updatedAt: new Date(),
        },
      }
    );

    console.error("Failed to sync class to ClassPass:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Cancel a class on ClassPass
 */
export async function cancelClassOnClassPass(classId: string): Promise<{
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

  const classpassScheduleId = (classDoc as unknown as { classpassScheduleId?: string }).classpassScheduleId;

  if (!classpassScheduleId) {
    return { success: false, error: "Class not synced to ClassPass" };
  }

  try {
    await classpassClient.cancelSchedule(classpassScheduleId);

    await db.collection("classes").updateOne(
      { _id: classDoc._id },
      {
        $set: {
          classpassSyncStatus: "synced",
          classpassLastSyncAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return { success: true };
  } catch (error) {
    if (error instanceof ClassPassApiException && error.isNotFound()) {
      // Schedule already deleted on ClassPass
      return { success: true };
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to cancel class on ClassPass:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Update available spots for a class on ClassPass
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

  const classpassScheduleId = (classDoc as unknown as { classpassScheduleId?: string }).classpassScheduleId;

  if (!classpassScheduleId) {
    return { success: false, error: "Class not synced to ClassPass" };
  }

  const openSpots = classDoc.maxCapacity - classDoc.currentEnrollment;

  try {
    await classpassClient.updateAvailability(classpassScheduleId, openSpots);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update class availability on ClassPass:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Batch sync multiple classes to ClassPass
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
    const result = await syncClassToClassPass(classId);
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
 * Sync all upcoming classes to ClassPass
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
 * Enable ClassPass sync for a class
 */
export async function enableClassPassSync(classId: string): Promise<void> {
  const db = await getDatabase();

  await db.collection("classes").updateOne(
    { _id: new ObjectId(classId) },
    {
      $set: {
        classpassSyncEnabled: true,
        updatedAt: new Date(),
      },
    }
  );

  // Sync immediately
  await syncClassToClassPass(classId);
}

/**
 * Disable ClassPass sync for a class
 */
export async function disableClassPassSync(classId: string): Promise<void> {
  const db = await getDatabase();

  await db.collection("classes").updateOne(
    { _id: new ObjectId(classId) },
    {
      $set: {
        classpassSyncEnabled: false,
        updatedAt: new Date(),
      },
    }
  );
}
