import { useEffect, useState } from "react";

import { useAppStore } from "@/store/app-store";
import { setGlobalHotkey as setGlobalHotkeyCmd } from "@/lib/invoke";
import {
  PLATFORM_DEFAULT_HOTKEY,
  isReservedOnWindows,
  keyboardEventToCombo,
} from "@/lib/hotkey";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HotkeySettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Global spotlight hotkey settings dialog. Structurally mirrors
 * `update-modal.tsx`. Shows the current combo (the persisted value or the
 * platform default when `globalHotkey` is null), captures a new combo via
 * keydown, and on Save re-registers through the Rust command. On failure the
 * error is rendered inline and the store is left untouched — the previously
 * working combo keeps triggering the spotlight (guaranteed Rust-side by only
 * swapping after a successful re-register).
 */
export function HotkeySettingsModal({ open, onOpenChange }: HotkeySettingsModalProps) {
  const globalHotkey = useAppStore((s) => s.globalHotkey);
  const setGlobalHotkey = useAppStore((s) => s.setGlobalHotkey);

  const current = globalHotkey ?? PLATFORM_DEFAULT_HOTKEY;
  const isDefault = globalHotkey === null;

  const [recording, setRecording] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset transient state whenever the dialog is opened or closed.
  useEffect(() => {
    if (open) {
      setRecording(false);
      setDraft(null);
      setError(null);
      setSaving(false);
    }
  }, [open]);

  // Capture key combos only while recording. Capturing at the window level with
  // preventDefault stops space from scrolling and stops the dialog from
  // reacting to modifier keystrokes while a combo is being entered.
  useEffect(() => {
    if (!open || !recording) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setRecording(false);
        return;
      }
      const combo = keyboardEventToCombo(e);
      if (combo === null) return; // modifier-only, keep listening
      if (isReservedOnWindows(combo)) {
        setRecording(false);
        setError(
          `"${combo}" is reserved by the Windows window-menu system. Pick a different combo.`,
        );
        return;
      }
      setDraft(combo);
      setError(null);
      setRecording(false);
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, recording]);

  async function handleSave() {
    if (draft === null || saving) return;
    setSaving(true);
    setError(null);
    try {
      await setGlobalHotkeyCmd(draft);
      // Store null when the recorded combo equals the platform default so the
      // "null = use default" invariant is preserved.
      setGlobalHotkey(draft === PLATFORM_DEFAULT_HOTKEY ? null : draft);
      onOpenChange(false);
    } catch (err) {
      // Rust rejected the combo and restored the previous one; leave the store
      // as-is and keep `draft` so the user can edit and retry.
      setError(typeof err === "string" ? err : String(err));
    } finally {
      setSaving(false);
    }
  }

  function startRecording() {
    setError(null);
    setDraft(null);
    setRecording(true);
  }

  function cancelDraft() {
    setDraft(null);
    setError(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Spotlight hotkey</DialogTitle>
          <DialogDescription>
            The global keyboard shortcut that opens the quick-access launcher
            from anywhere — even when the main window is closed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Current</p>
              <p className="truncate text-sm font-medium">
                {current}
                {isDefault && (
                  <span className="ml-2 font-normal text-muted-foreground">
                    (default)
                  </span>
                )}
              </p>
            </div>
            {!recording && (
              <Button variant="outline" size="sm" onClick={startRecording}>
                {draft ? "Record again" : "Change"}
              </Button>
            )}
          </div>

          {recording && (
            <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 px-3 py-3 text-center text-sm">
              Press a key combo (include Ctrl/Alt/Cmd/Option)…{" "}
              <span className="text-muted-foreground">(Esc to cancel)</span>
            </div>
          )}

          {draft && !recording && (
            <div className="rounded-md border px-3 py-2 text-sm">
              New combo:{" "}
              <span className="font-medium text-foreground">{draft}</span>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          {draft && !recording ? (
            <>
              <Button variant="ghost" onClick={cancelDraft} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
