# ED-AMAD Learning Platform

A tablet-first nursing e-learning and examination platform built with:

- Frontend: Next.js 15 + TypeScript + TailwindCSS
- Backend: Laravel 12 API
- Database: MySQL/PostgreSQL
- Authentication: Laravel Sanctum
- Payments: Paystack
- Video Storage: Local Server / S3 / Cloudinary
- UI: shadcn/ui + Lucide Icons

---

# Project Structure

```bash
ed-amad-platform/
│
├── frontend/
└── backend/
```

---

# STEP 1 — CREATE PROJECT FOLDERS

```bash
mkdir ed-amad-platform
cd ed-amad-platform
```

---

# STEP 2 — CREATE NEXT.JS FRONTEND

```bash
npx create-next-app@latest frontend
```

Use:

```txt
✔ TypeScript → Yes
✔ ESLint → Yes
✔ TailwindCSS → Yes
✔ App Router → Yes
✔ src directory → Yes
✔ Turbopack → Yes
```

---

# STEP 3 — INSTALL FRONTEND DEPENDENCIES

```bash
cd frontend

npm install axios zustand react-hook-form zod
npm install @hookform/resolvers
npm install lucide-react
npm install clsx tailwind-merge
npm install sonner
npm install date-fns
npm install recharts
npm install react-player
npm install @tanstack/react-query
npm install next-themes
npm install @fontsource/inter
```

---

# STEP 4 — INSTALL SHADCN/UI

```bash
npx shadcn@latest init
```

Install components:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add table
npx shadcn@latest add tabs
npx shadcn@latest add progress
npx shadcn@latest add textarea
npx shadcn@latest add dropdown-menu
npx shadcn@latest add dialog
```

---

# STEP 5 — CREATE LARAVEL BACKEND

Open new terminal:

```bash
cd ed-amad-platform

composer create-project laravel/laravel backend
```

---

# STEP 6 — INSTALL LARAVEL PACKAGES

```bash
cd backend

composer require laravel/sanctum
composer require spatie/laravel-permission
composer require maatwebsite/excel
composer require unicodeveloper/laravel-paystack
```

---

# STEP 7 — INSTALL SANCTUM

```bash
php artisan sanctum:install
php artisan migrate
```

---

# STEP 8 — CONFIGURE DATABASE

Update `.env`

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=edamad
DB_USERNAME=root
DB_PASSWORD=
```

Then run:

```bash
php artisan migrate
```

---

# STEP 9 — ENABLE LOCAL VIDEO STORAGE

Create storage link:

```bash
php artisan storage:link
```

Videos stored in:

```txt
storage/app/public/videos
```

Public URL:

```txt
http://localhost:8000/storage/videos/video.mp4
```

---

# STEP 10 — CREATE API ROUTES

Edit:

```txt
routes/api.php
```

Example:

```php
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/courses', [CourseController::class, 'index']);

    Route::post('/courses', [AdminCourseController::class, 'store']);

});
```

---

# STEP 11 — RUN THE SERVERS

## Backend

```bash
cd backend
php artisan serve
```

Runs on:

```txt
http://127.0.0.1:8000
```

---

## Frontend

```bash
cd frontend
npm run dev
```

Runs on:

```txt
http://localhost:3000
```

---

# STEP 12 — CONNECT FRONTEND TO BACKEND

Create:

```txt
frontend/.env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

---

# STEP 13 — CREATE FOLDER STRUCTURE

## Frontend

```txt
src/
│
├── app/
│   ├── auth/
│   ├── dashboard/
│   ├── courses/
│   ├── practice/
│   ├── progress/
│   ├── profile/
│   ├── support/
│   └── admin/
│
├── components/
├── services/
├── hooks/
├── store/
├── lib/
└── types/
```

---

## Backend

```txt
app/
│
├── Http/
│   ├── Controllers/
│   │   ├── Auth/
│   │   ├── Student/
│   │   ├── Admin/
│   │   └── Payment/
│
├── Models/
├── Services/
└── Traits/
```

---

# STEP 14 — CREATE CORE TABLES

Generate models + migrations:

```bash
php artisan make:model Course -m
php artisan make:model Lesson -m
php artisan make:model Enrollment -m
php artisan make:model Question -m
php artisan make:model PracticeTest -m
php artisan make:model TestAttempt -m
php artisan make:model Payment -m
```

Then migrate:

```bash
php artisan migrate
```

---

# STEP 15 — INSTALL PAYSTACK

Add to `.env`

```env
PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
```

Publish config:

```bash
php artisan vendor:publish --provider="Unicodeveloper\Paystack\PaystackServiceProvider"
```

---

# STEP 16 — CREATE VIDEO UPLOAD API

Example controller:

```php
public function upload(Request $request)
{
    $request->validate([
        'video' => 'required|mimes:mp4,mov,avi,webm|max:512000'
    ]);

    $path = $request->file('video')->store('videos', 'public');

    return response()->json([
        'url' => asset('storage/' . $path)
    ]);
}
```

---

# STEP 17 — FRONTEND DESIGN SETTINGS

## Colors

```txt
Primary Blue: #002B7F
Accent Blue:  #0B5FFF
Background:   #F5F7FB
Success:      #22C55E
Danger:       #EF4444
```

---

## Font

```txt
Inter
```

---

# STEP 18 — MAIN PAGES

## Student

```txt
/auth/login
/auth/register
/dashboard
/courses
/courses/store
/practice
/progress
/profile
/support
/live-classes
```

---

## Admin

```txt
/admin/dashboard
/admin/courses
/admin/courses/create
/admin/questions/upload
/admin/students
/admin/reports
```

---

# STEP 19 — START BUILDING UI

Start with:

1. Sidebar
2. Header/Navbar
3. Dashboard Layout
4. Login/Register
5. Course Cards
6. Video Lesson Layout
7. Practice Test UI
8. Admin Dashboard

---

# STEP 20 — BUILD ORDER

## Phase 1

- Authentication
- Dashboard Layout
- Course Store

## Phase 2

- Video Lessons
- Enrollments
- Payments

## Phase 3

- Practice Tests
- Test Reviews
- Performance Analytics

## Phase 4

- Admin Dashboard
- Course Management
- Question Upload

## Phase 5

- Live Classes
- Certificates
- Notifications
- Help & Support

---

# DEPLOYMENT

## Frontend

Deploy to:

```txt
Vercel
```

## Backend

Deploy to:

```txt
DigitalOcean
Laravel Forge
VPS
```

---

# FINAL NOTES

This architecture can fully recreate the UI shown in the PDF:

- Tablet-first layout
- Course management
- Video learning
- Practice test engine
- Analytics
- Admin management
- Payment processing
- Live classes
- Question uploads

Recommended stack:

```txt
Next.js + Laravel + MySQL + TailwindCSS
```