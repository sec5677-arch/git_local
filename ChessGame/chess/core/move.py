"""이동(Move) 데이터 클래스 — 기보 저장 및 실행에 사용합니다."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class Move:
    """한 수의 정보를 담는 클래스."""

    from_row: int
    from_col: int
    to_row: int
    to_col: int
    # 프로모션 시 승격할 기물 종류 (예: 'Q', 'R', 'B', 'N')
    promotion: Optional[str] = None
    # 앙파상 여부
    is_en_passant: bool = False
    # 캐슬링 여부 ('kingside' / 'queenside')
    castle_side: Optional[str] = None

    def to_notation(self) -> str:
        """기보 표기법으로 변환 (예: e2e4, e7e8Q)."""
        files = "abcdefgh"
        from_sq = f"{files[self.from_col]}{8 - self.from_row}"
        to_sq = f"{files[self.to_col]}{8 - self.to_row}"
        promo = self.promotion or ""
        return f"{from_sq}{to_sq}{promo}"

    @staticmethod
    def from_notation(notation: str) -> "Move":
        """기보 문자열을 Move 객체로 파싱합니다."""
        files = "abcdefgh"
        notation = notation.strip()
        promo = None
        if len(notation) == 5:
            promo = notation[4].upper()
            notation = notation[:4]

        from_col = files.index(notation[0])
        from_row = 8 - int(notation[1])
        to_col = files.index(notation[2])
        to_row = 8 - int(notation[3])
        return Move(from_row, from_col, to_row, to_col, promotion=promo)
