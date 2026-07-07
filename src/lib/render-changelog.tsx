import * as React from "react";

/**
 * Minimal changelog renderer for the Keep-a-Changelog subset that GitHub
 * release bodies use: `##`/`###` headings, `-`/`*` bullets, `**bold**`, inline
 * `` `code` ``, `[text](url)` links, and blank-line paragraph breaks. Anything
 * outside this subset renders as plain text.
 *
 * Safety: every value reaches the DOM as a React string child, which React
 * escapes — there is no `dangerouslySetInnerHTML`, so a release body can't
 * inject markup. Links are intentionally **inert styled text** (the label is
 * shown, styled like a link, but there is no `href` and no navigation): the
 * modal's Update button is the sole action.
 */

/** Inline-token regex: bold, inline code, or a markdown link. */
const INLINE_RE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

/**
 * Split a line into React nodes, applying inline `**bold**`, `` `code` ``, and
 * inert `[text](url)` links. Plain segments are returned as strings so React
 * escapes them.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(INLINE_RE).filter((p) => p !== "");
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={key}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      // Inert: label styled as a link, but no navigation. Update button owns
      // the only outbound action.
      return (
        <span key={key} className="text-primary underline-offset-2">
          {link[1]}
        </span>
      );
    }
    return part;
  });
}

/**
 * Render a changelog markdown string into React nodes. Line-based: each line is
 * classified as a heading, bullet, or paragraph; consecutive bullets group into
 * a single list and blank lines separate paragraphs.
 */
export function renderChangelog(markdown: string): React.ReactNode {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  let paragraph: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    const items = bullets;
    blocks.push(
      <ul
        key={`ul-${blocks.length}`}
        className="ml-4 list-disc space-y-1 text-sm text-foreground/90"
      >
        {items.map((item, i) => (
          <li key={i}>{renderInline(item, `li-${blocks.length}-${i}`)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join(" ");
    blocks.push(
      <p key={`p-${blocks.length}`} className="text-sm text-foreground/90">
        {renderInline(text, `p-${blocks.length}`)}
      </p>,
    );
    paragraph = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.trim() === "") {
      flushBullets();
      flushParagraph();
      continue;
    }

    const heading = /^(#{2,3})\s+(.*)$/.exec(line);
    if (heading) {
      flushBullets();
      flushParagraph();
      const level = heading[1].length;
      const content = renderInline(heading[2], `h-${blocks.length}`);
      blocks.push(
        level === 2 ? (
          <h3
            key={`h-${blocks.length}`}
            className="mt-1 text-sm font-semibold text-foreground"
          >
            {content}
          </h3>
        ) : (
          <h4
            key={`h-${blocks.length}`}
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {content}
          </h4>
        ),
      );
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line.trim());
    if (bullet) {
      flushParagraph();
      bullets.push(bullet[1]);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushBullets();
  flushParagraph();

  return <div className="space-y-2">{blocks}</div>;
}
