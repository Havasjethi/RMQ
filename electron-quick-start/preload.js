const { contextBridge, ipcRenderer } = require('electron');

const API = {
  listen_to_queue: (name) => ipcRenderer.invoke('listen_to_queue', name),
  listen_to_private_queue: () => ipcRenderer.invoke('listen_to_private_queue'),
  setup_state(state_index) {
    ipcRenderer.invoke('setup_state', state_index);
  },
  subscribe_to_queue: (id, listener) => {
    const channel = `message-${id}`;
    console.log('Listening to inner: ', channel);

    ipcRenderer.on(channel, (event, ...args) => {
      console.log('Message received in render');
      listener(args[0], args[1]);
    });

    // ipcRenderer.on('message', (event, ...args) => {
    // console.log('Me called');
    // listener(messageContent, time);
    // });
  },
  send_message(exchange, routing_key, message) {
    ipcRenderer.invoke('send_message', exchange, routing_key, message);
  },
  // load_configuration: (index) => process.versions.node,
  // chrome: () => process.versions.chrome,
  // electron: () => process.versions.electron,
};
contextBridge.exposeInMainWorld('API', API);
