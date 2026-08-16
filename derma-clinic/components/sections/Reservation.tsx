"use client";

import { SITE, VISIT } from "@/lib/site-data";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useReveal } from "@/lib/use-reveal";
import { cn } from "@/lib/cn";

/**
 * Reservation — the primary conversion section.
 *
 * Composition:
 *  - Left: reservation CTAs (phone primary, Kakao secondary, online form) +
 *    hours table.
 *  - Right: location card with static map image + "큰 지도 보기" link +
 *    address, transit, parking.
 *
 * Accessibility:
 *  - Hours table is a real <table> with <th scope> for screen readers.
 *  - Closed days are marked both visually (muted + strike) and with text
 *    — never color alone.
 *  - Map image is decorative; the address text is the meaningful content, so
 *    alt="" on the image and the link carries the accessible name.
 *
 * Note: `id="reservation"` — targeted by Header & Hero CTAs.
 */
export function Reservation() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <Section id="reservation" tone="tint" aria-labelledby="reservation-heading">
      <div ref={ref} className="reveal">
        <span className="eyebrow mb-4">
          <span className="h-px w-6 bg-sage-400" aria-hidden="true" />
          예약 및 진료 안내
        </span>
        <h2 id="reservation-heading" className="text-h2 text-sage-900 text-balance">
          지금, 당신의 피부를 위해
        </h2>
        <p className="mt-5 max-w-prose-narrow text-body-lg text-ink-soft">
          편한 경로로 예약해 주세요. 첫 상담은 30분, 진료와 케어 계획까지 함께
          진행합니다.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left: CTAs + hours */}
        <div className="space-y-8">
          {/* CTAs */}
          <div className="card p-6 sm:p-8">
            <h3 className="text-h3 text-sage-900">예약하기</h3>
            <p className="mt-2 text-small text-ink-muted">
              3가지 방법으로 연결됩니다
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                href={SITE.phoneHref}
                variant="primary"
                size="lg"
                className="flex-1"
                icon={<Icon name="phone" size={20} weight="fill" />}
                iconPosition="left"
              >
                {SITE.phone}
              </Button>
              <Button
                href={SITE.kakao}
                external
                variant="secondary"
                size="lg"
                className="flex-1"
                icon={<Icon name="chat" size={20} />}
                iconPosition="left"
              >
                카카오톡 상담
              </Button>
            </div>
            <div className="mt-3">
              <Button
                href="#treatments"
                variant="ghost"
                size="md"
                className="w-full"
                icon={<Icon name="arrow-right" size={16} weight="bold" />}
              >
                진료과 먼저 보기
              </Button>
            </div>
          </div>

          {/* Hours table */}
          <div className="card p-6 sm:p-8">
            <h3 className="text-h3 text-sage-900">진료시간</h3>
            <table className="mt-5 w-full border-collapse">
              <caption className="sr-only">
                {SITE.name} 요일별 진료시간 안내
              </caption>
              <thead>
                <tr className="border-b border-sage-100">
                  <th
                    scope="col"
                    className="pb-3 text-caption font-semibold uppercase tracking-[0.12em] text-ink-muted text-left"
                  >
                    요일
                  </th>
                  <th
                    scope="col"
                    className="pb-3 text-caption font-semibold uppercase tracking-[0.12em] text-ink-muted text-right"
                  >
                    시간
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {VISIT.hours.map((row) => (
                  <tr key={row.day}>
                    <th
                      scope="row"
                      className={cn(
                        "py-3 text-body font-medium text-ink text-left",
                        row.closed && "text-ink-muted"
                      )}
                    >
                      {row.day}
                    </th>
                    <td
                      className={cn(
                        "py-3 text-body text-right tabular-nums",
                        row.closed
                          ? "text-ink-muted line-through"
                          : "text-ink-soft"
                      )}
                    >
                      {row.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 flex items-start gap-2 text-caption text-ink-muted">
              <Icon name="clock" size={14} className="mt-0.5 text-sage-500" />
              점심시간 13:00–14:00 / 마지막 접수는 폐진 1시간 전
            </p>
          </div>
        </div>

        {/* Right: Location + map */}
        <div className="card overflow-hidden">
          {/* Map (decorative) */}
          <a
            href={VISIT.addressHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block aspect-[16/10] overflow-hidden bg-sage-100"
            aria-label={`${SITE.name} 위치, 큰 지도에서 보기 (새 창)`}
          >
            <img
              src="https://images.unsplash.com/photo-1569163139394-de4798c5d1d0?auto=format&fit=crop&w=800&q=80"
              alt=""
              aria-hidden="true"
              width={800}
              height={500}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.03]"
            />
            {/* Sage wash for brand cohesion */}
            <div
              className="absolute inset-0 bg-gradient-to-tr from-sage-900/30 via-sage-500/10 to-transparent"
              aria-hidden="true"
            />
            {/* Pin marker */}
            <span
              className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              aria-hidden="true"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-500 text-cream shadow-lift ring-4 ring-cream">
                <Icon name="map-pin" size={22} weight="fill" />
              </span>
              <span className="mt-2 rounded-full bg-cream px-3 py-1 text-caption font-medium text-sage-700 shadow-soft">
                {SITE.name}
              </span>
            </span>
          </a>

          {/* Address detail */}
          <div className="p-6 sm:p-8">
            <h3 className="text-h3 text-sage-900">오시는 길</h3>
            <dl className="mt-5 space-y-5">
              <div className="flex items-start gap-3">
                <dt className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-50 text-sage-600">
                  <Icon name="map-pin" size={18} />
                </dt>
                <dd>
                  <p className="text-small font-medium text-ink">{VISIT.address}</p>
                  <a
                    href={VISIT.addressHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-caption text-sage-700 hover:text-sage-900"
                  >
                    큰 지도에서 보기
                    <Icon name="arrow-right" size={12} weight="bold" />
                  </a>
                </dd>
              </div>

              <div className="flex items-start gap-3">
                <dt className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-50 text-sage-600">
                  <Icon name="list" size={18} />
                </dt>
                <dd>
                  <p className="text-caption font-medium uppercase tracking-[0.12em] text-ink-muted">
                    대중교통
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {VISIT.transit.map((t) => (
                      <li key={t} className="text-small text-ink-soft">
                        {t}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>

              <div className="flex items-start gap-3">
                <dt className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-50 text-sage-600">
                  <Icon name="check" size={18} weight="bold" />
                </dt>
                <dd>
                  <p className="text-caption font-medium uppercase tracking-[0.12em] text-ink-muted">
                    주차
                  </p>
                  <p className="mt-1.5 text-small text-ink-soft">{VISIT.parking}</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </Section>
  );
}
