import { describe, it, expect } from "vitest";

import { generatePassword, PASSWORD_MIN, PASSWORD_MAX } from "./password";

const ALL = {
  length: 16,
  uppercase: true,
  lowercase: true,
  digits: true,
  symbols: true,
};

function satisfiesClasses(pw: string, opts: typeof ALL) {
  if (opts.uppercase && !/[A-Z]/.test(pw)) return false;
  if (opts.lowercase && !/[a-z]/.test(pw)) return false;
  if (opts.digits && !/[0-9]/.test(pw)) return false;
  if (opts.symbols && !/[!@#$%^&*\-_=+?]/.test(pw)) return false;
  return true;
}

describe("generatePassword", () => {
  it("respects the requested length", () => {
    expect(generatePassword({ ...ALL, length: 20 })).toHaveLength(20);
  });

  it("clamps length into [PASSWORD_MIN, PASSWORD_MAX]", () => {
    expect(generatePassword({ ...ALL, length: 2 })).toHaveLength(PASSWORD_MIN);
    expect(generatePassword({ ...ALL, length: 9999 })).toHaveLength(
      PASSWORD_MAX,
    );
  });

  it("guarantees every enabled class on 1000 generations", () => {
    for (let i = 0; i < 1000; i++) {
      const pw = generatePassword(ALL);
      expect(satisfiesClasses(pw, ALL)).toBe(true);
    }
  });

  it("returns empty string when no class is enabled", () => {
    expect(
      generatePassword({
        length: 16,
        uppercase: false,
        lowercase: false,
        digits: false,
        symbols: false,
      }),
    ).toBe("");
  });

  it("stays within the selected charset", () => {
    const pw = generatePassword({ ...ALL, length: 64 });
    for (const ch of pw) {
      expect(/[A-Za-z0-9!@#$%^&*\-_=+?]/.test(ch)).toBe(true);
    }
  });
});
