---

description: "Task list template for feature implementation"
---

# Tasks: Ticket Creation (POST /api/tickets)

**Input**: Design documents from `specs/001-create-ticket-api/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/post-tickets.md, quickstart.md (all present)

**Tests**: Included — the project constitution (Principle VI, Test-Driven Development) mandates tests before implementation, so every logic-bearing task below has a paired test task ordered first.

**Organization**: This feature is a single endpoint (`POST /api/tickets`) with one shared Zod schema, one service function, and one route handler — all three user stories in spec.md exercise the same implementation, so that implementation lives in Phase 2 (Foundational) once, test-first. Each user story's phase then adds the acceptance-level test(s) specific to that story's scenarios, per spec.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths are exact

## Phase 1: Setup

**Purpose**: Create the empty target files this feature needs (no new dependencies — `zod`, `drizzle-orm`, `next`, `jest` are already in `package.json`; no DB migration — `src/server/db/schema.ts`'s `tickets` table already has every field this endpoint needs).

- [X] T001 Create empty placeholder files: `src/shared/types/ticket.ts`, `src/shared/validations/ticket.ts`, `src/server/services/ticket.service.ts`, `app/api/tickets/route.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The schema, type, service, and route wiring that every user story below depends on.

**⚠️ CRITICAL**: No user story phase can be verified until this phase is complete.

- [X] T002 [P] Write failing unit tests for `createTicketSchema` in `__tests__/services/ticket.schema.test.ts` (`@jest-environment node`): assert a minimal body (`title` only) and a fully-populated body both pass; assert each of the following fails with its exact message (contracts/post-tickets.md error table) — missing/whitespace-only `title` → "제목을 입력해주세요"; `title` over 200 chars → "제목은 200자 이내로 입력해주세요"; `description` over 1000 chars → "설명은 1000자 이내로 입력해주세요"; `priority` outside `LOW`/`MEDIUM`/`HIGH` → "우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요"; `dueDate` earlier than today → "종료예정일은 오늘 이후 날짜를 선택해주세요"
- [X] T003 Implement `createTicketSchema` in `src/shared/validations/ticket.ts` to make T002 pass: `title: z.string().min(1,'제목을 입력해주세요').max(200,'제목은 200자 이내로 입력해주세요').refine(v=>v.trim().length>0,'제목을 입력해주세요')`; `description: z.string().max(1000,'설명은 1000자 이내로 입력해주세요').optional()`; `priority: z.enum(['LOW','MEDIUM','HIGH'],{errorMap:()=>({message:'우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요'})}).optional()`; `plannedStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()`; `dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>v>=new Date().toISOString().split('T')[0],'종료예정일은 오늘 이후 날짜를 선택해주세요').optional()` (depends on T002)
- [X] T004 [P] Define `CreateTicketInput` and `Ticket` types in `src/shared/types/ticket.ts`: `CreateTicketInput` MUST be `z.infer<typeof createTicketSchema>` (imported from T003, not hand-written); `Ticket` MUST be derived from `typeof tickets.$inferSelect` in `src/server/db/schema.ts` — per data-model.md, do not write a parallel interface for either (depends on T003)
- [X] T005 [P] Write failing unit tests for `createTicket` in `__tests__/services/ticket.service.test.ts` (`@jest-environment node`, mock the `src/server/db` module): when the Backlog column is empty, the returned `position` is `-1024`; when the current minimum Backlog `position` is `-1024`, the returned `position` is `-2048`; `status` is always `'BACKLOG'` regardless of input; `priority` defaults to `'MEDIUM'` when omitted; `description`, `plannedStartDate`, `dueDate` default to `null` when omitted; `startedAt` and `completedAt` are always `null`; `createdAt`/`updatedAt` are set
- [X] T006 Implement `createTicket(input: CreateTicketInput): Promise<Ticket>` in `src/server/services/ticket.service.ts` to make T005 pass: compute `MIN(position)` over rows where `status = 'BACKLOG'` via a Drizzle `sql` aggregate against the existing `tickets`/`db` export from `src/server/db`, use `(min ?? 0) - 1024` as the new `position`, apply the field defaults listed in data-model.md, insert the row, and return it (depends on T004, T005)
- [X] T007 Implement the `POST` handler in `app/api/tickets/route.ts`: parse the JSON body, validate it with `createTicketSchema` (T003); on validation failure respond `NextResponse.json({ error: { code: 'VALIDATION_ERROR', message } }, { status: 400 })` using the first Zod issue's message; on success call `createTicket` (T006) and respond `NextResponse.json(ticket, { status: 201 })`; wrap both steps in try/catch and respond `{ error: { code: 'INTERNAL_ERROR', message } }` with status 500 on any unexpected error — this handler MUST contain no business logic beyond this wiring (Constitution V) (depends on T003, T006)

**Checkpoint**: The endpoint is fully implemented and unit-tested at the schema/service level. Ready for per-story acceptance verification.

---

## Phase 3: User Story 1 - Create a new ticket with just a title (Priority: P1) 🎯 MVP

**Goal**: A user can create a ticket with only a `title` and get a fully usable ticket back, positioned above the rest of the Backlog.

**Independent Test**: `POST { "title": "..." }` → 201 with `status:"BACKLOG"`, `priority:"MEDIUM"`, every other optional field `null`, and `position` above any pre-existing Backlog ticket.

- [X] T008 [US1] Write an integration test in `__tests__/services/ticket.route.test.ts` (`@jest-environment node`, mock `src/server/db` as in T005) that imports `POST` from `app/api/tickets/route.ts`, sends a minimal body (`title` only), and asserts HTTP 201 with `status:"BACKLOG"`, `priority:"MEDIUM"`, `plannedStartDate:null`, `dueDate:null`, `startedAt:null`, `completedAt:null`
- [X] T009 [US1] In the same file, add a case that creates two tickets in sequence (mock the db so the second call sees the first ticket's `position` as the current minimum) and assert the second ticket's `position` is less than the first's (spec.md User Story 1, Acceptance Scenario 2)

**Checkpoint**: User Story 1 is independently verified — this is the deployable MVP slice.

---

## Phase 4: User Story 3 - Reject invalid submissions with a clear reason (Priority: P1)

**Goal**: Every documented validation rule produces the exact `error.code`/`error.message` pair a client can rely on.

**Independent Test**: Send one request per documented rule violation; each must return 400 with the exact pair from contracts/post-tickets.md.

- [X] T010 [P] [US3] Extend `__tests__/services/ticket.route.test.ts` with one case per row of contracts/post-tickets.md's error table — missing/whitespace-only `title`, `title` over 200 chars, `description` over 1000 chars, invalid `priority`, `dueDate` earlier than today — asserting HTTP 400 and `{ error: { code: "VALIDATION_ERROR", message: "<exact message>" } }` for each

**Checkpoint**: User Stories 1 and 3 together make the endpoint safe to ship.

---

## Phase 5: User Story 2 - Create a ticket with full details (Priority: P2)

**Goal**: A client supplying every optional field gets them back unchanged.

**Independent Test**: `POST` with `title`, `description`, `priority`, `plannedStartDate`, `dueDate` all set to valid values → 201 echoing every field exactly.

- [X] T011 [P] [US2] Extend `__tests__/services/ticket.route.test.ts` with a fully-populated request (values from quickstart.md's "Full valid request") and assert every submitted field is echoed back unchanged in the 201 response

**Checkpoint**: All three user stories pass independently — full spec.md scope is covered.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T012 [P] Run `npm run type-check` and fix any strict-mode TypeScript errors introduced by T001-T011 (Constitution II — no `any`, no disabling strict mode)
- [X] T013 [P] Run `npm test` and confirm T002, T005, T008-T011 all pass
- [X] T014 Manually run every curl scenario in quickstart.md against `npm run dev` (with `DATABASE_URL` set and `npm run db:push` applied) to confirm the mocked-db test assertions hold against a real database
- [X] T015 Re-read `docs/API_SPEC.md` §1 line by line against the implementation and confirm no field name, default, status code, or message text has drifted (Constitution III)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. Tasks run in order T002 → T003 → T004 → T005 → T006 → T007 (each implementation task depends on its paired test task and, where noted, on the type/schema it consumes). BLOCKS every user story phase.
- **User Stories (Phase 3-5)**: All depend on Foundational (Phase 2) being complete, since they test the shared implementation from that phase. Phases 3 and 4 are both P1 and should be done before Phase 5 (P2); within that constraint they, and Phase 5, can proceed in any order or in parallel once Phase 2 is done.
- **Polish (Phase 6)**: Depends on all of Phases 3-5.

### Within Each Phase

- Phase 2: each `*.test.ts` task (T002, T005) MUST be written and failing before its paired implementation task (T003, T006) is written.
- Phases 3-5 add cases to `__tests__/services/ticket.route.test.ts`; T008/T009 (US1) should land first since Phase 4/5 tasks append to the same file.

### Parallel Opportunities

- T004 (types) can run in parallel with T002 (schema tests), since it only needs T003's schema to exist before it compiles — start drafting alongside T002/T003.
- T010 (US3) and T011 (US2) touch the same file (`ticket.route.test.ts`) as T008/T009 (US1); despite the `[P]` marker (different user story, no logical dependency on each other's assertions), apply them sequentially in one working session to avoid merge conflicts in the same file.
- T012 and T013 (Polish) can run in parallel with each other.

---

## Parallel Example: Foundational Phase

```bash
# T002 and T005 are independent test files - write both before either implementation:
Task: "Write failing unit tests for createTicketSchema in __tests__/services/ticket.schema.test.ts"
Task: "Write failing unit tests for createTicket in __tests__/services/ticket.service.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational) — this already implements the full endpoint, test-first.
2. Complete Phase 3 (User Story 1: T008-T009).
3. **STOP and VALIDATE**: run `npm test` and the quickstart.md minimal-request curl. This is a demo-able MVP.

### Incremental Delivery

1. Setup + Foundational → endpoint implemented and unit-tested.
2. Phase 3 (US1) → MVP demoable.
3. Phase 4 (US3) → safe to expose to real/untrusted clients.
4. Phase 5 (US2) → full-detail creation confirmed.
5. Phase 6 (Polish) → typecheck, full test run, real-DB spot check, spec-drift check.

## Notes

- [P] tasks touch different files, except where called out above (T010/T011 share a file with T008/T009 — apply sequentially).
- Commit after each task or logical group, per repository convention.
- Verify each `*.test.ts` task fails before writing its paired implementation (Constitution VI).
- This feature intentionally has no cross-story integration risk: all three stories exercise one already-shared implementation, so "integrate with User Story 1 components" (as later stories might otherwise need) does not apply here.
