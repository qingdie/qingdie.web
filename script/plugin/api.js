/*
 * @Author: xueping 
 * @Date: 2018-06-03 12:40:34 
 * @Last Modified by: xueping
 * @Last Modified time: 2018-09-07 18:59:57
 * @blog:http://qingdie.me 
 */
var api = {};
/**
 * 程序配置
 */
api.config = {
    stStamp: new Date().getTime(),
    debug: true,
    version: '1.0.0',
    apihost: '/api'
};
/**
 * 辅助方法
 */
api.help = new(function() {
    var xPi = 3.14159265358979324 * 3000.0 / 180.0;
    /**
     * 移除html标签
     * @param {string} str 
     */
    this.delHtmlTag = function(str) {
        return str.replace(/<[^>]+>/g, "");
    }
    /**
     * 时间格式化
     * @param {Date} date 
     * @param {String} format 
     */
    this.dateFormat = function(date, format) {
        !format && (format = date, date = this);
        date = new Date(date);
        var map = {
            "M": date.getMonth() + 1, //月份   
            "d": date.getDate(), //日   
            "h": date.getHours(), //小时   
            "m": date.getMinutes(), //分   
            "s": date.getSeconds(), //秒   
            "q": Math.floor((date.getMonth() + 3) / 3), //季度   
            "f": date.getMilliseconds() //毫秒   
        };
        format = format.replace(/([yMdhmsqf])+/g, function(all, t) {
            var v = map[t];
            if (v !== undefined) {
                if (all.length > 1) {
                    v = '0' + v;
                    v = v.substr(v.length - 2);
                }
                return v;
            } else if (t === 'y') {
                return (date.getFullYear() + '').substr(4 - all.length);
            }
            return all;
        });
        return format;
    }
    /**
     * url参数
     * @param {String} name 
     * @param {String} location 
     */
    this.urlsearch = function(name, location) {
        var url = location || window.location.toString();
        var i = url.indexOf('?') || 0;
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = url.substr(i + 1).match(reg);
        if (r != null) return decodeURI(r[2]);
        return "";
    }
    /**
     * 根据经纬度计算距离
     * @param {Float} lat1 
     * @param {Float} lng1 
     * @param {Float} lat2 
     * @param {Float} lng2 
     */
    this.distance = function(lat1, lng1, lat2, lng2) {
        function rad(d) {
            return d * Math.PI / 180.0;
        }
        var radLat1 = rad(lat1);
        var radLat2 = rad(lat2);
        var a = radLat1 - radLat2;
        var b = rad(lng1) - rad(lng2);

        var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
            Math.cos(radLat1) * Math.cos(radLat2) *
            Math.pow(Math.sin(b / 2), 2)));
        s = s * 6378.137;
        s = Math.round(s * 1000);
        return s;
    }
    /**
     * 图片转为Base64字符
     * @param {*} url 
     * @param {*} callback 
     * @param {*} outputFormat 
     */
    this.convertImgToBase64 = function(url, callback, outputFormat) {
        var canvas = document.createElement('CANVAS'),
            ctx = canvas.getContext('2d'),
            img = new Image;
        img.crossOrigin = 'Anonymous';
        img.onload = function() {
            canvas.height = img.height;
            canvas.width = img.width;
            ctx.drawImage(img, 0, 0);
            var dataUrl = canvas.toDataURL(outputFormat || 'image/jpg');
            callback.call(this, dataUrl);
            canvas = null;
        };
        img.src = url;
    }
    /**
     * 火星坐标转百度坐标
     * @param {*} latlng 
     */
    this.gcToBd = function(latlng) {
        var x = latlng.lng,
            y = latlng.lat;
        var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * xPi);
        var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * xPi);
        var bdLon = z * Math.cos(theta) + 0.0065;
        var bdLat = z * Math.sin(theta) + 0.006;
        return {
            lng: parseFloat(bdLon.toFixed(6)),
            lat: parseFloat(bdLat.toFixed(6))
        };
    }
    /**
     * 百度坐标转火星坐标
     * @param {*} latlng 
     */
    this.bdToGc = function(latlng) {
        var x = latlng.lng - 0.0065,
            y = latlng.lat - 0.006;
        var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * xPi);
        var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * xPi);
        var ggLon = z * Math.cos(theta);
        var ggLat = z * Math.sin(theta);
        return {
            lng: parseFloat(ggLon.toFixed(6)),
            lat: parseFloat(ggLat.toFixed(6))
        };
    }
    this.exmth = function() {
        String.prototype.trim = function() {
            return this.replace(/(^\s*)|(\s*$)/g, "");
        }
        String.prototype.ltrim = function() {
            return this.replace(/(^\s*)/g, "");
        }
        String.prototype.rtrim = function() {
            return this.replace(/(\s*$)/g, "");
        }
        String.prototype.format = function(args) {
            var result = this;
            if (arguments.length > 0) {
                if (arguments.length == 1 && typeof(args) == "object") {
                    for (var key in args) {
                        if (args[key] != undefined) {
                            var reg = new RegExp("({" + key + "})", "g");
                            result = result.replace(reg, args[key]);
                        }
                    }
                } else {
                    for (var i = 0; i < arguments.length; i++) {
                        if (arguments[i] != undefined) {
                            var reg = new RegExp("({[" + i + "]})", "g");
                            result = result.replace(reg, arguments[i]);
                        }
                    }
                }
            }
            return result;
        }
        Date.prototype.format = this.dateFormat;
    }
    this.exmth();
})();
/**设备信息 */
api.device = new(function() {
    var self = this;
    var rules = { '微信': 'micromessenger', '今日头条': 'newsarticle', 'UC浏览器': 'ucbrowser', '手机QQ': 'qq', '微博': 'weibo', 'Safari': 'safari' };
    //系统类型
    this.systemType = '';
    //浏览器环境
    this.browserType = '';
    this.winWidth = 0;
    this.winHeight = 0;
    /**
     * 初始化
     */
    this.init = function() {
        var uagen = navigator.userAgent.toLowerCase();
        if (/android/i.test(uagen)) {
            this.systemType = 'android';
            this.sysVersion = uagen.match(/android ([\d.]+)/);
            this.sysVersion = (this.sysVersion && this.sysVersion[1]) + '';
        }
        if (/(iphone|ipad|ipod|ios)/i.test(uagen)) {
            this.systemType = 'ios';
            this.sysVersion = uagen.match(/os ([\d_]+) like/);
            this.sysVersion = ((this.sysVersion && this.sysVersion[1]) + '').replace(/_/g, '.');
        }
        for (var key in rules) {
            if (new RegExp(rules[key], 'i').test(uagen)) {
                this.browserType = key;
                this.browVersion = uagen.match(new RegExp(rules[key] + "\\/([\\d.]+)( |\\()"));
                this.browVersion = (this.browVersion && this.browVersion[1]) + '';
                break;
            }
        }
        this.winWidth = window.$ && $(window).width() || 0;
        this.winHeight = window.$ && $(window).height() || 0;
        this.info = {
            systemType: this.systemType,
            sysVersion: this.sysVersion,
            browserType: this.browserType,
            browVersion: this.browVersion
        };
        this.sysVersion && (this.sysVersion = { value: this.sysVersion, compile: this.vercompare });
        this.browVersion && (this.browVersion = { value: this.browVersion, compile: this.vercompare });
    }
    /**
     * 版本号比较
     * @param {String} ver 
     */
    this.vercompare = function(ver, ver1) {
        var v1 = (ver1 || this.value).split('.');
        var v2 = ver.split('.');
        for (var i = 0; i < v1.length && i < v2.length; i++) {
            if (v1[i] > v2[i]) return 1;
            if (v1[i] < v2[i]) return -1;
            if (i + 1 == v1.length) {
                return v1.length == v2.length ? 0 : -1
            }
            if (i + 1 == v2.length) {
                return v1.length == v2.length ? 0 : 1
            }
        }
    }
    //ui事件触发回调，ios系统播放音乐等
    this.uiAction = function(call) {
        if (this.browserType === 'weixin') {
            window.WeixinJSBridge && window.WeixinJSBridge.invoke("getNetworkType", {}, function() {
                call();
            });
        } else {
            call();
        }
    }
    //播放音乐
    this.playAudio = function(path, call) {
        var audio = $('<audio  preload="auto" src="' + path + '"></audio>')[0];
        var isplay = false;
        var stime = new Date().getTime();
        audio.oncanplay = function() {
            audio.play();
        }
        audio.onplaying = function() {
            isplay = true;
        }
        audio.onended = function() {
            call && call();
        }
        $(document.body).append(audio);

        function checkplay() {
            if (!isplay) {
                if (new Date().getTime() - stime > 10000) return;
                self.uiAction(function() {
                    audio.play();
                });
                window.setTimeout(checkplay, 100);
            }
        }
        checkplay();
    }
    //停止播放音乐
    this.stopPlay = function() {
        self.uiAction(function() {
            var audios = $('audio');
            for (var i = 0; i < audios.length; i++) {
                audios[i].pause();
                $(audios[i]).remove();
            }
        });
    }
    //关闭网页
    this.closeapp = function() {
        if (self.browserType === 'weixin' && window.wx) {
            window.wx.closeWindow();
        } else {
            history.back(100);
        }
    }
    //打开相册或相机
    this.openImage = function(opt, call) {
        opt = opt || {};
        if (api.browserType === 'weixin') {
            window.wx.chooseImage({
                count: opt.count || 1,
                sizeType: opt.sizeType || ['original'],
                sourceType: opt.sourceType || ['album', 'camera'],
                success: function(res) {
                    res.localIds && res.localIds.length > 0 && call(res.localIds[0]);
                }
            });
        } else {
            api.alert('暂时不支持此浏览器环境');
        }
    }
    //预览图片
    this.previewImage = function(imgs, index) {
        if (api.device.browserType === 'weixin') {
            window.wx.previewImage({
                current: imgs[index],
                urls: imgs
            });
        }
    }
    //定位
    this.location = function(call) {
        this.browserType === '微信' ? this.wxLocation(call) : this.h5Location(call);
    }
    //微信定位
    this.wxLocation = function(call) {
        if (!window.wx) return this.h5Location(call);
        console.log('微信定位');
        var iscb = true;
        window.wx.ready(function() {
            console.log('微信开始定位');
            window.wx.getLocation({
                type: 'gcj02',
                complete: function(res) {
                    if (!iscb) return;
                    iscb = false;
                    console.log('微信定位', res);
                    if (res && res.latitude) {
                        var latitude = res.latitude;
                        var longitude = res.longitude;
                        call({
                            lat: latitude,
                            lng: longitude
                        });
                    } else {
                        self.h5Location(call);
                    }
                }
            });
        });
        setTimeout(function() {
            console.log('微信定位超时！');
            iscb && (iscb = false, self.h5Location(call));
        }, 2000);
        return false;
    }
    //h5定位
    this.h5Location = function(call) {
        var iscb = true;
        navigator.geolocation.getCurrentPosition(function(position) {
            if (position && position.coords) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;
                qq.maps.convertor.translate(new qq.maps.LatLng(lat, lng), 1, function(res) {
                    iscb && (iscb = false, call(res[0]));
                });
            } else {
                iscb = false;
                self.qqipLocation(call);
            }
        });
        setTimeout(function() {
            console.log('h5定位超时！');
            iscb && (iscb = false, call);
        }, 2000);
    }
    //qqip定位
    this.qqipLocation = function(call) {
        var iscb = true;
        var citylocation = new qq.maps.CityService({
            complete: function(result) {
                iscb && call(result.detail.latLng);
                iscb = false;
            }
        });
        citylocation.searchLocalCity();
        setTimeout(function() {
            iscb && call();
            iscb = false;
        }, 3000);
    }
    this.init();
})();
/**消息提示 */
api.msg = new(function() {
    this.alert = function(title, msg, call) {
        if (typeof msg === "function") {
            call = msg;
            msg = '';
        }
        this.dialog({
            title: title,
            msg: msg,
            buttons: ['确定']
        }, call);
    }
    this.confirm = function(title, msg, call) {
        if (typeof msg === "function") {
            call = msg;
            msg = '';
        }
        this.dialog({
            title: title,
            msg: msg,
            buttons: ['取消', '确定']
        }, function(r) {
            call && call(r === 1);
        });
    }
    this.dialog = function(opt, call) {
        var mask = $('<div class="api-mask"></div>');
        var dialog = $('<div class="api-dialog"></div>');
        opt.title && dialog.append('<div class="api-dialog-header">' + opt.title + '</div>');
        opt.msg && dialog.append('<div class="api-dialog-body">' + opt.msg + '</div>');
        opt.uibody && dialog.append($('<div class="api-dialog-body"></div>').append($(opt.uibody)));
        var footer = $('<div class="api-dialog-footer"></div>');
        opt.buttons.length > 0 && footer.append('<div class="api-dialog-btn">' + opt.buttons[0] + '</div>');
        opt.buttons.length > 1 && footer.append('<div class="api-dialog-btn">' + opt.buttons[1] + '</div>');
        dialog.append(footer);
        footer.find('div').tap(function(e, e1) {
            e1.preventDefault();
            mask.removeClass('api-mask-in');
            dialog.removeClass('api-dialog-in').addClass('api-dialog-out');
            setTimeout(function() {
                mask.remove();
                dialog.remove();
            }, 200);
            call && call($(this).index());
            return false;
        });
        $('body').append(mask).append(dialog);
        dialog.css('margin-top', -parseInt(dialog[0].offsetHeight / 2));
        setTimeout(function() {
            mask.addClass('api-mask-in');
            dialog.addClass('api-dialog-in');
        }, 10);
    }
    this.toast = function(msg, type, bg) {
        var etoast = $('<div class="api-toast api-toastshow"><p>' + msg + '</p></div>').show();
        if (type === 'loading') {
            if ($('#api-loading').length > 0) {
                etoast = $('#api-loading');
                etoast.find('p').html(msg);
            } else {
                etoast.attr('id', 'api-loading').prepend('<i class="api-loading"></i>');
            }
        } else {
            setTimeout(function() {
                etoast.remove();
            }, 3000);
        }
        bg === true && etoast.prepend('<div class="api-bg"></div>');
        $('body').append(etoast);
        etoast.css({
            'left': '50%',
            'margin-left': -parseInt(etoast.width() / 2)
        });
        setTimeout(function() {
            etoast.addClass('api-toast-in');
        }, 10);
        return etoast;
    }
    this.err = function(msg, time) {
        this.toast(msg);
    }
    this.loading = function(msg) {
        this.toast(msg || '正在加载...', 'loading', true);
    }
    this.closeloading = function() {
        $('#api-loading').remove();
    }
})();
/**本地数据存储 */
api.db = new(function() {
    this.uzStorage = function() {
        var ls = window.localStorage;
        if (!ls && window.os && window.os.localStorage) {
            ls = window.os.localStorage();
        }
        return ls;
    };
    this.get = function(key) {
        var ls = this.uzStorage();
        if (ls) {
            var v = ls.getItem(key);
            if (!v) return null;
            try {
                return JSON.parse(v)
            } catch (error) {
                return v;
            }
        }
        return null;
    }
    this.set = function(key, v) {
        try {
            var v = typeof v == 'object' ? JSON.stringify(v) : v;
            var ls = this.uzStorage();
            if (ls) {
                ls.setItem(key, v);
            }
        } catch (e) {
            api.msg.alert(api.device.systemType == 'ios' ? '请关闭无痕模式进行使用' : '请关闭无痕或隐私模式进行使用');
        }
    };
    this.clear = function() {
        var ls = this.uzStorage();
        ls && ls.clear();
    }
})();
/**cookie操作 */
api.cookie = new(function() {
    this.get = function(key) {
        var getCookie = document.cookie.replace(/[ ]/g, "");
        var arrCookie = getCookie.split(";")
        var tips;
        for (var i = 0; i < arrCookie.length; i++) {
            var arr = arrCookie[i].split("=");
            if (key == arr[0]) {
                tips = arr[1];
                break;
            }
        }
        return tips;
    }
    this.set = function(key, val, time) {
        var cookie = key + "=" + val + ";path=/";
        if (time || time == undefined) {
            var date = new Date();
            var expiresDays = time || 30;
            date.setTime(date.getTime() + expiresDays * 24 * 3600 * 1000);
            cookie += ';expires=' + date.toGMTString();
        }
        document.cookie = cookie;
    }
    this.del = function(key) {
        var date = new Date();
        date.setTime(date.getTime() - 10000);
        document.cookie = key + "=v;expires =" + date.toGMTString();
    }
    this.clear = function() {
        var keys = document.cookie.match(/[^ =;]+(?=\=)/g);
        if (keys) {
            for (var i = keys.length; i--;)
                document.cookie = keys[i] + '=0;path=/;expires=' + new Date(0).toUTCString();
        }
    }
})();
/**表单验证 */
api.validate = new(function() {
    var t = this;
    var currentForm = null,
        ele = null;

    function getele() {
        var fs = [];
        var f;
        for (var i = 0; i < currentForm[0].length; i++) {
            f = currentForm[0][i];
            if ("submit,button,reset,image".indexOf(f.type.toLocaleString()) === -1 && !f.disabled) {
                fs.push(f);
            }
        }
        return fs;
    };

    function fmtmsg(msg, v) {
        return msg && msg.replace && msg.replace('{0}', v);
    };
    this.validate = function(form, all) {
        currentForm = $(form);
        ele = getele();
        var end = all === true;
        var isvali = true;
        for (var i = 0; i < ele.length; i++) {
            if (!t.valid(ele[i], t.showmsg)) {
                isvali = false;
                if (!end) return false;
            }
        }
        return isvali;
    };
    this.valiing = function(form) {
        currentForm = $(form);
        ele = getele();
        for (var i = 0; i < ele.length; i++) {
            if (!t.valid(ele[i], t.showmsging, false)) {
                $(ele[i]).keyup(function() {
                    t.valid(this, t.showmsging);
                });
                $(ele[i]).change(function() {
                    t.valid(this, t.showmsging);
                });
            }
        }
    };
    this.valid = function(e, fnmsg, focus) {
        fnmsg = fnmsg || t.showmsg;
        var $e = $(e);
        e = $e[0];
        var v = $.trim($e.val());
        //验证是否必须输入
        var vr = $e.attr('required');
        var m;
        if (vr != undefined && !t.methods.required(v, e)) {
            m = $e.attr('requiredmsg') || $e.attr('placeholder') || e.title || t.messages.required;
            fnmsg && fnmsg(m, e, 'required', false);
            if (focus) $e.focus();
            return false;
        }
        if (v.length === 0) {
            fnmsg && fnmsg('', e, 'required', true);
            return true;
        }
        //验证type项
        vr = e.getAttribute('type') && e.getAttribute('type').toLowerCase();
        if (vr && vr !== "text" && t.methods[vr] && !t.methods[vr](v, vr)) {
            m = e.getAttribute(vr + 'msg') || e.title || t.messages[vr];
            fnmsg && fnmsg(m, e, vr, false);
            $e.focus();
            return false;
        }
        //验证特性项
        for (var i = 0; i < t.features.length; i++) {
            var f = t.features[i];
            if (typeof(f) === 'string') {
                vr = e.getAttribute(f);
                if (vr === "") vr = f;
                if (vr && t.methods[f] && !t.methods[f](v, vr)) {
                    m = e.getAttribute(f + 'msg') || e.title || fmtmsg(t.messages[f], vr);
                    fnmsg && fnmsg(m, e, vr, false);
                    $e.focus();
                    return false;
                }
            }
        }
        return true;
    };
    this.features = [
        'min', 'max', 'number', 'minlength', 'maxlength', 'chs', 'zip', 'qq', 'phone', 'mobile', 'landline', 'idcard', 'pattern', 'equalto'
    ];
    this.methods = {
        required: function(v) {
            return v && v.replace(/(^\s*)|(\s*$)/g, "").length > 0;
        },
        min: function(v, p) {
            return parseFloat(v) >= parseFloat(p);
        },
        max: function(v, p) {
            return parseFloat(v) <= parseFloat(p);
        },
        minlength: function(v, p) {
            return v.replace(/(^\s*)|(\s*$)/g, "").length >= p;
        },
        maxlength: function(v, p) {
            return v.replace(/(^\s*)|(\s*$)/g, "").length <= p;
        },
        email: function(v) {
            return /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i.test(v);
        },
        url: function(v) {
            return this.isurl(v);
        },
        number: function(v) {
            return /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(v);
        },
        chs: function(v) {
            return /^[\u0391-\uFFE5]+$/.test(v);
        },
        zip: function(v) {
            return /^[1-9]\d{5}$/.test(v);
        },
        qq: function(v) {
            return /^[1-9]\d{4,10}$/.test(v);
        },
        phone: function(v) {
            return this.mobile(v) || this.landline(v);
        },
        mobile: function(v) {
            return /^((\(\d{2,3}\))|(\d{3}\-))?1\d{10}$/.test(v);
        },
        landline: function(v) {
            return /^(\(\d{3,4}\)|\d{3,4}-)?\d{7,8}$/.test(v);
        },
        idcard: function(v1) {
            var isDateTime = function() {
                var time = new Date(this);
                var m = (time.getMonth() + 1);
                var d = time.getDate();
                var f = time.getFullYear() + '-' + (m > 9 ? m : '0' + m) + '-' + (d > 9 ? d : '0' + d);
                return this.toString() === f;
            };
            var idCard = function(value) {
                if (value.length === 18 && 18 !== value.length) return false;
                var number = value.toLowerCase();
                var d, sum = 0,
                    v = '10x98765432',
                    w = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2],
                    a = '11,12,13,14,15,21,22,23,31,32,33,34,35,36,37,41,42,43,44,45,46,50,51,52,53,54,61,62,63,64,65,71,81,82,91';
                var re = number.match(/^(\d{2})\d{4}(((\d{2})(\d{2})(\d{2})(\d{3}))|((\d{4})(\d{2})(\d{2})(\d{3}[x\d])))$/);
                if (re == null || a.indexOf(re[1]) < 0) return false;
                if (re[2].length === 9) {
                    number = number.substr(0, 6) + '19' + number.substr(6);
                    d = ['19' + re[4], re[5], re[6]].join('-');
                } else d = [re[9], re[10], re[11]].join('-');
                if (!isDateTime.call(d)) return false;
                for (var i = 0; i < 17; i++) sum += number.charAt(i) * w[i];
                return (re[2].length === 9 || number.charAt(17) === v.charAt(sum % 11));
            };
            return idCard(v1);
        },
        isurl: function(url) {
            var strRegex = '^((https|http|ftp|rtsp|mms)?://)' +
                '?(([0-9a-z_!~*\'().&=+$%-]+: )?[0-9a-z_!~*\'().&=+$%-]+@)?' //ftp的user@ 
                +
                '(([0-9]{1,3}.){3}[0-9]{1,3}' // IP形式的URL- 199.194.52.184 
                +
                '|' // 允许IP和DOMAIN（域名） 
                +
                '([0-9a-z_!~*\'()-]+.)*' // 域名- www. 
                +
                '([0-9a-z][0-9a-z-]{0,61})?[0-9a-z].' // 二级域名 
                +
                '[a-z]{2,6})' // first level domain- .com or .museum 
                +
                '(:[0-9]{1,4})?' // 端口- :80 
                +
                '((/?)|' // a slash isn't required if there is no file name 
                +
                '(/[0-9a-z_!~*\'().;?:@&=+$,%#-]+)+/?)$';
            var re = new RegExp(strRegex);
            return re.test(url);
        }
    };
    this.messages = {
        required: '什么都不写么？',
        pattern: '不符合验证规则',
        max: "请输入一个小于或等于{0}的值",
        min: "请输入一个大于或等于{0}的值",
        maxlength: "长度应小于{0}位",
        minlength: "长度应大于{0}位",
        email: "邮箱地址这样不对吧！",
        url: "邮箱地址这样不对吧！",
        number: "只能输入数字哦！",
        chs: '只能输入汉字哦！',
        zip: '邮政编码不正确！',
        qq: 'QQ号码不正确！',
        tel: '电话号码不正确',
        mobile: '手机号码不正确！',
        phone: '固定电话号码不正确！',
        idcard: '请输入正确的身份证号码',
        equalto: '输入不匹配'
    };
    this.showmsg = function(msg, e, m, ok) {
        if (!ok) {
            var p = $(e);
            p.focus();
            api.msg.toast(msg);
        }
    };
    window.$ && ($.fn.validate = function(all) {
        return t.validate(this, all);
    });
})();
/** 异步辅助*/
api.promise = function() {
    var me = {};
    var self = this;
    this.then = function(cb) {
        me.thendata ? cb(me.thendata) : (self.success = cb);
        return self;
    };
    this.catch = function(cb) {
        me.errordata ? cb(me.errordata) : (self.error = cb);
        return self;
    };
    this.success = function(data) {
        me.thendata = data;
    };
    this.error = function(data) {
        me.errordata = data;
    };
    return this;
};
/**网络请求 */
api.net = new(function() {
    var self = this;

    function complete(reqpromise, ret, opt) {
        opt.loading !== false && api.msg.closeloading();
        if (ret) {
            ret.authtoken && (self.authtoken = ret.authtoken, api.db.set('authtoken', ret.authtoken));
            ret.tip === 'alert' && api.msg.alert(ret.msg || opt.errmsg);
            ret.action == 'close' && api.page.back();
            if (ret.success) {
                reqpromise.success(ret);
                return;
            }
        }
        reqpromise.error(ret, function() {
            opt.visible != false && api.msg.toast(ret && ret.msg || opt.errmsg);
        });
        window.app && app.logup && (!ret || ret.log != false) && app.logup({ url: url, ret: ret });
    }
    this.get = function(action, opt) {
        return this.ajaxjson(action, null, opt);
    }
    this.post = function(action, data, opt) {
        return this.ajaxjson(action, data, opt);
    }
    this.ajaxjson = function(action, data, opt) {
        opt = opt || {};
        opt.loading !== false && api.msg.loading(opt.msg);
        opt.errmsg = opt.errmsg || '请稍后再试!';
        var reqpromise = new api.promise();
        $.ajax({
            url: (opt.apihost || api.config.apihost) + action,
            data: data,
            dataType: 'json',
            type: data ? 'POST' : 'get',
            headers: {
                authtoken: self.authtoken || (self.authtoken = api.db.get('authtoken')) || ''
            },
            success: function(ret) {
                complete(reqpromise, ret, opt);
            },
            error: function(ret) {
                complete(reqpromise, ret, opt);
            }
        })
        return reqpromise;
    }
})();
/**
 * 支付接口
 */
api.pay = new(function() {
    this.weixin = function(data, cb) {
        if (data.mtype) {
            WeixinJSBridge.invoke('getBrandWCPayRequest', {
                "appId": data.appId,
                "timeStamp": data.timeStamp,
                "nonceStr": data.nonceStr,
                "package": data.package,
                "signType": data.signType,
                "paySign": data.paySign
            }, function(res) {
                if (res.err_msg == "get_brand_wcpay_request:ok") {
                    cb(true);
                } else {
                    cb(false, res, ret)
                    api.msg.alert('取消支付');
                }
            });
        } else {
            data.complete = function(res) {
                if (res.errMsg === 'chooseWXPay:ok') {
                    cb(true);
                } else {
                    cb(false, res, ret)
                    api.msg.alert('取消支付');
                }
            }
            window.wx.chooseWXPay(data);
        }
    }
    this.wxh5 = function(data) {
        window.location = data;
    }
    this.zfb = function(data) {
        window.location = data;
    }
})();
/**
 * 表单数据获取或加装
 */
api.form = new(function() {
    this.formjson = function(form) {
        var eles = $(form)[0];
        var json = {};
        var value;
        for (var i = 0; i < eles.length; i++) {
            var e = eles[i];
            if (e.name) {
                value = $(e).val();
                json[e.name] ? json[e.name] += ',' + value : json[e.name] = value;
            }
        }
        return json;
    };
    this.loadData = function(form, json) {
        if (!json) return;
        var eles = $(form)[0];
        if (!eles) return;
        for (var i = 0; i < eles.length; i++) {
            var e = eles[i];
            if (e.name && json.hasOwnProperty(e.name)) {
                $(e).val(json[e.name] || '');
            }
        }
    };
    window.$ && (window.$.fn.formjson = function() {
        return api.ui.formjson(this);
    }, window.$.fn.loadData = function(json) {
        api.ui.loadData(this, json);
    });
})()
/**列表基类 下拉刷新需要引入 apiScroll.js文件*/
api.list = function(opt) {
    opt.dname = opt.dname || 'list';
    opt.loading = !!opt.loading;
    opt.elist = opt.elist || 'list';
    var self = this;
    var firstload = true;
    var hasmore = true;
    var loading = false;
    this.listfilter = {
        PageIndex: 0,
        PageSize: 20,
        PageStart: 0
    };
    this.listinit = function() {
        firstload = true;
        hasmore = true;
        loading = false;
        self.scroll && self.scroll.destroy();
        if (opt.refresh) {
            opt.container = $('#' + opt.elist).parents('.scroll-container')[0];
            self.scroll = new api.ApiScroll(opt.refresh && self.refresh, opt.loadmore && self.loadmore, opt);
        } else if (opt.loadmore) {
            self.docscroll = opt.escroll ? $(opt.escroll) : $('#' + opt.elist).parents('.scroll-auto');
            if (self.docscroll.length == 0) {
                self.docscroll = $('.scroll-auto').eq(0);
            }
            self.docscroll.scroll(function() {
                if (this.scrollHeight - this.scrollTop - this.clientHeight < 5) {
                    self.loadmore();
                }
            });
        }
    };
    this.refresh = function(call) {
        !opt.noloading && self.scroll && self.scroll.refreshing();
        self.listfilter.PageIndex = 0;
        self.listfilter.PageStart = 0;
        self.load(function() {
            call ? call() : self.scroll && self.scroll.refreshed();
            firstload = false;
            self.scroll && (self.scroll.hasmore = hasmore);
        });
    };
    this.loadmore = function(call) {
        if (loading) return;
        if (firstload) {
            call ? call() : self.scroll && self.scroll.refreshed();
            return;
        }
        self.listfilter.PageIndex = self.listfilter.PageStart + 1;
        self.load(call);
    };
    this.getData = function(call, cfn) {
        opt.load ? opt.load(self.listfilter, call, cfn) :
            api.net.ajaxjson(opt.listurl, self.listfilter, {
                visible: opt.loading && (self.listfilter.PageIndex > 0 || firstload),
                error: cfn
            }).then(call).catch(cfn);
    };
    this.load = function(call) {
        if (loading || !hasmore && self.listfilter.PageIndex > 0) return call && call();
        if (self.listfilter.PageIndex === 0) hasmore = true;
        loading = true;
        self.getData(function(d) {
            loading = false;
            hasmore = !(self.listfilter.PageSize > d.data.list.length || d.data.list.length == 0);
            opt.prefn && opt.prefn.call(self, d.data);
            opt.method && (d.data.method = opt.method);
            var data = d.data;
            self.listfilter.PageIndex == 0 ? data[opt.dname] = d.data.list : (data[opt.dname] = self.data[opt.dname].concat(d.data.list), self.listfilter.PageStart++);
            data.finish = !hasmore;
            self.setData(data);
            opt.showcall && opt.showcall(data);
            call && call(d.data);
        }, function() {
            loading = false;
            call && call();
        });
    };
};
/**
 * 页面路由接口
 */
api.page = new(function($) {
    this.init = function() {
        api.msg.loading();
        console.log('网页初始化', new Date().getTime() - api.config.stStamp);
        window.addEventListener('routerInited', function(r) {
            api.msg.closeloading();
            console.log('渲染完成', new Date().getTime() - api.config.stStamp);
        }, false);
        window.addEventListener('pageLoadStart', function() {
            api.msg.loading();
        }, false);
        window.addEventListener('pageLoadComplete', function(r) {
            api.msg.closeloading();
            r.detail && (api.msg.alert('页面加载失败！'), console.log(r.detail));
        }, false);
        $(document).on('tap', '.app-back', function(e, e1) {
            e1.preventDefault();
            Router.back();
        });
    }
    this.urlparam = function(url) {
        return Router._urlparam(url);
    };
    this.go = function(opt) {
        Router.go(opt.url || opt);
    }
    this.to = function(opt) {
        Router.to(opt.url || opt);
    }
    this.back = function(i) {
        Router.back(i);
    }
    this.init();
})(Zepto);