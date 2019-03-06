# frontend-sniper-explorer(前端错误监控探针)

> #### 探针宗旨：只负责传关于错误有用的信息，不做分析，不做其他埋点，尽量简单，通用。分析尽量放后台放后台分析。

## 项目集

- 服务端   [frontend-sniper-server](https://github.com/callmesoul/frontend-sniper-server)
- 管理后台 [frontend-sniper-admin](https://github.com/callmesoul/frontend-sniper-admin)
- 错误探针 [frontend-sniper-explorer](https://github.com/callmesoul/frontend-sniper-explorer)


## import

    `npm install frontend-sniper-explorer --save`
    
    `import explorer from 'frontend-sniper-explorer'`
    
    ||
     
    `<script src="https://github.com/callmesoul/frontend-sniper-explorer/blob/master/lib/frontend-sniper-explorer.js"></script>`

## Use
```javascript
explorer.start({
    submitUrl:'http://127.0.0.1:7001/api/errors',//后台提交错误api，只需改对应域名即可
    sendError:(e)=>{
        fetch(this.submitUrl,{//后台提交错误api，只需改对应域名即可
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'appId':'f9ed9f90-3b21-11e9-8bb4-156d2c6ff87c',//在frontend-sniper-admin管理后台创建应用的appId
                'appScrect':'f9ed9f91-3b21-11e9-8bb4-156d2c6ff87c' //在frontend-sniper-admin管理后台创建应用的appScrect
            },
            body:JSON.stringify(e),
        })
        .then(res => {
            // console.log(res)
        })
        .catch(error => console.error('Error:', error));
    }
});
```



## License
MIT &copy; CallMeSoul