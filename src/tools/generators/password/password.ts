import { pickN, secureRandomInt, shuffleString } from "@/lib/random";

export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  digits: boolean;
  symbols: boolean;
}

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*-_=+?";

/** Named character classes, in a stable display order. */
export const CHAR_CLASSES = [
  { key: "lowercase", label: "Lowercase", charset: LOWER },
  { key: "uppercase", label: "Uppercase", charset: UPPER },
  { key: "digits", label: "Digits", charset: DIGITS },
  { key: "symbols", label: "Symbols", charset: SYMBOLS },
] as const;

function clampLength(length: number): number {
  return Math.max(
    PASSWORD_MIN,
    Math.min(PASSWORD_MAX, Math.trunc(length) || PASSWORD_MIN),
  );
}

/**
 * Generate a cryptographically secure password. Builds the union charset from
 * the enabled classes, guarantees at least one character from each enabled
 * class (post-hoc substitution via required picks), fills the rest uniformly,
 * then shuffles so the guaranteed chars aren't always leading. Returns "" when
 * no class is enabled.
 */
export function generatePassword(opts: PasswordOptions): string {
  const classes = CHAR_CLASSES.filter((c) => opts[c.key]);
  if (classes.length === 0) return "";

  const length = clampLength(opts.length);
  const charset = classes.map((c) => c.charset).join("");

  // One unbiased char from every enabled class guarantees class coverage.
  const required = classes
    .map((c) => c.charset[secureRandomInt(c.charset.length)])
    .join("");
  const remaining = pickN(charset, Math.max(0, length - required.length));
  return shuffleString(required + remaining);
}
