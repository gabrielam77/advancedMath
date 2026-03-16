/**
 * MongoDBService — thin fetch-based wrapper for MongoDB Atlas Data API v1.
 *
 * When REACT_APP_MONGODB_DATA_API_URL and REACT_APP_MONGODB_API_KEY are set,
 * all operations go to Atlas. If not configured, isAvailable() returns false
 * and every method throws so callers can fall back to localStorage.
 */

const BASE_URL = process.env.REACT_APP_MONGODB_DATA_API_URL ?? '';
const API_KEY  = process.env.REACT_APP_MONGODB_API_KEY ?? '';
const DATABASE = process.env.REACT_APP_MONGODB_DATABASE ?? 'mathTutor';
const DATA_SOURCE = process.env.REACT_APP_MONGODB_DATA_SOURCE ?? 'Cluster0';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MongoDoc = Record<string, any>;

interface FindOneResult<T>  { document: T | null }
interface FindResult<T>     { documents: T[] }
interface InsertOneResult   { insertedId: string }
interface UpdateResult      { matchedCount: number; modifiedCount: number }
interface DeleteResult      { deletedCount: number }

export class MongoDBService {
  // ─── Config check ────────────────────────────────────────────────────────

  static isAvailable(): boolean {
    return !!(BASE_URL && API_KEY);
  }

  // ─── Internal request helper ─────────────────────────────────────────────

  private static async request<T>(action: string, body: MongoDoc): Promise<T> {
    if (!this.isAvailable()) {
      throw new Error('MongoDB Atlas Data API is not configured. Fill in .env from .env.template.');
    }

    const res = await fetch(`${BASE_URL}/action/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY,
      },
      body: JSON.stringify({
        dataSource: DATA_SOURCE,
        database: DATABASE,
        ...body,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`MongoDB ${action} failed (${res.status}): ${text}`);
    }

    return res.json() as Promise<T>;
  }

  // ─── CRUD operations ─────────────────────────────────────────────────────

  static async findOne<T>(collection: string, filter: MongoDoc): Promise<T | null> {
    const result = await this.request<FindOneResult<T>>('findOne', { collection, filter });
    return result.document;
  }

  static async find<T>(
    collection: string,
    filter: MongoDoc = {},
    sort?: MongoDoc,
    limit?: number
  ): Promise<T[]> {
    const body: MongoDoc = { collection, filter };
    if (sort)  body.sort  = sort;
    if (limit) body.limit = limit;
    const result = await this.request<FindResult<T>>('find', body);
    return result.documents ?? [];
  }

  static async insertOne(collection: string, document: MongoDoc): Promise<string> {
    const result = await this.request<InsertOneResult>('insertOne', { collection, document });
    return result.insertedId;
  }

  /** Upsert by default — creates the document if the filter matches nothing. */
  static async updateOne(
    collection: string,
    filter: MongoDoc,
    update: MongoDoc,
    upsert = true
  ): Promise<void> {
    await this.request<UpdateResult>('updateOne', { collection, filter, update, upsert });
  }

  static async deleteOne(collection: string, filter: MongoDoc): Promise<void> {
    await this.request<DeleteResult>('deleteOne', { collection, filter });
  }

  static async deleteMany(collection: string, filter: MongoDoc): Promise<void> {
    await this.request<DeleteResult>('deleteMany', { collection, filter });
  }
}
