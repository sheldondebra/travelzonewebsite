# ED-AMAD Learning Platform

Tablet-first nursing e-learning and examination platform.

## Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Laravel 13 API, Sanctum, Spatie Permission
- **Database:** SQLite (dev) / MySQL (production)

## Project structure

```txt
edamad/
├── frontend/     # Next.js app (port 3000)
├── backend/      # Laravel API (port 8000)
└── setup.md      # Full setup guide
```

## Quick start

### Backend

```bash
cd backend
php artisan serve
```

API base: `http://127.0.0.1:8000/api`

### Frontend

```bash
cd frontend
npm run dev
```

App: `http://localhost:3000`

## Environment

- Frontend: `frontend/.env.local` — `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api`
- Backend: `backend/.env` — database and Paystack keys when ready

### MySQL (production)

In `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=edamad
DB_USERNAME=root
DB_PASSWORD=
```

Then run `php artisan migrate`.

## Package notes

These packages from `setup.md` were **not** installed due to Laravel 13 / PHP 8.5 compatibility:

- `unicodeveloper/laravel-paystack` — integrate Paystack via HTTP API or a maintained package later
- `maatwebsite/excel` — blocked on PHP 8.5; add when PhpSpreadsheet supports 8.5+

## Phase 1 (current)

- [x] Project scaffolding
- [x] Auth API (register, login, logout)
- [x] Course API (list, show, admin create)
- [x] Video upload endpoint
- [x] Dashboard layout, sidebar, auth pages
- [ ] Enrollments & Paystack payments
- [ ] Practice test engine
- [ ] Full admin CRUD

## Create an admin user

```bash
cd backend
php artisan tinker
```

```php
\App\Models\User::create([
  'name' => 'Admin',
  'email' => 'admin@edamad.test',
  'password' => 'password',
  'role' => 'admin',
]);
```
