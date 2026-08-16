# 세린 피부과 (Serene Dermatology)

프리미엄 피부과 홈페이지 — 화이트 & 세이지 그린 무드의 청결하고 세련된 단일 페이지 사이트.

## 스택

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS 3** (디자인 토큰 기반)
- **Phosphor Icons** (`@phosphor-icons/react`)
- **next/font** (Playfair Display + Inter 셀프 호스팅)

## 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev
# → http://localhost:3000

# 3. 프로덕션 빌드
npm run build && npm start
```

## 프로젝트 구조

```
derma-clinic/
├── app/
│   ├── globals.css        # 디자인 토큰 (CSS 변수) + 컴포넌트 클래스
│   ├── layout.tsx         # 루트 레이아웃 (Header/Footer + 폰트 + 메타)
│   └── page.tsx          # 홈 (5개 섹션 조립)
├── components/
│   ├── ui/                # 프리미티브 (Button, Icon, Section, Header, Footer)
│   └── sections/          # 페이지 섹션 (Hero, Treatments, Doctors, Gallery, Reservation)
├── lib/
│   ├── cn.ts             # 클래스 결합 유틸
│   ├── use-reveal.ts     # 스크롤 리빌 훅 (IntersectionObserver)
│   └── site-data.ts      # 콘텐츠 단일 소스 (NAV/TREATMENTS/DOCTORS/GALLERY/VISIT)
├── tailwind.config.ts    # 디자인 시스템 (컬러/타이포/스페이싱/섀도우)
└── next.config.js
```

## 디자인 시스템

### 컬러
- **Sage** (50–900): 브랜드 그린. 500이 프라이머리 액센트.
- **Ink** (primary/soft/muted): 웜 차콜-그린 텍스트 (pure black 아님).
- **Cream**: 웜 오프화이트 배경 (stark clinical white 아님).

모든 색은 `globals.css`의 CSS 변수로 정의 → 컴포넌트에서는 `sage-500`, `ink-soft` 등 시맨틱 클래스만 사용 (raw hex 금지).

### 타이포그래피
- **헤딩**: Playfair Display (세리프, 에디토리얼 프리미엄)
- **본문**: Inter (산스, 가독성)
- 사이즈는 `clamp()` 기반 반응형: `text-display` → `text-caption`

## 접근성

이 프로젝트는 WCAG 2.2 AA를 준수합니다:

- `prefers-reduced-motion` 전역 대응 (애니메이션 자동 축소)
- `:focus-visible` 아웃라인 (sage 2px, 3:1 대비)
- skip-link (본문 건너뛰기)
- 모든 버튼 터치 타겟 ≥ 44px
- 모바일 드로어: `role="dialog"` + `aria-modal` + Escape 닫기 + 스크롤 락
- 시맨틱 헤딩 계층 (h1 → h2 → h3)
- viewport 확대 비활성화 안 함
- Before/After 토글: `aria-pressed` 로 상태 노출
- 진료시간 표: 실제 `<table>` + `<th scope>` (색상만으로 휴진 표시 안 함)

## 콘텐츠 수정

모든 텍스트 콘텐츠는 `lib/site-data.ts`에 중앙화되어 있습니다. 문구/데이터 변경은 JSX가 아닌 이 파일만 수정하면 됩니다.

## 이미지

현재 Unsplash 임시 URL 사용. 실서비스 시:
1. 클리닉 실사로 교체
2. `public/` 디렉토리에 로컬 이미지 배치
3. `next.config.js`의 `remotePatterns`에서 Unsplash 제거

## 다음 단계 (선택)

- [ ] 온라인 예약 폼 페이지 (`/reservation` 라우트)
- [ ] 블로그/진료 케이스 상세 페이지
- [ ] 다크모드 변주 (CSS 변수만 교체하면 됨)
- [ ] CMS 연동 (Sanity/Contentful → `site-data.ts` 대체)
