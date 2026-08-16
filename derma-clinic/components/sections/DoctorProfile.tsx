"use client";

import Image from "next/image";
import Link from "next/link";
import {
  DOCTORS,
  getTreatmentsByIds,
  SITE,
  type Doctor,
} from "@/lib/site-data";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useReveal } from "@/lib/use-reveal";
import { cn } from "@/lib/cn";

/**
 * DoctorProfile — full bio page for a single doctor at `/doctors/[id]`.
 *
 * Composition (top → bottom):
 *  1. Header band — back link, eyebrow role, name (h1), specialty pills,
 *     pull-quote, portrait with decorative sage wash, quick stats
 *     (experience / schedule / languages).
 *  2. Philosophy — the doctor's care philosophy paragraph.
 *  3. Education & Affiliations — two-column checked lists.
 *  4. Specialty focus — label + description rows.
 *  5. Related treatments — cross-linked to #treatments anchors.
 *  6. Other doctors — cross-link to the sibling profile(s).
 *  7. Reservation CTA — single primary action.
 *
 * Accessibility:
 *  - Single h1 (doctor name); section headings are h2 for a flat, clear
 *    outline. (Home page h1 lives on `/` — this is a separate route.)
 *  - Portrait alt is the doctor's name (meaningful image).
 *  - Lists use <ul>; decorative check icons are aria-hidden.
 *  - Back link is a real <Link> with a descriptive label.
 */
type StatItem = {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  value: string;
};

export function DoctorProfile({ doctor }: { doctor: Doctor }) {
  const related = getTreatmentsByIds(doctor.treatmentIds);
  const others = DOCTORS.filter((d) => d.id !== doctor.id);
  const headerRef = useReveal<HTMLDivElement>();
  const philosophyRef = useReveal<HTMLDivElement>();
  const credentialsRef = useReveal<HTMLDivElement>();
  const specialtiesRef = useReveal<HTMLDivElement>();
  const relatedRef = useReveal<HTMLDivElement>();
  const othersRef = useReveal<HTMLDivElement>();
  const ctaRef = useReveal<HTMLDivElement>();

  const stats: StatItem[] = [
    {
      icon: "calendar-dots",
      label: "진료 경력",
      value: `${doctor.experienceYears}년`,
    },
    { icon: "calendar", label: "진료 일정", value: doctor.schedule },
    {
      icon: "translate",
      label: "사용 언어",
      value: doctor.languages.join(" · "),
    },
  ];

  return (
    <>
      {/* ── 1. Header band ─────────────────────────────────────── */}
      <Section
        id="doctor-profile"
        tone="cream"
        aria-labelledby="doctor-name"
        className="pt-28 pb-16 sm:pt-32 lg:pt-36 lg:pb-20"
      >
        <div className="mb-8">
          <Link
            href="/#doctors"
            className="inline-flex items-center gap-1.5 rounded-md text-small font-medium text-sage-700 transition-colors hover:text-sage-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-500/20"
          >
            <Icon name="arrow-left" size={16} weight="bold" />
            의료진 목록으로
          </Link>
        </div>

        <div
          ref={headerRef}
          className="reveal grid items-start gap-10 lg:grid-cols-12 lg:gap-14"
        >
          {/* Portrait */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl bg-sage-100 shadow-lift">
              <Image
                src={doctor.portrait}
                alt={doctor.portraitAlt}
                width={doctor.portraitWidth}
                height={doctor.portraitHeight}
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="aspect-[4/5] w-full object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-tr from-sage-900/15 via-transparent to-transparent"
                aria-hidden="true"
              />
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-caption font-medium text-sage-700 backdrop-blur-sm">
                <Icon name="sparkle" size={14} />
                {doctor.specialty}
              </span>
            </div>
          </div>

          {/* Identity + quote */}
          <div className="lg:col-span-7">
            <p className="text-caption font-medium uppercase tracking-[0.18em] text-sage-600">
              {doctor.role}
            </p>
            <h1
              id="doctor-name"
              className="mt-3 text-display text-sage-900 text-balance"
            >
              {doctor.name}
            </h1>

            {/* Specialty pills */}
            <ul className="mt-5 flex flex-wrap gap-2">
              {doctor.specialties.map((s) => (
                <li
                  key={s.label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-3 py-1.5 text-caption font-medium text-sage-700 ring-1 ring-inset ring-sage-200"
                >
                  <Icon name="sparkle" size={12} />
                  {s.label}
                </li>
              ))}
            </ul>

            {/* Pull-quote */}
            <blockquote className="mt-7 border-l-2 border-sage-300 pl-5">
              <p className="font-serif text-h3 italic leading-snug text-sage-800">
                “{doctor.quote}”
              </p>
            </blockquote>

            {/* Quick stats */}
            <dl className="mt-8 grid gap-4 border-t border-sage-100 pt-6 sm:grid-cols-3">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="flex items-center gap-1.5 text-caption uppercase tracking-[0.12em] text-ink-muted">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-50 text-sage-600"
                      aria-hidden="true"
                    >
                      <Icon name={s.icon} size={14} />
                    </span>
                    {s.label}
                  </dt>
                  <dd className="mt-2 text-small font-medium text-ink">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>

            {/* CTA */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                href="#reservation"
                variant="primary"
                size="lg"
                icon={<Icon name="calendar" size={20} />}
              >
                {doctor.name.split(" ")[0]} 원장 예약하기
              </Button>
              <Button href={SITE.phoneHref} variant="secondary" size="lg" iconPosition="left" icon={<Icon name="phone" size={18} weight="fill" />}>
                {SITE.phone}
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 2. Philosophy ─────────────────────────────────────── */}
      <Section id="philosophy" tone="tint" aria-labelledby="philosophy-heading">
        <div ref={philosophyRef} className="reveal max-w-prose-narrow">
          <span className="eyebrow mb-4">
            <span className="h-px w-6 bg-sage-400" aria-hidden="true" />
            진료 철학
          </span>
          <h2 id="philosophy-heading" className="text-h2 text-sage-900 text-balance">
            {doctor.name} 원장의 접근
          </h2>
          <p className="mt-6 text-body-lg leading-relaxed text-ink-soft">
            {doctor.philosophy}
          </p>
        </div>
      </Section>

      {/* ── 3. Education & Affiliations ──────────────────────── */}
      <Section
        id="credentials"
        tone="white"
        aria-labelledby="credentials-heading"
      >
        <div ref={credentialsRef} className="reveal">
          <span className="eyebrow mb-4">
            <span className="h-px w-6 bg-sage-400" aria-hidden="true" />
            경력 및 자격
          </span>
          <h2 id="credentials-heading" className="text-h2 text-sage-900 text-balance">
            학력과 학회 활동
          </h2>

          <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Education */}
            <div>
              <h3 className="flex items-center gap-2 text-h3 text-sage-900">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-50 text-sage-600"
                  aria-hidden="true"
                >
                  <Icon name="graduation" size={18} />
                </span>
                학력 및 수련
              </h3>
              <ul className="mt-5 space-y-3">
                {doctor.education.map((e) => (
                  <li key={e} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-50 text-sage-600"
                      aria-hidden="true"
                    >
                      <Icon name="check" size={14} weight="bold" />
                    </span>
                    <span className="text-body text-ink-soft">{e}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Affiliations */}
            <div>
              <h3 className="flex items-center gap-2 text-h3 text-sage-900">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-50 text-sage-600"
                  aria-hidden="true"
                >
                  <Icon name="hospital" size={18} />
                </span>
                학회 및 소속
              </h3>
              <ul className="mt-5 space-y-3">
                {doctor.affiliations.map((a) => (
                  <li key={a} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-50 text-sage-600"
                      aria-hidden="true"
                    >
                      <Icon name="check" size={14} weight="bold" />
                    </span>
                    <span className="text-body text-ink-soft">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 4. Specialty focus ───────────────────────────────── */}
      <Section
        id="specialties"
        tone="tint"
        aria-labelledby="specialties-heading"
      >
        <div ref={specialtiesRef} className="reveal">
          <span className="eyebrow mb-4">
            <span className="h-px w-6 bg-sage-400" aria-hidden="true" />
            주요 진료 분야
          </span>
          <h2 id="specialties-heading" className="text-h2 text-sage-900 text-balance">
            {doctor.name} 원장이 집중하는 케어
          </h2>

          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {doctor.specialties.map((s, i) => (
              <li
                key={s.label}
                className="card flex h-full flex-col p-6 sm:p-8"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-50 text-sage-600"
                  aria-hidden="true"
                >
                  <Icon name="sparkle" size={20} />
                </span>
                <h3 className="mt-5 text-h3 text-sage-900">
                  <span className="sr-only">{i + 1}. </span>
                  {s.label}
                </h3>
                <p className="mt-3 text-small leading-relaxed text-ink-soft">
                  {s.desc}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ── 5. Related treatments ────────────────────────────── */}
      {related.length > 0 && (
        <Section
          id="related-treatments"
          tone="white"
          aria-labelledby="related-heading"
        >
          <div ref={relatedRef} className="reveal">
            <span className="eyebrow mb-4">
              <span className="h-px w-6 bg-sage-400" aria-hidden="true" />
              관련 진료과
            </span>
            <h2 id="related-heading" className="text-h2 text-sage-900 text-balance">
              {doctor.name} 원장이 직접 진료하는 시술
            </h2>

            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {related.map((t) => (
                <li key={t.id}>
                  <a
                    href={`/treatments#${t.id}`}
                    className="card group flex h-full flex-col p-6 hover:shadow-card hover:-translate-y-0.5 sm:p-8 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-500/20"
                  >
                    <span className="text-caption font-medium uppercase tracking-[0.14em] text-sage-500">
                      {t.category}
                    </span>
                    <h3 className="mt-3 text-h3 text-sage-900">{t.title}</h3>
                    <p className="mt-3 flex-1 text-small leading-relaxed text-ink-soft">
                      {t.summary}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-1.5 text-small font-medium text-sage-700 transition-colors group-hover:text-sage-900">
                      진료과 자세히 보기
                      <Icon name="arrow-right" size={16} weight="bold" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}

      {/* ── 6. Other doctors ────────────────────────────────── */}
      {others.length > 0 && (
        <Section
          id="other-doctors"
          tone="tint"
          aria-labelledby="others-heading"
        >
          <div ref={othersRef} className="reveal">
            <span className="eyebrow mb-4">
              <span className="h-px w-6 bg-sage-400" aria-hidden="true" />
              다른 의료진
            </span>
            <h2 id="others-heading" className="text-h2 text-sage-900 text-balance">
              함께 진료하는 원장
            </h2>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:gap-8">
              {others.map((d) => (
                <Link
                  key={d.id}
                  href={`/doctors/${d.id}`}
                  className="card group flex items-center gap-5 p-5 hover:shadow-card hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-500/20 sm:p-6"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sage-100 sm:h-24 sm:w-24">
                    <Image
                      src={d.portrait}
                      alt={d.portraitAlt}
                      width={d.portraitWidth}
                      height={d.portraitHeight}
                      sizes="96px"
                      className="h-full w-full object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.05]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-caption font-medium uppercase tracking-[0.14em] text-sage-600">
                      {d.role}
                    </p>
                    <h3 className="mt-1 text-h3 text-sage-900">{d.name}</h3>
                    <p className="mt-1.5 line-clamp-2 text-small text-ink-muted">
                      {d.specialty}
                    </p>
                  </div>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-50 text-sage-600 transition-colors group-hover:bg-sage-100"
                    aria-hidden="true"
                  >
                    <Icon name="arrow-right" size={16} weight="bold" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* ── 7. Reservation CTA ──────────────────────────────── */}
      <Section id="reservation" tone="cream" aria-labelledby="cta-heading">
        <div
          ref={ctaRef}
          className="reveal card mx-auto max-w-3xl overflow-hidden p-8 text-center sm:p-12"
        >
          <span
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage-50 text-sage-600"
            aria-hidden="true"
          >
            <Icon name="calendar" size={24} />
          </span>
          <h2 id="cta-heading" className="mt-5 text-h2 text-sage-900 text-balance">
            {doctor.name} 원장과 상담 예약
          </h2>
          <p className="mt-4 text-body-lg text-ink-soft">
            첫 상담은 30분. {doctor.name.split(" ")[0]} 원장이 직접 피부 상태를
            살피고 맞춤 케어 계획을 제안합니다.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              href={SITE.phoneHref}
              variant="primary"
              size="lg"
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
              icon={<Icon name="chat" size={20} />}
              iconPosition="left"
            >
              카카오톡 상담
            </Button>
          </div>
          <p className="mt-6 text-caption text-ink-muted">
            진료 일정: {doctor.schedule} · 점심시간 13:00–14:00
          </p>
        </div>
      </Section>
    </>
  );
}
