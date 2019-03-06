import explorer from './frontend-sniper-explorer';
explorer.start({
    submitUrl:'http://127.0.0.1:7001/api/errors',
    sendError:(e)=>{
        fetch(this.submitUrl,{
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'appId':'f9ed9f90-3b21-11e9-8bb4-156d2c6ff87c',//使用 frontend-sniper时
                'appScrect':'f9ed9f91-3b21-11e9-8bb4-156d2c6ff87c' //使用 frontend-sniper时
            },
            body:JSON.stringify(e),
        }).then(res => {
                // console.log(res)
            })
            .catch(error => console.error('Error:', error));
    }
});