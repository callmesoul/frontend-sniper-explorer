import MetaIdJs from 'metaidjs'
// @ts-ignore
import { v4 as uuid } from 'uuid'
import { Decimal } from 'decimal.js-light'
import DotWallet, {
  DotWalletConfig,
  DotWalletToken,
  ENV
} from 'dotwallet-jssdk'
import qs from 'qs'
import axios, { AxiosInstance } from 'axios'
import {
  BuyNFTParams,
  CancelSellNFTParams,
  CreateMetaFileFunParams,
  CreateNFTParams,
  CreateNftSellProtocolParams,
  GetBalanceRes,
  IssueNFTResData,
  MetaFile,
  MetaIdJsRes,
  NftBuyParams,
  NftBuyResData,
  NftCancelParams,
  NFTCancelResData,
  NftDataProtocolParams,
  NFTGenesisParams,
  NFTIssueParams,
  NftSellParams,
  NftSellResData,
  SdkGenesisNFTRes,
  SdkMetaidJsOptionsTypes,
  SellNFTParams,
  SendMetaDataTxRes,
  Token
} from './types/sdk'
import { Lang, SdkType } from './emums'

export class SDK {
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
  dotwalletjs: DotWallet | null = null
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
  nftAppAddress = '16tp7PhBjvYpHcv53AXkHYHTynmy6xQnxy' // Nft收手续费的地址

  constructor(options: {
    type: SdkType
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

  initSdk() {
    return new Promise<void>((resolve, reject) => {
      this.initIng = true
      if (this.type === SdkType.Metaidjs) {
        this.metaidjs = new MetaIdJs({
          ...this.metaidjsOptions,
          onLoaded: () => {
            this.initIng = false
            resolve()
          },
          onError: (error: MetaIdJsRes) => {
            this.initIng = false
            reject(error)
          }
        })
      } else if (this.type === SdkType.Dotwallet) {
        if (!this.dotwalletjs)
          this.dotwalletjs = new DotWallet(this.dotwalletOptions)
        this.initIng = false
        resolve()
      } else {
        this.initIng = false
        resolve()
      }
    })
  }

  toWallet() {
    let url = ''
    if (this.type === SdkType.Dotwallet) {
    } else {
      url = this.metaidjsOptions.baseUri
    }
    window.open(url)
  }

  // 更改 sdk 环境类型
  changeSdkType(type: SdkType) {
    this.type = type
    if (type === SdkType.Dotwallet) {
      if (this.dotwalletOptions) {
        this.appId = this.dotwalletOptions.clientID
        this.appScrect = this.dotwalletOptions.clientSecret
        this.dotwalletjs = new DotWallet(this.dotwalletOptions)
      } else {
        new Error('未设置dotwalletOptions')
      }
    } else if (type === SdkType.App) {
      this.appId = this.appOptions.clientId
      this.appScrect = this.appOptions.clientSecret
    } else {
      this.appId = this.appOptions.clientId
      this.appScrect = this.appOptions.clientSecret
    }
    window.localStorage.setItem('appType', type.toString())
  }

  isSdkFinish() {
    if (this.type === SdkType.App) {
      return this.appMetaidjs ? true : false
    } else if (this.type === SdkType.Metaidjs) {
      return this.metaidjs ? true : false
    } else if (this.type === SdkType.Dotwallet) {
      return this.dotwalletjs ? true : false
    }
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

  // 跳转授权
  login() {
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
          resolve(res)
        } else {
          reject(res)
        }
      } else {
        const res = await this.dotwalletjs
          ?.getToken(params)
          .catch((error) => reject(error))
        if (res && res.accessToken) {
          resolve({
            access_token: res.accessToken,
            refresh_token: res.refreshToken,
            expires_in: res.expiresIn,
            token_type: res.tokenType
          })
        } else {
          reject(res)
        }
      }
    })
  }

  //  refreshToken
  refreshToken(params: { refreshToken: string }) {
    if (this.type === SdkType.App) {
      new Error('App 环境 getToken 不可执行')
      return
    }
    if (this.type === SdkType.Metaidjs) {
      return this.axios?.post(
        '/showmoney/oauth2/oauth/token',
        {
          grant_type: 'refresh_token',
          client_id: this.appId,
          client_secret: this.appScrect,
          refresh_token: params.refreshToken
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
          },
          transformRequest: [
            function (data: object) {
              return qs.stringify(data)
            }
          ]
        }
      )
    } else {
      return this.dotwalletjs?.refreshToken(params)
    }
  }

  getUserInfo() {
    return new Promise<MetaIdJsRes>((resolve) => {
      const params = {
        accessToken: this.getAccessToken(),
        callback: (res: MetaIdJsRes) => {
          this.callback(res, resolve)
        }
      }
      if (this.type === SdkType.App) {
        const functionName: string = `getUserInfoCallBack`
        // @ts-ignore
        window[functionName] = params.callback
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
      } else if (SdkType.Metaidjs) {
        this.metaidjs?.getUserInfo(params)
      } else {
        // @ts-ignore
        this.dotwalletjs.getMetaIDUserInfo(params)
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
    payTo?: []
    needConfirm?: boolean
    encrypt?: string
    dataType?: string
    checkOnly?: boolean
  }) {
    return new Promise<SendMetaDataTxRes>((resolve, reject) => {
      if (!params.payCurrency) params.payCurrency = 'BSV'
      if (typeof params.needConfirm === 'undefined') params.needConfirm = true
      if (!params.encrypt) params.encrypt = '0'
      if (!params.dataType) params.dataType = 'application/json'
      const accessToken = this.getAccessToken()
      const callback = (res: MetaIdJsRes) => {
        this.callback(res, resolve)
      }
      const onCancel = (res: MetaIdJsRes) => {
        reject(res)
      }
      if (this.isApp) {
        const functionName: string = `sendMetaDataTxCallBack`
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

        // 处理余额不足回调
        ;(window as any).handleNotEnoughMoney = (res: MetaIdJsRes) => {
          reject()
        }
        this.metaidjs?.sendMetaDataTx(_params)
      }
    })
  }

  eciesDecryptData(data: string) {
    return new Promise((resolve) => {
      const _params = {
        callback: (res: MetaIdJsRes) => {
          this.callback(res, resolve)
        },
        accessToken: this.getAccessToken(),
        data
      }
      if (this.type === SdkType.App) {
        const functionName: string = `eciesDecryptDataCallBack`
        // @ts-ignore
        window[functionName] = _params.callback
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
        this.dotwalletjs.ecdhDecryptData(_params)
      }
    })
  }

  // 获取用户余额
  getBalance() {
    return new Promise<GetBalanceRes>((resolve) => {
      if (this.isApp) {
        const token = this.getAccessToken()
        const functionName = 'getBalanceCallBack'
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
            resolve
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
            this.callback(res, resolve)
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
    }
  ) {
    if (res.code !== 200) {
      if (this.callBackFail) {
        await this.callBackFail(res)
      }
    }
    resolve(res)
  }

  // 处理附件
  setAttachments(_data: any, fileAttrs: { name: string; encrypt: string }[]) {
    return new Promise<{ data: any; attachments: any }>((resolve) => {
      const attachments: {
        fileName: string
        fileType: string
        data: string
        encrypt: string
      }[] = []
      const data = { ..._data }
      fileAttrs.map((item, index) => {
        for (let i in data) {
          if (i === item.name) {
            if (typeof data[i] !== 'string') {
              attachments.push({
                fileName: data[i].name,
                fileType: data[i].data_type,
                data: data[i].hexData,
                encrypt: item.encrypt
              })
              data[i] = `![metafile](${index})`
            }
          }
        }
      })
      resolve({ data, attachments })
    })
  }

  // 文件转为MetaFile 格式，便于后续处理附件
  fileToMetaFile(file: File) {
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
        const fileData = 'data:' + fileType + ';base64,' + this.hexToBase64(hex)
        const imgData: MetaFile = {
          base64Data: fileData,
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

  // 十六进制 转换为 图片
  hexToBase64(str: string) {
    if (!str) {
      return 'https://showjob.oss-cn-hangzhou.aliyuncs.com/index/img_photo_default.png'
    }
    var a = []
    for (let i = 0, len = str.length; i < len; i += 2) {
      a.push(parseInt(str.substr(i, 2), 16))
    }
    var binary = ''
    var bytes = new Uint8Array(a)
    var len = bytes.byteLength
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const sty = window.btoa(binary)
    return sty
  }

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
      nodeName: 'NftIssue-6d3eaf759bbc',
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
  checkNftTxIdStatus(
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
                this.checkNftTxIdStatus(
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
          await this.checkNftTxIdStatus(genesisTxId!).catch(() =>
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
        callback: (res: SdkGenesisNFTRes) => {
          debugger
          this.callback(res, resolve)
        }
      }
      if (this.isApp) {
        const functionName: string = `genesisNFTCallBack`
        ;(window as any)[functionName] = _params.callback
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
      const _params = {
        data: {
          payTo: [{ address: this.nftAppAddress, amount: 10000 }],
          ...params
        },
        callback: (res: MetaIdJsRes) => {
          this.callback(res, resolve)
        }
      }
      if (this.isApp) {
        const functionName: string = `issueNFTCallBack`
        ;(window as any)[functionName] = _params.callback
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
        callback: (res: MetaIdJsRes) => {
          this.callback(res, resolve)
        }
      }
      if (this.isApp) {
        const accessToken = this.getAccessToken()
        const functionName: string = `nftBuyCallBack`
        // @ts-ignore
        window[functionName] = _params.callback
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
      const _params = {
        data: {
          ...params,
          payTo: [{ address: this.nftAppAddress, amount: 10000 }]
        },
        callback: (res: MetaIdJsRes) => {
          debugger
          this.callback(res, resolve)
        }
      }
      if (this.isApp) {
        const accessToken = this.getAccessToken()
        const functionName: string = `nftSellCallBack`
        // @ts-ignore
        window[functionName] = _params.callback
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
      const _params = {
        data: {
          outputIndex: 0,
          payTo: [{ address: this.nftAppAddress, amount: 10000 }],
          ...params
        },
        callback: (res: MetaIdJsRes) => {
          this.callback(res, resolve)
        }
        // onCancel: (msg: any) => {
        //   debugger
        // }
      }
      if (this.isApp) {
        const accessToken = this.getAccessToken()
        const functionName: string = `nftCancelCallBack`
        // @ts-ignore
        window[functionName] = _params.callback
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
}
