# Social Commerce SaaS
## Next.js Fullstack + React Native Setup Guide

Build:
- Web Dashboard
- Mobile App
- iPad App
- SaaS Backend API

Using:

```txt
Next.js Fullstack
React Native (Expo)
PostgreSQL
Prisma
Auth.js
Tailwind CSS
Shadcn UI
```

---

# 1. CREATE PROJECT

Inside your empty folder run:

```bash
npx create-next-app@latest .
```

Choose:

```txt
TypeScript → Yes
ESLint → Yes
Tailwind CSS → Yes
src/ directory → Yes
App Router → Yes
Turbopack → Yes
Import alias → Yes
```

---

# 2. INSTALL CORE PACKAGES

Run:

```bash
npm install prisma @prisma/client
npm install next-auth
npm install bcryptjs
npm install zod
npm install react-hook-form
npm install @hookform/resolvers
npm install zustand
npm install sonner
npm install lucide-react
npm install recharts
npm install clsx tailwind-merge
npm install date-fns
npm install axios
npm install @tanstack/react-query
```

---

# 3. INSTALL SHADCN UI

Initialize:

```bash
npx shadcn@latest init
```

Install components:

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add form
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add sheet
npx shadcn@latest add sonner
```

---

# 4. CREATE MOBILE APP

Open new terminal:

```bash
npx create-expo-app mobile
```

Enter folder:

```bash
cd mobile
```

Install packages:

```bash
npm install axios
npm install zustand
npm install @tanstack/react-query
npm install react-hook-form
npm install zod
npm install nativewind
npm install react-native-safe-area-context
npm install react-native-reanimated
npm install react-native-screens
```

Install Expo Router:

```bash
npx expo install expo-router
```

---

# 5. PROJECT STRUCTURE

```txt
project-root/
│
├── mobile/
│
├── prisma/
│
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── server/
│   ├── actions/
│   ├── hooks/
│   ├── store/
│   ├── types/
│   └── services/
│
├── public/
│
└── package.json
```

---

# 6. SETUP DATABASE

Initialize Prisma:

```bash
npx prisma init
```

---

# 7. CONFIGURE DATABASE

Install PostgreSQL.

Create database:

```txt
social_commerce
```

Update `.env`

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/social_commerce"
```

---

# 8. CREATE PRISMA SCHEMA

Open:

```txt
prisma/schema.prisma
```

Paste:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String     @id @default(cuid())
  email       String     @unique
  password    String
  name        String?

  businessId  String?
  business    Business? @relation(fields: [businessId], references: [id])

  createdAt   DateTime   @default(now())
}

model Business {
  id          String      @id @default(cuid())
  name        String

  users       User[]
  products    Product[]
  customers   Customer[]
  orders      Order[]

  createdAt   DateTime @default(now())
}

model Product {
  id             String   @id @default(cuid())
  name           String
  price          Float
  costPrice      Float
  stockQuantity  Int

  businessId     String
  business       Business @relation(fields: [businessId], references: [id])

  createdAt      DateTime @default(now())
}

model Customer {
  id            String   @id @default(cuid())
  name          String
  phone         String?

  businessId    String
  business      Business @relation(fields: [businessId], references: [id])

  orders        Order[]
}

model Order {
  id              String   @id @default(cuid())

  totalAmount     Float
  profit          Float

  paymentStatus   String
  deliveryStatus  String

  customerId      String
  customer        Customer @relation(fields: [customerId], references: [id])

  businessId      String
  business        Business @relation(fields: [businessId], references: [id])

  items           OrderItem[]

  createdAt       DateTime @default(now())
}

model OrderItem {
  id          String   @id @default(cuid())

  quantity    Int
  price       Float

  orderId     String
  order       Order @relation(fields: [orderId], references: [id])

  productId   String
  product     Product @relation(fields: [productId], references: [id])
}
```

---

# 9. RUN DATABASE MIGRATION

Run:

```bash
npx prisma migrate dev --name init
```

Generate client:

```bash
npx prisma generate
```

---

# 10. CREATE PRISMA CLIENT

Create:

```txt
src/lib/prisma.ts
```

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

---

# 11. SETUP AUTH.JS

Create:

```txt
src/auth.ts
```

Install auth:

```bash
npm install next-auth
```

---

# 12. CREATE API ROUTES

Create folders:

```txt
src/app/api/
```

Add:

```txt
products/
orders/
customers/
dashboard/
auth/
```

Example:

```txt
src/app/api/products/route.ts
```

---

# 13. SAMPLE PRODUCTS API

```ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const products = await prisma.product.findMany();

  return NextResponse.json(products);
}
```

---

# 14. CREATE DASHBOARD PAGES

Inside:

```txt
src/app/dashboard/
```

Create:

```txt
page.tsx
products/
orders/
customers/
analytics/
settings/
```

---

# 15. USE SERVER COMPONENTS

Default:

```tsx
NO "use client"
```

Only use client components for:
- forms
- modals
- charts
- dropdowns

---

# 16. CREATE MOBILE API SERVICE

Inside mobile app:

```txt
services/api.ts
```

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: "http://YOUR_LOCAL_IP:3000/api",
});
```

---

# 17. MOBILE APP STRUCTURE

```txt
mobile/
│
├── app/
│   ├── login.tsx
│   ├── dashboard/
│   ├── products/
│   ├── orders/
│   ├── customers/
│   └── settings/
│
├── components/
├── services/
├── store/
└── hooks/
```

---

# 18. MULTI-TENANCY

EVERY major model MUST have:

```txt
businessId
```

This isolates each seller's data.

---

# 19. BUSINESS LOGIC

When order is created:

```txt
1. Validate stock
2. Create order
3. Reduce inventory
4. Calculate profit
5. Save payment status
6. Save delivery status
```

---

# 20. PROFIT CALCULATION

```txt
profit = sellingPrice - costPrice
```

Example:

```txt
Selling Price = 150
Cost Price = 90
Profit = 60
```

---

# 21. MVP FEATURES

Build ONLY:

## Authentication
- Login
- Register
- Business setup

## Products
- Add product
- Inventory

## Customers
- Customer profiles

## Orders
- Create orders
- Track status

## Dashboard
- Revenue
- Profit
- Low stock
- Best sellers

---

# 22. FUTURE FEATURES

## Phase 2

```txt
MoMo Integration
Delivery Riders
Receipts
Expenses
Notifications
```

## Phase 3

```txt
WhatsApp Automation
AI Reports
Advanced Analytics
Staff Roles
```

---

# 23. RUN PROJECT

## Next.js

```bash
npm run dev
```

Server:

```txt
http://localhost:3000
```

---

## Mobile App

```bash
cd mobile
npx expo start
```

---

# 24. DEPLOYMENT

## Web
- Vercel

## Database
- Neon
- Supabase
- Railway

## Storage
- Cloudinary
- UploadThing

---

# 25. RECOMMENDED BUILD ORDER

## STEP 1
Auth

## STEP 2
Businesses

## STEP 3
Products

## STEP 4
Orders

## STEP 5
Customers

## STEP 6
Dashboard

## STEP 7
Mobile App

---

# 26. FINAL GOAL

Build:

```txt
Shopify + Inventory + Order Tracking
for African social sellers
```

Target users:

- Instagram sellers
- WhatsApp businesses
- TikTok sellers
- Fashion brands
- Cosmetics shops
- Food vendors
- Phone stores

---

# 27. LONG TERM VISION

Become:

```txt
The Operating System for African Social Commerce
```