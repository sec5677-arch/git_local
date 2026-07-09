"""Board 단위 테스트."""

import pytest

from chess.core.board import Board
from chess.core.move import Move
from chess.pieces.king import King
from chess.pieces.rook import Rook


def test_initialize():
    """초기 배치 확인."""
    board = Board()
    assert board.get_piece(7, 4) is not None  # 백 킹
    assert board.get_piece(0, 4) is not None  # 흑 킹
    assert board.current_turn == "white"


def test_pawn_move():
    """폰 이동."""
    board = Board()
    move = Move(6, 4, 4, 4)  # e2e4
    assert board.move_piece(move)
    assert board.get_piece(4, 4) is not None
    assert board.current_turn == "black"


def test_check_detection():
    """체크 판정."""
    board = Board()
    # Scholar's mate 준비가 아닌 간단한 체크 상황
    board.board = [[None] * 8 for _ in range(8)]
    board.board[7][4] = King("white", (7, 4))
    board.board[0][4] = King("black", (0, 4))
    board.board[7][0] = Rook("black", (7, 0))  # a1 룩이 e1 킹 공격
    board.current_turn = "white"
    assert board.is_check("white")


def test_move_notation_roundtrip():
    """기보 표기 변환."""
    move = Move.from_notation("e2e4")
    assert move.to_notation() == "e2e4"
