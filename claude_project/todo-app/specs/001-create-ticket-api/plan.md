# Implementation Plan: Ticket Creation (POST /api/tickets)

**Branch**: `001-create-ticket-api` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-create-ticket-api/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Implement `POST /api/tickets` exactly as documented in `docs/API_SPEC.md` §1: a
Next.js App Router Route Handler that validates the request body with a shared
Zod schema, delegates ticket creation (status/position defaulting, timestamps)
to a service-layer function, persists via the existing Drizzle `tickets`
table, and returns 201 with the created ticket or 400 with
`{ error: { code, message } }` on validation failure — per the user's request,
Zod validation, the Route Handler, and the Service layer are kept in three
separate files with no business logic in the handler.

## Technical Context

**Language/Version**: TypeScript 5.x, strict mode (`tsconfig.json` `"strict": true`)

**Primary Dependencies**: Next.js 15.1 (App Router Route Handlers), Zod 3.24, Drizzle ORM 0.38 + `postgres` driver

**Storage**: PostgreSQL via the existing Drizzle schema at `src/server/db/schema.ts` (`tickets` table already has every field this endpoint needs — no migration required)

**Testing**: Jest 29 (`next/jest` preset), tests under `__tests__/`, `@jest-environment node` for server-side units (see `__tests__/services/sample.test.ts` for the existing convention)

**Target Platform**: Server-side Node runtime under Next.js (Route Handler), single-process MVP deployment

**Project Type**: Web application, single Next.js codebase (no separate frontend/backend repos — `app/` for routes, `src/server/` for backend logic, `src/shared/` for code used by both)

**Performance Goals**: No explicit target in `docs/API_SPEC.md`; MVP/single-user scale, so no special performance work beyond avoiding obviously wasteful queries (N+1s, full-table scans for the position lookup)

**Constraints**: No authentication (per `docs/API_SPEC.md` header — MVP, single user); must not deviate from the documented request/response/error shapes

**Scale/Scope**: Single endpoint (`POST /api/tickets`), MVP/single-user data volume

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | This plan |
|---|---|---|
| I. Specification-Driven Development | Spec precedes implementation | `spec.md` (derived from the ratified `docs/API_SPEC.md`) exists and is the input to this plan |
| II. Type Safety (NON-NEGOTIABLE) | `strict` TS, no `any`, no commit without typecheck | All new files typed explicitly; Zod's inferred types used end-to-end so request/response types are never hand-duplicated |
| III. Contract-First API Design | Match `docs/API_SPEC.md` exactly | Route Handler, Zod schema, and response shape are all taken verbatim from `docs/API_SPEC.md` §1 |
| IV. Validated Inputs, Safe Outputs | Zod validation on all input | `createTicketSchema` (Zod) validates the full body before the service layer runs |
| V. Separation of Concerns | Business logic in service layer | `src/server/services/ticket.service.ts` owns status/position/timestamp defaulting; `app/api/tickets/route.ts` only parses, validates, calls the service, and shapes the HTTP response |
| VI. Test-Driven Development | Tests before implementation | `/speckit-tasks` will order schema + service + route tests before their implementations (see `quickstart.md` for the scenarios those tests must cover) |
| VII. Documentation First (NON-NEGOTIABLE) | Check official docs before implementing | `research.md` records the Next.js Route Handler and Drizzle aggregate-query approaches confirmed against current framework conventions |
| Architecture: Single Source of Truth | Types in `src/shared/types/`, validation in `src/shared/validations/`, business logic in `src/server/services/`, DB schema in `src/server/db/schema.ts` | Followed exactly; DB schema is reused unchanged |
| Architecture: No Direct DB Access from Frontend | All data access through the API | N/A to this feature (server-only), but the Route Handler is the only caller of the service, and the service is the only caller of `db` |

**Result (pre-design)**: PASS — no violations, no entries needed in Complexity Tracking.

**Result (post Phase 1 re-check)**: PASS — `data-model.md`, `contracts/post-tickets.md`,
and `quickstart.md` keep the same file layout and separation described above;
no new dependency, cross-boundary reference, or schema change was introduced
during design.

## Project Structure

### Documentation (this feature)

```text
specs/001-create-ticket-api/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── post-tickets.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
app/
└── api/
    └── tickets/
        └── route.ts              # NEW - Route Handler: parse → validate → call service → respond

src/
├── server/
│   ├── db/
│   │   ├── schema.ts             # EXISTING - tickets table, unchanged (already matches this entity)
│   │   └── index.ts              # EXISTING - drizzle client + tickets export, unchanged
│   └── services/
│       └── ticket.service.ts     # NEW - createTicket(): status/position/timestamp defaulting, db insert
└── shared/
    ├── constants.ts              # EXISTING - TICKET_STATUS, TICKET_PRIORITY (reused, not duplicated)
    ├── types/
    │   └── ticket.ts             # NEW - Ticket type, inferred from Zod schema + db row
    └── validations/
        └── ticket.ts             # NEW - createTicketSchema (Zod), matches docs/API_SPEC.md exactly

__tests__/
└── services/
    └── ticket.service.test.ts    # NEW - unit tests for defaulting/position logic (node env, mocked db)
```

**Structure Decision**: This is a single Next.js (App Router) codebase, not a
multi-package project, so none of the template's generic Option 1/2/3 layouts
apply as-is. The concrete tree above follows the constitution's existing
`app/` (routes) · `src/server/` (backend-only) · `src/shared/` (used by both
server and future client code) split, and reuses the DB layer that already
exists — this feature adds a service, a shared schema/type, and one route
file, nothing else.

## Complexity Tracking

*No violations — Constitution Check passed cleanly. Table intentionally omitted.*
