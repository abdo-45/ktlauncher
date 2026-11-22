const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

console.log('====================================================');
console.log('   KTLauncher v1.0.2 Production Release Builder     ');
console.log('====================================================\n');

const projectRoot = path.join(__dirname, '..');
const scratchDir = path.join(process.env.USERPROFILE, '.gemini/antigravity/brain/9ea5b4a0-1c4e-4f11-bc92-388f7c4e3098/scratch');
const stagingDir = path.join(scratchDir, 'asar_staging_v102');
const targetAsar = path.join(scratchDir, 'ktlauncher_app_v102.asar');

const dist101Dir = path.join(process.env.USERPROFILE, 'Desktop/KTLauncher-v1.0.1-Windows');
const dist102Dir = path.join(process.env.USERPROFILE, 'Desktop/KTLauncher-v1.0.2-Windows');
const source102Dir = path.join(process.env.USERPROFILE, 'Desktop/KTLauncher-Source-Code-v1.0.2');

// 1. Prepare asar staging directory
console.log('1. Preparing ASAR staging directory...');
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// Copy node_modules and resources from scratch/clean_sklauncher
const cleanSklauncher = path.join(scratchDir, 'clean_sklauncher');
console.log('   Copying node_modules & resources from clean bundle base...');
execSync(`robocopy "${path.join(cleanSklauncher, 'node_modules')}" "${path.join(stagingDir, 'node_modules')}" /E /NFL /NDL /NJH /NJS /nc /ns /np || exit 0`, { shell: 'cmd.exe' });
execSync(`robocopy "${path.join(cleanSklauncher, 'resources')}" "${path.join(stagingDir, 'resources')}" /E /NFL /NDL /NJH /NJS /nc /ns /np || exit 0`, { shell: 'cmd.exe' });

// Copy out/ and package.json from KTLauncher-Source-Code
console.log('   Copying hardened out/ and package.json from source repository...');
execSync(`robocopy "${path.join(projectRoot, 'out')}" "${path.join(stagingDir, 'out')}" /E /NFL /NDL /NJH /NJS /nc /ns /np || exit 0`, { shell: 'cmd.exe' });
fs.copyFileSync(path.join(projectRoot, 'package.json'), path.join(stagingDir, 'package.json'));

// 2. Pack ASAR
console.log('\n2. Packing production app.asar...');
if (fs.existsSync(targetAsar)) fs.unlinkSync(targetAsar);
execSync(`npx @electron/asar pack "${stagingDir}" "${targetAsar}" --unpack "resources/**"`, { stdio: 'inherit' });

// 3. Compute Asar Header Hash
console.log('\n3. Calculating Asar Header Integrity Hash...');
const asarBuf = fs.readFileSync(targetAsar);
const headerSize = asarBuf.readUInt32LE(12);
const headerStr = asarBuf.toString('utf8', 16, 16 + headerSize);
const asarHash = crypto.createHash('sha256').update(headerStr).digest('hex');
console.log('   Asar Header Hash (SHA-256):', asarHash);

// 4. Create fresh Windows distribution folder C:/Users/.../Desktop/KTLauncher-v1.0.2-Windows
console.log(`\n4. Assembling Windows distribution at ${dist102Dir}...`);
if (fs.existsSync(dist102Dir)) {
  fs.rmSync(dist102Dir, { recursive: true, force: true });
}
fs.mkdirSync(dist102Dir, { recursive: true });

// Copy runtime binaries and assets from v1.0.1 base (never overwriting v1.0.1)
const filesToCopy = [
  'chrome_100_percent.pak',
  'chrome_200_percent.pak',
  'd3dcompiler_47.dll',
  'dxcompiler.dll',
  'dxil.dll',
  'ffmpeg.dll',
  'icudtl.dat',
  'ktlauncher.ico',
  'libEGL.dll',
  'libGLESv2.dll',
  'LICENSE.electron.txt',
  'LICENSES.chromium.html',
  'resources.pak',
  'snapshot_blob.bin',
  'v8_context_snapshot.bin',
  'vk_swiftshader_icd.json',
  'vk_swiftshader.dll',
  'vulkan-1.dll'
];

for (const file of filesToCopy) {
  const src = path.join(dist101Dir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(dist102Dir, file));
  }
}

// Copy locales directory
execSync(`robocopy "${path.join(dist101Dir, 'locales')}" "${path.join(dist102Dir, 'locales')}" /E /NFL /NDL /NJH /NJS /nc /ns /np || exit 0`, { shell: 'cmd.exe' });

// Prepare resources directory
const distResources = path.join(dist102Dir, 'resources');
fs.mkdirSync(distResources, { recursive: true });
fs.copyFileSync(targetAsar, path.join(distResources, 'app.asar'));

// Copy app.asar.unpacked
const unpackedSrc = path.join(dist101Dir, 'resources/app.asar.unpacked');
if (fs.existsSync(unpackedSrc)) {
  execSync(`robocopy "${unpackedSrc}" "${path.join(distResources, 'app.asar.unpacked')}" /E /NFL /NDL /NJH /NJS /nc /ns /np || exit 0`, { shell: 'cmd.exe' });
}

// Copy elevate.exe and icon files in resources
const resourceFiles = ['elevate.exe', 'icon.ico', 'icon.png', 'tray.ico'];
for (const rf of resourceFiles) {
  const src = path.join(dist101Dir, 'resources', rf);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distResources, rf));
  }
}

// Copy ktlauncher-agent.jar and ktlauncher-agent.jar.sig from agent/build
const agentJarSrc = path.join(projectRoot, 'agent/build/ktlauncher-agent.jar');
const agentSigSrc = path.join(projectRoot, 'agent/build/ktlauncher-agent.jar.sig');
fs.copyFileSync(agentJarSrc, path.join(dist102Dir, 'ktlauncher-agent.jar'));
fs.copyFileSync(agentSigSrc, path.join(dist102Dir, 'ktlauncher-agent.jar.sig'));
// Also keep a copy in project root
fs.copyFileSync(agentJarSrc, path.join(projectRoot, 'ktlauncher-agent.jar'));
fs.copyFileSync(agentSigSrc, path.join(projectRoot, 'ktlauncher-agent.jar.sig'));

// Create clean fresh template ktlauncher-accounts.json (no user data)
fs.writeFileSync(
  path.join(dist102Dir, 'ktlauncher-accounts.json'),
  JSON.stringify({ accounts: [], activeAccountId: null }, null, 2)
);

// Create fresh distribution README.md
const distReadme = `# KTLauncher Offline Edition v1.0.2 (Windows x64)

KTLauncher is a modern, lightweight, privacy-focused Minecraft launcher with full offline profile support.

## Key Features in v1.0.2
- **Complete SKlauncher / SKmedix Detachment:** 100% first-party agent architecture.
- **Enhanced Electron Security Hardening:**
  - Chromium process sandboxing enabled across all renderer windows.
  - Strict Content-Security-Policy (CSP) enforcing trusted local execution.
  - Deny-by-default permission model (clipboard & notifications selectively permitted).
  - Web contents navigation controls blocking unauthorized scheme transitions.
  - Validated IPC boundary with payload sanitization.
- **Zero Account Tracking:** Purely local username-based offline accounts.
- **Java Agent In-Process Interception:** Built and signed with Ed25519 publisher key. Compatible with Java 8, 17, 21, and 25+.
- **Mod Loader Support:** Full compatibility with Vanilla, Fabric, Forge, NeoForge, and Quilt.

## Running KTLauncher
Double-click \`ktlauncher.exe\` to launch.
`;
fs.writeFileSync(path.join(dist102Dir, 'README.md'), distReadme, 'utf8');

// Copy and patch ktlauncher.exe
console.log('   Patching ktlauncher.exe with new Asar Integrity Hash...');
const srcExe = path.join(dist101Dir, 'ktlauncher.exe');
const destExe = path.join(dist102Dir, 'ktlauncher.exe');
fs.copyFileSync(srcExe, destExe);

const exeBuf = fs.readFileSync(destExe);
// Find old hash from v1.0.1
const oldHash = 'c48599a9439a03a062ec7e257d888250e6d73db60fc21550fa19fa79f3f8798d';
const pos = exeBuf.indexOf(oldHash);
if (pos === -1) {
  throw new Error('FATAL: Could not locate old Asar integrity hash in ktlauncher.exe');
}
exeBuf.write(asarHash, pos, 'ascii');
fs.writeFileSync(destExe, exeBuf);

// Verify patch
const verifyBuf = fs.readFileSync(destExe);
const foundHash = verifyBuf.toString('ascii', pos, pos + 64);
if (foundHash !== asarHash) {
  throw new Error('FATAL: Integrity hash verification failed after write!');
}
console.log(`   ✓ Successfully patched ktlauncher.exe at offset ${pos}!`);

console.log('✓ Windows distribution v1.0.2 assembled successfully.');
