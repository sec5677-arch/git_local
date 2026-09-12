# Phase 1 Data Model: Ticket Creation (POST /api/tickets)

## Entity: Ticket

Source of truth for shape/constraints: `docs/API_SPEC.md` §1 and the existing
Drizzle table at `src/server/db/schema.ts` (unchanged by this feature).

| Field | Type | Required on create | Constraint | Default when omitted | Set by |
|---|---|---|---|---|---|
| `id` | number | — (system) | serial primary key | — | system |
| `title` | string | Yes | 1–200 chars, not whitespace-only | — | user |
| `description` | string \| null | No | ≤1000 chars | `null` | user |
| `status` | `'BACKLOG' \| 'TODO' \| 'IN_PROGRESS' \| 'DONE'` | — (system) | fixed on create | `'BACKLOG'` | system (always, ignores input) |
| `priority` | `'LOW' \| 'MEDIUM' \| 'HIGH'` | No | must be one of the enum values | `'MEDIUM'` | user or system default |
| `position` | number (int) | — (system) | integer | `min(existing BACKLOG positions ?? 0) - 1024` | system |
| `plannedStartDate` | string (`YYYY-MM-DD`) \| null | No | date-format regex | `null` | user |
| `dueDate` | string (`YYYY-MM-DD`) \| null | No | date-format regex, `>= today` | `null` | user |
| `startedAt` | timestamp \| null | — (system) | — | `null` | system |
| `completedAt` | timestamp \| null | — (system) | — | `null` | system |
| `createdAt` | timestamp | — (system) | — | now | system |
| `updatedAt` | timestamp | — (system) | — | now | system |

**Status enum and priority enum** are reused from the existing
`TICKET_STATUS` / `TICKET_PRIORITY` constants in `src/shared/constants.ts` —
not redefined by this feature.

## Types (`src/shared/types/ticket.ts`, new)

- `CreateTicketInput` — inferred via `z.infer<typeof createTicketSchema>`
  (from `src/shared/validations/ticket.ts`). Do not hand-write a parallel
  interface; infer it so the type and the runtime validation can never drift
  (Constitution II).
- `Ticket` — the full row shape returned in the API response, matching the
  table above. Derived from the Drizzle table's inferred select type
  (`typeof tickets.$inferSelect`) re-exported under this project's naming, so
  the DB schema stays the single source of truth for the persisted shape.

## State / lifecycle note

This feature only covers creation, which always produces a ticket in a fixed
initial state: `status = BACKLOG`, `startedAt = null`, `completedAt = null`.
Transitions out of this state (move to `TODO`/`IN_PROGRESS`/`DONE`, setting
`startedAt`/`completedAt`) belong to other endpoints
(`PATCH /api/tickets/:id`, `PATCH /api/tickets/:id/complete`,
`PATCH /api/tickets/reorder`) and are out of scope here.

## Relationships

None — `tickets` has no foreign keys or related entities in the current
schema. This feature does not introduce any.
