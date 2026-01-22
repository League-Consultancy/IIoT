# Enterprise Device Session Analytics Platform

A multi-tenant, session-based analytics platform deployed on Vercel. Ingests device work intervals, computes historical working duration, and provides analytics for enterprise reporting.

**Live Demo:** [https://i-io-t.vercel.app](https://i-io-t.vercel.app)

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + Tailwind CSS
- **Backend**: Next.js Serverless API Routes (formerly Express)
- **Database**: MongoDB Atlas (Time-Series Collections)
- **Deployment**: Vercel

## Features

- ✅ **Session-Based Analytics**: Immutable historical data processing (no live status)
- ✅ **Multi-Tenant System**: Data isolation per tenant
- ✅ **Serverless Architecture**: Fully deployed on Vercel
- ✅ **Client-Side Exports**: Generate CSV/XLSX/JSON directly in browser
- ✅ **Secure Auth**: JWT authentication with role-based access

## Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone https://github.com/League-Consultancy/IIoT.git
cd IIoT/frontend
npm install
```

### 2. Configure Environment
Create `.env.local` in `frontend/`:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

### 3. Run Locally
```bash
npm run dev
# App will run at http://localhost:3000
```

## Deployment

The app is configured for **Vercel** with a monorepo structure (Root directory: `frontend`).

1. push to main
2. Vercel automatically deploys

---

## API Documentation

All API routes are at `/api/v1/*`:

- `POST /api/v1/auth/login` - Login
- `GET /api/v1/devices` - List devices
- `GET /api/v1/factories` - List factories (and devices per factory)
- `GET /api/v1/devices/:id/analytics/daily` - Daily duration metrics

## Test Credentials

- **Admin**: `admin@demo.com` / `password123`
- **User**: `user@demo.com` / `password123`
