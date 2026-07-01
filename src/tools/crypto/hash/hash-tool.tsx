import { useEffect, useState } from "react";

import { ToolIoPanels } from "@/components/tool-io-panels";
import { hash, HASH_ALGORITHMS, type HashAlgorithm } from "@/lib/hash";

/** Hash tool: SHA-* via WebCrypto, MD5 via spark-md5 — no Rust invocation. */
export default function HashTool() {
  const [input, setInput] = useState("");
  const [algo, setAlgo] = useState<HashAlgorithm>("sha256");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Empty input hashes to a real digest (e.g. SHA-256 of ""), but showing an
    // empty output pane until the user types reads as cleaner UX.
    if (!input) {
      setOutput("");
      setError(null);
      return;
    }
    let cancelled = false;
    hash(algo, input)
      .then((hex) => {
        if (!cancelled) {
          setOutput(hex);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setOutput("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [input, algo]);

  return (
    <ToolIoPanels
      input={input}
      onInputChange={setInput}
      output={output}
      error={error}
      inputPlaceholder="Text to hash…"
      outputPlaceholder="Hex digest…"
      controls={
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Algorithm
          <select
            value={algo}
            onChange={(e) => setAlgo(e.target.value as HashAlgorithm)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {HASH_ALGORITHMS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
      }
    />
  );
}
