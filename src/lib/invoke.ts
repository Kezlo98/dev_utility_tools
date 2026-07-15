import { invoke } from "@tauri-apps/api/core";

import type { Direction } from "@/tools/encode/direction-toggle";

/**
 * Typed wrappers over the Rust crypto and base64 file-mode commands. Each
 * command returns `Result<T, String>`; a rejected promise carries the error
 * string for inline rendering in the tool UI.
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

/** Encode a file's contents to a base64 string. Rejects files over the 10MB text-mode cap. */
export function base64EncodeFileToString(path: string): Promise<string> {
  return invoke<string>("base64_encode_file_to_string", { path });
}

/** Decode a base64 string and write the bytes to `outputPath`. Rejects decoded output over the 10MB text-mode cap. */
export function base64DecodeStringToFile(
  data: string,
  outputPath: string,
): Promise<void> {
  return invoke<void>("base64_decode_string_to_file", { data, outputPath });
}

/** Decode a file's base64 contents to a string. Rejects files over the 10MB text-mode cap. */
export function base64DecodeFileToString(path: string): Promise<string> {
  return invoke<string>("base64_decode_file_to_string", { path });
}

/** Encode a string and write the base64 bytes to `outputPath`. Rejects encoded output over the 10MB text-mode cap. */
export function base64EncodeStringToFile(
  data: string,
  outputPath: string,
): Promise<void> {
  return invoke<void>("base64_encode_string_to_file", { data, outputPath });
}

/** Read `inputPath`, encode or decode per `direction`, and write `outputPath`. No size cap. */
export function base64TransformFile(
  inputPath: string,
  outputPath: string,
  direction: Direction,
): Promise<void> {
  return invoke<void>("base64_transform_file", {
    inputPath,
    outputPath,
    direction,
  });
}
