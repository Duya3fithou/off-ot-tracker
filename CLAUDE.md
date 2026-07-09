# CLAUDE.md

**Before making any change in this repository, read [`guide.md`](./guide.md) first**
and follow the conventions and cross-cutting contracts described there
(domain model, REST API contract, auth model, hooks-for-logic pattern, toast
conventions, error handling, and per-app rules).

Workflow for every change:

1. **Read `guide.md`** (especially the sections relevant to what you're editing).
2. **Follow the existing rules** — do not invent new patterns when a documented one
   exists. Key ones: screen logic lives in `useX` hooks; transient errors use toasts
   (notistack on web, `src/utils/toast` on mobile); all API access goes through
   `src/api/client.ts`; backend validates with `zod` and returns `{ error }`;
   `workDate` is a `YYYY-MM-DD` string; OT `durationHours` is computed server-side.
3. **Keep the three apps in sync** — a domain-model or API-endpoint change must be
   applied across `backend/`, `web/`, and `mobile/` (and their `types.ts`).
4. **Typecheck** the app(s) you touched: `npx tsc --noEmit`.
5. **Update `guide.md`** in the same change whenever a convention, endpoint, data
   shape, screen/hook, dependency, or env var changes. If code and `guide.md`
   disagree, reconcile them and note the fix.

`guide.md` is the single source of truth; this file only points to it and enforces
the read-first / update-after habit.
