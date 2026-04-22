# Tictacto

`Tictacto`는 JavaScript(React CDN) 기반의 **4x4 틱택토** 예제 프로젝트입니다.

## 프로젝트 구조

```text
Tictacto/
└─ javascript/
   ├─ index.html
   ├─ package.json
   ├─ package-lock.json
   ├─ src/
   │  └─ index.js
   └─ node_modules/   (npm install로 생성)
```

## 파일별 역할

- `javascript/index.html`
  - 앱의 진입 HTML 파일입니다.
  - React/ReactDOM을 CDN으로 불러오고, `src/index.js`를 로드합니다.
- `javascript/src/index.js`
  - 게임 로직과 UI가 들어있는 메인 소스입니다.
  - 주요 기능:
    - 4x4 보드 상태 관리
    - X/O 턴 전환
    - 가로/세로/대각선 승리 판정
    - 무승부 판정
    - Restart(초기화) 버튼
- `javascript/package.json`
  - npm 스크립트 및 개발 의존성을 정의합니다.
  - `start` 스크립트는 `live-server`로 `index.html`을 실행합니다.
- `javascript/package-lock.json`
  - 설치된 패키지 버전 고정 파일입니다.

## 실행 방법

아래 명령은 `Tictacto/javascript` 폴더 기준입니다.

1. 의존성 설치

```bash
npm install
```

2. 개발 서버 실행

```bash
npm start
```

3. 브라우저에서 확인

- 기본 URL: `http://127.0.0.1:3000` (환경에 따라 `localhost:3000`)

## 게임 규칙(현재 구현 기준)

- 보드 크기: `4 x 4`
- 승리 조건: 같은 말(`X` 또는 `O`)이
  - 가로 4칸, 세로 4칸, 또는 대각선 4칸으로 연속 배치될 때
- 모든 칸이 찼고 승자가 없으면 무승부(`Draw!`)

## 참고

- 현재 코드는 빌드 도구 없이 CDN 기반 React를 사용하므로 구조가 단순합니다.
- 추후 유지보수를 위해 컴포넌트 분리(예: Board, Square) 방식으로 확장할 수 있습니다.
