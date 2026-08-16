import { SITE, NAV_LINKS } from "@/lib/site-data";
import { Icon } from "./Icon";

/**
 * Footer — clinic identity, quick links, contact.
 *
 * Light surface, hairline-separated from content. Carries the clinic's
 * legal identity (representative, license number placeholder) — Korean
 * medical sites require this by law. No newsletter spam; one calm CTA
 * lives in the Reservation section instead.
 */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-sage-100 bg-cream-tint" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        사이트 정보
      </h2>
      <div className="container-content py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand block */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-500 text-cream"
                aria-hidden="true"
              >
                <Icon name="leaf" size={18} weight="fill" />
              </span>
              <span className="font-serif text-h3 text-sage-900">{SITE.name}</span>
            </div>
            <p className="mt-4 max-w-sm text-small leading-relaxed text-ink-muted">
              {SITE.tagline}. 1:1 맞춤 진료와 정직한 상담을 지향합니다.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href={SITE.kakao}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-sage-200 text-sage-700 transition-colors hover:bg-sage-50"
                aria-label="카카오톡 채널 (새 창)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="chat" size={20} />
              </a>
              <a
                href={SITE.instagram}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-sage-200 text-sage-700 transition-colors hover:bg-sage-50"
                aria-label="인스타그램 (새 창)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="instagram" size={20} />
              </a>
              <a
                href={SITE.phoneHref}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-sage-200 text-sage-700 transition-colors hover:bg-sage-50"
                aria-label={`전화걸기 ${SITE.phone}`}
              >
                <Icon name="phone" size={20} />
              </a>
            </div>
          </div>

          {/* Nav */}
          <nav aria-label="푸터 메뉴">
            <h3 className="text-caption font-semibold uppercase tracking-[0.18em] text-sage-600">
              바로가기
            </h3>
            <ul className="mt-4 space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-small text-ink-soft transition-colors hover:text-sage-700"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="text-caption font-semibold uppercase tracking-[0.18em] text-sage-600">
              진료 안내
            </h3>
            <dl className="mt-4 space-y-3 text-small text-ink-soft">
              <div className="flex items-start gap-2">
                <dt>
                  <Icon name="phone" size={16} className="mt-0.5 text-sage-500" />
                </dt>
                <dd>
                  <a href={SITE.phoneHref} className="hover:text-sage-700">
                    {SITE.phone}
                  </a>
                </dd>
              </div>
              <div className="flex items-start gap-2">
                <dt>
                  <Icon name="clock" size={16} className="mt-0.5 text-sage-500" />
                </dt>
                <dd>
                  평일 10:00–20:00<br />토요일 10:00–15:00
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Legal */}
        <div className="mt-12 border-t border-sage-100 pt-8">
          <p className="text-caption leading-relaxed text-ink-muted">
            {SITE.name} · 대표: 김도연 · 의료기기 판매업 허가 제 2024-서울강남-0000호<br />
            사업자등록번호: 123-45-67890 · 의원번호: 22000000
          </p>
          <p className="mt-3 text-caption text-ink-muted">
            © {year} {SITE.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
