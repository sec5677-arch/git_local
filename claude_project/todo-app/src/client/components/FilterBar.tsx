export type BoardFilter = 'all' | 'thisWeek' | 'overdue';

export function FilterBar({
  activeFilter,
  onFilterChange,
  counts,
}: {
  activeFilter: BoardFilter;
  onFilterChange: (filter: BoardFilter) => void;
  counts: { thisWeek: number; overdue: number };
}) {
  const toggle = (filter: BoardFilter) => {
    onFilterChange(activeFilter === filter ? 'all' : filter);
  };

  return (
    <div className="filter-bar">
      <button
        type="button"
        className={`filter-button ${activeFilter === 'thisWeek' ? 'filter-button--active' : ''}`.trim()}
        onClick={() => toggle('thisWeek')}
      >
        이번주 업무 {counts.thisWeek}
      </button>
      <button
        type="button"
        className={`filter-button ${activeFilter === 'overdue' ? 'filter-button--active' : ''}`.trim()}
        onClick={() => toggle('overdue')}
      >
        일정 초과 {counts.overdue}
      </button>
    </div>
  );
}
