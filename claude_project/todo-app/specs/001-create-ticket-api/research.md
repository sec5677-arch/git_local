# Phase 0 Research: Ticket Creation (POST /api/tickets)

No `NEEDS CLARIFICATION` markers were left in the Technical Context — the
existing `docs/API_SPEC.md` contract, the constitution, and the current
repository layout (`src/server/db/schema.ts`, `src/shared/constants.ts`,
`app/` App Router, Jest setup) fully determine the approach. This document
records the decisions taken and the alternatives ruled out.

## 1. Route placement: Next.js App Router Route Handler

- **Decision**: Add `app/api/tickets/route.ts` exporting an async `POST`
  function, per current Next.js (15.x) Route Handler conventions.
- **Rationale**: The project already uses the App Router (`app/layout.tsx`,
  `app/page.tsx` exist; there is no `pages/` directory), so Route Handlers are
  the framework-supported way to add an API endpoint. This also keeps routing
  colocated with other `app/` routes.
- **Alternatives considered**: Pages Router API routes (`pages/api/*`) —
  rejected, the project has no `pages/` directory and mixing routers adds
  complexity with no benefit.

## 2. Request validation: shared Zod schema

- **Decision**: Define `createTicketSchema` in `src/shared/validations/ticket.ts`
  using the exact rules and messages already specified in `docs/API_SPEC.md`
  §"검증 스키마 (Zod)" (title 1-200 chars + trim check, description ≤1000,
  priority enum, date-format regex, `dueDate >= today`).
- **Rationale**: `docs/API_SPEC.md` states this schema is meant to be shared
  between frontend and backend from `src/shared/validations/ticket.ts` — the
  constitution's Single Source of Truth rule places validation schemas there.
  Reusing the documented schema verbatim guarantees the error `code`/`message`
  pairs match the contract exactly (Constitution III, IV).
- **Alternatives considered**: Inlining validation in the route handler —
  rejected, violates Separation of Concerns and cannot be reused by a future
  form.

## 3. Business logic placement: service layer function

- **Decision**: `src/server/services/ticket.service.ts` exports
  `createTicket(input: CreateTicketInput): Promise<Ticket>`, which computes
  `status = 'BACKLOG'`, looks up the current minimum Backlog `position`,
  defaults `priority` to `MEDIUM` when omitted, and inserts the row via the
  existing Drizzle `db`/`tickets` export from `src/server/db`.
- **Rationale**: Constitution V (Separation of Concerns) and the user's
  explicit instruction require business logic out of the route handler.
- **Alternatives considered**: Doing the insert directly in the route handler
  — rejected per constitution and user instruction.

## 4. "Top of Backlog" position calculation

- **Decision**: Query `MIN(position)` from `tickets` where `status = 'BACKLOG'`
  using a Drizzle aggregate (`db.select({ min: sql\`min(${tickets.position})\` })...`),
  then use `(min ?? 0) - 1024` as the new ticket's position.
- **Rationale**: Matches the documented rule (`position = min(position) - 1024`)
  and the documented example (first ticket in an empty Backlog gets `-1024`,
  implying a `0` base) recorded as an assumption in `spec.md`.
- **Alternatives considered**: Fetching all Backlog rows and computing `min`
  in application code — rejected as an unnecessary full-column fetch when the
  database can do the aggregate directly; also less correct under concurrent
  writes than pushing the computation into a single query.
- **Known limitation (out of scope for this feature)**: Two concurrent
  creation requests could both read the same `MIN` before either insert
  completes, in principle producing a `position` collision. `docs/API_SPEC.md`
  does not specify locking/transaction behavior for this case, and the
  feature spec's MVP/single-user scope makes this acceptable for now. Not
  addressed here; flag for a future feature if multi-user concurrent editing
  is added.

## 5. Error response shape

- **Decision**: On Zod validation failure, map the first failing issue to
  `{ error: { code: 'VALIDATION_ERROR', message } }` with HTTP 400, using the
  `message` already carried by the Zod issue (the schema's custom messages
  already match `docs/API_SPEC.md`'s table verbatim). Unexpected exceptions
  are caught and returned as `{ error: { code: 'INTERNAL_ERROR', message } }`
  with HTTP 500.
- **Rationale**: Matches `docs/API_SPEC.md` §"공통 규칙" exactly; no new error
  codes are introduced.
- **Alternatives considered**: A generic error-formatting middleware/wrapper —
  rejected as unnecessary abstraction for a single endpoint (YAGNI); revisit
  if a second endpoint needs the same mapping.

## 6. Testing approach

- **Decision**: Unit-test `createTicketSchema` (valid input, each documented
  invalid case) and `ticket.service.createTicket` (defaulting, position
  math) with Jest in `@jest-environment node`, following the existing
  `__tests__/services/sample.test.ts` convention. The service test mocks the
  Drizzle `db` module (no real Postgres needed for these units). Route-level
  behavior (status codes, response envelope) is verified in `quickstart.md`
  as a manual/curl-driven check for this feature; an automated route test can
  be added as a task if `/speckit-tasks` scopes one in.
- **Rationale**: Constitution VI (TDD) requires tests before implementation;
  mocking `db` keeps unit tests fast and independent of a running database,
  consistent with the existing test suite's pattern.
- **Alternatives considered**: Spinning up a real test Postgres for every
  unit test — rejected as heavier than needed for this MVP endpoint; can be
  revisited if integration tests are explicitly requested later.
