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
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleGenerate} disabled={busy} className="h-10 px-5 rounded-lg shadow-sm">
          {busy ? "Generating…" : "Generate"}
        </Button>
        {dataUrl && (
          <a href={dataUrl} download="devkit-qr.png">
            <Button variant="outline" size="sm" className="bg-background/30 border-border/50 hover:bg-accent/80 shrink-0 h-10 px-4">
              <Download className="mr-2" /> Download PNG
            </Button>
          </a>
        )}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Text or URL to encode…"
          spellCheck={false}
          className="min-h-[40vh] flex-1 resize-none font-mono text-sm rounded-xl border-border/50 bg-background/20 backdrop-blur-[2px] p-4 resize-none leading-relaxed focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:ring-offset-0 focus-visible:border-primary/40"
        />
        <div className="flex min-h-[40vh] flex-1 items-center justify-center rounded-xl border border-border/50 bg-background/20 backdrop-blur-[2px] p-6 shadow-inner">
          {error ? (
            <p role="alert" className="text-center text-sm text-destructive">
              {error}
            </p>
          ) : dataUrl ? (
            <div className="p-4 bg-white rounded-lg shadow-md border border-border/20">
              <img
                src={dataUrl}
                alt="Generated QR code"
                className="max-h-full max-w-full rounded-sm"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              QR preview appears here…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
