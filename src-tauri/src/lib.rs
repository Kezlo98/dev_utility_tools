mod commands;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent,
};

use commands::spotlight_cmd::{on_hotkey_pressed, HotkeyState};
use tauri_plugin_global_shortcut::{Builder as GlobalShortcutBuilder, GlobalShortcutExt};

/// Default spotlight hotkey when no user preference has been pushed from the
/// frontend yet. macOS uses `Option+Space`; Windows/Linux use `Ctrl+Alt+Space`
/// (plain `Alt+Space` is reserved by Windows).
#[cfg(target_os = "macos")]
const DEFAULT_HOTKEY: &str = "Option+Space";
#[cfg(not(target_os = "macos"))]
const DEFAULT_HOTKEY: &str = "Ctrl+Alt+Space";

const SPOTLIGHT_LABEL: &str = "spotlight";

// DevKit — Tauri shell. Registers plugins, the crypto/base64 commands, and the
// global spotlight quick-access launcher (hidden window + hotkey + tray).
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            // Built without initial shortcuts — the default combo is registered
            // in `setup()` so a failure there can fail loudly instead of being
            // swallowed by the plugin builder.
            GlobalShortcutBuilder::new().build(),
        )
        .manage(HotkeyState::default())
        .invoke_handler(tauri::generate_handler![
            commands::bcrypt_cmd::bcrypt_hash,
            commands::bcrypt_cmd::bcrypt_verify,
            commands::jwt_cmd::jwt_decode,
            commands::jwt_cmd::jwt_verify,
            commands::base64_file_cmd::base64_encode_file_to_string,
            commands::base64_file_cmd::base64_decode_string_to_file,
            commands::base64_file_cmd::base64_transform_file,
            commands::base64_file_cmd::base64_decode_file_to_string,
            commands::base64_file_cmd::base64_encode_string_to_file,
            commands::spotlight_cmd::spotlight_show,
            commands::spotlight_cmd::spotlight_hide,
            commands::spotlight_cmd::spotlight_reset_to_search,
            commands::spotlight_cmd::spotlight_show_tool,
            commands::spotlight_cmd::set_global_hotkey,
        ])
        .setup(|app| {
            // Hidden spotlight window — created programmatically so it can be
            // centered on the primary screen at runtime. Differentiated from the
            // main window by the `window=spotlight` query param Phase 3 reads.
            let spotlight = WebviewWindowBuilder::new(
                app,
                SPOTLIGHT_LABEL,
                WebviewUrl::App("index.html?window=spotlight".into()),
            )
            .title("DevKit Spotlight")
            .inner_size(640.0, 420.0)
            .decorations(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .transparent(true)
            .resizable(true)
            .visible(false)
            .center()
            .build()?;

            // Register the per-platform default hotkey before the frontend has a
            // chance to push a stored preference, so the hotkey works pre-paint.
            // Track it in HotkeyState so a later rebind can unregister it.
            //
            // Best-effort: if the default can't be grabbed (e.g. an OS-level
            // conflict on this machine), log and keep running rather than
            // panicking at launch — the user can configure a hotkey in-app
            // (Phase 4), and a missing default must not stop the app starting.
            if let Err(err) = app
                .global_shortcut()
                .on_shortcut(DEFAULT_HOTKEY, on_hotkey_pressed::<tauri::Wry>)
            {
                eprintln!("could not register default hotkey '{DEFAULT_HOTKEY}': {err}");
            } else {
                app.state::<HotkeyState>()
                    .current
                    .lock()
                    .unwrap()
                    .replace(DEFAULT_HOTKEY.to_string());
            }

            // Tray menu — "Show DevKit" restores the main window, "Quit" is the
            // only real exit path now that main-window close hides instead.
            let show_item = MenuItem::with_id(app, "show", "Show DevKit", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit DevKit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().cloned().ok_or("no default window icon")?)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            // Main window: close hides instead of exiting so the background
            // hotkey + tray keep working. The window handle is cloned into the
            // closure; the event api prevents the real close.
            let main_window = app
                .get_webview_window("main")
                .ok_or("main window not found")?;
            let main_for_close = main_window.clone();
            main_window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = main_for_close.hide();
                }
            });

            // The spotlight window is mutated exclusively through the
            // spotlight_* commands; drop the handle now that setup is done.
            drop(spotlight);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
