const log = require('./log');
const route = require('./route');
module.exports = (function () {
    this.base = route;
    this.base();
    return async (ctx, next) => {
        if (ctx.reqtype == 'api') {
            var st = new Date().getTime();
            try {
                ctx.body = await this.apiret(ctx, '../control/' + ctx.apicontrol, ctx.apimethod) || { msg: "You don' t have permission to access this api" };
                ctx.set("Access-Control-Allow-Origin", "*");
                ctx.set("Access-Control-Allow-Headers", "Content-Type,Accept");
                log.reslog(ctx);
            } catch (e) {
                log.errlog(e, ctx);
                ctx.body = { msg: '服务端错误！' };
            }
            if (new Date().getTime() - st > 2000) {
                log.apilog({ title: 'api超时：', st: st, time: new Date().getTime() - st, url: ctx.url, apidata: ctx.apidata },ctx);
            }
            return;
        }
        await next();
    };
})();