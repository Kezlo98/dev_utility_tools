import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import { copyText } from "@/lib/copy";

interface Props {
  text: string;
  disabled?: boolean;
  /** Smaller label-free variant for tight toolbars. */
  compact?: boolean;
}

/**
 * Copy-to-clipboard button with a transient "Copied" confirmation. Shared by
 * the IO panels and the generator tools so copy feedback stays consistent
 * without a global toast system.
 */
export function CopyButton({ text, disabled = false, compact = false }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label="Copy output"
      title="Copy output"
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
      )}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {!compact && (copied ? "Copied" : "Copy")}
    </button>
  );
}
