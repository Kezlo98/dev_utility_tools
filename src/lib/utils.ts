import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with conditional logic (shadcn/ui helper).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Detect if the app is running on macOS.
 * This is used to adjust layout spacing (e.g. for traffic lights titlebar overlay).
 */
export const isMac =
  typeof window !== "undefined" &&
  /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent || navigator.platform || "");
