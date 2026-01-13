// Credit Manager - SRP: Only handles credit operations
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import type { ICreditManager } from "../interfaces";
import type { Client } from "@/lib/db/schemas";

export class CreditManager implements ICreditManager {
  async hasCredits(clientId: string): Promise<boolean> {
    const db = await getDatabase();
    const client = await db.collection<Client>("clients").findOne({
      _id: new ObjectId(clientId),
    });

    if (!client) return false;

    return (
      client.plan.remainingClasses > 0 &&
      new Date(client.plan.endDate) >= new Date()
    );
  }

  async deductCredit(clientId: string): Promise<boolean> {
    const db = await getDatabase();

    const result = await db.collection<Client>("clients").updateOne(
      {
        _id: new ObjectId(clientId),
        "plan.remainingClasses": { $gt: 0 },
      },
      {
        $inc: {
          "plan.usedClasses": 1,
          "plan.remainingClasses": -1,
        },
        $set: { updatedAt: new Date() },
      }
    );

    return result.modifiedCount > 0;
  }

  async refundCredit(clientId: string): Promise<boolean> {
    const db = await getDatabase();

    const result = await db.collection<Client>("clients").updateOne(
      { _id: new ObjectId(clientId) },
      {
        $inc: {
          "plan.usedClasses": -1,
          "plan.remainingClasses": 1,
        },
        $set: { updatedAt: new Date() },
      }
    );

    return result.modifiedCount > 0;
  }

  async getClientCredits(clientId: string): Promise<{
    remaining: number;
    used: number;
    expiresAt: Date;
  } | null> {
    const db = await getDatabase();
    const client = await db.collection<Client>("clients").findOne({
      _id: new ObjectId(clientId),
    });

    if (!client) return null;

    return {
      remaining: client.plan.remainingClasses,
      used: client.plan.usedClasses,
      expiresAt: new Date(client.plan.endDate),
    };
  }
}

// Factory function
export function createCreditManager(): ICreditManager {
  return new CreditManager();
}
