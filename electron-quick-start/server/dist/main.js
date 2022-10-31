"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init_external_api = exports.main = exports.external_api = exports.stuff = void 0;
const amqplib_1 = require("amqplib");
const connection_1 = require("./src/connection");
exports.stuff = {};
// const username = "rabbitmq";
const username = 'guest';
const queue_name = {
    queue_1: 'Vala',
    queue_2: 'Mi',
    queue_3: 'Egyedi',
};
const connections = [];
const configurations = [
    {
        async load(channel) {
            const exchange_name = 'Exchange_1';
            channel.assertExchange(exchange_name, 'direct', { arguments: [] });
            channel.bindExchange(queue_name.queue_1, exchange_name, queue_name.queue_1);
            channel.bindExchange(queue_name.queue_2, exchange_name, queue_name.queue_2);
            channel.bindExchange(queue_name.queue_3, exchange_name, queue_name.queue_3);
        },
        async unload(ch) {
            ch.deleteExchange('Exchange_1', { ifUnused: false });
        },
    },
    {
        async load(channel) {
            const exchange_name = 'Exchange_2';
            channel.assertExchange(exchange_name, 'topic', { arguments: [] });
            channel.bindExchange(queue_name.queue_1, exchange_name, queue_name.queue_1);
            channel.bindExchange(queue_name.queue_2, exchange_name, queue_name.queue_2);
            channel.bindExchange(queue_name.queue_3, exchange_name, queue_name.queue_3);
        },
        async unload(ch) {
            ch.deleteExchange('Exchange_2', { ifUnused: false });
        },
    },
    {
        async load(channel) {
            const exchange_name = 'Exchange_3';
            channel.assertExchange(exchange_name, 'fanout', { arguments: [] });
            channel.bindExchange(queue_name.queue_1, exchange_name, queue_name.queue_1);
            channel.bindExchange(queue_name.queue_2, exchange_name, queue_name.queue_2);
            channel.bindExchange(queue_name.queue_3, exchange_name, queue_name.queue_3);
        },
        async unload(ch) {
            ch.deleteExchange('Exchange_3', { ifUnused: false });
        },
    },
];
class ConfigLoader {
    connection;
    constructor(connection) {
        this.connection = connection;
    }
    active_configuration_index = -1;
    async load(index) {
        // TODO :: Handle too much options
        if (this.active_configuration_index > 0) {
            this._unload(this.active_configuration_index);
        }
        this.connection.execute(configurations[index].load);
    }
    async _unload(index) {
        this.connection.execute(configurations[index].unload);
    }
}
exports.external_api = {
    shutdown() {
        return conn_handler.close_all();
    },
    async listen_to_private_queue() {
        const x = await conn_handler.listen_to_private_queue((id, message) => {
            ElectronAPI.notify(id, message, Date.now());
        });
        console.log('X: ', x);
        setTimeout(() => ElectronAPI.notify(x[0], 'Test', Date.now()), 1500);
        return x;
    },
    listen_to_queue(queue_name) {
        conn_handler.listen_to_queue(queue_name, (id, message) => {
            ElectronAPI.notify(id, message, Date.now());
        });
    },
    load_configuration(configuration_index) {
        ConfigLoaderInstance.load(configuration_index);
    },
};
const connection_config = {
    hostname: 'localhost',
    username,
    password: username,
    vhost: '/',
};
const conn_handler = new connection_1.ConnHolder(async () => (0, amqplib_1.connect)(connection_config));
let ConfigLoaderInstance;
async function main() {
    ConfigLoaderInstance = new ConfigLoader(await conn_handler.create_connection_handler());
}
exports.main = main;
let ElectronAPI;
async function init_external_api(api) {
    ElectronAPI = api;
}
exports.init_external_api = init_external_api;
