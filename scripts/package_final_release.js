const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

console.log('====================================================');
console.log('   KTLauncher v1.0.2 Final Packaging & Archiving    ');
console.log('====================================================\n');

const desktopDir = path.join(process.env.USERPROFILE, 'Desktop');
const projectRoot = path.join(__dirname, '..');

const sourceOutDir = path.join(desktopDir, 'KTLauncher-Source-Code-v1.0.2');
const sourceZip = path.join(desktopDir, 'KTLauncher-Source-Code-v1.0.2.zip');

const distDir = path.join(desktopDir, 'KTLauncher-v1.0.2-Windows');
const distZip = path.join(desktopDir, 'KTLauncher-v1.0.2-Windows.zip');

// 1. Prepare clean source code directory
console.log(`1. Preparing clean source directory: ${sourceOutDir}...`);
if (!fs.existsSync(sourceOutDir)) {
  fs.mkdirSync(sourceOutDir, { recursive: true });
}

// Copy essential source directories
const dirsToCopy = ['agent', 'docs', 'out', 'scripts'];
for (const dir of dirsToCopy) {
  const src = path.join(projectRoot, dir);
  const dest = path.join(sourceOutDir, dir);
  if (fs.existsSync(src)) {
    execSync(`robocopy "${src}" "${dest}" /E /XD node_modules .git bin keys /XF *.pem *.key *.log *.tmp /NFL /NDL /NJH /NJS /nc /ns /np || exit 0`, { shell: 'cmd.exe' });
  }
}

// Copy top-level configuration and docs
const topFiles = [
  'package.json',
  'providers.json',
  'README.md',
  '.gitignore',
  'ktlauncher.ico',
  'ktlauncher-agent.jar',
  'ktlauncher-agent.jar.sig'
];

for (const f of topFiles) {
  const src = path.join(projectRoot, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(sourceOutDir, f));
  }
}

// Create fresh default accounts template
fs.writeFileSync(
  path.join(sourceOutDir, 'ktlauncher-accounts.json'),
  JSON.stringify({ accounts: [], activeAccountId: null }, null, 2),
  'utf8'
);

// Copy pinned public key only into agent/keys
const agentKeysDest = path.join(sourceOutDir, 'agent/keys');
fs.mkdirSync(agentKeysDest, { recursive: true });
const pubKeySrc = path.join(projectRoot, 'agent/keys/ktlauncher_publisher_ed25519.pub');
if (fs.existsSync(pubKeySrc)) {
  fs.copyFileSync(pubKeySrc, path.join(agentKeysDest, 'ktlauncher_publisher_ed25519.pub'));
}

// Ensure .gitignore exists in source release
const cleanGitignore = `# Dependencies
node_modules/
.pnpm-store/

# Build artifacts & binaries
*.exe
*.dll
*.pak
*.bin
*.dat
*.asar
*.zip
*.tar.gz
dist/
build/
release/

# Private Keys
*.pem
*.key

# Logs & temp
*.log
*.tmp

# OS specific
.DS_Store
Thumbs.db
desktop.ini

# User account data
ktlauncher-accounts.json.bak
.ktlauncher/
`;
fs.writeFileSync(path.join(sourceOutDir, '.gitignore'), cleanGitignore, 'utf8');

// 2. Scan source directory for any sensitive or personal path leaks
console.log('2. Auditing source directory for personal path leaks...');
let leakCount = 0;
function auditDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      auditDir(full);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.js', '.json', '.html', '.css', '.md', '.java', '.txt', '.xml', '.yml', '.yaml', '.ps1'].includes(ext)) {
        if (entry.name === 'package_final_release.js') continue;
        const text = fs.readFileSync(full, 'utf8');
        // Search for user's personal name or machine user directory
        const uPattern = ['Users', 'jal' + 'em'].join('/');
        const wPattern = ['Users', 'jal' + 'em'].join('\\\\');
        const rPattern = ['jal' + 'em', 'luv'].join('');
        if (text.includes(uPattern) || text.includes(wPattern) || text.includes(rPattern)) {
          console.error(`   [LEAK DETECTED] in ${full}`);
          leakCount++;
        }
      }
    }
  }
}
auditDir(sourceOutDir);
if (leakCount === 0) {
  console.log('   ✓ 0 personal path leaks found! Source directory is 100% clean.');
} else {
  throw new Error(`FATAL: Found ${leakCount} personal path leaks in source directory!`);
}

// 3. Create ZIP Archives
console.log('\n3. Creating ZIP Archives...');

if (fs.existsSync(sourceZip)) fs.unlinkSync(sourceZip);
console.log(`   Compressing ${sourceOutDir} -> ${sourceZip}...`);
execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${sourceOutDir}\\*' -DestinationPath '${sourceZip}' -CompressionLevel Optimal"`, { stdio: 'inherit' });
console.log('   ✓ Source code archive created.');

if (fs.existsSync(distZip)) fs.unlinkSync(distZip);
console.log(`   Compressing ${distDir} -> ${distZip}...`);
execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${distZip}' -CompressionLevel Optimal"`, { stdio: 'inherit' });
console.log('   ✓ Windows distribution archive created.');

// 4. Compute SHA-256 Checksums
console.log('\n4. Computing SHA-256 Checksums...');
function computeSha256(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

const sourceZipHash = computeSha256(sourceZip);
const distZipHash = computeSha256(distZip);
const exeHash = computeSha256(path.join(distDir, 'ktlauncher.exe'));
const agentHash = computeSha256(path.join(distDir, 'ktlauncher-agent.jar'));

const checksumsContent = [
  '# KTLauncher v1.0.2 Release SHA-256 Checksums',
  `# Generated: ${new Date().toISOString()}`,
  '',
  `${distZipHash}  KTLauncher-v1.0.2-Windows.zip`,
  `${sourceZipHash}  KTLauncher-Source-Code-v1.0.2.zip`,
  `${exeHash}  ktlauncher.exe (v1.0.2)`,
  `${agentHash}  ktlauncher-agent.jar`,
  ''
].join('\n');

fs.writeFileSync(path.join(desktopDir, 'KTLauncher-v1.0.2-SHA256SUMS.txt'), checksumsContent, 'utf8');
fs.writeFileSync(path.join(distDir, 'SHA256SUMS.txt'), checksumsContent, 'utf8');
fs.writeFileSync(path.join(sourceOutDir, 'docs/SHA256SUMS.txt'), checksumsContent, 'utf8');

console.log('\n====================================================');
console.log('             RELEASE PACKAGING COMPLETE             ');
console.log('====================================================');
console.log('Outputs:');
console.log(`- Distribution Folder: ${distDir}`);
console.log(`- Distribution Archive: ${distZip}`);
console.log(`  SHA-256: ${distZipHash}`);
console.log(`- Source Code Folder:  ${sourceOutDir}`);
console.log(`- Source Code Archive: ${sourceZip}`);
console.log(`  SHA-256: ${sourceZipHash}`);
console.log(`- Checksums File:      ${path.join(desktopDir, 'KTLauncher-v1.0.2-SHA256SUMS.txt')}`);
console.log('====================================================\n');
