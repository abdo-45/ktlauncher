const fs = require('fs');
const path = require('path');

console.log('=== Applying Phase 3 Electron Security Hardening ===');

// 1. Update package.json
const pkgPath = path.join(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = '1.0.2';
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
console.log('✓ package.json updated to 1.0.2');

// 2. Update out/renderer/index.html
const htmlPath = path.join(__dirname, '../out/renderer/index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace('<title>KTLauncher 1.0.1</title>', '<title>KTLauncher 1.0.2</title>');

// Tighten CSP: remove unsafe-eval, unsafe-inline from script-src; add object-src 'none'; base-uri 'self'
const oldCsp = `content="default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: starship-icon:; media-src 'self' ; connect-src 'self' data: https://piston-meta.mojang.com https://launchermeta.mojang.com; frame-src 'self' https://www.youtube.com/embed/ https://www.youtube-nocookie.com/embed/"`;
const newCsp = `content="default-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: starship-icon:; media-src 'self'; connect-src 'self' data: https://piston-meta.mojang.com https://launchermeta.mojang.com https://resources.download.minecraft.net https://libraries.minecraft.net https://raw.githubusercontent.com; object-src 'none'; base-uri 'self'; frame-src 'self' https://www.youtube.com/embed/ https://www.youtube-nocookie.com/embed/"`;

if (html.includes(oldCsp)) {
  html = html.replace(oldCsp, newCsp);
  console.log('✓ CSP updated successfully');
} else {
  console.log('Note: CSP tag pattern differed, applying regex replacement...');
  html = html.replace(/content="default-src [^"]+"/, newCsp);
}
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✓ out/renderer/index.html updated');

// 3. Update out/renderer/assets/index-l-q7lo_9.js
const rendererJsPath = path.join(__dirname, '../out/renderer/assets/index-l-q7lo_9.js');
let rendererJs = fs.readFileSync(rendererJsPath, 'utf8');
rendererJs = rendererJs.replaceAll('KTLauncher 1.0.1', 'KTLauncher 1.0.2');
rendererJs = rendererJs.replaceAll('"1.0.1"', '"1.0.2"');
fs.writeFileSync(rendererJsPath, rendererJs, 'utf8');
console.log('✓ out/renderer/assets/index-l-q7lo_9.js updated to 1.0.2');

// 4. Update out/main/index.js
const mainJsPath = path.join(__dirname, '../out/main/index.js');
let mainJs = fs.readFileSync(mainJsPath, 'utf8');

// Update version strings
mainJs = mainJs.replaceAll('const currentVer="1.0.1";', 'const currentVer="1.0.2";');
mainJs = mainJs.replaceAll('"User-Agent":"KTLauncher/1.0.1"', '"User-Agent":"KTLauncher/1.0.2"');
console.log('✓ Version strings bumped in out/main/index.js');

// Enable sandbox on both windows
let sandboxCount = 0;
mainJs = mainJs.replace(/sandbox:!1/g, () => {
  sandboxCount++;
  return 'sandbox:!0';
});
console.log(`✓ Enabled sandbox on ${sandboxCount} window instances (sandbox: true)`);

// Add permission request handler and permission check handler to session defaultSession
const permHandlerCode = `
// Phase 3: Strict Permission Lockdown
if (h.session && h.session.defaultSession) {
  h.session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['clipboard-read', 'clipboard-sanitized-write', 'notifications'];
    callback(allowed.includes(permission));
  });
  h.session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    const allowed = ['clipboard-read', 'clipboard-sanitized-write', 'notifications'];
    return allowed.includes(permission);
  });
}
`;

// Insert permission handler before app ready or window creation
const appReadyTarget = 'h.app.whenReady().then(';
if (mainJs.includes(appReadyTarget)) {
  mainJs = mainJs.replace(appReadyTarget, `${permHandlerCode}\n${appReadyTarget}`);
  console.log('✓ Injected defaultSession permission request handler');
} else {
  console.warn('Warning: Could not find app.whenReady target in main index.js');
}

fs.writeFileSync(mainJsPath, mainJs, 'utf8');
console.log('✓ out/main/index.js written successfully');
