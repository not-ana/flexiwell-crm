// Activity Logger - SRP: Only handles activity logging
import { getDatabase } from "@/lib/db/mongodb";
import type { IActivityLogger, ActivityData } from "../interfaces";
import type { Activity } from "@/lib/db/schemas";

export class ActivityLogger implements IActivityLogger {
  async log(activity: ActivityData): Promise<void> {
    const db = await getDatabase();
    await db.collection<Activity>("activities").insertOne({
      ...activity,
      createdAt: new Date(),
    } as Activity);
  }
}

// Factory function
export function createActivityLogger(): IActivityLogger {
  return new ActivityLogger();
}
