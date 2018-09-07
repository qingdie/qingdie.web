const send = require('koa-send');
var root = __dirname.substring(0, __dirname.length - 15) + (global.env == 'prod' ? '\\dist' : '');
var build = require('../../build/index');
var config = require('../../config');
var fs = require('fs');
module.exports = async (ctx, next) => {
    if (!ctx.reqtype && ctx.method.toLowerCase() == 'get') {
        if(global.env=='dev'){
            if (ctx.path == '/script/app.js') {
                var jss = await build.getjs('/script', config.build.js);
                ctx.body = `var js =${JSON.stringify(jss)};
                for (var i = 0; i < js.length; i++) {
                    document.write('<script src="' + js[i] + '?i=1.0.909"></script>');
                };`;
                ctx.set('Content-Type', 'application/javascript; charset=utf-8')
                return;
            }
            if (ctx.path == '/script/html.json' && !fs.existsSync(root + ctx.path)) {
                ctx.set('Content-Type', 'application/json; charset=utf-8');
                ctx.body = '{}';
                return;
            }
        }
        var r = await send(ctx, !ctx.path || ctx.path == '/' ? '/index.html' : ctx.path, {
            root: root
        });
        if (r) {
            return;
        }
    }
    await next();
};