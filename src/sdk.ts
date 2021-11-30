import MetaIdJs from 'metaidjs'
// @ts-ignore
import { v4 as uuid } from 'uuid'
import { Decimal } from 'decimal.js-light'
import { DotWalletForMetaID } from 'dotwallet-jssdk'
import qs from 'qs'
import axios, { AxiosInstance } from 'axios'
import {
  CreateMetaFileFunParams,
  CreateNFTParams,
  GetBalanceRes,
  IssueNFTResData,
  MetaFile,
  MetaIdJsRes,
  NftBuyParams,
  NftBuyResData,
  NftCancelParams,
  NFTCancelResData,
  NFTGenesisParams,
  NFTIssueParams,
  NftSellParams,
  NftSellResData,
  SdkGenesisNFTRes,
  SdkMetaidJsOptionsTypes,
  SendMetaDataTxRes,
  Token,
  DotWalletConfig,
  GetMcRes,
  CreateMetaAccessProrocolParams,
  CreateMetaAccessContentProrocolParams,
  ShowManRes
} from './types/sdk'
import { Encrypt, Lang, SdkType } from './emums'
import { Buffer } from 'buffer'

export class SDK {
  // @ts-ignore
  metaidjs: null | MetaIdJs = null
  appMetaidjs: null | {
    sendMetaDataTx: (
      accessToken: string,
      data: string,
      functionName: string
    ) => Function
    decryptData: (
      accessToken: string,
      data: string,
      functionName: string
    ) => Function
    getUserInfo: (
      appId: string,
      appScrect: string,
      functionName: string
    ) => Function
    genesisNFT: (
      accessToken: string,
      params: string,
      functionName: string
    ) => Function
    issueNFT: (
      accessToken: string,
      params: string,
      functionName: string
    ) => Function
    nftBuy: (
      accessToken: string,
      params: string,
      functionName: string
    ) => Function
    nftSell: (
      accessToken: string,
      params: string,
      functionName: string
    ) => Function
    nftCancel: (
      accessToken: string,
      params: string,
      functionName: string
    ) => Function
  } = null
  dotwalletjs: any | null = null
  isApp: boolean = false
  appId: string = ''
  appScrect: string = ''
  metaIdTag: string = ''
  showmoneyApi: string = ''
  type: SdkType = SdkType.Null
  initIng: boolean = false
  appOptions: { clientId: string; clientSecret: string }
  metaidjsOptions: SdkMetaidJsOptionsTypes
  dotwalletOptions: DotWalletConfig
  getAccessToken: Function // 获取token的方法， 保持最新
  callBackFail?: (error: MetaIdJsRes) => Promise<void> | null = undefined // 统一回调错误处理
  axios: AxiosInstance | null = null
  isSdkFinish: boolean = false // 是否已初始化完成
  nftAppAddress = '16tp7PhBjvYpHcv53AXkHYHTynmy6xQnxy' // Nft收手续费的地址

  constructor(options: {
    metaIdTag: string
    showmoneyApi: string
    getAccessToken: Function
    callBackFail: (error: MetaIdJsRes) => Promise<void>
    appOptions: {
      clientId: string
      clientSecret: string
    }
    metaidjsOptions: SdkMetaidJsOptionsTypes
    dotwalletOptions: DotWalletConfig
  }) {
    this.metaIdTag = options.metaIdTag
    this.getAccessToken = options.getAccessToken
    this.metaidjsOptions = options.metaidjsOptions
    this.dotwalletOptions = options.dotwalletOptions
    this.showmoneyApi = options.showmoneyApi
    this.appOptions = options.appOptions
    if (options.callBackFail) this.callBackFail = options.callBackFail
    // 初始化是否App环境
    // @ts-ignore
    const appMetaIdJs = (window as any).appMetaIdJsV2
      ? (window as any).appMetaIdJsV2
      : (window as any).appMetaIdJs
      ? (window as any).appMetaIdJs
      : null
    if (appMetaIdJs) {
      this.appMetaidjs = appMetaIdJs
      this.appId = options.appOptions.clientId
      this.appScrect = options.appOptions.clientSecret
      this.isApp = true
    }
    this.appId = options.appOptions.clientId
    this.appScrect = options.appOptions.clientSecret
    this.initAxiosConfig()
  }

  // 更改 sdk 环境类型
  changeSdkType(type: SdkType) {
    this.type = type
    if (type === SdkType.Dotwallet) {
      if (this.dotwalletOptions) {
        this.appId = this.dotwalletOptions.clientID
        this.appScrect = this.dotwalletOptions.clientSecret!
        this.dotwalletjs = new DotWalletForMetaID(this.dotwalletOptions)
      } else {
        new Error('未设置dotwalletOptions')
      }
    } else if (type === SdkType.App) {
      this.appId = this.appOptions.clientId
      this.appScrect = this.appOptions.clientSecret
    } else if (type === SdkType.Metaidjs) {
      this.appId = this.metaidjsOptions.oauthSettings.clientId
      this.appScrect = this.metaidjsOptions.oauthSettings.clientSecret!
    }
    window.localStorage.setItem('appType', type.toString())
  }

  // 初始化 sdk
  initSdk() {
    return new Promise<void>((resolve, reject) => {
      this.initIng = true
      if (this.type === SdkType.Metaidjs) {
        // @ts-ignore
        this.metaidjs = new MetaIdJs({
          ...this.metaidjsOptions,
          onLoaded: () => {
            this.initIng = false
            this.isSdkFinish = true
            resolve()
          },
          onError: (error: MetaIdJsRes) => {
            this.initIng = false
            reject(error)
          }
        })
      } else if (this.type === SdkType.Dotwallet) {
        if (!this.dotwalletjs)
          this.dotwalletjs = new DotWalletForMetaID(this.dotwalletOptions)
        this.initIng = false
        this.isSdkFinish = true
        resolve()
      } else {
        this.initIng = false
        this.isSdkFinish = true
        resolve()
      }
    })
  }

  // 跳转钱包
  toWallet() {
    let url = ''
    if (this.type === SdkType.Dotwallet) {
      if (this.dotwalletOptions.env === 'production') {
        url = 'https://www.ddpurse.com'
      } else {
        url = 'https://prerelease.ddpurse.com'
      }
    } else {
      url = this.metaidjsOptions.baseUri
    }
    window.open(url)
  }

  // 初始化Api配置
  initAxiosConfig() {
    this.axios = axios.create({
      baseURL: this.showmoneyApi
    })
    // 添加响应拦截器
    this.axios.interceptors.response.use(
      (response) => {
        // 对响应数据做点什么
        return response.data
      },
      async (error) => {
        if (this.callBackFail) {
          await this.callBackFail(error)
        }
        // 对响应错误做点什么
        return Promise.reject(error)
      }
    )
  }

  // 跳转登陆授权
  login() {
    if (this.type === SdkType.Null) {
      new Error('你还没设置sdk环境')
      return
    }
    if (this.type === SdkType.App) {
      new Error('App环境下没有login函数')
      return
    } else if (this.type === SdkType.Metaidjs) {
      const url = `${this.metaidjsOptions.baseUri}/userLogin?response_type=code&client_id=${this.appId}&redirect_uri=${this.metaidjsOptions.oauthSettings.redirectUri}&scope=app&from=${this.metaidjsOptions.oauthSettings.redirectUri}`
      window.location.href = url
    } else {
      if (this.dotwalletjs) {
        this.dotwalletjs.login({
          scope: 'user.info autopay.bsv'
        })
      } else {
        new Error('未初始化 dotwalletjs')
      }
    }
  }

  // getToken
  getToken(params: { code: string }) {
    return new Promise<Token>(async (resolve, reject) => {
      if (this.type === SdkType.App) {
        new Error('App 环境 getToken 不可执行')
        return
      }
      if (this.type === SdkType.Metaidjs) {
        const res = await this.axios
          ?.post<Token>(
            '/showmoney/oauth2/oauth/token',
            {
              code: params.code,
              grant_type: 'authorization_code',
              redirect_uri: this.metaidjsOptions.oauthSettings.redirectUri,
              scope: 'app',
              client_id: this.appId,
              client_secret: this.appScrect
            },
            {
              headers: {
                'Content-Type':
                  'application/x-www-form-urlencoded;charset=UTF-8'
              },
              transformRequest: [
                function (data: object) {
                  return qs.stringify(data)
                }
              ]
            }
          )
          .catch((error) => reject(error))
        if (res?.access_token) {
          res.expires_time = res.expires_in
            ? new Date().getTime() + res.expires_in - 2000
            : -1
          resolve(res)
        } else {
          reject(res)
        }
      } else {
        const res = await this.dotwalletjs
          ?.getToken(params)
          .catch((error: any) => reject(error))
        if (res && res.accessToken) {
          resolve({
            access_token: res.accessToken,
            refresh_token: res.refreshToken,
            expires_in: res.expiresIn,
            token_type: res.tokenType,
            expires_time: res.expiresIn
              ? new Date().getTime() + res.expiresIn - 2000
              : -1
          })
        } else {
          reject(res)
        }
      }
    })
  }

  //  refreshToken
  refreshToken(params: { refreshToken: string }) {
    return new Promise<Token>(async (resolve, reject) => {
      if (this.type === SdkType.App) {
        new Error('App 环境 getToken 不可执行')
        return
      }
      if (this.type === SdkType.Metaidjs) {
        const res: Token | undefined = await this.axios
          ?.post(
            '/showmoney/oauth2/oauth/token',
            {
              grant_type: 'refresh_token',
              client_id: this.appId,
              client_secret: this.appScrect,
              refresh_token: params.refreshToken
            },
            {
              headers: {
                'Content-Type':
                  'application/x-www-form-urlencoded;charset=UTF-8'
              },
              transformRequest: [
                function (data: object) {
                  return qs.stringify(data)
                }
              ]
            }
          )
          .catch((error) => reject(error))
        if (res?.access_token) {
          res.expires_time = res.expires_in
            ? new Date().getTime() + res.expires_in - 2000
            : -1
          resolve(res)
        } else {
          new Error('refreshToken fail')
          reject('refreshToken fail')
        }
      } else {
        const res = await this.dotwalletjs?.refreshToken(params)
        if (res && res.accessToken) {
          resolve({
            access_token: res.accessToken,
            refresh_token: res.refreshToken,
            expires_in: res.expiresIn,
            token_type: res.tokenType,
            expires_time: res.expiresIn
              ? new Date().getTime() + res.expiresIn - 2000
              : -1
          })
        } else {
          new Error('refreshToken fail')
          reject(res)
        }
      }
    })
  }

  getUserInfo() {
    return new Promise<MetaIdJsRes>(async (resolve, reject) => {
      const callback = (res: MetaIdJsRes) => {
        if (typeof res === 'string') res = JSON.parse(res)
        if (res) {
          if (res.code === 200 && !res.data.metaId) {
            res.data.metaId = res.data.showId
          }
        }
        this.callback(res, resolve, reject)
      }
      const params = {
        accessToken: this.getAccessToken(),
        callback
      }
      if (this.type === SdkType.App) {
        const functionName: string = `getUserInfoCallBack${uuid().replace(
          /-/g,
          ''
        )}`
        // @ts-ignore
        window[functionName] = callback
        if ((window as any).appMetaIdJsV2) {
          ;(window as any).appMetaIdJsV2?.getUserInfo(
            this.appId,
            this.appScrect,
            functionName
          )
        } else {
          ;(window as any).appMetaIdJs?.getUserInfo(
            this.appId,
            this.appScrect,
            functionName
          )
        }
      } else if (this.type === SdkType.Metaidjs) {
        this.metaidjs?.getUserInfo(params)
      } else {
        // @ts-ignore
        this.dotwalletjs.getMetaIDUserInfo({
          callback
        })
      }
    })
  }

  sendMetaDataTx(params: {
    data: string
    nodeName: string
    brfcId: string
    attachments?: string[]
    path: string
    payCurrency?: string
    payTo?: { amount: number; address: string }[]
    needConfirm?: boolean
    encrypt?: Encrypt
    dataType?: string
    encoding?: string
    checkOnly?: boolean
    // 单独加密data里面字段内容
    ecdh?: {
      publickey: string // 加密用的 publickey
      type: string // data 里面要加密的字段
    }
  }) {
    return new Promise<SendMetaDataTxRes>(async (resolve, reject) => {
      if (!params.payCurrency) params.payCurrency = 'BSV'
      if (typeof params.needConfirm === 'undefined') params.needConfirm = true
      if (!params.encrypt) params.encrypt = Encrypt.No
      if (!params.dataType) params.dataType = 'application/json'
      if (!params.encoding) params.encoding = 'UTF-8'
      const accessToken = this.getAccessToken()
      const callback = (res: MetaIdJsRes) => {
        this.callback(res, resolve, reject)
      }
      const onCancel = (res: MetaIdJsRes) => {
        reject(res)
      }
      if (this.type === SdkType.App) {
        const functionName: string = `sendMetaDataTxCallBack${uuid().replace(
          /-/g,
          ''
        )}`
        // @ts-ignore
        window[functionName] = callback
        if ((window as any).appMetaIdJsV2) {
          ;(window as any).appMetaIdJsV2?.sendMetaDataTx(
            accessToken,
            JSON.stringify(params),
            functionName
          )
        } else {
          ;(window as any).appMetaIdJs?.sendMetaDataTx(
            accessToken,
            JSON.stringify(params),
            functionName
          )
        }
      } else {
        const _params = {
          callback,
          onCancel,
          metaIdTag: this.metaIdTag,
          accessToken,
          ...params
        }
        if (this.type === SdkType.Metaidjs) {
          // 处理余额不足回调
          ;(window as any).handleNotEnoughMoney = (res: MetaIdJsRes) => {
            reject()
          }
          this.metaidjs?.sendMetaDataTx(_params)
        } else {
          this.dotwalletjs?.sendMetaDataTx({
            ..._params,
            encrypt: parseInt(_params.encrypt!)
          })
        }
      }
    })
  }

  ecdhDecryptData(data: {
    msg: string
    publicKey: string
    metaDataPublicKey?: string
    path?: string
  }) {
    return new Promise<MetaIdJsRes>((resolve, reject) => {
      const callback = (res: MetaIdJsRes) => {
        if (typeof res === 'string') res = JSON.parse(res)
        this.callback(res, resolve, reject)
      }
      const _params = {
        callback,
        accessToken: this.getAccessToken(),
        data: JSON.stringify(data)
      }
      if (this.type === SdkType.App) {
        const functionName: string = `ecdhDecryptDataCallBack${uuid().replace(
          /-/g,
          ''
        )}`
        // @ts-ignore
        window[functionName] = callback
        if ((window as any).appMetaIdJsV2) {
          ;(window as any).appMetaIdJsV2?.ecdhDecryptData(
            _params.accessToken,
            data.msg,
            data.publicKey,
            data.metaDataPublicKey,
            functionName
          )
        } else {
          ;(window as any).appMetaIdJs?.ecdhDecryptData(
            _params.accessToken,
            data.msg,
            data.publicKey,
            data.metaDataPublicKey,
            functionName
          )
        }
      } else if (this.type === SdkType.Metaidjs) {
        this.metaidjs?.ecdhDecryptData(_params)
      } else {
        // 待兼容
        // @ts-ignore
        this.dotwalletjs.ecdhDecryptData(_params)
      }
    })
  }

  // ecies 加密 app未检测
  eciesEncryptData(data: string) {
    return new Promise<MetaIdJsRes>((resolve, reject) => {
      const callback = (res: MetaIdJsRes) => {
        this.callback(res, resolve, reject)
      }
      const _params = {
        callback,
        accessToken: this.getAccessToken(),
        data
      }
      if (this.type === SdkType.App) {
        const functionName: string = `eciesDecryptDataCallBack${uuid().replace(
          /-/g,
          ''
        )}`
        // @ts-ignore
        window[functionName] = callback
        if ((window as any).appMetaIdJsV2) {
          ;(window as any).appMetaIdJsV2?.decryptData(
            _params.accessToken,
            data,
            functionName
          )
        } else {
          ;(window as any).appMetaIdJs?.decryptData(
            _params.accessToken,
            data,
            functionName
          )
        }
      } else if (this.type === SdkType.Metaidjs) {
        this.metaidjs?.eciesEncryptData(_params)
      } else {
        // 待兼容
        // @ts-ignore
        this.dotwalletjs.eciesEncryptData(_params)
      }
    })
  }

  // ecies 解密
  eciesDecryptData(data: string) {
    return new Promise<MetaIdJsRes>((resolve, reject) => {
      const callback = (res: MetaIdJsRes) => {
        this.callback(res, resolve, reject)
      }
      const _params = {
        callback,
        accessToken: this.getAccessToken(),
        data
      }
      if (this.type === SdkType.App) {
        const functionName: string = `eciesDecryptDataCallBack${uuid().replace(
          /-/g,
          ''
        )}`
        // @ts-ignore
        window[functionName] = callback
        if ((window as any).appMetaIdJsV2) {
          ;(window as any).appMetaIdJsV2?.decryptData(
            _params.accessToken,
            data,
            functionName
          )
        } else {
          ;(window as any).appMetaIdJs?.decryptData(
            _params.accessToken,
            data,
            functionName
          )
        }
      } else if (this.type === SdkType.Metaidjs) {
        this.metaidjs?.eciesDecryptData(_params)
      } else {
        // 待兼容
        // @ts-ignore
        this.dotwalletjs.eciesDecryptData(_params)
      }
    })
  }

  // 获取用户余额
  getBalance() {
    return new Promise<GetBalanceRes>((resolve, reject) => {
      if (this.isApp) {
        const token = this.getAccessToken()
        const functionName = `getBalanceCallBack${uuid().replace(/-/g, '')}`
        ;(window as any)[functionName] = (_res: string) => {
          const res = JSON.parse(_res)
          const bsv = res.data
          this.callback(
            {
              code: res.code,
              data: {
                bsv: bsv,
                satoshis: new Decimal(bsv).mul(Math.pow(10, 8))
              }
            },
            resolve,
            reject
          )
        }
        if ((window as any).appMetaIdJsV2) {
          ;(window as any).appMetaIdJsV2?.getBalance(token, functionName)
        } else {
          ;(window as any).appMetaIdJs?.getBalance(token, functionName)
        }
      } else {
        //@ts-ignore
        this.metaidjs.getBalance({
          callback: (res: GetBalanceRes) => {
            this.callback(res, resolve, reject)
          }
        })
      }
    })
  }

  // 统一回调处理
  async callback(
    res: MetaIdJsRes,
    resolve: {
      (value: MetaIdJsRes | PromiseLike<MetaIdJsRes>): void
      (arg0: MetaIdJsRes): void
    },
    reject: { (reason?: any): void; (): void }
  ) {
    if (this.isApp && typeof res === 'string') {
      try {
        res = JSON.parse(res)
      } catch (error) {
        res = {
          code: 400,
          data: {
            message: res
          },
          status: 'fail',
          handlerId: ''
        }
      }
    }
    if (res.code !== 200 && res.code !== 205) {
      if (
        res.data.message !==
        'The NFT is not for sale because  the corresponding SellUtxo cannot be found.'
      ) {
        if (this.callBackFail) {
          await this.callBackFail(res)
        }
      }
      reject(res)
    } else {
      resolve(res)
    }
    resolve(res)
  }

  // 文件上链
  createMetaFileProtocol(params: CreateMetaFileFunParams) {
    const { name, ...data } = params.data
    const nameArry = name.split('.')
    let node_name: string = ''
    nameArry.map((item, index) => {
      node_name += item
      if (index === nameArry.length - 2) {
        node_name += uuid()
      }
    })
    return this.sendMetaDataTx({
      nodeName: 'MetaFile',
      brfcId: '6d3eaf759bbc',
      path: '/Protocols/MetaFile',
      payCurrency: 'bsv',
      // payTo: [
      //     { address: 'XXXXXXXXXX', amount: 1000 }
      // ],
      data: JSON.stringify({
        ...data,
        encoding: 'binary',
        node_name
      }),
      needConfirm: false
    })
  }

  // NFT

  // 检查NFT操作txid状态，成功后才可继续其他上链操作，否则容易双花
  getSensibleTxData(
    txId: string,
    timer?: number,
    parentResolve?: (value: void | PromiseLike<void>) => void,
    parentReject?: any
  ) {
    return new Promise<void>((resolve, reject) => {
      fetch(`https://api.sensible.satoplay.cn/tx/${txId}`)
        .then(function (response) {
          return response.json()
        })
        .then((response) => {
          debugger
          if (response.code === 0) {
            if (parentResolve) parentResolve()
            else resolve()
          } else {
            // 超过30次还不成功就 回调失败
            if (timer && timer > 30) {
              if (parentReject) parentReject()
              else reject()
            } else {
              setTimeout(() => {
                this.getSensibleTxData(
                  txId,
                  timer ? timer + 1 : 1,
                  parentResolve ? parentResolve : resolve,
                  parentReject ? parentReject : reject
                )
              }, 1000)
            }
          }
        })
        .catch(() => {
          if (parentReject) parentReject()
          else reject()
        })
    })
  }

  // 铸造 nft 1. genesisNFT  2.createNftDataProtocol 3.issueNFT
  createNFT(params: CreateNFTParams) {
    return new Promise<
      | {
          // genesisNFT response data
          codehash: string
          genesisId: string
          genesisTxid: string
          sensibleId: string
          // issueNFT response data
          metaTdid: string
          nftId: string
          tokenId: string
          txId: string
          tokenIndex: string
        }
      | number
    >(async (resolve, reject) => {
      let { nftTotal, codeHash, genesis, genesisTxId, sensibleId, ..._params } =
        params
      let amount = 0
      const issueOperate = async () => {
        if (!params.checkOnly) {
          await this.getSensibleTxData(genesisTxId!).catch(() =>
            reject('createNFT error')
          )
        }
        // const issueParams = await this.setIssuePrams({
        //   genesisId: genesis!,
        //   genesisTxid: genesisTxId!,
        //   codehash: codeHash!,
        //   sensibleId: sensibleId,
        //   ..._params,
        // })

        // 3.issueNFT
        const issueRes = await this.issueNFT({
          genesisId: genesis!,
          genesisTxid: genesisTxId!,
          codehash: codeHash!,
          sensibleId: sensibleId,
          ..._params
        })
        if (issueRes.code === 200) {
          if (issueRes.data.amount) {
            amount += issueRes.data.amount
          }
          if (params.checkOnly) {
            resolve(Math.ceil(amount))
          } else {
            resolve({
              ...issueRes.data,
              codehash: codeHash!,
              sensibleId: sensibleId!,
              genesisId: genesis!,
              genesisTxid: genesisTxId!
            })
          }
        } else {
          reject('createNFT error')
        }
      }
      if (!codeHash || !genesis || !genesisTxId || !sensibleId) {
        // genesisNFT
        const res = await this.genesisNFT({
          nftTotal: nftTotal ? nftTotal : '1',
          checkOnly: params.checkOnly ? true : false
        })
        if (res.code === 200) {
          if (res.data.amount) {
            amount += res.data.amount
            codeHash = ''
            genesis = ''
            genesisTxId = ''
            sensibleId = ''
          } else {
            codeHash = res.data.codehash
            genesis = res.data.genesisId
            genesisTxId = res.data.genesisTxid
            sensibleId = res.data.sensibleId
          }
          debugger
          issueOperate()
        } else {
          reject('createNFT error')
        }
      } else {
        issueOperate()
      }
    })
  }

  genesisNFT(params: NFTGenesisParams): Promise<SdkGenesisNFTRes> {
    return new Promise<SdkGenesisNFTRes>((resolve, reject) => {
      const callback = (res: SdkGenesisNFTRes) => {
        this.callback(res, resolve, reject)
      }
      const _params = {
        data: {
          nftTotal: params.nftTotal,
          signersRaw: [
            {
              satotxApiPrefix:
                'https://satotx.showpay.top,https://cnsatotx.showpay.top',
              satotxPubKey:
                '5b94858991d384c61ffd97174e895fcd4f62e4fea618916dc095fe4c149bbdf1188c9b33bc15cbe963a63b2522e70b80a5b722ac0e6180407917403755df4de27d69cc115c683a99face8c823cbccf73c7f0d546f1300b9ee2e96aea85542527f33b649f1885caebe19cf75d9a645807f03565c65bd4c99c8f6bb000644cfb56969eac3e9331c254b08aa279ceb64c47ef66be3f071e28b3a5a21e48cdfc3335d8b52e80a09a104a791ace6a2c1b4da88c52f9cc28c54a324e126ec91a988c1fe4e21afc8a84d0e876e01502386f74e7fc24fc32aa249075dd222361aea119d4824db2a797d58886e93bdd60556e504bb190b76a451a4e7b0431973c0410e71e808d0962415503931bbde3dfce5186b371c5bf729861f239ef626b7217d071dfd62bac877a847f2ac2dca07597a0bb9dc1969bed40606c025c4ff7b53a4a6bd921642199c16ede8165ed28da161739fa8d33f9f483212759498c1219d246092d14c9ae63808f58f03c8ca746904ba51fa326d793cea80cda411c85d35894bdb5'
            },
            {
              satotxApiPrefix:
                'https://satotx2.showpay.top,https://cnsatotx2.showpay.top',
              satotxPubKey:
                '09539fcf01e83c7c649164ddd0dd42463ef10a98c665cd0d9f791446a3c4c2dd3916f6e76075b36a06f40731821f6b7dbb8bea8effa4ea461fecce4b6b2d45ca4dd923028fd6dc6ce49512616ca55f01162e5d2f85faa22ec40bc35d4978204a9b07a53f04297b886fa4abb095034f106f8ff0fd172e1e96bf7198cd5b9944ec1af32328a156877769ecabd41489a7ac858fd35cd8d93e68f33053077cf50bb397b66d160598963d1b663b3bce6371877df0e33866e4d9557b0bde7a2a930c274fa9e697d9f17ad88528ecab1be32a9d518bb950fc8264f2056d4f395fcdc12dd59cb8945013105ed52433326e3fa067237f17ab62e65557c7538e634daf11288b7eaab537abf2cc2a90159632fb9bb8fac01085b70024e01e42cd431db70d004963e46da8733c18fd5ffaaecfd67c860ae37441271ba545f86cae72690a5a3261e0125a2bf069fe28a1e1431b4cac29f8a43cbefbe22d5ae4b92441f8915881560271ee31379d365da38f1a5fa1414d6ad71943a083cce0ee45d47f81ff3c9d'
            },
            {
              satotxApiPrefix:
                'https://satotx3.showpay.top,https://cnsatotx3.showpay.top',
              satotxPubKey:
                '8e37df222f9af47980ad72d31b2619b49460c7be3a4c1034c0e7f43146d80058e52bfc53b0608db5a9ec5cb832c326f785f5c4e4349cc9fd647839738f465573d1707ef84d14c41ad857a1a8e5a075ae953be4c52481ee3b8e85891613dcf99c1f7bf3a51cd67ed92f9b71d77b8517a57af5fb4e2bad7197031e00c1d8b85d0abc62fb98952d9ddfb43b47c01590ef0a365aed89b179505ccfd1d70effe4d375d5e774578434f8f9bb2281100b6e1daf8df4a40af35853c91aee2dc7f578034fa534586985e4df30b7a85efab943f68f01b46f72ced16655ac4f7e7f0439e0e6b43803dc7e262512c57ef862d41b98344ea6e725683846d91209ad87097cb4ae7092cc2c4ebd39383905e61eeaae495d8b3a57f9da8cca760b9546635cef2a8728c4209891ad1e5cbeb75d2b798f0dabd1eceaf4b297186fd2a45ed58fbaed886a4dc2f8690c9070061b9481e446319b7f0a54f9d94e7505e87e3d81bcd664ecc29acc2942361e60b30fa965cdc88185163c2857644d837c9d839bb9f6b8e6dd'
            },
            {
              satotxApiPrefix: 'https://s1.satoplay.cn,https://s1.satoplay.com',
              satotxPubKey:
                '2c8c0117aa5edba9a4539e783b6a1bdbc1ad88ad5b57f3d9c5cba55001c45e1fedb877ebc7d49d1cfa8aa938ccb303c3a37732eb0296fee4a6642b0ff1976817b603404f64c41ec098f8cd908caf64b4a3aada220ff61e252ef6d775079b69451367eda8fdb37bc55c8bfd69610e1f31b9d421ff44e3a0cfa7b11f334374827256a0b91ce80c45ffb798798e7bd6b110134e1a3c3fa89855a19829aab3922f55da92000495737e99e0094e6c4dbcc4e8d8de5459355c21ff055d039a202076e4ca263b745a885ef292eec0b5a5255e6ecc45534897d9572c3ebe97d36626c7b1e775159e00b17d03bc6d127260e13a252afd89bab72e8daf893075f18c1840cb394f18a9817913a9462c6ffc8951bee50a05f38da4c9090a4d6868cb8c955e5efb4f3be4e7cf0be1c399d78a6f6dd26a0af8492dca67843c6da9915bae571aa9f4696418ab1520dd50dd05f5c0c7a51d2843bd4d9b6b3b79910e98f3d98099fd86d71b2fac290e32bdacb31943a8384a7668c32a66be127b74390b4b0dec6455'
            },
            {
              satotxApiPrefix: 'https://satotx.metasv.com',
              satotxPubKey:
                '19d9193ee2e95d09445d28408e8a3da730b2d557cd8d39a7ae4ebbfbceb17ed5d745623529ad33d043511f3e205c1f92b6322833424d19823c3b611b3adabb74e1006e0e93a8f1e0b97ab801c6060a4c060f775998d9f003568ab4ea7633a0395eb761c36106e229394f2c271b8522a44a5ae759254f5d22927923ba85b3729460ecccca07a5556299aa7f2518814c74a2a4d48b48013d609002631f2d93c906d07077ef58d473e3d971362d1129c1ab9b8f9b1365519f0c023c1cadad5ab57240d19e256e08022fd0708951ff90a8af0655aff806c6382d0a72c13f1e52b88222d7dfc6357179b06ffcf937f9da3b0419908aa589a731e26bbaba2fa0b754bf722e338c5627b11dc24aadc4d83c35851c034936cf0df18167e856a5f0a7121d23cd48b3f8a420869a37bd1362905d7f76ff18a991f75a0f9d1bcfc18416d76691cc357cbdcc8cc0df9dbd9318a40e08adb2fb4e78b3c47bdf07eeed4f3f4e0f7e81e37460a09b857e0194c72ec03bb564b5b409d8a1b84c153186ecbb4cfdfd'
            }
          ],
          checkOnly: params.checkOnly,
          seriesName: params.seriesName
        },
        callback
      }
      if (this.isApp) {
        const functionName: string = `genesisNFTCallBack${uuid().replace(
          /-/g,
          ''
        )}`
        ;(window as any)[functionName] = callback
        const accessToken = this.getAccessToken()
        if ((window as any).appMetaIdJsV2) {
          ;(window as any).appMetaIdJsV2.genesisNFT(
            accessToken,
            JSON.stringify(_params.data),
            functionName
          )
        } else {
          ;(window as any).appMetaIdJs.genesisNFT(
            accessToken,
            JSON.stringify(_params.data),
            functionName
          )
        }
      } else {
        debugger
        // @ts-ignore
        this.metaidjs?.genesisNFT(_params)
      }
    })
  }

  checkUserCanIssueNft(params: {
    metaId: string
    address: string
    language: Lang
  }) {
    return new Promise((resolve, reject) => {
      fetch(
        `${this.showmoneyApi}/aggregation/v2/app/nftOnShow/getMyNftIssueEligibility/${params.metaId}/${params.address}/0/${params.language}`
      )
        .then(function (response) {
          return response.json()
        })
        .then((response) => {
          if (response.code === 0) {
            resolve(response)
          } else {
            resolve(response)
          }
        })
        .catch(() => {
          reject()
        })
    })
  }

  // nft 铸造
  issueNFT(params: NFTIssueParams) {
    return new Promise<IssueNFTResData>((resolve, reject) => {
      const callback = (res: MetaIdJsRes) => {
        this.callback(res, resolve, reject)
      }
      const _params = {
        data: {
          payTo: [{ address: this.nftAppAddress, amount: 10000 }],
          ...params
        },
        callback
      }
      if (this.isApp) {
        const functionName: string = `issueNFTCallBack${uuid().replace(
          /-/g,
          ''
        )}${uuid().replace(/-/g, '')}`
        ;(window as any)[functionName] = callback
        const accessToken = this.getAccessToken()
        if ((window as any).appMetaIdJsV2) {
          ;(window as any).appMetaIdJsV2.issueNFT(
            accessToken,
            JSON.stringify(_params.data),
            functionName
          )
        } else {
          ;(window as any).appMetaIdJs.issueNFT(
            accessToken,
            JSON.stringify(_params.data),
            functionName
          )
        }
      } else {
        // @ts-ignore
        this.metaidjs?.issueNFT(_params)
      }
    })
  }

  // metaidjs nft 购买
  nftBuy(params: NftBuyParams) {
    return new Promise<NftBuyResData>((resolve, reject) => {
      const { amount, ...data } = params
      const callback = (res: MetaIdJsRes) => {
        this.callback(res, resolve, reject)
      }
      const _params = {
        data: {
          ...data,
          payTo: [
            {
              address: this.nftAppAddress,
              amount: Math.ceil(new Decimal(amount * 0.05).toNumber())
            }
          ]
        },
        callback
      }
      if (this.isApp) {
        const accessToken = this.getAccessToken()
        const functionName: string = `nftBuyCallBack${uuid().replace(/-/g, '')}`
        // @ts-ignore
        window[functionName] = callback
        // @ts-ignore
        if (window.appMetaIdJsV2) {
          // @ts-ignore
          window.appMetaIdJsV2.nftBuy(
            accessToken,
            JSON.stringify(_params.data),
            functionName
          )
        } else {
          // @ts-ignore
          window.appMetaIdJs.nftBuy(
            accessToken,
            JSON.stringify(_params.data),
            functionName
          )
        }
      } else {
        // @ts-ignore
        this.metaidjs?.nftBuy(_params)
      }
    })
  }

  // nft 上架/销售
  nftSell(params: NftSellParams) {
    return new Promise<NftSellResData>((resolve, reject) => {
      const callback = (res: MetaIdJsRes) => {
        this.callback(res, resolve, reject)
      }
      const _params = {
        data: {
          ...params,
          payTo: [{ address: this.nftAppAddress, amount: 10000 }]
        },
        callback
      }
      if (this.isApp) {
        const accessToken = this.getAccessToken()
        const functionName: string = `nftSellCallBack${uuid().replace(
          /-/g,
          ''
        )}`
        // @ts-ignore
        window[functionName] = callback
        // @ts-ignore
        if (window.appMetaIdJsV2) {
          // @ts-ignore
          window.appMetaIdJsV2.nftSell(
            accessToken,
            JSON.stringify(_params.data),
            functionName
          )
        } else {
          // @ts-ignore
          window.appMetaIdJs.nftSell(
            accessToken,
            JSON.stringify(_params.data),
            functionName
          )
        }
      } else {
        // @ts-ignore
        this.metaidjs?.nftSell(_params)
      }
    })
  }

  // nft 下架/取消销售
  nftCancel(params: NftCancelParams) {
    return new Promise<NFTCancelResData>((resolve, reject) => {
      const callback = (res: MetaIdJsRes) => {
        this.callback(res, resolve, reject)
      }
      const _params = {
        data: {
          outputIndex: 0,
          payTo: [{ address: this.nftAppAddress, amount: 10000 }],
          ...params
        },
        callback
        // onCancel: (msg: any) => {
        //   debugger
        // }
      }
      if (this.isApp) {
        const accessToken = this.getAccessToken()
        const functionName: string = `nftCancelCallBack${uuid().replace(
          /-/g,
          ''
        )}${uuid().replace(/-/g, '')}`
        // @ts-ignore
        window[functionName] = callback
        // @ts-ignore
        if (window.appMetaIdJsV2) {
          // @ts-ignore
          window.appMetaIdJsV2.nftCancel(
            accessToken,
            JSON.stringify(_params.data),
            functionName
          )
        } else {
          // @ts-ignore
          window.appMetaIdJs.nftCancel(
            accessToken,
            JSON.stringify(_params.data),
            functionName
          )
        }
      } else {
        debugger
        // @ts-ignore
        this.metaidjs?.nftCancel(_params)
      }
    })
  }

  // 获取用户MC余额
  getMc(address: string) {
    return new Promise<number>((resolve, reject) => {
      fetch(`https://api.sensiblequery.com/ft/summary/${address}`)
        .then(function (response) {
          return response.json()
        })
        .then((response: GetMcRes) => {
          if (response.code === 0) {
            if (response.data) {
              const mc = response.data.find((item) => {
                return (
                  item.sensibleId ===
                    '3e04f81d7fa7d4d606c3c4c8e8d3a8dcf58b5808740d40a445f3884e126bc7fd00000000' &&
                  item.codehash ===
                    '777e4dd291059c9f7a0fd563f7204576dcceb791' &&
                  item.genesis === '54256eb1b9c815a37c4af1b82791ec6bdf5b3fa3'
                )
              })
              if (mc) {
                resolve(
                  new Decimal(mc.balance + mc.pendingBalance)
                    .div(Math.pow(10, mc.decimal))
                    .toNumber()
                )
              } else {
                resolve(0)
              }
            } else {
              resolve(0)
            }
          } else {
            reject('getMc')
          }
        })
        .catch(() => {
          reject('getMc')
        })
    })
  }

  // showman queryFindMetaData
  queryFindMetaData = (params: string) => {
    return this.axios?.get(
      `/v2showMANDB/api/v1/query/queryFindMetaData/${btoa(
        JSON.stringify(params)
      )}`
    )
  }

  // showman queryFindMetaDataForPost
  queryFindMetaDataForPost = (params: any) => {
    return this.axios?.post(
      `/v2showMANDB/api/v1/query/queryFindMetaDataForPost`,
      {
        data: {
          query: btoa(JSON.stringify(params))
        }
      }
    )
  }

  // 获取txId的内容
  getTxData = (
    txId: string,
    currentTimer: number = 0,
    maxTimer: number = 10,
    parentResolve?: Function
  ) => {
    return new Promise<ShowManRes>(async (resolve, reject) => {
      const _currentTimer = currentTimer + 1
      const res = await this.queryFindMetaDataForPost({
        find: {
          txId
        },
        skip: 0
      })?.catch(() => {
        this.getTxData(
          txId,
          _currentTimer,
          maxTimer,
          parentResolve ? parentResolve : resolve
        )
      })
      if (
        res.code === 200 &&
        res.result &&
        res.result.data &&
        res.result.data.length > 0
      ) {
        parentResolve ? parentResolve(res) : resolve(res)
      } else {
        if (_currentTimer >= maxTimer) {
          reject()
        } else {
          setTimeout(() => {
            this.getTxData(
              txId,
              _currentTimer,
              maxTimer,
              parentResolve ? parentResolve : resolve
            )
          }, 1000)
        }
      }
    })
  }

  getMetaIdInfo = (metaId: string) => {
    return this.axios?.post(`/v2showMANDB/api/v1/query/getMetaIDInfo/${metaId}`)
  }

  // 发布付费文章逻辑 1.createMetaAccessContentProtocol 2.createMetaAccessProtocol
  async createMetaAccessArticle(params: CreateMetaAccessProrocolParams) {
    return new Promise<{
      metaAccessContenttxId: string
      metaAccessTxId: string
    }>(async (resolve, reject) => {
      // 1.createMetaAccessContentProtocol
      const { amount, ..._params } = params
      const res = await this.createMetaAccessContentProtocol(_params).catch(
        () => reject()
      )
      if (res && res.code === 200) {
        // 获取createMetaAccessContent 链上上信息的metanetId
        // @ts-ignore
        const metaAccessContentrRes: any = await this.getTxData(
          res.data.txId
        ).catch(() => reject())
        if (
          metaAccessContentrRes.code === 200 &&
          metaAccessContentrRes.result &&
          metaAccessContentrRes.result.data.length > 0
        ) {
          // 延时，防止双花
          setTimeout(async () => {
            // 2.createMetaAccessProtocol
            const response = await this.createMetaAccessProtocol({
              createTime: _params.createTime,
              updateTime: _params.createTime,
              metaAccessContentMetanetID:
                metaAccessContentrRes.result.data[0].metanetId,
              validityBegin: _params.createTime,
              amount
            }).catch(() => {
              reject()
            })
            debugger
            if (response && response.code === 200) {
              resolve({
                metaAccessContenttxId: res.data.txId,
                metaAccessTxId: response.data.txId
              })
            }
          }, 10000)
        }
      }
    })
  }

  // 创建付费文章内容协议
  async createMetaAccessContentProtocol(
    params: CreateMetaAccessContentProrocolParams
  ) {
    const { data, attachments } = await setAttachments(params, [
      { name: 'cover', encrypt: Encrypt.No }
    ])
    return this.sendMetaDataTx({
      data: JSON.stringify({
        ...data,
        publicContentType: 'text/plain',
        encryptContentType: 'text/plain'
      }),
      ecdh: {
        publickey: params.serverPublicKey,
        type: 'encryptContent'
      },
      nodeName: 'MetaAccessContent',
      brfcId: '937928add3f2',
      path: '/Protocols/MetaAccessContent',
      attachments
    })
  }

  // 创建付费文章价格协议
  async createMetaAccessProtocol(params: {
    createTime: number
    updateTime: number
    metaAccessContentMetanetID: String
    amount: number
    validityBegin: number
  }) {
    return this.sendMetaDataTx({
      data: JSON.stringify(params),
      nodeName: 'MetaAccess',
      brfcId: '1c0610ccb2d9',
      path: '/Protocols/MetaAccess'
    })
  }

  // 购买文章
  createMetaAccessPayProtocol(params: {
    amount: number
    metaAccessService: string
    metaAccessServiceConfigTx: string
    metaAccessServiceConfigMetanetID: string
    metaAccessTx: string
  }) {
    return new Promise<MetaIdJsRes>(async (resolve, reject) => {
      const { amount, ...data } = params
      Promise.all([
        // 查metaAccess 内容获取 metaAccessMetanetID
        this.getTxData(params.metaAccessTx),
        // 查metaAccessService 内容获取 服务器费用
        this.getTxData(params.metaAccessServiceConfigTx),
        // 查metaAccessService的信息 内容获取 服务器费用收钱地址
        this.getMetaIdInfo(params.metaAccessService)
      ])
        .then(async ([metaAcces, metaAccessService, metaAccessServiceInfo]) => {
          const payTo = [
            // 服务商费用
            {
              amount: metaAccessService.result.data[0].fee,
              address: metaAccessServiceInfo.result.address
            }
            // 没有铸造成NFT时，是转给作者费用， 已是nft则转给NFT拥有者的费用
            // { amount: amount, address: metaAccessServiceInfo.result.address },
          ]
          const res = await this.sendMetaDataTx({
            data: JSON.stringify({
              createTime: new Date().getTime(),
              metaAccessMetanetID: metaAcces.result.data[0].metanetId,
              ...data
            }),
            brfcId: '312a894b1e17',
            nodeName: 'MetaAccessPay',
            path: '/Protocols/MetaAccessPay',
            payTo
          }).catch(() => reject())
          if (res) {
            resolve(res)
          }
        })
        .catch(() => reject())
    })
  }

  // 获取用户支付 付费文章的tx内容
  getUserMetaAccessPayTxData(params: {
    metaAccessServiceConfigMetanetID: string
    metaAccessServiceConfigTx: string
    metaAccessService: string
    metaAccessMetanetID: string
    metaAccessTx: string
    metaId: string
  }) {
    return new Promise(async (resolve, reject) => {
      const _params: any = {
        find: {
          'data.metaAccessServiceConfigMetanetID':
            params.metaAccessServiceConfigMetanetID,
          'data.metaAccessServiceConfigTx': params.metaAccessServiceConfigTx,
          'data.metaAccessService': params.metaAccessService,
          'data.metaAccessMetanetID': params.metaAccessMetanetID,
          'data.metaAccessTx': params.metaAccessTx,
          rootTxId: params.metaId,
          parentNodeName: 'MetaAccessPay'
        },
        skip: 0
      }
      const res = await this.queryFindMetaDataForPost(_params)?.catch(() =>
        reject()
      )
      if (res.code === 0 && res.result.data.length > 0) {
        resolve(res.result.data[0])
      } else {
        reject()
      }
    })
  }

  // 上链付费阅读服务器
  async createMetaAccessServiceConfig() {
    return new Promise<void>(async (resolve) => {
      const res = await this.queryFindMetaDataForPost({
        find: {
          'data.metaID':
            'b371fd7e895f107b300ed79b24da050a129c570d783b9e75a98478eb54df17e6',
          parentNodeName: 'MetaAccessServiceConfig'
        },
        skip: 0
      })

      if (res.code === 0) {
        if (res.result.data.length > 0) {
          resolve()
        } else {
          await this.sendMetaDataTx({
            path: '/Protocols/MetaAccessServiceConfig',
            brfcId: '8357da96e017',
            nodeName: 'MetaAccessServiceConfig',
            data: JSON.stringify({
              metaID:
                'b371fd7e895f107b300ed79b24da050a129c570d783b9e75a98478eb54df17e6',
              createTime: Date.now(),
              updateTime: Date.now(),
              name: 'Test',
              fee: 1000,
              url: 'https://testshowman.showpay.io/metaaccess/'
            })
          })
          resolve()
        }
      } else {
        new Error('查询付费阅读服务失败')
      }
    })
  }
}

//hex格式转为Base64
export function hexToBase64(hex: string, fileType = 'image/png') {
  var pos = 0
  var len = hex.length
  if (len % 2 != 0) {
    return null
  }
  len /= 2
  var hexA = new Array()
  for (var i = 0; i < len; i++) {
    var s = hex.substr(pos, 2)
    var v = parseInt(s, 16)
    hexA.push(v)
    pos += 2
  }
  var binary = ''
  var bytes = new Uint8Array(hexA)
  var len = bytes.byteLength
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return `data:${fileType};base64,` + window.btoa(binary)
}

export function toTxLink(txId: string) {
  window.open(`https://whatsonchain.com/tx/${txId}`)
}

// 文件转为MetaFile 格式，便于后续处理附件
export function fileToMetaFile(file: File) {
  return new Promise<MetaFile>((resolve, reject) => {
    const fileType = file.type
    const reader = new FileReader()
    let fileBinary: string
    reader.onload = () => {
      const arrayBuffer = reader.result
      let buffer: string = ''
      let hex: string = ''
      if (arrayBuffer) {
        // @ts-ignore
        buffer = Buffer.from(arrayBuffer)
        // @ts-ignore
        hex = buffer.toString('hex')
        fileBinary = buffer
      }
      const fileData = hexToBase64(hex, fileType)
      const imgData: MetaFile = {
        base64Data: fileData!,
        BufferData: fileBinary,
        hexData: hex,
        name: file.name,
        raw: file,
        data_type: fileType
      }
      /*
          fileBinary二进制流
          fileData 图片base64编码
          fileType 文件名
          */
      resolve(imgData)
    }
    reader.onerror = (error) => {
      new Error(`handleFileChange error /n ${error}`)
      reject(reject)
    }
    reader.readAsArrayBuffer(file)
  })
}

// 处理附件
// 第一个参数为`data`, `data`里面的文件必须为`MetaFile` 格式，
// 第二个字段为要处理的字段和是否加密`{ name: string; encrypt: string }[]`
// 最终返回处理过的`data`和`attachments`供`sendMetaDataTx`使用
export function setAttachments(
  _data: any,
  fileAttrs: { name: string; encrypt: Encrypt }[]
) {
  return new Promise<{ data: any; attachments: any }>((resolve) => {
    const attachments: {
      fileName: string
      fileType: string
      data: string
      encrypt: Encrypt
    }[] = []
    let attachmentIndex = 0
    const data = { ..._data }
    fileAttrs.map((item) => {
      for (let i in data) {
        if (i === item.name) {
          if (typeof data[i] !== 'string') {
            if (data[i] instanceof Array) {
              for (let u = 0; u < data[i].length; u++) {
                attachments.push({
                  fileName: data[i][u].name,
                  fileType: data[i][u].data_type,
                  data: data[i][u].hexData,
                  encrypt: item.encrypt
                })
                data[i][u] = `![metafile](${attachmentIndex})`
                attachmentIndex += 1
              }
            } else {
              attachments.push({
                fileName: data[i].name,
                fileType: data[i].data_type,
                data: data[i].hexData,
                encrypt: item.encrypt
              })
              data[i] = `![metafile](${attachmentIndex})`
              attachmentIndex += 1
            }
          }
        }
      }
    })
    resolve({ data, attachments })
  })
}
