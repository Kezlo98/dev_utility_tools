import { describe, it, expect } from "vitest";

import { hash } from "./hash";

// Known vectors (input "abc") verified against the Phase 5 spec.
describe("hash", () => {
  it("MD5 matches known vector (spark-md5 path)", async () => {
    expect(await hash("md5", "abc")).toBe("900150983cd24fb0d6963f7d28e17f72");
  });

  it("SHA-1 matches known vector (WebCrypto path)", async () => {
    expect(await hash("sha1", "abc")).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
  });

  it("SHA-256 matches known vector (WebCrypto path)", async () => {
    expect(await hash("sha256", "abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("SHA-384 matches known vector (WebCrypto path)", async () => {
    expect(await hash("sha384", "abc")).toBe(
      "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
    );
  });

  it("SHA-512 matches known vector (WebCrypto path)", async () => {
    expect(await hash("sha512", "abc")).toBe(
      "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
    );
  });

  it("produces lowercase hex", async () => {
    const out = await hash("sha256", "abc");
    expect(out).toEqual(out.toLowerCase());
    expect(out).not.toContain("-");
  });

  it("empty string still hashes", async () => {
    // SHA-256 of "" — well-known empty-input digest.
    expect(await hash("sha256", "")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });
});
