var examplebdmap = function() {
    this.onLoad = function(opt) {
        window.bdcb = function() {
            var map = new BMap.Map("allmap");
            var point = new BMap.Point(116.404, 39.915); // 创建点坐标
            map.centerAndZoom(point, 15);
            map.enableScrollWheelZoom();
        }
        this.loadjs();
    }
    this.loadjs = function() {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "http://api.map.baidu.com/api?v=2.0&ak=ddRAgnjtiZqop2Cg57ahYV448Z4m0ljR&callback=window.bdcb";
        document.body.appendChild(script);
    }
}