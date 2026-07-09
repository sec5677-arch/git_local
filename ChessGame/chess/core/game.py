"""게임 매니저 — UI·AI·저장과 연결되는 중앙 컨트롤러."""

import json
import os
from pathlib import Path
from typing import List, Optional

from chess.core.board import Board
from chess.core.move import Move
from chess.core.rules import GameState, evaluate_game_state, is_promotion_move


class GameManager:
    """게임 흐름, 모드, 저장/불러오기를 관리합니다."""

    def __init__(self):
        self.board = Board()
        self.state = GameState.MENU
        # 'two_player' | 'vs_ai'
        self.mode: Optional[str] = None
        # AI 난이도: 'easy' | 'medium' | 'hard'
        self.ai_difficulty: str = "medium"
        # AI가 흑/백 중 어느 쪽인지
        self.ai_color: str = "black"
        self.pending_promotion: Optional[Move] = None
        # 저장 파일 기본 경로
        self.save_dir = Path(__file__).resolve().parent.parent.parent / "save"

    def new_game(self, mode: str = "two_player", ai_difficulty: str = "medium") -> None:
        """새 게임 시작."""
        self.board.initialize()
        self.mode = mode
        self.ai_difficulty = ai_difficulty
        self.ai_color = "black"
        self.pending_promotion = None
        self.state = GameState.PLAYING

    def make_move(self, move: Move) -> bool:
        """수를 두고 게임 상태를 갱신합니다."""
        if self.state in (GameState.CHECKMATE, GameState.STALEMATE, GameState.GAME_OVER):
            return False

        # 프로모션 대기 중이면 승격 기물 지정
        if self.pending_promotion:
            move.from_row = self.pending_promotion.from_row
            move.from_col = self.pending_promotion.from_col
            move.to_row = self.pending_promotion.to_row
            move.to_col = self.pending_promotion.to_col
            self.pending_promotion = None

        if is_promotion_move(self.board, move.from_row, move.from_col, move.to_row):
            if move.promotion is None:
                self.pending_promotion = move
                return False

        if not self.board.move_piece(move):
            return False

        self._update_state()
        return True

    def _update_state(self) -> None:
        self.state = evaluate_game_state(self.board)
        if self.state in (GameState.CHECKMATE, GameState.STALEMATE):
            self.state = GameState.GAME_OVER

    def undo_move(self) -> bool:
        """한 수 되돌리기."""
        if self.board.undo_move():
            self.pending_promotion = None
            self.state = evaluate_game_state(self.board)
            if self.state == GameState.CHECKMATE:
                self.state = GameState.PLAYING
            return True
        return False

    def get_move_history(self) -> List[str]:
        return self.board.get_move_notations()

    def save_game(self, filename: str = "game.json") -> str:
        """JSON 형식으로 기보 저장."""
        self.save_dir.mkdir(parents=True, exist_ok=True)
        path = self.save_dir / filename
        data = {
            "turn": self.board.current_turn,
            "moves": self.get_move_history(),
            "mode": self.mode,
            "ai_difficulty": self.ai_difficulty,
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return str(path)

    def load_game(self, filename: str = "game.json") -> bool:
        """저장된 기보를 불러와 재현합니다."""
        path = self.save_dir / filename
        if not path.exists():
            return False

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.board.initialize()
        self.mode = data.get("mode", "two_player")
        self.ai_difficulty = data.get("ai_difficulty", "medium")
        self.pending_promotion = None

        for notation in data.get("moves", []):
            move = Move.from_notation(notation)
            if not self.board.move_piece(move):
                break

        self._update_state()
        if self.state == GameState.CHECKMATE:
            self.state = GameState.GAME_OVER
        return True

    def list_save_files(self) -> List[str]:
        """save 폴더의 JSON 파일 목록."""
        if not self.save_dir.exists():
            return []
        return [f.name for f in self.save_dir.glob("*.json")]

    def is_ai_turn(self) -> bool:
        """현재 AI 차례인지."""
        if self.mode != "vs_ai":
            return False
        return self.board.current_turn == self.ai_color

    def get_winner(self) -> Optional[str]:
        """체크메이트 시 승자 색."""
        if not self.board.is_checkmate(self.board.current_turn):
            return None
        return "black" if self.board.current_turn == "white" else "white"
