-- Tika DB provisioning script
-- 실행: psql -U postgres -f scripts/db/init.sql
-- (이미 존재하면 skip, idempotent)

-- 1. 롤(사용자) 생성
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'tika_user') THEN
    CREATE ROLE tika_user LOGIN PASSWORD 'tika_password';
  END IF;
END
$$;

-- 2. 데이터베이스 생성 (CREATE DATABASE는 IF NOT EXISTS 미지원 → DO 블록 불가, psql \gexec 사용)
SELECT 'CREATE DATABASE tika_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tika_dev')\gexec

SELECT 'CREATE DATABASE tika_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tika_test')\gexec

-- 3. 권한 부여
GRANT ALL PRIVILEGES ON DATABASE tika_dev TO tika_user;
GRANT ALL PRIVILEGES ON DATABASE tika_test TO tika_user;
