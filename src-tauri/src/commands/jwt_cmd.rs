//! JWT decode + verify. Bootstrap supports symmetric HS256/384/512 only; an
//! asymmetric token (RS*/ES*) is detected up front so the UI can show a typed
//! "algorithm not supported" message instead of a confusing decode failure.
//!
//! Decode reads the header + claims without a secret. Verify checks the
//! signature against the supplied secret and algorithm. Pure logic lives in the
//! sync helpers so `cargo test` can run without an async runtime.

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::Serialize;
use serde_json::Value;

/// Decoded header + claims pair returned to the frontend.
#[derive(Debug, Serialize)]
pub struct JwtParts {
    pub header: Value,
    pub claims: Value,
}

/// Decode a token's header + claims without verifying the signature.
#[tauri::command]
pub async fn jwt_decode(token: String) -> Result<JwtParts, String> {
    decode_token(&token)
}

/// Verify a token's signature, then return header + claims.
#[tauri::command]
pub async fn jwt_verify(
    token: String,
    secret: String,
    algorithm: String,
) -> Result<JwtParts, String> {
    verify_token(&token, &secret, &algorithm)
}

/// Sync helper: split and decode header + claims, no signature check.
pub fn decode_token(token: &str) -> Result<JwtParts, String> {
    let mut parts = token.trim().split('.');
    let header = decode_part(parts.next().ok_or("malformed token: missing header")?)?;
    let claims = decode_part(parts.next().ok_or("malformed token: missing claims")?)?;
    Ok(JwtParts { header, claims })
}

/// Sync helper: verify the signature under `algorithm` and return claims.
pub fn verify_token(token: &str, secret: &str, algorithm: &str) -> Result<JwtParts, String> {
    let requested = parse_algorithm(algorithm)?;
    let header = header_of(token)?;
    if let Some(tok_alg) = header.get("alg").and_then(Value::as_str) {
        let parsed = parse_algorithm(tok_alg)?;
        if parsed != requested {
            return Err(format!(
                "algorithm mismatch: header is {tok_alg} but verify requested {algorithm}"
            ));
        }
    }
    // Bootstrap inspector tool: surface claims without rejecting on missing/expired
    // `exp`. Signature errors (bad secret, tampered token) still surface here.
    let mut validation = Validation::new(requested);
    validation.validate_exp = false;
    validation.required_spec_claims.clear();
    let data = decode::<Value>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map_err(|e| format!("jwt verify failed: {e}"))?;
    Ok(JwtParts {
        header,
        claims: data.claims,
    })
}

/// Sync helper: decode just the header segment.
fn header_of(token: &str) -> Result<Value, String> {
    let mut parts = token.trim().split('.');
    decode_part(parts.next().ok_or("malformed token: missing header")?)
}

/// base64url-decode a segment and parse it as JSON. Padding is stripped first
/// so both padded and unpadded tokens decode.
fn decode_part(segment: &str) -> Result<Value, String> {
    let trimmed = segment.trim_end_matches('=');
    let bytes = URL_SAFE_NO_PAD
        .decode(trimmed)
        .map_err(|e| format!("base64 decode failed: {e}"))?;
    serde_json::from_slice(&bytes).map_err(|e| format!("json decode failed: {e}"))
}

/// Map a JWT algorithm name to an `Algorithm`. Only symmetric HS* are accepted
/// in bootstrap; RS*/ES* return a typed error the UI can explain.
fn parse_algorithm(name: &str) -> Result<Algorithm, String> {
    match name.to_uppercase().as_str() {
        "HS256" => Ok(Algorithm::HS256),
        "HS384" => Ok(Algorithm::HS384),
        "HS512" => Ok(Algorithm::HS512),
        other => Err(format!(
            "algorithm {other} not supported in bootstrap (symmetric HS* only)"
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use jsonwebtoken::{encode, EncodingKey, Header};
    use serde_json::json;

    fn make_token(alg: Algorithm, secret: &str, claims: &Value) -> String {
        let mut header = Header::new(alg);
        header.typ = Some("JWT".to_string());
        encode(
            &header,
            claims,
            &EncodingKey::from_secret(secret.as_bytes()),
        )
        .unwrap()
    }

    #[test]
    fn decode_reads_header_and_claims() {
        let token = make_token(Algorithm::HS256, "s3cret", &json!({"sub":"abc"}));
        let parts = decode_token(&token).unwrap();
        assert_eq!(parts.header["alg"], "HS256");
        assert_eq!(parts.header["typ"], "JWT");
        assert_eq!(parts.claims["sub"], "abc");
    }

    #[test]
    fn verify_accepts_correct_secret_and_alg() {
        let token = make_token(Algorithm::HS384, "topsecret", &json!({"sub":"xyz"}));
        let parts = verify_token(&token, "topsecret", "HS384").unwrap();
        assert_eq!(parts.claims["sub"], "xyz");
    }

    #[test]
    fn verify_rejects_wrong_secret() {
        let token = make_token(Algorithm::HS256, "right", &json!({"sub":"a"}));
        assert!(verify_token(&token, "wrong", "HS256").is_err());
    }

    #[test]
    fn verify_rejects_algorithm_mismatch() {
        let token = make_token(Algorithm::HS256, "s", &json!({}));
        let err = verify_token(&token, "s", "HS512").unwrap_err();
        assert!(err.contains("algorithm mismatch"), "{err}");
    }

    #[test]
    fn verify_accepts_token_without_exp() {
        // Inspector tool must surface claims even when `exp` is absent.
        let token = make_token(Algorithm::HS256, "s", &json!({"sub":"no-exp"}));
        let parts = verify_token(&token, "s", "HS256").unwrap();
        assert_eq!(parts.claims["sub"], "no-exp");
    }

    #[test]
    fn verify_rejects_asymmetric_algorithm_name() {
        // An RS256 token would never be produced here, but a user can request
        // RS256 explicitly — that must return the typed unsupported message.
        let err = parse_algorithm("RS256").unwrap_err();
        assert!(err.contains("not supported"), "{err}");
    }

    #[test]
    fn decode_rejects_malformed_token() {
        assert!(decode_token("not-a-jwt").is_err());
        assert!(decode_token("a.b").is_err());
    }
}
