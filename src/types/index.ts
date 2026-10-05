export type UserRole = 'platform_admin' | 'business_owner' | 'staff' | 'customer';

export type BusinessType = 'restaurant' | 'cafe' | 'bakery' | 'cloud_kitchen' | 'food_truck' | 'bistro' | 'other';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
  phone?: string;
  profileImage?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface Business {
  id: string;
  businessName: string;
  slug: string;
  businessType: BusinessType;
  description: string;
  logo: string;
  coverImage: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  currency: string;
  taxRate: number; // e.g. 0.08 for 8%
  deliveryFee: number;
  status: 'active' | 'suspended' | 'pending';
  ownerId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MenuCategory {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  preparationTime: number; // in minutes
  dietaryTags: string[]; // e.g. ['Vegetarian', 'Vegan', 'Gluten-Free', 'Spicy', 'Chef Special']
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  orderType: OrderType;
  tableNumber?: string | number;
  deliveryAddress?: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod: 'stripe' | 'cash' | 'mock_card';
  paymentId?: string;
  orderStatus: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Reservation {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  partySize: number;
  tableId?: string;
  tableNumber?: string | number;
  status: ReservationStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RestaurantTable {
  id: string;
  tenantId: string;
  tableNumber: string | number;
  capacity: number;
  location: 'indoor' | 'patio' | 'rooftop' | 'bar';
  status: TableStatus;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  tenantId: string;
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
  provider: 'stripe' | 'cash' | 'simulation';
  transactionId: string;
  status: 'succeeded' | 'pending' | 'failed';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  tenantId?: string | null;
  userId?: string;
  role?: UserRole | 'all';
  title: string;
  message: string;
  type: 'order' | 'reservation' | 'payment' | 'system';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface BusinessAnalytics {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalCustomers: number;
  totalReservations: number;
  averageOrderValue: number;
  revenueByDay: { date: string; amount: number }[];
  orderStatusBreakdown: { status: OrderStatus; count: number }[];
  popularItems: { name: string; quantity: number; revenue: number }[];
  orderTypeDistribution: { type: OrderType; count: number }[];
}

export interface PlatformStats {
  totalBusinesses: number;
  activeBusinesses: number;
  totalUsers: number;
  totalOrders: number;
  platformGMV: number;
  totalReservations: number;
}
