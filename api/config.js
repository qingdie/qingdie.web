module.exports = {
    build: {
        // cdnhost: '//cdnwx.keyuxiaoshuo.com', //cdn域名配置后css、图片、js路劲替换为cdn
        copyddir: ['/res', '/image'], //拷贝的文件夹
        js: {
            //js压缩前排序
            sort: ['/plugin/zepto.min.js', '/plugin/template.js', '/plugin/api.js', '/plugin/router.js', '/plugin/control.js', '/plugin/jweixin-1.3.0.js', '/lib/app.js'],
            //直接复制不参与压缩的js文件
            copy: ['/plugin/vconsole.min.js'],
            //不复制也不参与压缩的js文件
            not: ['/app.js']
        },
        css: {
            //  purify: true, //净化css
            copy: []
        },
        //后台api接口地址
        apihost: '/api'
    }
}