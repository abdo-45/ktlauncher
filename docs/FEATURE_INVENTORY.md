# KTLauncher Feature Inventory & Architectural Implementation Map

**Document Version:** 1.0.0  
**Audit Date:** 2026-11-22  
**Auditor:** Senior Electron Security Engineer & Reverse-Engineering Specialist  
**Application Target:** KTLauncher Offline Edition (v1.0.1)

---

## Executive Summary

KTLauncher is a high-performance, full-featured Minecraft Java Edition launcher built on Electron 43.8.11, Chromium 150.0.7871.250, and Node.js 24.22.1. The renderer layer utilizes compiled Svelte components bundled via Rolldown into single-page application artifacts, while the main process handles operating system integrations, process management, file storage, network communications, and the Minecraft Java launch pipeline.

This document inventories every existing feature, its architectural implementation, IPC interfaces, and internal dependencies prior to executing detachment and security hardening.

---

## 1. Authentication & Profile Architecture

### 1.1 Offline Account Management (Primary Feature)
- **Description:** Allows instant account creation and management without external Microsoft authentication or internet connectivity.
- **Implementation:**
  - Method: `auth.loginOffline(username)` in `out/main/index.js` (`ly(username)` generates an offline UUID v3 derived from `OfflinePlayer:<username>`).
  - Storage: Saved to `ktlauncher-accounts.json` in root folder and `%APPDATA%\.ktlauncher\accounts.json`.
  - Format: JSON structure storing `id`, `type: "offline"`, `username`, `uuid`, and optionally local `skin` data URI.
  - Portability: Users can copy `ktlauncher-accounts.json` across machines; the launcher auto-syncs state on launch.
- **IPC Handlers:**
  - `auth:login-offline`
  - `auth:get-accounts`
  - `auth:get-active-account`
  - `auth:switch-account`
  - `auth:logout`

### 1.2 Microsoft Authentication (Optional Hybrid Support)
- **Description:** Official OAuth 2.0 device/browser authentication for verified Mojang accounts.
- **Implementation:**
  - OAuth endpoints against `login.microsoftonline.com` and Xbox Live authentication chain (`user.auth.xboxlive.com`, `xsts.auth.xboxlive.com`).
  - Minecraft Services token exchange (`api.minecraftservices.com/authentication/login_with_xbox`).
  - Secure storage using Electron's `safeStorage` API on Windows (DPAPI) to encrypt refresh and access tokens.
- **IPC Handlers:**
  - `auth:login-microsoft`
  - `auth:cancel-microsoft-login`
  - `auth:refresh-token`
  - `auth:is-token-expired`

---

## 2. Instance & Profile Management

### 2.1 Instance Creation, Editing & Cloning
- **Description:** Full instance isolation, allowing separate directories, mod setups, game settings, and Minecraft versions.
- **Implementation:**
  - Storage: `%APPDATA%\.ktlauncher\instances.json`.
  - Directory: Each instance defaults to `%APPDATA%\.ktlauncher\instances\<instance-id>`.
  - Properties: `name`, `icon`, `gameType`, `minecraftVersion`, `loader`, `loaderVersion`, `javaPath`, `jvmArgs`, `envVars`, `preLaunchCommand`, `wrapperCommand`, `postExitCommand`, `gameDir`.
- **IPC Handlers:**
  - `instances:create`
  - `instances:duplicate`
  - `instances:update`
  - `instances:delete`
  - `instances:purge`
  - `instances:change-version`
  - `instances:get`
  - `instances:list`

### 2.2 Instance Import & Migration Tools
- **Description:** Native migration wizards for importing existing Minecraft installations and instances from other launchers.
- **Supported Sources:**
  1. `official`: Standard Mojang launcher (`%APPDATA%\.minecraft\launcher_profiles.json`).
  2. `sklauncher3`: Legacy SKlauncher installations (`.minecraft/sklauncher.json`, `.minecraft/accounts.bin`).
  3. `curseforge`: CurseForge app instances (`%APPDATA%\curseforge\minecraft\Instances`).
  4. `modrinth`: Modrinth App profiles (`%APPDATA%\ModrinthApp\profiles`).
  5. `prism`: Prism Launcher instances (`%APPDATA%\PrismLauncher\instances`).
- **IPC Handlers:**
  - `instances:import-default-path`
  - `instances:import-detect-sklauncher3`
  - `instances:import-analyze-shared`
  - `instances:import-list`
  - `instances:import-run`

### 2.3 Modpack Export (`.skpack`, `.mrpack`)
- **Description:** Packaging local instances into shareable modpack archives with manifest generation.
- **IPC Handlers:**
  - `instances:export-skpack`
  - `instances:export-skpack-preview`

---

## 3. Java Runtime Management

### 3.1 JRE Component Provisioning
- **Description:** Automatic discovery, download, installation, and verification of Java Runtimes required for different Minecraft generations (Java 8 for 1.16.5 and below, Java 16/17 for 1.17-1.20.4, Java 21 for 1.20.5+).
- **Implementation:**
  - Manifest: Fetches Mojang official runtime manifest (`https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json`).
  - Extraction: Downloads runtime components (e.g. `java-runtime-gamma`, `java-runtime-delta`), extracts binaries into `%APPDATA%\.ktlauncher\runtime\<component>`, and verifies SHA-1 signatures.
- **IPC Handlers:**
  - `java:is-installed`
  - `java:is-available`
  - `java:get-installed`
  - `java:get-available`
  - `java:get-executable-path`
  - `java:install`
  - `java:delete`
  - `java:verify`
  - `java:get-disk-usage`

---

## 4. Minecraft Java Launch Pipeline

### 4.1 Dependency Resolution & Asset Pipeline
- **Description:** Constructs classpath, extracts platform-specific native libraries, builds Minecraft asset indexes, and verifies integrity.
- **Implementation:**
  - Manifest: `https://piston-meta.mojang.com/mc/game/version_manifest_v2.json`.
  - Assets: `https://resources.download.minecraft.net`.
  - Libraries: `https://libraries.minecraft.net/`.
  - Extraction of natives (LWJGL dlls) into temporary directories per launch (`natives-<timestamp>`).

### 4.2 Mod Loader Integrations
- **Forge:** Downloads installer from official Forge maven (`https://maven.minecraftforge.net`), extracts server/client universal jars, processes client arguments.
- **NeoForge:** Downloads from NeoForged maven (`https://maven.neoforged.net/releases/net/neoforged`).
- **Fabric:** Resolves metadata from Fabric Meta API (`https://meta.fabricmc.net/v2`).
- **Quilt:** Resolves metadata from Quilt Meta API (`https://meta.quiltmc.org/v3`).
- **Babric & Legacy Fabric:** Resolves via Babric and LegacyFabric meta endpoints.

### 4.3 Custom Java Agent & Offline Skin Injection
- **Description:** Injects offline skin and custom networking support into the running JVM via `-javaagent`.
- **Implementation:**
  - Injects `-javaagent:<path>/sklauncher-fx.jar`.
  - Adds system properties `-Dktlauncher.dns=true` and `-Dktlauncher.lan=true`.
  - Agent hooks into Minecraft's `YggdrasilMinecraftSessionService` to intercept skin texture requests for offline UUIDs and serve local skins from the launcher data directory.

### 4.4 Custom Launch Hooks
- **Description:** Advanced command hooks executing before game start, wrapping the game process, or after exit.
- **Properties:**
  - `preLaunchCommand`: Executed before Java startup.
  - `wrapperCommand`: Wraps the Java command line (e.g., MangoHud, optirun, gamemoderun).
  - `postExitCommand`: Executed after the game process terminates.

---

## 5. Mod & Content Browser (Content Hub)

### 5.1 Modrinth & CurseForge Integration
- **Description:** Integrated in-app browser and 1-click installer for mods, modpacks, resource packs, shaders, datapacks, and worlds.
- **APIs:**
  - Modrinth API v2 (`https://api.modrinth.com/v2`).
  - CurseForge Core API v1 (`https://api.curseforge.com/v1`).
- **Features:** Search, category filtering, loader filtering (Forge, NeoForge, Fabric, Quilt), version compatibility matching, dependency resolution, auto-update checking, duplicate file detection.
- **IPC Handlers:**
  - `content:modrinth-search`
  - `content:curseforge-search`
  - `content:install-mod`
  - `content:install-content`
  - `content:check-updates`
  - `content:find-duplicate-mods`
  - `content:resolve-dependencies`

---

## 6. Skin & Cape Customization System

### 6.1 3D Skin Preview & Presets
- **Description:** Real-time 3D Minecraft player preview using WebGL and `skinview3d`.
- **Features:** Classic (Steve) and Slim (Alex) models, custom cape toggling, local skin library storage (`skin-library.json` and base64 storage), presets management.
- **IPC Handlers:**
  - `skin:get`
  - `skin:upload`
  - `skin:reset`
  - `cape:equip`
  - `cape:unequip`
  - `skin-preset:list`
  - `skin-preset:create`

---

## 7. Quick Play & Playtime Tracking

### 7.1 Quick Play
- **Description:** Allows direct joining of specific worlds or multiplayer servers directly from the launcher dashboard or Windows Jump List.
- **Implementation:** Passes `--quickPlayPath`, `--quickPlaySingleplayer`, or `--quickPlayMultiplayer` to supported Minecraft versions (1.20+).
- **IPC Handlers:**
  - `quickplay:get-instances`
  - `quickplay:set-pinned`
  - `quickplay:update-instance`
  - `jumplist:set-recents`

### 7.2 Playtime Tracking
- **Description:** Tracks total hours, session durations, and date-based play history per instance.
- **Storage:** `%APPDATA%\.ktlauncher\playtime-sessions.json`.
- **IPC Handlers:** `playtime:get-summary`.

---

## 8. Social, Friends & Server Discovery

### 8.1 Server Discovery
- **Description:** Curated and community server listings with real-time player counts, ping, and 1-click modpack install.
- **Legacy Provider:** `https://xyrios.com/api/servers` and `https://cdn.xyrios.com/api/servers.json`.

### 8.2 Friends System
- **Description:** Presence notifications, friend requests, and blocklists.
- **Legacy Provider:** Xyrios social backend.

---

## 9. Security & Malware Mitigation Tools

### 9.1 System Threat Scanner
- **Description:** Scans for known malware strains targeting the Minecraft ecosystem:
  - Fractureiser (`lib.jar`, `client.jar`, `run.bat`).
  - Weedhack (`SecurityUpdates`, `Updater.vbs`, `JavaSecurityUpdater`).
- **IPC Handlers:** `security:scan-system`, `security:run-manual-scan`.

### 9.2 Hosts File Scanner & Cleaner
- **Description:** Detects malicious or legacy hosts file entries (`C:\Windows\System32\drivers\etc\hosts`) that hijack Mojang or launcher authentication endpoints, and offers UAC-elevated PowerShell cleanup with timestamped backups.
- **IPC Handlers:** `security:scan-hosts`, `security:repair-hosts`.

---

## 10. Update & Release Engine

### 10.1 GitHub Releases Updater
- **Description:** Checks for newer launcher builds via GitHub Releases API, checks semantic versioning, and provides direct binary downloads.
- **Repository:** `jalemluv/ktlauncher` (configurable to target `abdo-45/ktlauncher`).
- **IPC Handlers:** `updater:check-now`, `updater:download-and-install`, `updater:install-and-restart`.
