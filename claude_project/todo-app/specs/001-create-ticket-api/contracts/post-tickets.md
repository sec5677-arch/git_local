# Contract: POST /api/tickets

This is the implementation-facing extract of `docs/API_SPEC.md` §1 relevant to
this feature. `docs/API_SPEC.md` remains the authoritative source; if the two
ever disagree, `docs/API_SPEC.md` wins and this file must be corrected to
match it.

## Request

`POST /api/tickets`, `Content-Type: application/json`

```json
{
  "title": "string, required, 1-200 chars, not whitespace-only",
  "description": "string, optional, max 1000 chars",
  "priority": "LOW | MEDIUM | HIGH, optional, default MEDIUM",
  "plannedStartDate": "YYYY-MM-DD, optional",
  "dueDate": "YYYY-MM-DD, optional, must be today or later"
}
```

Validated by `createTicketSchema` in `src/shared/validations/ticket.ts`
(mirrors `docs/API_SPEC.md` §"검증 스키마 (Zod)" → CreateTicketInput).

## Success Response — 201 Created

```json
{
  "id": 1,
  "title": "API 설계 문서 작성",
  "description": "REST API 엔드포인트와 요청/응답 형식을 정의한다",
  "status": "BACKLOG",
  "priority": "HIGH",
  "position": -1024,
  "plannedStartDate": "2026-02-10",
  "dueDate": "2026-02-15",
  "startedAt": null,
  "completedAt": null,
  "createdAt": "2026-02-01T09:00:00.000Z",
  "updatedAt": "2026-02-01T09:00:00.000Z"
}
```

## Error Responses — 400 Bad Request

Shape: `{ "error": { "code": "VALIDATION_ERROR", "message": "<one of below>" } }`

| Condition | Message |
|---|---|
| Missing/whitespace-only `title` | 제목을 입력해주세요 |
| `title` > 200 chars | 제목은 200자 이내로 입력해주세요 |
| `description` > 1000 chars | 설명은 1000자 이내로 입력해주세요 |
| Invalid `priority` value | 우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요 |
| `dueDate` earlier than today | 종료예정일은 오늘 이후 날짜를 선택해주세요 |

## Error Response — 500 Internal Server Error

Shape: `{ "error": { "code": "INTERNAL_ERROR", "message": "<generic message>" } }`
— for any unexpected failure (e.g., database unreachable). Must not leak
internal details (Constitution: Security Requirements).

## Contract test checklist

Each row below should map to one test case in `/speckit-tasks`:

- [ ] Valid minimal body (`title` only) → 201, defaults applied as documented
- [ ] Valid full body (all fields) → 201, values echoed exactly
- [ ] Each 400 condition in the table above → exact `code`/`message` pair
- [ ] New ticket's `position` is less than every pre-existing Backlog ticket's `position`
- [ ] Response `Content-Type` is `application/json`
