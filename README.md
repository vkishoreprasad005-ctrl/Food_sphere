# FoodSphere – Cloud-Based Multi-Tenant Food Business Management Platform

FoodSphere is a production-quality, multi-tenant Software-as-a-Service (SaaS) cloud platform built for restaurants, cafés, bakeries, cloud kitchens, and bistros. It allows multiple independent food businesses to operate securely on a single centralized cloud architecture while guaranteeing logical tenant data isolation, role-based authorization, real-time kitchen operations, and deep business analytics.

---

## 1. Key Features

- **Multi-Tenant Data Isolation**: Every business entity (menu categories, food items, orders, tables, reservations, customers, analytics) is bound to a `tenantId`. Server-side middlewares enforce tenant isolation so Business A never sees Business B's data.
- **Four-Tier Role-Based Access Control (RBAC)**:
  - **Platform Admin**: Superuser oversight across all tenants, platform GMV calculations, business suspension/activation, and cross-tenant user auditing.
  - **Business Owner**: Full business management, profile branding, menu category and dish creation, table management, customer spend logs, and calculated revenue analytics.
  - **Staff**: Operational access to incoming orders (KDS pipeline) and reservation check-ins without sensitive ownership controls.
  - **Customer**: Public discovery, interactive menus, customizable carts, Stripe test checkout, live order tracking, and table reservations.
- **Digital Menu Engineering**: Categories with sorting, dietary tags (`Vegetarian`, `Vegan`, `Gluten-Free`, `Chef Special`), prep times, real-time availability toggles ("Available" / "Sold Out"), and high-resolution imagery.
- **Live Kitchen Display System (KDS)**: Order lifecycle pipeline:
  `PENDING` → `CONFIRMED` → `PREPARING` → `READY` → `COMPLETED` (or `CANCELLED`).
- **Real-Time Updates via Server-Sent Events (SSE)**:
  - When a customer places an order, the business owner/staff immediately receives a live visual notification and the order board increments without manual page reload.
  - When staff updates order status, the customer's live tracking progress bar advances in real-time.
- **Table & Reservation Management**: Visual floor plan (indoor, patio, rooftop, bar), party size checks, booking status approval, and physical table assignment.
- **Calculated Business Intelligence**: Real-time calculated revenue trends over time, average ticket size, order fulfillment distributions (Dine-in vs Takeout vs Delivery), and popular dishes ranking.
- **Payment Gateway & Cloud Storage**: Stripe payment abstraction and Cloudinary image upload workflows with zero-config local simulation fallbacks.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React icons.
- **Backend**: Node.js, Express, REST APIs, JSON Web Tokens (JWT), bcryptjs password hashing.
- **Real-Time Communication**: Server-Sent Events (SSE) `/api/events` with automatic reconnection.
- **Database / Storage**: Resilient document database engine (`.data/foodsphere-db.json`) with automatic seeding and MongoDB Atlas compatibility via `MONGODB_URI`.
- **Payment Gateway**: Stripe Checkout & PaymentIntent integration abstraction.
- **Media Storage**: Cloudinary direct cloud upload API with local high-resolution fallback.

---

## 3. Demo Credentials (For Grading & Testing)

| Role | Name | Email | Password | Scope |
|---|---|---|---|---|
| **Platform Admin** | Alexandra Vance | `admin@foodsphere.io` | `admin123` | Global platform administration & business oversight |
| **Tenant A Owner** | Chef Marco Rossi | `owner@artisanalfork.com` | `password123` | Owner of **The Artisanal Fork** Bistro |
| **Tenant A Staff** | Elena Rostova | `staff@artisanalfork.com` | `password123` | Kitchen staff at The Artisanal Fork |
| **Tenant B Owner** | Chloe Laurent | `owner@sweetharmony.com` | `password123` | Owner of **Sweet Harmony Bakery & Cafe** |
| **Tenant B Staff** | Liam Chen | `staff@sweetharmony.com` | `password123` | Staff at Sweet Harmony Bakery |
| **Customer** | Sarah Jenkins | `customer@example.com` | `customer123` | Consumer / Diner |

> **Pro-Tip**: Use the **"Quick Switch" bar** at the top of the application to test any persona with 1 click without typing passwords!

---

## 4. Multi-Tenancy & MongoDB Atlas Architecture

In FoodSphere, data isolation and cloud storage are powered directly by **MongoDB Atlas**:

1. **Authentication Layer & Separate User Accounts**:
   - Each user (Platform Super Admin, Tenant A Owner, Tenant A Staff, Tenant B Owner, Tenant B Staff, Customer, or new signups) is stored as a distinct document in the MongoDB Atlas `users` collection.
   - Separate credentials with bcrypt salted password hashes.
   - Unique index on `email`: `{ email: 1 }`.
   - Each business staff and owner has their corresponding `tenantId` bound to their user record.
2. **Business Tenant System**:
   - Business records are stored in the `businesses` collection with unique `slug` index and `ownerId`.
   - Every business entity (`categories`, `menuItems`, `orders`, `reservations`, `tables`, `notifications`) contains an immutable `tenantId`.
3. **MongoDB Atlas Collections & Indexes**:
   - `users`: `{ email: 1 }` (unique), `{ tenantId: 1 }`, `{ role: 1 }`
   - `businesses`: `{ slug: 1 }` (unique), `{ ownerId: 1 }`
   - `categories`: `{ tenantId: 1, displayOrder: 1 }`
   - `menuItems`: `{ tenantId: 1, categoryId: 1 }`, `{ tenantId: 1, available: 1 }`
   - `orders`: `{ tenantId: 1, createdAt: -1 }`, `{ customerId: 1 }`, `{ id: 1 }` (unique)
   - `reservations`: `{ tenantId: 1, date: 1 }`, `{ customerId: 1 }`
   - `tables`: `{ tenantId: 1, tableNumber: 1 }`
   - `notifications`: `{ userId: 1 }`, `{ tenantId: 1 }`
4. **Middleware Layer**:
   - The `requireTenant` middleware extracts the session tenant ID. If an owner or staff attempts to query or mutate an entity belonging to another `tenantId`, the server returns `403 Forbidden` or `404 Not Found`.

---

## 5. Setting up MongoDB Atlas Cloud Database

You can connect FoodSphere to your own **MongoDB Atlas** cloud cluster in 3 easy steps:

### Step 1: Create Free MongoDB Atlas Cluster
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (e.g. `Cluster0`).
3. Under **Security → Database Access**, create a user (e.g. `admin`) and set a password.
4. Under **Security → Network Access**, add IP `0.0.0.0/0` (Allow Access from Anywhere) so cloud environments can connect.

### Step 2: Get your Connection String
Click **Connect → Drivers** and copy your URI:
```
mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/foodsphere?retryWrites=true&w=majority
```

### Step 3: Connect in FoodSphere
You can connect in either of two ways:
1. **Via the In-App Console**: Click the **"MongoDB Atlas"** pill on the top demo bar, paste your connection string, and click **"Test & Connect Atlas Cluster"**.
2. **Via `.env`**: Set `MONGODB_URI="your_mongodb_atlas_uri"` in `.env` and restart the server.

Once connected, FoodSphere automatically verifies indexes, seeds the cluster with multi-tenant data, and reflects live document counts!

---

## 5. Verification of Required User Flows

- **Flow 1 (Customer Order)**: Log in as Customer → Go to Explore → Select "The Artisanal Fork" → Add items to Cart → Complete Checkout → Redirects to Live Tracker.
- **Flow 2 (Kitchen Status Progression)**: Log in as Owner or Staff of Tenant A → Open "Live Kitchen Board" → Advance status to `PREPARING` or `READY` → Customer Live Tracker updates instantaneously.
- **Flow 3 (Menu Management)**: Owner creates a new category and dish → Customer navigates to that restaurant's public menu and immediately sees the new dish.
- **Flow 4 (Table Reservation)**: Customer books a table on restaurant page → Owner/staff receives reservation in "Table Reservations" → Staff assigns table and clicks "Confirm".
- **Flow 5 (Tenant Analytics)**: Owner opens "Analytics" → GMV, orders, daily chart, and best-sellers reflect real database operations.
- **Flow 6 (Tenant Isolation)**: Owner A (`owner@artisanalfork.com`) logs in and verifies they can only view and manage Artisanal Fork records. Switching to Owner B (`owner@sweetharmony.com`) reveals only Sweet Harmony Bakery data.
- **Flow 7 (Platform Admin)**: Admin logs in (`admin@foodsphere.io`) → Can view platform-wide GMV and suspend/activate food businesses.

---

## 6. Running Locally

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Start Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:3000`.

### 4. Database Reset (Optional)
To restore initial demo data at any time, click **"Reset DB"** on the top demo banner or send a POST request to `/api/seed/reset`.

---

## 7. Production Deployment (Vercel / Cloud Run)

To build and run in production:
```bash
npm run build
npm start
```

For Vercel deployment:
1. Push repository to GitHub.
2. Import repository in Vercel.
3. Configure environment variables (`AUTH_SECRET`, `MONGODB_URI`, `STRIPE_SECRET_KEY`, `CLOUDINARY_CLOUD_NAME`).
4. Deploy!
