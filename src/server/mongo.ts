import { MongoClient, Db, Collection } from 'mongodb';
import fs from 'fs';
import path from 'path';
import {
  User,
  Business,
  MenuCategory,
  MenuItem,
  Order,
  Reservation,
  RestaurantTable,
  AppNotification,
} from '../types/index.ts';

export interface MongoStatus {
  connected: boolean;
  clusterHost?: string;
  databaseName?: string;
  maskedUri?: string;
  error?: string;
  collectionCounts?: {
    users: number;
    businesses: number;
    categories: number;
    menuItems: number;
    orders: number;
    reservations: number;
    tables: number;
    notifications: number;
  };
  lastConnected?: string;
}

const CONFIG_PATH = path.resolve(process.cwd(), '.data', 'mongo-config.json');

export class MongoAtlasManager {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;
  private lastError: string | null = null;
  private currentUri: string = '';
  private clusterHost: string = '';
  private dbName: string = 'foodsphere';

  constructor() {
    this.currentUri = this.resolveInitialUri();
  }

  private resolveInitialUri(): string {
    // 1. Check process.env.MONGODB_URI
    if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) {
      return process.env.MONGODB_URI.trim();
    }
    // 2. Check saved config in .data
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.uri) return parsed.uri;
      }
    } catch (e) {
      // ignore
    }
    return '';
  }

  public maskUri(uri: string): string {
    if (!uri) return 'Not Configured';
    try {
      // mask password in mongodb+srv://username:password@cluster...
      return uri.replace(/(mongodb(\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1••••••••$4');
    } catch {
      return 'mongodb+srv://••••••••';
    }
  }

  public async initialize(): Promise<boolean> {
    if (!this.currentUri) {
      this.lastError = 'MongoDB Atlas URI not configured yet.';
      return false;
    }
    return this.connect(this.currentUri);
  }

  public async connect(uri: string): Promise<boolean> {
    if (!uri || !uri.trim()) {
      this.lastError = 'MongoDB URI cannot be empty.';
      return false;
    }

    try {
      if (this.client) {
        await this.client.close().catch(() => {});
        this.client = null;
        this.db = null;
        this.isConnected = false;
      }

      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });

      await client.connect();

      // Extract DB name or default to 'foodsphere'
      const parsedUrl = new URL(uri.replace('mongodb+srv://', 'http://').replace('mongodb://', 'http://'));
      const extractedDb = parsedUrl.pathname.replace('/', '') || 'foodsphere';

      this.client = client;
      this.db = client.db(extractedDb);
      this.dbName = extractedDb;
      this.currentUri = uri;
      this.clusterHost = parsedUrl.host || 'MongoDB Atlas Cluster';
      this.isConnected = true;
      this.lastError = null;

      // Persist working URI to .data/mongo-config.json
      try {
        const dir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify({ uri }, null, 2), 'utf-8');
      } catch (err) {
        // ignore
      }

      console.log(`[MongoDB Atlas] Successfully connected to database: "${this.dbName}" on ${this.clusterHost}`);

      // Ensure indexes
      await this.ensureIndexes();

      return true;
    } catch (err: any) {
      this.isConnected = false;
      this.lastError = err.message || 'Failed to connect to MongoDB Atlas cluster';
      console.warn(`[MongoDB Atlas] Connection attempt failed: ${this.lastError}`);
      return false;
    }
  }

  public async disconnect() {
    if (this.client) {
      await this.client.close().catch(() => {});
      this.client = null;
      this.db = null;
      this.isConnected = false;
    }
  }

  public getDb(): Db | null {
    return this.isConnected ? this.db : null;
  }

  public getStatus(): MongoStatus {
    return {
      connected: this.isConnected,
      clusterHost: this.clusterHost,
      databaseName: this.dbName,
      maskedUri: this.maskUri(this.currentUri),
      error: this.lastError || undefined,
      lastConnected: this.isConnected ? new Date().toISOString() : undefined,
    };
  }

  public async getDetailedStatus(): Promise<MongoStatus> {
    const base = this.getStatus();
    if (!this.isConnected || !this.db) {
      return base;
    }

    try {
      const [
        usersCount,
        bizCount,
        catCount,
        itemsCount,
        ordersCount,
        resCount,
        tablesCount,
        notifsCount,
      ] = await Promise.all([
        this.db.collection('users').countDocuments(),
        this.db.collection('businesses').countDocuments(),
        this.db.collection('categories').countDocuments(),
        this.db.collection('menuItems').countDocuments(),
        this.db.collection('orders').countDocuments(),
        this.db.collection('reservations').countDocuments(),
        this.db.collection('tables').countDocuments(),
        this.db.collection('notifications').countDocuments(),
      ]);

      return {
        ...base,
        collectionCounts: {
          users: usersCount,
          businesses: bizCount,
          categories: catCount,
          menuItems: itemsCount,
          orders: ordersCount,
          reservations: resCount,
          tables: tablesCount,
          notifications: notifsCount,
        },
      };
    } catch (e: any) {
      return {
        ...base,
        error: `Connected, but failed to fetch collection counts: ${e.message}`,
      };
    }
  }

  private async ensureIndexes() {
    if (!this.db) return;
    try {
      // 1. users: unique email, index on tenantId and role
      await this.db.collection('users').createIndex({ email: 1 }, { unique: true });
      await this.db.collection('users').createIndex({ tenantId: 1 });
      await this.db.collection('users').createIndex({ role: 1 });

      // 2. businesses: unique slug, index on ownerId
      await this.db.collection('businesses').createIndex({ slug: 1 }, { unique: true });
      await this.db.collection('businesses').createIndex({ ownerId: 1 });

      // 3. categories: tenantId + displayOrder
      await this.db.collection('categories').createIndex({ tenantId: 1, displayOrder: 1 });

      // 4. menuItems: tenantId + categoryId
      await this.db.collection('menuItems').createIndex({ tenantId: 1, categoryId: 1 });

      // 5. orders: tenantId + createdAt, customerId
      await this.db.collection('orders').createIndex({ id: 1 }, { unique: true });
      await this.db.collection('orders').createIndex({ tenantId: 1, createdAt: -1 });
      await this.db.collection('orders').createIndex({ customerId: 1 });

      // 6. reservations: tenantId + date
      await this.db.collection('reservations').createIndex({ tenantId: 1, date: 1 });
      await this.db.collection('reservations').createIndex({ customerId: 1 });

      // 7. tables: tenantId + tableNumber
      await this.db.collection('tables').createIndex({ tenantId: 1, tableNumber: 1 });

      // 8. notifications: userId + tenantId
      await this.db.collection('notifications').createIndex({ userId: 1 });
      await this.db.collection('notifications').createIndex({ tenantId: 1 });

      console.log('[MongoDB Atlas] Indexes created and verified.');
    } catch (err) {
      console.warn('[MongoDB Atlas] Note while creating indexes:', err);
    }
  }

  // Seed MongoDB Atlas with initial data if collections are empty
  public async seedAtlasIfEmpty(seedData: {
    users: (User & { passwordHash: string })[];
    businesses: Business[];
    categories: MenuCategory[];
    menuItems: MenuItem[];
    tables: RestaurantTable[];
    orders: Order[];
    reservations: Reservation[];
    notifications: AppNotification[];
  }) {
    if (!this.db) return false;

    try {
      const userCount = await this.db.collection('users').countDocuments();
      if (userCount === 0) {
        console.log('[MongoDB Atlas] Database collections empty. Seeding with multi-tenant demo datasets...');
        if (seedData.users.length) await this.db.collection('users').insertMany(seedData.users as any);
        if (seedData.businesses.length) await this.db.collection('businesses').insertMany(seedData.businesses as any);
        if (seedData.categories.length) await this.db.collection('categories').insertMany(seedData.categories as any);
        if (seedData.menuItems.length) await this.db.collection('menuItems').insertMany(seedData.menuItems as any);
        if (seedData.tables.length) await this.db.collection('tables').insertMany(seedData.tables as any);
        if (seedData.orders.length) await this.db.collection('orders').insertMany(seedData.orders as any);
        if (seedData.reservations.length) await this.db.collection('reservations').insertMany(seedData.reservations as any);
        if (seedData.notifications.length) await this.db.collection('notifications').insertMany(seedData.notifications as any);
        console.log('[MongoDB Atlas] Seeding complete in Atlas cluster!');
      }
      return true;
    } catch (err) {
      console.error('[MongoDB Atlas] Error during seeding:', err);
      return false;
    }
  }
}

export const mongoManager = new MongoAtlasManager();
