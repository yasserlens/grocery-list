# Grocery List MVP

This repository contains a starter technical plan and baseline artifacts for a **SvelteKit + Supabase** grocery-list MVP that uses **anonymous share tokens** and an **item assignment cache** for low-cost category/emoji analysis.

## Included artifacts

- `docs/technical-architecture.md`: implementation blueprint and phase plan.
- `docs/implementation-expansion.md`: deeper API, sync, validation, observability, and rollout guidance.
- `supabase/migrations/0001_initial_schema.sql`: initial Postgres schema and indexes.
- `data/starter-item-assignments.v1.json`: starter category/emoji assignment dataset.
- `supabase/seeds/0001_item_assignments_starter.sql`: idempotent seed upsert for `item_assignments`.
- `src/lib/server/normalize-item.ts`: deterministic item normalization utility.
- `src/lib/server/taxonomy.ts`: stable category taxonomy and category emoji fallback.
- `src/routes/api/lists/[token]/+server.ts`: sample token-validated list endpoint pattern.

## Notes

This repo currently focuses on architecture + backend primitives so engineering can start implementation quickly.


## Local development

1. Install dependencies: `npm install`
2. Copy env template: `cp .env.example .env`
3. Start dev server: `npm run dev -- --open`
4. Typecheck app: `npm run check`

> Current implementation runs **without Supabase** using an in-memory store for local testing. Supabase is only needed when replacing the mock store with real DB wiring.


## Implemented API routes

- `POST /api/lists`
- `GET|PATCH /api/lists/:token`
- `GET|POST /api/lists/:token/notes`
- `GET|PATCH|DELETE /api/lists/:token/notes/:noteId`
- `GET|POST /api/lists/:token/notes/:noteId/items`
- `PATCH|DELETE /api/lists/:token/notes/:noteId/items/:itemId`
- `POST /api/lists/:token/items/analyze`
- `POST /api/lists/:token/items/:itemId/correct`

## Implemented UI routes

- `/` create list flow
- `/l/:token` shared list page with notes + items


## Local smoke test (no Supabase)

1. Start server: `npm run dev:host`
2. In another terminal: `npm run smoke:routes`

This validates list creation, token lookup, item creation, and batch analyze endpoints against the local in-memory backend.


- Health endpoint: `GET /api/health`
