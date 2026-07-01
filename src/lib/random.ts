/**
 * Cryptographically secure randomness helpers. Every byte of entropy comes
 * from `crypto.getRandomValues` (the Tauri WebView's OS CSPRNG). No
 * non-cryptographic PRNG is ever used in this module — see the Phase 4
 * success criteria.
 */

/**
 * Uniform random integer in `[0, maxExclusive)` using rejection sampling so the
 * distribution has no modulo bias. Throws for non-positive or non-integer args.
 */
export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError("secureRandomInt requires a positive integer");
  }
  if (maxExclusive === 1) return 0;

  const range = 0x100000000; // 2^32
  // Largest multiple of maxExclusive that fits in a uint32. Drawing below this
  // limit and taking modulo yields a perfectly uniform result.
  const limit = range - (range % maxExclusive);
  const buf = new Uint32Array(1);
  let r = 0;
  do {
    crypto.getRandomValues(buf);
    r = buf[0];
  } while (r >= limit);
  return r % maxExclusive;
}

/** Shuffle a string's characters with an unbiased Fisher–Yates shuffle. */
export function shuffleString(input: string): string {
  const arr = Array.from(input);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

/**
 * Pick `n` characters from `charset` (with replacement), each index drawn
 * uniformly and without modulo bias. Throws if the charset is empty.
 */
export function pickN(charset: string, n: number): string {
  if (!charset) throw new Error("pickN requires a non-empty charset");
  let out = "";
  for (let i = 0; i < n; i++) {
    out += charset[secureRandomInt(charset.length)];
  }
  return out;
}
