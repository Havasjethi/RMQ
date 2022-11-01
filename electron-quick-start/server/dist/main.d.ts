export declare const stuff: {};
export declare const external_api: {
    shutdown(): Promise<void[]>;
    unsubscribe(id: number): Promise<void>;
    listen_to_private_queue(): Promise<[
        number,
        string
    ]>;
    listen_to_queue(queue_name: string): Promise<[
        number,
        string
    ]>;
    load_configuration(configuration_index: number): Promise<void>;
};
export declare function main(): Promise<void>;
interface API {
    notify(connectionId: number, message: String, time: number): void;
    notifyError(connectionId: number, message: String, time: number): void;
}
export declare function init_external_api(api: API): Promise<void>;
export {};
//# sourceMappingURL=main.d.ts.map