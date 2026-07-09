"""Rules 단위 테스트."""

from chess.core.board import Board
from chess.core.move import Move
from chess.pieces.king import King
from chess.pieces.rook import Rook


def test_castling_kingside():
    """킹사이드 캐슬링."""
    board = Board()
    board.board = [[None] * 8 for _ in range(8)]
    row = 7
    king = King("white", (row, 4))
    rook = Rook("white", (row, 7))
    board.board[row][4] = king
    board.board[row][7] = rook
    board.current_turn = "white"
    assert board.can_castle_kingside("white")


def test_promotion():
    """폰 프로모션."""
    board = Board()
    board.board = [[None] * 8 for _ in range(8)]
    from chess.pieces.pawn import Pawn
    board.board[1][0] = Pawn("white", (1, 0))
    board.board[0][4] = King("black", (0, 4))
    board.board[7][4] = King("white", (7, 4))
    board.current_turn = "white"
    move = Move(1, 0, 0, 0, promotion="Q")
    assert board.move_piece(move)
    assert board.get_piece(0, 0).symbol == "Q"
