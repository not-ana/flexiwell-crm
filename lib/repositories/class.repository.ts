import { ObjectId, Filter } from "mongodb";
import { BaseRepository, FindManyOptions, FindManyResult } from "./base.repository";
import { Class } from "@/lib/db/schemas";

export interface ClassFilters {
  status?: string;
  type?: string;
  instructorId?: string;
  roomId?: string;
  establishmentId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasAvailability?: boolean;
}

export class ClassRepository extends BaseRepository<Class> {
  constructor() {
    super("classes");
  }

  async findByInstructorId(instructorId: string): Promise<Class[]> {
    return this.findMany({ instructorId });
  }

  async findByRoomId(roomId: string): Promise<Class[]> {
    return this.findMany({ roomId });
  }

  async findByEstablishmentId(establishmentId: string): Promise<Class[]> {
    return this.findMany({ establishmentId });
  }

  async findUpcoming(limit = 10): Promise<Class[]> {
    const collection = await this.getCollection();
    const now = new Date();

    return collection
      .find({
        status: "scheduled",
        scheduledDate: { $gte: now },
      } as Filter<Class>)
      .sort({ scheduledDate: 1, startTime: 1 })
      .limit(limit)
      .toArray();
  }

  async findUpcomingByInstructor(instructorId: string, limit = 10): Promise<Class[]> {
    const collection = await this.getCollection();
    const now = new Date();

    return collection
      .find({
        instructorId,
        status: "scheduled",
        scheduledDate: { $gte: now },
      } as Filter<Class>)
      .sort({ scheduledDate: 1, startTime: 1 })
      .limit(limit)
      .toArray();
  }

  async findByDateRange(startDate: Date, endDate: Date, filters?: Partial<ClassFilters>): Promise<Class[]> {
    const collection = await this.getCollection();
    const filter: Filter<Class> = {
      scheduledDate: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (filters?.status) {
      filter.status = filters.status as Class["status"];
    }

    if (filters?.instructorId) {
      filter.instructorId = filters.instructorId;
    }

    if (filters?.type) {
      filter.type = filters.type as Class["type"];
    }

    return collection.find(filter).sort({ scheduledDate: 1, startTime: 1 }).toArray();
  }

  async findWithFilters(
    filters: ClassFilters,
    options: Omit<FindManyOptions<Class>, "filter"> = {}
  ): Promise<FindManyResult<Class>> {
    const filter: Filter<Class> = {};

    if (filters.status && filters.status !== "all") {
      filter.status = filters.status as Class["status"];
    }

    if (filters.type && filters.type !== "all") {
      filter.type = filters.type as Class["type"];
    }

    if (filters.instructorId) {
      filter.instructorId = filters.instructorId;
    }

    if (filters.roomId) {
      filter.roomId = filters.roomId;
    }

    if (filters.establishmentId) {
      filter.establishmentId = filters.establishmentId;
    }

    if (filters.dateFrom || filters.dateTo) {
      filter.scheduledDate = {};
      if (filters.dateFrom) {
        (filter.scheduledDate as Record<string, Date>).$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        (filter.scheduledDate as Record<string, Date>).$lte = filters.dateTo;
      }
    }

    if (filters.hasAvailability) {
      filter.$expr = {
        $lt: ["$currentEnrollment", "$maxCapacity"],
      };
    }

    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: "i" };
      filter.$or = [{ title: searchRegex }, { instructorName: searchRegex }, { description: searchRegex }];
    }

    return this.findManyPaginated({
      ...options,
      filter,
      sort: options.sort || { field: "scheduledDate", order: "asc" },
    });
  }

  async hasAvailability(classId: string): Promise<boolean> {
    const classDoc = await this.findById(classId);
    if (!classDoc) return false;
    return classDoc.currentEnrollment < classDoc.maxCapacity;
  }

  async getAvailableSpots(classId: string): Promise<number> {
    const classDoc = await this.findById(classId);
    if (!classDoc) return 0;
    return Math.max(0, classDoc.maxCapacity - classDoc.currentEnrollment);
  }

  async incrementEnrollment(classId: string): Promise<Class | null> {
    const collection = await this.getCollection();

    const result = await collection.findOneAndUpdate(
      {
        _id: new ObjectId(classId),
        $expr: { $lt: ["$currentEnrollment", "$maxCapacity"] },
      } as Filter<Class>,
      {
        $inc: { currentEnrollment: 1 },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" }
    );

    return result as Class | null;
  }

  async decrementEnrollment(classId: string): Promise<Class | null> {
    const collection = await this.getCollection();

    const result = await collection.findOneAndUpdate(
      {
        _id: new ObjectId(classId),
        currentEnrollment: { $gt: 0 },
      } as Filter<Class>,
      {
        $inc: { currentEnrollment: -1 },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" }
    );

    return result as Class | null;
  }

  async addToEnrolledClients(
    classId: string,
    client: { clientId: string; clientName: string }
  ): Promise<Class | null> {
    const collection = await this.getCollection();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(classId) } as Filter<Class>,
      {
        $push: {
          enrolledClients: {
            clientId: client.clientId,
            clientName: client.clientName,
            status: "confirmed",
            enrolledAt: new Date(),
          },
        } as unknown,
        $inc: { currentEnrollment: 1 },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" }
    );

    return result as Class | null;
  }

  async removeFromEnrolledClients(classId: string, clientId: string): Promise<Class | null> {
    const collection = await this.getCollection();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(classId) } as Filter<Class>,
      {
        $pull: { enrolledClients: { clientId } } as unknown,
        $inc: { currentEnrollment: -1 },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" }
    );

    return result as Class | null;
  }

  async addToWaitlist(
    classId: string,
    client: { clientId: string; clientName: string }
  ): Promise<Class | null> {
    const collection = await this.getCollection();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(classId) } as Filter<Class>,
      {
        $push: {
          waitlist: {
            clientId: client.clientId,
            clientName: client.clientName,
            addedAt: new Date(),
          },
        } as unknown,
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" }
    );

    return result as Class | null;
  }

  async removeFromWaitlist(classId: string, clientId: string): Promise<Class | null> {
    const collection = await this.getCollection();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(classId) } as Filter<Class>,
      {
        $pull: { waitlist: { clientId } } as unknown,
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" }
    );

    return result as Class | null;
  }

  async updateStatus(id: string, status: Class["status"]): Promise<Class | null> {
    return this.update(id, { status });
  }

  async cancelClass(id: string, reason?: string): Promise<Class | null> {
    return this.update(id, {
      status: "cancelled",
      notes: reason ? `Cancelled: ${reason}` : undefined,
    });
  }

  async completeClass(id: string): Promise<Class | null> {
    return this.update(id, { status: "completed" });
  }

  async findClassesForToday(instructorId?: string): Promise<Class[]> {
    const collection = await this.getCollection();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filter: Filter<Class> = {
      scheduledDate: { $gte: today, $lt: tomorrow },
      status: "scheduled",
    };

    if (instructorId) {
      filter.instructorId = instructorId;
    }

    return collection.find(filter).sort({ startTime: 1 }).toArray();
  }

  async getClassStats(): Promise<{
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    averageEnrollment: number;
  }> {
    const collection = await this.getCollection();

    const stats = await collection
      .aggregate([
        {
          $facet: {
            byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
            avgEnrollment: [
              { $match: { status: "scheduled" } },
              {
                $group: {
                  _id: null,
                  avg: { $avg: { $divide: ["$currentEnrollment", "$maxCapacity"] } },
                },
              },
            ],
          },
        },
      ])
      .toArray();

    const result = {
      total: 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      averageEnrollment: 0,
    };

    if (stats[0]) {
      for (const stat of stats[0].byStatus || []) {
        result.total += stat.count;
        if (stat._id === "scheduled") result.scheduled = stat.count;
        if (stat._id === "completed") result.completed = stat.count;
        if (stat._id === "cancelled") result.cancelled = stat.count;
      }
      result.averageEnrollment = Math.round((stats[0].avgEnrollment?.[0]?.avg || 0) * 100);
    }

    return result;
  }
}

export const classRepository = new ClassRepository();
