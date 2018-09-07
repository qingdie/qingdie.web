var examplelist = function() {
    this.base = api.list;
    this.base({
        loading: true,
        loadmore: true,
        listurl: '/user/list',
    });
    this.onLoad = function(opt,cb) {
        this.listinit();
        this.refresh(cb);
    }
}