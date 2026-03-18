const { contextBridge } = require('electron')

// Expón APIs nativas aquí si las necesitas en el futuro
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true
})