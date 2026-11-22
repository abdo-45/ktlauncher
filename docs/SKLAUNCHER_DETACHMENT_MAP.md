# KTLauncher vs SKlauncher Detachment & Independence Map

**Document Version:** 1.0.0  
**Audit Date:** 2026-11-22  
**Target:** KTLauncher Offline Edition (v1.0.1)

---

## 1. Complete Classification Taxonomy

Each legacy SKlauncher/SKmedix reference discovered during the Phase 1 codebase audit is categorized according to the official project taxonomy:

- **Category A:** Core runtime dependency (local configuration, storage directories, marker files).
- **Category B:** Downloaded executable or Java dependency (binary JARs, native agents, custom Maven artifacts).
- **Category C:** External API or backend (remote endpoints, metadata feeds, update servers).
- **Category D:** User-data migration / import compatibility (importing legacy profiles, detecting existing instances).
- **Category E:** Branding, attribution, or leftover code (dead strings, old URLs, unused constants).

---

## 2. Exhaustive Reference Audit & Classification

| # | Reference / Symbol | Location in Codebase | Category | Original Role | Detachment & Replacement Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `sklauncher-fx.jar` | `out/main/index.js:5694, 321845, 396838` | **B** | Proprietary Java Agent downloaded from SKmedix mirrors for offline skins and LAN | Replace with independently authored open-source first-party Java Agent (`ktlauncher-agent.jar`) built from source, verified with SHA-256 and Ed25519 signatures. |
| 2 | `files.skmedix.pl` / `s2.skmedix.pl` | `out/main/index.js:396840` | **C** | Download mirrors used to fetch `sklauncher-fx.jar` binary | Remove completely. Agent will be bundled locally or retrieved from verifiable KTLauncher GitHub releases. |
| 3 | `meta.skmedix.pl/v1/launcher/config.json` | `out/main/index.js:28548` | **C** | Remote launcher configuration endpoint | Replace with local offline configuration default or first-party KTLauncher configuration service with timeout & offline cache. |
| 4 | `meta.skmedix.pl/v1/launcher/library-patches.json` | `out/main/index.js:28624, 148977` | **C** | Remote dynamic library patches for Minecraft versions | Decouple from SKmedix. Provide a static, validated first-party patch manifest using official upstream Maven dependencies. |
| 5 | `beta.skmedix.pl/news.json` | `out/main/index.js:28601` | **C** | News feed endpoint displayed on the dashboard | Point to KTLauncher official announcements feed or safe offline fallback with no external ping. |
| 6 | `updates.skmedix.pl` | `out/main/index.js:28620` | **C** | Proprietary update check server | Completely decoupled. Updater now points strictly to official GitHub Releases API (`abdo-45/ktlauncher` / `jalemluv/ktlauncher`). |
| 7 | `sessionserver.skmedix.pl/profile/secure` | `out/main/index.js:27637` | **C** | Proprietary skin and session server | Eliminate. Offline skins are resolved locally from disk or via first-party secure proxy; official profiles resolve via Mojang Session Server. |
| 8 | `3.3.3-skl.1` (`org.lwjgl:lwjgl-glfw`) | `out/main/index.js:143121, 143200` | **B** | Forked GLFW library hosted on `meta.skmedix.pl/maven` | Replace with official upstream `org.lwjgl:lwjgl-glfw:3.3.3` from Maven Central or official Minecraft library mirror. |
| 9 | `2.9.4-skl.2` (`org.lwjgl.lwjgl:lwjgl-platform`) | `out/main/index.js:148629, 148780` | **B** | Forked LWJGL2 macOS ARM64 natives on `meta.skmedix.pl/maven` | Replace with official upstream LWJGL2 or Prism/Fabric macOS ARM64 open-source verified natives. |
| 10 | `1.1-skl.1` (`ca.weblite:java-objc-bridge`) | `out/main/index.js:146012` | **B** | Forked Objective-C bridge on `meta.skmedix.pl/maven` | Replace with upstream official `ca.weblite:java-objc-bridge:1.1` from Maven Central. |
| 11 | `-javaagent` | `out/main/index.js:401529` | **A** | JVM command line argument injecting the skin agent | Retain capability for KTLauncher first-party agent (`-javaagent:ktlauncher-agent.jar`). |
| 12 | `ktlauncher.dns` / `sklauncher.dns` | `out/main/index.js:401571` | **A** | System property `-Dktlauncher.dns=true` read by Java agent | Standardize as documented property for the first-party KTLauncher agent. |
| 13 | `ktlauncher.lan` / `sklauncher.lan` | `out/main/index.js:401610` | **A** | System property `-Dktlauncher.lan=true` read by Java agent | Standardize as documented property for the first-party KTLauncher agent. |
| 14 | `cdn.xyrios.com/api/servers.json` | `out/main/index.js:28466` | **C** | Cached server directory from Xyrios | Implement independent server provider adapter with offline fallback and schema validation. |
| 15 | `xyrios.com/api/servers` | `out/main/index.js:28507` | **C** | Live server directory and ping service | Provide first-party server metadata or user-customizable server lists. |
| 16 | `instances:import-detect-sklauncher3` | `out/main/index.js:328648` | **D** | Wizard checking for legacy SKlauncher v3/v4 instances | **PRESERVE** as safe, user-initiated migration feature. Reads local files only; makes no network requests. |
| 17 | `sklauncher.json` / `accounts.bin` | `out/main/index.js:328648` | **D** | File markers checked when importing from legacy installations | **PRESERVE** for reading user data during user-directed import. |
| 18 | `SKPACK` / `instances:export-skpack` | `out/main/index.js:262017` | **D** | Modpack export/import archive format compatibility | Retain support for `.skpack` alongside standard `.mrpack` (Modrinth) and CurseForge formats. |
| 19 | `.sklauncher` (Legacy data directory) | `out/main/index.js:12560` | **D** | Legacy application data directory | Successfully migrated to `%APPDATA%\.ktlauncher`. Fallback retained only for automatic one-time data migration. |
| 20 | Leftover branding strings | Various files in `out/renderer` | **E** | Leftover translation strings referencing old launcher name | Scrubbed and unified to KTLauncher across all languages. |

---

## 3. Detachment Action Plan & Milestones

### Phase 2A: First-Party Java Agent Architecture
1. Author clean-room Java source for `KTLauncherAgent` (`premain` and agentmain).
2. Hook `YggdrasilMinecraftSessionService.fillProfileProperties()` and `getTextures()` via standard Java Instrumentation and ByteBuddy/ASM or clean HTTP redirection.
3. Serve local skin textures directly from `%APPDATA%\.ktlauncher\skin-library`.
4. Cryptographically sign the compiled JAR and verify SHA-256 integrity prior to launching.
5. Provide graceful fallback: if agent is absent, game launches cleanly without crashing.

### Phase 2B: Provider Abstraction for External Endpoints
1. Create a centralized `providers.json` configuration in `out/main`.
2. Wrap all remote requests in a robust HTTP client featuring:
   - HTTPS enforcement.
   - 5-second strict timeouts.
   - Max 2 retries with exponential backoff.
   - Schema validation with fallback to embedded defaults.
   - Offline-first cache.

### Phase 2C: Upstream Maven Artifact Alignment
1. Replace all `-skl.*` dependencies in the embedded `library-patches.json` fallback with upstream Maven Central / Mojang library URLs.
2. For macOS ARM64 LWJGL compatibility, point to official LWJGL 3.3.3 and verified upstream builds.
3. Completely remove `meta.skmedix.pl/maven` from download candidates.
