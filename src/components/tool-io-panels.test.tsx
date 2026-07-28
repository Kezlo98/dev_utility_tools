import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { ToolIoPanels } from "./tool-io-panels";
import { MAX_PATTERN_LEN, MAX_TEST_LEN } from "../lib/find-replace";

function Harness({
  initialInput = "one two one",
  output = "output one one",
}: {
  initialInput?: string;
  output?: string;
}) {
  const [input, setInput] = useState(initialInput);
  return <ToolIoPanels input={input} onInputChange={setInput} output={output} />;
}

function openSearch() {
  fireEvent.keyDown(window, { key: "f", ctrlKey: true });
  return screen.getByRole("textbox", { name: "Find in panels" });
}

function expandReplace() {
  fireEvent.click(screen.getByRole("button", { name: "Toggle replace" }));
  return screen.getByRole("textbox", { name: "Replace with" });
}

afterEach(cleanup);

describe("ToolIoPanels find and replace", () => {
  it("opens with Ctrl+F, keeps replace collapsed, and clears on Escape", () => {
    render(<Harness />);

    const find = openSearch();
    expect(find).toHaveFocus();
    expect(screen.queryByRole("textbox", { name: "Replace with" })).toBeNull();

    fireEvent.change(find, { target: { value: "one" } });
    expect(screen.getByText("1/2")).toBeInTheDocument();
    fireEvent.keyDown(find, { key: "Escape" });

    expect(screen.queryByRole("textbox", { name: "Find in panels" })).toBeNull();
  });

  it("counts and navigates only Input matches while retaining passive Output highlights", () => {
    const { container } = render(<Harness />);
    const find = openSearch();

    fireEvent.change(find, { target: { value: "one" } });
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(container.querySelectorAll("mark")).toHaveLength(4);

    fireEvent.keyDown(find, { key: "Enter" });
    expect(screen.getByText("2/2")).toBeInTheDocument();
    fireEvent.keyDown(find, { key: "Enter", shiftKey: true });
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("recomputes case and regex searches through accessible toggles", () => {
    render(<Harness initialInput="Cat cat c.t" />);
    const find = openSearch();

    fireEvent.change(find, { target: { value: "cat" } });
    expect(screen.getByText("1/2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Match case" }));
    expect(screen.getByText("1/1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Match case" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.change(find, { target: { value: "c.t" } });
    fireEvent.click(screen.getByRole("button", { name: "Use regular expression" }));
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("shows invalid regex errors and disables replacement", () => {
    render(<Harness />);
    const find = openSearch();
    expandReplace();

    fireEvent.click(screen.getByRole("button", { name: "Use regular expression" }));
    fireEvent.change(find, { target: { value: "(" } });

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid regular expression");
    expect(screen.getByRole("button", { name: "Replace" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Replace All" })).toBeDisabled();
  });

  it("replaces the active match then replaces all through controlled input updates", () => {
    render(<Harness />);
    const find = openSearch();
    const replace = expandReplace();

    fireEvent.change(find, { target: { value: "one" } });
    fireEvent.change(replace, { target: { value: "ONE" } });
    fireEvent.click(screen.getByRole("button", { name: "Replace" }));

    expect(screen.getByDisplayValue("ONE two one")).toBeInTheDocument();
    expect(screen.getByText("2/2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Replace All" }));
    expect(screen.getByDisplayValue("ONE two ONE")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("blocks oversized regex Input and ignores oversized passive Output", () => {
    const { unmount } = render(
      <Harness initialInput={"x".repeat(MAX_TEST_LEN + 1)} output="x" />,
    );
    let find = openSearch();
    expandReplace();
    fireEvent.click(screen.getByRole("button", { name: "Use regular expression" }));
    fireEvent.change(find, { target: { value: "x" } });

    expect(screen.getByRole("alert")).toHaveTextContent("exceeds the 200 KB limit");
    expect(screen.getByRole("button", { name: "Replace" })).toBeDisabled();
    unmount();

    render(<Harness initialInput="x" output={"x".repeat(MAX_TEST_LEN + 1)} />);
    find = openSearch();
    expandReplace();
    fireEvent.click(screen.getByRole("button", { name: "Use regular expression" }));
    fireEvent.change(find, { target: { value: "x" } });

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("button", { name: "Replace" })).not.toBeDisabled();
  });

  it("resets navigation after query, toggle, and manual Input changes", () => {
    render(<Harness initialInput="one ONE one" />);
    const find = openSearch();
    fireEvent.change(find, { target: { value: "one" } });
    fireEvent.keyDown(find, { key: "Enter" });
    expect(screen.getByText("2/3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Match case" }));
    expect(screen.getByText("1/2")).toBeInTheDocument();
    fireEvent.change(find, { target: { value: "ONE" } });
    expect(screen.getByText("1/1")).toBeInTheDocument();

    const input = screen.getAllByRole("textbox").find(
      (element) => element.tagName === "TEXTAREA" && !element.hasAttribute("readonly"),
    );
    if (!input) throw new Error("Input textarea not found");
    fireEvent.change(input, { target: { value: "ONE ONE" } });
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("disables replacement for empty, no-match, and overlong patterns", () => {
    render(<Harness />);
    const find = openSearch();
    expandReplace();
    const replace = screen.getByRole("button", { name: "Replace" });

    expect(replace).toBeDisabled();
    fireEvent.change(find, { target: { value: "missing" } });
    expect(replace).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Use regular expression" }));
    fireEvent.change(find, { target: { value: "x".repeat(MAX_PATTERN_LEN + 1) } });
    expect(screen.getByRole("alert")).toHaveTextContent("500-character limit");
    expect(replace).toBeDisabled();
  });

  it("advances past a replacement that still contains the query", () => {
    render(<Harness />);
    const find = openSearch();
    const replace = expandReplace();

    fireEvent.change(find, { target: { value: "one" } });
    fireEvent.change(replace, { target: { value: "one!" } });
    fireEvent.click(screen.getByRole("button", { name: "Replace" }));

    expect(screen.getByDisplayValue("one! two one")).toBeInTheDocument();
    expect(screen.getByText("2/2")).toBeInTheDocument();
  });

  it("does not render zero-width matches as marks", () => {
    const { container } = render(<Harness initialInput="abc" output="abc" />);
    const find = openSearch();

    fireEvent.click(screen.getByRole("button", { name: "Use regular expression" }));
    fireEvent.change(find, { target: { value: "^" } });

    expect(screen.getByText("1/1")).toBeInTheDocument();
    expect(container.querySelectorAll("mark")).toHaveLength(0);
  });
});
