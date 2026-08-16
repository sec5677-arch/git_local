"use client";

import {
  Sparkle,
  Drop,
  Clock,
  Leaf,
  Phone,
  MapPin,
  InstagramLogo,
  ArrowRight,
  ArrowLeft,
  Calendar,
  ChatCircle,
  X,
  List,
  CheckCircle,
  GraduationCap,
  FirstAid,
  Quotes,
  Translate,
  CalendarDots,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

/**
 * Icon — single source for Phosphor icon mapping.
 *
 * Keeps stroke weight / size consistent across the product (one icon family,
 * one visual language). Decorative icons beside visible text get `aria-hidden`;
 * meaningful standalone icons must receive an `aria-label` from the caller.
 *
 * Stroke weight: "regular" for body-scale, size controlled by prop (default 24).
 */
export type IconName =
  | "sparkle"
  | "drops"
  | "clock"
  | "leaf"
  | "phone"
  | "map-pin"
  | "instagram"
  | "arrow-right"
  | "arrow-left"
  | "calendar"
  | "chat"
  | "close"
  | "list"
  | "check"
  | "graduation"
  | "hospital"
  | "quote"
  | "translate"
  | "calendar-dots";

const map = {
  sparkle: Sparkle,
  drops: Drop,
  clock: Clock,
  leaf: Leaf,
  phone: Phone,
  "map-pin": MapPin,
  instagram: InstagramLogo,
  "arrow-right": ArrowRight,
  "arrow-left": ArrowLeft,
  calendar: Calendar,
  chat: ChatCircle,
  close: X,
  list: List,
  check: CheckCircle,
  graduation: GraduationCap,
  hospital: FirstAid,
  quote: Quotes,
  translate: Translate,
  "calendar-dots": CalendarDots,
} as const;

type IconProps = {
  name: IconName;
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
  /** Decorative (beside visible text) → true hides from a11y tree. Default true. */
  decorative?: boolean;
  label?: string;
};

export function Icon({
  name,
  size = 24,
  weight = "regular",
  className,
  decorative = true,
  label,
}: IconProps) {
  const Cmp = map[name];
  return (
    <Cmp
      size={size}
      weight={weight}
      className={cn("shrink-0", className)}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
      focusable={false}
    />
  );
}
