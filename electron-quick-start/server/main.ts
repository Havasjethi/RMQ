import { Channel, connect } from 'amqplib';
import { ConnectionHandler, ConnHolder as ConnectionHolder } from './src/connection';

export const stuff = {};
// const username = "rabbitmq";
const username = 'guest';

const QueueNames = {
  queue_1: 'Vala',
  queue_2: 'Mi',
  queue_3: 'Egyedi',
};

// const connections: ConnectionHolder[] = [];

type ConfigLoadFunction = {
  load: (channel: Channel) => Promise<void>;
  unload: (channel: Channel) => Promise<void>;
};

const configurations: ConfigLoadFunction[] = [
  {
    async load(channel) {
      const exchange_name = 'Exchange_1';
      channel.assertExchange(exchange_name, 'direct', { arguments: [] });
      channel.bindQueue(QueueNames.queue_1, exchange_name, QueueNames.queue_1);
      channel.bindQueue(QueueNames.queue_2, exchange_name, QueueNames.queue_2);
      channel.bindQueue(QueueNames.queue_3, exchange_name, QueueNames.queue_3);
    },
    async unload(ch) {
      ch.deleteExchange('Exchange_1', { ifUnused: false });
    },
  },
  {
    async load(channel) {
      const exchange_name = 'Exchange_2';
      channel.assertExchange(exchange_name, 'topic', { arguments: [] });
      channel.bindQueue(QueueNames.queue_1, exchange_name, QueueNames.queue_1);
      channel.bindQueue(QueueNames.queue_2, exchange_name, QueueNames.queue_2);
      channel.bindQueue(QueueNames.queue_3, exchange_name, QueueNames.queue_3);
    },
    async unload(ch) {
      ch.deleteExchange('Exchange_2', { ifUnused: false });
    },
  },

  {
    async load(channel) {
      const exchange_name = 'Exchange_3';
      channel.assertExchange(exchange_name, 'fanout', { arguments: [] });
      channel.bindQueue(QueueNames.queue_1, exchange_name, QueueNames.queue_1);
      channel.bindQueue(QueueNames.queue_2, exchange_name, QueueNames.queue_2);
      channel.bindQueue(QueueNames.queue_3, exchange_name, QueueNames.queue_3);
    },
    async unload(ch) {
      ch.deleteExchange('Exchange_3', { ifUnused: false });
    },
  },
];

class ConfigLoader {
  constructor(private connection: ConnectionHandler) {}
  private active_configuration_index = -1;

  async load(index: number) {
    // TODO :: Handle too much options
    if (this.active_configuration_index > 0) {
      this._unload(this.active_configuration_index);
    }
    await this.assertQueues();
    this.connection.execute(configurations[index].load);
  }

  async _unload(index: number) {
    this.connection.execute(configurations[index].unload);
  }

  private async assertQueues() {
    return this.connection.execute((channel) =>
      Promise.all(
        Object.values(QueueNames).map(async (e) => {
          try {
            console.log('HEllo');
            await channel.assertQueue(e, { autoDelete: true });
          } catch (e) {
            console.log('Warn: Invalid Options');
          }
        })
      )
    );
  }
}

export const external_api = {
  shutdown() {
    return conn_handler.close_all();
  },
  async unsubscribe(id: number) {
    conn_handler.close_handler(id);
    console.log(conn_handler.handlers, id);
  },
  async listen_to_private_queue(): Promise<[number, string]> {
    const x = await conn_handler.listen_to_private_queue((id, message) => {
      ElectronAPI.notify(id, message, Date.now());
    });
    console.log('X: ', x);

    setTimeout(() => ElectronAPI.notify(x[0], 'Test', Date.now()), 1500);

    return x;
  },
  listen_to_queue(queue_name: string): Promise<[number, string]> {
    return conn_handler.listen_to_queue(queue_name, (id, message) => {
      ElectronAPI.notify(id, message, Date.now());
    });
  },
  async load_configuration(configuration_index: number) {
    ConfigLoaderInstance.load(configuration_index);
  },
};

const connection_config = {
  hostname: 'localhost',
  username,
  password: username,
  vhost: '/',
};

const conn_handler = new ConnectionHolder(async () => connect(connection_config));

let ConfigLoaderInstance: ConfigLoader;
export async function main() {
  ConfigLoaderInstance = new ConfigLoader(await conn_handler.create_connection_handler());
}

let ElectronAPI: API;

interface API {
  notify(connectionId: number, message: String, time: number): void;
  notifyError(connectionId: number, message: String, time: number): void;
}

export async function init_external_api(api: API) {
  ElectronAPI = api;
}
