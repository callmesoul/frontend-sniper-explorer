interface ObjTypes<T> {
    [key: string]: T;
    [key: number]: T;
}
export default class PostmessageClient {
    handlers: ObjTypes<Function>;
    targetWindow: Window | null;
    _pendingMessages: [];
    _deliverMessages: boolean;
    _replayQueue: object;
    constructor(window: Window | null);
    start(): void;
    finalize(): void;
    subscribe(topic: string, handler: Function): void;
    send(topic: string, payload: any, metadata?: {}): void | {
        v1: {
            topic: string;
            payload: any;
            messageId: string;
        };
    };
    _onMessageReceived: (event: ObjTypes<any>) => Promise<void>;
}
export {};
