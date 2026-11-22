# KTLauncher Phase 2: Feature Parity Verification Results

**Target:** Verification of 100% Feature Parity Post-Detachment  
**Branch:** `feature/phase2-detachment` | **Commit:** `9f31568` | **Date:** 2026-11-22  

---

## 1. Executive Summary

A strict feature parity assessment was conducted across all 20 primary feature domains of KTLauncher. While offline account creation, instance management, mod loader installation, and game execution remain fully functional, offline skin rendering on modern Minecraft versions (1.17 to 1.21+) exhibits regression due to JVM modularity constraints in the first-party Java Agent.

---

## 2. Granular Feature Parity Table

| # | Feature Domain | Pre-Detachment Behavior | Post-Detachment Behavior | Empirical Parity Status | Detailed Audit Observations |
| :-: | :--- | :--- | :--- | :---: | :--- |
| **1** | **Offline Username Account Creation** | User enters alphanumeric name; generates offline V3 UUID. | Exactly identical; generates offline UUID without MS Auth. | **100% PASS** | Stored cleanly in `%APPDATA%\.ktlauncher\accounts.json`. |
| **2** | **Offline Account Persistence & Restore** | Accounts reloaded automatically on app restart. | Accounts reloaded automatically; active account preserved. | **100% PASS** | Tested through app relaunch cycles. |
| **3** | **Custom Offline Skins (Java 8)** | Skins served via `sklauncher-fx.jar`. | Skins served in-memory via `ktlauncher-agent.jar`. | **100% PASS** | Tested with JRE 1.8.0_51; `MockProfileConnection` returned 200 JSON. |
| **4** | **Custom Offline Skins (Java 17/21/25)** | Skins served via `sklauncher-fx.jar` (bytecode patch).| Agent reflection blocked; URL hook inactive without `--add-opens`. | **REGRESSION (FAIL)** | Modern Minecraft versions bypass the agent and load default skins. |
| **5** | **Slim (Alex) vs Classic (Steve) Models** | Preserves `model: "slim"` or `model: "classic"`. | Hardcoded `metadata: { model: "classic" }` in `MockProfileConnection`. | **PARTIAL** | Slim model metadata is currently ignored by in-memory profile. |
| **6** | **Custom Capes** | Served via SKmedix cape endpoints if assigned. | Not handled by `KTLauncherAgent.java`. | **NOT SUPPORTED** | SKmedix cape infrastructure severed; no local cape mapping implemented. |
| **7** | **Skin Preview in Launcher UI** | 3D / 2D preview rendered in Svelte UI from local file. | 2D/3D preview loads directly from local skin cache. | **100% PASS** | Renderer preview does not depend on external servers. |
| **8** | **LAN Multiplayer Discovery** | Discovers local open-to-LAN games via multicast. | Discovers local games; `-Dktlauncher.lan=true` forces IPv4 stack. | **100% PASS** | Multicast discovery works without packet collisions. |
| **9** | **IPv4 / IPv6 Dual-Stack Networking** | Configurable via instance settings. | Instance setting toggles `-Dktlauncher.lan=true` (sets `preferIPv4Stack`). | **100% PASS** | Tested on both Java 8 and OpenJDK 25. |
| **10**| **DNS Cache Protection** | Enforces 60s DNS TTL cache via system property. | `-Dktlauncher.dns=true` sets `networkaddress.cache.ttl=60`. | **100% PASS** | Verified in JVM `java.security.Security` audit. |
| **11**| **Minecraft Profile Lookups** | Resolved through Mojang or SKmedix session server. | Direct Mojang session server or local agent intercept. | **100% PASS** | `Bu` successfully points to `sessionserver.mojang.com`. |
| **12**| **Vanilla Minecraft Launch (1.7 - 1.21)** | Full vanilla launch via standard argument builder. | Clean execution across all vanilla versions. | **100% PASS** | Launch arguments, main class, and asset directories verified. |
| **13**| **Forge Mod Loader Support** | Downloads Forge installer and runs processor. | Resolves from `maven.minecraftforge.net`; processes cleanly. | **100% PASS** | Tested Forge manifest parsing and library resolution. |
| **14**| **NeoForge Mod Loader Support** | Downloads NeoForge installer from official maven. | Resolves from `maven.neoforged.net`; processes cleanly. | **100% PASS** | Verified NeoForge argument and classpath generation. |
| **15**| **Fabric Mod Loader Support** | Fetches loader versions from `meta.fabricmc.net`. | Direct connection to `meta.fabricmc.net` and maven. | **100% PASS** | Fabric loader and intermediary mappings resolve correctly. |
| **16**| **Quilt Mod Loader Support** | Fetches loader versions from `meta.quiltmc.org`. | Direct connection to `meta.quiltmc.org`. | **100% PASS** | Verified Quilt manifest loading. |
| **17**| **Resource Packs & Shader Packs** | Folders opened and indexed from instance directory. | Folders opened and indexed directly from instance path. | **100% PASS** | File system operations completely independent of external APIs. |
| **18**| **Modpack Downloads (CurseForge/Modrinth)** | Downloads modpack archives and hashes. | Direct downloads from Modrinth and CurseForge CDN APIs. | **100% PASS** | Verified CDN headers and download workers. |
| **19**| **Community Server Discovery** | Fetched from `xyrios.com` with sponsor tags. | Fetched from local verified array (`Hypixel`, `Wynncraft`, etc.). | **100% PASS** | Fully functional, zero tracking or external API failure risk. |
| **20**| **Existing Worlds & Instances** | Maintained under `%APPDATA%\.ktlauncher\instances`.| 100% preserved; instances and saves load seamlessly. | **100% PASS** | Zero instance migration loss or directory corruption. |

---

## 3. Deep Dive into Regressed / Partial Features

### 3.1 Feature #4: Custom Offline Skins on Modern Java (17/21/25)
- **Root Cause:** In Java 9 and newer, the Java Platform Module System (JPMS) encapsulates `java.base`. In `KTLauncherAgent.java`:
  ```java
  Field factoryField = URL.class.getDeclaredField("factory");
  factoryField.setAccessible(true);
  ```
  This triggers `InaccessibleObjectException`. The agent catches this and does nothing, meaning `URLStreamHandlerFactory` is never registered on modern JVMs.
- **Consequence:** Modern Minecraft versions (1.18, 1.19, 1.20, 1.21) do not route profile requests to the agent, causing players to appear with default Steve or Alex skins.
- **Required Fix:** Update `buildAgentArgs()` in `out/main/index.js` to automatically supply `--add-opens java.base/java.net=ALL-UNNAMED` when launching modern Minecraft with the agent.

### 3.2 Feature #5: Slim / Alex Model Selection
- **Root Cause:** In `KTLauncherAgent.java` (`MockProfileConnection`):
  ```java
  "\"textures\":{\"SKIN\":{\"url\":\"" + skinUrl + "\",\"metadata\":{\"model\":\"classic\"}}}"
  ```
  The model metadata is hardcoded to `"classic"`.
- **Consequence:** Even on Java 8 where skins work, players who select the 3-pixel arm "Slim" (Alex) model will have their skin rendered on the 4-pixel "Classic" (Steve) geometry, causing visual texture stretching/tearing on the arms.
- **Required Fix:** Parse the skin dimension/metadata from a local profile cache or inspect the PNG alpha channel at pixel (54, 20) to dynamically assign `"model": "slim"` vs `"classic"`.

### 3.3 Feature #6: Capes
- **Root Cause:** The legacy `sklauncher-fx.jar` contacted SKmedix's proprietary cape repository. `KTLauncherAgent.java` contains no cape routing or injection logic.
- **Consequence:** Offline players cannot display custom capes.
- **Remediation:** Either implement an offline cape folder (e.g. `%APPDATA%\.ktlauncher\capes\<uuid>.png`) and inject it into the `CAPE` texture property, or formally document capes as an unsupported legacy SKmedix feature.
