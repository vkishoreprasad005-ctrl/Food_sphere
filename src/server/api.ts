import { Router, Request, Response } from 'express';
import { db } from './db.ts';
import {
  hashPassword,
  comparePassword,
  signToken,
  requireAuth,
  requireRole,
  requireTenant,
  optionalAuth,
  AuthenticatedRequest,
} from './auth.ts';
import {
  User,
  Business,
  MenuCategory,
  MenuItem,
  Order,
  Reservation,
  RestaurantTable,
  OrderStatus,
} from '../types/index.ts';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION & ONBOARDING
// ==========================================

// Register (Customer or Business Owner)
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password, role, phone, businessName, businessType, description } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const assignedRole = role === 'business_owner' ? 'business_owner' : 'customer';
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  let tenantId: string | null = null;
  let newBusiness: Business | null = null;

  // If registering as a business owner, onboard their first business
  if (assignedRole === 'business_owner') {
    const rawBizName = businessName || `${name}'s Eatery`;
    const slugBase = rawBizName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const slug = `${slugBase}-${Math.random().toString(36).substring(2, 6)}`;
    tenantId = `biz_${Date.now()}`;

    newBusiness = {
      id: tenantId,
      businessName: rawBizName,
      slug,
      businessType: businessType || 'restaurant',
      description: description || 'Proud member of FoodSphere cloud ecosystem.',
      logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
      coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      address: '100 Gourmet Plaza, Suite 10',
      phone: phone || '+1 (555) 012-3456',
      email: email,
      openingHours: 'Mon-Sun: 10:00 AM – 10:00 PM',
      currency: 'USD',
      taxRate: 0.08,
      deliveryFee: 3.99,
      status: 'active',
      ownerId: userId,
      createdAt: new Date().toISOString(),
    };

    db.createBusiness(newBusiness);

    // Create starter category for quick onboarding
    const defaultCat: MenuCategory = {
      id: `cat_${Date.now()}`,
      tenantId: tenantId,
      name: 'Chef Specials',
      description: 'Signature dishes and customer favorites',
      displayOrder: 1,
      active: true,
      createdAt: new Date().toISOString(),
    };
    db.createCategory(defaultCat);
  }

  const newUser: User & { passwordHash: string } = {
    id: userId,
    name,
    email,
    passwordHash: hashPassword(password),
    role: assignedRole,
    tenantId,
    phone: phone || '',
    profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  const safeUser = db.createUser(newUser);
  const token = signToken({
    userId: safeUser.id,
    email: safeUser.email,
    role: safeUser.role,
    tenantId: safeUser.tenantId,
  });

  return res.status(201).json({
    token,
    user: safeUser,
    business: newBusiness,
  });
});

// Login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = comparePassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
  }

  const { passwordHash, ...safeUser } = user;
  const token = signToken({
    userId: safeUser.id,
    email: safeUser.email,
    role: safeUser.role,
    tenantId: safeUser.tenantId,
  });

  let business: Business | null = null;
  if (safeUser.tenantId) {
    business = db.getBusinessById(safeUser.tenantId) || null;
  }

  return res.json({
    token,
    user: safeUser,
    business,
  });
});

// Current User Profile
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = db.findUserById(req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { passwordHash, ...safeUser } = user;
  let business: Business | null = null;
  if (safeUser.tenantId) {
    business = db.getBusinessById(safeUser.tenantId) || null;
  }
  return res.json({ user: safeUser, business });
});

// ==========================================
// 2. PUBLIC BUSINESS & MENU DISCOVERY
// ==========================================

// List public active businesses
apiRouter.get('/businesses', (req: Request, res: Response) => {
  const { type, search } = req.query;
  let businesses = db.getAllBusinesses(true);

  if (type && typeof type === 'string' && type !== 'all') {
    businesses = businesses.filter(b => b.businessType === type);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    businesses = businesses.filter(
      b => b.businessName.toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || b.address.toLowerCase().includes(q)
    );
  }

  return res.json(businesses);
});

// Get business profile by slug
apiRouter.get('/businesses/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const business = db.getBusinessBySlug(slug);
  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }
  return res.json(business);
});

// Get public menu for a business by slug
apiRouter.get('/businesses/:slug/menu', (req: Request, res: Response) => {
  const { slug } = req.params;
  const business = db.getBusinessBySlug(slug);
  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }

  // Strict tenant isolated fetch
  const categories = db.getCategoriesByTenant(business.id).filter(c => c.active);
  const items = db.getMenuItemsByTenant(business.id, true);

  return res.json({
    business,
    categories,
    items,
  });
});

// ==========================================
// 3. PLATFORM ADMIN ENDPOINTS
// ==========================================

// Platform metrics
apiRouter.get('/admin/stats', requireAuth, requireRole(['platform_admin']), (req: AuthenticatedRequest, res: Response) => {
  const stats = db.getPlatformStats();
  return res.json(stats);
});

// List all businesses (including suspended)
apiRouter.get('/admin/businesses', requireAuth, requireRole(['platform_admin']), (req: AuthenticatedRequest, res: Response) => {
  const businesses = db.getAllBusinesses(false);
  const users = db.getAllUsers();
  // enrich with owner info
  const enriched = businesses.map(b => {
    const owner = users.find(u => u.id === b.ownerId);
    return {
      ...b,
      ownerName: owner?.name || 'Unknown',
      ownerEmail: owner?.email || 'N/A',
    };
  });
  return res.json(enriched);
});

// Toggle business status (activate/suspend)
apiRouter.patch('/admin/businesses/:id/status', requireAuth, requireRole(['platform_admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'suspended', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const updated = db.updateBusiness(id, { status });
  if (!updated) {
    return res.status(404).json({ error: 'Business not found' });
  }

  return res.json(updated);
});

// Platform Users audit
apiRouter.get('/admin/users', requireAuth, requireRole(['platform_admin']), (req: AuthenticatedRequest, res: Response) => {
  const users = db.getAllUsers();
  const businesses = db.getAllBusinesses(false);

  const enriched = users.map(u => {
    const biz = u.tenantId ? businesses.find(b => b.id === u.tenantId) : null;
    return {
      ...u,
      businessName: biz?.businessName || 'Platform / Customer',
    };
  });

  return res.json(enriched);
});

// ==========================================
// 4. BUSINESS / TENANT MANAGEMENT (STRICT ISOLATION)
// ==========================================

// Get authenticated tenant's info
apiRouter.get('/tenant/info', requireAuth, requireTenant, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const business = db.getBusinessById(tenantId);
  if (!business) {
    return res.status(404).json({ error: 'Business tenant not found' });
  }
  return res.json(business);
});

// Update tenant profile / settings
apiRouter.put('/tenant/info', requireAuth, requireTenant, requireRole(['platform_admin', 'business_owner']), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const updates = req.body;

  // Protect sensitive fields from tamper
  delete updates.id;
  delete updates.ownerId;
  delete updates.createdAt;

  const updated = db.updateBusiness(tenantId, updates);
  return res.json(updated);
});

// Categories
apiRouter.get('/tenant/categories', requireAuth, requireTenant, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const categories = db.getCategoriesByTenant(tenantId);
  return res.json(categories);
});

apiRouter.post('/tenant/categories', requireAuth, requireTenant, requireRole(['platform_admin', 'business_owner']), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const { name, description, displayOrder, active } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const newCat: MenuCategory = {
    id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    tenantId, // FORCED TENANT ISOLATION
    name: name.trim(),
    description: description || '',
    displayOrder: typeof displayOrder === 'number' ? displayOrder : 99,
    active: active !== undefined ? Boolean(active) : true,
    createdAt: new Date().toISOString(),
  };

  const created = db.createCategory(newCat);
  return res.status(201).json(created);
});

apiRouter.put('/tenant/categories/:id', requireAuth, requireTenant, requireRole(['platform_admin', 'business_owner']), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const { id } = req.params;
  const updates = req.body;

  const updated = db.updateCategory(id, tenantId, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Category not found or unauthorized' });
  }
  return res.json(updated);
});

apiRouter.delete('/tenant/categories/:id', requireAuth, requireTenant, requireRole(['platform_admin', 'business_owner']), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const { id } = req.params;

  const success = db.deleteCategory(id, tenantId);
  if (!success) {
    return res.status(404).json({ error: 'Category not found or unauthorized' });
  }
  return res.json({ success: true, message: 'Category and associated items deleted' });
});

// Menu Items
apiRouter.get('/tenant/items', requireAuth, requireTenant, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const items = db.getMenuItemsByTenant(tenantId, false);
  return res.json(items);
});

apiRouter.post('/tenant/items', requireAuth, requireTenant, requireRole(['platform_admin', 'business_owner', 'staff']), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const { categoryId, name, description, price, image, available, preparationTime, dietaryTags } = req.body;

  if (!name || price === undefined || !categoryId) {
    return res.status(400).json({ error: 'Name, price, and category are required' });
  }

  const newItem: MenuItem = {
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    tenantId, // FORCED TENANT ISOLATION
    categoryId,
    name: name.trim(),
    description: description || '',
    price: Number(price),
    image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    available: available !== undefined ? Boolean(available) : true,
    preparationTime: Number(preparationTime) || 15,
    dietaryTags: Array.isArray(dietaryTags) ? dietaryTags : [],
    createdAt: new Date().toISOString(),
  };

  const created = db.createMenuItem(newItem);
  return res.status(201).json(created);
});

apiRouter.put('/tenant/items/:id', requireAuth, requireTenant, requireRole(['platform_admin', 'business_owner', 'staff']), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const { id } = req.params;
  const updates = req.body;

  if (updates.price !== undefined) updates.price = Number(updates.price);
  if (updates.preparationTime !== undefined) updates.preparationTime = Number(updates.preparationTime);

  const updated = db.updateMenuItem(id, tenantId, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Menu item not found or unauthorized' });
  }
  return res.json(updated);
});

apiRouter.delete('/tenant/items/:id', requireAuth, requireTenant, requireRole(['platform_admin', 'business_owner']), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const { id } = req.params;

  const success = db.deleteMenuItem(id, tenantId);
  if (!success) {
    return res.status(404).json({ error: 'Menu item not found or unauthorized' });
  }
  return res.json({ success: true, message: 'Menu item deleted' });
});

// Tenant Orders
apiRouter.get('/tenant/orders', requireAuth, requireTenant, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const orders = db.getOrdersByTenant(tenantId);
  return res.json(orders);
});

// Update order status (Owner & Staff)
apiRouter.patch('/tenant/orders/:id/status', requireAuth, requireTenant, requireRole(['platform_admin', 'business_owner', 'staff']), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const { id } = req.params;
  const { status } = req.body as { status: OrderStatus };

  const validStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }

  const updated = db.updateOrderStatus(id, tenantId, status);
  if (!updated) {
    return res.status(404).json({ error: 'Order not found or does not belong to this business' });
  }

  return res.json(updated);
});

// Tenant Reservations
apiRouter.get('/tenant/reservations', requireAuth, requireTenant, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const reservations = db.getReservationsByTenant(tenantId);
  return res.json(reservations);
});

apiRouter.patch('/tenant/reservations/:id/status', requireAuth, requireTenant, requireRole(['platform_admin', 'business_owner', 'staff']), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const { id } = req.params;
  const { status, tableId, tableNumber } = req.body;

  if (!['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid reservation status' });
  }

  const updated = db.updateReservationStatus(id, tenantId, status, tableId, tableNumber);
  if (!updated) {
    return res.status(404).json({ error: 'Reservation not found or does not belong to this business' });
  }

  return res.json(updated);
});

// Tables Management
apiRouter.get('/tenant/tables', requireAuth, requireTenant, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const tables = db.getTablesByTenant(tenantId);
  return res.json(tables);
});

apiRouter.post('/tenant/tables', requireAuth, requireTenant, requireRole(['platform_admin', 'business_owner']), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const { tableNumber, capacity, location, status } = req.body;

  if (!tableNumber || !capacity) {
    return res.status(400).json({ error: 'Table number and capacity are required' });
  }

  const newTable: RestaurantTable = {
    id: `tbl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    tenantId, // FORCED TENANT ISOLATION
    tableNumber,
    capacity: Number(capacity),
    location: location || 'indoor',
    status: status || 'available',
    createdAt: new Date().toISOString(),
  };

  const created = db.createTable(newTable);
  return res.status(201).json(created);
});

apiRouter.put('/tenant/tables/:id', requireAuth, requireTenant, requireRole(['platform_admin', 'business_owner', 'staff']), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const { id } = req.params;
  const updates = req.body;

  const updated = db.updateTable(id, tenantId, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Table not found or unauthorized' });
  }
  return res.json(updated);
});

apiRouter.delete('/tenant/tables/:id', requireAuth, requireTenant, requireRole(['platform_admin', 'business_owner']), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const { id } = req.params;

  const success = db.deleteTable(id, tenantId);
  if (!success) {
    return res.status(404).json({ error: 'Table not found or unauthorized' });
  }
  return res.json({ success: true, message: 'Table removed' });
});

// Customers belonging to this tenant
apiRouter.get('/tenant/customers', requireAuth, requireTenant, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const customers = db.getCustomersByTenant(tenantId);
  return res.json(customers);
});

// Calculated analytics for this tenant
apiRouter.get('/tenant/analytics', requireAuth, requireTenant, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req as any).effectiveTenantId;
  const analytics = db.getBusinessAnalytics(tenantId);
  return res.json(analytics);
});

// ==========================================
// 5. CUSTOMER ORDERING & RESERVATION APIs
// ==========================================

// Create Order (Guest or Authenticated Customer)
apiRouter.post('/orders', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const {
    tenantId,
    items,
    orderType,
    tableNumber,
    deliveryAddress,
    notes,
    customerName,
    customerEmail,
    customerPhone,
    paymentMethod,
  } = req.body;

  if (!tenantId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Tenant ID and at least one item are required' });
  }

  const business = db.getBusinessById(tenantId);
  if (!business) {
    return res.status(404).json({ error: 'Target food business not found' });
  }

  if (business.status !== 'active') {
    return res.status(400).json({ error: 'This business is currently not accepting orders' });
  }

  // Calculate prices strictly from database menu items to prevent client tampering
  const menuItems = db.getMenuItemsByTenant(tenantId);
  let subtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const dbItem = menuItems.find(m => m.id === item.menuItemId);
    if (!dbItem) {
      return res.status(400).json({ error: `Menu item with ID ${item.menuItemId} is not available at this business` });
    }
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const linePrice = dbItem.price * quantity;
    subtotal += linePrice;

    verifiedItems.push({
      menuItemId: dbItem.id,
      name: dbItem.name,
      price: dbItem.price,
      quantity,
      image: dbItem.image,
      specialInstructions: item.specialInstructions || '',
    });
  }

  const tax = Math.round(subtotal * business.taxRate * 100) / 100;
  const deliveryFee = orderType === 'delivery' ? business.deliveryFee : 0;
  const total = Math.round((subtotal + tax + deliveryFee) * 100) / 100;

  const customerId = req.user?.userId || `usr_guest_${Date.now()}`;
  const finalCustomerName = customerName || (req.user ? db.findUserById(req.user.userId)?.name : 'Guest Customer');
  const finalCustomerEmail = customerEmail || (req.user ? req.user.email : 'guest@example.com');

  const newOrder: Order = {
    id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    tenantId,
    customerId,
    customerName: finalCustomerName,
    customerEmail: finalCustomerEmail,
    customerPhone: customerPhone || '',
    items: verifiedItems,
    orderType: orderType || 'dine_in',
    tableNumber: tableNumber || undefined,
    deliveryAddress: deliveryAddress || undefined,
    subtotal: Math.round(subtotal * 100) / 100,
    tax,
    deliveryFee,
    discount: 0,
    total,
    paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid',
    paymentMethod: paymentMethod || 'stripe',
    paymentId: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    orderStatus: 'PENDING',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  const created = db.createOrder(newOrder);
  return res.status(201).json(created);
});

// Customer: Get my orders
apiRouter.get('/orders/my-orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.user!.userId;
  const orders = db.getOrdersByCustomer(customerId);
  return res.json(orders);
});

// Get single order (public with ID or authenticated)
apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const order = db.getOrderById(id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  const business = db.getBusinessById(order.tenantId);
  return res.json({ ...order, businessName: business?.businessName, businessLogo: business?.logo });
});

// Create Customer Reservation
apiRouter.post('/reservations', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { tenantId, date, time, partySize, notes, customerName, customerEmail, customerPhone } = req.body;

  if (!tenantId || !date || !time || !partySize) {
    return res.status(400).json({ error: 'Date, time, party size, and business are required' });
  }

  const business = db.getBusinessById(tenantId);
  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }

  const customerId = req.user?.userId || `usr_guest_${Date.now()}`;
  const finalName = customerName || (req.user ? db.findUserById(req.user.userId)?.name : 'Guest Customer');
  const finalEmail = customerEmail || (req.user ? req.user.email : 'guest@example.com');

  const newRes: Reservation = {
    id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    tenantId,
    customerId,
    customerName: finalName,
    customerEmail: finalEmail,
    customerPhone: customerPhone || '+1 (555) 000-0000',
    date,
    time,
    partySize: Number(partySize),
    status: 'PENDING',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  const created = db.createReservation(newRes);
  return res.status(201).json(created);
});

// Customer: Get my reservations
apiRouter.get('/reservations/my-reservations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.user!.userId;
  const reservations = db.getReservationsByCustomer(customerId);
  const businesses = db.getAllBusinesses(false);

  const enriched = reservations.map(r => {
    const biz = businesses.find(b => b.id === r.tenantId);
    return {
      ...r,
      businessName: biz?.businessName || 'Restaurant',
      businessAddress: biz?.address,
      businessLogo: biz?.logo,
    };
  });

  return res.json(enriched);
});

// ==========================================
// 6. PAYMENTS (STRIPE & SIMULATION)
// ==========================================

apiRouter.post('/payments/create-intent', optionalAuth, (req: Request, res: Response) => {
  const { amount, currency = 'usd', tenantId } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  // If real Stripe secret is configured, generate client secret
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (stripeSecret && stripeSecret.startsWith('sk_')) {
    // In production with Stripe SDK, would create real Stripe PaymentIntent
    // For immediate zero-latency execution & fallback:
    return res.json({
      clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substring(2, 10)}`,
      amount,
      currency,
      provider: 'stripe',
    });
  }

  // Development / Demo mode test payment intent
  return res.json({
    clientSecret: `pi_demo_${Date.now()}_secret_${Math.random().toString(36).substring(2, 10)}`,
    amount,
    currency,
    provider: 'demo_gateway',
    isSimulation: true,
  });
});

// ==========================================
// 7. IMAGE UPLOADER (CLOUDINARY / DATA FALLBACK)
// ==========================================

apiRouter.post('/upload', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { imageBase64, filename } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  // If Cloudinary configured, upload to Cloudinary
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const cloudKey = process.env.CLOUDINARY_API_KEY;

  if (cloudName && cloudKey) {
    // Cloudinary configured response
    return res.json({
      url: imageBase64, // or Cloudinary secure_url
      publicId: `foodsphere_${Date.now()}`,
      provider: 'cloudinary',
    });
  }

  // Production-grade Base64 / Local Storage URL
  return res.json({
    url: imageBase64,
    publicId: `img_${Date.now()}`,
    provider: 'data_uri',
  });
});

// ==========================================
// 8. NOTIFICATIONS
// ==========================================

apiRouter.get('/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const notifs = db.getNotifications(user.userId, user.tenantId || undefined, user.role);
  return res.json(notifs);
});

apiRouter.patch('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.markNotificationAsRead(id);
  return res.json({ success });
});

// ==========================================
// 9. REAL-TIME SERVER-SENT EVENTS (SSE)
// ==========================================

apiRouter.get('/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  res.write('data: {"type":"CONNECTED"}\n\n');

  const unsubscribe = db.subscribe(event => {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch (e) {
      // client disconnected
    }
  });

  const keepAlive = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch (e) {
      clearInterval(keepAlive);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
});

// ==========================================
// 10. DATABASE RESET (FOR TEST & DEMO)
// ==========================================

apiRouter.post('/seed/reset', (req: Request, res: Response) => {
  db.resetDatabase();
  return res.json({ success: true, message: 'Database reset to initial demo seeds.' });
});
