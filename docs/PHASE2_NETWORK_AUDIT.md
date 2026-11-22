# KTLauncher Phase 2: Independent Network & Endpoint Audit

**Audit Target:** All outbound network traffic, external API requests, hardcoded endpoints, and allowlists  
**Branch:** `feature/phase2-detachment` | **Audit Date:** 2026-11-22 (Remediated & Verified)  

---

## 1. Executive Summary

This network audit evaluated every external network request initiated by KTLauncher across the application lifecycle. Following the surgical remediation of Phase 2, **zero active SKmedix, Xyrios, or legacy unapproved third-party endpoints remain anywhere in `out/main/index.js` or `out/renderer/`**.

All external network operations are routed exclusively through first-party canonical repositories (`abdo-45/ktlauncher`), official Minecraft infrastructure (`mojang.com`, `minecraft.net`), or upstream package repositories (`repo1.maven.org`).

---

## 2. Comprehensive Endpoint Inventory & Final Status

| Minified Variable | Defined URL / Endpoint | Purpose / Context | Original Source | Post-Remediation Status |
| :--- | :--- | :--- | :--- | :--- |
| `nf` (Line 28545) | `https://raw.githubusercontent.com/abdo-45/ktlauncher/main/config/config.json` | Remote config fallback | Canonical Repo | **SEVERED / ZERO NETWORK CALLS** (IPC returns static object) |
| `rf` (Line 28598) | `https://raw.githubusercontent.com/abdo-45/ktlauncher/main/patches/library-patches.json`| Dynamic library patches | Canonical Repo | **SEVERED / ZERO NETWORK CALLS** (Resolves from local manifest) |
| `af` (Line 28660) | `https://raw.githubusercontent.com/abdo-45/ktlauncher/main/news/news.json` | News feed | Canonical Repo | **VERIFIED CANONICAL** (Includes offline fallback) |
| `sr` (Line 28699) | `https://github.com/abdo-45/ktlauncher/releases` | Updates feed | Canonical Repo | **VERIFIED CANONICAL** |
| `sf` (Line 28731) | `https://github.com/abdo-45/ktlauncher/releases` | Manifests feed | Canonical Repo | **VERIFIED CANONICAL** |
| `xM` (Line 396884)| `[]` (Empty Array) | Legacy mirrors | Empty | **COMPLETELY PURGED** (Loop never executes) |
| `Bu` (Line 28682) | `https://sessionserver.mojang.com/session/minecraft/profile` | Profile lookup | Official Mojang | **VERIFIED OFFICIAL** |
| `Mm` (Line 415254)| `abdo-45` | Auto-updater owner | Canonical Repo | **VERIFIED CANONICAL** |
| `Cm` (Line 415268)| `ktlauncher` | Auto-updater repo | Canonical Repo | **VERIFIED CANONICAL** |
| `tf` (Line 28480) | `https://raw.githubusercontent.com/abdo-45/ktlauncher/main/servers/servers.json` | Community catalog | Canonical Repo | **VERIFIED CANONICAL** (Falls back to local array) |
| `gs` (Line 28521) | `https://raw.githubusercontent.com/abdo-45/ktlauncher/main/servers` | Server details | Canonical Repo | **VERIFIED CANONICAL** (Resolves from local array) |
| — | `https://launchermeta.mojang.com` | Official vanilla manifests | Official Mojang | **VERIFIED ACTIVE** (Standard Minecraft requirement) |
| — | `https://piston-meta.mojang.com` | Official version manifests | Official Mojang | **VERIFIED ACTIVE** (Standard Minecraft requirement) |
| — | `https://libraries.minecraft.net` | Mojang official libraries | Official Mojang | **VERIFIED ACTIVE** (Standard Minecraft requirement) |
| — | `https://repo1.maven.org/maven2` | Maven Central | Upstream Maven | **VERIFIED ACTIVE** (Replaces `-skl` forks) |
| — | `https://maven.fabricmc.net` | Fabric mod loader maven | FabricMC | **VERIFIED ACTIVE** (Standard mod loader) |
| — | `https://maven.minecraftforge.net`| Forge mod loader maven | Forge | **VERIFIED ACTIVE** (Standard mod loader) |

---

## 3. Network Lifecycle Audit by Operation

### 3.1 Application Startup
- **Empirical Trace:**
  1. `remote:config-fetch` resolves first-party default configuration directly in-process without emitting network packets.
  2. `news:fetch` contacts canonical `raw.githubusercontent.com/abdo-45/ktlauncher` with a 3000ms timeout and falls back to static welcome news if offline.
  3. Auto-updater initializes targeting `abdo-45/ktlauncher`.
- **Verdict:** **PASS (Zero SKmedix network traffic)**.

### 3.2 Account Creation (Offline)
- **Empirical Trace:**
  1. Creating an offline account with username `KTPlayer` generates an offline V3 UUID (`d6b56262-19c6-30db-9332-097afbbd1d31`) locally via MD5 hashing.
  2. Data is persisted to `%APPDATA%\.ktlauncher\accounts.json`.
  3. Zero network calls emitted.
- **Verdict:** **PASS**.

### 3.3 Skin Management & Resolution
- **Empirical Trace:**
  1. Offline skins are resolved in-memory by `KTLauncherAgent.java`.
  2. `xM` was emptied; zero requests made to `files.skmedix.pl` or `s2.skmedix.pl`.
  3. `sessionserver.skmedix.pl` is completely eliminated.
- **Verdict:** **PASS**.

### 3.4 Community & Server Discovery
- **Empirical Trace:**
  1. `servers:fetch` returns verified first-party servers (`Hypixel`, `Wynncraft`, `MineLatino`).
  2. Zero requests to `xyrios.com` or `cdn.xyrios.com`.
- **Verdict:** **PASS**.

---

## 4. Allowlist & Content Security Policy (CSP) Audit

### 4.1 Electron Net Domain Allowlist (`out/main/index.js`)
- `skmedix.pl` and `xyrios.com` were completely removed from the domain allowlist and replaced with `github.com` and `raw.githubusercontent.com`.

### 4.2 Renderer Content Security Policy (`out/renderer/index.html`)
- All occurrences of `https://*.xyrios.com` were stripped from `media-src` and `connect-src`.
