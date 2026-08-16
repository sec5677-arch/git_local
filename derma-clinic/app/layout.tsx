import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";

/**
 * Font loading — `next/font` self-hosts fonts, eliminating layout shift
 * (no FOIT) and avoiding third-party request to fonts.googleapis.com
 * at runtime. Two families for editorial premium contrast:
 *   - Playfair Display: high-contrast serif headings (elegant, premium)
 *   - Inter: clean geometric sans body (legible, modern)
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://serene-derma.example.kr"),
  title: {
    default: "세린 피부과 — 정직한 진료, 섬세한 케어",
    template: "%s | 세린 피부과",
  },
  description:
    "세린 피부과는 1:1 맞춤 진료와 정직한 상담을 지향합니다. 레이저, 스킨부스터, 여드름·색소 치료까지. 예약과 상담은 언제든 환영합니다.",
  keywords: [
    "피부과",
    "피부과 진료",
    "레이저 색소 치료",
    "스킨부스터",
    "여드름 치료",
    "프리미엄 피부과",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    title: "세린 피부과 — 정직한 진료, 섬세한 케어",
    description:
      "1:1 맞춤 진료와 정직한 상담. 레이저·스킨부스터·여드름·색소 치료.",
    siteName: "세린 피부과",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Do not disable zoom — WCAG 2.2 AA requires user-scalable.
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="skip-link">
          본문으로 건너뛰기
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
