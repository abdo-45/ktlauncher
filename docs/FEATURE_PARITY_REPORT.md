# KTLauncher Feature Parity & Verification Report

**Phase:** Phase 2 — Complete SKlauncher Detachment  
**Audit Date:** 2026-11-22  
**Target Build:** KTLauncher v1.0.1 (Asar v20)  
**Verification Status:** PASS (100% Feature Parity Maintained)

---

## 1. Feature Parity Matrix

| Subsystem / Feature | Previous Status (SKlauncher Legacy) | New Status (KTLauncher Decoupled) | Verification Result |
| :--- | :--- | :--- | :--- |
| **Offline Username Login** | Stored locally; attempted sync with `sessionserver.skmedix.pl` | 100% Local, zero network ping for offline profiles | **PASS** (Instant, verified) |
| **Offline Account Creation** | Handled through offline modal | Preserved exactly with custom UUID generation | **PASS** |
| **Custom Skins & 3D Preview** | Downloaded `sklauncher-fx.jar` from SKmedix mirrors | First-party `ktlauncher-agent.jar` (Java 8 bytecode, Ed25519 signed) | **PASS** (Zero external JAR downloads) |
| **Minecraft Java Launch Pipeline** | Classpaths with `-javaagent:sklauncher-fx.jar` | Classpaths with `-javaagent:ktlauncher-agent.jar` | **PASS** (Verified with OpenJDK 25/17) |
| **Mod Loader Support (Forge/NeoForge/Fabric)** | Unlocked filters, bypassed SKmedix gate | Full support for all mod loaders and modpacks | **PASS** |
| **Server Discovery** | Bound to `cdn.xyrios.com` and `xyrios.com` | First-party `providers.json` community server adapter | **PASS** (Graceful offline fallback) |
| **News Feed** | Loaded from `beta.skmedix.pl/news.json` | First-party `providers.json` KTLauncher announcements | **PASS** |
| **Remote Configuration** | Remote control via `meta.skmedix.pl/config.json` | First-party validated `providers.json` schema | **PASS** |
| **Update Engine** | Hardcoded to obsolete repo | Canonical `abdo-45/ktlauncher` GitHub Releases API | **PASS** (Direct .exe/.zip resolution) |
| **Library Overrides** | Forked Maven artifacts on `meta.skmedix.pl/maven` (`-skl.*`) | Official upstream Maven Central & Mojang libraries | **PASS** (Zero skmedix maven URLs) |
| **Instance Import / Migration** | Wizard detecting `.minecraft/sklauncher.json` | Preserved as user-initiated local file import | **PASS** |

---

## 2. Before / After Dependency Comparison

| Dependency Component | Legacy SKlauncher | KTLauncher Detached (Phase 2) |
| :--- | :--- | :--- |
| **Java Agent Binary** | `sklauncher-fx.jar` (Closed-source, downloaded from `files.skmedix.pl`) | `ktlauncher-agent.jar` (Open-source, self-hosted, Ed25519-signed) |
| **Agent Download Mirrors** | `https://files.skmedix.pl`, `https://s2.skmedix.pl` | **ELIMINATED** (Zero mirrors, bundled locally) |
| **Session Server** | `https://sessionserver.skmedix.pl/profile/secure` | **ELIMINATED** (In-process memory stream handler) |
| **Remote Config** | `https://meta.skmedix.pl/v1/launcher/config.json` | **ELIMINATED** (Local typed `providers.json`) |
| **News Backend** | `https://beta.skmedix.pl/news.json` | **ELIMINATED** (`providers.endpoints.news`) |
| **Update Source** | `https://updates.skmedix.pl` / obsolete GitHub repos | Canonical `https://api.github.com/repos/abdo-45/ktlauncher/releases/latest` |
| **GLFW Override** | `org.lwjgl:lwjgl-glfw:3.3.3-skl.1` (`meta.skmedix.pl`) | `org.lwjgl:lwjgl-glfw:3.3.3` (`repo1.maven.org`) |
| **ObjC Bridge Override** | `ca.weblite:java-objc-bridge:1.1-skl.1` (`meta.skmedix.pl`) | `ca.weblite:java-objc-bridge:1.1` (`repo1.maven.org`) |
| **LWJGL 2 Platform** | `org.lwjgl.lwjgl:lwjgl-platform:2.9.4-skl.2` (`meta.skmedix.pl`) | `org.lwjgl.lwjgl:lwjgl-platform:2.9.4-nightly-20150209` (`libraries.minecraft.net`) |

---

## 3. Remaining Legacy References Analysis

All remaining occurrences of the string `sklauncher` or related terms are strictly categorized under:
- **Category D (User Data Migration Compatibility):**
  - Detection of existing `.minecraft/sklauncher.json` or `.minecraft/accounts.bin` when the user clicks "Import Instances". This is a read-only migration wizard that never contacts external networks and ensures backward compatibility for user saves.
  - File extension `.skpack` support for importing user-exported modpack archives.
- **Zero Category A, B, or C references remain.** There are **0 runtime dependencies**, **0 external API calls to SKmedix**, and **0 executable downloads from SKmedix**.
