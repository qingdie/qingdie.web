var homeindex = function() {
    this.data = {
        name: 'qingdie'
    }
    this.onLoad = function(opt) {
        console.log(opt);
    }
    this.ename = function(e) {
        this.setData({
            name: 'xueing'
        });
    }
}