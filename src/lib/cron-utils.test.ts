import { describe, it, expect } from "vitest";

import {
  describe as describeCron,
  isValidCron,
  nextRuns,
  parseCrontab,
  normalizeExpression,
} from "./cron-utils";

describe("cron-utils.describe", () => {
  it("describes a Monday 9am expression", () => {
    expect(describeCron("0 9 * * 1")).toBe("At 09:00 AM, only on Monday");
  });

  it("describes an every-15-minutes expression", () => {
    expect(describeCron("*/15 * * * *")).toContain("Every 15 minutes");
  });

  it("returns an error string for invalid fields", () => {
    expect(describeCron("a b c d e")).not.toBe("At 09:00 AM, only on Monday.");
    // cronstrue surfaces a non-empty error rather than throwing past the guard.
    expect(describeCron("a b c d e").length).toBeGreaterThan(0);
  });
});

describe("cron-utils.isValidCron", () => {
  it("accepts a valid expression", () => {
    expect(isValidCron("0 9 * * 1")).toBe(true);
  });

  it("rejects garbage", () => {
    expect(isValidCron("a b c d e")).toBe(false);
  });
});

describe("cron-utils.nextRuns", () => {
  it("returns the requested number of runs", () => {
    const from = new Date("2026-07-01T00:00:00Z");
    const runs = nextRuns("*/15 * * * *", 10, "UTC", from);
    expect(runs).toHaveLength(10);
  });

  it("spaces every-15-minute runs 15 minutes apart", () => {
    const from = new Date("2026-07-01T00:00:00Z");
    const runs = nextRuns("*/15 * * * *", 4, "UTC", from);
    // cron-parser's first .next() is strictly after currentDate (00:15).
    const gaps = runs
      .map((r) => r.millis)
      .map((m, i, arr) => (i === 0 ? m - from.getTime() : m - arr[i - 1]));
    expect(gaps).toEqual([15, 15, 15, 15].map((m) => m * 60 * 1000));
  });

  it("lands all Monday runs on a Monday", () => {
    const from = new Date("2026-07-01T00:00:00Z");
    const runs = nextRuns("0 9 * * 1", 5, "UTC", from);
    expect(runs).toHaveLength(5);
    for (const r of runs) {
      expect(new Date(r.millis).getUTCDay()).toBe(1); // Monday
      expect(new Date(r.millis).getUTCHours()).toBe(9);
    }
  });

  it("returns an empty array for an invalid expression", () => {
    expect(nextRuns("a b c d e", 10, "UTC")).toEqual([]);
  });
});

describe("cron-utils.parseCrontab", () => {
  it("skips blank and comment lines", () => {
    const rows = parseCrontab(
      "# header comment\n\n   \n0 9 * * 1 /usr/bin/backup\n",
      "UTC",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].expr).toBe("0 9 * * 1");
    expect(rows[0].command).toBe("/usr/bin/backup");
    expect(rows[0].valid).toBe(true);
    expect(rows[0].line).toBe(4);
  });

  it("flags an invalid row without throwing", () => {
    const rows = parseCrontab("a b c d e broken", "UTC");
    expect(rows).toHaveLength(1);
    expect(rows[0].valid).toBe(false);
    expect(rows[0].error).toBeTruthy();
    expect(rows[0].command).toBe("broken");
  });

  it("splits command with spaces correctly", () => {
    const rows = parseCrontab("*/5 * * * * echo hello world", "UTC");
    expect(rows[0].expr).toBe("*/5 * * * *");
    expect(rows[0].command).toBe("echo hello world");
  });

  it("flags a 5-field row with no command as invalid", () => {
    const rows = parseCrontab("0 9 * * 1", "UTC");
    expect(rows).toHaveLength(1);
    expect(rows[0].valid).toBe(false);
    expect(rows[0].error).toBeTruthy();
  });
});

describe("cron-utils.normalizeExpression", () => {
  it("passes 5-field input through unchanged", () => {
    const n = normalizeExpression("0 9 * * 1", "5");
    expect(n.fiveField).toBe("0 9 * * 1");
    expect(n.error).toBeUndefined();
    expect(n.seconds).toBeUndefined();
  });

  it("strips the leading seconds field in 6-field mode", () => {
    const n = normalizeExpression("30 0 9 * * 1", "6");
    expect(n.fiveField).toBe("0 9 * * 1");
    expect(n.seconds).toBe("30");
    expect(n.error).toBeUndefined();
  });

  it("rejects non-6-token input in 6-field mode instead of misparsing", () => {
    // A 5-field value must NOT silently parse as 5-field in 6-field mode.
    const n = normalizeExpression("0 9 * * 1", "6");
    expect(n.fiveField).toBe("");
    expect(n.error).toBeTruthy();
  });
});
