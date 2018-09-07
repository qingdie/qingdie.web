/*
 * @Author: xueping 
 * @Date: 2018-07-13 22:59:34 
 * @Last Modified by: xueping
 * @Last Modified time: 2018-08-23 13:12:22
 * @blog:http://qingdie.me 
 */
window.Router = new(function($) {
    var self = this;
    var $view = $('body');
    var isprocess = false;
    var switpagetime = 0;
    var currpage = null;
    var previousUrl = '';
    var htmlCache = {};
    var allscripts = [];
    var slidingBack = { time: 0, back: false };
    var animPageClasses = [
        'page-from-center-to-left',
        'page-from-center-to-right',
        'page-from-right-to-center',
        'page-from-left-to-center'
    ].join(' ');
    var EVENTS = {
        oninitPage: '',
        onanmterEnd: '',
        pageChange: 'pageChange',
        pagePush: 'pagePush',
        pageLoadStart: 'pageLoadStart',
        pageLoadComplete: 'pageLoadComplete',
        routerInited: 'routerInited'
    };
    var config = {
        version: api && api.config && api.config.version || new Date().getTime(),
        pageclass: '.page'
    };
    var pageCache = {};
    var _history = window.history;
    window.history.replace = function(url, nopush) {
        url = url.split('#')[0];
        console.log('replace', url, window.location.href);
        if (!currpage) {
            _history.replaceState({ url: url, id: Date.now(), pagePush: 1 }, '', url);
            return;
        }!nopush && EVENTS.onpagePush && EVENTS.onpagePush(url);
        delete pageCache[window.location.href];
        _history.replaceState({ url: url, id: currpage.id, pagePush: 1 }, '', url);
        pageCache[url] = currpage;
        sessionStorage.setItem(url, currpage.id);
        currpage.pagePush = nopush ? 0 : 1;
    };
    window.history.push = function(url) {
        console.log('push', url, window.location.href);
        currpage.pagePush = (currpage.pagePush || 1) + 1;
        if (window.location.href == url) {
            url = url.split('#')[0];
            _history.replaceState({ url: url, id: currpage.id, pagePush: currpage.pagePush }, '', url);
        } else {
            url = url.split('#')[0];
            pageCache[url] = currpage;
            EVENTS.onpagePush && EVENTS.onpagePush(url);
            _history.pushState({ url: url, pagePush: currpage.pagePush }, '', url);
        }
    };
    var _init = function() {
        currpage = {
            url: window.location.href.split('#')[0],
            id: _getPageId(window.location.href),
            view: $(config.pageclass)
        };
        _history.replaceState({ url: window.location.href.split('#')[0], id: currpage.id }, '', window.location.href.split('#')[0]);
        window.addEventListener('popstate', _onPopState.bind(self));
        currpage = _addpageCache(window.location.href, currpage, function(cb) {
            _dispatch(EVENTS.routerInited, currpage);
            _ajaxPageCache();
            cb && cb();
            EVENTS.onanmterEnd && EVENTS.onanmterEnd(window.location.href, currpage, false, 'go');
            _dispatch(EVENTS.pageChange, window.location.href);
        });
        if (/(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent)) {
            var wd = $(window).width();
            slidingBack.start = parseInt(wd * 0.096);
            window.addEventListener('touchstart', function(e) {
                slidingBack.back = e.touches[0].pageY > 100 && e.touches[0].pageX < slidingBack.start;
            }, false);
            window.addEventListener('touchend', function(e) {
                slidingBack.time = new Date().getTime();
            }, false);
        }
        var ejs = $('script');
        for (var i = 0; i < ejs.length; i++) {
            ejs[i].src && allscripts.push(ejs[i].src);
        }
    }
    var _getPageId = function(url) {
        try {
            var id = sessionStorage.getItem(url) || new Date().getTime();
            sessionStorage.setItem(url, id);
            return id;
        } catch (error) {
            return new Date().getTime();
        }
    }
    var _eventinit = function() {
        if (!window.CustomEvent) {
            window.CustomEvent = function(type, config) {
                config = config || {
                    bubbles: false,
                    cancelable: false,
                    detail: undefined
                };
                var e = document.createEvent('CustomEvent');
                e.initCustomEvent(type, config.bubbles, config.cancelable, config.detail);
                return e;
            };
            window.CustomEvent.prototype = window.Event.prototype;
        }

        function __dealCssEvent(eventNameArr, callback) {
            var events = eventNameArr,
                i, dom = this;

            function fireCallBack(e) {
                if (e.target !== this) return;
                callback.call(this, e);
                for (i = 0; i < events.length; i++) {
                    dom.off(events[i], fireCallBack);
                }
            }
            if (callback) {
                for (i = 0; i < events.length; i++) {
                    dom.on(events[i], fireCallBack);
                }
            }
        }
        $.fn.animationEnd = function(callback) {
            var isend = true;
            var anobj = setTimeout(function() {
                isend && (isend = false, callback());
            }, 1200);
            __dealCssEvent.call(this, ['webkitAnimationEnd', 'animationend'], function() {
                clearTimeout(anobj);
                isend && (isend = false, callback());
            });
            return this;
        };
        $.fn.transitionEnd = function(callback) {
            __dealCssEvent.call(this, ['webkitTransitionEnd', 'transitionend'], callback);
            return this;
        };
    }
    var _dispatch = window.dispatch = function(event, detail) {
        var e = new CustomEvent(event, {
            bubbles: true,
            detail: detail,
            cancelable: true
        });
        window.dispatchEvent(e);
    }
    var _onPopState = function(event) {
        var state = event.state || event;
        console.log('_onPopState', state);
        if (!state || !state.url || state.url.split('#')[0] == currpage.url) {
            return;
        }
        if (state.pagePush && currpage.pagePush) {
            _dispatch(EVENTS.pagePush, state);
            return;
        }
        if (isprocess) {
            setTimeout(function() {
                _onPopState(state);
            }, 200);
            return;
        }
        state.id < currpage.id ? _back(state.url, state.id) : _forward(state.url, state.id);
    }
    var _addpageCache = function(url, page, cb) {
        pageCache[url] = page;
        if (EVENTS.oninitPage) {
            var iscb = true;
            console.log('_addpageCache', url);
            var timgobj = setTimeout(function() {
                console.log('_addpageCache.timgobj', url);
                iscb && (iscb = false, isprocess = false, delete pageCache[url], _dispatch(EVENTS.pageLoadComplete, { msg: '页面onload超时', url: url }));
            }, 5000);
            EVENTS.oninitPage(url, page, function() {
                console.log('_addpageCache.cb', url);
                clearTimeout(timgobj);
                iscb && (iscb = false, cb.call(self));
            })
        } else {
            cb();
        }
        return page;
    }
   
    var _getAbsoluteUrl = function(url) {
        var link = document.createElement('a');
        link.setAttribute('href', url);
        var absoluteUrl = link.href;
        link = null;
        return absoluteUrl.split('#')[0];
    }
    var _animateView = function($to, direction, cb) {
        console.log('animateView', direction);
        if (direction == 'back' && slidingBack.back && new Date().getTime() - slidingBack.time < 500) {
            $from.remove();
            cb && cb.call(self);
            console.log('取消动画');
            return;
        }
        $from = currpage.view;
        var escroll = $from.find('.scroll-auto');
        for (var i = 0; i < escroll.length; i++) {
            escroll[i].dataset.stop = escroll[i].scrollTop
        }
        $from.hasClass('scroll-auto') && ($from[0].dataset.stop = $from[0].scrollTop);

        escroll = $to.find('.scroll-auto');
        for (var i = 0; i < escroll.length; i++) {
            escroll[i].scrollTop = escroll[i].dataset.stop || 0;
        }
        $to.hasClass('scroll-auto') && ($to[0].scrollTop = $to[0].dataset.stop || 0);
        console.log('animateView Start', Date.now());
        if (direction == 'back') {
            $from.removeClass(animPageClasses).addClass('page-from-center-to-right');
            $to.removeClass(animPageClasses).addClass('page-from-left-to-center');
        } else {
            $from.removeClass(animPageClasses).addClass('page-from-center-to-left');
            $to.removeClass(animPageClasses).addClass('page-from-right-to-center');
        }
        var anum = 0;
        $from.animationEnd(function() {
            console.log('animateView end from', anum);
            ++anum == 2 && ($from.remove(), cb && cb.call(self));
            $from.removeClass(animPageClasses);
        });
        $to.animationEnd(function() {
            console.log('animateView end to', anum);
            ++anum == 2 && ($from.remove(), cb && cb.call(self));
            $to.removeClass(animPageClasses);
        });
    }
    var _animatePage = function(url, page, iscache, direction, callback) {
        console.log('animatePage', iscache);
        if (iscache) {
            _animateView(page.view, direction, function() {
                callback.call(self);
            });
        } else {
            _addpageCache(url, page, function(cb) {
                _animateView(page.view, direction, function() {
                    cb && cb.call(self);
                    callback.call(self);
                });
            })
        }
    }
    var _switchToPage = function(url, page, iscache, direction, cb) {
        console.log('页面切换', url, iscache, direction);
        $view.prepend(page.view);
        _animatePage(url, page, iscache, direction, function() {
            console.log('animatePage End', url);
            _historyState(url, page.id, direction);
            currpage = page;
            cb && cb.call(self);
            EVENTS.onanmterEnd && EVENTS.onanmterEnd(url, page, iscache, direction);
            _dispatch(EVENTS.pageChange, url);
        });
    }
    var _historyState = function(url, id, direction) {
        console.log('保存状态', url, id, direction);
        if (url == window.location.href || direction == 'to') {
            _history.replaceState({ url: url, id: id || _getPageId(url) }, '', url);
        } else if (direction != 'back') {
            _history.pushState({ url: url, id: id || _getPageId(url) }, '', url);
        }
    }
   
    var _ajaxPageCache = function() {
        var el = document.createElement('script');
        el.src = '/script/html.json';
        document.body.appendChild(el);
    }
    var _ajaxPage = function(url, cb) {
        console.log('ajax加载页面', url);
        url = url.split('?')[0].split('#')[0];
        if (url.lastIndexOf('.html') != url.length - 5 && url.lastIndexOf('/') != url.length - 1) {
            url += '.html';
        }
        var pathname = url.replace(window.location.origin, '');
        if (htmlCache[pathname]) {
            cb.call(self, $('<html></html>').append(htmlCache[pathname]));
            return;
        }
        _dispatch(EVENTS.pageLoadStart);
        $.ajax({
            url: url + '?v=' + config.version,
            success: function(data) {
                _dispatch(EVENTS.pageLoadComplete);
                var $doc = $('<html></html>').append(data);
                var $innerView = $doc.find(config.pageclass);
                $doc = $('<html></html>').append($innerView);
                htmlCache[url] = $doc.html();
                cb.call(self, $doc);
            },
            error: function(xhr) {
                isprocess = false;
                _dispatch(EVENTS.pageLoadComplete, xhr.status == 200 ? '' : xhr.response);
                console.log(xhr);
            }
        });
    }
    var _getView = function($html) {
        var page = $html.find(config.pageclass).eq(0);
        if (page.length == 0) {
            isprocess = false;
            throw new Error('missing router view mark: ' + config.pageclass);
        }
        var scripts = $html.find('script');
        for (var i = 0; i < scripts.length; i++) {
            if (scripts[i].src) {
                if (allscripts.indexOf(scripts[i].src) == -1) {
                    var el = document.createElement('script');
                    el.src = scripts[i].src;
                    document.body.appendChild(el);
                    allscripts.push(scripts[i].src);
                }
            }
        }
        return page;
    }
    var _load = function(url, id, direction, cb) {
        console.log('加载页面：', url, id, direction);
        switpagetime = new Date().getTime();
        var page = pageCache[url];
        if (page) {
            _switchToPage(url, page, true, direction, cb);
        } else {
            _ajaxPage(url, function($html) {
                _switchToPage(url, { view: _getView($html), id: id || _getPageId(url), url: url }, false, direction, cb);
            });
        }
    }
    var _back = function(url, id) {
        isprocess = true;
        _load(url, id, 'back', function() {
            console.log('页面返回结束：', url);
            isprocess = false;
        });
    }
    var _forward = function(url, id, direction) {
        if (previousUrl == url && url != window.location.href.split('#')[0]) {
            return self.back();
        }
        isprocess = true;
        previousUrl = window.location.href.split('#')[0];
        _load(url, id, direction || 'go', function() {
            console.log('页面前进结束：', url);
            isprocess = false;
        });
    }
    this.urlparam = function(url) {
        url = url || window.location.search;
        if (url.indexOf('?') === -1) return {};
        url = url.substring(url.indexOf('?') + 1, url.length);
        var urldata = {};
        var arr = url.split('&');
        for (var i = 0; i < arr.length; i++) {
            var parr = arr[i].split('=');
            parr[0] && (urldata[parr[0]] = parr[1]);
        }
        return urldata;
    }
    this.setPageCache = function(html) {
        htmlCache = html;
    }
    this.on = function(name, evt) {
        EVENTS[name] = evt;
    }
    this.go = function(url, direction) {
        if (new Date().getTime() - switpagetime < 200 || isprocess) return;
        url = _getAbsoluteUrl(url);
        if (url == window.location.href.split('#')[0]) return;
        _forward(url, 0, direction || 'go');
    }
    this.to = function() {
        this.go(url, 'to');
    }
    this.forward = function() {
        _history.forward();
    }
    this.back = function(i) {
        i = i || currpage.pagePush || 0;
        i ? _history.go(-Math.abs(i)) : _history.back();
    }
    _eventinit();
    $(_init);
})(Zepto)