# Code Standards & Testing Guidelines

This document establishes the coding conventions, architecture standards, linting constraints, and testing patterns for both the React/TypeScript frontend and the Rust backend.

## 1. Quality Gates & Linting

Before any pull request is merged, all code must pass the local validation checks executed during CI:

- **Frontend Checks:**
  - TypeScript Compilation: `npm run typecheck` (executes `tsc --noEmit`)
  - Code Style: Prettier formatting checks (`npm run format` runs `prettier -w .`)
  - Static Linting: ESLint execution (`npm run lint` runs `eslint .`)
- **Backend Checks:**
  - Code Style: `cargo fmt --check` (in the `src-tauri` folder)
  - Static Analysis: `cargo clippy --all-targets -- -D warnings` (zero warnings allowed)

---

## 2. React & TypeScript Standards

### 2.1 File Naming & Folder Structure

- **Kebab-Case Names:** All TypeScript and TSX files must use lowercase kebab-case (e.g., [tool-page-shell.tsx](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/components/tool-page-shell.tsx), [app-store.ts](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/store/app-store.ts)).
- **Location:** Component primitives go into [ui/](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/components/ui). Main app views live in [components/](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/components). Individual tools live inside [tools/](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/tools) grouped by domain folders.

### 2.2 Component & Hook Patterns

- **Functional Components:** Components must be declared as standard functional components.
- **Strict Typing:** Avoid `any` type casting. Define strict interfaces for component props.
- **Styling:** Use standard CSS classes or Tailwind utility classes. Combine conditional styles using the [utils.ts](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/lib/utils.ts) `cn()` merger helper:
  ```typescript
  import { cn } from "@/lib/utils";

  className={cn("text-muted-foreground", isFavorite && "text-foreground")}
  ```
- **Web Crypto Over Libraries:** For standard cryptographic operations (like SHA hashing or CSPRNG generation), prioritize native `window.crypto.subtle` instead of installing third-party JS packages.

---

## 3. Rust Backend Standards

### 3.1 Code Organization

- **Snake-Case Invocations:** Command functions use snake_case (e.g., `bcrypt_hash`, `jwt_verify`). Tauri maps these to camelCase in JavaScript automatically.
- **Commands Directory:** All IPC commands must reside in separate files inside [src/commands/](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src-tauri/src/commands) and be registered in `devkit_lib::run()` inside [lib.rs](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src-tauri/src/lib.rs).

### 3.2 Error Handling & Thread Management

- **Stringified Results:** Commands must return `Result<T, String>` to allow Tauri to propagate errors directly as JS Promise rejections:
  ```rust
  pub async fn my_command(data: String) -> Result<String, String> {
      do_work(&data).map_err(|e| format!("Command failed: {e}"))
  }
  ```
- **Blocking Thread Offloading:** Any CPU-bound operation (e.g., password hashing with cost factors) must be spawned on Tauri's blocking runtime pool to prevent locking the main OS thread:
  ```rust
  tauri::async_runtime::spawn_blocking(move || sync_compute())
      .await
      .map_err(|e| format!("Task failed: {e}"))?
  ```
- **Core Logic Isolation:** Keep compute logic inside synchronous helper functions (e.g., `hash_bcrypt(&str, u32)`) and write unit tests directly in Rust beneath the command wrappers.

---

## 4. Testing Guidelines

Tests are split between Vitest (for frontend logic, utilities, and components) and Cargo tests (for Rust commands).

### 4.1 Frontend Testing (Vitest + React Testing Library)

- **Unit Tests:** Place next to the target utility file (e.g., `src/lib/cron-utils.test.ts`). Focus on edge cases, invalid inputs, and return shapes.
- **Smoke Tests:** The global suite [tool-registry.test.tsx](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/tests/smoke/tool-registry.test.tsx) automatically iterates through all registered tools, mounts them under `ToolPageShell`, and asserts that they mount without throwing exceptions or logging errors.
- **Mocks:** Mock Tauri's core bridge to allow browser tests to execute without a native runtime:
  ```typescript
  vi.mock("@tauri-apps/api/core", () => ({
    invoke: vi.fn().mockResolvedValue(undefined),
  }));
  ```

### 4.2 Backend Testing (`cargo test`)

- Write tests in standard `mod tests` blocks at the bottom of command source files (e.g., [bcrypt_cmd.rs](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src-tauri/src/commands/bcrypt_cmd.rs#L50-L79)).
- Verify input validations, cost boundary clamping, signature verify fails, and encoding/decoding round-trips.

## Related Documents

- [codebase-summary.md](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/docs/codebase-summary.md) - Project organization overview
- [system-architecture.md](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/docs/system-architecture.md) - Tauri bridge detailed architecture
- [design-guidelines.md](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/docs/design-guidelines.md) - UI design conventions
