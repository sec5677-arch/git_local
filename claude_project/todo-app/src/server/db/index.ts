import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { tickets } from './schema';

const connectionString =
  process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'POSTGRES_URL 또는 DATABASE_URL 환경변수가 설정되지 않았습니다.'
  );
}

const pool = new pg.Pool({ connectionString });

export const db = drizzle(pool, { schema: { tickets } });
export { tickets };
