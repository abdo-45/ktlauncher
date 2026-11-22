# KTLauncher Phase 3 — Electron Security Hardening & Audit Report

**Target Release:** KTLauncher v1.0.2  
**Date:** 2026-11-22  
**Status:** ✅ **VERIFIED & SECURED**  

---

## 1. Executive Summary

Phase 3 establishes defense-in-depth architectural hardening for the KTLauncher Electron runtime environment. All identified surface vulnerabilities and legacy packaging risks have been systematically addressed, verified, and locked down without compromising any user-facing feature, offline capability, or modded Minecraft launch flow.

---

## 2. Security Hardening Specifications & Implementation

### 2.1 Process Sandboxing (`sandbox: true`)
- **Status:** ✅ **ENFORCED**
- **Implementation:** Both the primary dashboard window (`eu()`) and the secondary instance console window (`vD()`) explicitly configure `sandbox: true` in their `webPreferences`.
- **Preload Isolation:** The preload script exclusively consumes `@electron-toolkit/preload` and standard Electron `contextBridge`/`ipcRenderer` capabilities. No Node native modules, raw OS file handles, or unsanitized primitives leak into the renderer DOM.

### 2.2 Content-Security-Policy (CSP) Lockdown
- **Status:** ✅ **ENFORCED**
- **Directives:**
  ```http
  default-src 'self' data: blob:;
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https: starship-icon:;
  media-src 'self';
  connect-src 'self' data: https://piston-meta.mojang.com https://launchermeta.mojang.com https://resources.download.minecraft.net https://libraries.minecraft.net https://raw.githubusercontent.com;
  object-src 'none';
  base-uri 'self';
  frame-src 'self' https://www.youtube.com/embed/ https://www.youtube-nocookie.com/embed/;
  ```
- **Auditing:**
  - Removed all `'unsafe-eval'` directives from `script-src`.
  - Removed all `'unsafe-inline'` directives from `script-src`.
  - Prohibited arbitrary plugin execution via `object-src 'none'`.
  - Confirmed zero inline scripts in `index.html` (all renderer logic executes from compiled ES modules).

### 2.3 Web Contents Navigation & New Window Controls
- **Status:** ✅ **ENFORCED**
- **Window Open Handler:** Registered `setWindowOpenHandler(() => ({ action: 'deny' }))` across all browser windows to block popup exploitation and unsolicited window creation.
- **Navigation Controls:** `will-navigate` enforces strict origin matching:
  - In development: restricts navigation to the configured dev server.
  - In production: permits exclusively `file://` scheme loading.
  - Dangerous URL schemes (`javascript:`, `data:`, `vbscript:`, etc.) are intercepted and aborted.

### 2.4 Strict Permission Request Model (Default-Deny)
- **Status:** ✅ **ENFORCED**
- **Implementation:**
  - Configured `session.defaultSession.setPermissionRequestHandler` with a strict whitelist.
  - Only `clipboard-read`, `clipboard-sanitized-write`, and `notifications` are approved upon request.
  - All other hardware and sensor capabilities (geolocation, camera, microphone, midi, pointerLock, mediaKeySystem) are denied by default.
  - Paired with `setPermissionCheckHandler` for consistent capability checks.

### 2.5 IPC Boundary Sanitization
- **Status:** ✅ **INVENTORIED & HARDENED**
- **Inventory:** 232 `ipcMain.handle` channels and 4 `ipcMain.on` channels documented in `docs/PHASE3_IPC_INVENTORY.md`.
- **Validation:** 
  - Path parameters are validated against expected launcher directories. Directory traversal attempts are rejected.
  - Sensitive operations (token storage, authentication) execute isolated routines without leaking credentials to the DOM.
  - Launch hooks pass argument arrays directly to child process spawners rather than evaluating unescaped shell strings.

### 2.6 Cryptographic Signing & Publisher Verification (Carried from Phase 2)
- **Status:** ✅ **VERIFIED**
- **Java Agent Integrity:** `ktlauncher-agent.jar` is signed via Ed25519 with the pinned publisher key embedded in `out/main/index.js`.
- **Tamper Resistance:** Mismatched or absent signatures automatically degrade to safe fallback without breaking Minecraft execution.

---

## 3. Verification & Test Summary

| Test ID | Control Description | Expected Result | Live Result | Status |
|---|---|---|---|---|
| **SEC-01** | Window Sandbox Verification | `sandbox: true` on all webPreferences | Confirmed active on both windows | **PASS** |
| **SEC-02** | CSP Script Evaluation Check | No `unsafe-eval` in script-src | Evaluated cleanly, 0 eval occurrences | **PASS** |
| **SEC-03** | CSP Inline Script Check | No `unsafe-inline` in script-src | Only bundled ES modules execute | **PASS** |
| **SEC-04** | Permission Request Lockdown | Geolocation/Media denied | Default-deny rejects unauthorized calls | **PASS** |
| **SEC-05** | Window Open Navigation Deny | Window popups blocked | Returns `{ action: 'deny' }` | **PASS** |
| **SEC-06** | Dangerous Scheme Interception | `javascript:` URLs blocked | Aborted by will-navigate handler | **PASS** |
| **SEC-07** | Fresh Distribution Sanitization | 0 personal paths / user accounts | Confirmed 0 occurrences | **PASS** |
| **SEC-08** | Asar Integrity Hash Patch | Signed header matches EXE table | Offsets match, 0 launch warnings | **PASS** |
