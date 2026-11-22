# KTLauncher Dependency Map & Supply Chain Architecture

**Document Version:** 1.0.0  
**Audit Date:** 2026-11-22  
**Target:** KTLauncher Offline Edition (v1.0.1)

---

## 1. Direct Node.js / npm Dependencies

Audit of dependencies declared in `package.json`, analyzing purpose, licensing, and supply chain status:

| Package | Version Specified | Purpose / Subsystem | License | Risk & Status |
| :--- | :--- | :--- | :--- | :--- |
| `@electron-toolkit/preload` | `^3.0.2` | Context bridge helpers for preload | MIT | Verified safe; sandbox-compatible |
| `@electron-toolkit/utils` | `^4.0.0` | Electron main process helpers | MIT | Verified safe |
| `@lucide/lab` | `latest` | Experimental vector icons | ISC | ⚠️ Floating version; should be pinned |
| `@lucide/svelte` | `latest` | Svelte UI icons | ISC | ⚠️ Floating version; should be pinned |
| `@xhayper/discord-rpc` | `^1.3.5` | Discord Rich Presence integration | MIT | Local IPC socket communication only |
| `chokidar` | `^5.0.0` | Filesystem watcher for screenshots/crash logs | MIT | Safe; standard filesystem event watcher |
| `dompurify` | `^3.4.16` | Sanitizing HTML in mod descriptions | Apache-2.0 / MPL-2.0 | Crucial security library |
| `electron-log` | `^5.4.4` | File and console logging | MIT | Writes to `%APPDATA%\.ktlauncher\logs` |
| `electron-updater` | `^6.8.12` | Auto-update engine framework | MIT | Integrated with custom GitHub release hook |
| `filename-reserved-regex` | `^4.0.1` | Cross-platform filename sanitization | MIT | Security helper against path injection |
| `inter-ui` | `^4.1.1` | Embedded UI font assets | SIL OFL 1.1 | Static asset dependency |
| `jetbrains-mono` | `^1.0.6` | Monospace code/log font assets | Apache-2.0 | Static asset dependency |
| `marked` | `^18.0.14` | Markdown parsing for changelogs/descriptions | MIT | Rendered with DOMPurify sanitization |
| `os-name` | `^7.0.1` | Human-readable OS string resolution | MIT | Safe telemetry / diagnostic helper |
| `p-limit` | `^7.3.3` | Promise concurrency limiter | MIT | Download queue concurrency control |
| `p-map` | `^7.0.8` | Async array mapping | MIT | Batch asset processing |
| `p-queue` | `^9.3.3` | Async priority queue | MIT | Asset download scheduling |
| `p-timeout` | `^7.0.2` | Timeout wrapper for promises | MIT | Network request watchdog |
| `prismarine-nbt` | `^2.8.0` | NBT parsing for Minecraft worlds and saves | MIT | Quick Play world parsing |
| `semver` | `^7.8.5` | Semantic version parsing & comparison | ISC | Version checking for updates & mod loaders |
| `skinview3d` | `3.4.2` | Three.js-based 3D Minecraft skin renderer | MIT | Pinned; WebGL canvas rendering |
| `smol-toml` | `^1.9.0` | Fast TOML parser for Forge/NeoForge mods.toml | MIT | Safe metadata parsing |
| `tar` | `7.5.22` | Tarball archive unpacker | ISC | Pinned; requires Zip-Slip audit |
| `virtua` | `^0.51.3` | Virtualized list rendering for large mod lists | MIT | Performance optimization |
| `yauzl` | `^3.4.0` | ZIP file parser and decompressor | MIT | Requires strict Zip-Slip protection |
| `yazl` | `3.3.1` | ZIP file creator (modpack exporter) | MIT | Pinned safe archiver |

---

## 2. Core Runtime Components

- **Electron Runtime:** 43.8.11 (Chromium: 150.0.7871.250, V8: 15.0.245.31-electron.0)
- **Node.js Subsystem:** 24.22.1 (win32-x64)
- **Target OS Architecture:** Windows 10/11 x64, with portability for Linux x64 and macOS arm64/x64.
- **Java Execution Environment:** External JRE/JDK processes spawned through Node `child_process.spawn`.

---

## 3. External Network Endpoints & CDNs

### 3.1 Official Minecraft / Mojang Infrastructure (Authoritative)
| Endpoint URL | Protocol | Purpose | Authentication |
| :--- | :--- | :--- | :--- |
| `https://piston-meta.mojang.com` | HTTPS | Version manifests (`version_manifest_v2.json`) | None (Public) |
| `https://launchermeta.mojang.com` | HTTPS | Java runtime manifests (`all.json`) | None (Public) |
| `https://libraries.minecraft.net` | HTTPS | Official Minecraft client/server libraries | None (Public) |
| `https://resources.download.minecraft.net` | HTTPS | Official Minecraft sound and texture assets | None (Public) |
| `https://launchercontent.mojang.com` | HTTPS | Official news and launcher promotional content | None (Public) |
| `https://api.minecraftservices.com` | HTTPS | Microsoft/Mojang profile and skin services | Bearer OAuth token |
| `https://sessionserver.mojang.com` | HTTPS | Official skin & profile verification | None (Public) |

### 3.2 Mod Loader Metadata & Repositories (Public Upstream)
| Endpoint URL | Protocol | Purpose | Authentication |
| :--- | :--- | :--- | :--- |
| `https://api.modrinth.com/v2` | HTTPS | Mod, modpack, shader, and plugin discovery | Optional API token |
| `https://api.curseforge.com/v1` | HTTPS | CurseForge mod and modpack catalog | API Key header |
| `https://meta.fabricmc.net/v2` | HTTPS | Fabric loader & installer metadata | None (Public) |
| `https://meta.quiltmc.org/v3` | HTTPS | Quilt loader & installer metadata | None (Public) |
| `https://maven.minecraftforge.net` | HTTPS | Official Minecraft Forge Maven repository | None (Public) |
| `https://maven.neoforged.net` | HTTPS | Official NeoForged Maven repository | None (Public) |
| `https://api.mclo.gs` | HTTPS | Crash report sharing via Pastebin/Mclo.gs | None (Public) |

### 3.3 Proprietary SKmedix Infrastructure (Targeted for Total Removal)
| Endpoint URL | Role | Risk / Reason for Detachment |
| :--- | :--- | :--- |
| `https://meta.skmedix.pl/v1/launcher/config.json` | Remote launcher configuration | Proprietary telemetry and control |
| `https://meta.skmedix.pl/v1/launcher/library-patches.json` | Custom library override manifests | Proprietary patch definitions |
| `https://meta.skmedix.pl/maven/...` | Custom Maven artifacts (`-skl.1`, `-skl.2`) | Binary dependency on proprietary Maven |
| `https://beta.skmedix.pl/news.json` | Remote news feed | External proprietary promotion |
| `https://updates.skmedix.pl` | Proprietary update server | Closed update distribution |
| `https://sessionserver.skmedix.pl/profile/secure` | Proprietary skin session server | Centralized user tracking & dependency |
| `https://files.skmedix.pl/servers.json` | Agent mirror list | Distributes closed-source JARs |
| `https://s2.skmedix.pl/servers.json` | Agent mirror list backup | Distributes closed-source JARs |

### 3.4 Xyrios Infrastructure (Targeted for Abstraction / Replacement)
| Endpoint URL | Role | Risk / Reason for Detachment |
| :--- | :--- | :--- |
| `https://xyrios.com/api/servers` | Server discovery directory | Third-party service dependency |
| `https://cdn.xyrios.com/api/servers.json` | Cached server metadata | Third-party CDN dependency |
| `https://*.xyrios.com` | Friends and presence backend | Third-party social network dependency |

---

## 4. Downloaded Executable & Java Dependencies

| Dependency Artifact | Origin / Download Source | Local Path | Purpose |
| :--- | :--- | :--- | :--- |
| `sklauncher-fx.jar` | `files.skmedix.pl` / `s2.skmedix.pl` | `%APPDATA%\.ktlauncher\sklauncher-fx.jar` | Java Agent for offline skins, DNS, and LAN hooks |
| `lwjgl-glfw-3.3.3-skl.1.jar` | `meta.skmedix.pl/maven/...` | `%APPDATA%\.ktlauncher\libraries\...` | macOS ARM64 GLFW compatibility patch |
| `lwjgl-platform-2.9.4-skl.2...jar`| `meta.skmedix.pl/maven/...` | `%APPDATA%\.ktlauncher\libraries\...` | macOS ARM64 LWJGL2 native bridge |
| `java-objc-bridge-1.1-skl.1.jar` | `meta.skmedix.pl/maven/...` | `%APPDATA%\.ktlauncher\libraries\...` | macOS native Objective-C bridge |
| Mojang Java Runtimes | Official Microsoft / Mojang CDN | `%APPDATA%\.ktlauncher\runtime\...` | JRE 8, 17, 21 executables |
