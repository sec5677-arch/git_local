"""기물 스프라이트 — 유니코드 체스 기호로 렌더링."""

import pygame

# 백/흑 유니코드 체스 기호
PIECE_UNICODE = {
    ("white", "K"): "\u2654",
    ("white", "Q"): "\u2655",
    ("white", "R"): "\u2656",
    ("white", "B"): "\u2657",
    ("white", "N"): "\u2658",
    ("white", "P"): "\u2659",
    ("black", "K"): "\u265A",
    ("black", "Q"): "\u265B",
    ("black", "R"): "\u265C",
    ("black", "B"): "\u265D",
    ("black", "N"): "\u265E",
    ("black", "P"): "\u265F",
}

# 폰트 캐시
_font_cache: dict = {}


def get_piece_font(size: int) -> pygame.font.Font:
    """유니코드 체스 기호를 지원하는 폰트."""
    if size not in _font_cache:
        # Windows 기본 폰트 (체스 기호 지원)
        for name in ("Segoe UI Symbol", "DejaVu Sans", "Arial Unicode MS", None):
            try:
                _font_cache[size] = pygame.font.SysFont(name, size)
                break
            except Exception:
                continue
        if size not in _font_cache:
            _font_cache[size] = pygame.font.Font(None, size)
    return _font_cache[size]


def draw_piece(
    surface: pygame.Surface,
    color: str,
    symbol: str,
    rect: pygame.Rect,
) -> None:
    """지정 영역에 기물을 그립니다."""
    char = PIECE_UNICODE.get((color, symbol), "?")
    font = get_piece_font(int(rect.height * 0.75))
    text_color = (240, 240, 240) if color == "white" else (30, 30, 30)
    shadow = (0, 0, 0) if color == "white" else (200, 200, 200)

    # 그림자로 가독성 향상
    shadow_surf = font.render(char, True, shadow)
    shadow_rect = shadow_surf.get_rect(center=(rect.centerx + 1, rect.centery + 1))
    surface.blit(shadow_surf, shadow_rect)

    text_surf = font.render(char, True, text_color)
    text_rect = text_surf.get_rect(center=rect.center)
    surface.blit(text_surf, text_rect)
