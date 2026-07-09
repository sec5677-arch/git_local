"""체스판 상태 관리."""

from copy import deepcopy
from typing import List, Optional, Tuple

from chess.core.move import Move
from chess.pieces.bishop import Bishop
from chess.pieces.king import King
from chess.pieces.knight import Knight
from chess.pieces.pawn import Pawn
from chess.pieces.piece import Piece, Position
from chess.pieces.queen import Queen
from chess.pieces.rook import Rook

# 기물 종류 → 클래스 매핑 (프로모션·복원에 사용)
PIECE_CLASSES = {
    "K": King, "Q": Queen, "R": Rook, "B": Bishop, "N": Knight, "P": Pawn,
}


class Board:
    """8x8 체스판. row 0 = 8랭크(흑 후방), row 7 = 1랭크(백 후방)."""

    def __init__(self):
        self.board: List[List[Optional[Piece]]] = [[None] * 8 for _ in range(8)]
        self.current_turn: str = "white"
        self.move_history: List[dict] = []
        # 앙파상 가능 칸 (폰이 2칸 이동한 직후의 통과 칸)
        self.en_passant_target: Optional[Position] = None
        self.initialize()

    def initialize(self) -> None:
        """표준 체스 초기 배치."""
        self.board = [[None] * 8 for _ in range(8)]
        self.current_turn = "white"
        self.move_history = []
        self.en_passant_target = None

        # 흑 기물 (row 0, 1)
        back_rank = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook]
        for col, cls in enumerate(back_rank):
            self.board[0][col] = cls("black", (0, col))
        for col in range(8):
            self.board[1][col] = Pawn("black", (1, col))

        # 백 기물 (row 6, 7)
        for col in range(8):
            self.board[6][col] = Pawn("white", (6, col))
        for col, cls in enumerate(back_rank):
            self.board[7][col] = cls("white", (7, col))

    # --- 좌표 유틸 ---

    def is_on_board(self, row: int, col: int) -> bool:
        return 0 <= row < 8 and 0 <= col < 8

    def get_piece(self, row: int, col: int) -> Optional[Piece]:
        if not self.is_on_board(row, col):
            return None
        return self.board[row][col]

    def can_capture_or_move(self, row: int, col: int, color: str) -> bool:
        """빈 칸이거나 상대 기물이 있는 칸인지."""
        piece = self.get_piece(row, col)
        return piece is None or piece.color != color

    def find_king(self, color: str) -> Position:
        """해당 색 킹의 위치."""
        for row in range(8):
            for col in range(8):
                p = self.board[row][col]
                if isinstance(p, King) and p.color == color:
                    return (row, col)
        raise ValueError(f"{color} 킹을 찾을 수 없습니다.")

    # --- 공격 판정 ---

    def is_square_attacked(self, row: int, col: int, by_color: str) -> bool:
        """특정 칸이 상대(by_color의 반대)에게 공격받는지."""
        attacker_color = "black" if by_color == "white" else "white"
        for r in range(8):
            for c in range(8):
                piece = self.board[r][c]
                if piece is None or piece.color != attacker_color:
                    continue
                if self._piece_attacks_square(piece, row, col):
                    return True
        return False

    def _piece_attacks_square(self, piece: Piece, target_row: int, target_col: int) -> bool:
        """기물이 특정 칸을 공격할 수 있는지 (캐슬링 제외, 재귀 방지)."""
        row, col = piece.position

        if isinstance(piece, Pawn):
            direction = -1 if piece.color == "white" else 1
            for dc in (-1, 1):
                if row + direction == target_row and col + dc == target_col:
                    return True
            return False

        # 킹은 인접 8칸만 공격 (캐슬링 호출 시 재귀 방지)
        if isinstance(piece, King):
            return (
                abs(target_row - row) <= 1
                and abs(target_col - col) <= 1
                and (target_row != row or target_col != col)
            )

        # 나이트·슬라이딩 기물
        for move_row, move_col in piece.get_pseudo_legal_moves(self):
            if move_row == target_row and move_col == target_col:
                return True
        return False

    def is_check(self, color: Optional[str] = None) -> bool:
        """해당 색 킹이 체크 상태인지."""
        color = color or self.current_turn
        kr, kc = self.find_king(color)
        return self.is_square_attacked(kr, kc, color)

    # --- 합법 수 ---

    def get_legal_moves_for_piece(self, row: int, col: int) -> List[Position]:
        """체크를 고려한 합법적 이동 목록."""
        piece = self.get_piece(row, col)
        if piece is None or piece.color != self.current_turn:
            return []

        legal: List[Position] = []
        for dest in piece.get_pseudo_legal_moves(self):
            if self._is_legal_move(row, col, dest[0], dest[1]):
                legal.append(dest)
        return legal

    def get_all_legal_moves(self, color: Optional[str] = None) -> List[Move]:
        """해당 색의 모든 합법 수."""
        color = color or self.current_turn
        moves: List[Move] = []
        for row in range(8):
            for col in range(8):
                piece = self.get_piece(row, col)
                if piece is None or piece.color != color:
                    continue
                for dr, dc in self.get_legal_moves_for_piece(row, col):
                    promo = None
                    if isinstance(piece, Pawn) and (dr == 0 or dr == 7):
                        promo = "Q"
                    moves.append(Move(row, col, dr, dc, promotion=promo))
        return moves

    def _is_legal_move(self, fr: int, fc: int, tr: int, tc: int) -> bool:
        """이동 후 자기 킹이 체크에 놓이지 않는지 검증."""
        moving_color = self.current_turn
        test_board = self.copy()
        test_board._apply_move_internal(Move(fr, fc, tr, tc))
        # _apply_move_internal 후 턴이 바뀌므로 이동한 쪽 색으로 체크 검사
        return not test_board.is_check(moving_color)

    # --- 캐슬링 ---

    def can_castle_kingside(self, color: str) -> bool:
        row = 7 if color == "white" else 0
        king = self.get_piece(row, 4)
        rook = self.get_piece(row, 7)
        if not isinstance(king, King) or not isinstance(rook, Rook):
            return False
        if king.has_moved or rook.has_moved:
            return False
        if self.get_piece(row, 5) or self.get_piece(row, 6):
            return False
        if self.is_square_attacked(row, 4, color):
            return False
        if self.is_square_attacked(row, 5, color) or self.is_square_attacked(row, 6, color):
            return False
        return True

    def can_castle_queenside(self, color: str) -> bool:
        row = 7 if color == "white" else 0
        king = self.get_piece(row, 4)
        rook = self.get_piece(row, 0)
        if not isinstance(king, King) or not isinstance(rook, Rook):
            return False
        if king.has_moved or rook.has_moved:
            return False
        if self.get_piece(row, 1) or self.get_piece(row, 2) or self.get_piece(row, 3):
            return False
        if self.is_square_attacked(row, 4, color):
            return False
        if self.is_square_attacked(row, 3, color) or self.is_square_attacked(row, 2, color):
            return False
        return True

    # --- 이동 실행 ---

    def move_piece(self, move: Move) -> bool:
        """합법적 이동이면 실행하고 True 반환."""
        legal = self.get_legal_moves_for_piece(move.from_row, move.from_col)
        if (move.to_row, move.to_col) not in legal:
            return False

        piece = self.get_piece(move.from_row, move.from_col)
        captured = self.get_piece(move.to_row, move.to_col)

        # 캐슬링 판정
        castle_side = None
        if isinstance(piece, King) and abs(move.to_col - move.from_col) == 2:
            castle_side = "kingside" if move.to_col > move.from_col else "queenside"
            move.castle_side = castle_side

        # 앙파상 판정
        is_ep = False
        if isinstance(piece, Pawn) and move.to_col != move.from_col and captured is None:
            is_ep = True
            move.is_en_passant = True

        # 되돌리기용 스냅샷 저장
        snapshot = {
            "move": deepcopy(move),
            "captured": captured.clone() if captured else None,
            "ep_target": self.en_passant_target,
            "turn": self.current_turn,
            "castle_rook_from": None,
            "castle_rook_to": None,
            "ep_captured_pos": None,
        }

        self._apply_move_internal(move, snapshot)
        snapshot["move"].castle_side = castle_side
        snapshot["move"].is_en_passant = is_ep
        self.move_history.append(snapshot)
        return True

    def _apply_move_internal(self, move: Move, snapshot: Optional[dict] = None) -> None:
        """실제 보드 변경 (내부용)."""
        piece = self.get_piece(move.from_row, move.from_col)
        if piece is None:
            return

        self.en_passant_target = None
        fr, fc, tr, tc = move.from_row, move.from_col, move.to_row, move.to_col

        # 캐슬링
        if isinstance(piece, King) and abs(tc - fc) == 2:
            row = fr
            if tc > fc:
                rook = self.get_piece(row, 7)
                self.board[row][5] = rook
                self.board[row][7] = None
                if rook:
                    rook.position = (row, 5)
                    rook.has_moved = True
                if snapshot is not None:
                    snapshot["castle_rook_from"] = (row, 7)
                    snapshot["castle_rook_to"] = (row, 5)
            else:
                rook = self.get_piece(row, 0)
                self.board[row][3] = rook
                self.board[row][0] = None
                if rook:
                    rook.position = (row, 3)
                    rook.has_moved = True
                if snapshot is not None:
                    snapshot["castle_rook_from"] = (row, 0)
                    snapshot["castle_rook_to"] = (row, 3)

        # 앙파상
        elif isinstance(piece, Pawn) and tc != fc and self.get_piece(tr, tc) is None:
            cap_row = tr + (1 if piece.color == "white" else -1)
            captured_ep = self.get_piece(cap_row, tc)
            self.board[cap_row][tc] = None
            if snapshot is not None:
                snapshot["ep_captured_pos"] = (cap_row, tc)
                snapshot["captured"] = captured_ep.clone() if captured_ep else None

        # 일반 이동
        self.board[tr][tc] = piece
        self.board[fr][fc] = None
        piece.position = (tr, tc)
        piece.has_moved = True

        # 폰 2칸 이동 → 앙파상 타겟 설정
        if isinstance(piece, Pawn) and abs(tr - fr) == 2:
            self.en_passant_target = (fr + (1 if piece.color == "black" else -1), fc)

        # 프로모션
        if isinstance(piece, Pawn) and (tr == 0 or tr == 7):
            promo = (move.promotion or "Q").upper()
            cls = PIECE_CLASSES.get(promo, Queen)
            new_piece = cls(piece.color, (tr, tc))
            new_piece.has_moved = True
            self.board[tr][tc] = new_piece

        self.current_turn = "black" if self.current_turn == "white" else "white"

    def undo_move(self) -> bool:
        """마지막 수를 되돌립니다."""
        if not self.move_history:
            return False

        # 턴을 먼저 되돌림 (move_piece 후 바뀐 상태)
        self.current_turn = "black" if self.current_turn == "white" else "white"

        snapshot = self.move_history.pop()
        move = snapshot["move"]
        fr, fc, tr, tc = move.from_row, move.from_col, move.to_row, move.to_col

        piece = self.get_piece(tr, tc)
        if piece is None:
            return False

        # 프로모션 전 폰으로 복원
        if snapshot["move"].promotion and isinstance(piece, (Queen, Rook, Bishop, Knight)):
            piece = Pawn(piece.color, (fr, fc))
            piece.has_moved = True

        self.board[fr][fc] = piece
        piece.position = (fr, fc)
        if len(self.move_history) == 0 or not self._was_first_move(snapshot):
            pass
        # has_moved 복원: 이전 수가 없으면 초기 위치
        piece.has_moved = self._piece_had_moved_before(snapshot)

        self.board[tr][tc] = None

        # 캡처 복원
        if snapshot["castle_rook_from"]:
            rf, rt = snapshot["castle_rook_from"], snapshot["castle_rook_to"]
            rook = self.get_piece(rt[0], rt[1])
            self.board[rf[0]][rf[1]] = rook
            self.board[rt[0]][rt[1]] = None
            if rook:
                rook.position = rf
                rook.has_moved = False
        elif snapshot["ep_captured_pos"]:
            er, ec = snapshot["ep_captured_pos"]
            cap = snapshot["captured"]
            if cap:
                cap.position = (er, ec)
                self.board[er][ec] = cap
        elif snapshot["captured"]:
            cap = snapshot["captured"]
            cap.position = (tr, tc)
            self.board[tr][tc] = cap

        self.en_passant_target = snapshot["ep_target"]
        return True

    def _was_first_move(self, snapshot: dict) -> bool:
        return snapshot["move"].from_row in (1, 6) and isinstance(
            self.board[snapshot["move"].from_row][snapshot["move"].from_col], Pawn
        )

    def _piece_had_moved_before(self, snapshot: dict) -> bool:
        """undo 후 has_moved 플래그 복원."""
        move = snapshot["move"]
        for hist in self.move_history:
            m = hist["move"]
            if (m.to_row, m.to_col) == (move.from_row, move.from_col):
                return True
            if m.from_row == move.from_row and m.from_col == move.from_col:
                return False
        return False

    def is_checkmate(self, color: Optional[str] = None) -> bool:
        color = color or self.current_turn
        return self.is_check(color) and len(self._all_legal_for_color(color)) == 0

    def is_stalemate(self, color: Optional[str] = None) -> bool:
        color = color or self.current_turn
        return not self.is_check(color) and len(self._all_legal_for_color(color)) == 0

    def _all_legal_for_color(self, color: str) -> List[Move]:
        saved = self.current_turn
        self.current_turn = color
        moves = self.get_all_legal_moves(color)
        self.current_turn = saved
        return moves

    def copy(self) -> "Board":
        """보드 깊은 복사 (AI 탐색용)."""
        new = Board.__new__(Board)
        new.board = [[p.clone() if p else None for p in row] for row in self.board]
        new.current_turn = self.current_turn
        new.move_history = []
        new.en_passant_target = self.en_passant_target
        for row in range(8):
            for col in range(8):
                if new.board[row][col]:
                    new.board[row][col].position = (row, col)
        return new

    def get_move_notations(self) -> List[str]:
        """기보 문자열 목록."""
        return [snap["move"].to_notation() for snap in self.move_history]
