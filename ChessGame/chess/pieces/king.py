"""킹 — 1칸 이동 및 캐슬링."""

from typing import TYPE_CHECKING, List

from chess.pieces.piece import Piece, Position

if TYPE_CHECKING:
    from chess.core.board import Board


class King(Piece):
    symbol = "K"

    def get_pseudo_legal_moves(self, board: "Board") -> List[Position]:
        row, col = self.position
        moves: List[Position] = []

        # 8방향 1칸 이동
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                if dr == 0 and dc == 0:
                    continue
                nr, nc = row + dr, col + dc
                if board.is_on_board(nr, nc) and board.can_capture_or_move(nr, nc, self.color):
                    moves.append((nr, nc))

        # 캐슬링 (킹이 한 번도 움직이지 않았을 때만)
        if not self.has_moved and not board.is_square_attacked(row, col, self.color):
            # 킹사이드: h열 룩
            if board.can_castle_kingside(self.color):
                moves.append((row, col + 2))
            # 퀸사이드: a열 룩
            if board.can_castle_queenside(self.color):
                moves.append((row, col - 2))

        return moves
