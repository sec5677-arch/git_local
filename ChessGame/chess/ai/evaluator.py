"""보드 평가 함수 — spec.md §8 기물 가치."""

from chess.core.board import Board

# 기물별 점수 (센트ipawn 단위)
PIECE_VALUES = {
    "P": 100,
    "N": 320,
    "B": 330,
    "R": 500,
    "Q": 900,
    "K": 20000,
}


def evaluate_board(board: Board, for_color: str = "white") -> int:
    """
    보드 점수를 계산합니다.
    양수 = for_color에게 유리, 음수 = 불리.
    """
    score = 0
    for row in range(8):
        for col in range(8):
            piece = board.get_piece(row, col)
            if piece is None:
                continue
            value = PIECE_VALUES.get(piece.symbol, 0)
            if piece.color == for_color:
                score += value
            else:
                score -= value
    return score
