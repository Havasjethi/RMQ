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
  const data = {
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
  };
  const app = new Vue({
    el: '#app',
    data,
    methods: {
      submit_message() {
        // this.listeners.forEach((e) => e.messages.push(createMessage(this.form_data.message)));
        API.send_message(
          this.form_data.exchange,
          this.form_data.routing_key,
          this.form_data.message
        );
      },
      async submit_queue(e) {
        const createQueue = await API.listen_to_queue(this.queue_data.name);
        console.log(createQueue);

        let x = createListener(createQueue);
        this.listeners.push(x);
        API.subscribe_to_queue();
      },
      async create_private() {
        const res = await API.listen_to_private_queue();
        const x = createListener(res[1]);
        this.listeners.push(x);
        API.subscribe_to_queue(res[0], (content, time) => {
          x.messages.push(createMessage(content, time));
        });
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
