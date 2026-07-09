"""폰 — 전진, 대각 공격, 앙파상, 프로모션."""

from typing import TYPE_CHECKING, List

from chess.pieces.piece import Piece, Position

if TYPE_CHECKING:
    from chess.core.board import Board


class Pawn(Piece):
    symbol = "P"

    def get_pseudo_legal_moves(self, board: "Board") -> List[Position]:
        row, col = self.position
        moves: List[Position] = []
        # 백은 위로(-1), 흑은 아래로(+1) 이동
        direction = -1 if self.color == "white" else 1
        start_row = 6 if self.color == "white" else 1

        # 앞으로 1칸
        nr = row + direction
        if board.is_on_board(nr, col) and board.get_piece(nr, col) is None:
            moves.append((nr, col))
            # 시작 위치에서 2칸 전진
            if row == start_row:
                nr2 = row + 2 * direction
                if board.get_piece(nr2, col) is None:
                    moves.append((nr2, col))

        # 대각선 공격
        for dc in (-1, 1):
            nr, nc = row + direction, col + dc
            if board.is_on_board(nr, nc):
                target = board.get_piece(nr, nc)
                if target is not None and target.color != self.color:
                    moves.append((nr, nc))

        # 앙파상
        if board.en_passant_target is not None:
            ep_row, ep_col = board.en_passant_target
            if ep_row == row + direction and abs(ep_col - col) == 1:
                moves.append((ep_row, ep_col))

        return moves
