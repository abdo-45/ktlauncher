const fs = require('fs');
const path = require('path');

const preloadFile = path.join(__dirname, '../out/preload/index.js');
let content = fs.readFileSync(preloadFile, 'utf8');

const target = 'let o=require("@electron-toolkit/preload"),n=require("electron");';
const replacement = `let n=require("electron");const electronAPI={ipcRenderer:{send(e,...t){n.ipcRenderer.send(e,...t)},sendSync(e,...t){return n.ipcRenderer.sendSync(e,...t)},sendToHost(e,...t){n.ipcRenderer.sendToHost(e,...t)},postMessage(e,t,r){n.ipcRenderer.postMessage(e,t,r)},invoke(e,...t){return n.ipcRenderer.invoke(e,...t)},on(e,t){n.ipcRenderer.on(e,t);return()=>n.ipcRenderer.removeListener(e,t)},once(e,t){n.ipcRenderer.once(e,t);return()=>n.ipcRenderer.removeListener(e,t)},removeListener(e,t){n.ipcRenderer.removeListener(e,t);return this},removeAllListeners(e){n.ipcRenderer.removeAllListeners(e)}},webFrame:{insertCSS(e){return n.webFrame.insertCSS(e)},setZoomFactor(e){typeof e=="number"&&e>0&&n.webFrame.setZoomFactor(e)},setZoomLevel(e){typeof e=="number"&&n.webFrame.setZoomLevel(e)}},webUtils:{getPathForFile(e){return n.webUtils?.getPathForFile?n.webUtils.getPathForFile(e):""}},process:{get platform(){return process.platform},get versions(){return process.versions},get env(){return{...process.env}}}};var o={electronAPI};`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(preloadFile, content, 'utf8');
  console.log('✓ Successfully inlined electronAPI into out/preload/index.js');
} else {
  console.log('Target string not found in out/preload/index.js');
}
