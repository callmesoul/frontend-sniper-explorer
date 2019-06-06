import explorer from './frontend-sniper-explorer';
// let submitUrl='https://frontend-sniper.callmesoul.cn/api/errors';
let submitUrl='http://127.0.0.1:7001/api/errors';
explorer.start({
    submitUrl:submitUrl,
    record:true,//是否开启录制，默认为false
    sendError:(error)=>{
        /*如果需要录制功能*/
        console.log(`window.recordEvent`,window.recordEvent);
        if(window.recordEvent){
            if(window.recordEvent.lenght>=30){
                error.records=window.recordEvent;
            }else {
                error.records=window.eventBackUp.concat(window.recordEvent);
            }
        }
        fetch(submitUrl,{
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                // 'appId':'c27de230-4072-11e9-be0e-bf7018a8de0c',//使用 frontend-sniper时
                // 'appScrect':'c27de231-4072-11e9-be0e-bf7018a8de0c' //使用 frontend-sniper时
                'appId':'f9ed9f90-3b21-11e9-8bb4-156d2c6ff87c',//使用 frontend-sniper时
                'appScrect':'f9ed9f91-3b21-11e9-8bb4-156d2c6ff87c' //使用 frontend-sniper时
            },
            body:JSON.stringify(error),
        }).then(res => {
                // console.log(res)
            })
            .catch(error => console.error('Error:', error));
    }
});