# qingdie.web – 一个轻量级的h5单页面框架

这是一个非常轻量的单页面框架，仅仅依赖Zepto，路由模块、事件绑定模块，doc模版解析，
参考、使用了微信小程序和VUE的用法。

## Building

clone到本地，然后安装依赖
~~~ sh
$ npm install

# 启动开发模式
$ npm run dev

# 编译压缩html、css、js代码
$ npm run build

# 启动运行编译后的代码
$ npm run prod
~~~ sh

## 目录结构说明
   ### ./api/
    /build/
    编译压缩代码
    /server/
    dev模式启动的server和模拟后端接口
    采用qingdie.service的路由和数据解析
   ### ./css/
   项目的css文件
   api.css是框架引入的一些通用样式 
   ### ./dist/
   压缩编译后的代码 
   ### ./pages/
   页面html文件和模版
     ./pages/share/和./pages/components/ 文件存放组件和模版
   ### ./script/
   /lib/
   存放业务js代码
   /plugin/
   引入的js文件和框架js
   api.js 辅助方法
   control.js doc模版解析和事件绑定
   router.js 路由
## 配置说明
./api/config.js
~~~ sh
 build: {
        // cdnhost: '//cdnwx.qingdie.net', //cdn域名配置后css、图片、js路劲替换为cdn
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
            copy: []
        },
        //后台api接口地址
        apihost: '/api'
    }
~~~ sh

### 特别说明
1.一个页面一个类，类名称为：最后一级文件夹名称加上页面名称，可以多个类放在一个js文件里面
2.页面绑定事件，事件名称必须是e开头
3.页面上的内容比如放在 &lt;div class=&quot;page&quot;&gt;&lt;/div&gt;里面
4.onLoad方法有2个参数,opt和cb回调，opt是通过url传递的参数对象，如果有cb参数，只要调用了cb后页面才通过动画展示出来，一般用于数据加载完成页面渲染完成调用该方法，页面就展示出来。
  此方法里面不建议获取页面元素，应该很可能页面元素还没有添加到body里面。
5.onShow方法，页面渲染完成展示完成的回调，这此之前无法获取页面元素。
6.编译压缩后所有js压缩到 /script/app.js文件里面
7.所有css压缩到/css/app.css里面
8.每一个页面文件压缩为一个html文件
9.所有页面的html文件会压缩到/script/html.json里面，在页面第一次加载完成后异步加载，此后，所有页面都从缓存里面读取。
10.整个框架压缩后不到100K，首屏加载的文件只有app.css和app.js两个文件，放页面在50ms内渲染展示完成。