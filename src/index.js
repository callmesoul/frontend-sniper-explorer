import explorer from './frontend-sniper-explorer';
explorer.start({
    submitUrl:'http://127.0.0.1:7001/api/errors',
    sendError:(e)=>{
        fetch('http://127.0.0.1:7001/api/errors',{
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'appId':'',//使用 frontend-sniper时
                'appScrect':''//使用 frontend-sniper时
            },
            body:JSON.stringify(e),
        }).then(res => res.json())
            .catch(error => console.error('Error:', error));
    }
});