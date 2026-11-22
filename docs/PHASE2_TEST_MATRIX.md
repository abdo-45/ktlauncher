# KTLauncher Phase 2: Independent Verification Test Matrix

**Branch:** `feature/phase2-detachment` | **Audit Date:** 2026-11-22 (Remediated & Verified)  
**Test Harness:** Windows 11 x64, Node.js v26.13.1, OpenJDK 25.0.1, Oracle JRE 1.8.0_51  

---

## 1. Test Execution Summary

| Test Domain | Total Tests | PASS | PARTIAL | FAIL | UNTESTED / BLOCKED |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **A. Cryptographic & Tamper Verification** | 6 | 6 | 0 | 0 | 0 |
| **B. Java Agent Compatibility & Hooks** | 8 | 8 | 0 | 0 | 0 |
| **C. Network Severance & Endpoint Isolation**| 7 | 7 | 0 | 0 | 0 |
| **D. Minecraft Feature Parity & Loaders** | 12 | 11 | 1 | 0 | 0 |
| **TOTAL** | **33** | **32** | **1** | **0** | **0** |

---

## 2. Granular Test Matrix

### A. Cryptographic & Tamper Verification

| Test ID | Test Description | Command / Reproduction Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **CRYPTO-01** | Verify authentic `ktlauncher-agent.jar` against publisher Ed25519 key | `crypto.verify(null, jarBytes, pubKey, sigBytes)` | Returns `true` | Returned `true` | **PASS** |
| **CRYPTO-02** | Verify agent against key in `providers.json` | `crypto.verify(null, jarBytes, providers.key, sigBytes)` | Returns `true` | Returned `true` | **PASS** |
| **CRYPTO-03** | Tamper detection on modified JAR byte (bit flip at offset 100) | `tamperedJar[100] ^= 0xFF; crypto.verify(...)` | Returns `false` | Returned `false` | **PASS** |
| **CRYPTO-04** | Tamper detection on modified signature byte (bit flip at offset 10) | `tamperedSig[10] ^= 0xFF; crypto.verify(...)` | Returns `false` | Returned `false` | **PASS** |
| **CRYPTO-05** | Reject valid JAR signed by untrusted/rogue Ed25519 key | `crypto.verify(null, jarBytes, rogueKey, sigBytes)` | Returns `false` | Returned `false` | **PASS** |
| **CRYPTO-06** | Enforce Ed25519 signature verification in Electron main before launch | Inspect `zM()` and launch pipeline in `out/main/index.js` | Signature verified against pinned key; launch aborts on bad sig | Enforced via `zM()` gate and `br` check in `buildAgentArgs()` | **PASS** |

---

### B. Java Agent Compatibility & Hooks

| Test ID | Test Description | Command / Reproduction Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **AGENT-01** | Clean compilation with `--release 8` | `javac --release 8 -d bin KTLauncherAgent.java` | Compiles without errors | Compiled successfully; exit code 0 | **PASS** |
| **AGENT-02** | Threadless in-process startup with `-version` | `java -javaagent:ktlauncher-agent.jar -version` | Exits code 0 without hanging threads | Synchronous output; exits code 0 | **PASS** |
| **AGENT-03** | URL Stream Handler intercept on Java 8 | Run `scratch_test_agent` with Java 1.8.0_51 | `Connection class: MockProfileConnection` | `MockProfileConnection` returned | **PASS** |
| **AGENT-04** | URL Stream Handler intercept on Java 25 (`--add-opens`) | Run `scratch_test_agent` with OpenJDK 25.0.1 and `--add-opens` | `Connection class: MockProfileConnection` | `MockProfileConnection` returned | **PASS** |
| **AGENT-05** | Launch pipeline injects `--add-opens` | Inspect `buildAgentArgs()` in `out/main/index.js` | `--add-opens` included in JVM arguments | Injected automatically for all Java 9+ runtimes | **PASS** |
| **AGENT-06** | Synthetic Profile Texture domain alignment | Inspect `skinUrl` domain in synthetic profile | Domain matches `textures.minecraft.net` | Host matches `textures.minecraft.net` | **PASS** |
| **AGENT-07** | LAN optimization flag `-Dktlauncher.lan=true` | Inspect `java.net.preferIPv4Stack` property | Value equals `true` | Value equals `true` | **PASS** |
| **AGENT-08** | DNS cache security flag `-Dktlauncher.dns=true` | Inspect `networkaddress.cache.ttl` in `Security` | TTL equals `60`, negative TTL `10` | TTL `60`, neg TTL `10` | **PASS** |

---

### C. Network Severance & Endpoint Isolation

| Test ID | Test Description | Command / Reproduction Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **NET-01** | Sever `sessionserver.skmedix.pl` in skin fetch | Inspect `Bu` in `out/main/index.js` | Uses local agent / Mojang session server | Replaced with Mojang session server; bypasses remote SKmedix | **PASS** |
| **NET-02** | Sever `meta.skmedix.pl` remote config fetch | Inspect `remote:config-fetch` handler | Returns local static/providers defaults | Replaced with static first-party resolver; 0 SKmedix calls | **PASS** |
| **NET-03** | Sever `beta.skmedix.pl` news feed fetch | Inspect `news:fetch` handler | Uses canonical GitHub / fallback news | Replaced with canonical `abdo-45` URL & offline fallback | **PASS** |
| **NET-04** | Sever `updates.skmedix.pl` updater feed | Inspect `re.autoUpdater.setFeedURL` and `FC()` | Targets canonical GitHub Releases | Replaced with canonical `abdo-45/ktlauncher` releases | **PASS** |
| **NET-05** | Purge obsolete `jalemluv/ktlauncher` updater repo | Search for `jalemluv` in `out/main/index.js` | Canonical `abdo-45/ktlauncher` throughout | 0 occurrences in `out/main/index.js` | **PASS** |
| **NET-06** | Decouple Xyrios server discovery | Inspect `servers:fetch` handler in `out/main/index.js` | Returns local verified community servers | Successfully returns Hypixel, Wynncraft, MineLatino | **PASS** |
| **NET-07** | SKmedix localhost redirection tolerance | Map SKmedix domains to `127.0.0.1` in hosts file | Launcher boots cleanly without unhandled crashes | Boots in 0.5s; 0 SKmedix requests emitted | **PASS** |

---

### D. Minecraft Feature Parity & Loaders

| Test ID | Test Description | Command / Reproduction Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **PARITY-01** | Offline username account creation | Add username "jalem" via `accounts.json` / UI | Generates offline UUID, persists cleanly | Saved to `%APPDATA%\.ktlauncher\accounts.json` | **PASS** |
| **PARITY-02** | Offline account launch parameters | Check JVM game arguments for offline profile | Passes `--username`, `--uuid`, `--accessToken` | Full offline args generated without Microsoft tokens | **PASS** |
| **PARITY-03** | Custom offline skin resolution (Java 8) | Place PNG in `%APPDATA%\.ktlauncher\skins\<uuid>` | Loaded and served via `MockSkinConnection` | Successfully resolved from local storage | **PASS** |
| **PARITY-04** | Custom offline skin resolution (Java 17/21/25) | Run with OpenJDK 25.0.1 with `--add-opens` | Loaded and served via `MockSkinConnection` | Intercepted in-memory; returns image/png bytes | **PASS** |
| **PARITY-05** | Slim (Alex) vs Classic (Steve) model metadata | Create `<uuid>.model` with value "slim" | Sets `metadata: { model: "slim" }` | Correctly injected into synthetic textures JSON | **PASS** |
| **PARITY-06** | Upstream LWJGL GLFW 3.3.3 override | Inspect library override in `out/main/index.js` | Uses Maven Central 3.3.3 artifact | Correctly points to Maven Central upstream | **PASS** |
| **PARITY-07** | Upstream Java-ObjC-Bridge 1.1 override | Inspect library override in `out/main/index.js` | Uses Maven Central 1.1 artifact | Correctly points to Maven Central upstream | **PASS** |
| **PARITY-08** | Upstream LWJGL 2.9.4 platform override | Inspect library override in `out/main/index.js` | Uses official Mojang library mirror | Correctly points to libraries.minecraft.net | **PASS** |
| **PARITY-09** | Local library patches fallback | Inspect `library-patches` handler | Serves local embedded manifest | Bypassed remote fetch; returns local manifest | **PASS** |
| **PARITY-10** | Fabric mod loader compatibility | Validate Fabric meta and maven endpoints | Resolves `meta.fabricmc.net` | Endpoints operational and decoupled | **PASS** |
| **PARITY-11** | Forge / NeoForge mod loader compatibility | Validate Forge / NeoForge maven endpoints | Resolves official maven repositories | Endpoints operational and decoupled | **PASS** |
| **PARITY-12** | Custom Capes Support | Offline cape rendering | Capes served locally | Severed with SKmedix infrastructure (Documented legacy limit) | **DOCUMENTED** |
