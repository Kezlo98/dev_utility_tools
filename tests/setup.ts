import "@testing-library/jest-dom/vitest";

// jsdom lacks a real clipboard; tests that exercise copy fall back gracefully.
if (!("clipboard" in navigator)) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: async () => undefined },
    configurable: true,
  });
}
