# metaidjs

## Setup

```bash
$ npm install --save metaidjs
```

引入到项目中

```js
import MetaIdJs from "metaidjs"
```

## Usage

> 实例化方法

```js
const metaIdJs = new MetaIdJs({
  oauthSettings: {
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: REDIRECT_URI
  },
  onLoaded: () => {
  },
  onError: (res) => {
    console.log(res)
  }
})

```

#### 实例化参数说明

| 参数        | 必须 | 类型   | 默认值 | 描述 |
| ----------- | ---- | ------ | ---- | ---- |
| oauthSettings | 是   | Object |      | Oauth登录信息，包含 clientId 和 redirectUri 内容    |
| onLoaded | 否   | Function |      | 脚本加载完成的回调函数  |
| onError | 否   | Function |      | 通用错误回调函数，用于自定义处理不同的错误类型  |

#### 基本响应参数格式说明

| 参数        | 必须 | 类型   | 默认值 | 描述 |
| ----------- | ---- | ------ | ---- | ---- |
| code | 是   | number |      | 响应结果代码：<br> 200:  操作成功 <br> 201: 用户认证失败  <br> 202: 用户认证已经过期 <br> 204: 通用错误   |
| status | 是   | string |      |   |
| data | 是   | Object |      | 实际响应内容，如果是错误响应，里面会包含错误信息 message  |


## Methods
* ### getUserInfo()

> 获取用户metaid-info信息

例子
```js
metaIdJs.getUserInfo(JSON.stringify({
  accessToken: ACCESS_TOKEN,
  callback: 'handleUserInfo',
}))
```

#### 调用参数说明

| 参数        | 必须 | 类型   | 默认值 | 描述 |
| ----------- | ---- | ------ | ---- | ---- |
| accessToken | 是   | string |      |    |
| callback | 是  | string |      | 回调函数名 |

> 返回结果样例：

```json
{
  "code": 200,
  "status": "success",
  "data": {
    "address": "14ZAj2BpLSB1nSd24TXUhu3jX1X42R89d9",
    "email": "",
    "emailEncrypt": "",
    "headUrl": "",
    "headUrlEncrypt": "0",
    "infoTxId": "e3d3fc6392cb61e99168598dd7ebb1c8043aeed4170186ceccb181a79fdbc200",
    "name": "秀",
    "nameEncrypt": "0",
    "phone": "13712345671",
    "phoneEncrypt": "1",
    "protocolTxId": "64c7b76a82b070042c817a55b897b133a87afa067ded0081f1173f0197a9a82f",
    "showId": "0a9d30a38c44aba79b2d023d667ca4558350727eb0b71efdff6aa6695200f78f",
    "timestamp": 1589185608226,
    "xpub": "xpub6CuZbuP1UX7VyA8NBXQdhQr93h5Eerr8RNGi2DfjyPTukqmNbYB"
  }
}
```

### sendMetaDataTx()/addProtocolNode()

> 发起 Protocols node 操作

#### 例子

```js
// metaIdJs.addProtocolNode一样
metaIdJs.sendMetaDataTx({
  nodeName: "SimpleMicroblog",
  metaIdTag: "metaid",
  brfcId: "987654321",
  accessToken: "token",
  encrypt: 0,
  payCurrency: "BSV",
  payTo: [
    {
      amount: 2000,
      address: "1ad59XtDJMeaMAuXasFad1EU4h",
    },
  ],
  path: "/Protocols/SimpleMicroblog",
  dataType: "application/json",
  attachments: [
    {
      fileName: "PC0b3c7d089fa7d55720d6cf.png",
      fileType: "image/png",
      data: "89504ae426082",
      encrypt: 0,
    },
  ],
  data: JSON.stringify({ content: "这是一个测试内容", title: "测试标题" }),
  needConfirm: true,
  callback: function (res) {
    // 确认付款完后的回调
    if (res.code === 200) {
      if (typeof res === "string") {
        res = JSON.parse(res);
      }
      console.log(res.data.txid);
      // do something...
    } else {
      new Error(res.data.message);
      // do something...
    }
  },
  onCancel: function () {
    // 取消付款回调
    // do something...
  },
});
```

#### 调用参数说明

| 参数        | 必须 | 类型     | 默认值     | 描述                                                         |
| ----------- | ---- | -------- | ---------- | ------------------------------------------------------------ |
| accessToken | 是   | string   |            | 用户 accessToken                                             |
| nodeName    | 是   | string   |            | 节点标识名字                                                 |
| dataType    | 是   | string   | text/plain | 可选项目。data 对应的数据类型，可用数据类型请参考：https://www.iana.org/assignments/media-types/media-types.xhtmls。默认为text/plain |
| encoding    | 否   | string   | UTF-8      | 对应 metaID encoding                                         |
| data        | 否   | string   | 'NULL'     | 对应 metaID data                                             |
| attachments | 否   | array    | []         | 附件                                                         |
| encrypt     | 否   | number   | 0          | 识该节点内容是否加密。本协议版本支持两种方式：0 为不加密；1 为 ECIES 加密，即加密 key 为对应节点的公钥，采用对应节点路径的私钥解密。默认为 0 不加密。 |
| version     | 否   | string   | 0.0.9      | 对应 metaID version                                          |
| brfcId      | 是   | string   |            | 协议 Id                                                      |
| path        | 是   | string   | ''         | 如果不是第一层 protocols 子节点, 需要带上完整路径 比如/Protocols/ShowBuzz 将在这个节点下创建 Node |
| payCurrency | 否   | string   | bsv        | 指定转账计价币种，支持 bsv 和 usd 两种，如果是 bsv 则计价单位为聪，如果是 usd 则计价单位为美元 |
| payTo       | 否   | array    | []         | 同时向指定地址转账，交易输出格式为 [{address: 'XXXXXXXXXX', amount: 1000}] |
| metaIdTag   | 否   | string   | metaid     | 固定为metaid                                                 |
| nodeKey     | 否   | string   |            | 编辑数据时需要指定当前节点的 publicKey                       |
| checkOnly   | 否   | boolean  | false      | 是否广播节点，默认false广播，为true时返回节点费率，txid之类信息，不广播 |
| needConfirm | 否   | boolean  | true       | 用户是否需要支付前确认                                       |
| callback    | 否   | function |            | 完成回调函数 function({data:{txid, message}, code})          |
| onCancel    | 否   | function |            | 取消回调函数                                                 |

##### attachment

| 参数     | 必须 | 类型   | 默认值 | 描述                                                         |
| -------- | ---- | ------ | ------ | ------------------------------------------------------------ |
| fileName | true | string |        | 文件名                                                       |
| fileType | true | string |        | 文件格式                                                     |
| data     | true | string |        | 文件hex(16进制)数据，explame:buffer.toString("hex")          |
| filePublicKey     | false | string |        | 编辑文件的时候必传         |
| encrypt  | true | number |        | 识该节点内容是否加密。本协议版本支持两种方式：0 为不加密；1 为 ECIES 加密，即加密 key 为对应节点的公钥，采用对应节点路径的私钥解密。默认为 0 不加密。 |



#### 返回结果样例：

```json
{
  "code": 200,
  "status": "success",
  "data": {
    "message": "Send transaction success",
    "txId": "f0ad74a0ff4663921b690f0aaf7cfc18ce7e"
  },
  "handlerId": "630090708621082410"
}
```


* ### signMessage()

> 签名

例子

```js
metaIdJs.signMessage({
  accessToken: ACCESS_TOKEN,
  data: {
    message:"",
    path:""
  },
  callback: 'handleSignMessage'
})
```

#### 调用参数说明

| 参数        | 必须 | 类型   | 默认值 | 描述       |
| ----------- | ---- | ------ | ------ | ---------- |
| accessToken | 是   | string |        |            |
| data        | 是   | string |        | data 数据  |
| callback    | 是   | string |        | 回调函数名 |

> 返回结果样例：

```json
{
  "code": 200,
  "status": "success",
  "data": {
    "pubkey": "<path对应的公钥>",
    "result": "<签名结果>"
  }
}
``` 
### 
* ### eciesEncryptData()

> ECIES 加密数据

例子

```js
metaIdJs.eciesEncryptData({
  accessToken: ACCESS_TOKEN,
  data: "",
  callback: 'handleEciesEncryptData'
})
```

#### 调用参数说明

| 参数        | 必须 | 类型   | 默认值 | 描述       |
| ----------- | ---- | ------ | ------ | ---------- |
| accessToken | 是   | string |        |            |
| data        | 是   | string |        | data 数据  |
| callback    | 是   | string |        | 回调函数名 |

> 返回结果样例：

```json
{
  "code": 200,
  "status": "success",
  "data": {
		"message": "Encrypt data success",
    "content": "<加密后的值>"
  }
}
```

### 

* ### eciesDecryptData()

> ECIES 解密数据

例子

```js
metaIdJs.eciesDecryptData({
  accessToken: ACCESS_TOKEN,
  data: "",
  callback: 'handleEciesDecryptData'
})
```

#### 调用参数说明

| 参数        | 必须 | 类型   | 默认值 | 描述       |
| ----------- | ---- | ------ | ------ | ---------- |
| accessToken | 是   | string |        |            |
| data        | 是   | string |        | data数据   |
| callback    | 是   | string |        | 回调函数名 |

> 返回结果样例：

```json
{
  "code": 200,
  "status": "success",
  "data": {
		"message": "Decrypt data success",
    "content": "<加密后的值>"
  }
}
```

### 
* ### ecdhEncryptData()

> ECDH 加密数据

例子

```js
metaIdJs.ecdhEncryptData({
  accessToken: ACCESS_TOKEN,
  data:{
    msg:"",
    publickey:""
  },
  callback: 'handleEcdhEncryptData'
})
```

#### 调用参数说明

| 参数        | 必须 | 类型   | 默认值 | 描述       |
| ----------- | ---- | ------ | ------ | ---------- |
| accessToken | 是   | string |        |            |
| data        | 是   | string |        | data 数据  |
| callback    | 是   | string |        | 回调函数名 |

> 返回结果样例：

```json
{
  "code": 200,
  "status": "success",
  "data": {
		"message": "Encrypt data success",
    "content": "<加密后的值>"
  }
}
```

### 

* ### ecdhDecryptData()

> ECDH 解密数据

例子

```js
metaIdJs.ecdhDecryptData({
  accessToken: ACCESS_TOKEN,
  data: {
    msg:"",
    publickey:""
  },
  callback: 'handleEcdhDecryptData'
})
```

#### 调用参数说明

| 参数        | 必须 | 类型   | 默认值 | 描述       |
| ----------- | ---- | ------ | ------ | ---------- |
| accessToken | 是   | string |        |            |
| data        | 是   | string |        | data数据   |
| callback    | 是   | string |        | 回调函数名 |

> 返回结果样例：

```json
{
  "code": 200,
  "status": "success",
  "data": {
		"message": "Decrypt data success",
    "content": "<加密后的值>"
  }
}
```

### 
* ### payToAddress() 即将上线功能

> 转账

例子

```js
metaIdJs.payToAddress({
  accessToken: ACCESS_TOKEN,
  data: {
    to: [{
      address:"",
      amount: 123;
    }];
    currency: "";
    opReturn: "";
  },
  callback: 'handlePayToAddress'
})
```

#### 调用参数说明

| 参数        | 必须 | 类型   | 默认值 | 描述       |
| ----------- | ---- | ------ | ------ | ---------- |
| accessToken | 是   | string |        |            |
| data        | 是   | string |        | data数据   |
| callback    | 是   | string |        | 回调函数名 |

data:

| 参数        | 必须 | 类型   | 默认值 | 描述 |
| ----------- | ---- | ------ | ---- | ---- |
| to | 是   | Array |      | 目标  |
| currency | 是   | string |   bsv   | sats或bsv |

to:

| 参数        | 必须 | 类型   | 默认值 | 描述 |
| ----------- | ---- | ------ | ---- | ---- |
| address | 是   | string |      | 目标地址，或paymail |
| amount | 是   | number |      |  金额 |
> 返回结果样例：

```json
{
  "code": 200,
  "status": "success",
  "data": {
		"txId": "dssdfsfds",
  }
}
```

### 