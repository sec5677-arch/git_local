"use client";

import { useState } from "react";
import { GALLERY, type GalleryItem } from "@/lib/site-data";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { useReveal } from "@/lib/use-reveal";
import { cn } from "@/lib/cn";

/**
 * Gallery — Before/After comparison cards.
 *
 * Interaction:
 *  - Each card has a segmented toggle (Before / After), the single accessible
 *    affordance to switch views. Whole-image drag slider was rejected: harder
 *    to make keyboard- and screen-reader-friendly. Toggle is explicit.
 *  - State is local per card (independent). Toggle is a real <button> with
 *    aria-pressed reflecting current view.
 *
 * Accessibility:
 *  - Both images carry descriptive alt text including the view + title.
 *  - Toggle buttons are ≥44px tall and expose aria-pressed.
 *  - Legal disclaimer rendered once at section foot (Korean medical law
 *    requires disclosure that individual results vary).
 */
type View = "before" | "after";

function GalleryCard({ item }: { item: GalleryItem }) {
  const [view, setView] = useState<View>("after");
  const ref = useReveal<HTMLElement>();
  const isAfter = view === "after";

  return (
    <article
      ref={ref}
      className="reveal card overflow-hidden"
      aria-labelledby={`gallery-${item.id}-title`}
    >
      {/* Image stage — fixed aspect to prevent CLS on view swap */}
      <div className="relative aspect-[4/3] overflow-hidden bg-sage-100">
        <img
          src={item.beforeSrc}
          alt={`시술 전 — ${item.title}`}
          width={800}
          height={600}
          loading="lazy"
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out-soft",
            isAfter ? "opacity-0" : "opacity-100"
          )}
        />
        <img
          src={item.afterSrc}
          alt={`시술 후 — ${item.title}`}
          width={800}
          height={600}
          loading="lazy"
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out-soft",
            isAfter ? "opacity-100" : "opacity-0"
          )}
        />
        {/* Category chip */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-caption font-medium text-sage-700 backdrop-blur-sm">
          <Icon name="sparkle" size={14} />
          {item.category}
        </span>
        {/* Sessions chip */}
        <span className="absolute right-3 top-3 rounded-full bg-sage-900/70 px-3 py-1.5 text-caption font-medium text-cream backdrop-blur-sm">
          {item.sessions}
        </span>
      </div>

      {/* Footer: title + toggle */}
      <div className="p-5 sm:p-6">
        <h3
          id={`gallery-${item.id}-title`}
          className="text-h3 text-sage-900"
        >
          {item.title}
        </h3>

        <div
          className="mt-4 inline-flex rounded-full bg-sage-50 p-1"
          role="group"
          aria-label={`${item.title} Before/After 보기 전환`}
        >
          <button
            type="button"
            onClick={() => setView("before")}
            aria-pressed={!isAfter}
            className={cn(
              "rounded-full px-4 py-2 text-small font-medium transition-colors",
              !isAfter ? "bg-white text-sage-900 shadow-soft" : "text-ink-muted hover:text-sage-700"
            )}
          >
            Before
          </button>
          <button
            type="button"
            onClick={() => setView("after")}
            aria-pressed={isAfter}
            className={cn(
              "rounded-full px-4 py-2 text-small font-medium transition-colors",
              isAfter ? "bg-white text-sage-900 shadow-soft" : "text-ink-muted hover:text-sage-700"
            )}
          >
            After
          </button>
        </div>
      </div>
    </article>
  );
}

export function Gallery() {
  return (
    <Section id="gallery" tone="white" aria-labelledby="gallery-heading">
      <SectionHeader
        eyebrow="전 · 후 갤러리"
        title="과정이 보이는 결과"
        titleId="gallery-heading"
        intro="실제 진료 사례입니다. Before/After를 직접 전환해 보세요. 모든 결과는 개인별 케어 계획에 따라 진행되었습니다."
      />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {GALLERY.map((g) => (
          <GalleryCard key={g.id} item={g} />
        ))}
      </div>

      {/* Legal disclaimer */}
      <p className="mt-10 max-w-prose-narrow text-caption leading-relaxed text-ink-muted">
        {GALLERY[0]?.note} 본 사례는 해당 환자의 개인 결과이며, 시술자의 피부
        상태·시술 횟수·관리에 따라 효과와 부작용 여부가 다를 수 있습니다.
      </p>
    </Section>
  );
}
