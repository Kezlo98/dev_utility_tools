import QRCode from "qrcode";

export interface QrResult {
  dataUrl: string;
  error: string | null;
}

/**
 * Render `input` as a QR data URL. Empty input is a no-op; encoding failures
 * (e.g. content too long for the chosen error correction) surface as a readable
 * error rather than throwing out of the tool.
 */
export async function renderQr(input: string): Promise<QrResult> {
  const text = input.trim();
  if (!text) return { dataUrl: "", error: null };
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: "M",
      margin: 1,
      scale: 6,
    });
    return { dataUrl, error: null };
  } catch (e) {
    return { dataUrl: "", error: e instanceof Error ? e.message : String(e) };
  }
}
