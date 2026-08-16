# 세린 피부과 — 프로젝트 구조 가이드

> 소스를 수정할 때 한눈에 구조를 파악하기 위한 문서. 각 파일이 무엇을 담당하고, 어디를 수정하면 무엇이 바뀌는지를 즉시 알 수 있도록 정리.

---

## 1. 프로젝트 개요

| 항목 | 값 |
|------|-----|
| **프로젝트명** | 세린 피부과 (Serene Dermatology) |
| **경로** | `C:\git_local\derma-clinic` (Git Bash: `/c/git_local/derma-clinic`) |
| **스택** | Next.js 14.2.33 (App Router) · React 18 · TypeScript(strict) · Tailwind CSS 3 |
| **아이콘** | Phosphor Icons (`@phosphor-icons/react`) |
| **폰트** | Playfair Display(세리프 헤딩) + Inter(산스 본문) — `next/font` 셀프호스팅 |
| **무드** | 화이트 & 세이지 그린, 청결하고 세련된 프리미엄 |
| **빌드 상태** | 100% 완료 — `npm run build` 통과, First Load JS 105kB |

---

## 2. 디렉터리 트리 (전체)

```
derma-clinic/
├── app/                          # Next.js App Router 루트
│   ├── globals.css               # ★ 디자인 토큰(CSS 변수) + 컴포넌트 클래스
│   ├── layout.tsx                # ★ 루트 레이아웃 (폰트·메타·Header/Footer)
│   ├── page.tsx                 # ★ 홈페이지 (5개 섹션 조립)
│   └── doctors/[id]/            # ★ 의료진 상세 프로필 라우트 (SSG)
│       ├── page.tsx             #   서버: generateStaticParams + generateMetadata + 404
│       └── not-found.tsx        #   알 수 없는 id → 친절한 404
│
├── components/
│   ├── ui/                       # 재사용 프리미티브
│   │   ├── Button.tsx            # 버튼 (a/button 자동 전환, 3 variant)
│   │   ├── Footer.tsx            # 푸터 (브랜드·네비·연락처·법적고지)
│   │   ├── Header.tsx            # sticky 헤더 + 모바일 드로어
│   │   ├── Icon.tsx              # ★ Phosphor 아이콘 단일 매핑 (graduation/hospital/quote/translate/calendar-dots 추가)
│   │   └── Section.tsx           # <Section> + <SectionHeader> (톤·정렬·eyebrow)
│   │
│   └── sections/                 # 페이지 섹션 (한 화면 = 한 컴포넌트)
│       ├── Hero.tsx              # ① 히어로 (비대칭 에디토리얼 + 트러스트 핵)
│       ├── Treatments.tsx        # ② 진료과 안내 (3열 카드 그리드)
│       ├── Doctors.tsx           # ③ 의료진 소개 (좌우 교차 스프레드 + 프로필 링크)
│       ├── DoctorProfile.tsx     # ★ 의료진 상세 페이지 (철학·경력·전문분야·관련진료과·예약 CTA)
│       ├── Gallery.tsx           # ④ 전/후 갤러리 (토글 방식)
│       └── Reservation.tsx       # ⑤ 예약 CTA + 진료시간 + 위치/지도
│
├── lib/                          # 유틸·데이터
│   ├── cn.ts                    # ★ clsx 기반 className 결합
│   ├── use-reveal.ts            # ★ IntersectionObserver 스크롤 리빌 훅
│   └── site-data.ts             # ★★★ 콘텐츠 단일 소스 (NAV·TREATMENTS·DOCTORS(확장)·GALLERY·VISIT + getDoctor/getTreatmentsByIds)
│
├── public/                       # 정적 자산
│   └── doctors/                 # ★ 의료진 증명사진 (김도연.png, 이준혁.png)
│
├── next.config.js                # 이미지 포맷(avif/webp) + Unsplash 리모트 패턴
├── tailwind.config.ts            # ★ 디자인 시스템 (컬러·타이포·스페이싱·섀도우)
├── postcss.config.js             # tailwind + autoprefixer
├── tsconfig.json                 # strict 모드, `@/*` 경로 별칭
├── next-env.d.ts                 # Next.js 타입 선언 (자동생성)
├── package.json                  # 의존성 정의
├── .gitignore                    # node_modules/.next/.env 등 제외
├── README.md
└── PROGRESS.md                   # 진행 상황 문서
```

> ★ 표시 = 수정 빈도가 높은 핵심 파일. ★★★ = 콘텐츠 수정 시 가장 먼저 볼 파일.

---

## 3. 렌더링 아키텍처 (서버/클라이언트 경계)

Next.js App Router의 핵심: **서버 컴포넌트가 기본**, 클라이언트 훅을 쓰는 곳만 `"use client"` 선언.

```
app/layout.tsx  [서버]  ← Header, Footer 임포트
  │
  ├─ Header.tsx     [클라이언트]  ← useState(스크롤/드로어), useEffect
  ├─ Footer.tsx     [서버]        ← Icon만 클라이언트 경계 통과
  └─ app/page.tsx   [서버]        ← 5개 섹션 조립만 담당
       │
       ├─ Hero.tsx         [클라이언트]  ← useReveal
       ├─ Treatments.tsx   [클라이언트]  ← useReveal
       ├─ Doctors.tsx      [클라이언트]  ← useReveal
       ├─ Gallery.tsx      [클라이언트]  ← useState + useReveal
       └─ Reservation.tsx  [클라이언트]  ← useReveal
```

**규칙:** `useReveal`(IntersectionObserver)이나 `useState`를 쓰는 컴포넌트는 반드시 파일 최상단에 `"use client"` 필요. Footer는 서버 컴포넌트지만 Icon(Phosphor)만 클라이언트 격리됨.

---

## 4. 데이터 흐름 — `lib/site-data.ts`가 단일 소스

모든 콘텐츠(카피·진료과·의료진·갤러리·위치)가 한 파일에 집중. **카피 수정 시 컴포넌트 JSX를 건드리지 않고 이 파일만 수정하면 됨.**

```
lib/site-data.ts
├── SITE          { name, tagline, phone, kakao, instagram }     ← 브랜드/연락처
├── NAV_LINKS     [{ label, href }]                              ← 헤더/푸터 메뉴
├── TREATMENTS    [{ id, category, title, summary, duration, recovery, icon }]  ← ②
├── DOCTORS       [{ id, name, role, credentials[], specialty, bio, portrait,    ← ③ + 프로필 페이지
│                    portraitAlt, portraitWidth/Height, experienceYears,
│                    education[], affiliations[], specialties[{label,desc}][],
│                    treatmentIds[], philosophy, quote, schedule, languages[] }]
├── GALLERY       [{ id, category, title, beforeSrc, afterSrc, sessions, note }] ← ④
├── VISIT         { address, addressHref, hours[], transit[], parking }          ← ⑤
├── getDoctor(id)              → Doctor | undefined              ← /doctors/[id] 라우트용
└── getTreatmentsByIds(ids[])  → Treatment[]                     ← 프로필 페이지 관련 진료과
```

각 섹션 컴포넌트는 자신의 데이터만 import: `import { TREATMENTS } from "@/lib/site-data"`.

> **CMS 연동 시:** `site-data.ts`를 Sanity/Contentful fetch 로직으로 대체하면 됨(타입은 그대로 유지 가능).

---

## 5. 디자인 시스템 계층 (3단계)

```
tailwind.config.ts     ← 의미 토큰 정의 (sage/ink/cream, 타이포 스케일, 섀도우)
        │
        ▼  CSS 변수로 연결
app/globals.css        ← :root에 실제 RGB 값 정의 + 컴포넌트 클래스(.btn, .card, .eyebrow, .reveal)
        │
        ▼  클래스로 소비
components/**/*.tsx    ← bg-sage-500, text-ink-soft, .btn-primary 등 (raw hex 금지)
```

### 컬러 토큰 (수정 시 globals.css `:root`만 바꾸면 전역 반영)

| Token | RGB | 용도 |
|-------|-----|------|
| `sage-500` | `91 127 110` | **프라이머리 액센트** (버튼·아이콘) |
| `sage-900` | `31 45 39` | 딥 헤딩 텍스트 |
| `sage-50/100` | 밝은 톤 | 배경 틴트·보더 |
| `ink` | `31 36 33` | 본문 텍스트 |
| `ink-soft` | `64 73 68` | 보조 텍스트 |
| `ink-muted` | `110 120 113` | 캡션/삼순위 |
| `cream` | `252 251 248` | 페이지 배경 |

### 컴포넌트 클래스 (globals.css `@layer components`에 정의)

| 클래스 | 용도 |
|--------|------|
| `.container-content` | 중앙 정렬 컨테이너 (max-w-content = 72rem) |
| `.eyebrow` | 소문자 캡션 라벨 (헤딩 위) |
| `.btn-primary` / `.btn-secondary` / `.btn-ghost` | 버튼 3종 |
| `.card` | 카드 서피스 |
| `.hairline` | 세이지 헤어라인 디바이더 |
| `.reveal` / `.reveal.is-visible` | 스크롤 리빌 (useReveal과 세트) |
| `.skip-link` | 키보드 건너뛰기 링크 |

### 타이포그래피

| 토큰 | 용도 | clamp 범위 |
|------|------|-----------|
| `text-display` | 히어로 h1 | 2.75rem → 4.5rem |
| `text-h1` | 의료진 이름 등 | 2.25rem → 3rem |
| `text-h2` | 섹션 헤딩 | 1.75rem → 2.25rem |
| `text-h3` | 카드 헤딩 | 1.375rem → 1.625rem |
| `text-body-lg` / `text-body` | 본문 | 1.125rem / 1rem |
| `text-small` / `text-caption` | 메타/캡션 | 0.875rem / 0.75rem |

---

## 6. UI 프리미티브 (components/ui/)

재사용 빌딩 블록. 섹션 컴포넌트들이 조합해서 사용.

### `<Section>` + `<SectionHeader>` — `Section.tsx`
- **Section**: `id`·`tone`(cream/tint/white)·`aria-labelledby` 받아 세로 리듬 통일 (`py-20 sm:py-24 lg:py-30`).
- **SectionHeader**: `eyebrow`·`title`·`intro`·`align`·`as`(h2/h3)·`titleId`로 헤딩 블록. `useReveal` 내장.
- **수정 포인트**: 섹션 간 간격·배경 톤 교차 패턴 바꾸려면 여기.

### `<Button>` — `Button.tsx`
- 3 variant(primary/secondary/ghost) + 2 size(md/lg).
- `href` 주면 `<a>`, 없으면 `<button>`로 자동 전환 (`"href" in props` 가드).
- 외부 링크 자동 감지 → `target="_blank" rel="noopener noreferrer"`.
- 터치 타겟 ≥44px (`py-3.5`).
- **수정 포인트**: 버튼 스타일은 `globals.css`의 `.btn-*` 클래스에서.

### `<Icon>` — `Icon.tsx` ★
- Phosphor 아이콘을 단일 매핑하는 **단일 출처(single source)**.
- `IconName` union 타입으로 허용 이름 제한 → 오타 방지.
- `decorative`(기본 true) → `aria-hidden`, false면 `aria-label` 필요.
- **아이콘 추가 시**: ① import 추가 ② `IconName` union에 이름 ③ `map` 객체에 매핑.
- `"use client"` 선언됨 (Phosphor가 클라이언트 전용).

### `<Header>` — `Header.tsx`
- sticky + 스크롤 24px 지나면 `bg-cream/95 backdrop-blur` + 헤어라인.
- 모바일 드로어: `role="dialog"` + `aria-modal`, Escape 닫기, body scroll lock, 링크 클릭 시 자동 닫힘.
- `NAV_LINKS`·`SITE`를 site-data에서 import.
- **수정 포인트**: 메뉴 항목은 `site-data.ts`의 `NAV_LINKS`에서.

### `<Footer>` — `Footer.tsx`
- 서버 컴포넌트 (state 없음). `new Date().getFullYear()`로 연도.
- 브랜드 블록 + 네비 + 연락처 + 법적 고지 (의료기기 판매업 허가 등 — 한국 의료 사이트 법적 필수).
- **수정 포인트**: 법적 정보(대표·사업자번호·의원번호)는 하단 `<p>`에 하드코딩.

---

## 7. 섹션 컴포넌트 (components/sections/)

페이지의 5개 화면 단위. **신뢰→전환 아크** 순서: identity → capability → authority → proof → action.

### ① `<Hero>` — `Hero.tsx`
- 비대칭 에디토리얼 스플릿 (copy 6/12 + visual 6/12).
- 단일 primary CTA(예약하기) + secondary(진료과 안내) — "한 화면에 primary CTA는 하나" 원칙.
- 트러스트 핵: 15년·1:1·투명 3개 통계.
- 플로팅 "오늘 남은 예약" pill.
- 배경 이미지는 장식 → `alt=""`.

### ② `<Treatments>` — `Treatments.tsx`
- 3열 카드 그리드 (모바일 1열).
- 카드 = `<article>`, 전체 카드 클릭 X (스크린리더 함정 방지), "자세히 보기" 링크가 명시적 인터랙션.
- `TREATMENTS` 데이터 + `iconMap`으로 아이콘 매핑.

### ③ `<Doctors>` — `Doctors.tsx`
- 좌우 교차 스프레드 (`index % 2 === 1`로 flip).
- 포트rait은 의미있는 이미지 → alt = "홍길동 원장 증명사진".
- 자격을 checked list로 스캔 용이하게.
- 각 카드 `aria-labelledby={doctor-${id}-name}`로 접근 가능 이름.

### ④ `<Gallery>` — `Gallery.tsx`
- Before/After **토글 버튼** 방식 (드래그 슬라이더는 접근성/복잡도로 기각).
- 카드별 독립 state (`useState<View>("after")`).
- 토글은 진짜 `<button>` + `aria-pressed`.
- 고정 aspect(`aspect-[4/3]`)로 view 전환 시 CLS 방지.
- 하단 법적 면책 (개인 결과 상이 — 한국 의료법).

### ⑤ `<Reservation>` — `Reservation.tsx`
- **전환 섹션**. `id="reservation"` — Header/Hero CTA가 향하는 앵커.
- 좌: 예약 CTA 3종(전화 primary / 카카오 secondary / 진료과 보기 ghost) + 진료시간 `<table>`.
- 우: 위치 카드 (정적 지도 이미지 + "큰 지도 보기" 링크 + 주소/대중교통/주차).
- 진료시간은 진짜 `<table>` + `<th scope>`. 휴진일은 시각(취소선+뮤트)+텍스트 이중 표현.
- 지도 이미지는 장식(`alt=""`), 주소 텍스트가 의미.

---

## 8. 자주 하는 수정별 가이드

| 하고 싶은 일 | 수정할 파일 |
|-------------|------------|
| 진료과 추가/수정 | `lib/site-data.ts` → `TREATMENTS` |
| 의료진 추가/수정 | `lib/site-data.ts` → `DOCTORS` (라우트 `/doctors/[id]` 자동 생성) |
| 의료진 상세 컴포넌트 수정 | `components/sections/DoctorProfile.tsx` |
| 의료진 증명사진 교체 | `public/doctors/*.png` (동일 파일명 유지 시 데이터 수정 불필요) |
| 갤러리 사례 추가 | `lib/site-data.ts` → `GALLERY` |
| 진료시간/주소 변경 | `lib/site-data.ts` → `VISIT` |
| 전화번호·SNS 변경 | `lib/site-data.ts` → `SITE` |
| 메뉴 항목 변경 | `lib/site-data.ts` → `NAV_LINKS` |
| 브랜드 컬러 변경 | `app/globals.css` → `:root` CSS 변수 |
| 버튼 스타일 변경 | `app/globals.css` → `.btn-*` 클래스 |
| 새 아이콘 추가 | `components/ui/Icon.tsx` (import + union + map) |
| 섹션 순서 변경 | `app/page.tsx` (JSX 순서) |
| 새 페이지(라우트) 추가 | `app/` 하위에 새 폴더+`page.tsx` |
| 이미지 도메인 추가 | `next.config.js` → `remotePatterns` |

---

## 9. 접근성 체크리스트 (이미 반영됨)

- [x] `prefers-reduced-motion` 전역 대응 (`globals.css`)
- [x] `:focus-visible` sage 2px 아웃라인
- [x] skip-link (본문 건너뛰기, `layout.tsx`)
- [x] `<html lang="ko">`
- [x] 터치 타겟 ≥44px (버튼 `py-3.5`)
- [x] 장식 아이콘 `aria-hidden`
- [x] 모바일 드로어 `role="dialog"` + `aria-modal` + Escape
- [x] 시맨틱 헤딩 계층 (h1→h2→h3)
- [x] 진료시간 진짜 `<table>` + `<th scope>`
- [x] viewport 확대 비활성화 안 함 (WCAG 2.2 AA)
- [x] Before/After 토글 `aria-pressed`
- [x] 법적 면책/고지 (갤러리·푸터)

---

## 10. 명령어

```bash
npm install          # 의존성 설치
npm run dev          # 개발 서버 (http://localhost:3000)
npm run build        # 프로덕션 빌드
npm run start        # 빌드 결과 실행
npm run lint         # ESLint (설정 시)
```

---

## 11. 알려진 보류/후속 작업

PROGRESS.md 기준 완료 상태. 다음은 선택적 후속:

- [x] **의료진 상세 프로필 라우트** `/doctors/[id]` (SSG, `generateStaticParams`+`generateMetadata`, 친절적 404) — `김도연.png`/`이준혁.png` 실사 연동 완료
- [ ] 크로스 브라우저/디바이스 확인 (375/768/1024/1440px)
- [ ] Lighthouse 점수 측정
- [ ] Unsplash 임시 URL → 실사 교체 (Hero/갤러리/지도 잔여; 의료진 사진은 완료)
- [ ] `/reservation` 온라인 예약 폼 라우트 추가
- [ ] `/treatments/[id]` 진료과 상세 라우트 추가 (현재는 `#treatments` 앵커만)
- [ ] CMS 연동 (Sanity/Contentful → `site-data.ts` 대체)
- [ ] 갤러리 토글 → 드래그 슬라이더 업그레이드 (선택)

---

## 12. 핵심 설계 원칙 (요약)

1. **콘텐츠-컴포넌트 분리**: `site-data.ts`가 단일 소스. 카피 수정 시 JSX 안 건드림.
2. **디자인 토큰 3단계**: tailwind config(의미) → globals.css(실제 값) → 컴포넌트(클래스 소비). raw hex 금지.
3. **서버 컴포넌트 우선**: 클라이언트 훅 쓰는 곳만 `"use client"`. 번들 작게.
4. **단일 primary CTA**: 한 화면에 dominant action 하나. secondary는 종속.
5. **접근성 내장**: reduced-motion·focus·skip-link·ARIA·시맨틱 헤딩 모두 기본값.
6. **장식 vs 의미 이미지 구분**: 장식은 `alt=""` + `aria-hidden`, 의미는 alt에 설명.

---

*이 문서는 소스 수정 시 빠른 길잡이용. 구조 변경 시 함께 갱신할 것.*
