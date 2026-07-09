"""
Python Chess — 메인 진입점
spec.md 설계에 따른 Pygame 체스 게임
"""

import sys
from pathlib import Path

import pygame

from chess.ai.minimax import get_best_move
from chess.core.game import GameManager
from chess.core.move import Move
from chess.core.rules import GameState
from chess.ui.board_view import (
    BOARD_SIZE,
    Button,
    BoardView,
    PANEL_WIDTH,
    WINDOW_HEIGHT,
    WINDOW_WIDTH,
)
from chess.ui.input_handler import InputHandler

# PyInstaller exe 실행 시 리소스 경로 보정
if getattr(sys, "frozen", False):
    BASE_DIR = Path(sys.executable).parent
else:
    BASE_DIR = Path(__file__).resolve().parent


def create_menu_buttons(view: BoardView, y_start: int) -> list:
    """메인 메뉴 버튼 생성."""
    font = view.font
    bw, bh, gap = 220, 44, 12
    cx = WINDOW_WIDTH // 2 - bw // 2
    labels = [
        ("새 게임 (2인)", "new_two"),
        ("AI 대전 (Easy)", "ai_easy"),
        ("AI 대전 (Medium)", "ai_medium"),
        ("AI 대전 (Hard)", "ai_hard"),
        ("기보 불러오기", "load"),
        ("종료", "quit"),
    ]
    buttons = []
    y = y_start
    for text, action in labels:
        rect = pygame.Rect(cx, y, bw, bh)
        btn = Button(rect, text, font)
        btn.action = action
        buttons.append(btn)
        y += bh + gap
    return buttons


def create_game_buttons(view: BoardView) -> list:
    """게임 중 사이드 패널 버튼."""
    font = view.font
    x = BOARD_SIZE + 16
    bw, bh, gap = PANEL_WIDTH - 32, 36, 8
    y = WINDOW_HEIGHT - 4 * (bh + gap) - 16
    specs = [
        ("Undo", "undo"),
        ("Save", "save"),
        ("메뉴", "menu"),
        ("종료", "quit"),
    ]
    buttons = []
    for text, action in specs:
        rect = pygame.Rect(x, y, bw, bh)
        btn = Button(rect, text, font)
        btn.action = action
        buttons.append(btn)
        y += bh + gap
    return buttons


def create_promotion_buttons(view: BoardView) -> list:
    """프로모션 선택 버튼 (Q, R, B, N)."""
    font = view.font
    symbols = [("퀸 (Q)", "Q"), ("룩 (R)", "R"), ("비숍 (B)", "B"), ("나이트 (N)", "N")]
    bw, bh, gap = 120, 44, 10
    total_w = len(symbols) * bw + (len(symbols) - 1) * gap
    x = WINDOW_WIDTH // 2 - total_w // 2
    y = 200
    buttons = []
    for text, sym in symbols:
        rect = pygame.Rect(x, y, bw, bh)
        btn = Button(rect, text, font)
        btn.promo = sym
        buttons.append(btn)
        x += bw + gap
    return buttons


def run_ai_move(game: GameManager) -> None:
    """AI 차례이면 수를 계산해 둡니다."""
    if not game.is_ai_turn():
        return
    if game.state == GameState.GAME_OVER:
        return
    move = get_best_move(
        game.board,
        game.ai_color,
        game.ai_difficulty,
    )
    if move:
        game.make_move(move)


def main() -> None:
    pygame.init()
    screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    pygame.display.set_caption("Python Chess")
    clock = pygame.time.Clock()

    game = GameManager()
    game.save_dir = BASE_DIR / "save"

    view = BoardView(screen)
    input_handler = InputHandler(view)

    menu_buttons = create_menu_buttons(view, 180)
    game_buttons: list = []
    promo_buttons: list = []
    status_text = ""
    running = True

    while running:
        clock.tick(60)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
                continue

            # 메뉴 화면
            if game.state == GameState.MENU:
                for btn in menu_buttons:
                    if btn.is_clicked(event):
                        action = btn.action
                        if action == "new_two":
                            game.new_game("two_player")
                            game_buttons = create_game_buttons(view)
                            input_handler.reset_selection()
                        elif action.startswith("ai_"):
                            diff = action.split("_")[1]
                            game.new_game("vs_ai", diff)
                            game_buttons = create_game_buttons(view)
                            input_handler.reset_selection()
                        elif action == "load":
                            files = game.list_save_files()
                            if files:
                                game.load_game(files[0])
                                game_buttons = create_game_buttons(view)
                                game.state = GameState.PLAYING
                                status_text = f"불러옴: {files[0]}"
                            else:
                                status_text = "저장 파일 없음"
                        elif action == "quit":
                            running = False
                continue

            # 프로모션 선택
            if game.pending_promotion:
                if not promo_buttons:
                    promo_buttons = create_promotion_buttons(view)
                for btn in promo_buttons:
                    if btn.is_clicked(event):
                        pending = game.pending_promotion
                        move = Move(
                            pending.from_row,
                            pending.from_col,
                            pending.to_row,
                            pending.to_col,
                            promotion=btn.promo,
                        )
                        game.make_move(move)
                        promo_buttons = []
                        run_ai_move(game)
                continue

            # 게임 화면
            if game.state in (
                GameState.PLAYING,
                GameState.CHECK,
                GameState.GAME_OVER,
            ):
                # 사이드 버튼
                for btn in game_buttons:
                    if btn.is_clicked(event):
                        if btn.action == "undo":
                            game.undo_move()
                            if game.mode == "vs_ai" and game.board.current_turn == game.ai_color:
                                game.undo_move()
                            input_handler.reset_selection()
                        elif btn.action == "save":
                            path = game.save_game()
                            status_text = f"저장: {Path(path).name}"
                        elif btn.action == "menu":
                            game.state = GameState.MENU
                            status_text = ""
                            input_handler.reset_selection()
                        elif btn.action == "quit":
                            running = False

                # AI 차례가 아닐 때만 입력
                if not game.is_ai_turn() and game.state != GameState.GAME_OVER:
                    move = input_handler.handle_board_click(game.board, event)
                    if move:
                        if game.make_move(move):
                            run_ai_move(game)

        # --- 렌더링 ---
        screen.fill((50, 50, 55))

        if game.state == GameState.MENU:
            view.draw_menu(menu_buttons, status_text)
        else:
            selected = input_handler.selected
            legal = input_handler.legal_targets if selected else []
            view.draw_board(
                game.board,
                selected=selected,
                legal_moves=legal,
                game_state=game.state,
            )
            view.draw_side_panel(
                game.board,
                game.state,
                game_buttons,
                status_text=status_text,
            )

            if game.pending_promotion:
                if not promo_buttons:
                    promo_buttons = create_promotion_buttons(view)
                color = game.board.current_turn
                view.draw_promotion_menu(color, promo_buttons)

            # 게임 종료 메시지
            if game.state == GameState.GAME_OVER:
                winner = game.get_winner()
                if winner:
                    status_text = f"{'백' if winner == 'white' else '흑'} 승리!"
                elif game.board.is_stalemate(game.board.current_turn):
                    status_text = "무승부 (스테일메이트)"

        # AI 차례 자동 실행 (이벤트 루프 밖에서도 한 번 체크)
        if game.is_ai_turn() and game.state not in (GameState.MENU, GameState.GAME_OVER):
            if not game.pending_promotion:
                run_ai_move(game)

        pygame.display.flip()

    pygame.quit()
    sys.exit(0)


if __name__ == "__main__":
    main()
