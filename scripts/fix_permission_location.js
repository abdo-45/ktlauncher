const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../out/main/index.js');
let content = fs.readFileSync(file, 'utf8');

const lockIdx = content.indexOf('// Phase 3: Strict Permission Lockdown');
if (lockIdx !== -1) {
  const readyIdx = content.indexOf('h.app.whenReady().then(async()=>{', lockIdx);
  if (readyIdx !== -1) {
    // Remove the block from lockIdx up to readyIdx
    const before = content.slice(0, lockIdx).trimEnd();
    const after = content.slice(readyIdx);
    
    const replacement = `h.app.whenReady().then(async()=>{\n` +
      `  if (h.session && h.session.defaultSession) {\n` +
      `    try {\n` +
      `      h.session.defaultSession.setPermissionRequestHandler((e, t, n) => {\n` +
      `        const r = ['clipboard-read', 'clipboard-sanitized-write', 'notifications'];\n` +
      `        n(r.includes(t));\n` +
      `      });\n` +
      `      h.session.defaultSession.setPermissionCheckHandler((e, t) => {\n` +
      `        const n = ['clipboard-read', 'clipboard-sanitized-write', 'notifications'];\n` +
      `        return n.includes(t);\n` +
      `      });\n` +
      `    } catch (e) {}\n` +
      `  }\n`;

    content = before + '\n' + after.replace('h.app.whenReady().then(async()=>{', replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('✓ Successfully moved permission handler inside app.whenReady()');
  } else {
    console.error('Could not find h.app.whenReady() after lockdown comment');
  }
} else {
  console.log('Lockdown block not found by comment');
}
