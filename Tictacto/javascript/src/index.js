//const React = require('react');
//const ReactDOM = require('react-dom/client');

// 보드 한 변의 칸 개수 (4x4 = 16칸)
const BOARD_SIZE = 4;
const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

// 예시 컴포넌트 (원하는 컴포넌트로 교체 가능)
function App() {
    const [board, setBoard] = React.useState(Array(CELL_COUNT).fill(null));
    const [isX, setIsX] = React.useState(true);

    function handleClick(index) {
        if (board[index] || calculateWinner(board)) return;
        const nextBoard = board.slice();
        nextBoard[index] = isX ? 'X' : 'O';
        setBoard(nextBoard);
        setIsX(!isX);
    }

    function renderSquare(i) {
        return React.createElement(
            "button",
            {
                style: {
                    width: "52px",
                    height: "52px",
                    fontSize: "22px",
                    margin: "4px",
                    cursor: board[i] || calculateWinner(board) ? "not-allowed" : "pointer"
                },
                onClick: () => handleClick(i),
                key: i
            },
            board[i]
        );
    }

    /**
     * 4x4 보드에서 승리 줄(가로 4줄, 세로 4줄, 대각 2줄)을 만든 뒤,
     * 한 줄이 모두 같은 말이면 그 말(X 또는 O)을 반환합니다.
     */
    function getWinningLines() {
        const lines = [];
        // 가로: 각 행마다 BOARD_SIZE개 인덱스
        for (let row = 0; row < BOARD_SIZE; row++) {
            lines.push(
                Array.from({ length: BOARD_SIZE }, (_, col) => row * BOARD_SIZE + col)
            );
        }
        // 세로: 각 열마다 BOARD_SIZE개 인덱스
        for (let col = 0; col < BOARD_SIZE; col++) {
            lines.push(
                Array.from({ length: BOARD_SIZE }, (_, row) => row * BOARD_SIZE + col)
            );
        }
        // 대각선 ↘ (0, 5, 10, 15 …)
        lines.push(Array.from({ length: BOARD_SIZE }, (_, i) => i * BOARD_SIZE + i));
        // 대각선 ↙ (3, 6, 9, 12 …)
        lines.push(
            Array.from({ length: BOARD_SIZE }, (_, i) => i * BOARD_SIZE + (BOARD_SIZE - 1 - i))
        );
        return lines;
    }

    function calculateWinner(squares) {
        const lines = getWinningLines();
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const first = squares[line[0]];
            if (!first) continue;
            const allSame = line.every((idx) => squares[idx] === first);
            if (allSame) return first;
        }
        return null;
    }

    function restart() {
        setBoard(Array(CELL_COUNT).fill(null));
        setIsX(true);
    }

    const winner = calculateWinner(board);
    const status = winner
        ? `Winner: ${winner}`
        : board.every(Boolean) ? 'Draw!' : `Next player: ${isX ? 'X' : 'O'}`;

    return React.createElement(
        "div",
        {style: {display: "flex", flexDirection: "column", alignItems: "center", marginTop: "40px"}},
        React.createElement("h2", null, "틱택토 (4×4)"),
        React.createElement("div", {style: {marginBottom: "20px", fontSize: "20px"}}, status),
        React.createElement(
            "div",
            null,
            // 4행 × 4열 그리드 (인덱스 = row * BOARD_SIZE + col)
            Array.from({ length: BOARD_SIZE }, (_, row) =>
                React.createElement(
                    "div",
                    { key: row, style: { display: "flex" } },
                    Array.from({ length: BOARD_SIZE }, (_, col) =>
                        renderSquare(row * BOARD_SIZE + col)
                    )
                )
            )
        ),
        React.createElement(
            "button",
            {
                onClick: restart,
                style: {marginTop: "20px", padding: "10px 20px", fontSize: "16px"}
            },
            "Restart"
        )
    );
}

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(React.createElement(App));