"""체스 규칙 검증 및 게임 종료 판정."""

from enum import Enum
from typing import Optional

from chess.core.board import Board


class GameState(Enum):
    """spec.md §6 게임 상태."""

    MENU = "menu"
    PLAYING = "playing"
    CHECK = "check"
    CHECKMATE = "checkmate"
    STALEMATE = "stalemate"
    PAUSED = "paused"
    GAME_OVER = "game_over"


def evaluate_game_state(board: Board) -> GameState:
    """현재 보드에서 게임 상태를 판정합니다."""
    color = board.current_turn

    if board.is_checkmate(color):
        return GameState.CHECKMATE
    if board.is_stalemate(color):
        return GameState.STALEMATE
    if board.is_check(color):
        return GameState.CHECK
    return GameState.PLAYING


def is_promotion_move(board: Board, from_row: int, from_col: int, to_row: int) -> bool:
    """폰이 마지막 랭크에 도달하는 이동인지."""
    piece = board.get_piece(from_row, from_col)
    if piece is None or piece.symbol != "P":
        return False
    return to_row == 0 or to_row == 7


def validate_move(board: Board, from_pos: tuple, to_pos: tuple) -> bool:
    """이동이 합법적인지 간단 검증."""
    fr, fc = from_pos
    tr, tc = to_pos
    legal = board.get_legal_moves_for_piece(fr, fc)
    return (tr, tc) in legal
