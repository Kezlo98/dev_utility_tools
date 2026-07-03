import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";
import {
  jwtDecode,
  jwtVerify,
  JWT_ALGORITHMS,
  type JwtAlgorithm,
  type JwtParts,
} from "@/lib/invoke";

/** JWT decode + verify tool. Decode needs no secret; verify checks HS* signatures in Rust. */
export default function JwtTool() {
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");
  const [algorithm, setAlgorithm] = useState<JwtAlgorithm>("HS256");
  const [result, setResult] = useState<JwtParts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "decode" | "verify">(null);

  function reset() {
    setResult(null);
    setError(null);
  }

  async function run(kind: "decode" | "verify") {
    if (!token) return;
    reset();
    setBusy(kind);
    try {
      const parts =
        kind === "decode"
          ? await jwtDecode(token)
          : await jwtVerify(token, secret, algorithm);
      setResult(parts);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const output = result ? JSON.stringify(result, null, 2) : "";

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Token
        </span>
        <Textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="eyJhbGciOi…"
          spellCheck={false}
          className="min-h-[7rem] resize-none font-mono text-sm"
        />
      </label>

      <div className="flex flex-wrap items-end gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => run("decode")}
          disabled={!token || !!busy}
        >
          {busy === "decode" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Decode
        </Button>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Secret
          </span>
          <Input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Shared secret…"
            spellCheck={false}
            className="h-9 w-56 font-mono text-sm"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Algorithm
          </span>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as JwtAlgorithm)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {JWT_ALGORITHMS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <Button
          size="sm"
          onClick={() => run("verify")}
          disabled={!token || !!busy}
        >
          {busy === "verify" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Verify
        </Button>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 p-3 font-mono text-sm text-destructive"
        >
          {error}
        </p>
      ) : result ? (
        <div className="flex min-h-0 flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Header + Claims
            </span>
            <CopyButton text={output} />
          </div>
          <Textarea
            readOnly
            value={output}
            spellCheck={false}
            className="min-h-[12rem] resize-none font-mono text-sm"
          />
        </div>
      ) : null}
    </div>
  );
}
