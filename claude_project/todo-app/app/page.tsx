import { db, tickets } from '@/server/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let ok = true;
  let count = 0;
  let errorMessage: string | undefined;

  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets);
    count = Number(result[0]?.count ?? 0);
  } catch (e) {
    ok = false;
    errorMessage = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Tika</h1>
        {ok ? (
          <p className="text-green-600">
            DB 연결 성공: {count}개의 티켓
          </p>
        ) : (
          <div className="text-red-600">
            <p className="font-semibold">DB 연결 실패</p>
            <pre className="text-xs mt-2 whitespace-pre-wrap break-all">
              {errorMessage}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
