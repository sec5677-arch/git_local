"use client";

import Image from "next/image";
import { DOCTORS, type Doctor } from "@/lib/site-data";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { useReveal } from "@/lib/use-reveal";

/**
 * Doctors — medical staff profiles.
 *
 * Layout: alternating left/right portrait + copy, editorial spread style.
 * Credentials listed as a checked list for scannability. Each doctor card
 * carries an accessible name (portrait alt = name) and a clear specialty tag.
 * A "프로필 보기" link routes to the dedicated `/doctors/[id]` page where the
 * full bio, education, affiliations, specialties, and related treatments live.
 *
 * Accessibility:
 *  - Portraits are meaningful (they identify a person) → alt text is the
 *    doctor's name. Decorative bg images use alt="".
 *  - Credentials use a list; icon is aria-hidden beside visible text.
 *  - next/image prevents CLS via intrinsic width/height + fixed aspect ratio.
 */
function DoctorCard({ doctor, index }: { doctor: Doctor; index: number }) {
  const ref = useReveal<HTMLDivElement>();
  const flip = index % 2 === 1;

  return (
    <article
      ref={ref}
      className="reveal grid items-center gap-8 lg:grid-cols-12 lg:gap-14"
      aria-labelledby={`doctor-${doctor.id}-name`}
    >
      {/* Portrait */}
      <div className={flip ? "lg:col-span-5 lg:col-start-8 lg:order-2" : "lg:col-span-5"}>
        <a
          href={`/doctors/${doctor.id}`}
          className="group relative block overflow-hidden rounded-2xl bg-sage-100 shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-500/20"
          aria-label={`${doctor.name} 프로필 보기`}
        >
          <Image
            src={doctor.portrait}
            alt={doctor.portraitAlt}
            width={doctor.portraitWidth}
            height={doctor.portraitHeight}
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="aspect-[4/5] w-full object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.02]"
          />
          {/* Specialty tag */}
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-caption font-medium text-sage-700 backdrop-blur-sm">
            <Icon name="sparkle" size={14} />
            {doctor.specialty}
          </span>
          {/* Hover hint */}
          <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-sage-900/85 px-3.5 py-2 text-caption font-medium text-cream backdrop-blur-sm transition-opacity duration-300 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
            프로필 보기
            <Icon name="arrow-right" size={12} weight="bold" />
          </span>
        </a>
      </div>

      {/* Copy */}
      <div className={flip ? "lg:col-span-6 lg:col-start-1 lg:row-start-1 lg:order-1" : "lg:col-span-6 lg:col-start-8"}>
        <p className="text-caption font-medium uppercase tracking-[0.18em] text-sage-600">
          {doctor.role}
        </p>
        <h3
          id={`doctor-${doctor.id}-name`}
          className="mt-3 text-h1 text-sage-900"
        >
          {doctor.name}
        </h3>
        <p className="mt-5 text-body-lg leading-relaxed text-ink-soft">
          {doctor.bio}
        </p>

        <h4 className="mt-8 text-caption font-semibold uppercase tracking-[0.14em] text-ink-muted">
          자격 및 경력
        </h4>
        <ul className="mt-4 space-y-3">
          {doctor.credentials.map((c) => (
            <li key={c} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-50 text-sage-600"
                aria-hidden="true"
              >
                <Icon name="check" size={14} weight="bold" />
              </span>
              <span className="text-small text-ink-soft">{c}</span>
            </li>
          ))}
        </ul>

        <a
          href={`/doctors/${doctor.id}`}
          className="mt-8 inline-flex items-center gap-1.5 text-small font-medium text-sage-700 transition-colors hover:text-sage-900"
        >
          상세 프로필 보기
          <Icon name="arrow-right" size={16} weight="bold" />
        </a>
      </div>
    </article>
  );
}

export function Doctors() {
  return (
    <Section id="doctors" tone="tint" aria-labelledby="doctors-heading">
      <SectionHeader
        eyebrow="의료진 소개"
        title="환자를 먼저 읽는 의료진"
        titleId="doctors-heading"
        intro="모두 피부과 전문의. 10년 이상의 진료 경험과, 환자의 피부를 먼저 살피는 태도를 갖추고 있습니다. 각 원장의 상세 프로필을 통해 진료 철학과 경력을 확인하세요."
      />
      <div className="mt-16 space-y-22">
        {DOCTORS.map((d, i) => (
          <DoctorCard key={d.id} doctor={d} index={i} />
        ))}
      </div>
    </Section>
  );
}
