//! bcrypt password hashing. Cost-based KDF; needs a mature native impl so it
//! stays in Rust while SHA-* and MD5 run in the WebView.
//!
//! `bcrypt::hash`/`verify` are CPU-bound (~250ms at cost 12), so the command
//! wrappers move them onto a blocking thread via `spawn_blocking` to avoid
//! janking the UI on Windows. The pure compute lives in the sync helpers below
//! so `cargo test` can exercise it without an async runtime.

/// Inclusive cost range exposed by the frontend slider.
const MIN_COST: u32 = 4;
const MAX_COST: u32 = 14;

/// Generate a bcrypt hash for `password` at the given `cost` (4–14).
#[tauri::command]
pub async fn bcrypt_hash(password: String, cost: u32) -> Result<String, String> {
    let validated = validate_cost(cost)?;
    tauri::async_runtime::spawn_blocking(move || hash_bcrypt(&password, validated))
        .await
        .map_err(|e| format!("bcrypt task failed: {e}"))?
}

/// Verify `password` against an existing bcrypt `hash`.
#[tauri::command]
pub async fn bcrypt_verify(password: String, hash: String) -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(move || verify_bcrypt(&password, &hash))
        .await
        .map_err(|e| format!("bcrypt task failed: {e}"))?
}

/// Sync helper: hash a password. Exposed for unit tests.
pub fn hash_bcrypt(password: &str, cost: u32) -> Result<String, String> {
    bcrypt::hash(password, cost).map_err(|e| format!("bcrypt hash error: {e}"))
}

/// Sync helper: verify a password. Exposed for unit tests.
pub fn verify_bcrypt(password: &str, hash: &str) -> Result<bool, String> {
    bcrypt::verify(password, hash).map_err(|e| format!("bcrypt verify error: {e}"))
}

fn validate_cost(cost: u32) -> Result<u32, String> {
    if (MIN_COST..=MAX_COST).contains(&cost) {
        Ok(cost)
    } else {
        Err(format!("cost must be between {MIN_COST} and {MAX_COST}, got {cost}"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hash_then_verify_roundtrip() {
        let hashed = hash_bcrypt("hunter2", 4).unwrap();
        assert!(hashed.starts_with("$2"));
        assert!(verify_bcrypt("hunter2", &hashed).unwrap());
    }

    #[test]
    fn verify_rejects_wrong_password() {
        let hashed = hash_bcrypt("hunter2", 4).unwrap();
        assert!(!verify_bcrypt("wrong", &hashed).unwrap());
    }

    #[test]
    fn verify_returns_err_for_malformed_hash() {
        assert!(verify_bcrypt("x", "not-a-bcrypt-hash").is_err());
    }

    #[test]
    fn validate_cost_clamps_range() {
        assert!(validate_cost(3).is_err());
        assert_eq!(validate_cost(4).unwrap(), 4);
        assert_eq!(validate_cost(12).unwrap(), 12);
        assert!(validate_cost(15).is_err());
    }
}
