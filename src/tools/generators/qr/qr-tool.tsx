import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { renderQr } from "./qr";

/**
 * QR code generator. Produces an image on click; the Download button uses an
 * anchor with `download` so no clipboard/blob dance is needed.
 */
export default function QrTool() {
  const [input, setInput] = useState("");
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleGenerate() {
    setBusy(true);
    const res = await renderQr(input);
    setDataUrl(res.dataUrl);
    setError(res.error);
    setBusy(false);
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleGenerate} disabled={busy}>
          {busy ? "Generating…" : "Generate"}
        </Button>
        {dataUrl && (
          <a href={dataUrl} download="devkit-qr.png">
            <Button variant="outline" size="sm">
              <Download /> Download PNG
            </Button>
          </a>
        )}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Text or URL to encode…"
          spellCheck={false}
          className="min-h-[40vh] flex-1 resize-none font-mono text-sm"
        />
        <div className="flex min-h-[40vh] flex-1 items-center justify-center rounded-md border border-input bg-muted/30 p-4">
          {error ? (
            <p role="alert" className="text-center text-sm text-destructive">
              {error}
            </p>
          ) : dataUrl ? (
            <img src={dataUrl} alt="Generated QR code" className="max-h-full max-w-full" />
          ) : (
            <p className="text-sm text-muted-foreground">QR preview appears here…</p>
          )}
        </div>
      </div>
    </div>
  );
}
