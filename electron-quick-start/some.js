const ipcRenderer = {
  invoke(channel, ...args) {
    console.log('Rendered.invoke', channel, ...args);
  },

  on(channel, fuunction) {
    console.log('Rendered.on', channel, fuunction);
  },
};
var API = {
  listen_to_queue: (name) => Math.ceil(Math.random() * 1000),
  listen_to_private_queue: () => Math.ceil(Math.random() * 1000),
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
  },
  send_message(exchange, routing_key, message) {
    ipcRenderer.invoke('send_message', exchange, routing_key, message);
  },
  unsubscribe() {
    ipcRenderer.invoke('send_message', exchange, routing_key, message);
  },
};
