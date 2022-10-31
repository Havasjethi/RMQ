const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('API', {
  listen_to_queue: (name) => ipcRenderer.invoke('listen_to_queue', name),
  // load_configuration: (index) => process.versions.node,
  // chrome: () => process.versions.chrome,
  // electron: () => process.versions.electron,
});
