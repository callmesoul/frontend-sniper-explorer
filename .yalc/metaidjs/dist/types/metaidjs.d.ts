import PostmessageClient from './postmessage-client';
declare global {
    interface Window {
        mainFrameMessage: PostmessageClient;
    }
}
interface ObjTypes<T> {
    [key: string]: T;
    [key: number]: T;
}
interface BaseParamsType {
    accessToken: string;
    callback?: Function;
    onCancel?: Function;
}
interface OauthSettingsTypes {
    clientId: string;
    redirectUri: string;
    clientSecret?: string;
    scope?: string;
    responseType?: string;
}
interface ConstructorOptionsTypes {
    baseUri?: string;
    oauthSettings: OauthSettingsTypes;
    onLoaded?: Function;
    onError?: Function;
}
export interface ProtocolOptions {
    nodeName: string;
    version?: string;
    data?: string;
    dataType?: string;
    encoding?: string;
    parentTxId?: string;
    encrypt?: number | string;
    metaIdTag?: string;
    keyPath?: string;
    parentAddress?: string;
    needConfirm?: boolean;
    checkOnly?: boolean;
    brfcId?: string;
    path: string;
    nodeKey?: string;
    payCurrency?: string;
    payTo?: SendToTypes[];
    autoRename?: boolean;
}
interface SendToTypes {
    address: string;
    amount: number;
}
interface ProtocolParamsTypes extends ProtocolOptions, BaseParamsType {
    accessToken: string;
    handlerId?: string;
}
export declare class MetaIdJs {
    postMessage: PostmessageClient;
    oauthSettings: OauthSettingsTypes;
    mainFrameEl: HTMLIFrameElement | null;
    SHOWMONEY_URL: string;
    accessToken: string;
    isInjectMainFrame: boolean;
    isLoaded: boolean;
    _handlers: ObjTypes<any>;
    onLoaded: Function | undefined;
    onError: Function;
    constructor(options: ConstructorOptionsTypes);
    /**
     * injectMainFrame  注入主框架
     */
    injectMainFrame(): void;
    private initHandle;
    /**
     * getUserInfo
     */
    getUserInfo(params: {
        accessToken: string;
        callback?: Function;
    }): void;
    /**
     * signMessage
     */
    signMessage(params: {
        accessToken: string;
        callback?: Function;
        data: string;
    }): void;
    /**
     * eciesEncryptData
     */
    eciesEncryptData(params: {
        accessToken: string;
        callback?: Function;
        data: string;
    }): void;
    eciesDecryptData(params: {
        accessToken: string;
        callback?: Function;
        data: string;
    }): void;
    /**
     * ecdhEncryptData
     */
    ecdhEncryptData(params: {
        accessToken: string;
        callback?: Function;
        data: string;
    }): void;
    ecdhDecryptData(params: {
        accessToken: string;
        callback?: Function;
        data: string;
    }): void;
    getFTList(params: {
        accessToken: string;
        callback?: Function;
        data?: string;
    }): void;
    addProtocolNode(params: ProtocolParamsTypes): void;
    /**
     * createProtocolNode
     */
    sendMetaDataTx(params: ProtocolParamsTypes): void;
    payToAddress(params: {
        accessToken: string;
        callback?: Function;
        data: string;
    }): void;
    private handleCreateNodeSuccess;
    private showLoadingPopup;
    private handleCreateNodeError;
    private handleConfirmCreateNode;
    private handleCloseCreateNode;
    private handleErrorNotLoggedIn;
    private handleCallback;
    private handleSdkLoaded;
    private handleCommonError;
    private handleLoading;
    private handleNotEnoughMoney;
    private init;
}
export {};
