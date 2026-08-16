import { clsx, type ClassValue } from "clsx";

/**
 * `cn` — tiny className combiner.
 *
 * Merges conditional class values into a single string. Used across all
 * components so conditional state classes (e.g. `is-visible && "shadow-lift"`)
 * compose predictably without template-string spaghetti.
 *
 * @example cn("btn", isActive && "btn-primary", "mt-4")
 * @param inputs - class values, arrays, or conditionals
 * @returns single deduplicated class string
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
