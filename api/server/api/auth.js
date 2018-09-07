var help = require("qingdie-help");
var parse = require('co-body');
var raw = require('raw-body');
var inflate = require('inflation');
var url = require('url');
var fs = require('fs');
var authRules = new(function () {
    var self = this;
    this.checkToken = function (config, token) {
        try {
            if (!token) return '';
            var v = help.aesDecrypt(token, config.takenKey);
            if (v.substring(0, config.takenKey.length) !== config.takenKey) {
                return '';
            }
            return v.substring(config.takenKey.length + 3, v.length);
        } catch (e) {
            console.log(e);
        }
        return '';
    };
    this.getToken = function (ctx, uid) {
        var time = new Date().getTime().toString();
        var s = ctx.app.config.takenKey + time.substring(10, 13) + uid;
        return help.aesEncrypt(s, ctx.app.config.takenKey);
    };
    this.apiAuth = async (ctx) => {
        var url = ctx.url.split('?')[0].toLowerCase();
        var actions = url.split('/');
        if (actions.length < 4) {
            return false;
        }
        ctx.apiurl = url;
        ctx.apimethod = actions[actions.length - 1];
        ctx.apicontrol = url.substring(5, url.length - ctx.apimethod.length - 1).toLowerCase().replace('admin/', '');
        return true;
    };
    this.viewAuth = async (ctx) => {
        ctx.viewurl = ctx.url.split('?')[0].toLowerCase().replace('.html', '');
        if (!ctx.viewurl || ctx.viewurl == '/') {
            ctx.viewurl = '/index';
        }
        ctx.viewurl= ctx.viewurl.substring(1);
        return true;
    };
    this.parseData = async (ctx) => {
        if (ctx.request.type == 'text/xml') {
            ctx.apidata = await raw(inflate(ctx.req)).then(function (str) {
                return str + '';
            });
        } else if (ctx.request.type == 'multipart/form-data') {
            var multiparty = require('multiparty');
            var form = new multiparty.Form({
                autoFiles: false,
                autoFields: true,
                uploadDir: ctx.app.config.rootpath + '/upload/temp/'
            });
            await new Promise(function (cb) {
                form.parse(ctx.req, function (err, fields, files) {
                    for (var dkey in fields) {
                        if (fields.hasOwnProperty(dkey)) {
                            !ctx.apidata && (ctx.apidata = {});
                            ctx.apidata[dkey] = fields[dkey] instanceof Array ? fields[dkey][0] : fields[dkey];
                        }
                    }
                    for (var fkey in files) {
                        if (files.hasOwnProperty(fkey)) {
                            ctx.apifiles = files[fkey];
                        }
                    }
                    cb(fields);
                });
            });
        } else if (ctx.method.toLowerCase() == 'post') {
            ctx.apidata = await parse(ctx, {
                limit: '5mb'
            });
        }
        if (ctx.url.indexOf('?') > -1) {
            var fields = await url.parse(ctx.url, true).query;
            if (ctx.apidata) {
                for (var key in fields) {
                    ctx.apidata[key] = fields[key];
                }
            } else {
                ctx.apidata = fields;
            }
        }
        var token = ctx.get('authtoken') || ctx.req.headers.authtoken || ctx.cookies.get('authtoken');
        ctx.UserId = token && self.checkToken(ctx.app.config, token) || '';
        ctx.Ip = help.getClientIp(ctx.req);
        ctx.apidata = ctx.apidata || {};
    }
    this.reqtype = function (ctx) {
        if (ctx.url.indexOf('/api/') == 0)
            return 'api';
        if (ctx.url.indexOf('/html/') == 0 || ctx.url.indexOf('/pages/') == 0 || ctx.url.indexOf('.html') > 0)
            return 'view';
        if (ctx.url.lastIndexOf('/') == ctx.url.length - 1 || ctx.url.indexOf('.') == -1) {
            return 'view';
        }
        return '';
    };
    this.auth = async (ctx, next) => {
        ctx.reqtype = this.reqtype(ctx);
        if (ctx.reqtype) {
            await self.parseData(ctx);
            if (ctx.reqtype == 'api') {
                await self.apiAuth(ctx);
            } else {
                await self.viewAuth(ctx);
            }
        }
        await next();
        if (ctx.authdata) {
            ctx.body.authtoken = this.getToken(ctx, ctx.authdata);
        }
        if (ctx.authcookie) {
            ctx.cookies.set('authtoken', this.getToken(ctx, ctx.authcookie));
        }
    };
})();
module.exports = authRules.auth;