"""모든 기물의 부모 클래스."""

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, List, Tuple

if TYPE_CHECKING:
    from chess.core.board import Board

# (행, 열) 좌표 타입
Position = Tuple[int, int]


class Piece(ABC):
    """체스 기물의 공통 인터페이스."""

    # 기물 종류 식별자 (K, Q, R, B, N, P)
    symbol: str = "?"

    def __init__(self, color: str, position: Position):
        # color: 'white' 또는 'black'
        self.color = color
        self.position = position
        # 캐슬링·앙파상 판정에 사용
        self.has_moved = False

    @abstractmethod
    def get_pseudo_legal_moves(self, board: "Board") -> List[Position]:
        """보드 상태만 고려한 이동 가능 칸 (체크 미검증)."""
        pass

    def clone(self) -> "Piece":
        """보드 복사 시 사용할 복제본."""
        new_piece = self.__class__(self.color, self.position)
        new_piece.has_moved = self.has_moved
        return new_piece

    def __repr__(self) -> str:
        return f"{self.color[0]}{self.symbol}@{self.position}"
