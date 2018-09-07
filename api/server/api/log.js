module.exports = new(function () {
    this.reslog = async (ctx) => {
        try {
            var txt = {
                uid: ctx.UserId,
                data: ctx.apidata,
                url: ctx.url,
                time: help.dateFormat(new Date(), 'yyyy-MM-dd hh:mm:ss'),
                body: ctx.data || ctx.body
            };
            console.log(txt);
        } catch (e) {
            console.log(e);
        }
    };
    this.errlog = async (e, ctx) => {
        var data = ctx ? {
            url: ctx.url,
            apidata: ctx.apidata
        } : '';
        console.error(e, data);
    };
    this.apilog = async (e, ctx) => {
        var data = ctx ? {
            url: ctx.url,
            apidata: ctx.apidata
        } : '';
        console.log(e, data);
    };
})();