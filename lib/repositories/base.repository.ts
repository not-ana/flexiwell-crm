import { ObjectId, Filter, UpdateFilter, OptionalUnlessRequiredId, WithId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { IRepository } from "@/lib/services/interfaces";

export interface PaginationOptions {
  page?: number;
  limit?: number;
  skip?: number;
}

export interface SortOptions {
  field: string;
  order: "asc" | "desc";
}

export interface FindManyOptions<T> {
  filter?: Filter<T>;
  pagination?: PaginationOptions;
  sort?: SortOptions;
}

export interface FindManyResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class BaseRepository<T extends { _id?: ObjectId }> implements IRepository<T> {
  constructor(protected readonly collectionName: string) {}

  protected async getCollection() {
    const db = await getDatabase();
    return db.collection<T>(this.collectionName);
  }

  async findById(id: string): Promise<T | null> {
    const collection = await this.getCollection();
    return collection.findOne({ _id: new ObjectId(id) } as Filter<T>) as Promise<T | null>;
  }

  async findOne(filter: Filter<T>): Promise<T | null> {
    const collection = await this.getCollection();
    return collection.findOne(filter) as Promise<T | null>;
  }

  async findMany(filter: Record<string, unknown>): Promise<T[]> {
    const collection = await this.getCollection();
    return collection.find(filter as Filter<T>).toArray() as Promise<T[]>;
  }

  async findManyPaginated(options: FindManyOptions<T> = {}): Promise<FindManyResult<T>> {
    const collection = await this.getCollection();
    const { filter = {}, pagination = {}, sort } = options;

    const page = pagination.page || 1;
    const limit = pagination.limit || 50;
    const skip = pagination.skip ?? (page - 1) * limit;

    let cursor = collection.find(filter as Filter<T>);

    if (sort) {
      cursor = cursor.sort({ [sort.field]: sort.order === "asc" ? 1 : -1 });
    }

    const [items, total] = await Promise.all([
      cursor.skip(skip).limit(limit).toArray() as Promise<T[]>,
      collection.countDocuments(filter as Filter<T>),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: Partial<T>): Promise<T> {
    const collection = await this.getCollection();
    const now = new Date();
    const document = {
      ...data,
      createdAt: now,
      updatedAt: now,
    } as OptionalUnlessRequiredId<T>;

    const result = await collection.insertOne(document);
    return { ...document, _id: result.insertedId } as T;
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    const collection = await this.getCollection();
    const now = new Date();
    const documents = data.map((item) => ({
      ...item,
      createdAt: now,
      updatedAt: now,
    })) as OptionalUnlessRequiredId<T>[];

    const result = await collection.insertMany(documents);
    return documents.map((doc, index) => ({
      ...doc,
      _id: result.insertedIds[index],
    })) as T[];
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const collection = await this.getCollection();
    const { _id, createdAt, ...updateData } = data as Record<string, unknown>;

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) } as Filter<T>,
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      } as UpdateFilter<T>,
      { returnDocument: "after" }
    );

    return result as T | null;
  }

  async updateMany(filter: Filter<T>, data: Partial<T>): Promise<number> {
    const collection = await this.getCollection();
    const { _id, createdAt, ...updateData } = data as Record<string, unknown>;

    const result = await collection.updateMany(filter, {
      $set: {
        ...updateData,
        updatedAt: new Date(),
      },
    } as UpdateFilter<T>);

    return result.modifiedCount;
  }

  async delete(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) } as Filter<T>);
    return result.deletedCount === 1;
  }

  async deleteMany(filter: Filter<T>): Promise<number> {
    const collection = await this.getCollection();
    const result = await collection.deleteMany(filter);
    return result.deletedCount;
  }

  async count(filter: Filter<T> = {}): Promise<number> {
    const collection = await this.getCollection();
    return collection.countDocuments(filter);
  }

  async exists(filter: Filter<T>): Promise<boolean> {
    const collection = await this.getCollection();
    const count = await collection.countDocuments(filter, { limit: 1 });
    return count > 0;
  }

  async aggregate<R = T>(pipeline: object[]): Promise<R[]> {
    const collection = await this.getCollection();
    return collection.aggregate<R>(pipeline).toArray();
  }
}
