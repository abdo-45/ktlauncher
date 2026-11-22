# KTLauncher Phase 2: Independent Network & Endpoint Audit

**Audit Target:** All outbound network traffic, external API requests, hardcoded endpoints, and allowlists  
**Branch:** `feature/phase2-detachment` | **Commit:** `9f31568` | **Date:** 2026-11-22  

---

## 1. Executive Summary

This network audit evaluated every external network request initiated by KTLauncher across the application lifecycle. While major improvements were introduced (such as decoupling Xyrios community servers and severing the SKmedix session server for offline skin requests), multiple hardcoded SKmedix and legacy repository endpoints remain active in `out/main/index.js` due to minification regex mismatches during Phase 2 patching.

---

## 2. Comprehensive Endpoint Inventory & Status

| Minified Variable | Defined URL / Endpoint | Purpose / Context | Original Source | Phase 2 Claim | Empirical Audit Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `nf` (Line 28545) | `https://meta.skmedix.pl/v1/launcher/config.json` | Remote launcher configuration | SKmedix | Decoupled | **ACTIVE AT RUNTIME** (Line 597028) |
| `rf` (Line 28598) | `https://meta.skmedix.pl/v1/launcher/library-patches.json`| Dynamic library patch rules | SKmedix | Decoupled | **ACTIVE AT RUNTIME** (Line 149557) |
| `af` (Line 28660) | `https://beta.skmedix.pl/news.json` | Launcher news feed | SKmedix | Decoupled | **ACTIVE AT RUNTIME** (Line 596583) |
| `sr` (Line 28699) | `https://updates.skmedix.pl` | Auto-updater feed base | SKmedix | Decoupled | **ACTIVE AT RUNTIME** (Lines 416347, 417427) |
| `sf` (Line 28731) | `https://meta.skmedix.pl/v1/launcher` | Update manifests base | SKmedix | Decoupled | **ACTIVE AT RUNTIME** (Line 417400) |
| `xM` (Line 396884)| `https://files.skmedix.pl/servers.json`, `https://s2.skmedix.pl/servers.json` | Legacy agent download mirrors | SKmedix | Decoupled | **ACTIVE IN BM()** (Line 397199) |
| `Bu` (Line 28682) | `https://sessionserver.mojang.com/session/minecraft/profile` | Profile lookup | SKmedix -> Mojang | Decoupled | **SEVERED** (No longer hits SKmedix) |
| `Mm` (Line 415254)| `jalemluv` | Auto-updater GitHub owner | Obsolete repo | Decoupled | **ACTIVE AT RUNTIME** (Line 415467) |
| `Cm` (Line 415268)| `ktlauncher` | Auto-updater GitHub repo | Obsolete repo | Decoupled | **ACTIVE AT RUNTIME** (Line 415467) |
| `tf` (Line 28480) | `https://cdn.xyrios.com/api/servers.json` | Xyrios server catalog | Xyrios | Decoupled | **BYPASSED** (IPC handler returns static list) |
| `gs` (Line 28521) | `https://xyrios.com/api/servers` | Xyrios server details | Xyrios | Decoupled | **BYPASSED** (IPC handler returns static item) |
| — | `https://api.github.com/repos/abdo-45/ktlauncher/...`| First-party updates | Canonical repo | Implemented | **VERIFIED CONFIGURED** in `providers.json` |
| — | `https://launchermeta.mojang.com` | Official vanilla manifests | Mojang | Maintained | **VERIFIED ACTIVE** (Standard Minecraft requirement) |
| — | `https://piston-meta.mojang.com` | Official version manifests | Mojang | Maintained | **VERIFIED ACTIVE** (Standard Minecraft requirement) |
| — | `https://libraries.minecraft.net` | Mojang official libraries | Mojang | Maintained | **VERIFIED ACTIVE** (Standard Minecraft requirement) |
| — | `https://repo1.maven.org/maven2` | Maven Central | Upstream | Added | **VERIFIED ACTIVE** (Replaces `-skl` forks) |
| — | `https://maven.fabricmc.net` | Fabric mod loader maven | FabricMC | Maintained | **VERIFIED ACTIVE** (Standard mod loader) |
| — | `https://maven.minecraftforge.net`| Forge mod loader maven | Forge | Maintained | **VERIFIED ACTIVE** (Standard mod loader) |

---

## 3. Network Lifecycle Audit by Operation

### 3.1 Application Startup
- **Claim:** Zero external queries to SKmedix; reads only local providers and canonical update feeds.
- **Empirical Trace:**
  1. IPC call `remote:config-fetch` fires immediately after window initialization.
  2. Because the handler was not replaced in `out/main/index.js`, it performs an HTTP GET request to `nf` (`https://meta.skmedix.pl/v1/launcher/config.json`).
  3. IPC call `news:fetch` fires and performs an HTTP GET request to `af` (`https://beta.skmedix.pl/news.json`).
  4. Auto-updater initializes and configures feeds pointing to `updates.skmedix.pl` and GitHub repository `jalemluv/ktlauncher`.
- **Verdict:** **FAIL (SKmedix network traffic observed)**.

### 3.2 Account Creation (Offline)
- **Claim:** 100% offline; zero network calls.
- **Empirical Trace:**
  1. Creating an offline account with username `jalem` generates an offline V3 UUID (`d6b56262-19c6-30db-9332-097afbbd1d31`) locally via MD5 hashing.
  2. Account data is persisted to `%APPDATA%\.ktlauncher\accounts.json`.
  3. No network packets were emitted during creation.
- **Verdict:** **PASS**.

### 3.3 Skin Management & Resolution
- **Claim:** Local skins served in-memory via `ktlauncher-agent.jar` without hitting `sessionserver.skmedix.pl`.
- **Empirical Trace:**
  1. Skin resolution function `ko()` was patched to return immediately for `offline` accounts without network fetches.
  2. `Bu` was changed from `sessionserver.skmedix.pl` to `sessionserver.mojang.com`.
  3. However, in `BM()`, fallback logic still references `files.skmedix.pl` and `s2.skmedix.pl` if the agent is not found.
- **Verdict:** **PARTIAL**.

### 3.4 Community & Server Discovery
- **Claim:** Xyrios dependencies severed and replaced with first-party community catalog.
- **Empirical Trace:**
  1. `servers:fetch` IPC handler was successfully patched in `out/main/index.js` to return a verified local server list (`Hypixel`, `Wynncraft`, `MineLatino`).
  2. `servers:fetchOne` IPC handler returns structured details from the local array.
  3. No outbound HTTP traffic to `xyrios.com` or `cdn.xyrios.com` was initiated during server browser usage.
- **Verdict:** **PASS**.

### 3.5 Game Launch Pipeline
- **Claim:** Launches Minecraft with first-party agent and upstream libraries.
- **Empirical Trace:**
  1. Classpath construction resolves upstream `org.lwjgl:lwjgl-glfw:3.3.3` from Maven Central.
  2. Agent arguments `-javaagent:<path>\ktlauncher-agent.jar` are injected.
  3. However, on Java 17+, `URLStreamHandlerFactory` fails silently, causing the game to contact official Mojang session servers directly without local skin interception.
- **Verdict:** **PARTIAL**.

---

## 4. Allowlist & Content Security Policy (CSP) Audit

### 4.1 Electron Net Domain Allowlist (`$O` in `out/main/index.js`)
At line 571490 and 571656, the internal Electron domain allowlist still includes:
```javascript
"skmedix.pl", "xyrios.com"
```
**Finding:** These legacy domains are still explicitly trusted by the network interceptor and certificate verification handlers.

### 4.2 Renderer Content Security Policy (`out/renderer/index.html`)
The CSP meta tag in `out/renderer/index.html` contains:
```html
media-src 'self' https://*.xyrios.com;
connect-src 'self' data: https://*.xyrios.com https://piston-meta.mojang.com ...
```
**Finding:** The renderer process is still permitted to initiate connections and load media from arbitrary `xyrios.com` subdomains.

---

## 5. Localhost Redirection (Hosts Blocking) Test

To determine application resilience in the event of SKmedix domain seizure or shutdown, the following entries were simulated:
```
127.0.0.1  meta.skmedix.pl
127.0.0.1  beta.skmedix.pl
127.0.0.1  updates.skmedix.pl
127.0.0.1  sessionserver.skmedix.pl
127.0.0.1  files.skmedix.pl
127.0.0.1  s2.skmedix.pl
```

### Observed Behavior:
1. **Startup Delay:** The launcher hangs for ~5 seconds on startup while attempting to fetch `meta.skmedix.pl/v1/launcher/config.json`.
2. **Error Logging:** Console logs show `Failed to fetch remote config: Error: connect ECONNREFUSED 127.0.0.1:443`.
3. **News Card:** The news UI renders an empty state or error card because `beta.skmedix.pl/news.json` is unreachable.
4. **Conclusion:** KTLauncher is **not yet fully resilient** to SKmedix infrastructure termination. Complete detachment requires replacing these handlers with local provider fallbacks.
