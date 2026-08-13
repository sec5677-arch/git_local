import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { tickets } from '../../src/server/db/schema';

// .env.local 에서 연결 문자열 로드
config({ path: '.env.local' });

const connectionString =
  process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('POSTGRES_URL 또는 DATABASE_URL이 .env.local에 없습니다.');
}

const pool = new pg.Pool({ connectionString });
const db = drizzle(pool, { schema: { tickets } });

type SeedTicket = typeof tickets.$inferInsert;

const seedTickets: SeedTicket[] = [
  {
    title: '프로젝트 요구사항 정리',
    status: 'DONE',
    priority: 'HIGH',
    position: 0,
    plannedStartDate: '2026-01-20',
    dueDate: '2026-01-25',
    startedAt: new Date('2026-01-20T09:00:00+09:00'),
    completedAt: new Date('2026-01-24T17:00:00+09:00'),
  },
  {
    title: 'UI 와이어프레임 작성',
    status: 'DONE',
    priority: 'MEDIUM',
    position: 1024,
    dueDate: '2026-01-28',
    startedAt: new Date('2026-01-25T10:00:00+09:00'),
    completedAt: new Date('2026-01-27T15:00:00+09:00'),
  },
  {
    title: 'API 설계 문서 작성',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    position: 0,
    dueDate: '2026-02-05',
    startedAt: new Date('2026-01-28T09:00:00+09:00'),
  },
  {
    title: 'DB 스키마 설계',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    position: 1024,
    plannedStartDate: '2026-01-30',
    dueDate: '2026-02-07',
    startedAt: new Date('2026-01-30T10:00:00+09:00'),
  },
  {
    title: '로그인 페이지 구현',
    status: 'TODO',
    priority: 'HIGH',
    position: 0,
    plannedStartDate: '2026-02-03',
    dueDate: '2026-02-10',
    startedAt: new Date('2026-02-01T09:00:00+09:00'),
  },
  {
    title: '대시보드 레이아웃',
    status: 'TODO',
    priority: 'MEDIUM',
    position: 1024,
    dueDate: '2026-02-14',
    startedAt: new Date('2026-02-01T14:00:00+09:00'),
  },
  {
    title: '알림 기능 조사',
    status: 'BACKLOG',
    priority: 'LOW',
    position: 0,
  },
  {
    title: '성능 테스트 계획',
    status: 'BACKLOG',
    priority: 'MEDIUM',
    position: 1024,
    plannedStartDate: '2026-02-17',
  },
  {
    title: 'CI/CD 파이프라인 구축',
    status: 'BACKLOG',
    priority: 'LOW',
    position: 2048,
  },
];

async function main() {
  console.log(`Seeding ${seedTickets.length} tickets...`);
  await db.insert(tickets).values(seedTickets);
  console.log('Done.');
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
