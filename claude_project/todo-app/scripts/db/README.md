# Tika DB 스크립트

## 사전 조건
로컬 PostgreSQL이 5432 포트로 실행 중이어야 합니다.

## 1. DB 및 사용자 프로비저닝 (최초 1회)

```bash
# 슈퍼유저로 실행 (Windows — 계정명은 환경에 따라 postgres 또는 윈도우 계정)
psql -U postgres -f scripts/db/init.sql
```

`init.sql`은 idempotent입니다 — 이미 존재하는 사용자/DB는 건너뜁니다.

생성되는 대상:
- 롤: `tika_user` (비밀번호 `tika_password`)
- DB: `tika_dev`, `tika_test`

## 2. 마이그레이션

```bash
npm run db:generate   # drizzle/ 에 SQL 생성
npm run db:migrate    # tika_dev 에 적용
```

## 3. 시드 (선택)

```bash
npm run db:seed       # 9건 샘플 티켓 적재
```

## 4. Drizzle Studio

```bash
npm run db:studio     # http://localhost:4983 에서 테이블 확인
```
