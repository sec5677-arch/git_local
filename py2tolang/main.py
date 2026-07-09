from typing import List, Optional


def create_board() -> List[str]:
    """3x3 틱택토 보드를 생성합니다."""
    # 빈 칸은 공백 문자열(" ")로 표현합니다.
    return [" "] * 9


def print_board(board: List[str]) -> None:
    """현재 보드 상태를 보기 쉽게 출력합니다."""
    print("\n현재 보드:")
    for row in range(3):
        start = row * 3
        cells = board[start:start + 3]
        # 빈 칸은 위치 번호(1~9)를 보여주면 사용자가 입력하기 쉽습니다.
        display_cells = [
            str(start + index + 1) if cell == " " else cell
            for index, cell in enumerate(cells)
        ]
        print(f" {display_cells[0]} | {display_cells[1]} | {display_cells[2]} ")
        if row < 2:
            print("---+---+---")
    print()


def check_winner(board: List[str]) -> Optional[str]:
    """승리한 플레이어(X 또는 O)가 있으면 반환하고, 없으면 None을 반환합니다."""
    # 가로 3줄, 세로 3줄, 대각선 2줄
    win_conditions = [
        (0, 1, 2), (3, 4, 5), (6, 7, 8),  # 가로
        (0, 3, 6), (1, 4, 7), (2, 5, 8),  # 세로
        (0, 4, 8), (2, 4, 6),             # 대각선
    ]

    for a, b, c in win_conditions:
        if board[a] != " " and board[a] == board[b] == board[c]:
            return board[a]
    return None


def is_draw(board: List[str]) -> bool:
    """모든 칸이 찼고 승자가 없으면 무승부입니다."""
    return " " not in board


def get_valid_move(board: List[str], player: str) -> int:
    """
    플레이어에게 올바른 수를 입력받아 0~8 인덱스로 반환합니다.
    - 1~9 범위가 아닌 입력
    - 숫자가 아닌 입력
    - 이미 사용한 칸
    위 경우에는 다시 입력받습니다.
    """
    while True:
        user_input = input(f"플레이어 {player} 차례입니다. 놓을 칸 번호(1~9): ").strip()

        if not user_input.isdigit():
            print("숫자만 입력해 주세요.")
            continue

        position = int(user_input)
        if position < 1 or position > 9:
            print("1부터 9 사이의 숫자를 입력해 주세요.")
            continue

        index = position - 1
        if board[index] != " ":
            print("이미 선택된 칸입니다. 다른 칸을 선택해 주세요.")
            continue

        return index


def switch_player(player: str) -> str:
    """현재 플레이어를 X <-> O로 바꿉니다."""
    return "O" if player == "X" else "X"


def play_tic_tac_toe() -> None:
    """틱택토 게임 한 판을 진행합니다."""
    board = create_board()
    current_player = "X"

    print("=== 틱택토 게임 시작 ===")
    print("칸 번호를 입력해 말을 놓으세요.")

    while True:
        print_board(board)
        move_index = get_valid_move(board, current_player)
        board[move_index] = current_player

        winner = check_winner(board)
        if winner:
            print_board(board)
            print(f"플레이어 {winner} 승리!")
            break

        if is_draw(board):
            print_board(board)
            print("무승부입니다!")
            break

        current_player = switch_player(current_player)


if __name__ == "__main__":
    play_tic_tac_toe()
