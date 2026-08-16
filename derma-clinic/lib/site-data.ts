/**
 * Site data — single source of truth for clinic content.
 *
 * In a real build this would come from a CMS (Sanity, Contentful) or MDX.
 * Centralized here so copy changes don't require touching component JSX,
 * and so the page composition stays declarative.
 */

export type NavLink = {
  label: string;
  href: string;
};

export const SITE = {
  name: "세린 피부과",
  nameEn: "Serene Dermatology",
  tagline: "정직한 진료, 섬세한 케어",
  phone: "02-1234-5678",
  phoneHref: "tel:0212345678",
  kakao: "https://pf.kakao.com/example",
  instagram: "https://instagram.com/serene.derma",
} as const;

export const NAV_LINKS: NavLink[] = [
  { label: "진료과 안내", href: "#treatments" },
  { label: "의료진 소개", href: "#doctors" },
  { label: "전·후 갤러리", href: "#gallery" },
  { label: "오시는 길", href: "#visit" },
];

export type Treatment = {
  id: string;
  category: "색소 · 색소침착" | "여드름 · 모공" | "안티에이징" | "스킨부스터";
  title: string;
  summary: string;
  duration: string;
  recovery: string;
  icon: "sparkle" | "drops" | "clock" | "leaf";
};

export const TREATMENTS: Treatment[] = [
  {
    id: "laser-toning",
    category: "색소 · 색소침착",
    title: "레이저 토닝",
    summary:
      "색소침착과 기미·잡티를 점진적으로 밝히는 맞춤 토닝. 피부 손상을 최소화한 저자극 설계.",
    duration: "약 20분",
    recovery: "일상 즉시 가능",
    icon: "sparkle",
  },
  {
    id: "melasma-care",
    category: "색소 · 색소침착",
    title: "기미 복합 치료",
    summary:
      "레이저·경구약·재생관리를 결합한 다각 접근. 재발 방지를 위한 1:1 관주 계획.",
    duration: "약 40분",
    recovery: "일상 즉시 가능",
    icon: "sparkle",
  },
  {
    id: "acne-program",
    category: "여드름 · 모공",
    title: "여드름 케어 프로그램",
    summary:
      "염증 케어 + 모공 정화 + 재생 케어 3단계. 붉은기 진정과 재발 관리까지.",
    duration: "약 50분",
    recovery: "당일 세안 가능",
    icon: "drops",
  },
  {
    id: "pore-refining",
    category: "여드름 · 모공",
    title: "모공 리파이닝",
    summary:
      "복합 레이저로 모공·피지 결합을 개선. 모공 너비와 탄력을 동시에 케어합니다.",
    duration: "약 30분",
    recovery: "일상 즉시 가능",
    icon: "drops",
  },
  {
    id: "skin-booster",
    category: "스킨부스터",
    title: "스킨부스터 스크린케어",
    summary:
      "히알루론산·펩타이드를 진피층에 직접 공급. 속건 · 모공 · 탄력 저하 케어.",
    duration: "약 30분",
    recovery: "당일 세안 가능",
    icon: "leaf",
  },
  {
    id: "anti-aging",
    category: "안티에이징",
    title: "안티에이징 탄력 케어",
    summary:
      "고주파 · 리프팅 장비와 재생 관리를 결합. 처짐 · 주름 · 탄력을 단계적으로 케어.",
    duration: "약 60분",
    recovery: "일상 즉시 가능",
    icon: "clock",
  },
];

export type DoctorSpecialty = {
  label: string;
  desc: string;
};

export type Doctor = {
  /** URL slug — also used as the route segment (`/doctors/[id]`). */
  id: string;
  name: string;
  role: string;
  /** Short headline credentials — shown as a checked list on cards. */
  credentials: string[];
  /** Compact specialty tag — shown as a pill on the portrait. */
  specialty: string;
  /** One-paragraph bio — shown on the card and reused on the profile. */
  bio: string;
  /** Local portrait path under `/public`. */
  portrait: string;
  /** Descriptive alt for the portrait (meaningful image — not decorative). */
  portraitAlt: string;
  /** Portrait intrinsic pixel size — used by next/image to prevent CLS. */
  portraitWidth: number;
  portraitHeight: number;
  /** Years of clinical practice — shown as a stat. */
  experienceYears: number;
  /** Academic / training background, ordered chronologically. */
  education: string[];
  /** Current & past society / hospital affiliations. */
  affiliations: string[];
  /** Detailed treatment focus areas — label + one-line description. */
  specialties: DoctorSpecialty[];
  /** Links to TREATMENTS ids this doctor primarily performs. */
  treatmentIds: string[];
  /** Care philosophy — a short paragraph for the profile page. */
  philosophy: string;
  /** A pull-quote rendered in serif on the profile. */
  quote: string;
  /** Weekly schedule blurb (e.g. "월·수·금 오전"). */
  schedule: string;
  /** Spoken languages. */
  languages: string[];
};

export const DOCTORS: Doctor[] = [
  {
    id: "kim",
    name: "김도연 원장",
    role: "대표원장 · 피부과 전문의",
    credentials: [
      "서울대학교 의학박사",
      "대한피부과학회 정회원",
      "전 서울아산병원 피부과 진강사",
    ],
    specialty: "색소 · 안티에이징",
    bio: "기미·색소침착의 복합 치료와 맞춤형 안티에이징 관리를 15년간 연구해왔습니다. 환자 한 분 한 분의 피부 상태를 먼저 읽고, 과하지 않은 진료를 지향합니다.",
    portrait: "/doctors/김도연.png",
    portraitAlt: "김도연 대표원장 증명사진",
    portraitWidth: 468,
    portraitHeight: 363,
    experienceYears: 15,
    education: [
      "서울대학교 의과대학 졸업",
      "서울아산병원 피부과 전공의 수료",
      "서울대학교 의학박사 (피부과학 전공)",
    ],
    affiliations: [
      "대한피부과학회 정회원",
      "대한미용피부과학회 정회원",
      "대한레이저의학회 평생회원",
      "전 서울아산병원 피부과 임상조교수",
    ],
    specialties: [
      {
        label: "기미·색소침착 복합치료",
        desc: "레이저·경구약·재생관리를 결합한 다각 접근과 재발 관리.",
      },
      {
        label: "안티에이징 탄력 케어",
        desc: "고주파·리프팅 장비와 재생 관리를 결합한 단계적 탄력 케어.",
      },
      {
        label: "맞춤 토닝 설계",
        desc: "피부 손상을 최소화한 저자귕 토닝으로 점진적 개선.",
      },
    ],
    treatmentIds: ["laser-toning", "melasma-care", "anti-aging"],
    philosophy:
      "피부는 겉으로 드러난 한 장의 지도입니다. 색의 깊이와 닿는 감각을 먼저 읽고, 과하지 않은 케어로 환자의 일상이 흐트러지지 않도록 합니다. 빠른 효과보다 단단한 회복을, 화려한 시술보다 정직한 상담을 먼저 드립니다.",
    quote: "피부를 읽고, 과하지 않는 진료.",
    schedule: "월 · 수 · 금 오전 / 화 · 목 오후",
    languages: ["한국어", "English"],
  },
  {
    id: "lee",
    name: "이준혁 원장",
    role: "진료원장 · 피부과 전문의",
    credentials: [
      "연세대학교 의학박사",
      "대한미용피부과학회 정회원",
      "대한레이저의학회 평생회원",
    ],
    specialty: "여드름 · 모공 · 스킨부스터",
    bio: "여드름·모공·속건에 대한 장기적 케어 계획을 설계합니다. 근본 원인을 찾는 진료와, 증상 억제가 아닌 피부 재생으로의 전환을 목표로 합니다.",
    portrait: "/doctors/이준혁.png",
    portraitAlt: "이준혁 진료원장 증명사진",
    portraitWidth: 461,
    portraitHeight: 370,
    experienceYears: 12,
    education: [
      "연세대학교 의과대학 졸업",
      "세브란스병원 피부과 전공의 수료",
      "연세대학교 의학박사 (미용피부과학 전공)",
    ],
    affiliations: [
      "대한미용피부과학회 정회원",
      "대한레이저의학회 평생회원",
      "대한피부과학회 정회원",
      "전 세브란스병원 피부과 임상교수",
    ],
    specialties: [
      {
        label: "여드름 케어 프로그램",
        desc: "염증 케어 + 모공 정화 + 재생 케어 3단계로 붉은기와 재발 관리.",
      },
      {
        label: "모공 리파이닝",
        desc: "복합 레이저로 모공·피지 결합을 개선, 탄력과 너비를 동시 케어.",
      },
      {
        label: "스킨부스터 스킨케어",
        desc: "히알루론산·펩타이드를 진피층에 직접 공급해 속건·탄력 저하 케어.",
      },
    ],
    treatmentIds: ["acne-program", "pore-refining", "skin-booster"],
    philosophy:
      "여드름은 증상이 아니라 피부가 보내는 신호입니다. 염증을 억누르는 것으로 끝나지 않도록, 근본 원인을 찾고 피부가 스스로 재생되는 흐름으로 전환합니다. 재발이 줄수록 환자의 일상이 가벼워집니다.",
    quote: "증상 억제가 아닌, 피부 재생으로의 전환.",
    schedule: "화 · 목 오전 / 월 · 수 · 금 오후",
    languages: ["한국어", "English", "日本語"],
  },
];

/** Quick lookup by id — used by the dynamic profile route. */
export function getDoctor(id: string): Doctor | undefined {
  return DOCTORS.find((d) => d.id === id);
}

/** Treatments keyed by id — for resolving doctor.treatmentIds on profiles. */
export function getTreatmentsByIds(ids: string[]): Treatment[] {
  const map = new Map(TREATMENTS.map((t) => [t.id, t]));
  return ids.map((id) => map.get(id)).filter((t): t is Treatment => Boolean(t));
}

export type GalleryItem = {
  id: string;
  category: string;
  title: string;
  beforeSrc: string;
  afterSrc: string;
  sessions: string;
  note: string;
};

export const GALLERY: GalleryItem[] = [
  {
    id: "g1",
    category: "색소",
    title: "기미·잡티, 3회 토닝 후",
    beforeSrc:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    afterSrc:
      "https://images.unsplash.com/photo-1556228578-8c89330c77d0?auto=format&fit=crop&w=800&q=80",
    sessions: "3회 / 3개월",
    note: "개인 결과이며 치료 효과는 시술자에 따라 다를 수 있습니다.",
  },
  {
    id: "g2",
    category: "여드름",
    title: "염증성 여드름, 프로그램 8주 후",
    beforeSrc:
      "https://images.unsplash.com/photo-1612349317150-e2a6ebf70d68?auto=format&fit=crop&w=800&q=80",
    afterSrc:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    sessions: "8주 / 1:1 관리",
    note: "개인 결과이며 치료 효과는 시술자에 따라 다를 수 있습니다.",
  },
  {
    id: "g3",
    category: "모공",
    title: "모공·속건, 부스터 4회 후",
    beforeSrc:
      "https://images.unsplash.com/photo-1556228455-1a4d0d68c5a6?auto=format&fit=crop&w=800&q=80",
    afterSrc:
      "https://images.unsplash.com/photo-1556228724-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    sessions: "4회 / 4개월",
    note: "개인 결과이며 치료 효과는 시술자에 따라 다를 수 있습니다.",
  },
];

export type VisitInfo = {
  address: string;
  addressHref: string;
  hours: { day: string; time: string; closed?: boolean }[];
  transit: string[];
  parking: string;
};

export const VISIT: VisitInfo = {
  address: "서울특별시 강남구 테헤란로 123, 세린타워 5층",
  addressHref: "https://maps.google.com/?q=서울 강남구 테헤란로 123",
  hours: [
    { day: "월–금", time: "10:00 – 20:00" },
    { day: "토요일", time: "10:00 – 15:00" },
    { day: "일요일 · 공휴일", time: "휴진", closed: true },
  ],
  transit: ["지하철 2호선 삼성역 3번 출구 도보 4분", "버스 146, 341, 3600 세린타워 정류장"],
  parking: "세린타워 지하 2–4층 / 진료 시 2시간 무료",
};
