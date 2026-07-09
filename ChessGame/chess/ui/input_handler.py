"""마우스·키보드 입력 처리."""

from typing import List, Optional, Tuple

import pygame

from chess.core.board import Board
from chess.core.move import Move
from chess.ui.board_view import BoardView


class InputHandler:
    """기물 선택 → 이동 클릭 흐름을 처리합니다."""

    def __init__(self, board_view: BoardView):
        self.view = board_view
        self.selected: Optional[Tuple[int, int]] = None
        self.legal_targets: List[Tuple[int, int]] = []

    def reset_selection(self) -> None:
        self.selected = None
        self.legal_targets = []

    def handle_board_click(
        self,
        board: Board,
        event: pygame.event.Event,
    ) -> Optional[Move]:
        """
        보드 클릭 시 Move 반환 (이동 완료 시).
        기물 선택/변경만 하면 None.
        """
        if event.type != pygame.MOUSEBUTTONDOWN or event.button != 1:
            return None

        sq = self.view.pixel_to_square(event.pos)
        if sq is None:
            self.reset_selection()
            return None

        row, col = sq

        # 이미 선택된 기물이 있고 합법 목적지 클릭
        if self.selected and (row, col) in self.legal_targets:
            fr, fc = self.selected
            move = Move(fr, fc, row, col)
            self.reset_selection()
            return move

        # 같은 칸 재클릭 → 선택 해제
        if self.selected == (row, col):
            self.reset_selection()
            return None

        # 자기 기물 선택
        piece = board.get_piece(row, col)
        if piece and piece.color == board.current_turn:
            self.selected = (row, col)
            self.legal_targets = board.get_legal_moves_for_piece(row, col)
            return None

        self.reset_selection()
        return None
