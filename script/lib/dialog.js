var exampledialog = function() {
    this.onLoad = function(opt) {
        console.log(opt);
        this.data.id = opt && opt.i || 0
    }
    this.etoast = function() {
        api.msg.toast('标题啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦');
    };
    this.eloading = function() {
        api.msg.loading();
        setTimeout(function() {
            api.msg.closeloading();
        }, 3000);
    };
    this.ehideloading = function() {
        api.msg.closeloading();
    };
    this.ealert = function() {
        api.msg.alert('标题', '内容');
    };
    this.econfirm = function() {
        api.msg.confirm('标题', '内容', function(r) {
            api.msg.toast(r);
        });
    };
}
