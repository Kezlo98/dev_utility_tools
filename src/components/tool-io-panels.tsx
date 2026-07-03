import React, {
  type ReactNode,
  useRef,
  useEffect,
  useState,
  useMemo,
} from "react";
import { Search, X } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

interface Props {
  /** Controlled input value (source text the user edits). */
  input: string;
  onInputChange: (value: string) => void;
  /** Transformed result. Ignored when `error` is set. */
  output: string;
  /** When set, the output pane renders this message instead of `output`. */
  error?: string | null;
  inputPlaceholder?: string;
  outputPlaceholder?: string;
  /** Optional toolbar rendered above the two panes (e.g. language dropdown, direction toggle). */
  controls?: ReactNode;
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(
  text: string,
  query: string,
  isBackdrop: boolean = false,
) {
  if (!query) return text;
  const escaped = escapeRegExp(query);
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className={cn(
              "bg-yellow-500/35 rounded px-[1px]",
              isBackdrop ? "text-transparent" : "text-foreground",
            )}
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

const countMatches = (text: string, query: string) => {
  if (!query || !text) return 0;
  const escaped = escapeRegExp(query);
  const matches = text.match(new RegExp(escaped, "gi"));
  return matches ? matches.length : 0;
};

interface SearchableTextareaProps extends React.ComponentPropsWithoutRef<
  typeof Textarea
> {
  searchQuery: string;
}

const SearchableTextarea = React.forwardRef<
  HTMLTextAreaElement,
  SearchableTextareaProps
>(({ searchQuery, className, value, onChange, onScroll, ...props }, ref) => {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = (ref || localRef) as React.RefObject<HTMLTextAreaElement>;

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
      backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    if (onScroll) onScroll(e);
  };

  useEffect(() => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, [value]);

  const text = typeof value === "string" ? value : "";

  return (
    <div className="relative min-h-0 flex-1 flex flex-col h-full">
      {searchQuery && (
        <div
          ref={backdropRef}
          className={cn(
            "absolute inset-0 w-full h-full rounded-xl border border-transparent bg-transparent px-4 py-3.5 font-mono text-sm whitespace-pre-wrap break-words overflow-hidden pointer-events-none text-transparent select-none",
            className,
          )}
          style={{
            lineHeight: "1.5rem",
            scrollbarGutter: "stable",
          }}
        >
          {highlightText(text, searchQuery, true)}
        </div>
      )}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        className={cn(
          "font-mono text-sm rounded-xl border-border/50 bg-background/20 backdrop-blur-[2px] p-4 resize-none leading-relaxed transition-colors duration-150",
          "focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:ring-offset-0 focus-visible:border-primary/40",
          searchQuery && "bg-transparent",
          className,
        )}
        style={{
          lineHeight: "1.5rem",
          scrollbarGutter: "stable",
        }}
        {...props}
      />
    </div>
  );
});
SearchableTextarea.displayName = "SearchableTextarea";

/**
 * Shared side-by-side input/output layout used by every Format & Encode tool.
 * The input pane is editable; the output pane is read-only and shows either the
 * transformed result or a readable error. A copy button sits on the output
 * header with a transient "Copied" confirmation — no global toast needed.
 */
export function ToolIoPanels({
  input,
  onInputChange,
  output,
  error = null,
  inputPlaceholder,
  outputPlaceholder,
  controls,
}: Props) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 50);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery("");
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeSearch();
    }
  };

  const matchCount = useMemo(() => {
    return (
      countMatches(input, searchQuery) +
      countMatches(error ? error : output, searchQuery)
    );
  }, [input, output, error, searchQuery]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-col gap-2 shrink-0">
        {controls && <div className="flex items-center gap-2">{controls}</div>}
        {showSearch && (
          <div className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-1.5 text-sm animate-in fade-in slide-in-from-top-1 duration-150">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Find in panels (Press Esc to close)..."
              className="flex-1 bg-transparent outline-none py-0.5 text-sm text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <span className="text-xs text-muted-foreground select-none shrink-0 font-medium bg-muted px-1.5 py-0.5 rounded border">
                {matchCount} match{matchCount === 1 ? "" : "es"}
              </span>
            )}
            <button
              onClick={closeSearch}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 transition-colors"
              title="Close search (Esc)"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">
        <Pane label="Input">
          <SearchableTextarea
            searchQuery={searchQuery}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={inputPlaceholder}
            spellCheck={false}
            className="h-full min-h-[40vh] flex-1 resize-none font-mono text-sm"
          />
        </Pane>
        <Pane
          label="Output"
          action={
            <CopyButton
              text={error ? "" : output}
              disabled={!!error || !output}
            />
          }
        >
          {error ? (
            <p
              role="alert"
              className="h-full min-h-[40vh] flex-1 overflow-auto rounded-xl border border-destructive/25 bg-destructive/5 dark:bg-destructive/10 p-4 font-mono text-sm text-destructive leading-relaxed"
            >
              {highlightText(error, searchQuery, false)}
            </p>
          ) : (
            <SearchableTextarea
              searchQuery={searchQuery}
              value={output}
              readOnly
              placeholder={outputPlaceholder}
              spellCheck={false}
              className="h-full min-h-[40vh] flex-1 resize-none font-mono text-sm"
            />
          )}
        </Pane>
      </div>
    </div>
  );
}

function Pane({
  label,
  action,
  children,
}: {
  label: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex h-8 items-center justify-between px-1">
        <span className="text-xs font-bold font-display uppercase tracking-widest text-muted-foreground/80">
          {label}
        </span>
        {action}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
