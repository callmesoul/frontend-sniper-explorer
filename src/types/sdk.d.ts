import { ProtocolOptions } from "metaidjs";
import { NFTIssueParamsIconType } from "../emums";

export interface SdkMetaidJsOptionsTypes {
    baseUri: string;
    baseApiUrl: string;
    redirectUrl: string;
    oauthSettings: SdkMetaidJsOauthSettingsTypes;
}
export interface SdkMetaidJsOauthSettingsTypes {
    clientId: string;
    redirectUri: string;
    clientSecret?: string;
    scope?: string;
    responseType?: string;
}
export interface ProtocolParamsTypes extends ProtocolOptions, BaseParamsType {
  accessToken: string;
  handlerId?: string;
}
export interface BaseParamsType {
    accessToken: string;
    callback?: Function;
    onCancel?: Function;
}

export interface appMetaIdJsParams {
    accessToken: string;
    data: any;
    onCancel?: Function;
}

export interface appMetaIdJsParams {
    accessToken: string;
    data: any;
    onCancel?: Function;
}

export interface NftFunParams { 
    accessToken: string
}

export interface CreateMetaFileFunParams extends NftFunParams{
    data: {
        name: string,
        data: string,
        encrypt: string,
        data_type: string
    }
}
export interface MetaIdJsRes extends NftFunParams{
    code: number
    data: any
    status: string
    handlerId: string
    appAccessToken?: string 
}
export interface SdkGenesisNFTRes extends MetaIdJsRes{
    data: {
        codehash: string
        genesisId: string
        genesisTxid: string
        sensibleId: string
        amount?: number
    }
}

export interface SendMetaDataTxRes extends MetaIdJsRes{
    data: {
        txId: string
        // checkOnly = true
        usedAmount?: number
        usedAmountCent?: number
        nodeAddress?: string
    }
}

export interface CreateNFTParams extends NFTGenesisParams, NFTIssueParams{
    codeHash?: string,
    genesis?: string,
    genesisTxId?: string,
    sensibleId?: string
}


export enum SdkCallBackCodes {
    success = 200
}


export interface SdkCallBack {
    code: SdkCallBackCodes
    data: any,
    status: string
}

export interface IssueNFTResData extends MetaIdJsRes {
    data:{
      metaTdid: string
      nftId: string
      tokenId: string
      txId: string
      tokenIndex: string
      amount?: number
    }
}

export interface GetBalanceRes extends MetaIdJsRes{
    data:{
        bsv: number,
        satoshis: number
    }
}

export interface NFTCancelResData extends MetaIdJsRes {
    data: {
        tx: any
        txHex: string
        txid: string,
        amount?: number
    }
}

export interface NftBuyResData extends MetaIdJsRes {
    data:{
        tx: any
        txHex: string
        txid: string
        amount?: number
    }
}

export interface NftSellResData extends MetaIdJsRes {
    data:{
        sellTxHex: string
        sellTxId: string
        txHex: string
        txid: string
        amount?: number
    }
}


export interface NftDataProtocolParams {
    type: string,
    name: string, // nft名称
    intro: string, // nft描述
    cover: MetaFile, // nft封面 MetaFile协议地址
    originalFile?: MetaFile | string, // nft原文件 MetaFile协议地址
    txId?: string // 使用txId创建时的txId
    checkOnly?: boolean //
}

export interface CreateNFTRes extends MetaIdJsRes {
    data: {
        // IssueNFTResData
        metaTdid: string
        nftId: string
        tokenId: string
        txId: string
        tokenIndex: string
        // SdkGenesisNFTRes
        codehash: string
        genesisId: string
        genesisTxid: string
        sensibleId: string
    }
}

export interface NftBuyParams {
    codehash: string
    genesis: string
    tokenIndex: string
    sellTxId: string
    sellContractTxId: string
    genesisTxid: string,
    sensibleId: string
    amount: number
    checkOnly?: boolean
}


export interface CreateNftBuyProtocolParams {
    txId: string // nft bug txId
    txHex: string  // sell的utxo
    sellTxId: string // sell txId
    codehash: string // nft codehash
    genesis: string // nft genesis
    genesisTxid: string // nft genesisTxid
    tokenIndex: string // nft tokenIndex
    satoshisPrice: number // 出售的价格，单位聪
    opreturnData: string  // buy 备注信息
    createdAt: number // 创建时间
    buyerMetaId: string // 购买者metaId
}

export interface BuyNFTParams extends NftBuyParams{
    amount: number,
    address: string,
}

export interface NftSellParams {
    codehash: string
    genesis: string
    tokenIndex: string,
    satoshisPrice: number
    genesisTxid: string
    sensibleId: string
    sellDesc: string
    checkOnly?: boolean
}

export interface SellNFTParams extends NftSellParams {
    
}

export interface CreateNftSellProtocolParams extends NftSellParams{
    txid: string // sell交易tx
    sellTxId: string // sellUtxoTxId
    sellTxHex: any  // sell的utxo
    createdAt: number // 创建时间
}

export interface NftCancelParams {
    codehash: string
    genesis: string
    genesisTxid: string
    tokenIndex: string
    sellContractTxId: string
    sellTxId: string
    checkOnly?: boolean
}
export interface CancelSellNFTParams extends NftCancelParams {
    sellTxId: string
    satoshisPrice: number
}

export interface PayToItem {
    address: string;
    amount: number;
}
export interface NFTIssueParams {
    receiverAddress: string //  创建者接收地址
    genesisId?: string //
    genesisTxid?: string
    codehash?: string
    sensibleId?: string
    nftname: string
    nftdesc: string
    nfticon: {
        fileType: string,
        fileName: string,
        data: string,
    }
    nftwebsite: string
    nftissuerName: string
    content: NFTIssueData
    iconType: NFTIssueParamsIconType
    checkOnly?: boolean
}


export interface NFTIssueData{
    nftType: string
    classifyList: string
    originalFileTxid: {
        fileType: string,
        fileName: string,
        data: string
    }
    contentTxId: string
}

export interface NFTGenesisParams {
    nftTotal?: string
    seriesName?: string,
    checkOnly?: boolean
}




export interface NFTLIstRes extends MetaIdJsRes{
    data: NFTListItem []
}

export interface NFTListItem {
    nftBalance: number
    nftCodehash: string
    nftDesc: string
    nftGenesis: string
    nftGenesisTxid: string
    nftIcon: string
    nftIssuer: string
    nftName: string
    nftSymbol: undefined
    nftTimestamp: number
    nftTokenIndex: string
    nftTotalSupply: number
    nftWebsite: string
    data: {
        nftname: string
        nftdesc: string
        nfticon: string
        nftwebsite: string
        nftissuerName: string
        nftType: string
        classifyList: string
        originalFileTxid: string
        contentTxId?: string
    }
    nftDataStr?: string
}

export interface GetMcRes extends ApiResponse{
    data: FTItem []
}

export interface FTItem {
    balance: number
    codehash: string
    decimal: number
    genesis: string
    name: string
    pendingBalance: number
    sensibleId: string
    symbol: string
}

export interface ApiResponse {
    code: number
    msg: string
    count: number,
    data: any
}

export interface MetaFile {
    base64Data: string
    BufferData: string
    hexData: string;
    name: string;
    data_type: string
    raw: null | File
    metaFileTxId?: string
}