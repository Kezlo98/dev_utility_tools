import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";
import { generatePassword, CHAR_CLASSES, PASSWORD_MIN, PASSWORD_MAX } from "./password";

type ClassKey = (typeof CHAR_CLASSES)[number]["key"];

/**
 * Password generator backed by Web Crypto (see `src/lib/random.ts`). Output is
 * produced on click; class toggles and a length slider drive generation.
 */
export default function PasswordTool() {
  const [length, setLength] = useState(16);
  const [enabled, setEnabled] = useState<Record<ClassKey, boolean>>({
    lowercase: true,
    uppercase: true,
    digits: true,
    symbols: false,
  });
  const [output, setOutput] = useState("");

  const noneEnabled = !Object.values(enabled).some(Boolean);

  function toggle(key: ClassKey) {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Input
          readOnly
          value={output}
          placeholder="Click Generate…"
          spellCheck={false}
          className="font-mono text-base"
        />
        {output && <CopyButton text={output} />}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          onClick={() =>
            setOutput(generatePassword({ length, uppercase: enabled.uppercase, lowercase: enabled.lowercase, digits: enabled.digits, symbols: enabled.symbols }))
          }
          disabled={noneEnabled}
        >
          Generate
        </Button>
        {noneEnabled && <span className="text-xs text-destructive">Enable at least one class.</span>}
      </div>

      <div className="flex items-center gap-3">
        <label className="w-20 text-xs text-muted-foreground">Length</label>
        <input
          type="range"
          min={PASSWORD_MIN}
          max={PASSWORD_MAX}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="flex-1"
        />
        <Input
          type="number"
          min={PASSWORD_MIN}
          max={PASSWORD_MAX}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="h-8 w-20"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {CHAR_CLASSES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => toggle(c.key)}
            aria-pressed={enabled[c.key]}
            className={cn(
              "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
              enabled[c.key]
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input text-muted-foreground hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
