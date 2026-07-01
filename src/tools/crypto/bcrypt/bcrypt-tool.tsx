import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";
import { bcryptHash, bcryptVerify } from "@/lib/invoke";

type Mode = "hash" | "verify";

const COST_MIN = 4;
const COST_MAX = 14;
const COST_DEFAULT = 12;

/** Clamp a typed cost value into the supported 4–14 range. */
function clampCost(raw: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return COST_DEFAULT;
  return Math.min(COST_MAX, Math.max(COST_MIN, Math.round(n)));
}

/** bcrypt tool backed by the Rust command. Hash runs off-thread so the UI stays responsive. */
export default function BcryptTool() {
  const [mode, setMode] = useState<Mode>("hash");
  const [password, setPassword] = useState("");
  const [hashValue, setHashValue] = useState("");
  const [cost, setCost] = useState(COST_DEFAULT);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setOutput("");
    setError(null);
  }

  async function onHash() {
    if (!password) return;
    reset();
    setBusy(true);
    try {
      const result = await bcryptHash(password, cost);
      setOutput(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onVerify() {
    if (!password || !hashValue) return;
    reset();
    setBusy(true);
    try {
      const ok = await bcryptVerify(password, hashValue);
      setOutput(ok ? "✓ match" : "✗ no match");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ModeToggle mode={mode} onModeChange={(m) => { setMode(m); reset(); }} />

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Password</span>
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password…"
          type="text"
          spellCheck={false}
        />
      </label>

      {mode === "hash" ? (
        <div className="flex items-center gap-3">
          <label className="w-20 text-xs text-muted-foreground">Cost</label>
          <input
            type="range"
            min={COST_MIN}
            max={COST_MAX}
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
            className="flex-1"
            disabled={busy}
          />
          <Input
            type="number"
            min={COST_MIN}
            max={COST_MAX}
            value={cost}
            onChange={(e) => setCost(clampCost(e.target.value))}
            className="h-8 w-20"
            disabled={busy}
          />
        </div>
      ) : (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hash</span>
          <Textarea
            value={hashValue}
            onChange={(e) => setHashValue(e.target.value)}
            placeholder="$2b$…"
            spellCheck={false}
            className="min-h-[6rem] resize-none font-mono text-sm"
          />
        </label>
      )}

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={mode === "hash" ? onHash : onVerify} disabled={busy || !password || (mode === "verify" && !hashValue)}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {mode === "hash" ? "Hash" : "Verify"}
        </Button>
        {output && !error && mode === "hash" && <CopyButton text={output} />}
      </div>

      {error ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 font-mono text-sm text-destructive">
          {error}
        </p>
      ) : output ? (
        mode === "hash" ? (
          <Input readOnly value={output} spellCheck={false} className="font-mono text-sm" />
        ) : (
          <p className="font-mono text-sm">{output}</p>
        )
      ) : null}
    </div>
  );
}

function ModeToggle({ mode, onModeChange }: { mode: Mode; onModeChange: (m: Mode) => void }) {
  const options: { value: Mode; label: string }[] = [
    { value: "hash", label: "Hash" },
    { value: "verify", label: "Verify" },
  ];
  return (
    <div className="inline-flex w-fit rounded-md border p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onModeChange(o.value)}
          aria-pressed={mode === o.value}
          className={cn(
            "rounded px-3 py-1 text-xs font-medium transition-colors",
            mode === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
