import type { Direction } from "@/tools/encode/direction-toggle";

/**
 * UTF-8 safe Base64. `btoa`/`atob` only handle Latin-1, so we round-trip
 * through bytes via TextEncoder/TextDecoder. Decoding a non-Base64 string
 * surfaces a readable error instead of throwing out of the tool.
 */
export function encodeBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  // Chunk to avoid exceeding the call-stack size on large inputs.
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function decodeBase64(input: string): { output: string; error: string | null } {
  const trimmed = input.replace(/\s+/g, "");
  if (!trimmed) return { output: "", error: null };
  // fatal: true so a non-UTF-8 byte sequence (e.g. a binary/image blob) is
  // surfaced as a readable error instead of silently replaced with U+FFFD.
  const decoder = new TextDecoder("utf-8", { fatal: true });
  try {
    const binary = atob(trimmed);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return { output: decoder.decode(bytes), error: null };
  } catch (e) {
    // Distinguish "not Base64 at all" from "valid Base64 but not UTF-8 text".
    const msg =
      e instanceof Error && /encoding/i.test(e.message)
        ? "Decoded bytes are not valid UTF-8 text (this looks like binary data)."
        : "Invalid Base64: contains characters outside the alphabet or has bad length/padding.";
    return { output: "", error: msg };
  }
}

/** Convenience used by the toggle UI: encode or decode in one call. */
export function transformBase64(
  input: string,
  direction: Direction,
): { output: string; error: string | null } {
  if (!input) return { output: "", error: null };
  if (direction === "encode") return { output: encodeBase64(input), error: null };
  return decodeBase64(input);
}
