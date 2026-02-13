# Technical Architecture: Option C (Local-first + Remote Fallback)

## Stack

- Svelte 5 + SvelteKit 2.x client and server routes
- Supabase Postgres for persistence
- TailwindCSS for styling
- Anonymous collaboration via unguessable share-token links

## Security and access model

- Each list has a high-entropy `share_token`.
- All reads/writes are routed through SvelteKit server endpoints.
- Endpoints resolve `share_token -> list_id` and enforce access by token.
- Supabase service-role credentials remain server-only.

## Core data model

- `lists(id, title, share_token, created_at, updated_at)`
- `notes(id, list_id, title, body, created_at, updated_at)`
- `note_items(id, note_id, raw_text, normalized_text, quantity, category, emoji, source, created_at, updated_at)`
- `item_assignments(normalized_text, category, emoji, confidence, source, updated_at)`
- optional `assignment_corrections(...)` for audit/debug

## Assignment pipeline

1. Normalize user text (canonical text + optional quantity extraction).
2. Exact cache lookup in `item_assignments`.
3. Fuzzy lookup (recommended: Postgres `pg_trgm`).
4. Remote fallback AI only for low-confidence unknowns.
5. Persist fallback results to `item_assignments`.
6. Treat user corrections as high-confidence assignment upserts.

## Collaboration

- MVP default: optimistic UI + polling by `updated_at` every 2–5s.
- Optional enhancement: Supabase Realtime subscriptions.

## Cost and abuse controls

- Cache-first strategy with global assignment memory.
- Batch unknown items in single fallback calls.
- Confidence threshold to reduce remote usage.
- Daily quota/caps and rate limiting on fallback endpoint.

## Delivery phases

1. Foundation: DB + token-gated server routes.
2. CRUD + share links.
3. Analyzer v1 (normalize + cache + fuzzy).
4. Remote fallback with result caching.
5. User corrections feedback loop.
6. Collaboration polish.
7. Hardening (observability/perf/cost/abuse controls).


## Controlled taxonomy

- Use the shared 24-category enum defined in `src/lib/server/taxonomy.ts`.
- Seed initial category/emoji memory from `data/starter-item-assignments.v1.json`.
