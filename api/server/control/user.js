module.exports = new(function() {
    var help = require('qingdie-help');
    this.list = async (ctx) => {
        var page = help.pageParam(ctx.apidata);
        var users = [];
        if (page.start == 40) return { success: true, data: { list: [] } };
        for (let i = 0; i < page.size; i++) {
            users.push({ title: `第${i}条数据`, id: i });
        }
        return { success: true, data: { list: users } };
    };
})();