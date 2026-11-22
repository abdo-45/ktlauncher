# KTLauncher Phase 2: Cryptographic Verification & Tamper Audit

**Audit Target:** Publisher Ed25519 Signing System, Public Key Pinning, and Runtime Integrity  
**Branch:** `feature/phase2-detachment` | **Commit:** `9f31568` | **Date:** 2026-11-22  

---

## 1. Executive Summary

A comprehensive cryptographic evaluation was performed on `ktlauncher-agent.jar` and its deployment pipeline. The build-time signing process using Ed25519 is cryptographically sound, and authentic artifacts are validated successfully. Tampering with either the JAR binary or the signature triggers immediate mathematical verification failure.

**CRITICAL SECURITY FINDING:** However, an extensive audit of the Electron launcher main process (`out/main/index.js`) revealed that **runtime signature verification was never wired into the launch sequence**. The launcher logs the JAR's SHA-256 hash without comparing it to an expected value, never reads the `.sig` file, and never validates the signature against a pinned public key before passing `-javaagent:...` to the JVM. Furthermore, the publisher public key is currently stored in `providers.json`, an editable plaintext configuration file.

---

## 2. Cryptographic Artifact Specifications

| Parameter | Specification | Verification Result |
| :--- | :--- | :--- |
| **Signature Algorithm** | Ed25519 (EdDSA over Curve25519, PureEdDSA mode) | Confirmed RFC 8032 compliant |
| **Signature Format** | 64-byte raw binary signature (`ktlauncher-agent.jar.sig`) | Exact length: 64 bytes |
| **Target Artifact** | `agent/build/ktlauncher-agent.jar` | Exact size: 8,379 bytes |
| **Artifact SHA-256** | `3bef6ed0f2d1738c043f218fe8820621607bcd93b4f56f6f923a0578a236af74` | Confirmed bit-for-bit |
| **Publisher Public Key (SPKI PEM)** | `MCowBQYDK2VwAyEAGygFiY/sJ54QLwpVKH6VRSd/ZAMZY9ONywrga2yidwQ=` | Valid Ed25519 SubjectPublicKeyInfo |
| **Public Key Fingerprint (SHA-256)**| `5b9c41893ab9d977387db5caf44045f6463e839cbcfa9a7a81e9b0dc2f8e13c2` | Verified across build scripts & configs |
| **Private Key Location** | `agent/keys/ktlauncher_publisher_ed25519.pem` (PKCS#8 PEM) | Kept in offline build environment |

---

## 3. Key Generation & Signing Procedure

### 3.1 Publisher Keypair Generation
Generated via Node.js native `crypto.generateKeyPairSync('ed25519')`:
```javascript
const keyPair = crypto.generateKeyPairSync('ed25519');
const privKeyPem = keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' });
const pubKeyPem = keyPair.publicKey.export({ type: 'spki', format: 'pem' });
```

### 3.2 Artifact Signing
Executed in `agent/build_agent.js` using one-shot Ed25519 signing:
```javascript
const jarBytes = fs.readFileSync('build/ktlauncher-agent.jar');
const signature = crypto.sign(null, jarBytes, privKeyPem);
fs.writeFileSync('build/ktlauncher-agent.jar.sig', signature);
```

### 3.3 Artifact Verification
Validated via Node.js native `crypto.verify`:
```javascript
const isValid = crypto.verify(null, jarBytes, pubKeyPem, signature);
// Evaluates to: true
```

---

## 4. Empirical Tamper Testing Results

A dedicated automated test harness was executed against the production build artifacts:

### Test Case 1: Authentic Artifact Verification
- **Input:** Unmodified `ktlauncher-agent.jar` (8,379 bytes) + `ktlauncher-agent.jar.sig` (64 bytes) + Publisher Public Key.
- **Verification Call:** `crypto.verify(null, jarBytes, pubKeyPem, sigBytes)`
- **Observed Result:** `true`
- **Status:** **PASS**

### Test Case 2: 1-Byte JAR Modification (Binary Tampering)
- **Mutation:** Modified byte at offset 100 (`jarBytes[100] ^= 0xFF`).
- **Verification Call:** `crypto.verify(null, mutatedJar, pubKeyPem, sigBytes)`
- **Observed Result:** `false` (Verification failed immediately).
- **Status:** **PASS (Tamper detected)**

### Test Case 3: 1-Byte Signature Modification (Signature Tampering)
- **Mutation:** Modified byte at offset 10 (`sigBytes[10] ^= 0xFF`).
- **Verification Call:** `crypto.verify(null, jarBytes, pubKeyPem, mutatedSig)`
- **Observed Result:** `false` (Verification failed immediately).
- **Status:** **PASS (Tamper detected)**

### Test Case 4: Rogue / Untrusted Public Key Substitution
- **Mutation:** Generated a completely fresh, mathematically valid Ed25519 keypair and attempted to verify the authentic signature with the rogue public key.
- **Verification Call:** `crypto.verify(null, jarBytes, roguePubKeyPem, sigBytes)`
- **Observed Result:** `false` (Signature rejected).
- **Status:** **PASS (Untrusted key rejected)**

### Test Case 5: Hash Pinning Alignment in `providers.json`
- **Check:** `crypto.createHash('sha256').update(jarBytes).digest('hex') === providers.endpoints.agent.expectedSha256`
- **Values:**
  - Calculated: `3bef6ed0f2d1738c043f218fe8820621607bcd93b4f56f6f923a0578a236af74`
  - Manifest:   `3bef6ed0f2d1738c043f218fe8820621607bcd93b4f56f6f923a0578a236af74`
- **Status:** **PASS**

---

## 5. Security Vulnerability Analysis: Runtime Verification Void

### 5.1 Inspection of `out/main/index.js`
In the Electron main process, `zM()` is the function responsible for preparing the agent:
```javascript
var br = !1;
async function zM() {
  const agentPath = om();
  const exists = (0, m.existsSync)(agentPath);
  if (!exists) {
    Lt.info("KTLauncher agent not present in data directory; checking adjacent paths...");
    const adjacent = (0, d.join)(process.cwd(), "ktlauncher-agent.jar");
    if ((0, m.existsSync)(adjacent)) {
      try {
        await (0, p.mkdir)((0, d.dirname)(agentPath), { recursive: true });
        await (0, p.copyFile)(adjacent, agentPath);
        Lt.info("Copied verified ktlauncher-agent.jar from installation directory.");
      } catch (e) {
        Lt.warn("Could not copy adjacent agent:", e);
      }
    }
  }
  if ((0, m.existsSync)(agentPath)) {
    try {
      const jarBytes = await (0, p.readFile)(agentPath);
      const sha256 = crypto.createHash("sha256").update(jarBytes).digest("hex");
      Lt.info(`KTLauncher Java Agent verified (SHA-256: ${sha256.slice(0, 16)}...)`);
      br = !0;
      return;
    } catch (err) {
      Lt.warn("Agent verification error:", err);
    }
  }
  Lt.warn("KTLauncher agent unavailable; launching in graceful fallback mode.");
  br = !1;
}
```

### 5.2 Vulnerability Findings

1. **No Cryptographic Signature Check at Runtime:**
   - Notice that `zM()` computes `sha256 = crypto.createHash("sha256").update(jarBytes).digest("hex")`, but **never asserts or compares it to anything**.
   - It outputs an informational log message `KTLauncher Java Agent verified...` and sets `br = true` purely because the file was readable.
   - It never loads `ktlauncher-agent.jar.sig`.
   - It never invokes `crypto.verify()`.
2. **Arbitrary Java Code Injection Vector:**
   - In `buildAgentArgs()`:
     ```javascript
     buildAgentArgs() {
       const { instance: e } = this.options;
       if (e.compatibilityMode) return [];
       const t = om();
       if (!(0, m.existsSync)(t)) return [];
       const n = [`-javaagent:${t}`];
       return e.dns && n.push("-Dktlauncher.dns=true"), e.lan && n.push("-Dktlauncher.lan=true"), n;
     }
     ```
   - If a malicious program on the user's computer alters `%APPDATA%\.ktlauncher\ktlauncher-agent.jar`, KTLauncher will load and execute that untrusted JAR as a `-javaagent` during the next Minecraft launch, executing arbitrary code inside the JVM.
3. **Unpinned Public Key:**
   - The publisher public key is stored only inside `providers.json`.
   - Because `providers.json` is a user-editable JSON file on disk, an attacker could replace `ktlauncher-agent.jar`, generate their own signature, and update `providers.json` with their own public key.
   - **Remediation:** The publisher public key must be hardcoded (pinned) inside the compiled `out/main/index.js` or the binary executable.

---

## 6. Required Cryptographic Remediation Code

To achieve full cryptographic compliance, `out/main/index.js` must be updated with the following secure implementation:

```javascript
// PINNED PUBLISHER PUBLIC KEY (Hardcoded constant, tamper-proof)
const PINNED_PUBLISHER_KEY = "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAGygFiY/sJ54QLwpVKH6VRSd/ZAMZY9ONywrga2yidwQ=\n-----END PUBLIC KEY-----\n";
const EXPECTED_AGENT_SHA256 = "3bef6ed0f2d1738c043f218fe8820621607bcd93b4f56f6f923a0578a236af74";

async function zM() {
  const agentPath = om();
  const sigPath = `${agentPath}.sig`;

  if (!(0, m.existsSync)(agentPath)) {
    const adjacent = (0, d.join)(process.cwd(), "ktlauncher-agent.jar");
    const adjacentSig = `${adjacent}.sig`;
    if ((0, m.existsSync)(adjacent) && (0, m.existsSync)(adjacentSig)) {
      try {
        await (0, p.mkdir)((0, d.dirname)(agentPath), { recursive: true });
        await (0, p.copyFile)(adjacent, agentPath);
        await (0, p.copyFile)(adjacentSig, sigPath);
      } catch (e) {
        Lt.warn("Could not copy adjacent agent:", e);
      }
    }
  }

  if ((0, m.existsSync)(agentPath) && (0, m.existsSync)(sigPath)) {
    try {
      const jarBytes = await (0, p.readFile)(agentPath);
      const sigBytes = await (0, p.readFile)(sigPath);

      // 1. Verify Ed25519 signature against pinned publisher key
      const isSignatureValid = crypto.verify(null, jarBytes, PINNED_PUBLISHER_KEY, sigBytes);
      if (!isSignatureValid) {
        Lt.error("CRITICAL SECURITY ALERT: ktlauncher-agent.jar failed Ed25519 signature verification! Agent loading blocked.");
        br = !1;
        return;
      }

      // 2. Verify SHA-256 hash against expected build hash
      const actualSha256 = crypto.createHash("sha256").update(jarBytes).digest("hex");
      if (actualSha256.toLowerCase() !== EXPECTED_AGENT_SHA256.toLowerCase()) {
        Lt.error(`SECURITY ALERT: Agent SHA-256 mismatch (Expected: ${EXPECTED_AGENT_SHA256}, Actual: ${actualSha256}). Agent loading blocked.`);
        br = !1;
        return;
      }

      Lt.info("KTLauncher Java Agent cryptographically verified (Ed25519 + SHA-256).");
      br = !0;
      return;
    } catch (err) {
      Lt.error("Agent cryptographic verification exception:", err);
    }
  }

  Lt.warn("KTLauncher agent or signature missing; launching in graceful fallback mode (no agent).");
  br = !1;
}
```
In `buildAgentArgs()`, ensure `-javaagent` is **only** added when `br === true`:
```javascript
buildAgentArgs() {
  const { instance: e } = this.options;
  if (e.compatibilityMode || !br) return [];
  const t = om();
  const n = [`-javaagent:${t}`];
  if (this.platform.javaVersion >= 9) {
    n.push("--add-opens=java.base/java.net=ALL-UNNAMED");
  }
  if (e.dns) n.push("-Dktlauncher.dns=true");
  if (e.lan) n.push("-Dktlauncher.lan=true");
  return n;
}
```
This remediation closes the arbitrary code injection vulnerability completely.
