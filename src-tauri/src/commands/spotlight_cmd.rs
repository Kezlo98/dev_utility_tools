//! Spotlight quick-access launcher — Rust backbone.
//!
//! The `spotlight` window is created hidden at startup (see `lib.rs::run`).
//! These commands are the frontend's only handles for changing that window's
//! visibility/size, plus the user-configurable global hotkey rebind.
//!
//! Toggle-state ownership lives in the frontend (Phase 3): the platform hotkey
//! handler emits a single `spotlight:hotkey-pressed` event on every press and
//! the React side decides show / hide / reset-to-search from its own state,
//! then calls back into these commands to mutate the OS window.

use std::sync::Mutex;

use tauri::{AppHandle, Emitter, LogicalSize, Manager, Runtime, State, WebviewWindow};

use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutEvent, ShortcutState};

/// Spotlight "bar" (search) dimensions in logical pixels.
const BAR_WIDTH: f64 = 640.0;
const BAR_HEIGHT: f64 = 420.0;
/// Spotlight "tool" view dimensions in logical pixels — small but large enough
/// for the shared `ToolPageShell`.
const TOOL_WIDTH: f64 = 720.0;
const TOOL_HEIGHT: f64 = 560.0;

/// Per-app record of the currently-registered hotkey combo, so a failed rebind
/// can restore the previous working registration instead of leaving nothing
/// registered.
#[derive(Default)]
pub struct HotkeyState {
    pub current: Mutex<Option<String>>,
}

/// Map any `Display` error into a `String`, so the Tauri window calls (which
/// return `tauri::Result`) compose with these commands' `Result<_, String>`.
fn to_str<T, E: std::fmt::Display>(result: Result<T, E>) -> Result<T, String> {
    result.map_err(|e| e.to_string())
}

/// Global hotkey handler shared by the initial registration and every rebind.
/// Fires on key-down only (global-hotkey emits both Pressed and Released) and
/// tells the spotlight window the hotkey was pressed — no state logic here.
pub fn on_hotkey_pressed<R: Runtime>(
    app: &AppHandle<R>,
    _shortcut: &Shortcut,
    event: ShortcutEvent,
) {
    if event.state != ShortcutState::Pressed {
        return;
    }
    if let Some(window) = app.get_webview_window("spotlight") {
        let _ = window.emit("spotlight:hotkey-pressed", ());
    }
}

fn spotlight_window<R: Runtime>(app: &AppHandle<R>) -> Result<WebviewWindow<R>, String> {
    app.get_webview_window("spotlight")
        .ok_or_else(|| "spotlight window is not registered".to_string())
}

/// Show the spotlight bar: resize to bar dimensions, center on the primary
/// screen, reveal, and focus. Emits `spotlight:shown` so the frontend can sync.
#[tauri::command]
pub fn spotlight_show<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    let window = spotlight_window(&app)?;
    to_str(window.set_size(LogicalSize::new(BAR_WIDTH, BAR_HEIGHT)))?;
    to_str(window.center())?;
    to_str(window.show())?;
    let _ = window.set_focus();
    to_str(window.emit("spotlight:shown", ()))?;
    Ok(())
}

/// Hide the spotlight window.
#[tauri::command]
pub fn spotlight_hide<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    let window = spotlight_window(&app)?;
    to_str(window.hide())?;
    to_str(window.emit("spotlight:hidden", ()))?;
    Ok(())
}

/// Shrink back to the bar (search) state without hiding. Emits
/// `spotlight:reset-to-search` so the React side swaps its active tool out.
#[tauri::command]
pub fn spotlight_reset_to_search<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    let window = spotlight_window(&app)?;
    to_str(window.set_size(LogicalSize::new(BAR_WIDTH, BAR_HEIGHT)))?;
    to_str(window.center())?;
    let _ = window.set_focus();
    to_str(window.emit("spotlight:reset-to-search", ()))?;
    Ok(())
}

/// Grow into the tool view state. Emits `spotlight:show-tool` so the React
/// side knows the resize completed and can render the picked tool.
#[tauri::command]
pub fn spotlight_show_tool<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    let window = spotlight_window(&app)?;
    to_str(window.set_size(LogicalSize::new(TOOL_WIDTH, TOOL_HEIGHT)))?;
    to_str(window.center())?;
    let _ = window.set_focus();
    to_str(window.emit("spotlight:show-tool", ()))?;
    Ok(())
}

/// Re-register the global hotkey to `combo`.
///
/// On success the new combo replaces the old. On failure the old combo is
/// re-registered (so the shortcut is never left unregistered) and the error
/// is returned as a string for the frontend to show inline. If re-registering
/// the old combo *also* fails, state is cleared to `None` and the error names
/// both failures so the user knows nothing is currently registered.
#[tauri::command]
pub fn set_global_hotkey<R: Runtime>(
    app: AppHandle<R>,
    combo: String,
    state: State<'_, HotkeyState>,
) -> Result<(), String> {
    let global = app.global_shortcut();

    // No-op rebinding to the combo that's already live: skip the unregister /
    // re-register dance so we never risk dropping a working registration.
    if state
        .current
        .lock()
        .unwrap()
        .as_deref()
        .map(|c| c == combo)
        .unwrap_or(false)
    {
        return Ok(());
    }

    // Hold the lock across the whole unregister → register → restore sequence
    // so two concurrent invokes (e.g. a double-clicked "Save") can't interleave.
    // Shortcut (un)registration is fast and runs on the main thread, so holding
    // the lock across it is acceptable.
    let mut current = state.current.lock().unwrap();
    if let Some(ref old) = *current {
        let _ = global.unregister(old.as_str());
    }

    match global.on_shortcut(combo.as_str(), on_hotkey_pressed::<R>) {
        Ok(()) => {
            *current = Some(combo);
            Ok(())
        }
        Err(err) => {
            // Restore the previous combo. If the restore itself fails, clear
            // state rather than pretend a hotkey is still registered.
            let restored = match current.as_ref() {
                Some(old) => global.on_shortcut(old.as_str(), on_hotkey_pressed::<R>).is_ok(),
                None => true,
            };
            if !restored {
                *current = None;
                return Err(format!(
                    "Could not register hotkey '{combo}' ({err}) and the previous hotkey could not be restored; no hotkey is currently registered"
                ));
            }
            Err(format!("Could not register hotkey '{combo}': {err}"))
        }
    }
}
