import pygame
import sys


# =========================
# 오셀로(리버시) 기본 규칙
# =========================
# 1) 게임은 8x8 보드에서 진행하며, 흑이 먼저 시작한다.
# 2) 자신의 돌을 빈 칸에 두었을 때, 한 방향 이상에서
#    "내 돌 - 상대 돌(1개 이상) - 내가 지금 둔 돌" 형태가 되면 유효한 수다.
# 3) 유효한 수를 두면, 그 사이에 있는 상대 돌은 모두 내 돌로 뒤집힌다.
# 4) 둘 수 있는 자리가 있으면 반드시 착수해야 하며, 없을 때만 패스한다.
# 5) 양쪽 플레이어 모두 둘 수 없으면 게임이 종료된다.
# 6) 종료 시 보드 위 돌 개수가 더 많은 플레이어가 승리한다.
#
# 이 코드에서는:
# - 흑 돌을 1(BLACK_STONE), 백 돌을 -1(WHITE_STONE)로 표현한다.
# - 착수 가능 여부는 get_flippable_stones()로 판정한다.
#

# =========================
# 화면 및 게임 기본 설정
# =========================
CELL_SIZE = 80  # 칸 하나의 픽셀 크기
BOARD_SIZE = 8  # 오셀로는 8x8 고정
INFO_HEIGHT = 80  # 하단 정보 영역 높이
WIDTH = CELL_SIZE * BOARD_SIZE
HEIGHT = CELL_SIZE * BOARD_SIZE + INFO_HEIGHT

# 색상 정의 (RGB)
BG_GREEN = (18, 128, 61)
GRID_DARK = (7, 82, 34)
BLACK = (15, 15, 15)
WHITE = (240, 240, 240)
HIGHLIGHT = (255, 215, 0)
TEXT_COLOR = (250, 250, 250)
INFO_BG = (30, 30, 30)
BUTTON_BG = (220, 80, 80)
BUTTON_TEXT = (255, 255, 255)

# 보드에서 사용할 값
EMPTY = 0
BLACK_STONE = 1
WHITE_STONE = -1

# 8방향 탐색 (가로/세로/대각선)
DIRECTIONS = [
    (-1, -1), (-1, 0), (-1, 1),
    (0, -1),           (0, 1),
    (1, -1),  (1, 0),  (1, 1),
]


def create_board():
    """
    오셀로 시작 보드 생성.
    중앙 4칸에 흑/백 돌을 배치한다.
    """
    board = [[EMPTY for _ in range(BOARD_SIZE)] for _ in range(BOARD_SIZE)]
    mid = BOARD_SIZE // 2
    board[mid - 1][mid - 1] = WHITE_STONE
    board[mid][mid] = WHITE_STONE
    board[mid - 1][mid] = BLACK_STONE
    board[mid][mid - 1] = BLACK_STONE
    return board


def inside_board(r, c):
    """좌표가 보드 안에 있는지 검사."""
    return 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE


def get_flippable_stones(board, row, col, player):
    """
    (row, col)에 player가 두었을 때 뒤집히는 돌 목록 반환.
    뒤집을 돌이 하나도 없으면 빈 리스트를 반환한다.
    """
    if board[row][col] != EMPTY:
        return []

    to_flip = []

    for dr, dc in DIRECTIONS:
        r, c = row + dr, col + dc
        line = []

        # 1) 첫 칸부터 상대 돌이 연속으로 이어져야 함
        while inside_board(r, c) and board[r][c] == -player:
            line.append((r, c))
            r += dr
            c += dc

        # 2) 그 끝이 내 돌이어야 뒤집기 성립
        if inside_board(r, c) and board[r][c] == player and line:
            to_flip.extend(line)

    return to_flip


def get_valid_moves(board, player):
    """현재 player가 둘 수 있는 모든 좌표를 반환."""
    moves = []
    for r in range(BOARD_SIZE):
        for c in range(BOARD_SIZE):
            if get_flippable_stones(board, r, c, player):
                moves.append((r, c))
    return moves


def apply_move(board, row, col, player):
    """
    착수를 보드에 반영.
    성공하면 True, 둘 수 없는 자리면 False 반환.
    """
    flips = get_flippable_stones(board, row, col, player)
    if not flips:
        return False

    board[row][col] = player
    for r, c in flips:
        board[r][c] = player
    return True


def count_stones(board):
    """흑/백 돌 개수 세기."""
    black = 0
    white = 0
    for row in board:
        for cell in row:
            if cell == BLACK_STONE:
                black += 1
            elif cell == WHITE_STONE:
                white += 1
    return black, white


def choose_ai_move(board, valid_moves, player):
    """
    컴퓨터가 둘 위치를 선택한다.
    - 코너(모서리)는 매우 강력하므로 높은 점수를 준다.
    - 코너 바로 옆(X, C 자리)은 상대에게 코너를 내줄 위험이 있어 감점한다.
    - 현재 수를 둔 뒤 "내가 둘 수 있는 자리 수(기동성)"도 반영한다.
    - 한 번에 많이 뒤집는 수를 약하게 반영해 전체 균형을 맞춘다.
    """
    if not valid_moves:
        return None

    # 오셀로 8x8에서 자주 쓰는 위치 가중치 테이블
    # 값이 클수록 좋은 자리, 음수는 위험한 자리
    pos_weight = [
        [120, -20, 20, 5, 5, 20, -20, 120],
        [-20, -40, -5, -5, -5, -5, -40, -20],
        [20, -5, 15, 3, 3, 15, -5, 20],
        [5, -5, 3, 3, 3, 3, -5, 5],
        [5, -5, 3, 3, 3, 3, -5, 5],
        [20, -5, 15, 3, 3, 15, -5, 20],
        [-20, -40, -5, -5, -5, -5, -40, -20],
        [120, -20, 20, 5, 5, 20, -20, 120],
    ]

    best_move = None
    best_score = -10**9

    for row, col in valid_moves:
        flips = get_flippable_stones(board, row, col, player)
        score = 0

        # 1) 위치 자체의 전략적 가치
        score += pos_weight[row][col] * 10

        # 2) 즉시 뒤집는 돌 개수 (보조 지표)
        score += len(flips) * 2

        # 3) 수를 둔 뒤의 기동성(내 수는 늘리고, 상대 수는 줄이는 방향)
        sim_board = [line[:] for line in board]
        apply_move(sim_board, row, col, player)
        my_next_moves = get_valid_moves(sim_board, player)
        op_next_moves = get_valid_moves(sim_board, -player)
        score += len(my_next_moves) * 3
        score -= len(op_next_moves) * 4

        # 4) 코너를 직접 차지하면 큰 보너스
        if (row, col) in [(0, 0), (0, 7), (7, 0), (7, 7)]:
            score += 500

        # 5) 아직 비어 있는 코너 주변(X, C) 위험 칸은 감점
        corner_danger = {
            (0, 0): [(1, 1), (0, 1), (1, 0)],
            (0, 7): [(1, 6), (0, 6), (1, 7)],
            (7, 0): [(6, 1), (6, 0), (7, 1)],
            (7, 7): [(6, 6), (6, 7), (7, 6)],
        }
        for corner, danger_cells in corner_danger.items():
            cr, cc = corner
            if board[cr][cc] == EMPTY and (row, col) in danger_cells:
                score -= 120

        if score > best_score:
            best_score = score
            best_move = (row, col)

    return best_move


def advance_turn(board, current_player):
    """
    턴 전환과 패스/게임 종료를 한 번에 처리한다.
    반환값:
    - next_player: 다음 플레이어
    - next_valid_moves: 다음 플레이어의 유효 수 목록
    - is_game_over: 게임 종료 여부
    - passed: 상대가 둘 수 없어 패스가 발생했는지 여부
    """
    next_player = -current_player
    next_valid_moves = get_valid_moves(board, next_player)

    if next_valid_moves:
        return next_player, next_valid_moves, False, False

    # 상대가 둘 수 없으면 다시 현재 플레이어 차례(패스 발생)
    next_player = current_player
    next_valid_moves = get_valid_moves(board, next_player)
    if next_valid_moves:
        return next_player, next_valid_moves, False, True

    # 양쪽 모두 둘 수 없으면 게임 종료
    return next_player, next_valid_moves, True, False


def draw_board(screen, board, valid_moves, current_player, font, game_over, human_player, ai_player):
    """보드, 돌, 착수 가능 위치, 하단 정보 UI 렌더링."""
    screen.fill(BG_GREEN)

    # 보드 격자 그리기
    for r in range(BOARD_SIZE):
        for c in range(BOARD_SIZE):
            rect = pygame.Rect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE)
            pygame.draw.rect(screen, GRID_DARK, rect, 2)

            # 돌 그리기
            center = (c * CELL_SIZE + CELL_SIZE // 2, r * CELL_SIZE + CELL_SIZE // 2)
            if board[r][c] == BLACK_STONE:
                pygame.draw.circle(screen, BLACK, center, CELL_SIZE // 2 - 8)
            elif board[r][c] == WHITE_STONE:
                pygame.draw.circle(screen, WHITE, center, CELL_SIZE // 2 - 8)
                pygame.draw.circle(screen, BLACK, center, CELL_SIZE // 2 - 8, 1)

    # 둘 수 있는 자리 표시 (작은 노란 점)
    for r, c in valid_moves:
        center = (c * CELL_SIZE + CELL_SIZE // 2, r * CELL_SIZE + CELL_SIZE // 2)
        pygame.draw.circle(screen, HIGHLIGHT, center, 7)

    # 하단 정보 영역
    info_rect = pygame.Rect(0, CELL_SIZE * BOARD_SIZE, WIDTH, INFO_HEIGHT)
    pygame.draw.rect(screen, INFO_BG, info_rect)

    black_count, white_count = count_stones(board)
    next_player_text = "다음 플레이어: 흑" if current_player == BLACK_STONE else "다음 플레이어: 백"
    score_text = f"흑: {black_count}   백: {white_count}"
    if black_count > white_count:
        winner_text = "승자: 흑"
    elif white_count > black_count:
        winner_text = "승자: 백"
    else:
        winner_text = "승자: 무승부"

    help_text = "R: 재시작 / ESC: 종료"
    player_mode_text = f"내:{'흑' if human_player == BLACK_STONE else '백'} 컴:{'흑' if ai_player == BLACK_STONE else '백'}"

    next_surface = font.render(next_player_text, True, TEXT_COLOR)
    score_surface = font.render(score_text, True, TEXT_COLOR)
    winner_surface = font.render(winner_text, True, TEXT_COLOR)
    help_surface = font.render(help_text, True, (200, 200, 200))
    mode_surface = font.render(player_mode_text, True, (220, 220, 220))

    screen.blit(next_surface, (15, CELL_SIZE * BOARD_SIZE + 8))
    screen.blit(score_surface, (15, CELL_SIZE * BOARD_SIZE + 38))
    screen.blit(winner_surface, (300, CELL_SIZE * BOARD_SIZE + 8))
    screen.blit(mode_surface, (500, CELL_SIZE * BOARD_SIZE + 8))
    screen.blit(help_surface, (230, CELL_SIZE * BOARD_SIZE + 38))

    # 게임이 끝난 뒤에는 "종료(초기화)" 버튼을 표시해서 클릭으로 새 게임을 시작하게 한다.
    end_button_rect = pygame.Rect(WIDTH - 190, CELL_SIZE * BOARD_SIZE + 12, 175, 52)
    if game_over:
        pygame.draw.rect(screen, BUTTON_BG, end_button_rect, border_radius=8)
        pygame.draw.rect(screen, (30, 30, 30), end_button_rect, 2, border_radius=8)
        button_text_surface = font.render("종료(초기화)", True, BUTTON_TEXT)
        button_text_rect = button_text_surface.get_rect(center=end_button_rect.center)
        screen.blit(button_text_surface, button_text_rect)

    return end_button_rect


def show_message(screen, message, font):
    """화면 중앙에 반투명 메시지 박스를 띄운다."""
    overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
    overlay.fill((0, 0, 0, 120))
    screen.blit(overlay, (0, 0))

    box_rect = pygame.Rect(60, HEIGHT // 2 - 45, WIDTH - 120, 90)
    pygame.draw.rect(screen, (245, 245, 245), box_rect, border_radius=12)
    pygame.draw.rect(screen, (25, 25, 25), box_rect, 2, border_radius=12)

    msg_surface = font.render(message, True, (20, 20, 20))
    msg_rect = msg_surface.get_rect(center=box_rect.center)
    screen.blit(msg_surface, msg_rect)


def game_result_text(board):
    """최종 점수 기준으로 승패 문구 생성."""
    black, white = count_stones(board)
    if black > white:
        return f"게임 종료 - 흑 승리! ({black}:{white})"
    if white > black:
        return f"게임 종료 - 백 승리! ({black}:{white})"
    return f"게임 종료 - 무승부! ({black}:{white})"


def main():
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("오셀로 (Pygame)")
    clock = pygame.time.Clock()
    font = pygame.font.SysFont("malgungothic", 26)  # 한글 표시용 기본 폰트

    board = create_board()
    current_player = BLACK_STONE
    valid_moves = get_valid_moves(board, current_player)
    game_over = False
    pass_message_timer = 0  # 패스 메시지를 잠깐 보여주기 위한 타이머(ms)
    end_button_rect = pygame.Rect(WIDTH - 190, CELL_SIZE * BOARD_SIZE + 12, 175, 52)
    selecting_side = True  # 시작 시 플레이어 색 선택 화면 표시
    human_player = BLACK_STONE
    ai_player = WHITE_STONE

    while True:
        dt = clock.tick(60)  # 프레임 제한 (60 FPS)
        if pass_message_timer > 0:
            pass_message_timer -= dt

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    pygame.quit()
                    sys.exit()
                elif selecting_side and event.key == pygame.K_b:
                    # 플레이어가 흑을 선택하면 컴퓨터는 백
                    human_player = BLACK_STONE
                    ai_player = WHITE_STONE
                    selecting_side = False
                elif selecting_side and event.key == pygame.K_w:
                    # 플레이어가 백을 선택하면 컴퓨터는 흑
                    human_player = WHITE_STONE
                    ai_player = BLACK_STONE
                    selecting_side = False
                elif event.key == pygame.K_r:
                    # 게임 초기화
                    board = create_board()
                    current_player = BLACK_STONE
                    valid_moves = get_valid_moves(board, current_player)
                    game_over = False
                    pass_message_timer = 0
                    selecting_side = True

            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                mx, my = event.pos

                # 색 선택 화면에서는 보드 클릭을 받지 않는다.
                if selecting_side:
                    continue

                # 게임 종료 후에는 종료(초기화) 버튼 클릭으로 게임을 새로 시작한다.
                if game_over and end_button_rect.collidepoint(mx, my):
                    board = create_board()
                    current_player = BLACK_STONE
                    valid_moves = get_valid_moves(board, current_player)
                    game_over = False
                    pass_message_timer = 0
                    selecting_side = True
                    continue

                if game_over:
                    continue

                # 하단 정보 영역 클릭은 무시
                if my >= CELL_SIZE * BOARD_SIZE:
                    continue

                row = my // CELL_SIZE
                col = mx // CELL_SIZE

                # 유효한 수인지 확인 후 착수
                if current_player == human_player and apply_move(board, row, col, current_player):
                    current_player, valid_moves, game_over, passed = advance_turn(board, current_player)
                    if passed:
                        pass_message_timer = 1200

        # 색 선택이 끝났고, 현재 턴이 컴퓨터라면 자동으로 착수한다.
        if not selecting_side and not game_over and current_player == ai_player:
            ai_move = choose_ai_move(board, valid_moves, ai_player)
            if ai_move is not None:
                ai_row, ai_col = ai_move
                apply_move(board, ai_row, ai_col, ai_player)
                current_player, valid_moves, game_over, passed = advance_turn(board, ai_player)
                if passed:
                    pass_message_timer = 1200

        end_button_rect = draw_board(
            screen, board, valid_moves, current_player, font, game_over, human_player, ai_player
        )

        if pass_message_timer > 0 and not game_over:
            show_message(screen, "상대가 둘 곳이 없어 패스합니다", font)

        if selecting_side:
            show_message(screen, "돌 색 선택: B(흑) 또는 W(백)", font)

        if game_over:
            show_message(screen, game_result_text(board), font)

        pygame.display.flip()


if __name__ == "__main__":
    main()
