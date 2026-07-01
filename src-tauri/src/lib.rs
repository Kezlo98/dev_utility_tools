mod commands;

// DevKit — Tauri shell. Phase 5 wires the bcrypt + JWT crypto commands.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::bcrypt_cmd::bcrypt_hash,
            commands::bcrypt_cmd::bcrypt_verify,
            commands::jwt_cmd::jwt_decode,
            commands::jwt_cmd::jwt_verify,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
