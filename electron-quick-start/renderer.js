console.log('Hello');
const options = [
  {
    name: 'A',
    fn: () => {
      console.log('Hello');
    },
  },
  {
    name: 'B',
    fn: () => {
      console.log('B ello');
    },
  },
];

const main = () => {
  const app = new Vue({
    el: '#app',
    data: {
      message: 'Hello Vue!',
      options,
      form_data: {
        message: 'm',
        exchange: 'e',
        routing_key: 'k',
      },
      queue_data: {
        name: 'q_name',
      },
      listeners: [createListener(), createListener()],
    },
    methods: {
      submit_message() {
        this.listeners.forEach((e) => e.messages.push(createMessage(this.form_data.message)));
      },
      submit_queue: function (e) {
        this.listeners.push(createListener(this.queue_data.name));
      },
      async create_private() {
        console.log(await API.listen_to_queue('valami'));
      },
    },
  });
};

let c = 1;
const createListener = (name) => ({
  name: name || c++,
  messages: [createMessage(), createMessage()],
});
const createMessage = (content, time) => ({
  content: content || 'Hello',
  time: time || Date.now(),
});

main();
