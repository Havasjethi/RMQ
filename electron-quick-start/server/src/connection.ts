import { Channel, Connection } from 'amqplib';

export class ConnHolder {
  connections: Connection[] = [];
  handlers: ConnectionHandler[] = [];

  constructor(private connection_creator: () => Promise<Connection>) { }

  async create_connection_handler(): Promise<ConnectionHandler> {
    const a = new ConnectionHandler(await this.connection_creator());
    this.handlers.push(a);
    return a;
  }

  async close_handler(id: number) {
    this.handlers.find((e) => e.id === id)?.close();
  }

  async close_all() {
    return Promise.all(
      this.connections.map((e) => {
        try {
          e.close();
        } catch (exception) {
          console.log('Close error, Maybe already closed');
        }
      })
    );
  }

  async listen_to_private_queue(
    listener: (id: any, message: any) => void
  ): Promise<[number, string]> {
    const ch = await this.create_connection_handler();

    return [
      ch.id,
      await ch.create_private_queue((message) => {
        listener(ch.id, message);
      }),
    ];
  }

  async listen_to_queue(
    queue_name: string,
    listener: (id: number, message: string) => void
  ): Promise<[number, string]> {
    const ch = await this.create_connection_handler();

    return [
      ch.id,
      await ch.consume(queue_name, (message) => {
        listener(ch.id, message);
      }),
    ];
  }
}

export class ConnectionHandler {
  private static nextId = 1;
  public id: number = ConnectionHandler.nextId++;
  private channels: Channel[] = [];
  private all_channels: Channel[] = [];

  constructor(private connection: Connection) { }

  async execute(action: (channel: Channel) => Promise<unknown | void>) {
    return action(await this.getChannel());
  }

  private async getChannel() {
    const channel = await this.connection.createChannel();
    this.all_channels.push(channel);
    return channel;
  }

  public async consume(
    queue_name: string,
    message_handler: (message_content: any) => void
  ): Promise<string> {
    const channel = await this.getChannel();
    const x = await channel.assertQueue(queue_name, {});
    channel.consume(queue_name, (message) => {
      if (!message) return;
      console.log('Received AMQ message', message);
      message_handler(String.fromCharCode(...message.content));
      channel.ack(message);
    });

    return x.queue;
  }

  async create_private_queue(message_handler: (message: string) => void): Promise<string> {
    const channel = await this.getChannel();
    const queue_name = (
      await channel.assertQueue('', { exclusive: true, autoDelete: true, arguments: [] })
    ).queue;
    channel.consume(queue_name, (message) => {
      if (!message) return;
      message_handler(String.fromCharCode(...message.content));
      channel.ack(message);
    });

    return queue_name;
  }

  public close() {
    try {
      this.connection.close();
    } catch (e) {
      console.log('Unable to close connection');
    }
  }
}
