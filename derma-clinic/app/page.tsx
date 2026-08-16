import { Hero } from "@/components/sections/Hero";
import { Treatments } from "@/components/sections/Treatments";
import { Doctors } from "@/components/sections/Doctors";
import { Gallery } from "@/components/sections/Gallery";
import { Reservation } from "@/components/sections/Reservation";

/**
 * Home page — server component.
 *
 * Header/Footer live in layout.tsx so they apply site-wide. This page only
 * composes the five content sections in editorial order:
 *
 *   1. Hero         — first impression, single primary CTA
 *   2. Treatments   — what we do (catalog)
 *   3. Doctors      — who treats you (credibility)
 *   4. Gallery      — proof (before/after)
 *   5. Reservation  — convert (CTA + hours + location)
 *
 * The order follows the trust→conversion arc: identity → capability →
 * authority → proof → action.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Treatments />
      <Doctors />
      <Gallery />
      <Reservation />
    </>
  );
}
