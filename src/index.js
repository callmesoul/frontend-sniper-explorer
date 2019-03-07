import explorer from './frontend-sniper-explorer';
let submitUrl='https://frontend-sniper.callmesoul.cn/api/errors';
explorer.start({
    submitUrl:submitUrl,
    sendError:(e)=>{
        fetch(submitUrl,{
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'appId':'c27de230-4072-11e9-be0e-bf7018a8de0c',//使用 frontend-sniper时
                'appScrect':'c27de231-4072-11e9-be0e-bf7018a8de0c' //使用 frontend-sniper时
            },
            body:JSON.stringify(e),
        }).then(res => {
                // console.log(res)
            })
            .catch(error => console.error('Error:', error));
    }
});