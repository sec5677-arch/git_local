"""비숍 — 대각선 슬라이딩 이동."""

from typing import TYPE_CHECKING, List

from chess.pieces.piece import Piece, Position

if TYPE_CHECKING:
    from chess.core.board import Board


class Bishop(Piece):
    symbol = "B"

    def get_pseudo_legal_moves(self, board: "Board") -> List[Position]:
        row, col = self.position
        moves: List[Position] = []
        directions = [(1, 1), (1, -1), (-1, 1), (-1, -1)]

        for dr, dc in directions:
            nr, nc = row + dr, col + dc
            while board.is_on_board(nr, nc):
                target = board.get_piece(nr, nc)
                if target is None:
                    moves.append((nr, nc))
                else:
                    if target.color != self.color:
                        moves.append((nr, nc))
                    break
                nr += dr
                nc += dc

        return moves
