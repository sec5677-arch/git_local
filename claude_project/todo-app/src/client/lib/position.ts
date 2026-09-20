const GAP = 1024;

/**
 * Computes the integer `position` to send to PATCH /api/tickets/reorder for a
 * card dropped at `targetIndex` among a target column's existing positions
 * (ascending order). Mirrors the "midpoint or edge" convention documented in
 * ticket.service.ts's reorderTicket — the server rebalances the whole column
 * if this ever collides with a neighbor.
 */
export function calculatePosition(columnPositions: number[], targetIndex: number): number {
  if (columnPositions.length === 0) return GAP;

  const index = Math.max(0, Math.min(targetIndex, columnPositions.length));

  if (index === 0) return columnPositions[0] - GAP;
  if (index === columnPositions.length) return columnPositions[index - 1] + GAP;

  return Math.floor((columnPositions[index - 1] + columnPositions[index]) / 2);
}
