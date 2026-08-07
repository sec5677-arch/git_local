# Tika 프로젝트 실행 환경 세팅 완료 보고서

> 작성일: 2026-08-07
> 범위: 환경 세팅 + 최소 실행 (칸반 기능 구현 제외)

---

## 1. 개요

이 저장소는 원래 **명세 문서 7종(docs/*.md) + 설정 파일만 있고 구현 코드가 전혀 없는 상태**였습니다. 본 작업은 `npm run dev` 로 개발 서버가 기동하고 DB 연결이 확인되는 "실행 가능 상태"까지 세팅하는 것을 목표로 했습니다.

**목표 달성 여부**: ✅ 달성
- `npm run dev` → http://localhost:3000 접속 시 "DB 연결 성공: 9개의 티켓" 정상 노출
- Tailwind CSS 4 정상 적용
- 시드 데이터 9건 DB 적재 완료

---

## 2. 최종 검증 결과

| 항목 | 결과 | 비고 |
|------|------|------|
| 타입 체크 `npx tsc --noEmit` | ✅ 통과 | 에러 없음 |
| dev 서버 기동 + DB 연결 | ✅ 성공 | "DB 연결 성공: 9개의 티켓" |
| Tailwind 4 스타일 적용 | ✅ 적용됨 | `layout.css` 로드, 클래스 정상 |
| `tickets` 테이블 생성 | ✅ 완료 | `tika_dev` DB, 12컬럼 + 3인덱스 |
| 시드 적재 `npm run db:seed` | ✅ 완료 | 9건 |
| ESLint `npm run lint` | ⚠️ 별도 정리 필요 | `next lint` deprecated + flat config 마이그레이션 필요 (실행에는 영향 없음) |

### 검증 명령어 (재현용)
```bash
npx tsc --noEmit                              # 타입 체크
npm run db:studio                              # Drizzle Studio에서 tickets 테이블 확인
npm run dev                                   # http://localhost:3000 접속
# 브라우저에서 "DB 연결 성공: 9개의 티켓" 표시 확인
```

---

## 3. 생성/수정된 파일 목록

### 신규 생성 (10개)

| 파일 | 용도 |
|------|------|
| `postcss.config.mjs` | Tailwind 4 `@tailwindcss/postcss` 플러그인 등록 |
| `.mcp.json` | Context7 MCP 서버 설정 (자리만, API 키는 후속 발급) |
| `src/server/db/schema.ts` | Drizzle `tickets` 테이블 스키마 (DATA_MODEL.md 기반) |
| `src/server/db/index.ts` | `node-postgres` pool + drizzle 클라이언트 (`POSTGRES_URL`/`DATABASE_URL` 둘 다 지원) |
| `app/layout.tsx` | Next.js Root layout (`<html lang="ko">`, globals.css import) |
| `app/page.tsx` | 서버 컴포넌트 DB 연결 상태 페이지 |
| `scripts/db/init.sql` | idempotent DB/롤 프로비저닝 스크립트 |
| `scripts/db/seed.ts` | tsx 기반 9건 시드 스크립트 |
| `scripts/db/README.md` | DB 스크립트 실행 가이드 |

### 수정 (5개)

| 파일 | 변경 내용 |
|------|-----------|
| `.env.local` | `POSTGRES_URL` 추가 (drizzle.config.ts가 읽는 키), `CONTEXT7_API_KEY` 자리 추가 |
| `.env.example` | `DATABASE_URL`/`POSTGRES_URL`/`CONTEXT7_API_KEY` 예시값 문서화 |
| `.env.test` | 테스트용 DB(`tika_test`) 가리키도록 설정 |
| `.gitignore` | `.env.test` 행 추가 (커밋 방지) |
| `package.json` | `db:seed` 스크립트 추가 + 의존성 추가 (아래 참조) |

### 추가 설치된 의존성

**dependencies**:
- `pg` ^8.22.0 — `src/server/db/index.ts`가 `node-postgres` 사용
- `dotenv` ^17.4.2 — `scripts/db/seed.ts`가 `.env.local` 로드

**devDependencies**:
- `@types/pg` ^8.20.4 — pg 타입 정의
- `@tailwindcss/postcss` ^4.3.3 — Tailwind 4 PostCSS 플러그인 (정식 방식)
- `tsx` ^4.23.10 — seed 스크립트 실행기 (ts-node 대안, ESM 호환성 우수)

---

## 4. 작업 순서 (실행된 6단계)

### 단계 1: 환경변수 정합 + gitignore 정리 ✅
- `.env.local`에 `POSTGRES_URL` 추가 (기존에는 `DATABASE_URL`만 있어 `drizzle.config.ts`와 불일치)
- `.env.test`를 `tika_test` DB 가리키도록 설정 + `.gitignore`에 추가

### 단계 2: DB 프로비저닝 ✅
- PostgreSQL 18.4가 5432 포트에서 이미 실행 중 확인
- `scripts/db/init.sql`로 idempotent 프로비저닝:
  - 롤 `tika_user` (비밀번호 `tika_password`) 생성
  - DB `tika_dev`, `tika_test` 생성
  - 권한 부여
- `tika_user`로 `tika_dev` 연결 검증 완료

### 단계 3: 의존성 설치 + 설정 보강 ✅
- `npm install` (688개 패키지)
- 추가 패키지 설치: `pg`, `dotenv`, `@types/pg`, `@tailwindcss/postcss`, `tsx`
- `postcss.config.mjs` 작성 (Tailwind 4 정식 방식)
- `.mcp.json` 작성 (Context7 MCP)
- Node.js v24.19.0 + npm 11.17.0 환경

### 단계 4: DB 스키마 + 클라이언트 + 마이그레이션 ✅
- `src/server/db/schema.ts` — DATA_MODEL.md 명세 그대로 Drizzle pgTable 구현
  - 12컬럼: id, title, description, status, priority, position, planned_start_date, due_date, started_at, completed_at, created_at, updated_at
  - 3인덱스: idx_tickets_status_position, idx_tickets_due_date, idx_tickets_completed_at
- `src/server/db/index.ts` — pg.Pool + drizzle 클라이언트
- `npm run db:generate` → `drizzle/0000_next_blazing_skull.sql` 생성
- `npm run db:migrate` → `tika_dev`에 `tickets` 테이블 적용
- `npm run db:seed` → 9건 샘플 데이터 적재

### 단계 5: 최소 진입점 (app/) ✅
- `app/layout.tsx` — Root layout, `<html lang="ko">`, metadata
- `app/page.tsx` — 서버 컴포넌트. `db.select().from(tickets)` count 쿼리 → "DB 연결 성공: N개의 티켓" 표시, 실패 시 에러 메시지
- (칸반 UI는 제외 — 상태 확인용 랜딩만)

### 단계 6: 검증 ✅
- 타입 체크 통과
- dev 서버 기동 → "DB 연결 성공: 9개의 티켓" 확인 (HTML 응답에서 검증)
- ESLint는 별도 마이그레이션 필요 (아래 "후속 작업" 참조)

---

## 5. 기술 스택 검증 결과

| 기술 | 명세 기준 | 실제 설치 | 일치 |
|------|-----------|-----------|------|
| Next.js | 15 (App Router) | ^15.1.3 | ✅ |
| React | 19 | ^19.0.0 | ✅ |
| TypeScript | strict | ^5.7.2 | ✅ |
| Tailwind CSS | 4 | ^4.0.0 + `@tailwindcss/postcss` ^4.3.3 | ✅ |
| Drizzle ORM | 0.38.x | ^0.38.3 | ✅ |
| drizzle-kit | - | ^0.30.1 | ✅ |
| Zod | - | ^3.24.1 | ✅ |
| Jest | - | ^29.7.0 | ✅ |
| @dnd-kit | core + sortable + utilities | ^6.3.1 / ^8.0.0 / ^3.2.2 | ✅ |
| node-postgres | - | pg ^8.22.0 (신규 추가) | ✅ |
| Node.js 런타임 | >=20 | v24.19.0 | ✅ |

---

## 6. 현재 실행 가능한 명령어

```bash
# 개발 서버
npm run dev          # http://localhost:3000

# DB 작업
npm run db:generate  # 마이그레이션 SQL 생성
npm run db:migrate    # DB에 마이그레이션 적용
npm run db:studio     # Drizzle Studio (http://localhost:4983)
npm run db:seed       # 시드 9건 적재
npm run db:push       # 스키마 직접 push

# 품질 검증
npx tsc --noEmit      # 타입 체크
npm run lint          # ESLint (현재 flat config 마이그레이션 필요)
npm run build         # 프로덕션 빌드
npm run test          # Jest (테스트 파일은 아직 없음)
```

---

## 7. 알려진 이슈 및 주의사항

### 7.1 ESLint flat config 마이그레이션 필요 (⚠️)
- `npm run lint` 실패 원인:
  1. Next.js 15에서 `next lint`가 deprecated (Next.js 16에서 제거 예정)
  2. `eslint.config.mjs`가 eslintrc 형식으로 작성되어 flat config 형식이 아님
- 해결 방법: `npx @next/codemod@canary next-lint-to-eslint-cli .` 실행 후 `eslint.config.mjs`를 flat config 형식으로 재작성
- 실행에는 영향 없음 (dev 서버 정상 기동)

### 7.2 Tailwind v3 config 잔존 (정상 작동하나 제거 검토 권장)
- `tailwind.config.ts` (v3식 content/theme 방식)가 남아있음
- Tailwind 4는 CSS-based config가 정식이며, `app/globals.css`가 이미 `@import 'tailwindcss';`를 사용 중
- 따라서 `tailwind.config.ts`는 현재 무시됨 (작동에는 영향 없음)
- 후속 정리 시 제거 검토

### 7.3 Context7 API 키 미발급
- `.mcp.json`과 `.env.local`의 `CONTEXT7_API_KEY`는 자리만 만들어둠 (빈 값)
- CLAUDE.md의 "공식 문서 우선(Context7)" 자동화를 활성화하려면:
  1. https://context7.com 에서 API 키 발급
  2. `.env.local`의 `CONTEXT7_API_KEY`에 키 입력
  3. Claude Code 재시작

### 7.4 `.specify/` 디렉토리 미복원
- CLAUDE.md가 `.specify/memory/constitution.md`와 `.specify/scripts/bash/install-hooks.sh`를 참조하지만 실제로는 존재하지 않음
- 본 작업 범위에서 제외 (실행에 영향 없음) — 후속 복원 필요

---

## 8. 후속 작업 (이 계획 범위 밖)

### 8.1 실제 칸반 기능 구현 (우선순위 최상)
CLAUDE.md의 SDD 구현 순서대로 진행:
1. `src/shared/types` — 타입 정의 (DATA_MODEL.md에 TypeScript 타입 이미 명시됨)
2. `src/shared/validations` — Zod 스키마
3. `__tests__/` — 테스트 코드 (TDD)
4. `src/server/services/ticketService` — 비즈니스 로직
5. `app/api/tickets/route.ts` — Route Handler
6. `src/client/api/ticketApi` — API 호출 함수
7. `src/client/components` — UI 컴포넌트 (칸반 보드, @dnd-kit 드래그앤드롭)

### 8.2 ESLint flat config 마이그레이션
- `npx @next/codemod@canary next-lint-to-eslint-cli .` 실행
- `eslint.config.mjs` flat config 재작성

### 8.3 `.specify/` 디렉토리 복원
- `constitution.md` (핵심 원칙)
- `scripts/bash/install-hooks.sh` (Git pre-commit hook)

### 8.4 Tailwind v3 config 제거
- `tailwind.config.ts` 삭제 (Tailwind 4 CSS-based config 사용)

### 8.5 프로덕션 배포 준비
- `npm run build` 검증
- Vercel 배포 설정 (`@vercel/postgres` 의존성은 이미 있음)
- `tika_test` DB를 활용한 서비스 테스트 환경 구축

---

## 9. DB 스키마 요약 (참조)

```sql
-- tika_dev.tickets 테이블
id                SERIAL       PRIMARY KEY
title             VARCHAR(200) NOT NULL
description       TEXT
status            VARCHAR(20)  NOT NULL DEFAULT 'BACKLOG'
priority          VARCHAR(10)  NOT NULL DEFAULT 'MEDIUM'
position          INTEGER      NOT NULL DEFAULT 1
planned_start_date DATE
due_date          DATE
started_at        TIMESTAMP
completed_at      TIMESTAMP
created_at        TIMESTAMP    NOT NULL DEFAULT now()
updated_at        TIMESTAMP    NOT NULL DEFAULT now()

-- 인덱스
idx_tickets_status_position  ON (status, position)
idx_tickets_due_date         ON (due_date)
idx_tickets_completed_at     ON (completed_at)
```

상세 스키마는 `docs/DATA_MODEL.md` 참조.

---

**결론**: Tika 프로젝트의 실행 환경 세팅이 완료되었습니다. 개발 서버 기동 + DB 연결 + 시드 데이터까지 검증된 상태이며, 이제 CLAUDE.md의 SDD 워크플로우에 따라 실제 칸반 기능 구현을 시작할 수 있는 준비가 되었습니다.
