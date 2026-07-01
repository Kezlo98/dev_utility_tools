export interface TimestampView {
  unixSeconds: number;
  unixMillis: number;
  isoUtc: string;
  isoLocal: string;
  weekday: string;
  error: string | null;
}

const EMPTY: TimestampView = {
  unixSeconds: 0,
  unixMillis: 0,
  isoUtc: "",
  isoLocal: "",
  weekday: "",
  error: null,
};

// Values >= 1e11 are milliseconds (~year 5138 in seconds, ~year 1973 in ms).
// This magnitude threshold cleanly distinguishes 10-digit seconds from
// 13-digit ms without relying on brittle digit counting.
const MS_THRESHOLD = 1e11;

function build(unixMillis: number): TimestampView {
  const date = new Date(unixMillis);
  return {
    unixSeconds: Math.floor(unixMillis / 1000),
    unixMillis: Math.floor(unixMillis),
    isoUtc: date.toISOString(),
    isoLocal: date.toLocaleString(),
    weekday: date.toLocaleDateString(undefined, { weekday: "long" }),
    error: null,
  };
}

/**
 * Two-way Unix ↔ ISO 8601 conversion. Numeric input is auto-detected as
 * seconds or milliseconds by magnitude; otherwise the input is parsed as a
 * date string. Invalid input returns a readable error, never throws.
 */
export function toTimestamp(input: string): TimestampView {
  const trimmed = input.trim();
  if (!trimmed) return { ...EMPTY };

  if (/^[+-]?\d+(\.\d+)?$/.test(trimmed)) {
    const num = Number(trimmed);
    const ms = Math.abs(num) >= MS_THRESHOLD ? num : num * 1000;
    return build(ms);
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return build(parsed.getTime());

  return {
    ...EMPTY,
    error: "Enter a Unix timestamp (seconds or ms) or an ISO 8601 date.",
  };
}
