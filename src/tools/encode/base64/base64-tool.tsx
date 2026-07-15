import { useEffect, useMemo, useRef, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open, save } from "@tauri-apps/plugin-dialog";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";
import {
  DirectionToggle,
  type Direction,
} from "@/tools/encode/direction-toggle";
import { transformBase64 } from "./base64";
import {
  base64DecodeFileToString,
  base64DecodeStringToFile,
  base64EncodeFileToString,
  base64EncodeStringToFile,
  base64TransformFile,
} from "@/lib/invoke";

type Side = "text" | "file";

/** Basename of a path, without pulling in `@tauri-apps/api/path` for one split. */
function basename(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

/** Suggested output filename for File↔File: append `.b64` on encode, strip it on decode. */
function suggestOutputName(
  inputPath: string,
  direction: Direction,
): string | undefined {
  const base = basename(inputPath);
  if (direction === "encode") return `${base}.b64`;
  return base.endsWith(".b64") ? base.slice(0, -4) : undefined;
}

function TypeToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Side;
  onChange: (value: Side) => void;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="inline-flex w-fit rounded-md border border-input p-0.5">
        {(["text", "file"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            aria-pressed={value === s}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors",
              value === s
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </label>
  );
}

/**
 * Base64 encoder/decoder with a unified 3-toggle model — Direction, Input type,
 * Output type — covering all 8 combinations. Text↔Text stays live/instant; any
 * combo touching a file is dialog-triggered. A file dropped onto the input pane
 * always switches Input type to File and loads it.
 */
export default function Base64Tool() {
  const [direction, setDirection] = useState<Direction>("encode");
  const [inputType, setInputType] = useState<Side>("text");
  const [outputType, setOutputType] = useState<Side>("text");

  const [textInput, setTextInput] = useState("");
  const [inputPath, setInputPath] = useState<string | null>(null);

  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const inputPaneRef = useRef<HTMLDivElement>(null);

  // Text↔Text: live, derive output/error directly. File-involved combos use state.
  const live = useMemo(
    () => transformBase64(textInput, direction),
    [textInput, direction],
  );
  const isLiveText = inputType === "text" && outputType === "text";
  const displayOutput = isLiveText ? live.output : output;
  const displayError = isLiveText ? live.error : error;

  function resetOutput() {
    setOutput("");
    setError(null);
    setSavedPath(null);
  }

  function onDirectionChange(next: Direction) {
    setDirection(next);
    if (!isLiveText) resetOutput();
  }
  function onInputTypeChange(next: Side) {
    setInputType(next);
    resetOutput();
  }
  function onOutputTypeChange(next: Side) {
    setOutputType(next);
    resetOutput();
  }

  // File input → Text output: auto-invoke as soon as a file is loaded, and
  // re-invoke when direction flips while a file is already loaded.
  useEffect(() => {
    if (inputType !== "file" || outputType !== "text" || !inputPath) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const result =
      direction === "encode"
        ? base64EncodeFileToString(inputPath)
        : base64DecodeFileToString(inputPath);
    result
      .then((value) => {
        if (!cancelled) setOutput(value);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [inputPath, direction, inputType, outputType]);

  // Drag-and-drop: hit-test against the input pane's rect; drops elsewhere are a no-op.
  useEffect(() => {
    const unlistenPromise = getCurrentWebview().onDragDropEvent((event) => {
      const rect = inputPaneRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pos =
        "position" in event.payload ? event.payload.position : undefined;
      const inside =
        !!pos &&
        pos.x >= rect.left &&
        pos.x <= rect.right &&
        pos.y >= rect.top &&
        pos.y <= rect.bottom;

      if (event.payload.type === "drop") {
        setDragOver(false);
        if (!inside) return;
        const paths = event.payload.paths;
        if (paths.length > 1) {
          setError("Only one file at a time — drop a single file.");
          return;
        }
        setInputType("file");
        setInputPath(paths[0]);
        setOutput("");
        setError(null);
        setSavedPath(null);
      } else if (event.payload.type === "over") {
        setDragOver(inside);
      } else {
        setDragOver(false);
      }
    });
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  // Whether the current combo needs a Save As… button (any File output).
  const isSaveCombo = outputType === "file";
  const canSave =
    !loading &&
    (inputType === "file" ? !!inputPath : textInput.trim().length > 0);

  /** Default filename for the Save As dialog, per combo. */
  function defaultSaveName(): string | undefined {
    if (inputType === "file" && inputPath)
      return suggestOutputName(inputPath, direction);
    return direction === "encode" ? "encoded.b64" : "decoded.bin";
  }

  async function onChooseFile() {
    const path = await open({ multiple: false });
    if (!path || Array.isArray(path)) return;
    setInputType("file");
    setInputPath(path);
    resetOutput();
  }

  async function onSaveAs() {
    const outputPath = await save(
      defaultSaveName() ? { defaultPath: defaultSaveName() } : undefined,
    );
    if (!outputPath) return;
    setLoading(true);
    setError(null);
    setSavedPath(null);
    try {
      if (inputType === "file") {
        if (!inputPath) return;
        await base64TransformFile(inputPath, outputPath, direction);
      } else if (direction === "encode") {
        await base64EncodeStringToFile(textInput, outputPath);
      } else {
        await base64DecodeStringToFile(textInput, outputPath);
      }
      setSavedPath(outputPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const inputPlaceholder =
    direction === "encode" ? "Text to encode…" : "Base64 to decode…";
  const outputPlaceholder =
    direction === "encode" ? "Base64 output…" : "Decoded text…";

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <DirectionToggle
          direction={direction}
          onDirectionChange={onDirectionChange}
        />
        <TypeToggle
          label="In"
          value={inputType}
          onChange={onInputTypeChange}
        />
        <TypeToggle
          label="Out"
          value={outputType}
          onChange={onOutputTypeChange}
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">
        {/* Input pane — owns the drop hit-test ref and hover highlight. */}
        <div className="flex min-h-0 flex-col gap-2">
          <div className="flex h-8 items-center justify-between px-1">
            <span className="text-xs font-bold font-display uppercase tracking-widest text-muted-foreground/80">
              Input
            </span>
          </div>
          <div
            ref={inputPaneRef}
            className={cn(
              "relative flex min-h-0 flex-1 flex-col rounded-xl border transition-colors",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border/50 bg-background/20",
            )}
          >
            {inputType === "text" ? (
              <Textarea
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value);
                  setSavedPath(null);
                  setError(null);
                }}
                placeholder={inputPlaceholder}
                spellCheck={false}
                className="h-full min-h-[40vh] flex-1 resize-none border-transparent bg-transparent p-4 font-mono text-sm leading-relaxed"
              />
            ) : (
              <div className="flex flex-wrap items-center gap-3 p-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onChooseFile}
                  disabled={loading}
                >
                  Choose File
                </Button>
                {inputPath && (
                  <span className="font-mono text-sm text-muted-foreground">
                    {basename(inputPath)}
                  </span>
                )}
              </div>
            )}
            {dragOver && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl border-2 border-dashed border-primary/60 bg-primary/5 font-mono text-sm text-primary">
                Drop file to load
              </div>
            )}
          </div>
        </div>

        {/* Output pane — text result/error, or a Save As… flow. */}
        <div className="flex min-h-0 flex-col gap-2">
          <div className="flex h-8 items-center justify-between px-1">
            <span className="text-xs font-bold font-display uppercase tracking-widest text-muted-foreground/80">
              Output
            </span>
            {outputType === "text" && (
              <CopyButton
                text={displayError ? "" : displayOutput}
                disabled={!!displayError || !displayOutput}
              />
            )}
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            {isSaveCombo ? (
              <div className="flex flex-col gap-3 p-1">
                <Button
                  size="sm"
                  onClick={onSaveAs}
                  disabled={!canSave}
                >
                  {loading ? "Processing…" : "Save As…"}
                </Button>
                {displayError ? (
                  <p
                    role="alert"
                    className="overflow-auto rounded-xl border border-destructive/25 bg-destructive/5 p-4 font-mono text-sm text-destructive leading-relaxed dark:bg-destructive/10"
                  >
                    {displayError}
                  </p>
                ) : savedPath ? (
                  <p className="font-mono text-sm text-muted-foreground">
                    Saved to {savedPath}
                  </p>
                ) : null}
              </div>
            ) : displayError ? (
              <p
                role="alert"
                className="h-full min-h-[40vh] flex-1 overflow-auto rounded-xl border border-destructive/25 bg-destructive/5 p-4 font-mono text-sm text-destructive leading-relaxed dark:bg-destructive/10"
              >
                {displayError}
              </p>
            ) : (
              <Textarea
                readOnly
                value={displayOutput}
                placeholder={loading ? "Processing…" : outputPlaceholder}
                spellCheck={false}
                className="h-full min-h-[40vh] flex-1 resize-none border-border/50 bg-background/20 p-4 font-mono text-sm leading-relaxed"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
