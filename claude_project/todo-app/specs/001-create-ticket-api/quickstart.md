# Quickstart: Validate POST /api/tickets

## Prerequisites

- `DATABASE_URL` set in `.env.local` (Postgres connection string) — required
  by `src/server/db/index.ts`, which throws at import time if missing.
- Schema pushed to the database: `npm run db:push` (or `db:migrate` if a
  migration was generated for this feature — no schema change is expected
  since `tickets` already has every field this endpoint needs).
- Dependencies installed: `npm install`.

## Run the app

```bash
npm run dev
```

Server starts on `http://localhost:3000` by default.

## Automated checks

```bash
npm run type-check   # tsc --noEmit — must pass with zero errors (Constitution II)
npm test              # jest — schema + service unit tests must pass
```

## Manual contract validation (curl)

Minimal valid request:

```bash
curl -i -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"title":"첫 티켓"}'
```

Expected: `201`, body has `status: "BACKLOG"`, `priority: "MEDIUM"`,
`plannedStartDate: null`, `dueDate: null`, `startedAt: null`,
`completedAt: null`.

Full valid request:

```bash
curl -i -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"title":"API 설계 문서 작성","description":"REST API 엔드포인트 정의","priority":"HIGH","plannedStartDate":"2026-02-10","dueDate":"2026-02-15"}'
```

Expected: `201`, every submitted field echoed back unchanged.

Validation failure (missing title):

```bash
curl -i -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: `400`,
`{"error":{"code":"VALIDATION_ERROR","message":"제목을 입력해주세요"}}`.

Validation failure (past due date):

```bash
curl -i -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"title":"과거 마감일 테스트","dueDate":"2020-01-01"}'
```

Expected: `400`,
`{"error":{"code":"VALIDATION_ERROR","message":"종료예정일은 오늘 이후 날짜를 선택해주세요"}}`.

## Position ordering check

1. Create two tickets in sequence (as above).
2. `GET /api/tickets` (existing/other endpoint) and confirm the second
   ticket's `position` is lower than the first's — i.e. it sorts above it in
   the Backlog column.

## Done when

- [ ] `npm run type-check` passes
- [ ] `npm test` passes (schema + service unit tests)
- [ ] All curl scenarios above return the documented status code and body
- [ ] Second created ticket's `position` < first created ticket's `position`

See [contracts/post-tickets.md](./contracts/post-tickets.md) for the full
request/response/error contract and [data-model.md](./data-model.md) for
field-level rules.
