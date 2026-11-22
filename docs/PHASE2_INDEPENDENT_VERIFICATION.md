# KTLauncher Phase 2: Independent Verification Audit Report

**Auditor:** Senior Electron Security & Reverse Engineering Specialist  
**Audit Target:** KTLauncher Offline Edition — Phase 2 Detachment Implementation  
**Git Branch:** `feature/phase2-detachment` (Commit `9f31568`)  
**Repository Path:** `C:\Users\jalem\Desktop\KTLauncher-Source-Code`  
**Distribution Target:** `C:\Users\jalem\Desktop\KTLauncher-v1.0.1-Windows`  
**Audit Date:** November 22, 2026  

---

## 1. Executive Audit Summary & Final Verdict

An exhaustive, empirical verification audit of the KTLauncher Phase 2 SKlauncher detachment was conducted. Every completion claim from the previous phase report was independently evaluated against actual source files, compiled bytecode, binary artifacts, runtime execution traces, and cryptographic verification suites.

### Final Verdict: **B. PHASE 2 PARTIALLY VERIFIED**

```
┌────────────────────────────────────────────────────────────────────────┐
│                          AUDIT VERDICT                                 │
│                                                                        │
│                [ B. PHASE 2 PARTIALLY VERIFIED ]                      │
│                                                                        │
│  Significant architectural progress has been achieved, including a   │
│  first-party clean-room Java Agent, an offline providers schema, and   │
│  upstream Maven Central library overrides. However, critical runtime   │
│  deficiencies, unsevered SKmedix endpoints, and JVM modularity blocks  │
│  prevent this implementation from achieving full independent release.  │
└────────────────────────────────────────────────────────────────────────┘
```

### High-Level Summary of Findings

| Evaluation Domain | Claimed Status | Verified Status | Audit Finding |
| :--- | :--- | :--- | :--- |
| **Java Agent Source & Compilation** | 100% Clean-Room | **PASS** | Source authored under `agent/src/...`, compiles with `--release 8`, zero proprietary SKlauncher code. |
| **Agent Packaging & Distribution** | Deployed | **PASS** | `ktlauncher-agent.jar` (8,379 bytes) and `.sig` (64 bytes) deployed to app root and AppData. |
| **Cryptographic Signing (Build)** | Signed Ed25519 | **PASS** | Ed25519 signature generated; rejects 1-byte byte flipping and untrusted keys in build test. |
| **Cryptographic Verification (Runtime)**| Enforced | **FAIL (CRITICAL)** | Electron `out/main/index.js` **does NOT** verify the Ed25519 signature at launch; public key is unpinned. |
| **Java Agent Intercept (Java 8)** | Functional | **PASS** | `URLStreamHandlerFactory` hooks profile and skin requests synchronously in threadless mode. |
| **Java Agent Intercept (Java 17/21/25)**| Universal | **FAIL (CRITICAL)** | Reflection on `URL.factory` throws `InaccessibleObjectException`; silent catch disables hook on modern JREs without `--add-opens`. |
| **Minecraft Skin Signatures** | Working | **PARTIAL** | Unsigned profile JSON and virtual host `ktlauncher.local` are rejected by modern vanilla client security checks. |
| **SKmedix Remote Config Severing** | Decoupled | **FAIL (CRITICAL)** | `remote:config-fetch` still queries `meta.skmedix.pl/v1/launcher/config.json` due to string-match failure in patch script. |
| **SKmedix News Feed Severing** | Decoupled | **FAIL (CRITICAL)** | `news:fetch` still queries `beta.skmedix.pl/news.json`. |
| **Auto-Updater Decoupling** | Canonical abdo-45 | **PARTIAL** | `Mm="jalemluv"` and `updates.skmedix.pl` remain hardcoded in update feed definitions. |
| **Library Patches Bypass** | Local Only | **FAIL** | Remote query to `meta.skmedix.pl/v1/launcher/library-patches.json` still executes at runtime. |
| **Upstream Maven Overrides** | Maven Central | **PASS** | `lwjgl-glfw:3.3.3`, `java-objc-bridge:1.1`, and `lwjgl-platform:2.9.4` overrides successfully mapped. |
| **Clean Checkout Rebuild** | Full Source | **FAIL (BLOCKER)** | Original TypeScript/Svelte source missing; project relies on minified bundle patching. |

---

## 2. Source and Build Verification

### 2.1 Git Branch and Working Tree
- **Current Branch:** `feature/phase2-detachment`
- **Latest Commit:** `9f31568` (`feat: complete Phase 2 SKlauncher detachment, first-party Java Agent, and providers system`)
- **Working Tree:** Clean (all untracked test scratch files removed, zero dirty diffs).

### 2.2 Binary Artifact Presence & Verification
The Windows release distribution directory `C:\Users\jalem\Desktop\KTLauncher-v1.0.1-Windows` was inspected:
- `ktlauncher-agent.jar` exists (8,379 bytes).
- `ktlauncher-agent.jar.sig` exists (64 bytes).
- `resources/app.asar` exists (52,675,049 bytes, header hash `8022f97d9c187b67863f629601206018f479ce3d31e113b3433638c704ac7958`).
- `ktlauncher.exe` exists (239,546,368 bytes).

### 2.3 Independent Agent Rebuild
The Java Agent was rebuilt independently from clean source using OpenJDK 25 `javac --release 8`:
```powershell
& "javac.exe" --release 8 -d bin src/main/java/net/ktlauncher/agent/KTLauncherAgent.java
& "jar.exe" cvfm build/ktlauncher-agent.jar MANIFEST.MF -C bin .
node build_agent.js
```
- Rebuild executed with exit code `0`.
- Cryptographic SHA-256 of compiled bytecode classes matches byte-for-byte.
- Ed25519 signature verified successfully during the build process.

### 2.4 Clean Checkout Source Blocker
**CRITICAL ARCHITECTURAL FINDING:** The repository `C:\Users\jalem\Desktop\KTLauncher-Source-Code` does not contain the original Svelte components, TypeScript sources, or Vite build pipeline. The application can only be packaged by repacking the modified `out/` bundles into `app.asar`. As mandated in Phase 1, true source-level independence is blocked until the clean-room Svelte/TypeScript source tree is established.

---

## 3. Java Agent Deep Technical Audit (`KTLauncherAgent.java`)

### 3.1 `URLStreamHandlerFactory` Mechanism Analysis
The agent attempts to register an in-process URL hook via reflection on `java.net.URL.factory`:
```java
Field factoryField = URL.class.getDeclaredField("factory");
factoryField.setAccessible(true);
final URLStreamHandlerFactory existingFactory = (URLStreamHandlerFactory) factoryField.get(null);
URL.setURLStreamHandlerFactory(new URLStreamHandlerFactory() { ... });
```

#### Empirical Runtime Behavior:
1. **Java 8 (`jre-legacy` v1.8.0_51):**
   - Output: `[KTLauncher] URLStreamHandlerFactory registered for session intercept.`
   - Profile connection to `sessionserver.mojang.com` successfully instantiates `net.ktlauncher.agent.KTLauncherAgent$MockProfileConnection`.
   - Result: **PASS** on Java 8.
2. **Modern Java (Java 17, Java 21, OpenJDK 25.0.1):**
   - Reflection throws: `java.lang.reflect.InaccessibleObjectException: Unable to make field private static java.net.URLStreamHandlerFactory java.net.URL.factory accessible: module java.base does not "opens java.net" to unnamed module`.
   - The catch block executes: `System.out.println("[KTLauncher] Notice: URL stream handler factory already set, using fallback property.");`
   - **Crucial Flaw:** The catch block does nothing. The factory is never registered.
   - Empirical test output on Java 25:
     ```
     Opening connection to: https://sessionserver.mojang.com/session/minecraft/profile/000...
     Connection class: sun.net.www.protocol.https.HttpsURLConnectionImpl
     ```
   - Connection bypassed the agent completely and connected to the real Mojang server!
3. **Remediation Test:**
   - When `--add-opens java.base/java.net=ALL-UNNAMED` was supplied explicitly to Java 25, `URLStreamHandlerFactory` registered and intercepted correctly.
   - However, `out/main/index.js` **does not** supply `--add-opens java.base/java.net=ALL-UNNAMED` in `buildAgentArgs()`.
   - Result: **FAIL on all modern Minecraft versions (1.17 to 1.21+)**.

### 3.2 Minecraft Client Texture Verification Audit
In modern Minecraft (1.16+), client skin loading is governed by `com.mojang.authlib.yggdrasil.YggdrasilAuthenticationService`:
1. **Cryptographic Signature Check:** The client checks if the `textures` property has a valid Mojang RSA signature. `MockProfileConnection` supplies only unsigned texture metadata. In strict vanilla environments, unsigned textures are discarded.
2. **Domain Allowlist Check:** Vanilla Minecraft's `PlayerSkinProvider` enforces that texture URLs must belong to `*.minecraft.net` (specifically `textures.minecraft.net`). The agent provides `http://ktlauncher.local/skin/<uuid>.png`. Vanilla Minecraft rejects this URL as an untrusted domain.
3. **Bytecode Instrumentation Gap:** The legacy `sklauncher-fx.jar` utilized bytecode manipulation (`ClassFileTransformer` via ASM/ByteBuddy) to patch Minecraft's skin validation classes directly in memory. `KTLauncherAgent.java` currently possesses zero bytecode transformation capabilities.

---

## 4. SKmedix Infrastructure Severing Audit

### 4.1 Forensic Analysis of `out/main/index.js`
An automated string and AST audit revealed that the patch script `apply_phase2_detachment.js` failed to replace several key SKmedix endpoints due to strict string mismatches against minified identifier names (`h.ipcMain` vs `re.ipcMain`):

```javascript
// STILL ACTIVE AT RUNTIME IN out/main/index.js:
nf = "https://meta.skmedix.pl/v1/launcher/config.json";      // Line 28545 & Line 597028
rf = "https://meta.skmedix.pl/v1/launcher/library-patches.json"; // Line 28598 & Line 149557
af = "https://beta.skmedix.pl/news.json";                  // Line 28660 & Line 596583
sr = "https://updates.skmedix.pl";                         // Line 28699 & Lines 416347, 417427
sf = "https://meta.skmedix.pl/v1/launcher";                // Line 28731 & Line 417400
xM = ["https://files.skmedix.pl/servers.json", "https://s2.skmedix.pl/servers.json"]; // Line 396884
Mm = "jalemluv"; Cm = "ktlauncher";                        // Line 415254 (autoUpdater target)
```

### 4.2 Impact of Hosts File Redirection / SKmedix Outage
When SKmedix domains were mapped to `127.0.0.1` to simulate infrastructure termination:
1. `remote:config-fetch` threw unhandled IPC rejections after 5,000ms timeouts.
2. `news:fetch` threw network errors to the renderer UI.
3. `BM()` wasted time polling `files.skmedix.pl` and `s2.skmedix.pl` before falling back to local files.
4. Auto-updater crashed when trying to contact `updates.skmedix.pl` and `jalemluv/ktlauncher`.

---

## 5. Cryptographic Verification & Tamper Testing

### 5.1 Artifact Cryptographic Parameters
- **Algorithm:** Ed25519 (EdDSA over Curve25519)
- **Publisher Public Key (SPKI PEM):**
  ```
  -----BEGIN PUBLIC KEY-----
  MCowBQYDK2VwAyEAGygFiY/sJ54QLwpVKH6VRSd/ZAMZY9ONywrga2yidwQ=
  -----END PUBLIC KEY-----
  ```
- **Public Key SHA-256 Fingerprint:** `5b9c41893ab9d977387db5caf44045f6463e839cbcfa9a7a81e9b0dc2f8e13c2`
- **Agent JAR SHA-256:** `3bef6ed0f2d1738c043f218fe8820621607bcd93b4f56f6f923a0578a236af74`
- **Signature Size:** 64 bytes (`ktlauncher-agent.jar.sig`)

### 5.2 Tamper Testing Results
A dedicated empirical tamper test suite (`scratch_test_crypto.js`) was executed:
- **Test 1 (Authentic Artifacts):** `crypto.verify` returned `true` (PASS).
- **Test 2 (Modified JAR Byte):** Flipped 1 byte at offset 100 -> `crypto.verify` returned `false` (PASS).
- **Test 3 (Modified Signature Byte):** Flipped 1 byte at offset 10 -> `crypto.verify` returned `false` (PASS).
- **Test 4 (Rogue Ed25519 Key):** Verified against newly generated untrusted key -> returned `false` (PASS).
- **Test 5 (Provider Hash Match):** SHA-256 matched `expectedSha256` in `providers.json` (PASS).

### 5.3 Critical Runtime Vulnerability Disclosure
**FINDING SEC-P2-01 (CRITICAL):**
While the agent is signed offline and passes external node verification, the Electron launcher process `out/main/index.js` **never verifies the signature before execution**.
In `out/main/index.js`:
```javascript
async function zM() {
  const agentPath = om();
  if ((0, m.existsSync)(agentPath)) {
    try {
      const jarBytes = await (0, p.readFile)(agentPath);
      const sha256 = crypto.createHash("sha256").update(jarBytes).digest("hex");
      Lt.info(`KTLauncher Java Agent verified (SHA-256: ${sha256.slice(0, 16)}...)`);
      br = !0;
      return;
    } catch(err) { ... }
  }
}
```
And in `buildAgentArgs()`:
```javascript
buildAgentArgs() {
  const t = om();
  if (!(0, m.existsSync)(t)) return [];
  return [`-javaagent:${t}`];
}
```
**Exploit Scenario:** An attacker or malicious local process can replace `ktlauncher-agent.jar` in `%APPDATA%\.ktlauncher` with arbitrary malicious Java code. The launcher will log the SHA-256, execute `buildAgentArgs()`, and run the malicious JAR inside Minecraft's JVM with full local user permissions.

Furthermore, the publisher public key is stored only in `providers.json` (an editable configuration file), rather than being pinned inside the compiled binary or ASAR bundle.

---

## 6. Upstream Maven Artifact Alignment Verification

The replacement of custom `-skl` library forks with upstream Maven artifacts was empirically evaluated:
1. **`org.lwjgl:lwjgl-glfw:3.3.3` (replacing `3.3.3-skl.1`):**
   - Upstream Maven Central SHA-1: `eed4a946399b1ff5311b51fcfe83f2a3e8111e03` (140,417 bytes).
   - On Windows x64, upstream GLFW 3.3.3 provides identical windowing and Vulkan/OpenGL bindings.
   - Verified: **PASS** on Windows.
2. **`ca.weblite:java-objc-bridge:1.1` (replacing `1.1-skl.1`):**
   - Upstream Maven Central SHA-1: `47d25e0a6d2b56938ee9281a1795c3b169ae5cb2` (89,168 bytes).
   - macOS-only library; inactive on Windows platforms.
   - Verified: **PASS**.
3. **`org.lwjgl.lwjgl:lwjgl-platform:2.9.4` (replacing `2.9.4-skl.2`):**
   - Upstream Minecraft library mirror: `da4aae4f52636913988229b4fa4cb6e87bc9750b`.
   - Windows utilizes `natives-windows` (`lwjgl.dll`); `-skl.2` was solely a macOS ARM64 convenience packaging.
   - Verified: **PASS**.

---

## 7. Required Remediation Roadmap Before Phase 3

To transition Phase 2 from **PARTIALLY VERIFIED** to **VERIFIED**, the following surgical remediations must be implemented on `feature/phase2-detachment`:

1. **Sever Remaining SKmedix Strings in `out/main/index.js`:**
   - Replace definitions of `nf`, `rf`, `af`, `sr`, `sf` with local handlers or first-party URLs.
   - Empty `xM` mirror list to prevent network calls to `files.skmedix.pl` and `s2.skmedix.pl`.
   - Update `Mm` from `"jalemluv"` to `"abdo-45"` in `out/main/index.js`.
   - Remove `skmedix.pl` and `xyrios.com` from network allowlists and CSP.
2. **Enforce Ed25519 Verification at Runtime in `out/main/index.js`:**
   - Embed the publisher public key as a hardcoded constant in `out/main/index.js`.
   - Update `zM()` to load `ktlauncher-agent.jar.sig`, read `ktlauncher-agent.jar`, and call `crypto.verify(null, jarBytes, PINNED_PUBKEY, sigBytes)`.
   - If verification fails or files are missing, fallback cleanly with `br = false` and do not add `-javaagent`.
3. **Resolve Modern JVM URL Hooking & Skin Validation:**
   - Add `--add-opens java.base/java.net=ALL-UNNAMED` to `buildAgentArgs()` for Java 9+ runtimes.
   - In `MockProfileConnection`, update the texture URL to use `textures.minecraft.net` (intercepted locally by host matching) to bypass client domain allowlists.
   - Document the requirement for ASM bytecode instrumentation if vanilla 1.20+ strict signature verification is required.
