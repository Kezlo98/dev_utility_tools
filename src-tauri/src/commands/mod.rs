//! Tauri command modules. Each submodule groups a related tool's commands.
//! Commands return `Result<T, String>` so the frontend can render the error
//! string inline without parsing a structured error type.

pub mod base64_file_cmd;
pub mod bcrypt_cmd;
pub mod jwt_cmd;
