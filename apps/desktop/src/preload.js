const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('csmDesktop', {
  platform: process.platform,
});
