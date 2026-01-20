import { ObjectId, Filter } from "mongodb";
import { BaseRepository, FindManyOptions, FindManyResult } from "./base.repository";
import { Client } from "@/lib/db/schemas";

export interface ClientFilters {
  status?: string;
  planType?: string;
  search?: string;
  isWellhubMember?: boolean;
  hasGoogleCalendar?: boolean;
}

export class ClientRepository extends BaseRepository<Client> {
  constructor() {
    super("clients");
  }

  async findByEmail(email: string): Promise<Client | null> {
    return this.findOne({ email: email.toLowerCase() } as Filter<Client>);
  }

  async findByPhone(phone: string): Promise<Client | null> {
    const normalizedPhone = phone.replace(/\D/g, "");
    return this.findOne({ phone: { $regex: normalizedPhone } } as Filter<Client>);
  }

  async findByWellhubId(wellhubId: string): Promise<Client | null> {
    return this.findOne({ wellhubId } as Filter<Client>);
  }

  async findByGympassId(gympassId: string): Promise<Client | null> {
    return this.findOne({ wellhubGympassId: gympassId } as Filter<Client>);
  }

  async findActiveClients(): Promise<Client[]> {
    return this.findMany({ status: "active" });
  }

  async findWithFilters(
    filters: ClientFilters,
    options: Omit<FindManyOptions<Client>, "filter"> = {}
  ): Promise<FindManyResult<Client>> {
    const filter: Filter<Client> = {};

    if (filters.status && filters.status !== "all") {
      filter.status = filters.status as Client["status"];
    }

    if (filters.planType && filters.planType !== "all") {
      filter["plan.type"] = filters.planType;
    }

    if (filters.isWellhubMember !== undefined) {
      filter.isWellhubMember = filters.isWellhubMember;
    }

    if (filters.hasGoogleCalendar !== undefined) {
      if (filters.hasGoogleCalendar) {
        filter["integrations.googleCalendar.syncEnabled"] = true;
      } else {
        filter["integrations.googleCalendar"] = { $exists: false };
      }
    }

    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: "i" };
      filter.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    return this.findManyPaginated({
      ...options,
      filter,
      sort: options.sort || { field: "createdAt", order: "desc" },
    });
  }

  async findClientsWithExpiringPlans(daysUntilExpiry: number): Promise<Client[]> {
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(now.getDate() + daysUntilExpiry);

    return this.findMany({
      status: "active",
      "plan.endDate": {
        $gte: now,
        $lte: expiryDate,
      },
    });
  }

  async findClientsWithLowCredits(threshold = 2): Promise<Client[]> {
    return this.findMany({
      status: "active",
      "plan.remainingClasses": { $lte: threshold, $gt: 0 },
    });
  }

  async deductCredit(clientId: string): Promise<boolean> {
    const collection = await this.getCollection();

    const result = await collection.findOneAndUpdate(
      {
        _id: new ObjectId(clientId),
        "plan.remainingClasses": { $gt: 0 },
      } as Filter<Client>,
      {
        $inc: {
          "plan.remainingClasses": -1,
          "plan.usedClasses": 1,
        },
        $set: {
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return result !== null;
  }

  async refundCredit(clientId: string): Promise<boolean> {
    const collection = await this.getCollection();

    const result = await collection.findOneAndUpdate(
      {
        _id: new ObjectId(clientId),
        "plan.usedClasses": { $gt: 0 },
      } as Filter<Client>,
      {
        $inc: {
          "plan.remainingClasses": 1,
          "plan.usedClasses": -1,
        },
        $set: {
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return result !== null;
  }

  async hasCredits(clientId: string): Promise<boolean> {
    const client = await this.findById(clientId);
    if (!client) return false;
    return client.plan.remainingClasses > 0;
  }

  async isPlanExpired(clientId: string): Promise<boolean> {
    const client = await this.findById(clientId);
    if (!client) return true;
    return new Date(client.plan.endDate) < new Date();
  }

  async updatePlan(
    clientId: string,
    plan: Partial<Client["plan"]>
  ): Promise<Client | null> {
    const collection = await this.getCollection();

    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    for (const [key, value] of Object.entries(plan)) {
      updateFields[`plan.${key}`] = value;
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(clientId) } as Filter<Client>,
      { $set: updateFields },
      { returnDocument: "after" }
    );

    return result as Client | null;
  }

  async updatePreferences(
    clientId: string,
    preferences: Partial<Client["preferences"]>
  ): Promise<Client | null> {
    const collection = await this.getCollection();

    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    for (const [key, value] of Object.entries(preferences)) {
      updateFields[`preferences.${key}`] = value;
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(clientId) } as Filter<Client>,
      { $set: updateFields },
      { returnDocument: "after" }
    );

    return result as Client | null;
  }

  async updateGoogleCalendarIntegration(
    clientId: string,
    integration: Client["integrations"]
  ): Promise<Client | null> {
    return this.update(clientId, { integrations: integration });
  }

  async getClientStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    pending: number;
    wellhubMembers: number;
  }> {
    const collection = await this.getCollection();

    const stats = await collection
      .aggregate([
        {
          $facet: {
            byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
            wellhub: [
              { $match: { isWellhubMember: true } },
              { $count: "count" },
            ],
          },
        },
      ])
      .toArray();

    const result = {
      total: 0,
      active: 0,
      inactive: 0,
      pending: 0,
      wellhubMembers: 0,
    };

    if (stats[0]) {
      for (const stat of stats[0].byStatus || []) {
        result.total += stat.count;
        if (stat._id === "active") result.active = stat.count;
        if (stat._id === "inactive") result.inactive = stat.count;
        if (stat._id === "pending") result.pending = stat.count;
      }
      result.wellhubMembers = stats[0].wellhub?.[0]?.count || 0;
    }

    return result;
  }
}

export const clientRepository = new ClientRepository();
