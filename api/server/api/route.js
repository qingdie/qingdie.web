module.exports = function () {
    const log = require('./log');
    const fs=require('fs');
    var apicontrolArr={};
    const rootpath=__dirname.substring(0,__dirname.length-4);
    this.apiret = async (ctx, apicontrol, apimethod) => {
        try {
            var api = apicontrolArr[apicontrol];
            if(!api){
                var i=0;
                while(!fs.existsSync(rootpath+apicontrol.substring(2)+'.js')){
                    if((i=apicontrol.lastIndexOf("/"))!=10){
                        apimethod=apicontrol.substring(i+1);
                        apicontrol=apicontrol.substring(0,i);
                    }else{
                        return null;
                    }
                }
                var api = require(apicontrol);
                apicontrolArr[apicontrol]=api;
            }
            var amethd = api && api[apimethod];
            if (api && !amethd) {
                for (var m in api) {
                    if (api.hasOwnProperty(m)) {
                        if (m.toLowerCase() == apimethod) {
                            amethd = api[m];
                            break;
                        }
                    }
                }
            }
            if (amethd && amethd.constructor) {
                if (amethd.constructor.name === "AsyncFunction") {
                    return await amethd(ctx);
                } else if (amethd.constructor.name === "GeneratorFunction") {
                    return await new Promise(function (res) {
                        co(function* () {
                            var data = yield amethd.call(ctx);
                            res(data);
                        });
                    });
                } else if (amethd.constructor.name === "Function") {
                    return await new Promise(function (res) {
                        var ret = amethd(ctx, res);
                        ret && res(ret);
                    });
                }
            }
            return amethd;
        } catch (e) {
            log.errlog(e, { url: ctx.url, apidata: ctx.apidata });
        }
        return null;
    };
};