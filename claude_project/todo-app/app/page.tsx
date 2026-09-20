import { getBoard } from '@/server/services/ticket.service';
import { BoardContainer } from '@/client/components/BoardContainer';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { board } = await getBoard();

  return <BoardContainer initialData={board} />;
}
