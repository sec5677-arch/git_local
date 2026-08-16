import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";

/**
 * 404 page for unknown doctor ids at `/doctors/[id]`.
 *
 * Triggered by `notFound()` in the page when `getDoctor(id)` returns undefined.
 * Kept calm and on-brand: a short message, the list of valid doctors, and a
 * single primary action back to the doctors section.
 */
export default function DoctorNotFound() {
  return (
    <Section
      id="not-found"
      tone="cream"
      aria-labelledby="nf-heading"
      className="pt-28 pb-20 sm:pt-32"
    >
      <div className="mx-auto max-w-prose-narrow text-center">
        <span
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage-50 text-sage-600"
          aria-hidden="true"
        >
          <Icon name="list" size={24} />
        </span>
        <p className="mt-5 text-caption font-medium uppercase tracking-[0.18em] text-sage-600">
          404
        </p>
        <h1 id="nf-heading" className="mt-2 text-h1 text-sage-900 text-balance">
          해당 원장의 프로필을 찾을 수 없습니다
        </h1>
        <p className="mt-4 text-body-lg text-ink-soft">
          요청하신 주소의 의료진 정보가 존재하지 않습니다. 의료진 목록에서
          다시 선택해 주세요.
        </p>
        <div className="mt-8">
          <Link
            href="/#doctors"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Icon name="arrow-left" size={18} weight="bold" />
            의료진 목록으로 돌아가기
          </Link>
        </div>
      </div>
    </Section>
  );
}
