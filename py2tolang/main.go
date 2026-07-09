package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// createBoard는 3x3 틱택토 보드를 생성합니다.
// 빈 칸은 공백(" ")으로 표현합니다.
func createBoard() []string {
	return []string{" ", " ", " ", " ", " ", " ", " ", " ", " "}
}

// printBoard는 현재 보드 상태를 보기 쉽게 출력합니다.
func printBoard(board []string) {
	fmt.Println("\n현재 보드:")
	for row := 0; row < 3; row++ {
		start := row * 3

		// 빈 칸은 실제 값 대신 위치 번호(1~9)를 보여줘서
		// 플레이어가 입력하기 쉽게 만듭니다.
		displayCells := make([]string, 3)
		for i := 0; i < 3; i++ {
			cell := board[start+i]
			if cell == " " {
				displayCells[i] = strconv.Itoa(start + i + 1)
			} else {
				displayCells[i] = cell
			}
		}

		fmt.Printf(" %s | %s | %s \n", displayCells[0], displayCells[1], displayCells[2])
		if row < 2 {
			fmt.Println("---+---+---")
		}
	}
	fmt.Println()
}

// checkWinner는 승리한 플레이어("X" 또는 "O")를 반환합니다.
// 승자가 없으면 빈 문자열("")을 반환합니다.
func checkWinner(board []string) string {
	winConditions := [8][3]int{
		{0, 1, 2}, // 가로
		{3, 4, 5},
		{6, 7, 8},
		{0, 3, 6}, // 세로
		{1, 4, 7},
		{2, 5, 8},
		{0, 4, 8}, // 대각선
		{2, 4, 6},
	}

	for _, condition := range winConditions {
		a, b, c := condition[0], condition[1], condition[2]
		if board[a] != " " && board[a] == board[b] && board[b] == board[c] {
			return board[a]
		}
	}

	return ""
}

// isDraw는 보드가 꽉 찼는지 확인합니다.
// 이미 승자 체크를 먼저 했다는 전제에서, 꽉 찼다면 무승부입니다.
func isDraw(board []string) bool {
	for _, cell := range board {
		if cell == " " {
			return false
		}
	}
	return true
}

// getValidMove는 사용자 입력을 검증해서 0~8 인덱스를 반환합니다.
func getValidMove(board []string, player string, reader *bufio.Reader) int {
	for {
		fmt.Printf("플레이어 %s 차례입니다. 놓을 칸 번호(1~9): ", player)
		input, err := reader.ReadString('\n')
		if err != nil {
			// 입력 오류가 나면 안내 후 다시 입력받습니다.
			fmt.Println("입력을 읽는 중 오류가 발생했습니다. 다시 시도해 주세요.")
			continue
		}

		input = strings.TrimSpace(input)
		position, err := strconv.Atoi(input)
		if err != nil {
			fmt.Println("숫자만 입력해 주세요.")
			continue
		}

		if position < 1 || position > 9 {
			fmt.Println("1부터 9 사이의 숫자를 입력해 주세요.")
			continue
		}

		index := position - 1
		if board[index] != " " {
			fmt.Println("이미 선택된 칸입니다. 다른 칸을 선택해 주세요.")
			continue
		}

		return index
	}
}

// switchPlayer는 현재 플레이어를 X <-> O로 바꿉니다.
func switchPlayer(player string) string {
	if player == "X" {
		return "O"
	}
	return "X"
}

// playTicTacToe는 틱택토 게임 한 판을 진행합니다.
func playTicTacToe() {
	board := createBoard()
	currentPlayer := "X"
	reader := bufio.NewReader(os.Stdin)

	fmt.Println("=== 틱택토 게임 시작 ===")
	fmt.Println("칸 번호를 입력해 말을 놓으세요.")

	for {
		printBoard(board)
		moveIndex := getValidMove(board, currentPlayer, reader)
		board[moveIndex] = currentPlayer

		winner := checkWinner(board)
		if winner != "" {
			printBoard(board)
			fmt.Printf("플레이어 %s 승리!\n", winner)
			break
		}

		if isDraw(board) {
			printBoard(board)
			fmt.Println("무승부입니다!")
			break
		}

		currentPlayer = switchPlayer(currentPlayer)
	}
}

func main() {
	playTicTacToe()
}
