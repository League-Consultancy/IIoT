# Enterprise Device Session Analytics Platform

A multi-tenant, session-based analytics platform that ingests immutable device work intervals, computes per-device historical working duration, and provides exportable logs for enterprise audit and reporting.

## Project Structure

```
├── backend/          # Node.js + Express + TypeScript API
└── frontend/         # Next.js 14 + React + Tailwind CSS
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 5.0+ (for time-series collections)

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

The API will start at `http://localhost:3001`.

### Seed Demo Data

```bash
cd backend
npx tsx src/seed.ts
```

**Test credentials:**
- Admin: `admin@demo.com` / `password123`
- User: `user@demo.com` / `password123`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will start at `http://localhost:3000`.

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user

### Session Ingestion
- `POST /api/v1/device/session` - Ingest session (idempotent)

### Devices
- `GET /api/v1/devices` - List devices
- `GET /api/v1/devices/:deviceId` - Get device
- `POST /api/v1/devices` - Register device (admin)

### Analytics (per-device only)
- `GET /api/v1/devices/:deviceId/analytics/daily`
- `GET /api/v1/devices/:deviceId/analytics/weekly`
- `GET /api/v1/devices/:deviceId/analytics/monthly`
- `GET /api/v1/devices/:deviceId/analytics/summary`

### Exports
- `POST /api/v1/devices/:deviceId/sessions/export` - Create export
- `GET /api/v1/exports/:exportId` - Get status
- `GET /api/v1/exports/:exportId/download` - Download file

## Key Features

- ✅ Session-based analytics (no live status)
- ✅ Immutable data storage
- ✅ Idempotent ingestion
- ✅ Multi-tenant isolation
- ✅ JWT authentication with roles
- ✅ Export to CSV/XLSX/JSON
- ✅ Dark mode UI
- ✅ Responsive design
