const log = require('./log');
const route = require('./route');
const tpl = require('./routeviewtpl');
module.exports = (function () {
    this.base = route;
    this.base();
    return async (ctx, next) => {
        if (ctx.reqtype == 'view') {
            var st = new Date().getTime();
            try {
                ctx.body = tpl(ctx.viewurl);
                ctx.set("Access-Control-Allow-Origin", "*");
                ctx.set("Access-Control-Allow-Headers", "Content-Type,Accept");
            } catch (e) {
                log.errlog(e, ctx);
            }
            if (new Date().getTime() - st > 2000) {
                log.apilog({
                    title: 'view超时：',
                    st: st,
                    time: new Date().getTime() - st,
                    url: ctx.url,
                    apidata: ctx.apidata
                }, ctx);
            }
        }
        await next();
    };
})()