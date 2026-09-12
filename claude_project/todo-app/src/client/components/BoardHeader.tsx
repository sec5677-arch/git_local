import { Button } from '@/client/components/ui/Button';

export function BoardHeader({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="board-header">
      <input
        type="search"
        className="board-search"
        placeholder="Search"
        disabled
      />
      <Button onClick={onCreateClick}>새 업무</Button>
    </div>
  );
}
