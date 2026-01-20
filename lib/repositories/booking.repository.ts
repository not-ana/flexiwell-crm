import { ObjectId, Filter } from "mongodb";
import { BaseRepository, FindManyOptions, FindManyResult } from "./base.repository";
import { Booking } from "@/lib/db/schemas";

export interface BookingFilters {
  status?: string;
  clientId?: string;
  classId?: string;
  instructorId?: string;
  source?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isWellhubBooking?: boolean;
}

export class BookingRepository extends BaseRepository<Booking> {
  constructor() {
    super("bookings");
  }

  async findByClientId(clientId: string): Promise<Booking[]> {
    return this.findMany({ clientId });
  }

  async findByClassId(classId: string): Promise<Booking[]> {
    return this.findMany({ classId });
  }

  async findByInstructorId(instructorId: string): Promise<Booking[]> {
    return this.findMany({ instructorId });
  }

  async findUpcoming(clientId: string, limit = 10): Promise<Booking[]> {
    const collection = await this.getCollection();
    const now = new Date();

    return collection
      .find({
        clientId,
        status: { $in: ["pending", "confirmed"] },
        scheduledDate: { $gte: now },
      } as Filter<Booking>)
      .sort({ scheduledDate: 1, startTime: 1 })
      .limit(limit)
      .toArray();
  }

  async findPastBookings(clientId: string, limit = 20): Promise<Booking[]> {
    const collection = await this.getCollection();
    const now = new Date();

    return collection
      .find({
        clientId,
        $or: [{ status: "completed" }, { status: "no-show" }, { scheduledDate: { $lt: now } }],
      } as Filter<Booking>)
      .sort({ scheduledDate: -1, startTime: -1 })
      .limit(limit)
      .toArray();
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Booking[]> {
    return this.findMany({
      scheduledDate: {
        $gte: startDate,
        $lte: endDate,
      },
    });
  }

  async findWithFilters(
    filters: BookingFilters,
    options: Omit<FindManyOptions<Booking>, "filter"> = {}
  ): Promise<FindManyResult<Booking>> {
    const filter: Filter<Booking> = {};

    if (filters.status && filters.status !== "all") {
      filter.status = filters.status as Booking["status"];
    }

    if (filters.clientId) {
      filter.clientId = filters.clientId;
    }

    if (filters.classId) {
      filter.classId = filters.classId;
    }

    if (filters.instructorId) {
      filter.instructorId = filters.instructorId;
    }

    if (filters.source && filters.source !== "all") {
      filter.source = filters.source as Booking["source"];
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

    if (filters.isWellhubBooking !== undefined) {
      filter.isWellhubBooking = filters.isWellhubBooking;
    }

    return this.findManyPaginated({
      ...options,
      filter,
      sort: options.sort || { field: "scheduledDate", order: "desc" },
    });
  }

  async checkDuplicateBooking(clientId: string, classId: string): Promise<Booking | null> {
    return this.findOne({
      clientId,
      classId,
      status: { $in: ["pending", "confirmed"] },
    } as Filter<Booking>);
  }

  async findClientBookingsOnDate(clientId: string, date: Date): Promise<Booking[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.findMany({
      clientId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["pending", "confirmed"] },
    });
  }

  async updateStatus(
    id: string,
    status: Booking["status"],
    additionalData?: Partial<Booking>
  ): Promise<Booking | null> {
    return this.update(id, { status, ...additionalData });
  }

  async markAsCompleted(ids: string[]): Promise<number> {
    const collection = await this.getCollection();
    const objectIds = ids.map((id) => new ObjectId(id));

    const result = await collection.updateMany(
      { _id: { $in: objectIds } } as Filter<Booking>,
      {
        $set: {
          status: "completed",
          updatedAt: new Date(),
        },
      }
    );

    return result.modifiedCount;
  }

  async markAsNoShow(ids: string[]): Promise<number> {
    const collection = await this.getCollection();
    const objectIds = ids.map((id) => new ObjectId(id));

    const result = await collection.updateMany(
      { _id: { $in: objectIds } } as Filter<Booking>,
      {
        $set: {
          status: "no-show",
          updatedAt: new Date(),
        },
      }
    );

    return result.modifiedCount;
  }

  async getBookingStats(clientId: string): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    upcoming: number;
  }> {
    const collection = await this.getCollection();
    const now = new Date();

    const stats = await collection
      .aggregate([
        { $match: { clientId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const upcomingCount = await collection.countDocuments({
      clientId,
      status: { $in: ["pending", "confirmed"] },
      scheduledDate: { $gte: now },
    } as Filter<Booking>);

    const result = {
      total: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      upcoming: upcomingCount,
    };

    for (const stat of stats) {
      result.total += stat.count;
      if (stat._id === "completed") result.completed = stat.count;
      if (stat._id === "cancelled") result.cancelled = stat.count;
      if (stat._id === "no-show") result.noShow = stat.count;
    }

    return result;
  }
}

export const bookingRepository = new BookingRepository();
