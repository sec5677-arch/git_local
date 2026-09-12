export function ColumnHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="column-header">
      <span className="column-title">{title}</span>
      <span className="column-count">{count}</span>
    </div>
  );
}
