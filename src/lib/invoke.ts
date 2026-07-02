import { invoke } from "@tauri-apps/api/core";

/**
 * Typed wrappers over the Rust crypto commands. Each command returns
 * `Result<T, String>`; a rejected promise carries the error string for inline
 * rendering in the tool UI.
 */

/** Generate a bcrypt hash for `password` at `cost` (4–14). */
export function bcryptHash(password: string, cost: number): Promise<string> {
  return invoke<string>("bcrypt_hash", { password, cost });
}

/** Verify `password` against a bcrypt `hash`. Resolves to true/false. */
export function bcryptVerify(password: string, hash: string): Promise<boolean> {
  return invoke<boolean>("bcrypt_verify", { password, hash });
}

/** Decoded JWT header + claims pair from Rust. */
export interface JwtParts {
  header: unknown;
  claims: unknown;
}

/** Decode a token's header + claims without verifying the signature. */
export function jwtDecode(token: string): Promise<JwtParts> {
  return invoke<JwtParts>("jwt_decode", { token });
}

/** JWT algorithms accepted by the verify path (symmetric only). */
export type JwtAlgorithm = "HS256" | "HS384" | "HS512";

export const JWT_ALGORITHMS: JwtAlgorithm[] = ["HS256", "HS384", "HS512"];

/** Verify a token's signature with `secret` under `algorithm`. */
export function jwtVerify(
  token: string,
  secret: string,
  algorithm: JwtAlgorithm,
): Promise<JwtParts> {
  return invoke<JwtParts>("jwt_verify", { token, secret, algorithm });
}
