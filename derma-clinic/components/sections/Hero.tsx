"use client";

import { SITE } from "@/lib/site-data";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useReveal } from "@/lib/use-reveal";
import { cn } from "@/lib/cn";

/**
 * Hero — above-the-fold, the single most important impression.
 *
 * Composition:
 *  - Asymmetric editorial split: copy left (5/7), visual right.
 *  - Headline is a serif display, balanced wrap, single dominant CTA.
 *  - Trust strip beneath: 15년 진료 · 1:1 맞춤 · 투명한 진료 — three pillars.
 *  - Visual: layered treatment-room photo with sage tint overlay +
 *    floating "오늘의 예약" pill for depth without clutter.
 *
 * Accessibility:
 *  - Background image is decorative; meaning is carried by text → alt="".
 *  - Only ONE primary CTA (예약하기); secondary is text link, subordinate.
 */
export function Hero() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-cream pt-28 pb-20 sm:pt-32 lg:pt-40 lg:pb-30"
      aria-labelledby="hero-heading"
    >
      {/* Soft sage radial accent — decorative, behind content */}
      <div
        className="pointer-events-none absolute -right-32 -top-24 h-[36rem] w-[36rem] rounded-full bg-sage-100/70 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-40 top-1/3 h-[28rem] w-[28rem] rounded-full bg-sage-200/40 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-content relative">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Copy */}
          <div ref={ref} className="reveal lg:col-span-6">
            <span className="eyebrow mb-6">
              <span className="h-px w-6 bg-sage-400" aria-hidden="true" />
              {SITE.name} · 서울 강남
            </span>
            <h1
              id="hero-heading"
              className="text-display text-sage-900 text-balance"
            >
              피부를 읽고,
              <br />
              과하지 않는 진료.
            </h1>
            <p className="mt-6 max-w-prose-narrow text-body-lg text-ink-soft">
              15년의 진료 경험으로 환자 한 분 한 분의 피부 상태를 먼저 살핍니다.
              맞춤 계획과 정직한 상담으로, 불필요한 시술은 빼고 꼭 필요한 케어만
              남깁니다.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                href="#reservation"
                variant="primary"
                size="lg"
                icon={<Icon name="calendar" size={20} />}
              >
                예약하기
              </Button>
              <Button href="#treatments" variant="secondary" size="lg">
                진료과 안내
              </Button>
            </div>

            {/* Trust pillars */}
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-sage-100 pt-6">
              {[
                { v: "15년", l: "진료 경력" },
                { v: "1:1", l: "맞춤 진료" },
                { v: "투명", l: "정직한 상담" },
              ].map((stat) => (
                <div key={stat.l}>
                  <dt className="sr-only">{stat.l}</dt>
                  <dd>
                    <span className="block font-serif text-h3 text-sage-700">
                      {stat.v}
                    </span>
                    <span className="mt-1 block text-caption uppercase tracking-[0.14em] text-ink-muted">
                      {stat.l}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Visual */}
          <div className="lg:col-span-6">
            <div className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sage-100 shadow-lift">
                <img
                  src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80"
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                  width={900}
                  height={1125}
                  loading="eager"
                  fetchPriority="high"
                />
                {/* Sage duotone wash for brand cohesion */}
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-sage-900/20 via-sage-500/5 to-transparent"
                  aria-hidden="true"
                />
              </div>

              {/* Floating reservation pill */}
              <div
                className={cn(
                  "reveal absolute -bottom-6 -left-2 sm:-left-6",
                  "rounded-lg bg-white/95 backdrop-blur-md shadow-card border border-sage-100",
                  "px-5 py-4 max-w-xs"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-50 text-sage-600"
                    aria-hidden="true"
                  >
                    <Icon name="check" size={20} weight="bold" />
                  </span>
                  <div>
                    <p className="text-small font-semibold text-sage-900">
                      오늘 남은 예약 가능
                    </p>
                    <p className="text-caption text-ink-muted">
                      17:00 · 18:30 · 19:30
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
