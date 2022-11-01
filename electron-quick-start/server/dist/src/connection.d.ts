import { Channel, Connection } from 'amqplib';
export declare class ConnHolder {
    private connection_creator;
    connections: Connection[];
    handlers: ConnectionHandler[];
    constructor(connection_creator: () => Promise<Connection>);
    create_connection_handler(): Promise<ConnectionHandler>;
    close_all(): Promise<void[]>;
    listen_to_private_queue(listener: (id: any, message: any) => void): Promise<[number, string]>;
    listen_to_queue(queue_name: string, listener: (id: number, message: string) => void): Promise<void>;
}
export declare class ConnectionHandler {
    private connection;
    private static nextId;
    id: number;
    private channels;
    private all_channels;
    constructor(connection: Connection);
    execute(action: (channel: Channel) => Promise<unknown | void>): Promise<unknown>;
    private getChannel;
    consume(queue_name: string, message_handler: (message_content: any) => void): Promise<void>;
    create_private_queue(message_handler: (message: string) => void): Promise<string>;
    close(): void;
}
//# sourceMappingURL=connection.d.ts.map