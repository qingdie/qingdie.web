var exampledatabind = function() {
    this.data = {
        name: 'qingdie',
        user: { id: 1111 },
        isshow: 1,
        value: '你好'
    }
    this.onLoad = function(opt) {
        console.log(opt);
        this.data.id = opt && opt.i || 0
    }
    this.esetdata = function() {
        this.data.name = 'hello';
        this.data.user = { id: 'hello' }
    }
    this.esetdata1 = function() {
        //data下二级属性只能用 setData设置
        //或者
        //this.data.user={id:2222}
        this.setData({
            user: { id: 22222 }
        });
    }
    this.ehide = function() {
        this.data.isshow = !this.data.isshow;
    }
}

var exampleform = function() {
    this.data = {
        email: 'xueing@qingdie.net'
    }
    this.onLoad = function(opt) {

    }
    this.esubmit = function() {
        console.log(document.getElementsByTagName('form').length);
        if ($('form').validate()) {
            var data = $('form').formjson();
            console.log(data);
        }
    }
}