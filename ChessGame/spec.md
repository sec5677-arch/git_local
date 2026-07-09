# Chess Game Design Specification

## 1. 프로젝트 개요

### 프로젝트명

Python Chess

### 목적

Python으로 체스 게임을 구현한다.

지원 기능:

* 체스 규칙 완전 구현
* 2인 플레이
* AI 대전
* 기보 저장 및 불러오기
* 체크, 체크메이트, 스테일메이트 판정
* GUI 지원

---

# 2. 개발 환경

| 항목    | 내용                |
| ----- | ----------------- |
| 언어    | Python 3.12+      |
| GUI   | Pygame            |
| 테스트   | pytest            |
| 저장 형식 | JSON              |
| IDE   | VS Code / PyCharm |

---

# 3. 시스템 아키텍처

```text
┌───────────────┐
│    Game UI    │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Game Manager  │
└───────┬───────┘
        │
 ┌──────┼──────┐
 ▼      ▼      ▼
Board  Rules   AI
 │
 ▼
Pieces
```

---

# 4. 디렉토리 구조

```text
chess/
│
├── main.py
│
├── core/
│   ├── board.py
│   ├── game.py
│   ├── move.py
│   └── rules.py
│
├── pieces/
│   ├── piece.py
│   ├── king.py
│   ├── queen.py
│   ├── rook.py
│   ├── bishop.py
│   ├── knight.py
│   └── pawn.py
│
├── ai/
│   ├── minimax.py
│   └── evaluator.py
│
├── ui/
│   ├── board_view.py
│   ├── piece_sprite.py
│   └── input_handler.py
│
├── assets/
│   ├── white/
│   └── black/
│
├── save/
│
└── tests/
```

---

# 5. 주요 클래스 설계

## Board

체스판 상태 관리

### 속성

```python
board: list[list]
current_turn: str
move_history: list
```

### 메서드

```python
initialize()

move_piece()

undo_move()

is_check()

is_checkmate()

is_stalemate()
```

---

## Piece

모든 기물의 부모 클래스

### 속성

```python
color
position
has_moved
```

### 메서드

```python
get_valid_moves()
```

---

## King

### 기능

* 1칸 이동
* 체크 판정
* 캐슬링

---

## Queen

### 기능

* 가로
* 세로
* 대각선 이동

---

## Rook

### 기능

* 가로
* 세로 이동
* 캐슬링 참여

---

## Bishop

### 기능

* 대각선 이동

---

## Knight

### 기능

* L자 이동

---

## Pawn

### 기능

* 전진
* 대각선 공격
* 앙파상
* 프로모션

---

# 6. 게임 상태 관리

## 상태

```python
MENU
PLAYING
CHECK
CHECKMATE
STALEMATE
PAUSED
GAME_OVER
```

---

# 7. 체스 규칙 구현

## 일반 이동

각 기물은 자신의 이동 규칙을 따른다.

## 체크

상대 기물이 킹을 공격 가능한 상태

## 체크메이트

체크 상태에서 탈출 가능한 수가 없음

## 스테일메이트

체크는 아니지만 이동 가능한 수가 없음

## 캐슬링

조건

* 킹 이동 이력 없음
* 룩 이동 이력 없음
* 사이에 기물 없음
* 이동 경로가 공격받지 않음

## 앙파상

조건

* 상대 폰이 2칸 이동 직후

## 프로모션

도착 행:

```text
백: 8번째 랭크
흑: 1번째 랭크
```

승격 가능

* Queen
* Rook
* Bishop
* Knight

---

# 8. AI 설계

## 난이도

### Easy

랜덤 이동

### Medium

Minimax Depth 2

### Hard

Minimax Depth 4~5

---

## 평가 함수

```python
Pawn = 100
Knight = 320
Bishop = 330
Rook = 500
Queen = 900
King = 20000
```

---

## Minimax

```python
minimax(
    board,
    depth,
    alpha,
    beta,
    maximizing_player
)
```

알파-베타 가지치기 적용

---

# 9. GUI 설계

## 화면 구성

### 메인 메뉴

* 새 게임
* AI 대전
* 기보 불러오기
* 종료

### 게임 화면

```text
+-------------------+
| 체스 보드          |
|                   |
|                   |
+-------------------+

현재 턴

Move History

Undo

Save

Exit
```

---

# 10. 저장 기능

## 저장 형식

JSON

예시

```json
{
  "turn": "white",
  "moves": [
    "e2e4",
    "e7e5"
  ]
}
```

---

# 11. 테스트 계획

## 단위 테스트

### Board

* 초기화
* 이동
* 체크

### Piece

* 이동 가능 위치

### Rules

* 캐슬링
* 앙파상
* 프로모션

### AI

* 최적 수 선택

---

# 12. 성능 목표

| 항목    | 목표       |
| ----- | -------- |
| FPS   | 60       |
| AI 응답 | 3초 이하    |
| 메모리   | 200MB 이하 |

---

# 13. 향후 확장

## 온라인 대전

* WebSocket

## Elo Rating

* 플레이어 랭킹

## 분석 모드

* 추천 수 표시

## 체스 엔진 연동

* Stockfish

## 멀티 플랫폼

* Windows
* Linux
* macOS

```

---

# 14. 개발 단계

## Phase 1

- 보드 구현
- 기물 이동 구현

## Phase 2

- 체크
- 체크메이트
- 스테일메이트

## Phase 3

- GUI 구현

## Phase 4

- AI 구현

## Phase 5

- 저장/불러오기

## Phase 6

- 테스트 및 최적화
```
