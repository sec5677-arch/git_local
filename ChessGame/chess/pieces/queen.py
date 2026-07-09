"""퀸 — 가로·세로·대각선 슬라이딩 이동."""

from chess.pieces.piece import Piece
from chess.pieces.rook import Rook
from chess.pieces.bishop import Bishop


class Queen(Piece):
    symbol = "Q"

    def get_pseudo_legal_moves(self, board):
        # 룩 + 비숍 이동을 합쳐서 퀸 이동 구현
        rook = Rook(self.color, self.position)
        bishop = Bishop(self.color, self.position)
        return rook.get_pseudo_legal_moves(board) + bishop.get_pseudo_legal_moves(board)
