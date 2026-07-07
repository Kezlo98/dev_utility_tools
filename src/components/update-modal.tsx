import { openUrl } from "@tauri-apps/plugin-opener";

import type { UpdateState } from "@/lib/updates";
import { useAppStore } from "@/store/app-store";
import { renderChangelog } from "@/lib/render-changelog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: UpdateState;
}

/**
 * Update dialog: header shows the latest version + release title, the body
 * shows the combined changelog of every newer release (newest-first) inside a
 * scroll box, and the footer offers Update (open the release page) / Ignore
 * (suppress until a strictly higher release ships).
 *
 * Renders nothing when there's no latest release, so the caller can mount it
 * unconditionally and gate visibility purely on `open`.
 */
export function UpdateModal({ open, onOpenChange, state }: UpdateModalProps) {
  const setIgnoredVersion = useAppStore((s) => s.setIgnoredVersion);
  const { latest, newerReleases } = state;

  if (latest === null) return null;

  const handleUpdate = () => {
    // openUrl rejects if the opener capability is missing; swallow so a
    // misconfigured build can't crash the click handler.
    void openUrl(latest.url).catch(() => undefined);
  };

  const handleIgnore = () => {
    setIgnoredVersion(latest.version);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Update available — {latest.version}
          </DialogTitle>
          {latest.name !== latest.version ? (
            <DialogDescription>{latest.name}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">
              A newer version of DevKit is available.
            </DialogDescription>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-3">
          <div className="space-y-5">
            {newerReleases.map((release) => (
              <section key={release.version} className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {release.version}
                  {release.name !== release.version && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      {release.name}
                    </span>
                  )}
                </h3>
                {renderChangelog(release.body)}
              </section>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={handleIgnore}>
            Ignore
          </Button>
          <Button onClick={handleUpdate}>Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
