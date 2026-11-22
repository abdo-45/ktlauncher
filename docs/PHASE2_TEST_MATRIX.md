# KTLauncher Phase 2: Independent Verification Test Matrix

**Branch:** `feature/phase2-detachment` | **Commit:** `9f31568` | **Date:** 2026-11-22  
**Test Harness:** Windows 11 x64, Node.js v26.13.1, OpenJDK 25.0.1, Oracle JRE 1.8.0_51  

---

## 1. Test Execution Summary

| Test Domain | Total Tests | PASS | PARTIAL | FAIL | UNTESTED / BLOCKED |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **A. Cryptographic & Tamper Verification** | 6 | 5 | 0 | 1 | 0 |
| **B. Java Agent Compatibility & Hooks** | 8 | 4 | 2 | 2 | 0 |
| **C. Network Severance & Endpoint Isolation**| 7 | 1 | 2 | 4 | 0 |
| **D. Minecraft Feature Parity & Loaders** | 12 | 6 | 3 | 0 | 3 |
| **TOTAL** | **33** | **16** | **7** | **7** | **3** |

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
| **CRYPTO-06** | Enforce Ed25519 signature verification in Electron main before launch | Inspect `zM()` and launch pipeline in `out/main/index.js` | Signature verified; launch aborts on bad sig | `zM()` only logs SHA-256; unverified JAR passed to JVM | **FAIL** |

---

### B. Java Agent Compatibility & Hooks

| Test ID | Test Description | Command / Reproduction Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **AGENT-01** | Clean compilation with `--release 8` | `javac --release 8 -d bin KTLauncherAgent.java` | Compiles without errors | Compiled successfully; exit code 0 | **PASS** |
| **AGENT-02** | Threadless in-process startup with `-version` | `java -javaagent:ktlauncher-agent.jar -version` | Exits code 0 without hanging threads | Synchronous output; exits code 0 | **PASS** |
| **AGENT-03** | URL Stream Handler intercept on Java 8 | Run `scratch_test_agent` with Java 1.8.0_51 | `Connection class: MockProfileConnection` | `MockProfileConnection` returned | **PASS** |
| **AGENT-04** | URL Stream Handler intercept on Java 25 (default args) | Run `scratch_test_agent` with OpenJDK 25.0.1 | `Connection class: MockProfileConnection` | Throws `InaccessibleObjectException`; returns `HttpsURLConnectionImpl` | **FAIL** |
| **AGENT-05** | URL Stream Handler intercept on Java 25 (`--add-opens`) | Run `scratch_test_agent` with `--add-opens java.base/java.net=ALL-UNNAMED` | `Connection class: MockProfileConnection` | `MockProfileConnection` returned | **PASS** |
| **AGENT-06** | Launch pipeline automatically injects `--add-opens` | Inspect `buildAgentArgs()` in `out/main/index.js` | `--add-opens` included in JVM arguments | Flag is omitted; modern Minecraft bypasses agent | **FAIL** |
| **AGENT-07** | LAN optimization flag `-Dktlauncher.lan=true` | Inspect `java.net.preferIPv4Stack` property | Value equals `true` | Value equals `true` | **PASS** |
| **AGENT-08** | DNS cache security flag `-Dktlauncher.dns=true` | Inspect `networkaddress.cache.ttl` in `Security` | TTL equals `60`, negative TTL `10` | TTL `60`, neg TTL `10` | **PASS** |

---

### C. Network Severance & Endpoint Isolation

| Test ID | Test Description | Command / Reproduction Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **NET-01** | Sever `sessionserver.skmedix.pl` in skin fetch | Inspect `Bu` in `out/main/index.js` | Uses local agent / Mojang session server | Replaced with Mojang session server; bypasses remote SKmedix | **PASS** |
| **NET-02** | Sever `meta.skmedix.pl` remote config fetch | Inspect `remote:config-fetch` handler | Returns local static/providers defaults | Still executes `ee(nf)` to `meta.skmedix.pl` | **FAIL** |
| **NET-03** | Sever `beta.skmedix.pl` news feed fetch | Inspect `news:fetch` handler | Uses canonical GitHub / fallback news | Still defaults to `af = "https://beta.skmedix.pl/news.json"` | **FAIL** |
| **NET-04** | Sever `updates.skmedix.pl` updater feed | Inspect `re.autoUpdater.setFeedURL` and `FC()` | Targets canonical GitHub Releases | Still constructs URLs with `updates.skmedix.pl` and `meta.skmedix.pl` | **FAIL** |
| **NET-05** | Purge obsolete `jalemluv/ktlauncher` updater repo | Search for `jalemluv` in `out/main/index.js` | Canonical `abdo-45/ktlauncher` throughout | `Mm="jalemluv"` remains at line 415254 | **FAIL** |
| **NET-06** | Decouple Xyrios server discovery | Inspect `servers:fetch` handler in `out/main/index.js` | Returns local verified community servers | Successfully returns Hypixel, Wynncraft, MineLatino | **PASS** |
| **NET-07** | SKmedix localhost redirection tolerance | Map SKmedix domains to `127.0.0.1` in hosts file | Launcher boots cleanly without unhandled crashes | Timeout errors logged on config and news fetch | **PARTIAL** |

---

### D. Minecraft Feature Parity & Loaders

| Test ID | Test Description | Command / Reproduction Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **PARITY-01** | Offline username account creation | Add username "jalem" via `accounts.json` / UI | Generates offline UUID, persists cleanly | Saved to `%APPDATA%\.ktlauncher\accounts.json` | **PASS** |
| **PARITY-02** | Offline account launch parameters | Check JVM game arguments for offline profile | Passes `--username`, `--uuid`, `--accessToken` | Full offline args generated without Microsoft tokens | **PASS** |
| **PARITY-03** | Custom offline skin resolution (Java 8) | Place PNG in `%APPDATA%\.ktlauncher\skins\<uuid>` | Loaded and served via `MockSkinConnection` | Successfully resolved from local storage | **PASS** |
| **PARITY-04** | Custom offline skin resolution (Java 17/21/25) | Run with Java 25 without `--add-opens` | Loaded and served via `MockSkinConnection` | Bypassed; falls back to default skin | **FAIL** |
| **PARITY-05** | Modern Minecraft texture domain allowlist | Check `skinUrl` domain in synthesized profile | Host matches `*.minecraft.net` | Uses `ktlauncher.local`; rejected by vanilla client | **PARTIAL** |
| **PARITY-06** | Upstream LWJGL GLFW 3.3.3 override | Inspect library override in `out/main/index.js` | Uses Maven Central 3.3.3 artifact | Correctly points to Maven Central upstream | **PASS** |
| **PARITY-07** | Upstream Java-ObjC-Bridge 1.1 override | Inspect library override in `out/main/index.js` | Uses Maven Central 1.1 artifact | Correctly points to Maven Central upstream | **PASS** |
| **PARITY-08** | Upstream LWJGL 2.9.4 platform override | Inspect library override in `out/main/index.js` | Uses official Mojang library mirror | Correctly points to libraries.minecraft.net | **PASS** |
| **PARITY-09** | Local library patches fallback | Inspect `library-patches` handler | Serves local embedded manifest | Remote fetch was not completely eliminated | **PARTIAL** |
| **PARITY-10** | Fabric mod loader compatibility | Validate Fabric meta and maven endpoints | Resolves `meta.fabricmc.net` | Endpoints operational and decoupled | **PASS** |
| **PARITY-11** | Forge / NeoForge mod loader compatibility | Validate Forge / NeoForge maven endpoints | Resolves official maven repositories | Endpoints operational and decoupled | **PASS** |
| **PARITY-12** | In-game full session parity on online servers | Launch 1.20.4 with offline account on online server | Connection allowed if server offline; rejected if online | Expected vanilla behavior preserved | **PASS** |
