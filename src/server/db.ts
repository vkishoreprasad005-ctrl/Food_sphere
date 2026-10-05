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
  BusinessAnalytics,
  PlatformStats,
  OrderStatus,
} from '../types/index.ts';
import {
  SEED_USERS,
  SEED_BUSINESSES,
  SEED_CATEGORIES,
  SEED_MENU_ITEMS,
  SEED_TABLES,
  SEED_ORDERS,
  SEED_RESERVATIONS,
  SEED_NOTIFICATIONS,
} from './seedData.ts';

export interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  businesses: Business[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  tables: RestaurantTable[];
  orders: Order[];
  reservations: Reservation[];
  notifications: AppNotification[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'foodsphere-db.json');

class DatabaseManager {
  private data: DatabaseSchema;
  private listeners: Set<(event: { type: string; payload: any; tenantId?: string | null }) => void> = new Set();

  constructor() {
    this.data = this.loadOrSeed();
  }

  private loadOrSeed(): DatabaseSchema {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseSchema;
        if (parsed.users && parsed.businesses && parsed.categories && parsed.menuItems) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to load existing database file, initializing with fresh seed data.', err);
    }

    const initial: DatabaseSchema = {
      users: [...SEED_USERS],
      businesses: [...SEED_BUSINESSES],
      categories: [...SEED_CATEGORIES],
      menuItems: [...SEED_MENU_ITEMS],
      tables: [...SEED_TABLES],
      orders: [...SEED_ORDERS],
      reservations: [...SEED_RESERVATIONS],
      notifications: [...SEED_NOTIFICATIONS],
    };

    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave: DatabaseSchema = this.data) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Notice: Could not write database to disk, keeping in memory', err);
    }
  }

  public resetDatabase() {
    this.data = {
      users: [...SEED_USERS],
      businesses: [...SEED_BUSINESSES],
      categories: [...SEED_CATEGORIES],
      menuItems: [...SEED_MENU_ITEMS],
      tables: [...SEED_TABLES],
      orders: [...SEED_ORDERS],
      reservations: [...SEED_RESERVATIONS],
      notifications: [...SEED_NOTIFICATIONS],
    };
    this.saveData();
    this.broadcast({ type: 'DATABASE_RESET', payload: null });
    return this.data;
  }

  // --- Real-time listener registration ---
  public subscribe(cb: (event: { type: string; payload: any; tenantId?: string | null }) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public broadcast(event: { type: string; payload: any; tenantId?: string | null }) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (e) {
        console.error('SSE listener error:', e);
      }
    }
  }

  // --- Users ---
  public findUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  public getAllUsers() {
    return this.data.users.map(({ passwordHash, ...u }) => u);
  }

  public createUser(user: User & { passwordHash: string }) {
    this.data.users.push(user);
    this.saveData();
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  public updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveData();
    const { passwordHash, ...safeUser } = this.data.users[idx];
    return safeUser;
  }

  // --- Businesses (Tenants) ---
  public getAllBusinesses(onlyActive = true) {
    if (onlyActive) {
      return this.data.businesses.filter(b => b.status === 'active');
    }
    return [...this.data.businesses];
  }

  public getBusinessById(id: string) {
    return this.data.businesses.find(b => b.id === id);
  }

  public getBusinessBySlug(slug: string) {
    return this.data.businesses.find(b => b.slug.toLowerCase() === slug.toLowerCase());
  }

  public createBusiness(biz: Business) {
    this.data.businesses.push(biz);
    this.saveData();
    this.broadcast({ type: 'BUSINESS_CREATED', payload: biz });
    return biz;
  }

  public updateBusiness(id: string, updates: Partial<Business>) {
    const idx = this.data.businesses.findIndex(b => b.id === id);
    if (idx === -1) return null;
    this.data.businesses[idx] = { ...this.data.businesses[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveData();
    this.broadcast({ type: 'BUSINESS_UPDATED', payload: this.data.businesses[idx], tenantId: id });
    return this.data.businesses[idx];
  }

  // --- Menu Categories (Strict Tenant Isolation) ---
  public getCategoriesByTenant(tenantId: string) {
    return this.data.categories
      .filter(c => c.tenantId === tenantId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public createCategory(cat: MenuCategory) {
    this.data.categories.push(cat);
    this.saveData();
    return cat;
  }

  public updateCategory(id: string, tenantId: string, updates: Partial<MenuCategory>) {
    const idx = this.data.categories.findIndex(c => c.id === id && c.tenantId === tenantId);
    if (idx === -1) return null;
    this.data.categories[idx] = { ...this.data.categories[idx], ...updates };
    this.saveData();
    return this.data.categories[idx];
  }

  public deleteCategory(id: string, tenantId: string) {
    const initialLen = this.data.categories.length;
    this.data.categories = this.data.categories.filter(c => !(c.id === id && c.tenantId === tenantId));
    // Also remove items belonging to this category under this tenant
    this.data.menuItems = this.data.menuItems.filter(item => !(item.categoryId === id && item.tenantId === tenantId));
    this.saveData();
    return this.data.categories.length < initialLen;
  }

  // --- Menu Items (Strict Tenant Isolation) ---
  public getMenuItemsByTenant(tenantId: string, onlyAvailable = false) {
    return this.data.menuItems.filter(i => {
      if (i.tenantId !== tenantId) return false;
      if (onlyAvailable && !i.available) return false;
      return true;
    });
  }

  public getMenuItemById(id: string, tenantId?: string) {
    return this.data.menuItems.find(i => i.id === id && (!tenantId || i.tenantId === tenantId));
  }

  public createMenuItem(item: MenuItem) {
    this.data.menuItems.push(item);
    this.saveData();
    return item;
  }

  public updateMenuItem(id: string, tenantId: string, updates: Partial<MenuItem>) {
    const idx = this.data.menuItems.findIndex(i => i.id === id && i.tenantId === tenantId);
    if (idx === -1) return null;
    this.data.menuItems[idx] = { ...this.data.menuItems[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveData();
    return this.data.menuItems[idx];
  }

  public deleteMenuItem(id: string, tenantId: string) {
    const initialLen = this.data.menuItems.length;
    this.data.menuItems = this.data.menuItems.filter(i => !(i.id === id && i.tenantId === tenantId));
    this.saveData();
    return this.data.menuItems.length < initialLen;
  }

  // --- Tables (Strict Tenant Isolation) ---
  public getTablesByTenant(tenantId: string) {
    return this.data.tables.filter(t => t.tenantId === tenantId);
  }

  public createTable(table: RestaurantTable) {
    this.data.tables.push(table);
    this.saveData();
    return table;
  }

  public updateTable(id: string, tenantId: string, updates: Partial<RestaurantTable>) {
    const idx = this.data.tables.findIndex(t => t.id === id && t.tenantId === tenantId);
    if (idx === -1) return null;
    this.data.tables[idx] = { ...this.data.tables[idx], ...updates };
    this.saveData();
    return this.data.tables[idx];
  }

  public deleteTable(id: string, tenantId: string) {
    const initialLen = this.data.tables.length;
    this.data.tables = this.data.tables.filter(t => !(t.id === id && t.tenantId === tenantId));
    this.saveData();
    return this.data.tables.length < initialLen;
  }

  // --- Orders (Strict Tenant Isolation for business, or customer ID for customer) ---
  public getOrdersByTenant(tenantId: string) {
    return this.data.orders
      .filter(o => o.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrdersByCustomer(customerId: string) {
    return this.data.orders
      .filter(o => o.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderById(id: string, tenantId?: string, customerId?: string) {
    return this.data.orders.find(o => {
      if (o.id !== id) return false;
      if (tenantId && o.tenantId !== tenantId) return false;
      if (customerId && o.customerId !== customerId) return false;
      return true;
    });
  }

  public createOrder(order: Order) {
    this.data.orders.unshift(order);
    // Auto-create notification for the business
    const notif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId: order.tenantId,
      role: 'business_owner',
      title: 'New Order Received',
      message: `Order #${order.id} for $${order.total.toFixed(2)} placed by ${order.customerName}`,
      type: 'order',
      read: false,
      link: '/business/orders',
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);
    this.saveData();

    // Broadcast live event
    this.broadcast({ type: 'ORDER_CREATED', payload: order, tenantId: order.tenantId });
    return order;
  }

  public updateOrderStatus(id: string, tenantId: string, status: OrderStatus) {
    const idx = this.data.orders.findIndex(o => o.id === id && o.tenantId === tenantId);
    if (idx === -1) return null;
    this.data.orders[idx].orderStatus = status;
    this.data.orders[idx].updatedAt = new Date().toISOString();

    // Notify customer
    const order = this.data.orders[idx];
    if (order.customerId) {
      const notif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tenantId: null,
        userId: order.customerId,
        role: 'customer',
        title: `Order #${order.id} Status: ${status}`,
        message: `Your order status changed to ${status}.`,
        type: 'order',
        read: false,
        link: `/customer/orders/${order.id}`,
        createdAt: new Date().toISOString(),
      };
      this.data.notifications.unshift(notif);
    }

    this.saveData();
    this.broadcast({ type: 'ORDER_UPDATED', payload: order, tenantId });
    return order;
  }

  // --- Reservations (Strict Tenant Isolation) ---
  public getReservationsByTenant(tenantId: string) {
    return this.data.reservations
      .filter(r => r.tenantId === tenantId)
      .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
  }

  public getReservationsByCustomer(customerId: string) {
    return this.data.reservations
      .filter(r => r.customerId === customerId)
      .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
  }

  public createReservation(res: Reservation) {
    this.data.reservations.unshift(res);
    // Notification for business
    const notif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId: res.tenantId,
      role: 'business_owner',
      title: 'New Reservation Request',
      message: `${res.customerName} requested a table for ${res.partySize} on ${res.date} at ${res.time}`,
      type: 'reservation',
      read: false,
      link: '/business/reservations',
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);
    this.saveData();

    this.broadcast({ type: 'RESERVATION_CREATED', payload: res, tenantId: res.tenantId });
    return res;
  }

  public updateReservationStatus(id: string, tenantId: string, status: Reservation['status'], tableId?: string, tableNumber?: string | number) {
    const idx = this.data.reservations.findIndex(r => r.id === id && r.tenantId === tenantId);
    if (idx === -1) return null;
    this.data.reservations[idx].status = status;
    if (tableId) this.data.reservations[idx].tableId = tableId;
    if (tableNumber) this.data.reservations[idx].tableNumber = tableNumber;
    this.data.reservations[idx].updatedAt = new Date().toISOString();

    const reservation = this.data.reservations[idx];
    if (reservation.customerId) {
      const notif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tenantId: null,
        userId: reservation.customerId,
        role: 'customer',
        title: `Reservation ${status}`,
        message: `Your reservation for ${reservation.date} at ${reservation.time} is now ${status}.`,
        type: 'reservation',
        read: false,
        link: '/customer/reservations',
        createdAt: new Date().toISOString(),
      };
      this.data.notifications.unshift(notif);
    }

    this.saveData();
    this.broadcast({ type: 'RESERVATION_UPDATED', payload: reservation, tenantId });
    return reservation;
  }

  // --- Customers per Tenant ---
  public getCustomersByTenant(tenantId: string) {
    const tenantOrders = this.data.orders.filter(o => o.tenantId === tenantId);
    const map = new Map<string, {
      id: string;
      name: string;
      email: string;
      phone: string;
      orderCount: number;
      totalSpent: number;
      lastOrderDate: string;
    }>();

    for (const order of tenantOrders) {
      const key = order.customerEmail.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: order.customerId || key,
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone || 'N/A',
          orderCount: 1,
          totalSpent: order.total,
          lastOrderDate: order.createdAt,
        });
      } else {
        const item = map.get(key)!;
        item.orderCount += 1;
        item.totalSpent += order.total;
        if (new Date(order.createdAt).getTime() > new Date(item.lastOrderDate).getTime()) {
          item.lastOrderDate = order.createdAt;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }

  // --- Notifications ---
  public getNotifications(userId?: string, tenantId?: string, role?: string) {
    return this.data.notifications.filter(n => {
      if (userId && n.userId === userId) return true;
      if (tenantId && n.tenantId === tenantId) return true;
      if (role && (n.role === role || n.role === 'all')) return true;
      return false;
    });
  }

  public markNotificationAsRead(id: string) {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveData();
      return true;
    }
    return false;
  }

  // --- Calculated Analytics (Strict Tenant Isolated) ---
  public getBusinessAnalytics(tenantId: string): BusinessAnalytics {
    const orders = this.data.orders.filter(o => o.tenantId === tenantId);
    const reservations = this.data.reservations.filter(r => r.tenantId === tenantId);
    const customers = this.getCustomersByTenant(tenantId);

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.orderStatus === 'COMPLETED').length;
    const pendingOrders = orders.filter(o => o.orderStatus === 'PENDING' || o.orderStatus === 'CONFIRMED' || o.orderStatus === 'PREPARING').length;
    const totalRevenue = orders
      .filter(o => o.paymentStatus === 'paid' && o.orderStatus !== 'CANCELLED')
      .reduce((acc, o) => acc + o.total, 0);

    const averageOrderValue = totalOrders > 0 ? totalRevenue / (orders.filter(o => o.paymentStatus === 'paid').length || 1) : 0;

    // Revenue by last 7 days
    const daysMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      daysMap.set(d, 0);
    }
    for (const o of orders) {
      const dateStr = o.createdAt.split('T')[0];
      if (daysMap.has(dateStr) && o.paymentStatus === 'paid') {
        daysMap.set(dateStr, (daysMap.get(dateStr) || 0) + o.total);
      }
    }
    const revenueByDay = Array.from(daysMap.entries()).map(([date, amount]) => ({
      date,
      amount: Math.round(amount * 100) / 100,
    }));

    // Status breakdown
    const statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    const orderStatusBreakdown = statuses.map(st => ({
      status: st,
      count: orders.filter(o => o.orderStatus === st).length,
    }));

    // Popular items
    const itemMap = new Map<string, { quantity: number; revenue: number }>();
    for (const o of orders) {
      for (const item of o.items) {
        const cur = itemMap.get(item.name) || { quantity: 0, revenue: 0 };
        cur.quantity += item.quantity;
        cur.revenue += item.price * item.quantity;
        itemMap.set(item.name, cur);
      }
    }
    const popularItems = Array.from(itemMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Order type distribution
    const orderTypeDistribution = [
      { type: 'dine_in' as const, count: orders.filter(o => o.orderType === 'dine_in').length },
      { type: 'takeaway' as const, count: orders.filter(o => o.orderType === 'takeaway').length },
      { type: 'delivery' as const, count: orders.filter(o => o.orderType === 'delivery').length },
    ];

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalCustomers: customers.length,
      totalReservations: reservations.length,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      revenueByDay,
      orderStatusBreakdown,
      popularItems,
      orderTypeDistribution,
    };
  }

  // --- Platform Admin Stats ---
  public getPlatformStats(): PlatformStats {
    const totalBusinesses = this.data.businesses.length;
    const activeBusinesses = this.data.businesses.filter(b => b.status === 'active').length;
    const totalUsers = this.data.users.length;
    const totalOrders = this.data.orders.length;
    const platformGMV = this.data.orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0);
    const totalReservations = this.data.reservations.length;

    return {
      totalBusinesses,
      activeBusinesses,
      totalUsers,
      totalOrders,
      platformGMV: Math.round(platformGMV * 100) / 100,
      totalReservations,
    };
  }
}

export const db = new DatabaseManager();
