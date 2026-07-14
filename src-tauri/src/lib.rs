mod commands;

// DevKit — Tauri shell. Registers plugins and the crypto/base64 commands.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::bcrypt_cmd::bcrypt_hash,
            commands::bcrypt_cmd::bcrypt_verify,
            commands::jwt_cmd::jwt_decode,
            commands::jwt_cmd::jwt_verify,
            commands::base64_file_cmd::base64_encode_file_to_string,
            commands::base64_file_cmd::base64_decode_string_to_file,
            commands::base64_file_cmd::base64_transform_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
