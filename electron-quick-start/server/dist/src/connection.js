"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionHandler = exports.ConnHolder = void 0;
class ConnHolder {
    connection_creator;
    connections = [];
    handlers = [];
    constructor(connection_creator) {
        this.connection_creator = connection_creator;
    }
    async create_connection_handler() {
        const a = new ConnectionHandler(await this.connection_creator());
        this.handlers.push(a);
        return a;
    }
    async close_all() {
        return Promise.all(this.connections.map((e) => e.close()));
    }
    async listen_to_private_queue(listener) {
        let ch = await this.create_connection_handler();
        return [
            ch.id,
            await ch.create_private_queue((message) => {
                listener(ch.id, message);
            }),
        ];
    }
    async listen_to_queue(queue_name, listener) {
        let ch = await this.create_connection_handler();
        ch.consume(queue_name, (message) => {
            listener(ch.id, message);
        });
    }
}
exports.ConnHolder = ConnHolder;
class ConnectionHandler {
    connection;
    static nextId = 1;
    id = ConnectionHandler.nextId++;
    channels = [];
    all_channels = [];
    constructor(connection) {
        this.connection = connection;
    }
    async execute(action) {
        return action(await this.getChannel());
    }
    async getChannel() {
        const channel = await this.connection.createChannel();
        this.all_channels.push(channel);
        return channel;
    }
    async consume(queue_name, message_handler) {
        const channel = await this.getChannel();
        const x = channel.assertQueue(queue_name, {});
        channel.consume(queue_name, (message) => {
            if (!message)
                return;
            message_handler(message);
            channel.ack(message);
        });
    }
    async create_private_queue(message_handler) {
        const channel = await this.getChannel();
        const queue_name = (await channel.assertQueue('', { autoDelete: true, arguments: [] })).queue;
        channel.consume(queue_name, (message) => {
            if (!message)
                return;
            message_handler(String.fromCharCode(...message.content));
            channel.ack(message);
        });
        return queue_name;
    }
    close() {
        try {
            this.connection.close();
        }
        catch (e) {
            console.log('Unable to close connection');
        }
    }
}
exports.ConnectionHandler = ConnectionHandler;
