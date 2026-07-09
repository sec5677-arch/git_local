"""Minimax + 알파-베타 가지치기 AI."""

import random
from typing import Optional

from chess.core.board import Board
from chess.core.move import Move
from chess.ai.evaluator import evaluate_board

# 난이도별 탐색 깊이
DEPTH_MAP = {
    "easy": 0,
    "medium": 2,
    "hard": 4,
}


def get_best_move(board: Board, color: str, difficulty: str = "medium") -> Optional[Move]:
    """
    난이도에 따라 최적(또는 랜덤) 수를 반환합니다.
    easy: 랜덤, medium: depth 2, hard: depth 4
    """
    legal_moves = board.get_all_legal_moves(color)
    if not legal_moves:
        return None

    depth = DEPTH_MAP.get(difficulty, 2)

    # Easy — 합법 수 중 무작위 선택
    if depth == 0:
        return random.choice(legal_moves)

    # Minimax 탐색
    best_move = None
    best_score = float("-inf")
    alpha = float("-inf")
    beta = float("inf")

    for move in legal_moves:
        test_board = board.copy()
        test_board.move_piece(move)
        score = minimax(test_board, depth - 1, alpha, beta, False, color)
        if score > best_score:
            best_score = score
            best_move = move
        alpha = max(alpha, score)

    return best_move or legal_moves[0]


def minimax(
    board: Board,
    depth: int,
    alpha: float,
    beta: float,
    maximizing_player: bool,
    ai_color: str,
) -> float:
    """
    Minimax with alpha-beta pruning.
    maximizing_player=True 이면 ai_color 차례.
    """
    if depth == 0:
        return evaluate_board(board, ai_color)

    current = ai_color if maximizing_player else ("black" if ai_color == "white" else "white")
    moves = board.get_all_legal_moves(current)

    if not moves:
        if board.is_check(current):
            # 체크메이트 — maximizing이면 최악
            return -99999 if maximizing_player else 99999
        return 0  # 스테일메이트

    if maximizing_player:
        max_eval = float("-inf")
        for move in moves:
            child = board.copy()
            child.move_piece(move)
            eval_score = minimax(child, depth - 1, alpha, beta, False, ai_color)
            max_eval = max(max_eval, eval_score)
            alpha = max(alpha, eval_score)
            if beta <= alpha:
                break
        return max_eval

    min_eval = float("inf")
    for move in moves:
        child = board.copy()
        child.move_piece(move)
        eval_score = minimax(child, depth - 1, alpha, beta, True, ai_color)
        min_eval = min(min_eval, eval_score)
        beta = min(beta, eval_score)
        if beta <= alpha:
            break
    return min_eval
