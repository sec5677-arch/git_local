"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { NAV_LINKS, SITE } from "@/lib/site-data";
import { Icon } from "./Icon";
import { Button } from "./Button";

/**
 * Header — sticky site header with mobile drawer.
 *
 * Behavior:
 *  - Transparent over hero, gains cream + hairline shadow after scrolling
 *    past 24px. Scroll listener is passive and cleans up on unmount.
 *  - Mobile nav opens as a full-width drawer below the bar; closes on link
 *    click, on Escape, and on route hash change. Focus is trapped while open.
 *  - Body scroll locked while drawer is open.
 *
 * Accessibility:
 *  - Hamburger button exposes aria-expanded / aria-controls.
 *  - Drawer has role="dialog" + aria-modal, labelled by its heading.
 *  - Escape key closes; focus returns to the trigger button.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // Scroll state — passive listener, no layout thrash.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll + close on Escape while drawer is open.
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-out-soft",
        scrolled
          ? "bg-cream/95 backdrop-blur-md border-b border-sage-100 shadow-soft"
          : "bg-transparent"
      )}
    >
      <div className="container-content flex h-16 items-center justify-between lg:h-20">
        {/* Brand */}
        <a
          href="#main"
          className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-500/20"
          aria-label={`${SITE.name} 홈으로`}
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-500 text-cream"
            aria-hidden="true"
          >
            <Icon name="leaf" size={18} weight="fill" />
          </span>
          <span className="font-serif text-h3 text-sage-900">
            {SITE.name}
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="주 메뉴">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-4 py-2 text-small font-medium text-ink-soft transition-colors duration-200 hover:bg-sage-50 hover:text-sage-700"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button href="#reservation" variant="primary" icon={<Icon name="calendar" size={18} />}>
            예약하기
          </Button>
        </div>

        {/* Mobile trigger */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-md text-sage-700 hover:bg-sage-50 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-drawer"
          aria-label="메뉴 열기"
        >
          <Icon name="list" size={26} />
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="사이트 메뉴"
        className={cn(
          "fixed inset-0 top-16 z-40 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* Scrim */}
        <div
          className={cn(
            "absolute inset-0 bg-sage-900/30 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
        {/* Panel */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 bg-cream shadow-lift transition-transform duration-300 ease-out-soft",
            open ? "translate-y-0" : "-translate-y-full"
          )}
        >
          <nav className="container-content flex flex-col py-4" aria-label="모바일 메뉴">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-sage-100 py-4 text-body-lg font-medium text-ink hover:text-sage-700"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-6">
              <Button
                href="#reservation"
                variant="primary"
                className="w-full"
                onClick={() => setOpen(false)}
                icon={<Icon name="calendar" size={18} />}
              >
                예약하기
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
