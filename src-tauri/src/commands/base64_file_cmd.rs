//! File-mode Base64: encode a file to a base64 string, decode a base64
//! string to a file, or transform file-to-file directly.
//!
//! The text-pane commands (`base64_encode_file_to_string`,
//! `base64_decode_string_to_file`) enforce a 10MB cap because their output
//! lands in a textarea — a bigger payload would just make the UI unusable.
//! `base64_transform_file` skips the cap since it never touches a textarea
//! and streams straight from disk to disk (in-memory, no streaming, but no
//! render cost either), so it's fine up to ~100MB.
//!
//! Reads/writes and the encode/decode itself run on `spawn_blocking` (same
//! pattern as `bcrypt_hash`) so a large file doesn't jank the UI thread.

use base64::{engine::general_purpose::STANDARD, Engine as _};

/// Soft cap for the two text-pane commands. Not applied to `base64_transform_file`.
pub const TEXT_MODE_SIZE_CAP: u64 = 10 * 1024 * 1024;

/// Read a file, base64-encode it, and return the string (bounded by [`TEXT_MODE_SIZE_CAP`]).
#[tauri::command]
pub async fn base64_encode_file_to_string(path: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || encode_file_bytes(&path))
        .await
        .map_err(|e| format!("base64 encode task failed: {e}"))?
}

/// Decode a base64 string and write the bytes to `output_path` (bounded by [`TEXT_MODE_SIZE_CAP`]).
#[tauri::command]
pub async fn base64_decode_string_to_file(data: String, output_path: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let bytes = decode_to_bytes(&data)?;
        write_bytes(&output_path, &bytes)
    })
    .await
    .map_err(|e| format!("base64 decode task failed: {e}"))?
}

/// Read `input_path`, encode or decode per `direction`, write `output_path`. No size cap.
#[tauri::command]
pub async fn base64_transform_file(
    input_path: String,
    output_path: String,
    direction: String,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        transform_file(&input_path, &output_path, &direction)
    })
    .await
    .map_err(|e| format!("base64 transform task failed: {e}"))?
}

/// Read a file of base64 text, decode it, and return the decoded UTF-8 string
/// (bounded by [`TEXT_MODE_SIZE_CAP`]). Errors cleanly when the decoded bytes
/// aren't valid UTF-8 (e.g. the file encoded binary data).
#[tauri::command]
pub async fn base64_decode_file_to_string(path: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || decode_file_bytes_to_string(&path))
        .await
        .map_err(|e| format!("base64 decode task failed: {e}"))?
}

/// Base64-encode `data` and write it to `output_path` (input bounded by
/// [`TEXT_MODE_SIZE_CAP`] — checked before encoding so a huge string isn't
/// encoded just to be rejected).
#[tauri::command]
pub async fn base64_encode_string_to_file(data: String, output_path: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || encode_string_to_file(&data, &output_path))
        .await
        .map_err(|e| format!("base64 encode task failed: {e}"))?
}

/// Friendly rejection when `len` exceeds the text-pane size cap.
pub fn check_size_cap(len: u64) -> Result<(), String> {
    if len > TEXT_MODE_SIZE_CAP {
        let mb = len as f64 / (1024.0 * 1024.0);
        Err(format!(
            "File is {mb:.1}MB, exceeds the 10MB limit for text mode — use File ↔ File instead."
        ))
    } else {
        Ok(())
    }
}

/// Sync helper: encode a file's contents to base64. Checks size via metadata
/// before reading so a huge file isn't read into memory just to be rejected.
pub fn encode_file_bytes(path: &str) -> Result<String, String> {
    let metadata = std::fs::metadata(path).map_err(|e| format!("failed to read file: {e}"))?;
    check_size_cap(metadata.len())?;
    let bytes = std::fs::read(path).map_err(|e| format!("failed to read file: {e}"))?;
    Ok(STANDARD.encode(bytes))
}

/// Sync helper: read a file of base64 text, decode it, and return the decoded
/// string. Size-caps via metadata before reading (same guard as
/// [`encode_file_bytes`]). The file's *contents* are the base64 text, so it's
/// read as a string; decoded bytes must be valid UTF-8 or this errors cleanly
/// rather than producing mojibake.
pub fn decode_file_bytes_to_string(path: &str) -> Result<String, String> {
    let metadata = std::fs::metadata(path).map_err(|e| format!("failed to read file: {e}"))?;
    check_size_cap(metadata.len())?;
    let contents =
        std::fs::read_to_string(path).map_err(|e| format!("failed to read file: {e}"))?;
    let bytes = decode_base64_str(&contents)?;
    String::from_utf8(bytes).map_err(|_| {
        "Decoded bytes are not valid UTF-8 text (this looks like binary data).".to_string()
    })
}

/// Sync helper: base64-encode `data` and write it to `output_path`. Caps the
/// input string's byte length before encoding (mirrors [`encode_file_bytes`]'s
/// pre-read check).
pub fn encode_string_to_file(data: &str, output_path: &str) -> Result<(), String> {
    check_size_cap(data.len() as u64)?;
    let encoded = STANDARD.encode(data.as_bytes());
    write_bytes(output_path, encoded.as_bytes())
}

/// Sync helper: decode a base64 string to bytes, bounded by [`TEXT_MODE_SIZE_CAP`].
///
/// The cap is checked after decoding, not before — unlike `encode_file_bytes`.
/// `data` already crossed IPC as a full `String`, so the decoded output (~75%
/// of that size) is bounded by what's already in memory; there's no unbounded
/// allocation to guard against here.
pub fn decode_to_bytes(data: &str) -> Result<Vec<u8>, String> {
    let bytes = decode_base64_str(data)?;
    check_size_cap(bytes.len() as u64)?;
    Ok(bytes)
}

/// Sync helper: write bytes to a path.
pub fn write_bytes(path: &str, bytes: &[u8]) -> Result<(), String> {
    std::fs::write(path, bytes).map_err(|e| format!("failed to write file: {e}"))
}

/// Sync helper: read `input_path`, encode/decode per `direction`, write `output_path`. No cap.
fn transform_file(input_path: &str, output_path: &str, direction: &str) -> Result<(), String> {
    let bytes = std::fs::read(input_path).map_err(|e| format!("failed to read file: {e}"))?;
    let output = match direction {
        "encode" => STANDARD.encode(&bytes).into_bytes(),
        "decode" => {
            let text = String::from_utf8_lossy(&bytes);
            decode_base64_str(&text)?
        }
        other => {
            return Err(format!(
                "unknown direction \"{other}\", expected \"encode\" or \"decode\""
            ))
        }
    };
    write_bytes(output_path, &output)
}

/// Strip whitespace (mirrors the frontend's `input.replace(/\s+/g, "")`) and
/// base64-decode. Shared by `decode_to_bytes` and `transform_file`'s decode
/// branch — the cap check lives only in `decode_to_bytes`.
fn decode_base64_str(data: &str) -> Result<Vec<u8>, String> {
    let stripped: String = data.chars().filter(|c| !c.is_whitespace()).collect();
    STANDARD.decode(&stripped).map_err(|_| {
        "Invalid Base64: contains characters outside the alphabet or has bad length/padding."
            .to_string()
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    fn temp_path(name: &str) -> PathBuf {
        let mut path = std::env::temp_dir();
        let unique = format!(
            "devkit_test_{}_{name}_{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        );
        path.push(unique);
        path
    }

    #[test]
    fn check_size_cap_allows_at_limit() {
        assert!(check_size_cap(TEXT_MODE_SIZE_CAP).is_ok());
    }

    #[test]
    fn check_size_cap_rejects_over_limit() {
        let err = check_size_cap(TEXT_MODE_SIZE_CAP + 1).unwrap_err();
        assert!(err.contains("10MB"), "{err}");
    }

    #[test]
    fn encode_file_bytes_round_trips_with_decode_to_bytes() {
        let path = temp_path("encode_roundtrip");
        fs::write(&path, b"hello devkit").unwrap();

        let encoded = encode_file_bytes(path.to_str().unwrap()).unwrap();
        let decoded = decode_to_bytes(&encoded).unwrap();

        assert_eq!(decoded, b"hello devkit");
        fs::remove_file(&path).unwrap();
    }

    #[test]
    fn encode_file_bytes_rejects_missing_file() {
        let path = temp_path("missing");
        assert!(encode_file_bytes(path.to_str().unwrap()).is_err());
    }

    #[test]
    fn decode_to_bytes_rejects_invalid_base64() {
        let err = decode_to_bytes("not valid base64!!!").unwrap_err();
        assert!(err.contains("Invalid Base64"), "{err}");
    }

    #[test]
    fn decode_to_bytes_strips_whitespace() {
        let encoded = STANDARD.encode(b"line one line two");
        let with_newline = format!("{}\n{}", &encoded[..4], &encoded[4..]);

        let decoded = decode_to_bytes(&with_newline).unwrap();

        assert_eq!(decoded, b"line one line two");
    }

    #[test]
    fn transform_file_round_trips_encode_then_decode() {
        let input = temp_path("transform_input");
        let encoded_path = temp_path("transform_encoded");
        let decoded_path = temp_path("transform_decoded");
        fs::write(&input, b"transform me").unwrap();

        transform_file(
            input.to_str().unwrap(),
            encoded_path.to_str().unwrap(),
            "encode",
        )
        .unwrap();
        transform_file(
            encoded_path.to_str().unwrap(),
            decoded_path.to_str().unwrap(),
            "decode",
        )
        .unwrap();

        assert_eq!(fs::read(&decoded_path).unwrap(), b"transform me");

        fs::remove_file(&input).unwrap();
        fs::remove_file(&encoded_path).unwrap();
        fs::remove_file(&decoded_path).unwrap();
    }

    #[test]
    fn transform_file_rejects_invalid_direction() {
        let input = temp_path("transform_bad_direction");
        let output = temp_path("transform_bad_direction_out");
        fs::write(&input, b"data").unwrap();

        let err = transform_file(
            input.to_str().unwrap(),
            output.to_str().unwrap(),
            "sideways",
        )
        .unwrap_err();

        assert!(err.contains("unknown direction"), "{err}");
        fs::remove_file(&input).unwrap();
    }

    #[test]
    fn write_bytes_writes_file() {
        let path = temp_path("write_bytes");

        write_bytes(path.to_str().unwrap(), b"data").unwrap();

        assert_eq!(fs::read(&path).unwrap(), b"data");
        fs::remove_file(&path).unwrap();
    }

    #[test]
    fn encode_string_to_file_round_trips() {
        let path = temp_path("encode_string_to_file");
        let original = "hello devkit — encode me";

        encode_string_to_file(original, path.to_str().unwrap()).unwrap();

        let encoded_text = std::fs::read_to_string(&path).unwrap();
        let decoded = STANDARD.decode(encoded_text.trim()).unwrap();
        assert_eq!(decoded, original.as_bytes());
        fs::remove_file(&path).unwrap();
    }

    #[test]
    fn decode_file_bytes_to_string_round_trips_with_encode_string_to_file() {
        let path = temp_path("decode_file_roundtrip");
        let original = "round-trip me";

        encode_string_to_file(original, path.to_str().unwrap()).unwrap();
        let decoded = decode_file_bytes_to_string(path.to_str().unwrap()).unwrap();

        assert_eq!(decoded, original);
        fs::remove_file(&path).unwrap();
    }

    #[test]
    fn decode_file_bytes_to_string_errors_on_non_utf8_decoded_bytes() {
        // 0xFF 0xFE 0xFD is not valid UTF-8 — decoding it to text must fail cleanly.
        let bytes = vec![0xFF, 0xFE, 0xFD];
        let encoded = STANDARD.encode(&bytes);

        let path = temp_path("decode_non_utf8");
        fs::write(&path, &encoded).unwrap();

        let err = decode_file_bytes_to_string(path.to_str().unwrap()).unwrap_err();
        assert!(err.contains("not valid UTF-8 text"), "{err}");
        fs::remove_file(&path).unwrap();
    }

    #[test]
    fn encode_string_to_file_rejects_over_cap() {
        let path = temp_path("encode_over_cap");
        let oversize = "a".repeat(TEXT_MODE_SIZE_CAP as usize + 1);

        let err = encode_string_to_file(&oversize, path.to_str().unwrap()).unwrap_err();
        assert!(err.contains("10MB"), "{err}");
        assert!(!path.exists(), "no file should be written on rejection");
    }
}
