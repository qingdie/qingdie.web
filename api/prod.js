const Koa = require('koa');
global.env = 'prod';
const auth = require('./server/api/auth');
const routeapi = require('./server/api/routeapi');
const routeview = require('./server/api/routeview');
const res = require('./server/api/res');
const app = new Koa();
app.use(auth);
app.use(res);
app.use(routeapi);
app.use(routeview);
var server = app.listen(9129, function () {
    var port = server.address().port;
    require('child_process').exec('start http://localhost:9129');
    console.log('程序已经启动 http://localhost:%s', port);
});