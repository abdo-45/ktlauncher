# KTLauncher Security Baseline & Vulnerability Assessment

**Document Version:** 1.0.0  
**Audit Date:** 2026-11-22  
**Target:** KTLauncher Offline Edition (v1.0.1)  
**Standard:** Electron Security Checklist / OWASP Desktop Application Security Baseline

---

## 1. Electron Security Configuration Matrix

| Security Setting | Observed Value | Recommended Standard | Severity / Risk | Remediation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **`sandbox`** | `false` (both main and console windows) | `true` | **HIGH** | Preload only requires Electron IPC and platform detection; enable `sandbox: true` on all `BrowserWindow` instances. |
| **`contextIsolation`** | `true` | `true` | **PASS** | Maintained. Isolates renderer window context from preload script scope. |
| **`nodeIntegration`** | `false` | `false` | **PASS** | Maintained. Node.js primitives are not directly exposed in the DOM. |
| **`webSecurity`** | `true` | `true` | **PASS** | Maintained. Enforces same-origin policy and CORS. |
| **Content Security Policy (CSP)** | Includes `unsafe-eval` and `unsafe-inline` | Strict CSP with no `unsafe-eval` and nonces/hashes | **HIGH** | Remove `unsafe-eval`, refactor inline styles/scripts into static external stylesheets, restrict connect-src to known origins. |
| **Window Open Handling** | Generic window handler | Strict `setWindowOpenHandler` denying unexpected windows | **MEDIUM** | Implement strict whitelist for external links, force opening via default system browser (`shell.openExternal`). |
| **Navigation Restrictions** | Unrestricted internal navigation | Restrict navigation to local file origins | **MEDIUM** | Intercept `will-navigate` and `will-redirect` events to prevent hijacking. |

---

## 2. Content Security Policy (CSP) Deep-Dive

### Current Policy in `out/renderer/index.html`:
```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: starship-icon:; media-src 'self' https://*.xyrios.com; connect-src 'self' data: https://*.xyrios.com https://piston-meta.mojang.com https://launchermeta.mojang.com; frame-src 'self' https://www.youtube.com/embed/ https://www.youtube-nocookie.com/embed/"
/>
```

### Vulnerability Analysis:
1. **`'unsafe-eval'` in `script-src`:**
   - *Risk:* Enables dynamic string execution (e.g. `eval()`, `new Function()`) inside the renderer, allowing stored XSS to escalate into full code execution.
   - *Action:* Eliminate `'unsafe-eval'`. The compiled Svelte/Rolldown renderer does not require dynamic eval.
2. **`'unsafe-inline'` in `style-src`:**
   - *Risk:* Allows inline `<style>` tags and `style="..."` attributes.
   - *Action:* Move inline CSS blocks into static stylesheets or attach sha256 hashes.
3. **Overly Permissive Hosts:**
   - *Risk:* `https://*.xyrios.com` is granted connect and media privileges.
   - *Action:* Remove third-party wildcards in favor of local asset streaming or verified first-party APIs.

---

## 3. IPC Architecture & Input Validation Audit

There are **232 `ipcMain.handle` channels** and **4 `ipcMain.on` channels** registered in `out/main/index.js`.

### 3.1 Path Traversal & Filesystem Hazards
The following channels accept paths or filenames from the renderer:
- `instances:open-directory`
- `instances:list-files`
- `instances:resolve-path`
- `instances:reveal-file`
- `instances:delete-file`
- `instances:rename-file`
- `instances:import-files`
- `instances:delete-mod`
- `instances:toggle-mod`

**Vulnerability:**
If the renderer sends unvalidated relative paths containing `..` or leading slashes, an attacker executing code in the renderer could manipulate or delete files outside the instance directory (e.g., in Windows System32 or user directories).

**Required Control:**
Implement a centralized path validation helper:
```js
function assertSafeSubpath(parentDir, userPath) {
  const resolved = path.resolve(parentDir, userPath);
  if (!resolved.startsWith(path.resolve(parentDir) + path.sep)) {
    throw new SecurityError("Access denied: path traversal attempt detected");
  }
  return resolved;
}
```

### 3.2 Arbitrary External URL Opening
Channel: `system:openExternal`
- **Vulnerability:** If called with arbitrary protocols (e.g. `file://`, `javascript:`, or malicious command protocol handlers), it could trigger local executable launching.
- **Required Control:** Whitelist protocols strictly to `http:` and `https:`. Validate URLs with the standard `URL` constructor before passing to `shell.openExternal`.

---

## 4. Process Execution & Launch Hooks Security

### 4.1 Custom Launch Hooks
The launch pipeline in `out/main/index.js` (lines 485674-488968) executes:
- `preLaunchCommand`
- `wrapperCommand`
- `postExitCommand`

**Vulnerability:**
Commands are executed via `child_process.exec(commandString)`. If an imported modpack or instance configuration contains an embedded malicious shell command (e.g., `calc.exe` or `powershell -enc ...`), it executes automatically with current user privileges.

**Required Controls (Phase 4):**
1. **Explicit Opt-in:** Commands must be disabled by default on imported instances.
2. **User Confirmation Prompt:** Show the exact command and working directory to the user before running for the first time.
3. **Safe Execution:** Discourage raw shell string concatenation; prefer argument arrays with `child_process.spawn`.

---

## 5. System Integrity & Elevated Operations Audit

### 5.1 Hosts File Repair (`security:repair-hosts`)
- **Mechanism:** Builds a PowerShell script that inspects `C:\Windows\System32\drivers\etc\hosts` and invokes an elevated UAC process (`Start-Process powershell -Verb RunAs`).
- **Audit Findings:**
  - The script creates a timestamped backup before modifying (`hosts.YYYYMMDD-HHmmss.bak`).
  - It uses regular expressions to target only lines matching known redirect targets.
- **Required Hardening:**
  - Verify that the elevated script is passed via safe, temporary, non-writable script paths to prevent race-condition script tampering (Time-of-Check to Time-of-Use).
  - Explicitly log the pre-repair and post-repair file hashes.

---

## 6. Authentication & Credential Storage

### 6.1 Token Protection
- **Mechanism:** Microsoft OAuth refresh tokens and access tokens are encrypted using Electron's `safeStorage.encryptString()` which leverages the Windows Data Protection API (DPAPI).
- **Vulnerability / Fallback Risk:** If `safeStorage.isEncryptionAvailable()` returns false, ensure tokens are NEVER written to disk in plaintext. Require explicit user re-login rather than downgrading to plaintext.
- **Offline Accounts:** Offline accounts store usernames and deterministic offline UUIDs. They contain zero passwords, zero tokens, and zero network secrets.

---

## 7. Archive Extraction & Supply Chain Security

### 7.1 Zip Slip & Extraction Safeguards
The launcher unpacks modpacks, archives, and runtime zips using `yauzl` and `tar`.
- **Zip Slip Risk:** Malicious ZIP archives containing entries like `../../../../AppData/Roaming/Microsoft/Windows/Start Menu/...` can overwrite arbitrary files during extraction.
- **Required Control:**
  Every ZIP entry filename must be validated against `path.normalize()` and verified to reside strictly within the intended destination directory before extraction.
