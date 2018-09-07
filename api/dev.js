global.env = 'dev';
global.help=require('qingdie-help');
const Koa = require('koa');
const auth = require('./server/api/auth');
const routeapi = require('./server/api/routeapi');
const routeview = require('./server/api/routeview');
const res = require('./server/api/res');
const app = new Koa();
app.use(auth);
app.use(res);
app.use(routeapi);
app.use(routeview);
var server = app.listen(13101, function () {
    var port = server.address().port;
    require('child_process').exec('start http://localhost:13101');
    console.log('程序已经启动 http://localhost:%s', port);

});