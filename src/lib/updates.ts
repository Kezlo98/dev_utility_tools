import { getVersion } from "@tauri-apps/api/app";

/**
 * Update detection against the public GitHub Releases API. All logic is
 * frontend-only: read the running version, fetch published releases, compare
 * `vX.Y.Z` tags with a local semver comparator, and compute whether a newer,
 * non-ignored release exists.
 *
 * Every network / parse failure is swallowed into a no-update result — the
 * detection path never throws into the render tree.
 */

const RELEASES_URL =
  "https://api.github.com/repos/Kezlo98/dev_utility_tools/releases";

/** A single published release, normalized from the GitHub API shape. */
export interface ReleaseInfo {
  version: string;
  name: string;
  body: string;
  url: string;
}

/** Computed update state consumed by the notifier UI. */
export interface UpdateState {
  latest: ReleaseInfo | null;
  newerReleases: ReleaseInfo[];
  hasUpdate: boolean;
}

/** The running app version at runtime (e.g. `"0.1.0"`), never hardcoded. */
export function getCurrentVersion(): Promise<string> {
  return getVersion();
}

/**
 * Parse a `vX.Y.Z` (or `X.Y.Z`) tag into a numeric tuple. Returns `null` for
 * anything malformed so callers can fail silent — an unparseable tag never
 * counts as an update.
 */
export function parseVersion(tag: string): [number, number, number] | null {
  const stripped = tag.startsWith("v") ? tag.slice(1) : tag;
  if (!/^\d+\.\d+\.\d+$/.test(stripped)) return null;
  const [major, minor, patch] = stripped.split(".").map(Number);
  return [major, minor, patch];
}

/**
 * Compare two version tags. Returns `-1 | 0 | 1` when both parse; if either
 * fails to parse, returns `0` so the invalid side is never ranked as newer.
 */
export function compareSemver(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (pa === null || pb === null) return 0;
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

/**
 * Fetch published releases from the public GitHub API. Prereleases and any
 * release whose tag fails `parseVersion` are skipped. Returns `[]` on network
 * error, non-200, or parse failure — never throws.
 */
export async function fetchReleases(): Promise<ReleaseInfo[]> {
  try {
    const res = await fetch(RELEASES_URL, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return [];
    const raw = (await res.json()) as Array<{
      tag_name: string;
      name: string | null;
      body: string | null;
      html_url: string;
      prerelease: boolean;
    }>;
    return raw
      .filter((r) => !r.prerelease && parseVersion(r.tag_name) !== null)
      .map((r) => ({
        version: r.tag_name,
        name: r.name ?? r.tag_name,
        body: r.body ?? "",
        url: r.html_url,
      }));
  } catch {
    return [];
  }
}

/**
 * Pure update-state computation (no fetch, no clock) so it unit-tests cleanly.
 * Filters releases strictly newer than `current`, sorts newest-first, and
 * suppresses `hasUpdate` when the newest release equals `ignoredVersion`.
 */
export function computeUpdateState(
  current: string,
  releases: ReleaseInfo[],
  ignoredVersion: string | null,
): UpdateState {
  const newerReleases = releases
    .filter((r) => compareSemver(r.version, current) > 0)
    .sort((a, b) => compareSemver(b.version, a.version));

  const latest = newerReleases[0] ?? null;
  // A malformed persisted `ignoredVersion` (manual edit / corrupt storage) is
  // treated as "nothing ignored" so a bad value can't permanently suppress
  // notifications — `compareSemver` returns 0 for unparseable input, which
  // would otherwise lock `hasUpdate` to false forever.
  const ignored =
    ignoredVersion !== null && parseVersion(ignoredVersion) !== null
      ? ignoredVersion
      : null;
  const hasUpdate =
    latest !== null &&
    (ignored === null || compareSemver(latest.version, ignored) > 0);

  return { latest, newerReleases, hasUpdate };
}
