import { Button } from '@/client/components/ui/Button';

export function BoardHeader({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="board-header">
      <h1 className="board-title">Tika</h1>
      <div className="flex items-center gap-3">
        <input
          type="search"
          className="board-search"
          placeholder="Search"
          disabled
        />
        <Button onClick={onCreateClick}>새 업무</Button>
      </div>
    </div>
  );
}
