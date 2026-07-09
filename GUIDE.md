# OT Logger — Project Guide

> **This is the single source of truth for how this project is built.**
> Read it before making changes, follow the conventions below, and update it
> whenever you introduce or change a convention. See **§9 Rules for Claude**.

OT Logger lets employees log overtime (OT) and lets admins review it. It has
three parts that share one REST API and one data model:

| Folder | Stack | Role |
| --- | --- | --- |
| `backend/` | Node + Express + Prisma + PostgreSQL (TypeScript, CommonJS) | REST API, auth, DB |
| `web/` | Vite + React 18 + MUI v6 (TypeScript) | Web SPA |
| `mobile/` | Expo SDK 57 + React Native 0.86 + React 19 + react-native-paper (TypeScript) | iOS/Android app, OTA (hot-updater), push (OneSignal) |

Each folder has its own `README.md` with setup/run details. This guide covers
**conventions and cross-cutting contracts** — the things that must stay
consistent across all three.

---

## 1. Domain model (the shared contract)

These shapes are defined in `backend/prisma/schema.prisma` and mirrored in
`web/src/types.ts` and `mobile/src/types.ts`. **If you change one, change all
three** (plus both API clients).

- **User**: `{ id, email, name, picture?, createdAt }`. Created on first login.
- **Project**: `{ id, name (unique), active, createdAt }`. `active=false` hides it
  from the picker but keeps history. Admin listing also returns `otRequestCount`.
- **AppSetting**: singleton row (`id = 1`) of admin-configurable settings, currently
  `{ emailOnOtSubmit: boolean }`. Read/written only via `backend/src/services/settings.ts`
  (`getAppSettings` upserts defaults); exposed to web as the `AppSettings` type. Not
  mirrored to mobile (admin-only, web-configured).
- **OtRequest**:
  - `workDate`: **string `YYYY-MM-DD`** (stored as string to avoid timezone drift — do NOT switch to a Date column).
  - `startTime`, `endTime`: **string `HH:MM`** (24h).
  - `durationHours`: **Float, always computed server-side** (see §2).
  - `taskLink`: free text (may contain a URL; clients linkify the first URL).
  - `taskStatus`: enum `DONE_LOCAL | DONE_STAGING | DONE_PRODUCTION | IN_PROGRESS`. When
    `IN_PROGRESS`, `hoursToComplete` (int) is required. Display labels + the picker option
    list live in each app's `utils/taskStatus.ts` (`taskStatusLabel`, `TASK_STATUS_OPTIONS`) —
    reuse them, don't inline the label logic in tables/cards.
  - `approvalStatus`: enum `PENDING | APPROVED | REJECTED`. New requests are always `PENDING`.
  - Review fields: `reviewedById`, `reviewedByEmail`, `reviewedAt`, `reviewNote`.
  - `version`: **optimistic-concurrency token** (Int, bumped on every mutation). `updatedAt` is auto-maintained.

### Invariants (do not break)
1. **Duration is authoritative on the server.** Clients compute a live preview
   only. The server recomputes on submit in `backend/src/utils/duration.ts`.
2. **Midnight crossing**: if `endTime <= startTime`, add 24h (e.g. 20:00→00:00 = 4h).
   All three implementations (`backend/src/utils/duration.ts`,
   `web/src/utils/duration.ts`, `mobile/src/utils/duration.ts`) must agree.
3. **New OT is always `PENDING`.** Only admins change `approvalStatus`.
4. Deleting a Project **cascades**: it deletes that project's OtRequests in one
   transaction (`backend/src/routes/projects.ts`). The confirm dialog warns with
   the count.
5. **A user may edit their own OT request only while `PENDING`.** The backend
   rejects edits to reviewed requests (409).
6. **Optimistic concurrency on review.** Admins send the `version` they saw; if it
   no longer matches (the owner edited it meanwhile), the backend responds **409**
   with the current request. Clients must **warn + reload** instead of applying a
   stale approval. Every mutation (owner edit, admin review) increments `version`.

---

## 2. Auth model

- Web/mobile obtain a **Google ID token** and POST it to `/api/auth/google`.
- Backend verifies the token with `google-auth-library`, checks the email domain
  against `ALLOWED_EMAIL_DOMAINS`, upserts the user, and returns an app **JWT**.
- Clients store the JWT (`localStorage` on web, `expo-secure-store` on mobile)
  and send it as `Authorization: Bearer <token>`.
- **Admin = email in `ADMIN_EMAILS`** (env, comma-separated). `isAdmin` is derived
  and baked into the JWT + returned in the user object. There is no role column.
- The web `VITE_GOOGLE_CLIENT_ID`, mobile `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, and
  backend `GOOGLE_CLIENT_ID` **must be the same Web OAuth client id** (it is the
  ID-token audience the backend verifies).

---

## 3. REST API (the contract)

All routes are under `/api`. Auth required unless noted. Admin routes require an
admin JWT.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/google` | public | Exchange Google ID token → app JWT + user |
| GET | `/auth/me` | user | Current user |
| GET | `/projects` | user | Active projects (picker) |
| GET | `/projects/all` | admin | All projects incl. inactive + `otRequestCount` |
| POST | `/projects` | admin | Create project |
| PATCH | `/projects/:id` | admin | Rename / toggle active |
| DELETE | `/projects/:id` | admin | Delete project + its OT (returns `deletedOtRequests`) |
| POST | `/ot-requests` | user | Submit **array** of OT blocks (`{ requests: [...] }`) |
| PATCH | `/ot-requests/:id` | user (owner) | Edit own request — **PENDING only** (409 otherwise) |
| GET | `/ot-requests/mine` | user | My OT (`?month=YYYY-MM`) |
| GET | `/teamwork/task` | user | Look up a Teamwork task by `?url=` for OT auto-fill (`{ task, matchedProjectId }`); 503 if not configured |
| GET | `/admin/users` | admin | All users (filter pickers) |
| GET | `/admin/ot-requests` | admin | All OT (`?month=&status=&userId=&projectId=`) |
| GET | `/admin/summary` | admin | Per-user monthly totals (`?month=&projectId=&userId=`) |
| PATCH | `/admin/ot-requests/:id/review` | admin | Approve/reject (`{ status, expectedVersion, note? }`); **409 if stale** |
| GET | `/admin/ot-requests/export.xlsx` | admin | Download filtered month's OT as `.xlsx` (`?month=&status=&userId=&projectId=`) |
| GET | `/admin/settings` | admin | App settings (`{ emailOnOtSubmit }`) |
| PATCH | `/admin/settings` | admin | Update app settings (`{ emailOnOtSubmit? }`) |

**When you add or change an endpoint, update in the same commit:**
1. `backend/src/routes/*.ts` (+ `zod` validation),
2. `web/src/api/client.ts` and `mobile/src/api/client.ts`,
3. `web/src/types.ts` and `mobile/src/types.ts` if shapes changed,
4. this table.

---

## 4. Backend conventions (`backend/`)

- **TypeScript, CommonJS**, `tsc` build to `dist/`, `tsx` for dev. Node 18+.
- Layering: `index.ts` (app + middleware) → `routes/*.ts` (one router per resource)
  → `prisma.ts` (single `PrismaClient`). Auth in `auth/` (`tokens.ts` verify/sign,
  `middleware.ts` `requireAuth`/`requireAdmin`). Config in `config.ts` (reads env,
  exposes `isAllowedEmail` / `isAdminEmail`).
- **Every request body is validated with `zod`** before use. Return `400` with
  `{ error }` on invalid input.
- **Error responses are always `{ error: string }`** with an appropriate status
  (`400/401/403/404/409/500`). Clients read `error` (see `apiErrorMessage`).
- Recompute derived values server-side (never trust client-sent `durationHours`).
- Use `prisma.$transaction` for multi-step writes that must be atomic.
- **Notifications** go through `services/notifications.ts`. All senders are
  **fire-and-forget**: they never throw and are called with `void` *after* `res.json(...)`,
  so latency/failures never affect the response.
  - **Push** (OneSignal REST API): targeting is by OneSignal **external id = `User.id`**
    (the app calls `OneSignal.login(user.id)`). Submit OT (`POST /ot-requests`) → notify
    admins; review (`PATCH /admin/ot-requests/:id/review`) → notify the owner. Needs
    `ONESIGNAL_APP_ID` + `ONESIGNAL_KEY`; if unset, push is skipped.
  - **Email** (SMTP via `services/email.ts`, `nodemailer`): on submit OT, admins are also
    emailed **if** the `AppSetting.emailOnOtSubmit` toggle is on (admin-set in the web
    Settings tab). Email goes to `ADMIN_EMAILS` (minus the submitter). Needs `SMTP_HOST`/
    `SMTP_USER`/`SMTP_PASS` (+ `SMTP_PORT`/`SMTP_SECURE`/`SMTP_FROM`); if unset, email is
    skipped. Both push and email are triggered from the one `notifyAdminsOfNewOtRequest`.
- **Teamwork integration** (`services/teamwork.ts`, route `routes/teamwork.ts`): `GET
  /teamwork/task?url=` parses the task id from a Teamwork URL, calls the Teamwork REST v1
  API (`https://<TEAMWORK_DOMAIN>/tasks/<id>.json`, Basic auth with `TEAMWORK_API_TOKEN`),
  and returns normalized task fields (incl. `estimatedMinutes`) + `matchedProjectId` (our
  Project whose name equals the Teamwork project name, case-insensitive). Optional — returns 503 if env is unset. Note: the
  connected **Teamwork MCP** is only for Claude tooling, unrelated to this runtime endpoint.
- Env is documented in `backend/.env.example`; never hardcode secrets.

## 5. Web conventions (`web/`)

- **Vite + React 18 + TypeScript**, UI is **MUI v6** (`@mui/material`), date pickers
  via `@mui/x-date-pickers` + dayjs. Routing: `react-router-dom` v6.
- **Screen logic lives in `web/src/hooks/`** (`useOtLog`, `useAdminRequests`,
  `useAdminSummary`, `useAdminProjects`, `useAdminSettings`). Page/component files hold
  only rendering and **UI-only state** (dialog open/close, text inputs, active tab). Data
  fetching, mutations, validation, and toasts belong in the hook.
- The **Admin page** (`pages/AdminPage.tsx`) is tabbed; each tab is a component in
  `components/admin/` backed by a `useAdminX` hook (OT requests, Monthly summary,
  Projects, **Settings**). The Settings tab (`AdminSettingsTab` + `useAdminSettings`)
  toggles `AppSettings` (e.g. `emailOnOtSubmit`) via `/admin/settings`.
- **Exports** live on the Monthly summary tab (`useAdminSummary`):
  - **Summary CSV** — client-side via `utils/csv.ts` (`toCsv` + `downloadCsv`, UTF-8 BOM so
    Excel reads non-ASCII); `exportCsv()` dumps the per-user aggregate rows shown in the
    table (`ot-summary-<month>[-<project>].csv`). `utils/download.ts` (`downloadBlob`) is the
    shared file-download primitive.
  - **Excel (.xlsx)** — `exportExcel()` downloads `GET /admin/ot-requests/export.xlsx` as a
    blob. The workbook is built **server-side** (`backend/src/services/otExport.ts`, `exceljs`)
    in the "Resource management" layout: sheet = month (e.g. `Nov 2025`), row 1 = total in the
    Hour column, row 2 = `Date | ID | Name | Hour | Project`, rows 3+ = one OT entry each
    (`ID` = user email, since we have no employee codes). It exports **entries** (detailed),
    not the aggregate summary, and respects the month/project/user filters.
- **Toasts = `notistack`.** Get `enqueueSnackbar` via `useSnackbar()`; call
  `enqueueSnackbar(msg, { variant: 'success' | 'error' })`. `<SnackbarProvider>` is
  wired in `main.tsx`. **Do not** add inline `<Alert>` for transient/validation
  errors (inline `<Alert>` is fine only for persistent in-context notices like the
  delete-confirmation warning).
- API access only through `web/src/api/client.ts`. Use `apiErrorMessage(err, fallback)`
  for user-facing error text, and `isConflictError(err)` to detect the 409 stale-write
  case (show a `warning` toast + reload). Token helpers: `getToken`/`setToken`.
- Draft validation + request→draft conversion is shared in `web/src/hooks/otValidation.ts`
  (`draftToPayload`, `requestToDraft`) — reused by create (`useOtLog`) and edit
  (`EditOtDialog`). Editing a PENDING request uses `OtBlockCard` with a `label`.
- **Global loading overlay**: `contexts/LoadingContext.tsx` (`<LoadingProvider>` wired in
  `main.tsx`, `useLoading().withLoading(promise)`) shows an app-wide MUI `Backdrop` spinner
  while tracked async work runs. Use it for cross-cutting waits, not per-field spinners.
- **OtBlockCard** puts the task link field first; on blur, if it contains a Teamwork task
  URL (`utils/teamwork.ts` `extractTeamworkTaskUrl`), `hooks/useTeamworkAutofill` fetches the
  task under the global overlay and fills the task text + matched project. The task's time
  **estimate** is carried on the draft as `estimatedHours` (not submitted) and shown as the
  Duration chip hint (labeled "(est.)") while start/end are empty; `workDate`/`startTime`/
  `endTime` stay for the user to fill, and once both times are set the chip shows the real
  computed duration.
- Rendering an OT request's task text goes through the shared `web/src/components/TaskCell.tsx`
  (`<TaskCell text={r.taskLink} />`): it linkifies the first URL and truncates long text
  with a "View all" / "Show less" toggle. Reused by My OT history (`HomePage`) and the admin
  views (`AdminRequestsTab`, `UserOtDialog`) — don't re-inline linkify in those tables.
- Auth state via `useAuth()` (`web/src/auth/AuthContext.tsx`).
- Env vars are `VITE_*` (see `web/.env.example`).
- Favicons/app icons live in `web/public/` (`favicon.svg`, `favicon.png` 32px,
  `apple-touch-icon.png` 180px) and are linked from `index.html` (+ `theme-color` `#2E7D32`).
  The brand mark is the green **"OT" clock monogram** (clock = "O"), shared with
  `mobile/`'s master logo — keep the two apps' icons visually consistent.

## 6. Mobile conventions (`mobile/`)

- **Expo SDK 57, RN 0.86, React 19, TypeScript.** UI is **react-native-paper (MD3)**.
  Navigation: `@react-navigation/native-stack`. Date/time via
  `@react-native-community/datetimepicker` (wrapped in `components/PickerField`).
  Paper `icon="..."` props are **Material Community Icons**, rendered via
  **`@expo/vector-icons`** (paper auto-detects it) — it must stay installed or every
  icon throws "none of the required icon libraries are installed".
- **Requires a dev/EAS build, not Expo Go** (native modules: Google Sign-In,
  OneSignal, hot-updater).
- **Screen logic lives in `mobile/src/hooks/`** (`useOtLog`, `useAdminRequests`,
  `useAdminSummary`, `useAdminProjects`, `useUserOt`). Screens hold only rendering +
  UI-only state (dialogs, inputs, active tab, `navigation.setOptions`).
- **Toasts = `react-native-toast-message`** via the helpers in
  `mobile/src/utils/toast.ts` (`showError` / `showSuccess` / `showInfo`). The
  `<Toast />` host is rendered once in `App.tsx`. Use toasts for transient errors;
  a full-screen load error (e.g. `UserOtScreen`) may stay inline.
- API access only through `mobile/src/api/client.ts` (+ `apiErrorMessage`,
  `isConflictError` for the 409 stale-write case → info toast + reload). JWT is kept
  in memory for the axios interceptor and persisted in `expo-secure-store`.
- Shared draft validation/conversion in `mobile/src/hooks/otValidation.ts`
  (`draftToPayload`, `requestToDraft`), reused by `useOtLog` and `EditOtModal`
  (edits a PENDING request via `OtBlockCard` with a `label`).
- **Global loading overlay**: `contexts/LoadingContext.tsx` (`<LoadingProvider>` wired in
  `App.tsx` inside `PaperProvider`, `useLoading().withLoading(promise)`) shows a full-screen
  `Portal` spinner while tracked async work runs. Mirrors the web provider.
- **OtBlockCard** puts the task link field first; on blur, if it contains a Teamwork task URL
  (`utils/teamwork.ts`), `hooks/useTeamworkAutofill` fetches the task under the global overlay
  and fills the task text + matched project. The task's time estimate is carried as
  `estimatedHours` (not submitted) and shown as the Duration hint while start/end are empty;
  times stay manual. Same behavior as web.
- Config comes from `EXPO_PUBLIC_*` env via `mobile/src/config.ts`.
  Native plugin config (OneSignal, Google iOS scheme, hot-updater channel) is in
  `app.config.ts`.
- Branding assets live in `mobile/assets/` and are wired in `app.config.ts`:
  `icon.png` (1024, full-bleed, no alpha → `icon`), `adaptive-icon.png` (Android
  foreground, transparent, also reused as `monochromeImage`) + `adaptive-icon-bg.png`
  (gradient background), and `splash-icon.png` (shown by the **`expo-splash-screen`**
  plugin, `resizeMode: 'contain'`, `backgroundColor: '#256B2A'`). `favicon.png` (48px)
  is the Expo-web favicon; `notification-icon.png` is available for push. The master
  artwork is `offspring-ot-tracker-1024.png`; all sizes share the green **"OT" clock
  monogram** — keep them consistent if you change the brand mark.
- OTA: `App.tsx` is wrapped with `HotUpdater.wrap({ baseURL, updateStrategy: 'appVersion' })`.
  OTA updates ship JS/asset changes only; native changes need a new build.
- Push: `initOneSignal()` on launch (`services/onesignal.ts`); `OneSignal.login(user.id)`
  after sign-in so the backend can target by external id = user id. The **sending** side
  lives in the backend (`backend/src/services/notifications.ts`) — see §4. The app just
  needs to be signed in (external id registered) to receive them.
- **Notification tap → navigation**: the backend attaches a `data` payload
  (`{ type: 'ot_reviewed' | 'ot_submitted', otRequestId? }`). `onesignal.ts`'s `click`
  listener routes on `type`: `ot_reviewed` → `Home` (History tab, highlights the OT via
  the `focusRequestId` param), `ot_submitted` → `Admin`. Navigation from this non-React
  handler goes through `navigation/navigationRef.ts` (`navigateWhenReady`), which queues
  the target if the app cold-started and flushes it on `NavigationContainer` `onReady`.

## 7. Shared conventions (all TS code)

- **Naming**: hooks `useX`, components/screens `PascalCase`, API functions
  `verbNoun` (`fetchProjects`, `submitOtRequests`, `reviewOtRequest`).
- **Types mirror the API**; keep `web/src/types.ts` and `mobile/src/types.ts` in sync
  with backend shapes. Mobile encodes enums as string unions matching backend enums.
- Prefer small, single-purpose functions. Keep the midnight/duration/date-format
  helpers in each `utils/duration.ts`; don't inline date math in components.
- Primary brand color is **`#2E7D32`** (green); secondary `#1565C0`. Approval colors:
  approved green, pending `#ED6C02`, rejected `#C62828`.

## 8. Running & verifying

- **Backend**: `cd backend && npm run dev` (needs PostgreSQL; `docker compose up -d`
  from repo root starts one). Migrate with `npm run prisma:migrate`, seed with
  `npm run db:seed`.
- **Web**: `cd web && npm run dev` → http://localhost:5173. Typecheck: `npm run typecheck`.
- **Mobile**: `cd mobile && npx expo run:android|ios` (dev build). Typecheck:
  `npx tsc --noEmit`. Align native deps with `npx expo install --fix`.
- **Before finishing any change, typecheck the affected app(s)** and keep them green:
  - backend: `npx tsc --noEmit`
  - web: `npx tsc --noEmit`
  - mobile: `npx tsc --noEmit`

## 9. Rules for Claude (follow on every change)

1. **Read this file first.** Before editing any code, re-read the relevant sections
   here and follow the established patterns (hooks for logic, toasts for transient
   errors, `apiErrorMessage`, zod validation, `{ error }` responses, string
   `workDate`, server-authoritative duration).
2. **Respect the cross-cutting contracts.** A change to the domain model or an API
   endpoint must be applied consistently across backend + web + mobile + this guide
   (see §1 and §3).
3. **Keep logic in hooks.** New screen/page behavior goes in a `useX` hook under the
   app's `hooks/` folder; components stay presentational + UI-only state.
4. **Match the toast conventions** per platform (notistack on web, the `utils/toast`
   helpers on mobile). Don't reintroduce inline error banners for transient errors.
5. **Typecheck before declaring done** (`tsc --noEmit`) for each app you touched.
6. **Update this guide** in the same change whenever you: add/change an endpoint,
   change the data model, add a screen/hook, change a library or convention, or add
   an env var. Keep the tables in §1 and §3 accurate.
7. If you find the code and this guide disagree, treat it as a bug: reconcile them
   and note what you changed.

## 10. Deployment (production)

The three apps deploy independently. Local dev (§8) is unchanged; production just
points every client at the deployed backend URL and locks CORS/OAuth to real domains.

**Backend → Railway** (`backend/railway.json`). Root directory = `backend`. Railway
injects `PORT` (already read by `config.ts`). Build runs `npm run build` (a
`postinstall` runs `prisma generate`); start runs `npm run prisma:deploy` (applies
migrations) then `npm run start`. Add a Railway **PostgreSQL** plugin and set
`DATABASE_URL` to its connection string. Set all env from `backend/.env.example`,
notably `CORS_ORIGIN=<web production URL>` (comma-separated if more than one),
`GOOGLE_CLIENT_ID`, a strong `JWT_SECRET`, `ALLOWED_EMAIL_DOMAINS`, `ADMIN_EMAILS`.

**Web → Vercel** (`web/vercel.json`, SPA rewrite to `/index.html`). Root directory =
`web`. Set build-time env `VITE_API_BASE_URL=<Railway backend URL>` and
`VITE_GOOGLE_CLIENT_ID`. Vite inlines `VITE_*` at build, so changing the API URL
requires a redeploy.

**Google OAuth** (Cloud Console → the Web client): add the Vercel origin to
**Authorized JavaScript origins**, or web sign-in fails. Android native sign-in needs
the release keystore's **SHA-1** registered on the Android OAuth client.

**Mobile APK → local build.** `mobile/eas.json` defines a `preview` profile
(`android.buildType: apk`). Fill `mobile/.env` from `mobile/.env.example` with
`EXPO_PUBLIC_API_BASE_URL=<Railway backend URL>` (a device needs the public URL, not
`localhost`/`10.0.2.2`). Build the APK with `npx expo prebuild -p android` then
`cd android && ./gradlew assembleRelease` (output in
`android/app/build/outputs/apk/release/`), or `eas build --local -p android --profile preview`.
A release APK must be signed (generate a keystore once and wire it into
`android/gradle.properties`).

**Env-var cross-check** (must match, all three): the Google **Web** client id is
`GOOGLE_CLIENT_ID` (backend) = `VITE_GOOGLE_CLIENT_ID` (web) =
`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (mobile). Backend `CORS_ORIGIN` must include the
web origin. `VITE_API_BASE_URL` and `EXPO_PUBLIC_API_BASE_URL` both point at the
backend URL with **no** trailing slash and **no** `/api` suffix (clients append `/api`).
```
