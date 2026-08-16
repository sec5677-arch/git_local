"use client";

import { TREATMENTS, type Treatment } from "@/lib/site-data";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useReveal } from "@/lib/use-reveal";

/**
 * Treatments — the clinic's main service catalog.
 *
 * Layout: 3-column card grid on desktop, single column on mobile.
 * Cards group by category via an eyebrow tag; duration + recovery shown as
 * compact metadata so patients can scan for fit before calling.
 *
 * Accessibility:
 *  - Entire card is NOT a button (whole-card click traps screen readers).
 *    The "자세히 보기" link is the explicit interactive affordance.
 *  - Decorative category icon is aria-hidden.
 *  - Cards are <article> with a heading — semantic, navigable.
 */
const iconMap: Record<Treatment["icon"], IconName> = {
  sparkle: "sparkle",
  drops: "drops",
  clock: "clock",
  leaf: "leaf",
};

function TreatmentCard({ treatment }: { treatment: Treatment }) {
  const ref = useReveal<HTMLElement>();
  return (
    <article
      ref={ref}
      className="reveal card group flex h-full flex-col p-6 hover:shadow-card hover:-translate-y-0.5 sm:p-8"
    >
      <div className="flex items-center justify-between">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-50 text-sage-600 transition-colors group-hover:bg-sage-100"
          aria-hidden="true"
        >
          <Icon name={iconMap[treatment.icon]} size={24} />
        </span>
        <span className="text-caption font-medium uppercase tracking-[0.14em] text-sage-500">
          {treatment.category}
        </span>
      </div>

      <h3 className="mt-6 text-h3 text-sage-900">{treatment.title}</h3>
      <p className="mt-3 flex-1 text-small leading-relaxed text-ink-soft">
        {treatment.summary}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-sage-100 pt-5">
        <div>
          <dt className="text-caption uppercase tracking-[0.12em] text-ink-muted">
            시간
          </dt>
          <dd className="mt-1 text-small font-medium text-ink">{treatment.duration}</dd>
        </div>
        <div>
          <dt className="text-caption uppercase tracking-[0.12em] text-ink-muted">
            일상 복귀
          </dt>
          <dd className="mt-1 text-small font-medium text-ink">{treatment.recovery}</dd>
        </div>
      </dl>

      <a
        href="#reservation"
        className="mt-6 inline-flex items-center gap-1.5 text-small font-medium text-sage-700 transition-colors hover:text-sage-900"
      >
        자세히 보기
        <Icon name="arrow-right" size={16} weight="bold" />
      </a>
    </article>
  );
}

export function Treatments() {
  return (
    <Section
      id="treatments"
      tone="white"
      aria-labelledby="treatments-heading"
    >
      <SectionHeader
        eyebrow="진료과 안내"
        title="꼭 필요한 케어만, 단계별로"
        titleId="treatments-heading"
        intro="색소 · 여드름 · 안티에이징 · 스킨부스터까지. 피부 상태와 목표에 맞춘 맞춤 계획을 제안합니다."
      />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {TREATMENTS.map((t) => (
          <TreatmentCard key={t.id} treatment={t} />
        ))}
      </div>
    </Section>
  );
}
