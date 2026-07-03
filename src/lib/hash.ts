import SparkMD5 from "spark-md5";

/**
 * Hash algorithms. SHA-* run on the WebView's `crypto.subtle.digest` (native
 * OS digests, zero bundle cost); MD5 has no WebCrypto support so it uses the
 * small `spark-md5` JS implementation. No Rust command for hashing.
 */
export type HashAlgorithm = "md5" | "sha1" | "sha256" | "sha384" | "sha512";

const WEB_CRYPTO_ALGOS: Record<Exclude<HashAlgorithm, "md5">, string> = {
  sha1: "SHA-1",
  sha256: "SHA-256",
  sha384: "SHA-384",
  sha512: "SHA-512",
};

/** Algorithm dropdown options, SHA-256 first as the default. */
export const HASH_ALGORITHMS: { value: HashAlgorithm; label: string }[] = [
  { value: "md5", label: "MD5" },
  { value: "sha1", label: "SHA-1" },
  { value: "sha256", label: "SHA-256" },
  { value: "sha384", label: "SHA-384" },
  { value: "sha512", label: "SHA-512" },
];

/**
 * Hash `input` with the given algorithm, returning a lowercase hex digest.
 * MD5 routes through spark-md5; everything else through WebCrypto.
 */
export async function hash(
  algo: HashAlgorithm,
  input: string,
): Promise<string> {
  if (algo === "md5") {
    return SparkMD5.hash(input);
  }
  const subtleAlgo = WEB_CRYPTO_ALGOS[algo];
  if (!subtleAlgo) {
    throw new Error(`unsupported algorithm: ${algo}`);
  }
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest(subtleAlgo, data);
  return toHex(new Uint8Array(digest));
}

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) {
    out += b.toString(16).padStart(2, "0");
  }
  return out;
}
