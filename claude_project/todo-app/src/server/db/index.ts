import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { tickets } from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL 환경변수가 설정되지 않았습니다.'
  );
}

const client = postgres(connectionString);

export const db = drizzle(client, { schema: { tickets } });
export { tickets };
