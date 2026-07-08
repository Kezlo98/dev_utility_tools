import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

import { renderChangelog } from "./render-changelog";

/** Render a changelog string and return the root container for assertions. */
function renderMd(markdown: string): HTMLElement {
  return render(<>{renderChangelog(markdown)}</>).container;
}

describe("renderChangelog headings", () => {
  it("renders ## as an h3 and ### as an h4", () => {
    const c = renderMd("## Added\n### Details");
    expect(c.querySelector("h3")?.textContent).toBe("Added");
    expect(c.querySelector("h4")?.textContent).toBe("Details");
  });
});

describe("renderChangelog bullets", () => {
  it("groups consecutive - / * bullets into one list", () => {
    const c = renderMd("- first\n* second\n- third");
    const lists = c.querySelectorAll("ul");
    expect(lists).toHaveLength(1);
    expect(lists[0].querySelectorAll("li")).toHaveLength(3);
    expect(lists[0].querySelectorAll("li")[1].textContent).toBe("second");
  });

  it("starts a new list after a paragraph break", () => {
    const c = renderMd("- a\n\ntext\n\n- b");
    expect(c.querySelectorAll("ul")).toHaveLength(2);
    expect(c.querySelectorAll("p")).toHaveLength(1);
  });
});

describe("renderChangelog inline", () => {
  it("renders **bold** as <strong>", () => {
    const c = renderMd("hello **world**");
    expect(c.querySelector("strong")?.textContent).toBe("world");
  });

  it("renders `code` as <code>", () => {
    const c = renderMd("run `npm test` now");
    expect(c.querySelector("code")?.textContent).toBe("npm test");
  });

  it("renders links as inert styled text with no href", () => {
    const c = renderMd("see [the docs](https://example.com)");
    expect(c.querySelector("a")).toBeNull();
    expect(c.textContent).toContain("the docs");
    expect(c.textContent).not.toContain("https://example.com");
  });
});

describe("renderChangelog escaping", () => {
  it("does not inject raw HTML from the body", () => {
    const c = renderMd("<script>alert(1)</script> and <b>x</b>");
    // React escapes string children: no real <script>/<b> nodes are created,
    // the markup survives only as visible text.
    expect(c.querySelector("script")).toBeNull();
    expect(c.querySelector("b")).toBeNull();
    expect(c.textContent).toContain("<script>alert(1)</script>");
  });
});

describe("renderChangelog paragraphs", () => {
  it("joins wrapped lines into a single paragraph and splits on blank lines", () => {
    const c = renderMd("line one\nline two\n\nsecond para");
    const paras = c.querySelectorAll("p");
    expect(paras).toHaveLength(2);
    expect(paras[0].textContent).toBe("line one line two");
    expect(paras[1].textContent).toBe("second para");
  });
});
