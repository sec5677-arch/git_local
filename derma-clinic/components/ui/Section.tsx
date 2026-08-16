import { cn } from "@/lib/cn";
import { useReveal } from "@/lib/use-reveal";

/**
 * Section — vertical-rhythm wrapper for page sections.
 *
 * Enforces consistent inter-section spacing (mobile → desktop) and an
 * optional `tone` for alternating surface backgrounds (cream tint vs white)
 * to create editorial cadence without ad-hoc spacing per section.
 *
 * @example <Section id="treatments" tone="tint" eyebrow="진료과" title="...">
 */
type SectionProps = {
  id?: string;
  tone?: "cream" | "tint" | "white";
  className?: string;
  children: React.ReactNode;
  "aria-labelledby"?: string;
};

const toneClass: Record<NonNullable<SectionProps["tone"]>, string> = {
  cream: "bg-cream",
  tint: "bg-cream-tint",
  white: "bg-white",
};

export function Section({
  id,
  tone = "cream",
  className,
  children,
  ...aria
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(toneClass[tone], "py-20 sm:py-24 lg:py-30", className)}
      {...aria}
    >
      <div className="container-content">{children}</div>
    </section>
  );
}

/**
 * SectionHeader — eyebrow + title + intro, with scroll reveal.
 *
 * Layout: centered on mobile, left-aligned on desktop for editorial feel.
 * Title uses `text-balance` so short headings wrap symmetrically.
 */
type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  intro?: string;
  align?: "left" | "center";
  as?: "h2" | "h3";
  /** id for the heading element — pair with the parent Section's aria-labelledby */
  titleId?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  intro,
  align = "left",
  as = "h2",
  titleId,
}: SectionHeaderProps) {
  const ref = useReveal<HTMLDivElement>();
  const Heading = as;

  return (
    <div
      ref={ref}
      className={cn(
        "reveal max-w-prose-narrow",
        align === "center" && "mx-auto text-center"
      )}
    >
      {eyebrow ? (
        <span className="eyebrow mb-4">
          <span className="h-px w-6 bg-sage-400" aria-hidden="true" />
          {eyebrow}
        </span>
      ) : null}
      <Heading id={titleId} className="text-h2 text-sage-900 text-balance">
        {title}
      </Heading>
      {intro ? (
        <p className="mt-5 text-body-lg text-ink-soft">{intro}</p>
      ) : null}
    </div>
  );
}
