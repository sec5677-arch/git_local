"""AI 단위 테스트."""

from chess.ai.minimax import get_best_move
from chess.core.board import Board


def test_ai_returns_legal_move():
    """AI가 합법적인 수를 반환하는지."""
    board = Board()
    move = get_best_move(board, "white", "easy")
    assert move is not None
    legal = board.get_all_legal_moves("white")
    assert move in legal or move.to_notation() in [m.to_notation() for m in legal]
