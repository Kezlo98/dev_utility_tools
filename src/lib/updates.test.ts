import { describe, it, expect } from "vitest";

import {
  compareSemver,
  computeUpdateState,
  parseVersion,
  type ReleaseInfo,
} from "./updates";

/** Build a minimal release with only the version that matters to the test. */
function release(version: string): ReleaseInfo {
  return { version, name: version, body: "", url: `https://x/${version}` };
}

describe("updates.parseVersion", () => {
  it("parses a bare X.Y.Z tag", () => {
    expect(parseVersion("1.2.3")).toEqual([1, 2, 3]);
  });

  it("strips a leading v", () => {
    expect(parseVersion("v0.10.0")).toEqual([0, 10, 0]);
  });

  it("returns null for malformed tags", () => {
    expect(parseVersion("1.2")).toBeNull();
    expect(parseVersion("v1.2.3-beta")).toBeNull();
    expect(parseVersion("latest")).toBeNull();
    expect(parseVersion("")).toBeNull();
  });
});

describe("updates.compareSemver", () => {
  it("orders versions numerically, not lexically", () => {
    expect(compareSemver("v0.1.0", "v0.2.0")).toBe(-1);
    expect(compareSemver("v0.2.0", "v0.10.0")).toBe(-1);
    expect(compareSemver("v0.10.0", "v0.2.0")).toBe(1);
  });

  it("returns 0 for equal versions", () => {
    expect(compareSemver("1.0.0", "v1.0.0")).toBe(0);
  });

  it("treats a malformed tag as not-newer (returns 0)", () => {
    expect(compareSemver("garbage", "1.0.0")).toBe(0);
    expect(compareSemver("2.0.0", "garbage")).toBe(0);
  });
});

describe("updates.computeUpdateState", () => {
  it("flags an update when a strictly-higher release exists", () => {
    const state = computeUpdateState(
      "0.1.0",
      [release("v0.2.0"), release("v0.1.0")],
      null,
    );
    expect(state.hasUpdate).toBe(true);
    expect(state.latest?.version).toBe("v0.2.0");
  });

  it("returns every newer release, newest-first", () => {
    const state = computeUpdateState(
      "0.1.0",
      [release("v0.2.0"), release("v0.4.0"), release("v0.3.0"), release("v0.1.0")],
      null,
    );
    expect(state.newerReleases.map((r) => r.version)).toEqual([
      "v0.4.0",
      "v0.3.0",
      "v0.2.0",
    ]);
    expect(state.latest?.version).toBe("v0.4.0");
  });

  it("reports no update when the newest release equals current", () => {
    const state = computeUpdateState("0.2.0", [release("v0.2.0")], null);
    expect(state.hasUpdate).toBe(false);
    expect(state.latest).toBeNull();
    expect(state.newerReleases).toEqual([]);
  });

  it("reports no update when every release is older", () => {
    const state = computeUpdateState(
      "1.0.0",
      [release("v0.9.0"), release("v0.1.0")],
      null,
    );
    expect(state.hasUpdate).toBe(false);
    expect(state.latest).toBeNull();
  });

  it("suppresses hasUpdate when the newest release equals ignoredVersion", () => {
    const state = computeUpdateState("0.1.0", [release("v0.2.0")], "v0.2.0");
    expect(state.hasUpdate).toBe(false);
    // The release is still surfaced in newerReleases; only the flag is suppressed.
    expect(state.latest?.version).toBe("v0.2.0");
  });

  it("re-surfaces when a release strictly higher than ignoredVersion ships", () => {
    const state = computeUpdateState(
      "0.1.0",
      [release("v0.3.0"), release("v0.2.0")],
      "v0.2.0",
    );
    expect(state.hasUpdate).toBe(true);
    expect(state.latest?.version).toBe("v0.3.0");
  });

  it("ignores releases whose tags would not parse (defensive)", () => {
    const state = computeUpdateState(
      "0.1.0",
      [release("v0.2.0"), release("nightly")],
      null,
    );
    expect(state.newerReleases.map((r) => r.version)).toEqual(["v0.2.0"]);
  });

  it("treats a malformed ignoredVersion as not-ignored (self-healing)", () => {
    // A corrupt persisted value must not permanently suppress notifications:
    // compareSemver returns 0 for unparseable input, so without the guard
    // hasUpdate would lock to false forever.
    const state = computeUpdateState("0.1.0", [release("v0.2.0")], "garbage");
    expect(state.hasUpdate).toBe(true);
    expect(state.latest?.version).toBe("v0.2.0");
  });
});
