# Social Commerce Mobile

Expo app for sellers on iOS, Android, and iPad.

## Setup

```bash
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to your Next.js API (use LAN IP on device)
npm install
npx expo start
```

## Auth

Sign in uses `POST /api/auth/mobile` and stores a JWT for API requests. Complete business setup on the web dashboard if `businessId` is missing.
