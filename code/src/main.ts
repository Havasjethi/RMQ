import { Channel, connect, Connection } from 'amqplib';

const connection_config = {
  hostname: '0.0.0.0',
  password: 'rabbitmq',
  username: 'rabbitmq',
  vhost: '/vhost',
};

const channelContainer = (connection: Connection) => ({
  channels_available: [] as Channel[],
  channels_all: [] as Channel[],
  async get() {
    const item = this.channels_available.shift();
    if (item) return item;

    const channel = await connection.createChannel();
    this.channels_all.push(channel);
    return channel;
  },
  add(ch: Channel) {
    this.channels_available.push(ch);
  },
});

class AmqpClient {
  connection?: Connection;
  channelContainer!: ReturnType<typeof channelContainer>;

  async connect() {
    this.connection = await connect(connection_config);
    this.channelContainer = channelContainer(this.connection);
  }

  async close() {
    console.log('Try to close');
    await Promise.all(this.channelContainer.channels_available.map((e) => e.close()));
    await this.connection!.close().catch((e) => console.log(e));
    console.log('COnnection closed');
  }

  async declareQ(q_name: string) {
    await this.with_channel(async (channel) => {
      const res = await channel.assertQueue(q_name, { autoDelete: true });
      await channel.bindQueue(res.queue, 'amq.direct', res.queue);
    });
  }

  private async with_channel(action: (channel: Channel) => Promise<unknown>) {
    const ch = await this.channelContainer.get();
    await action(ch);
    this.channelContainer?.add(ch);
  }

  async subscribe(q_name: string) {
    return this.with_channel(async (ch) => {
      ch.consume(q_name, (message) => {
        console.log('Message received: ', message);
        ch.ack(message!);
      });
    });
  }

  async publish(exchange: string | undefined, q_name: string, message: String) {
    const ch = await this.channelContainer.get();
    // console.log(ch);
    // if (!ch?.publish('amq.direct', 'basic_shit', Buffer.from(message))) {
    const buffer = Buffer.from(message);
    console.log((ch as any)['then']);
    // const result = ch!.publish('what', 'basic_shit', buffer);
    const result = ch!.sendToQueue(q_name, buffer);
    ch!.publish('', q_name, buffer);
    ch!.publish('amq.direct', q_name, buffer);
    ch!.publish('amq.direct', '', buffer);
    ch!.publish(exchange!, q_name, buffer);
    if (!result) {
      console.log('Unable to publish');
    }
    this.channelContainer?.add(ch);
  }
}

const exit_hooks: (() => Promise<unknown>)[] = [];
const x = async () => {
  console.log('Called');
  const result = Promise.all(exit_hooks.map((e) => e()));
  console.log(result);

  console.log(process.pid);
  console.log(await result);
  console.log(process.pid);
  process.exit(0);
};

console.log(process.pid);
process.on('SIGINT', x);

const main = async () => {
  const listening = new AmqpClient();
  const publisher = new AmqpClient();

  await listening.connect();
  await publisher.connect();

  const Q = 'basic_shit';

  await listening.declareQ(Q);
  await publisher.declareQ(Q);

  await listening.subscribe(Q);

  let msgCount = 10;
  const fn = async () => {
    if (--msgCount <= 0) {
      // await listening.close();
      // await publisher.close();
      clearTimeout(intervalID);
    } else {
      // client.publish('amq.direct', Q, 'sAlom');
      publisher.publish('amq.direct', Q, 'sAlom');
      publisher.publish('', Q, 'sAlom');
    }
  };
  const intervalID = setInterval(fn, 1000);

  setTimeout(() => {
    listening.close();
    publisher.close();
  }, 30_000);

  exit_hooks.push(() => listening.close());
};
main();
