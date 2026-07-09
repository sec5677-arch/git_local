"""나이트 — L자 이동."""

from typing import TYPE_CHECKING, List

from chess.pieces.piece import Piece, Position

if TYPE_CHECKING:
    from chess.core.board import Board


class Knight(Piece):
    symbol = "N"

    def get_pseudo_legal_moves(self, board: "Board") -> List[Position]:
        row, col = self.position
        moves: List[Position] = []
        offsets = [
            (-2, -1), (-2, 1), (-1, -2), (-1, 2),
            (1, -2), (1, 2), (2, -1), (2, 1),
        ]

        for dr, dc in offsets:
            nr, nc = row + dr, col + dc
            if board.is_on_board(nr, nc) and board.can_capture_or_move(nr, nc, self.color):
                moves.append((nr, nc))

        return moves
