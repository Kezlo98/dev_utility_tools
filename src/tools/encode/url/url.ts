import type { Direction } from "@/tools/encode/direction-toggle";

/**
 * URL percent-encoding via the standard built-ins. `encodeURIComponent`
 * encodes everything except `A–Z a–z 0–9 - _ . ! ~ * ' ( )`; the decode path
 * surfaces a readable error on malformed sequences (lone `%` or bad hex).
 */
export function encodeUrl(input: string): string {
  return encodeURIComponent(input);
}

export function decodeUrl(input: string): {
  output: string;
  error: string | null;
} {
  if (!input) return { output: "", error: null };
  try {
    return { output: decodeURIComponent(input), error: null };
  } catch {
    return {
      output: "",
      error:
        "Invalid URL encoding: malformed percent-escape sequence (e.g. a lone '%' or bad hex).",
    };
  }
}

/** Convenience used by the toggle UI: encode or decode in one call. */
export function transformUrl(
  input: string,
  direction: Direction,
): { output: string; error: string | null } {
  if (!input) return { output: "", error: null };
  if (direction === "encode") return { output: encodeUrl(input), error: null };
  return decodeUrl(input);
}
