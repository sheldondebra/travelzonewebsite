# Social Commerce SaaS

Inventory, orders, and profit tracking for African social sellers (Instagram, WhatsApp, TikTok).

## Stack

- **Web**: Next.js 16 (App Router), Tailwind, shadcn/ui
- **Database**: PostgreSQL on [Neon](https://neon.tech)
- **ORM**: Prisma 7
- **Auth**: NextAuth.js (credentials)
- **Mobile**: Expo (React Native) in `/mobile`

## Quick start

### 1. Neon database

1. Create a project at [console.neon.tech](https://console.neon.tech).
2. Copy the **pooled** connection string → `DATABASE_URL`
3. Copy the **direct** connection string → `DIRECT_URL` (for migrations)

### 2. Environment

Copy `.env.example` to `.env` and set:

```env
DATABASE_URL="postgresql://...@ep-xxx-pooler....neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://...@ep-xxx....neon.tech/neondb?sslmode=require"
AUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Install and migrate

```bash
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Register → Set up business → Dashboard.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import in [Vercel](https://vercel.com) and add the same env vars (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXTAUTH_URL` = your production URL).
3. Build runs `prisma migrate deploy` via [vercel.json](vercel.json).

```bash
npx vercel env add DATABASE_URL
npx vercel env add DIRECT_URL
npx vercel env add AUTH_SECRET
npx vercel env add NEXTAUTH_URL
npx vercel --prod
```

## API architecture

Business logic lives in `src/server/services/`. Validations use Zod in `src/server/validations/`.

All authenticated APIs return:

```json
{ "success": true, "data": {}, "message": "..." }
```

### Web (session cookie)

| Route | Methods |
|-------|---------|
| `/api/products` | GET, POST |
| `/api/products/[id]` | PATCH, DELETE |
| `/api/customers` | GET, POST |
| `/api/orders` | GET, POST |
| `/api/dashboard` | GET |
| `/api/payments` | GET, POST (stub) |

### Mobile (Bearer JWT)

| Route | Methods |
|-------|---------|
| `/api/mobile/auth` | POST |
| `/api/mobile/products` | GET, POST |
| `/api/mobile/orders` | GET, POST |
| `/api/mobile/customers` | GET, POST |
| `/api/mobile/dashboard` | GET |
| `/api/mobile/settings` | GET |

Server Actions for dashboard forms: `src/actions/products.ts`, `customers.ts`, `orders.ts`.

All queries filter by `businessId` — multi-tenant isolation.

## Mobile app

```bash
cd mobile
npm install
# Set EXPO_PUBLIC_API_URL in mobile/.env (e.g. http://192.168.1.x:3000/api)
npx expo start
```

## MVP features

- Auth (register, login, business onboarding)
- Products & inventory
- Customers
- Orders (stock validation, profit calculation)
- Dashboard (revenue, profit, low stock, best sellers)

Phase 2 (not implemented): MoMo, delivery riders, receipts, expenses, notifications.
