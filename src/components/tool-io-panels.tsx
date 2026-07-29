import React, {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  CaseSensitive,
  ChevronDown,
  Regex,
  ReplaceAll,
  Search,
  X,
} from "lucide-react";

import { CopyButton } from "@/components/copy-button";
import { Textarea } from "@/components/ui/textarea";
import {
  collectMatches,
  compileSearch,
  moveMatch,
  replaceAll,
  replaceOne,
  type SearchMatch,
} from "@/lib/find-replace";
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

interface SearchableTextareaProps extends React.ComponentPropsWithoutRef<
  typeof Textarea
> {
  searchMatches: SearchMatch[];
  activeMatchIndex?: number;
}

function highlightRanges(
  text: string,
  matches: SearchMatch[],
  activeMatchIndex?: number,
  isBackdrop = false,
) {
  const ranges = matches.filter((match) => match.end > match.index);
  if (ranges.length === 0) return text;

  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const [matchIndex, match] of matches.entries()) {
    if (match.end <= match.index) continue;
    if (match.index > cursor) {
      parts.push(text.slice(cursor, match.index));
    }
    const isActive = activeMatchIndex === matchIndex;
    parts.push(
      <mark
        key={`${match.index}-${match.end}-${matchIndex}`}
        className={cn(
          "rounded px-[1px]",
          isActive ? "bg-orange-500/55" : "bg-yellow-500/35",
          isBackdrop ? "text-transparent" : "text-foreground",
        )}
      >
        {text.slice(match.index, match.end)}
      </mark>,
    );
    cursor = match.end;
  }
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }
  return <>{parts}</>;
}

const SearchableTextarea = React.forwardRef<
  HTMLTextAreaElement,
  SearchableTextareaProps
>(
  (
    {
      searchMatches,
      activeMatchIndex,
      className,
      value,
      onChange,
      onScroll,
      ...props
    },
    ref,
  ) => {
    const localRef = useRef<HTMLTextAreaElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const textareaRef = (ref || localRef) as React.RefObject<HTMLTextAreaElement>;

    const handleScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
      if (backdropRef.current) {
        backdropRef.current.scrollTop = event.currentTarget.scrollTop;
        backdropRef.current.scrollLeft = event.currentTarget.scrollLeft;
      }
      onScroll?.(event);
    };

    useEffect(() => {
      if (textareaRef.current && backdropRef.current) {
        backdropRef.current.scrollTop = textareaRef.current.scrollTop;
        backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    }, [value, textareaRef]);

    const text = typeof value === "string" ? value : "";
    const hasHighlights = searchMatches.some((match) => match.end > match.index);

    return (
      <div className="relative flex h-full min-h-0 flex-1 flex-col">
        {hasHighlights && (
          <div
            ref={backdropRef}
            className={cn(
              "pointer-events-none absolute inset-0 h-full w-full select-none overflow-hidden whitespace-pre-wrap break-words rounded-xl border border-transparent bg-transparent px-4 py-3.5 font-mono text-sm text-transparent",
              className,
            )}
            style={{ lineHeight: "1.5rem", scrollbarGutter: "stable" }}
          >
            {highlightRanges(text, searchMatches, activeMatchIndex, true)}
          </div>
        )}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onScroll={handleScroll}
          className={cn(
            "resize-none rounded-xl border-border/50 bg-background/20 p-4 font-mono text-sm leading-relaxed backdrop-blur-[2px] transition-colors duration-150",
            "focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:ring-offset-0",
            hasHighlights && "bg-transparent",
            className,
          )}
          style={{ lineHeight: "1.5rem", scrollbarGutter: "stable" }}
          {...props}
        />
      </div>
    );
  },
);
SearchableTextarea.displayName = "SearchableTextarea";

/** Shared side-by-side input/output layout used by every Format & Encode tool. */
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
  const [showReplace, setShowReplace] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef(input);
  const replacePendingRef = useRef<
    { expectedInput: string; nextOffset: number } | undefined
  >();
  const [replacePending, setReplacePending] = useState(false);

  const searchOptions = useMemo(
    () => ({ caseSensitive, useRegex }),
    [caseSensitive, useRegex],
  );
  const compiledSearch = useMemo(
    () => compileSearch(searchQuery, searchOptions),
    [searchQuery, searchOptions],
  );
  const inputMatches = useMemo(
    () => collectMatches(input, compiledSearch),
    [input, compiledSearch],
  );
  const outputText = error ?? output;
  const outputMatches = useMemo(
    () => collectMatches(outputText, compiledSearch),
    [outputText, compiledSearch],
  );
  const matches = inputMatches.kind === "matches" ? inputMatches.matches : [];
  const passiveMatches = outputMatches.kind === "matches" ? outputMatches.matches : [];
  const inputError = inputMatches.kind === "error" ? inputMatches.message : null;
  const activeIndex = matches.length === 0 ? 0 : currentIndex % matches.length;
  const canReplace =
    compiledSearch.kind === "ready" &&
    !inputError &&
    matches.length > 0 &&
    !replacePending;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "f") {
        event.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!showSearch) return;
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  }, [showSearch]);

  useEffect(() => {
    if (inputRef.current === input) return;
    inputRef.current = input;
    const pending = replacePendingRef.current;
    if (pending?.expectedInput === input) {
      replacePendingRef.current = undefined;
      setReplacePending(false);
      const updatedMatches = collectMatches(input, compiledSearch);
      if (updatedMatches.kind === "matches") {
        const nextIndex = updatedMatches.matches.findIndex(
          (match) => match.index >= pending.nextOffset,
        );
        setCurrentIndex(nextIndex === -1 ? 0 : nextIndex);
      }
    } else {
      replacePendingRef.current = undefined;
      setReplacePending(false);
      setCurrentIndex(0);
    }
  }, [input, compiledSearch]);

  const resetSearch = () => setCurrentIndex(0);

  const closeSearch = () => {
    setShowSearch(false);
    setShowReplace(false);
    setSearchQuery("");
    resetSearch();
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
      return;
    }
    if (event.key === "Enter" && matches.length > 0) {
      event.preventDefault();
      setCurrentIndex((index) =>
        moveMatch(index, matches.length, event.shiftKey ? "previous" : "next"),
      );
    }
  };

  const handleInputChange = (value: string) => {
    resetSearch();
    onInputChange(value);
  };

  const handleReplaceOne = () => {
    const match = matches[activeIndex];
    if (!canReplace || !match) return;

    const result = replaceOne(input, match, replaceValue, useRegex);
    if (result.kind === "success") {
      if (result.text === input) {
        setCurrentIndex((index) => moveMatch(index, matches.length, "next"));
        return;
      }
      const replacementLength = result.text.length - (input.length - match.match.length);
      replacePendingRef.current = {
        expectedInput: result.text,
        nextOffset:
          match.index + replacementLength + (match.match.length === 0 ? 1 : 0),
      };
      setReplacePending(true);
      onInputChange(result.text);
    }
  };

  const handleReplaceAll = () => {
    if (!canReplace) return;

    const result = replaceAll(input, compiledSearch, replaceValue);
    if (result.kind === "success") {
      if (result.text === input) return;
      replacePendingRef.current = { expectedInput: result.text, nextOffset: 0 };
      setReplacePending(true);
      onInputChange(result.text);
    }
  };

  const setSearchMode = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter((value) => !value);
    resetSearch();
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex shrink-0 flex-col gap-2">
        {controls && <div className="flex items-center gap-2">{controls}</div>}
        {showSearch && (
          <div className="rounded-md border bg-muted/20 px-3 py-1.5 text-sm animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  resetSearch();
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Find in panels (Press Esc to close)..."
                aria-label="Find in panels"
                className="flex-1 bg-transparent py-0.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setSearchMode(setCaseSensitive)}
                aria-label="Match case"
                aria-pressed={caseSensitive}
                title="Match case"
                className={cn(
                  "rounded p-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                  caseSensitive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <CaseSensitive className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSearchMode(setUseRegex)}
                aria-label="Use regular expression"
                aria-pressed={useRegex}
                title="Use regular expression"
                className={cn(
                  "rounded p-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                  useRegex
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Regex className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowReplace((value) => !value)}
                aria-label="Toggle replace"
                aria-expanded={showReplace}
                title="Toggle replace"
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform", showReplace && "rotate-180")}
                />
              </button>
              {searchQuery && (
                <span className="shrink-0 select-none rounded border bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {matches.length === 0 ? "0 matches" : `${activeIndex + 1}/${matches.length}`}
                </span>
              )}
              <button
                type="button"
                onClick={closeSearch}
                className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                title="Close search (Esc)"
                aria-label="Close search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {showReplace && (
              <div className="mt-2 flex items-center gap-2 border-t pt-2">
                <input
                  type="text"
                  value={replaceValue}
                  onChange={(event) => setReplaceValue(event.target.value)}
                  placeholder="Replace with..."
                  aria-label="Replace with"
                  className="min-w-0 flex-1 bg-transparent py-0.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={handleReplaceOne}
                  disabled={!canReplace}
                  title="Replace current match"
                  className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowRight className="h-3.5 w-3.5" /> Replace
                </button>
                <button
                  type="button"
                  onClick={handleReplaceAll}
                  disabled={!canReplace}
                  title="Replace all matches"
                  className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ReplaceAll className="h-3.5 w-3.5" /> Replace All
                </button>
              </div>
            )}
            {inputError && (
              <p role="alert" className="mt-2 text-xs text-destructive">
                {inputError}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">
        <Pane label="Input">
          <SearchableTextarea
            searchMatches={matches}
            activeMatchIndex={activeIndex}
            value={input}
            onChange={(event) => handleInputChange(event.target.value)}
            placeholder={inputPlaceholder}
            spellCheck={false}
            className="h-full min-h-[40vh] flex-1 resize-none font-mono text-sm"
          />
        </Pane>
        <Pane
          label="Output"
          action={<CopyButton text={error ? "" : output} disabled={!!error || !output} />}
        >
          {error ? (
            <p
              role="alert"
              className="h-full min-h-[40vh] flex-1 overflow-auto rounded-xl border border-destructive/25 bg-destructive/5 p-4 font-mono text-sm leading-relaxed text-destructive dark:bg-destructive/10"
            >
              {highlightRanges(outputText, passiveMatches)}
            </p>
          ) : (
            <SearchableTextarea
              searchMatches={passiveMatches}
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
        <span className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
          {label}
        </span>
        {action}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
