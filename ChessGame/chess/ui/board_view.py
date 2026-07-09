"""체스판 및 UI 요소 렌더링."""

import pygame
from typing import List, Optional, Tuple

from chess.core.board import Board
from chess.core.rules import GameState
from chess.ui.piece_sprite import draw_piece

# 색상 팔레트
LIGHT_SQUARE = (240, 217, 181)
DARK_SQUARE = (181, 136, 99)
HIGHLIGHT = (186, 202, 68, 180)
SELECTED = (246, 246, 105, 200)
CHECK_HIGHLIGHT = (255, 80, 80, 180)
PANEL_BG = (45, 45, 48)
TEXT_COLOR = (230, 230, 230)
BUTTON_COLOR = (70, 70, 75)
BUTTON_HOVER = (90, 90, 100)
MENU_BG = (30, 30, 35)

SQUARE_SIZE = 72
BOARD_SIZE = SQUARE_SIZE * 8
PANEL_WIDTH = 280
WINDOW_WIDTH = BOARD_SIZE + PANEL_WIDTH
WINDOW_HEIGHT = BOARD_SIZE + 40


class Button:
    """간단한 클릭 버튼."""

    def __init__(self, rect: pygame.Rect, text: str, font: pygame.font.Font):
        self.rect = rect
        self.text = text
        self.font = font

    def draw(self, surface: pygame.Surface) -> None:
        mouse = pygame.mouse.get_pos()
        color = BUTTON_HOVER if self.rect.collidepoint(mouse) else BUTTON_COLOR
        pygame.draw.rect(surface, color, self.rect, border_radius=6)
        pygame.draw.rect(surface, (120, 120, 130), self.rect, 1, border_radius=6)
        text_surf = self.font.render(self.text, True, TEXT_COLOR)
        text_rect = text_surf.get_rect(center=self.rect.center)
        surface.blit(text_surf, text_rect)

    def is_clicked(self, event: pygame.event.Event) -> bool:
        return (
            event.type == pygame.MOUSEBUTTONDOWN
            and event.button == 1
            and self.rect.collidepoint(event.pos)
        )


class BoardView:
    """체스판·패널·메뉴 화면을 그립니다."""

    def __init__(self, screen: pygame.Surface):
        self.screen = screen
        self.font = pygame.font.SysFont("malgungothic", 18)
        self.title_font = pygame.font.SysFont("malgungothic", 36)
        self.small_font = pygame.font.SysFont("malgungothic", 14)
        self.board_offset_y = 20

    def square_to_pixel(self, row: int, col: int) -> pygame.Rect:
        """보드 좌표 → 화면 사각형."""
        x = col * SQUARE_SIZE
        y = self.board_offset_y + row * SQUARE_SIZE
        return pygame.Rect(x, y, SQUARE_SIZE, SQUARE_SIZE)

    def pixel_to_square(self, pos: Tuple[int, int]) -> Optional[Tuple[int, int]]:
        """화면 좌표 → 보드 (row, col)."""
        x, y = pos
        if x >= BOARD_SIZE:
            return None
        row = (y - self.board_offset_y) // SQUARE_SIZE
        col = x // SQUARE_SIZE
        if 0 <= row < 8 and 0 <= col < 8:
            return (row, col)
        return None

    def draw_board(
        self,
        board: Board,
        selected: Optional[Tuple[int, int]] = None,
        legal_moves: Optional[List[Tuple[int, int]]] = None,
        game_state: GameState = GameState.PLAYING,
    ) -> None:
        """체스판과 기물을 그립니다."""
        legal_moves = legal_moves or []

        # 체크된 킹 위치
        check_king_pos = None
        if game_state in (GameState.CHECK, GameState.CHECKMATE):
            check_king_pos = board.find_king(board.current_turn)

        for row in range(8):
            for col in range(8):
                rect = self.square_to_pixel(row, col)
                is_light = (row + col) % 2 == 0
                color = LIGHT_SQUARE if is_light else DARK_SQUARE
                pygame.draw.rect(self.screen, color, rect)

                # 선택·이동 가능·체크 하이라이트
                if selected and (row, col) == selected:
                    s = pygame.Surface((SQUARE_SIZE, SQUARE_SIZE), pygame.SRCALPHA)
                    s.fill(SELECTED)
                    self.screen.blit(s, rect.topleft)
                elif (row, col) in legal_moves:
                    s = pygame.Surface((SQUARE_SIZE, SQUARE_SIZE), pygame.SRCALPHA)
                    s.fill(HIGHLIGHT)
                    self.screen.blit(s, rect.topleft)
                    # 이동 가능 점
                    cx, cy = rect.center
                    pygame.draw.circle(self.screen, (60, 80, 40), (cx, cy), 8)

                if check_king_pos and (row, col) == check_king_pos:
                    s = pygame.Surface((SQUARE_SIZE, SQUARE_SIZE), pygame.SRCALPHA)
                    s.fill(CHECK_HIGHLIGHT)
                    self.screen.blit(s, rect.topleft)

                piece = board.get_piece(row, col)
                if piece:
                    draw_piece(self.screen, piece.color, piece.symbol, rect)

        # 파일·랭크 라벨
        files = "abcdefgh"
        for i, f in enumerate(files):
            label = self.small_font.render(f, True, (80, 80, 80))
            self.screen.blit(label, (i * SQUARE_SIZE + 4, self.board_offset_y + BOARD_SIZE + 2))
        for i in range(8):
            label = self.small_font.render(str(8 - i), True, (80, 80, 80))
            self.screen.blit(label, (BOARD_SIZE + 2, self.board_offset_y + i * SQUARE_SIZE + 4))

    def draw_side_panel(
        self,
        board: Board,
        game_state: GameState,
        buttons: List[Button],
        status_text: str = "",
    ) -> None:
        """우측 정보 패널."""
        panel = pygame.Rect(BOARD_SIZE, 0, PANEL_WIDTH, WINDOW_HEIGHT)
        pygame.draw.rect(self.screen, PANEL_BG, panel)

        y = 16
        title = self.font.render("Chess Game", True, TEXT_COLOR)
        self.screen.blit(title, (BOARD_SIZE + 16, y))
        y += 36

        turn = "백(White)" if board.current_turn == "white" else "흑(Black)"
        turn_surf = self.font.render(f"현재 턴: {turn}", True, TEXT_COLOR)
        self.screen.blit(turn_surf, (BOARD_SIZE + 16, y))
        y += 30

        state_messages = {
            GameState.CHECK: "체크!",
            GameState.CHECKMATE: "체크메이트!",
            GameState.STALEMATE: "스테일메이트 (무승부)",
            GameState.GAME_OVER: "게임 종료",
        }
        msg = state_messages.get(game_state, "")
        if status_text:
            msg = status_text
        if msg:
            surf = self.font.render(msg, True, (255, 200, 100))
            self.screen.blit(surf, (BOARD_SIZE + 16, y))
            y += 30

        # 기보
        hist_title = self.font.render("Move History", True, TEXT_COLOR)
        self.screen.blit(hist_title, (BOARD_SIZE + 16, y))
        y += 24

        moves = board.get_move_notations()
        # 최근 12수만 표시
        display_moves = moves[-12:]
        start_idx = len(moves) - len(display_moves)
        for i, notation in enumerate(display_moves):
            num = start_idx + i + 1
            line = self.small_font.render(f"{num}. {notation}", True, (180, 180, 180))
            self.screen.blit(line, (BOARD_SIZE + 16, y))
            y += 18

        # 버튼
        for btn in buttons:
            btn.draw(self.screen)

    def draw_menu(self, buttons: List[Button], subtitle: str = "") -> None:
        """메인 메뉴 화면."""
        self.screen.fill(MENU_BG)
        title = self.title_font.render("Python Chess", True, TEXT_COLOR)
        title_rect = title.get_rect(center=(WINDOW_WIDTH // 2, 80))
        self.screen.blit(title, title_rect)

        if subtitle:
            sub = self.font.render(subtitle, True, (160, 160, 160))
            sub_rect = sub.get_rect(center=(WINDOW_WIDTH // 2, 130))
            self.screen.blit(sub, sub_rect)

        for btn in buttons:
            btn.draw(self.screen)

    def draw_promotion_menu(self, color: str, buttons: List[Button]) -> None:
        """프로모션 기물 선택 오버레이."""
        overlay = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 160))
        self.screen.blit(overlay, (0, 0))

        label = self.font.render("승격할 기물을 선택하세요", True, TEXT_COLOR)
        label_rect = label.get_rect(center=(WINDOW_WIDTH // 2, 60))
        self.screen.blit(label, label_rect)

        for btn in buttons:
            btn.draw(self.screen)
