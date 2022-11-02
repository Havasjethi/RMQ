const options = ['Direct', 'Topic', 'Fanout', 'Header', 'Complex'];

const main = () => {
  const data = {
    options,
    active_config_index: -1,
    form_data: {
      message: 'Hello',
      exchange: '',
      routing_key: 'queue_1',
    },
    queue_data: {
      name: 'q_name',
      auto_delete: false,
    },
    listeners: [],
  };

  const app = new Vue({
    el: '#app',
    data,
    computed: {
      current_alt_text() {
        return this.active_config_index > 0
          ? this.options[this.active_config_index]
          : 'No selected setup';
      },
      current_image() {
        return `assets/${this.active_config_index}.png`;
      },
    },
    methods: {
      format_date(timestamp) {
        return new Date(timestamp).toLocaleTimeString();
      },
      setup_state(state_index) {
        API.setup_state(state_index);
        this.active_config_index = state_index;
      },
      submit_message() {
        API.send_message(
          this.form_data.exchange,
          this.form_data.routing_key,
          this.form_data.message
        );
      },
      remove_listener(listener) {
        const index = data.listeners.findIndex((e) => e.id === listener.id);
        data.listeners.splice(index, 1);
        API.unsubscribe(listener.id);
      },
      clearQueue(listener) {
        const index = data.listeners.findIndex((e) => e.id === listener.id);
        data.listeners[index].messages.splice(0);
      },
      async submit_queue(e) {
        this._handle_result(
          await API.listen_to_queue(this.queue_data.name, this.queue_data.auto_delete)
        );
      },
      async create_private() {
        this._handle_result(await API.listen_to_private_queue());
      },
      _handle_result(res) {
        const x = createListener(res[1], res[0]);
        this.listeners.push(x);
        API.subscribe_to_queue(res[0], (content, time) => {
          x.messages.push(createMessage(content, time));
        });
      },
    },
  });
};

let c = 1;
const createListener = (name, id) => ({
  id: id || c++,
  name: name || c,
  // messages: [createMessage('..........')],
  messages: [],
});
const createMessage = (content, time) => ({
  content: content || '',
  time: time || Date.now(),
});

main();
