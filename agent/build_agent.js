const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const baseDir = 'C:/Users/jalem/Desktop/KTLauncher-Source-Code/agent';
const srcFile = path.join(baseDir, 'src/main/java/net/ktlauncher/agent/KTLauncherAgent.java');
const manifestFile = path.join(baseDir, 'MANIFEST.MF');
const binDir = path.join(baseDir, 'bin');
const buildDir = path.join(baseDir, 'build');
const outJar = path.join(buildDir, 'ktlauncher-agent.jar');
const sigFile = path.join(buildDir, 'ktlauncher-agent.jar.sig');

const javac = 'C:/Users/jalem/AppData/Roaming/.ktlauncher/runtime/java-runtime-epsilon/windows-x64/java-runtime-epsilon/bin/javac.exe';
const jarTool = 'C:/Users/jalem/AppData/Roaming/.ktlauncher/runtime/java-runtime-epsilon/windows-x64/java-runtime-epsilon/bin/jar.exe';

if (fs.existsSync(binDir)) fs.rmSync(binDir, { recursive: true, force: true });
if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
fs.mkdirSync(binDir, { recursive: true });

console.log('1. Compiling KTLauncherAgent with --release 8...');
execSync(`"${javac}" --release 8 -d "${binDir}" "${srcFile}"`, { stdio: 'inherit' });

console.log('2. Packaging ktlauncher-agent.jar...');
execSync(`"${jarTool}" cvfm "${outJar}" "${manifestFile}" -C "${binDir}" .`, { stdio: 'inherit' });

console.log('3. Generating / Loading Ed25519 Publisher Keys...');
const keysDir = path.join(baseDir, 'keys');
if (!fs.existsSync(keysDir)) fs.mkdirSync(keysDir, { recursive: true });

const privKeyPath = path.join(keysDir, 'ktlauncher_publisher_ed25519.pem');
const pubKeyPath = path.join(keysDir, 'ktlauncher_publisher_ed25519.pub');

let privKey, pubKey;
if (!fs.existsSync(privKeyPath)) {
  const keyPair = crypto.generateKeyPairSync('ed25519');
  privKey = keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' });
  pubKey = keyPair.publicKey.export({ type: 'spki', format: 'pem' });
  fs.writeFileSync(privKeyPath, privKey);
  fs.writeFileSync(pubKeyPath, pubKey);
  console.log('Generated new Ed25519 keypair.');
} else {
  privKey = fs.readFileSync(privKeyPath, 'utf8');
  pubKey = fs.readFileSync(pubKeyPath, 'utf8');
  console.log('Loaded existing Ed25519 keypair.');
}

console.log('4. Signing ktlauncher-agent.jar with Ed25519...');
const jarBytes = fs.readFileSync(outJar);
const signature = crypto.sign(null, jarBytes, privKey);
fs.writeFileSync(sigFile, signature);

const jarSha256 = crypto.createHash('sha256').update(jarBytes).digest('hex');
console.log('JAR SHA-256:', jarSha256);
console.log('Signature length:', signature.length, 'bytes');

// 5. Verify signature
const isValid = crypto.verify(null, jarBytes, pubKey, signature);
if (!isValid) {
  throw new Error('FATAL: Ed25519 signature verification failed!');
}
console.log('✓ Ed25519 signature verified successfully against publisher public key!');

// 6. Deploy to launcher runtime directories
const deployTargets = [
  'C:/Users/jalem/AppData/Roaming/.ktlauncher',
  'C:/Users/jalem/Desktop/offlinlaunc',
  'C:/Users/jalem/Desktop/KTLauncher-v1.0.1-Windows'
];

for (const target of deployTargets) {
  if (fs.existsSync(target)) {
    fs.copyFileSync(outJar, path.join(target, 'ktlauncher-agent.jar'));
    fs.copyFileSync(sigFile, path.join(target, 'ktlauncher-agent.jar.sig'));
    console.log(`Deployed agent to ${target}`);
  }
}

// Write metadata manifest
const meta = {
  name: 'ktlauncher-agent',
  version: '1.0.0',
  sha256: jarSha256,
  signature: signature.toString('base64'),
  publicKey: pubKey,
  builtAt: new Date().toISOString()
};
fs.writeFileSync(path.join(buildDir, 'agent-manifest.json'), JSON.stringify(meta, null, 2));

console.log('BUILD SUCCESSFUL: KTLauncherAgent v1.0.0 ready!');
