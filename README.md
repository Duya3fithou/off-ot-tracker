# OT Logger

Internal web app for logging overtime (OT). Employees sign in with their company
Google account, submit one or more OT requests, and admins review them and view
monthly totals.

- **backend/** — Express + Prisma + PostgreSQL REST API (TypeScript)
- **web/** — Vite + React + Material UI single-page app (TypeScript)
- **mobile/** — Expo / React Native app (TypeScript) with full parity to the web,
  plus OTA updates (hot-updater) and push notifications (OneSignal); see
  [mobile/README.md](mobile/README.md)

## Features

- **Google sign-in**, restricted to allowed company domains (`offspringdigital.com`,
  `artisan-labs.com` — configurable).
- **Home**: add one or more OT "blocks" and submit them together. Each block has:
  start date, start time, end time, auto-computed duration, project (from a picker),
  a task link/title, and a task status (`Done` / `In progress — need X hours`).
- **Admin**: review (approve/reject) requests, see per-user monthly totals, and
  manage the list of projects shown in the picker.

## Prerequisites

- Node.js 18+ (tested on Node 24)
- A running PostgreSQL database
- A Google OAuth **Web application** Client ID
  ([Google Cloud Console](https://console.cloud.google.com/apis/credentials))
  with `http://localhost:5173` added to *Authorized JavaScript origins*.

## Setup

### 0. Database (Docker)

The repo ships a `docker-compose.yml` with a ready-to-use PostgreSQL matching the
default `DATABASE_URL`:

```bash
docker compose up -d        # starts Postgres on localhost:5432
```

(Skip this if you already have a Postgres you want to use — just point `DATABASE_URL` at it.)

### 1. Backend

```bash
cd backend
cp .env.example .env        # then edit the values
npm install
npm run prisma:generate
npm run prisma:migrate      # creates tables (dev migration)
npm run db:seed             # optional: seed a few projects
npm run dev                 # http://localhost:4000
```

Key `.env` values:

| Variable | Meaning |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth Web client ID (same as the web app) |
| `JWT_SECRET` | Long random string used to sign session tokens |
| `ALLOWED_EMAIL_DOMAINS` | Comma-separated domains allowed to sign in |
| `ADMIN_EMAILS` | Comma-separated emails granted admin access |
| `CORS_ORIGIN` | Web app origin(s) allowed to call the API |

### 2. Web

```bash
cd web
cp .env.example .env        # set VITE_GOOGLE_CLIENT_ID + VITE_API_BASE_URL
npm install
npm run dev                 # http://localhost:5173
```

## How auth works

1. The web app uses Google Sign-In to obtain an **ID token**.
2. It sends the ID token to `POST /api/auth/google`.
3. The backend verifies the token with Google, checks the email domain is allowed,
   upserts the user, and returns an app **JWT session token**.
4. The web app stores the JWT and sends it as `Authorization: Bearer <token>` on
   every request. Admin status is derived from `ADMIN_EMAILS`.

## API overview

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/google` | public | Exchange Google ID token for a session |
| GET | `/api/auth/me` | user | Current user |
| GET | `/api/projects` | user | Active projects (picker) |
| GET | `/api/projects/all` | admin | All projects |
| POST | `/api/projects` | admin | Create project |
| PATCH | `/api/projects/:id` | admin | Rename / toggle active |
| POST | `/api/ot-requests` | user | Submit one or many OT blocks |
| GET | `/api/ot-requests/mine` | user | My OT requests (`?month=YYYY-MM`) |
| GET | `/api/admin/ot-requests` | admin | All requests (`?month=&status=&userId=`) |
| GET | `/api/admin/summary` | admin | Per-user monthly totals |
| PATCH | `/api/admin/ot-requests/:id/review` | admin | Approve / reject |

## Notes

- **Duration** is always computed on the server from start/end time. If end ≤ start,
  it is treated as crossing midnight (e.g. `20:00 → 00:00` = 4h).
- **Work date** is stored as a `YYYY-MM-DD` string to avoid timezone drift.
- New requests always start as `PENDING`.

## Production build

```bash
cd backend && npm run build && npm run prisma:deploy && npm start
cd web && npm run build      # outputs static files to web/dist
```
