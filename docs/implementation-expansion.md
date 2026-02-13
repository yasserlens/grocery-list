# Implementation Expansion Guide (Option C)

This document expands the initial architecture with practical implementation details that can be directly turned into tickets.

## 1) API surface (server-routed only)

Use token-scoped endpoints and keep all Supabase writes in server routes.

### Lists

- `POST /api/lists`
  - Creates list + generated `share_token`
  - Response: `{ listId, shareToken, shareUrl }`
- `GET /api/lists/:token`
  - Resolves token and returns list metadata + basic aggregates
- `PATCH /api/lists/:token`
  - Update title

### Notes

- `GET /api/lists/:token/notes`
- `POST /api/lists/:token/notes`
- `PATCH /api/lists/:token/notes/:noteId`
- `DELETE /api/lists/:token/notes/:noteId`

### Items

- `GET /api/lists/:token/notes/:noteId/items?since=<iso-ts>`
  - Incremental fetch by `updated_at`
- `POST /api/lists/:token/notes/:noteId/items`
- `PATCH /api/lists/:token/notes/:noteId/items/:itemId`
- `DELETE /api/lists/:token/notes/:noteId/items/:itemId`
- `POST /api/lists/:token/items/analyze`
  - Batch analysis for unknown/low-confidence items

### Corrections

- `POST /api/lists/:token/items/:itemId/correct`
  - Saves corrected category/emoji
  - Upserts high-confidence assignment cache entry

## 2) Token + authorization mechanics

Recommended token policy:

- 32-byte entropy minimum (base64url or hex)
- Never expose list IDs in URL
- Constant-time token equality when comparing in app code
- Uniform error response (`404`) for invalid token to reduce probing signal

Suggested helper flow:

1. Validate format and length
2. `select id from lists where share_token = $1`
3. If not found, return `404`
4. Continue with list-scoped query by `list_id`

## 3) Validation contracts

Define zod schemas for all payloads:

- `createNote`: `title` (1..120 chars)
- `createItem`: `rawText` (1..160 chars)
- `correctItem`: constrained `category` enum + `emoji` single grapheme

Additional validation:

- Trim and normalize all user text server-side
- Reject oversized batch analyze requests (e.g., max 100 items)
- Enforce category enum from taxonomy only

## 4) Analyzer confidence policy

Use explicit confidence tiers so behavior is deterministic.

- **Tier A (>=0.95):** exact cache match in `item_assignments`
- **Tier B (0.80–0.94):** fuzzy match accepted automatically
- **Tier C (<0.80):** remote fallback candidate

Operational rules:

- Always include `source` + `confidence` on writes to `note_items`
- Batch remote calls per note save cycle
- Upsert remote results in `item_assignments`
- Corrections overwrite prior assignment with `source=correction`, `confidence=1.0`

## 5) Sync protocol details (polling)

MVP recommendation:

- client keeps `lastSyncedAt`
- poll every 3 seconds while visible, 10–15 seconds when hidden
- API returns items changed since timestamp + tombstones for deletions
- conflict handling: last-write-wins by server `updated_at`

UX considerations:

- show non-blocking “updated by another editor” toast
- avoid cursor jumps while user is actively typing

## 6) IndexedDB storage design

Use three object stores:

1. `assignment_cache`
   - key: `normalized_text`
   - value: `{ category, emoji, confidence, source, updatedAt }`
2. `list_snapshots`
   - key: `share_token`
   - value: denormalized latest payload for fast boot
3. `pending_mutations`
   - key: auto-increment id
   - value: `{ type, endpoint, payload, createdAt, retryCount }`

Retry strategy:

- exponential backoff with jitter
- dead-letter after N retries and surface in UI

## 7) Observability + SLIs

Track baseline metrics:

- API p95 latency by endpoint
- analyze cache hit rate (`exact`, `fuzzy`, `remote`)
- remote fallback calls/day and spend estimate
- correction rate per 100 analyzed items
- sync lag (server now - client lastSyncedAt)

Alert candidates:

- remote fallback > daily quota
- token 404 spike (enumeration attempt)
- mutation failure rate above threshold

## 8) Abuse and rate limiting

Minimum controls:

- per-IP rate limit on write endpoints
- stricter limit on `/items/analyze`
- daily global remote-call budget
- request body limits and endpoint timeout caps

Graceful degradation:

- if remote budget exhausted, use category fallback emoji and return `source=fallback_budget_cap`

## 9) Testing strategy by layer

### Unit

- normalization edge cases (quantities, punctuation, pluralization)
- taxonomy/category validation
- confidence threshold branching logic

### Integration

- token resolution and list scoping
- CRUD with invalid token, wrong note/list association
- correction upsert updates `item_assignments`

### E2E

- create list -> share link -> second browser edits -> first sees sync
- unknown item triggers remote fallback mock and cache persistence
- offline mutation queue replay after reconnect

## 10) Rollout plan and migration safety

- deploy schema first, app second
- feature-flag remote fallback path
- start with conservative thresholds, tune with observed correction rate
- add migration rollback notes for each schema change

## 11) Backlog-ready tickets (example)

1. Build token resolver utility + endpoint middleware wrapper
2. Implement notes/items CRUD with strict list-note ownership checks
3. Add analyzer service with exact+fuzzy lookup and confidence policy
4. Add remote fallback adapter interface (provider-agnostic)
5. Add correction flow + high-confidence upsert
6. Add polling sync with incremental since cursor
7. Add IndexedDB stores + queued mutation replay
8. Add rate limiting and daily remote budget guard
9. Add metrics/logging fields on analyze pipeline
10. Add unit/integration/e2e baseline suites

## 12) Starter dataset and seeding workflow

Included artifacts:

- `data/starter-item-assignments.v1.json`: canonical item -> `{ category, emoji }`
- `supabase/seeds/0001_item_assignments_starter.sql`: idempotent upsert seed script

Seed conventions:

- keys are normalized lowercase singular item names
- `source` should be `seed_v1`
- seed confidence defaults to `0.95`
- use `on conflict (normalized_text) do update` for repeatable deploys

Planned next expansions:

1. alias table (`item_aliases`) for UK/US and brand variations
2. misspelling lexicon for high-frequency typos
3. locale overlays (regional products)
4. category drift reports from correction logs
