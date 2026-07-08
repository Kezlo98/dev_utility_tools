import { useEffect, useState } from "react";

import {
  computeUpdateState,
  fetchReleases,
  getCurrentVersion,
  type UpdateState,
} from "@/lib/updates";
import { useAppStore } from "@/store/app-store";

const NO_UPDATE: UpdateState = {
  latest: null,
  newerReleases: [],
  hasUpdate: false,
};

/** Poll interval: check once per hour to stay under the anon rate limit (60/hr). */
const POLL_INTERVAL_MS = 3_600_000;

/**
 * Run the update check on mount and every hour, returning the current
 * {@link UpdateState}. Reads `ignoredVersion` from the store so an ignored
 * version stays suppressed until a strictly higher release ships.
 *
 * The fetch is fully guarded — a failed or in-flight check resolves to the
 * no-update state and never rejects into the render tree. The interval is
 * cleared on unmount so HMR / remounts don't stack duplicate timers.
 */
export function useUpdateCheck(): UpdateState {
  const [state, setState] = useState<UpdateState>(NO_UPDATE);
  const ignoredVersion = useAppStore((s) => s.ignoredVersion);

  useEffect(() => {
    let cancelled = false;

    async function check(): Promise<void> {
      try {
        const [current, releases] = await Promise.all([
          getCurrentVersion(),
          fetchReleases(),
        ]);
        if (cancelled) return;
        setState(computeUpdateState(current, releases, ignoredVersion));
      } catch {
        if (!cancelled) setState(NO_UPDATE);
      }
    }

    void check();
    const id = window.setInterval(() => void check(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [ignoredVersion]);

  return state;
}
