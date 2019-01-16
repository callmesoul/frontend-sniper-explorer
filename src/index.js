import explorer from './frontend-sniper-explorer';
explorer.start({
    sendError:(e)=>{
        console.log(explorer.config);
        console.log('---------sendError---------');
        console.log(e);
    }
});
console.log(aaa);
console.log(console.log(explorer.config));
console.log(explorer);