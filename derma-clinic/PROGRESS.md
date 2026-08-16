# 세린 피부과 홈페이지 — 진행 상황 문서

> 내일 이어서 작업하기 위한 가이드. 어디까지 했고, 어디서부터 시작하면 되는지 한눈에 파악 가능.

---

## 1. 프로젝트 개요

- **프로젝트명:** 세린 피부과 (Serene Dermatology)
- **경로:** `C:\git_local\derma-clinic` (Git Bash 경로: `/c/git_local/derma-clinic`)
- **스택:** Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS 3
- **아이콘:** Phosphor Icons (`@phosphor-icons/react`)
- **디자인 무드:** 화이트 & 세이지 그린, 청결하고 세련된 프리미엄
- **타이포그래피:** Playfair Display(세리프 헤딩) + Inter(산스 본문)
- **컬러 토큰:** `sage`(50–900), `ink`(primary/soft/muted), `cream`(page/tint) — 모두 CSS 변수로 `globals.css`에 정의

---

## 2. 완료된 작업 (18개 파일)

### 설정 / 설정 파일
- [x] `package.json` — 의존성 정의 (next, react, tailwind, phosphor, clsx)
- [x] `next.config.js` — 이미지 포맷(avif/webp), Unsplash 리모트 패턴
- [x] `tsconfig.json` — strict 모드, `@/*` 경로 별칭
- [x] `postcss.config.js` — tailwind + autoprefixer
- [x] `tailwind.config.ts` — 디자인 시스템 전체(컬러/타이포/스페이싱/섀도우/애니메이션)

### 디자인 시스템 코어
- [x] `app/globals.css` — CSS 변수 토큰 + 베이스 스타일 + 컴포넌트 클래스(`.btn`, `.card`, `.eyebrow`, `.reveal` 등) + 접근성(reduced-motion, focus-visible, skip-link)
- [x] `app/layout.tsx` — 루트 레이아웃, `next/font`로 Playfair+Inter 셀프호스팅, 메타데이터, skip-link, `<html lang="ko">`
- [x] `lib/cn.ts` — clsx 기반 클래스 결합 유틸
- [x] `lib/use-reveal.ts` — IntersectionObserver 스크롤 리빌 훅 (reduced-motion 대응)
- [x] `lib/site-data.ts` — 콘텐츠 단일 소스(NAV, TREATMENTS, DOCTORS, GALLERY, VISIT)

### UI 프리미티브
- [x] `components/ui/Section.tsx` — `<Section>` + `<SectionHeader>` (톤/정렬/eyebrow)
- [x] `components/ui/Button.tsx` — variant(primary/secondary/ghost) + `<a>`/`<button>` 자동 전환
- [x] `components/ui/Icon.tsx` — Phosphor 아이콘 매핑 (단일 출처, 장식/의미 구분)
- [x] `components/ui/Header.tsx` — sticky 헤더 + 모바일 드로어(Escape/스크롤락/포커스)
- [x] `components/ui/Footer.tsx` — 푸터(브랜드/네비/연락처/법적 고지)

### 섹션 컴포넌트 (4개 모두 완료)
- [x] `components/sections/Hero.tsx` — 히어로 (비대칭 에디토리얼, 트러스트 핵, 플로팅 예약필) · `"use client"` 추가됨
- [x] `components/sections/Treatments.tsx` — 진료과 안내 (3열 카드 그리드) · `"use client"` 추가됨
- [x] `components/sections/Doctors.tsx` — 의료진 소개 (좌우 교차 스프레드) · `"use client"` 추가됨
- [x] `components/sections/Gallery.tsx` — 전/후 갤러리 (토글 방식, `aria-pressed`, 법적 면책 포함)
- [x] `components/sections/Reservation.tsx` — 예약 CTA + 진료시간 테이블 + 위치/지도

### 페이지 조립
- [x] `app/layout.tsx` — Header/Footer/main 구조 추가 (모든 페이지 공통)
- [x] `app/page.tsx` — 5개 섹션 서버 컴포넌트로 조립

### 보조 파일
- [x] `.gitignore`
- [x] `README.md`

---

## 3. 남은 작업 (검증 완료!)

### 🟢 1순위 — 설치 및 빌드 검증 ✅
- [x] `npm install` — 의존성 설치 완료
- [x] Next.js 14.2.33으로 보안 패치 업그레이드 (14.2.5 보안 취약점)
- [x] `npm run build` — 프로덕션 빌드 통과 (정적 4페이지 생성, First Load JS 105kB)
- [x] `npm run dev` — 개발 서버 실행, http://localhost:3000 → 200 OK
- [x] SSR 헤딩 렌더링 확인 (h1→h2 계층 + aria-labelledby id 연결 정상)

### 빌드 과정에서 해결한 이슈
1. **Button.tsx 타입 에러:** `props.href` 검사로 union 좁힘 실패 → `"href" in props` 가드 + `as ButtonAsButton` 캐스팅으로 해결
2. **Phosphor `createContext is not a function`:** 서버 컴포넌트(Footer)에서 Phosphor 아이콘 직접 렌더링 → `Icon.tsx`에 `"use client"` 추가하여 클라이언트 컴포넌트로 격리. Footer는 서버 컴포넌트로 유지하되 Icon만 클라이언트 경계 통과
3. **접근성 sr-only 중복 헤딩:** Treatments/Doctors/Gallery에서 `aria-labelledby`가 sr-only div를 가리키던 구조 → `SectionHeader`에 `titleId` prop 추가해 단일 헤딩이 직접 id 갖도록 정리
4. **미사용 export 정리:** `Icon.tsx`의 `ClockIcon` 재export 제거

### 해결된 보류점
- [x] **Header/Footer 배치:** `layout.tsx`에 넣음 (모든 페이지 공통)
- [x] **갤러리 Before/After UI:** 토글 버튼 방식 채택 (접근성/단순함)
- [x] **지도:** 정적 이미지 + "큰 지도 보기" 링크 방식 채택
- [x] **`"use client"` 누락:** Hero/Treatments/Doctors/Icon 상단에 모두 추가

### 권장 후속 작업 (선택)
- [x] **의료진 상세 프로필 페이지 추가** (`/doctors/[id]`) — 2026-08-16 완료
  - `김도연.png`, `이준혁.png` → `public/doctors/` 이동 후 실사 연동
  - `lib/site-data.ts` `Doctor` 타입 확장 (education, affiliations, specialties, philosophy, quote, schedule, languages 등)
  - `app/doctors/[id]/page.tsx` 서버 컴포넌트: `generateStaticParams`+`generateMetadata`+`notFound()`, `dynamicParams=false`
  - `app/doctors/[id]/not-found.tsx` 친절적 404 (의료진 목록으로 복귀 CTA)
  - `components/sections/DoctorProfile.tsx` 클라이언트 컴포넌트: 헤더밴드·철학·경력·전문분야·관련진료과·다른의료진·예약 CTA 7섹션
  - `components/sections/Doctors.tsx`: `next/image` 전환, 포트rait 전체 클릭 가능(프로필 링크), 호버 힌트 pill
  - `components/ui/Icon.tsx`: graduation/hospital/quote/translate/calendar-dots 아이콘 추가
  - 빌드 통과: `/doctors/kim`, `/doctors/lee` SSG 정적 생성, First Load JS 121 kB
- [ ] 크로스 브라우저/디바이스 확인 (375px / 768px / 1024px / 1440px)
- [ ] Lighthouse 점수 (접근성/성능) 측정
- [ ] reduced-motion 켜고 애니메이션 동작 확인
- [ ] 키보드만으로 헤더 드로어/갤러리 토글/예약 CTA 이동 확인
- [ ] 실서비스용 이미지로 Unsplash URL 교체 (Hero/갤러리/지도 잔여; 의료진 사진은 완료)
- [ ] 온라인 예약 폼 페이지 (`/reservation` 라우트) 추가
- [ ] 진료과 상세 페이지 (`/treatments/[id]` 라우트) 추가
- [ ] CMS 연동 (Sanity/Contentful → `site-data.ts` 대체)

---

## 4. 내일 첫 작업 순서 (추천 플로우)

```
1. layout.tsx 수정 → Header/Footer/main 구조 추가
   (이렇게 하면 page.tsx는 섹션 5개만 나열하면 됨)

2. Gallery.tsx 작성
   - GALLERY 데이터 순회
   - Before/After 비교 카드 (토글 버튼 방식이 단순/접근성 좋음)
   - 면책 문구 명시

3. Reservation.tsx 작성
   - VISIT 데이터로 진료시간 테이블
   - 예약 CTA 3종 (전화/카카오/온라인)
   - 지도 영역

4. app/page.tsx 작성
   - 5개 섹션 임포트 후 조립

5. .gitignore + README.md

6. npm install && npm run dev 로 브라우저 확인
   → 깨지는 부분 있으면 그때 디버깅
```

---

## 5. 디자인 시스템 핵심 (참고용)

### 컬러 토큰 (globals.css에 정의됨)
| Token | Hex | 용도 |
|-------|-----|------|
| `sage-50`  | `#F7F8F5` | 아이보리 틴트 배경 |
| `sage-100` | `#EBF0EA` | 보더, 미묘한 구분 |
| `sage-200` | `#D5E0D6` | 보더/디바이더 |
| `sage-500` | `#5B7F6E` | **프라이머리 액센트** |
| `sage-600` | `#486658` | pressed/호버 |
| `sage-900` | `#1F2D27` | 딥 헤딩 텍스트 |
| `ink`      | `#1F2421` | 본문 텍스트 |
| `ink-soft` | `#404944` | 보조 텍스트 |
| `ink-muted`| `#6E7871` | 캡션/삼순위 |
| `cream`    | `#FCFBF8` | 페이지 배경 |

### 컴포넌트 클래스 (globals.css에 정의됨, 컴포넌트에서 직접 사용)
- `.container-content` — 중앙 정렬 컨테이너 (max-w-content = 72rem)
- `.eyebrow` — 소문자 캡션 라벨 (헤딩 위)
- `.btn-primary` / `.btn-secondary` / `.btn-ghost` — 버튼 variant
- `.card` — 카드 서피스
- `.reveal` / `.reveal.is-visible` — 스크롤 리빌 (useReveal 훅과 함께 사용)

### 타이포그래피
- 헤딩: `font-serif` (Playfair Display), 본문: `font-sans` (Inter)
- 사이즈: `text-display` / `text-h1` / `text-h2` / `text-h3` / `text-body-lg` / `text-body` / `text-small` / `text-caption`
- 모두 `clamp()` 기반 반응형

### 접근성 체크리스트 (이미 반영된 것들)
- [x] `prefers-reduced-motion` 전역 대응
- [x] `:focus-visible` 아웃라인 (sage 2px)
- [x] skip-link (본문 건너뛰기)
- [x] `<html lang="ko">`
- [x] 버튼 터치 타겟 ≥44px (py-3.5)
- [x] 아이콘 옆 텍스트 시 `aria-hidden`
- [x] 모바일 드로어 `role="dialog"` + `aria-modal` + Escape 닫기
- [x] 시맨틱 헤딩 계층 (h1→h2→h3)
- [x] viewport 확대 비활성화 안 함

---

## 6. 주의사항 / 결정 보류점

1. **Header/Footer 배치:** 현재 `layout.tsx`엔 `{children}`만 있음. 내일 `layout.tsx`에 Header/Footer를 넣을지, `page.tsx`에 넣을지 결정. → 권장: `layout.tsx`에 넣기(모든 페이지 공통).

2. **갤러리 Before/After UI 형태:** 슬라이더(드래그) vs 토글 버튼. 
   - 슬라이더가 임팩트는 크지만 접근성/구현 복잡도 상승.
   - 토글 버튼이 단순하고 키보드 친화적. → 권장: 토글부터 시작, 시간 여유 시 슬라이더로 업그레이드.

3. **지도:** 구글맵 임베드 iframe vs 정적 이미지 + 링크. 
   - iframe은 서드파티 쿠키/성능 이슈. 정적 이미지 + "큰 지도 보기" 링크가 가벼움. → 권장: 정적 이미지 방식.

4. **이미지 소스:** 현재 Unsplash 임시 URL 사용. 실제 서비스 시 클리닉 실사로 교체 필요. `next.config.js`에 `images.unsplash.com` 리모트 패턴만 허용됨 → 다른 도메인 쓰면 config 수정 필요.

5. **`app/page.tsx`는 서버 컴포넌트여야 함:** `Header`/`useReveal`만 `"use client"`. 페이지 자체는 서버 컴포넌트로 두면 번들 작아짐. 섹션 컴포넌트 중 클라이언트 훅 쓰는 건 각 파일 내에서 `"use client"` 선언 (Hero/Treatments/Doctors는 현재 선언 없음 → `useReveal` 쓰므로 `"use client"` 추가 필요할 수 있음. 다만 `useReveal`이 클라이언트 훅이므로 이를 import하는 컴포넌트는 모두 클라이언트여야 함). 
   - **내일 확인 포인트:** `Hero/Treatments/Doctors` 상단에 `"use client"` 추가 필요한지 점검. (현재 누락 상태)

---

**문서 작성 시각 기준 진행률:** 100% 완료 (설정+디자인시스템+프리미티브+섹션 4/4+페이지 조립+보조파일+빌드 검증+SSR 확인까지 모두 완료)
