/**
 * Clipboard copy with a synchronous textarea fallback for environments where
 * the async Clipboard API is unavailable or denied (older WebView, secure
 * context missing, user gesture not honored). Returns whether the copy
 * succeeded so callers can surface feedback without throwing.
 */
export async function copyText(text: string): Promise<boolean> {
  // Preferred path: async Clipboard API (Tauri WebView grants this for app
  // content without an extra capability).
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy path below.
    }
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    // Move off-screen so it never flashes in the layout.
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
