# Feature Specification: Ticket Creation (POST /api/tickets)

**Feature Branch**: `001-create-ticket-api`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "API_SPEC.md의 POST /api/tickets 명세를 확인하고 구현에 필요한 요구사항을 정리해줘"

**Source of truth**: `docs/API_SPEC.md` §1 (POST /api/tickets), §"공통 규칙" (에러 응답 형식, HTTP 상태 코드, 에러 코드 정의), §"검증 스키마 (Zod)" (CreateTicketInput). This spec organizes those already-approved contract details into implementation requirements; it does not introduce new API behavior.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a new ticket with just a title (Priority: P1)

A user adds a new task to their board by providing only a title. The ticket is
created and placed at the top of the Backlog column with sensible defaults for
everything else.

**Why this priority**: This is the minimum viable action for the whole board —
nothing else in the app is useful until tickets can be created.

**Independent Test**: Send a creation request with only `title` set; verify a
ticket is returned with `status: BACKLOG`, `priority: MEDIUM`, and it appears
above any previously-existing Backlog tickets.

**Acceptance Scenarios**:

1. **Given** the Backlog column is empty, **When** a ticket is created with
   only a `title`, **Then** the response is 201 with `status: BACKLOG`,
   `priority: MEDIUM`, `plannedStartDate: null`, `dueDate: null`,
   `startedAt: null`, `completedAt: null`, and both `createdAt`/`updatedAt`
   set to the creation time.
2. **Given** the Backlog column already has tickets, **When** a new ticket is
   created, **Then** its `position` is lower than every existing Backlog
   ticket's position (it sorts to the top).

---

### User Story 2 - Create a ticket with full details (Priority: P2)

A user provides a title plus description, priority, planned start date, and
due date so the ticket carries full planning information from the start.

**Why this priority**: Common real usage once the basic flow works, but not
required for the board to be functional.

**Independent Test**: Send a creation request with all optional fields
populated with valid values; verify every field is echoed back unchanged.

**Acceptance Scenarios**:

1. **Given** valid values for `description`, `priority`, `plannedStartDate`,
   and `dueDate` (today or later), **When** the ticket is created, **Then**
   the response echoes all submitted values exactly alongside the
   system-assigned `id`, `status`, `position`, `createdAt`, and `updatedAt`.

---

### User Story 3 - Reject invalid submissions with a clear reason (Priority: P1)

A user (or client) submits data that violates a field rule (missing title,
title too long, bad priority value, a due date in the past, etc.) and needs to
know exactly what to fix.

**Why this priority**: Without reliable, specific validation errors, clients
cannot build a usable creation form — this is as critical as the happy path.

**Independent Test**: Send a creation request violating one rule at a time;
verify each returns 400 with the exact `error.code` and `error.message`
defined for that rule.

**Acceptance Scenarios**:

1. **Given** no `title` (or a whitespace-only `title`), **When** creation is
   attempted, **Then** the response is 400 with
   `error: { code: "VALIDATION_ERROR", message: "제목을 입력해주세요" }`.
2. **Given** a `title` longer than 200 characters, **When** creation is
   attempted, **Then** the response is 400 with message
   "제목은 200자 이내로 입력해주세요".
3. **Given** a `description` longer than 1000 characters, **When** creation is
   attempted, **Then** the response is 400 with message
   "설명은 1000자 이내로 입력해주세요".
4. **Given** a `priority` outside `LOW`/`MEDIUM`/`HIGH`, **When** creation is
   attempted, **Then** the response is 400 with message
   "우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요".
5. **Given** a `dueDate` earlier than today, **When** creation is attempted,
   **Then** the response is 400 with message
   "종료예정일은 오늘 이후 날짜를 선택해주세요".

---

### Edge Cases

- Backlog column is currently empty: what base value does the "top of column"
  position calculation use? (See Assumptions — treated as `0`, matching the
  documented example where the first ticket gets `position: -1024`.)
- `title` is exactly 200 characters: allowed (boundary is inclusive).
- `title` contains only whitespace: rejected, same message as a missing title.
- `dueDate` is exactly today: allowed (boundary is inclusive, rule is "today or later").
- `description`, `priority`, `plannedStartDate`, `dueDate` all omitted:
  ticket is still created; `description`/`plannedStartDate`/`dueDate` default
  to `null`, `priority` defaults to `MEDIUM`.
- `dueDate` supplied earlier than `plannedStartDate`: not validated by the
  current contract (only "today or later" is enforced on `dueDate`) — out of
  scope for this feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create a ticket from a request containing at least
  a `title`, and MUST reject creation when `title` is missing, empty, or
  whitespace-only.
- **FR-002**: System MUST enforce `title` length between 1 and 200 characters
  (after trimming for the whitespace-only check).
- **FR-003**: System MUST accept an optional `description` up to 1000
  characters; when omitted, the stored/returned value MUST be `null`.
- **FR-004**: System MUST accept an optional `priority` of `LOW`, `MEDIUM`, or
  `HIGH`; when omitted, the system MUST default it to `MEDIUM`.
- **FR-005**: System MUST accept an optional `plannedStartDate` in
  `YYYY-MM-DD` format; when omitted, the stored/returned value MUST be `null`.
- **FR-006**: System MUST accept an optional `dueDate` in `YYYY-MM-DD` format
  that MUST be today's date or later; when omitted, the stored/returned value
  MUST be `null`.
- **FR-007**: System MUST set every newly created ticket's `status` to
  `BACKLOG`, regardless of input.
- **FR-008**: System MUST place a newly created ticket above every existing
  ticket in the Backlog column by assigning it
  `position = min(existing Backlog positions) - 1024`.
- **FR-009**: System MUST set `startedAt` and `completedAt` to `null` on
  creation (they are only ever set by later status-change operations, which
  are outside this feature).
- **FR-010**: System MUST set `createdAt` and `updatedAt` to the current
  server time on creation.
- **FR-011**: System MUST validate the entire request against the shared
  `createTicketSchema` (Zod, defined in `src/shared/validations/ticket.ts`)
  before any ticket is created, and MUST NOT partially create a ticket when
  validation fails.
- **FR-012**: System MUST reject a request that fails validation with HTTP 400
  and body `{ error: { code: "VALIDATION_ERROR", message: "<rule-specific message>" } }`,
  using the exact message defined in `docs/API_SPEC.md` for the rule that
  failed.
- **FR-013**: System MUST respond with HTTP 201 and the full created ticket
  resource (`id`, `title`, `description`, `status`, `priority`, `position`,
  `plannedStartDate`, `dueDate`, `startedAt`, `completedAt`, `createdAt`,
  `updatedAt`) on success.
- **FR-014**: System MUST return `{ error: { code: "INTERNAL_ERROR", message } }`
  with HTTP 500 for any unexpected server failure during creation.

### Key Entities

- **Ticket**: A unit of work on the board. Attributes relevant to creation:
  `id` (system-assigned), `title`, `description`, `status` (fixed to
  `BACKLOG` at creation), `priority`, `position` (ordering within its
  column), `plannedStartDate`, `dueDate`, `startedAt`, `completedAt`,
  `createdAt`, `updatedAt`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of ticket-creation requests that satisfy every field rule
  in `docs/API_SPEC.md` succeed and return the created ticket.
- **SC-002**: 100% of ticket-creation requests that violate a single field
  rule are rejected with the exact `error.code`/`error.message` pair
  documented for that rule, so a client can surface the correct message
  without guessing.
- **SC-003**: A newly created ticket is always visibly ordered above every
  ticket already in the Backlog column, with no manual reordering required.
- **SC-004**: A ticket created with only a `title` is immediately usable
  (all optional fields resolve to a documented default rather than being
  left undefined).

## Assumptions

- `docs/API_SPEC.md` is the ratified contract for this endpoint (per the
  project constitution's API/contract-first principle); this spec organizes
  it into requirements rather than redesigning the endpoint.
- No authentication/authorization applies (MVP is single-user, per
  `docs/API_SPEC.md` header) — creation requests are not scoped to a user.
  Rich-text/HTML in `title`/`description` is stored as plain text; output
  escaping for display is a frontend concern, not part of this endpoint.
- When the Backlog column is empty, the position base is `0`, so the first
  ticket receives `position = -1024`, consistent with the example response in
  `docs/API_SPEC.md`.
- Ordering between `plannedStartDate` and `dueDate` is not cross-validated,
  matching the current contract (only `dueDate >= today` is enforced).
