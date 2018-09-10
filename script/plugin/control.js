window.control = new(function($) {
    var pageCache = {};
    var rules = {
        jstoken: /((['"])(?:(?!\2|\\).|\\(?:\r\n|[\s\S]))*(\2)?|`(?:[^`\\$]|\\[\s\S]|\$(?!\{)|\$\{(?:[^{}]|\{[^}]*\}?)*\}?)*(`)?)|(\/\/.*)|(\/\*(?:[^*]|\*(?!\/))*(\*\/)?)|(\/(?!\*)(?:\[(?:(?![\]\\]).|\\.)*\]|(?![\/\]\\]).|\\.)+\/(?:(?!\s*(?:\b|[\u0080-\uFFFF$\\'"~({]|[+\-!](?!=)|\.?\d))|[gmiyu]{1,5}\b(?![\u0080-\uFFFF$\\]|\s*(?:[+\-*%&|^<>!=?({]|\/(?![\/*])))))|(0[xX][\da-fA-F]+|0[oO][0-7]+|0[bB][01]+|(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?)|((?!\d)(?:(?!\s)[$\w\u0080-\uFFFF]|\\u[\da-fA-F]{4}|\\u\{[\da-fA-F]+\})+)|(--|\+\+|&&|\|\||=>|\.{3}|(?:[+\-\/%&|^]|\*{1,2}|<{1,2}|>{1,3}|!=?|={1,2})=?|[?~.,:;[\](){}])|(\s+)|(^$|[\s\S])/g,
        keys: /{{([\w\W]*?)}}/g,
        key: /{{([\w\W]*?)}}/,
        keywords: /\.|if|each/,
        exp: /<(.*)>/,
        text: /\{\{(.*)\}\}/,
        eachif: /\{\{(each|if)(.*)\}\}/
    }
    var _init = function() {
        Router.on('oninitPage', _oninitPage);
        Router.on('onanmterEnd', _onanmterEnd);
        Router.on('onpagePush', _onpagePush);
        $(document).on('tap', '[bindtap^=e]', function(e, e1) {
            e1.preventDefault();
            var app = pageCache[window.location.href].app;
            var evt = app && app[this.attributes['bindtap'].value];
            evt && evt.call(app, this);
            return false;
        });
        $(document).on('tap', 'a,.link', function(e, e1) {
            var $target = $(e.currentTarget);
            var url = $target.attr('url');
            if (url) {
                e1.preventDefault();
                Router.go(url);
                return false;
            }
            return true;
        });
    }
    var _onpagePush = function(url) {
        pageCache[url] = pageCache[window.location.href];
    }
    var _oninitPage = function(url, page, cb) {
        console.log('oninitPage', url);
        pageCache[url] = page;
        page.app = _getApp(url) || {};
        var app = page.app;
        app.data = app.data || {};
        _viewcompile(page);
        _oninitPageEvent(url, page, function() {
            cb && cb.call(Router);
        });
        page.view.addClass('show');
    }
    var _oninitPageEvent = function(url, page, cb) {
        var app = page.app;
        console.log('oninitPageEvent', url);
        if (app.onLoad) {
            if (app.onLoad.length == 2) {
                app.onLoad.call(app, Router.urlparam(url), cb);
                return;
            } else {
                app.onLoad.call(app, Router.urlparam(url));
            }
        }
        cb();
    }
    var _onanmterEnd = function(url, page) {
        page.app && page.app.onShow && page.app.onShow.call(page.app, Router.urlparam(url));
    }
    var _viewcompile = function(page) {
        page.app.data._reactive = {};
        _compileElement(page.view[0], page.app.data);
        page.app.setData = function(data) {
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    page.app.data[key] = data[key];
                }
            }
        };
    }
    var _compileElement = function(el, data) {
        var childs = el.childNodes.length;
        for (var i = 0; i < el.childNodes.length; i++) {
            var node = el.childNodes[i];
            if (_isElementNode(node)) {
                _compileNode(node, data);
                if (childs == el.childNodes.length + 1) {
                    i--;
                    childs--;
                }
            }
            if (_isTextNode(node) && rules.text.test(node.textContent)) {
                rules.exp.test(node.textContent) ? _compileExpression(node, data, node.textContent) : _compileText(node, data, node.textContent);
            } else if (_isTextNode(node.childNodes[0])&&rules.eachif.test(node.childNodes[0].textContent)) {
                _compileExpression(node, data, node.innerHTML);
            } else if (node.nodeName == "SCRIPT" && node.attributes['type'] && node.attributes['type'].value == 'text/html' && rules.text.test(node.textContent)) {
                _compileExpression(node.parentNode, data, node.textContent)
            } else if (node.childNodes.length) {
                _compileElement(node, data);
            }
        }
    }
    var _matchToToken = function(match) {
        var token = { type: "invalid", value: match[0] }
        if (match[1]) token.type = "string", token.closed = !!(match[3] || match[4])
        else if (match[5]) token.type = "comment"
        else if (match[6]) token.type = "comment", token.closed = !!match[7]
        else if (match[8]) token.type = "regex"
        else if (match[9]) token.type = "number"
        else if (match[10]) token.type = "name"
        else if (match[11]) token.type = "punctuator"
        else if (match[12]) token.type = "whitespace"
        return token
    }
    var _filterToken = function(tokens, keys, keyno) {
        for (var i = 0; i < tokens.length; i++) {
            if (tokens[i].type == 'name' && keyno.indexOf(tokens[i].value) == -1) {
                if ((tokens[i - 4] && tokens[i - 4].value == 'each')) {
                    keyno.push(tokens[i].value);
                } else if (keys.indexOf(tokens[i].value) == -1 && !rules.keywords.test(tokens[i].value) && (!tokens[i - 1] || tokens[i - 1].value != '.')) {
                    keys.push(tokens[i].value);
                }
            }
        }
    }
    var _getDatakey = function(exp) {
        var exps = exp.match(rules.keys);
        var keys = [],
            keyno = [];
        Array.prototype.forEach.call(exps, function(exp) {
            var tokens = exp.match(rules.key)[1].match(rules.jstoken).map(function(value) {
                rules.jstoken.lastIndex = 0;
                return _matchToToken(rules.jstoken.exec(value));
            });
            _filterToken(tokens, keys, keyno)
        })
        return keys;
    }
    var _watcherNode = function(data, exp, cb) {
        var render = template.compile(exp);
        var notify = function() {
            try {
                cb(render(data));
            } catch (error) {
                console.error(error);
            }
        }
        var keys = _getDatakey(exp);
        keys.map(function(key) {
            if (data._reactive[key]) {
                data._reactive[key].cbs.push(notify);
            } else {
                _defineReactive(data, key, data[key], notify);
            }
        });
        notify();
        return render;
    }
    var _defineReactive = function(data, key, val, cb) {
        var reactive = data._reactive[key] = data._reactive[key] || {};
        reactive.value = val;
        reactive.cbs = reactive.cbs || [];
        reactive.cbs.push(cb);
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false,
            get: function() {
                return reactive.value;
            },
            set: function(value) {
                if (reactive.value === value) return;
                reactive.value = value;
                reactive.cbs.map(function(rcb) {
                    rcb();
                });
            }
        });
    }
    var _compileExpression = function(node, data, exp) {
        node.render = _watcherNode(data, exp, function(html) {
            node.innerHTML = html;
        });
    }
    var _compileText = function(node, data, exp) {
        node.render = _watcherNode(data, exp, function(text) {
            node.textContent = text;
        });
    }
    var _compileAtt = function(node, data, attr) {
        _watcherNode(data, attr.value, function(text) {
            attr.value = text;
        });
    }
    var _compileModel = function(node, data, exp) {
        exp = rules.text.test(exp) ? exp.substring(2, exp.length - 2) : exp;
        node.addEventListener('input', function(e) {
            data[exp] = e.target.value;
        });
        node.render = _watcherNode(data, '{{' + exp + '}}', function(text) {
            node.value = text;
        });
    }
    var _compilevt = function(node, data, attr) {
        var name = attr.name.substring(3);
        _watcherNode(data, attr.value, function(text) {
            text ? node.setAttribute(name, text) : node.removeAttribute(name);
        });
    }
    var _compileif = function(node, data, attr) {
        var pnode = node.parentNode;
        var nnode = node.nextSibling;
        _watcherNode(data, attr.value, function(text) {
            !text || /^(false|0|null|underfind)$/.test(text) ? node.parentNode && pnode.removeChild(node) : nnode ? pnode.insertBefore(node, nnode) : pnode.appendChild(node);
        });
    }
    var _compileshow = function(node, data, attr) {
        node.style.display = 'none';
        _watcherNode(data, attr.value, function(text) {
            node.style.display = !text || /^(false|0|null|underfind)$/.test(text) ? 'none' : '';
        });
    }
    var _compilewx = function(node, data, attr) {
        switch (attr.name) {
            case 'wx:model':
                _compileModel(node, data, attr.value);
                break;
            case 'wx:if':
                rules.text.test(attr.value) && _compileif(node, data, attr);
                break;
            case 'wx:show':
                rules.text.test(attr.value) && _compileshow(node, data, attr);
                break;
            default:
                rules.text.test(attr.value) && _compilevt(node, data, attr);
        }
    }
    var _compileNode = function(node, data) {
        var nodeAttrs = node.attributes;
        for (var i = 0; i < nodeAttrs.length; i++) {
            var attr = nodeAttrs[i];
            if (!attr.value) continue;
            if (attr.name.indexOf('wx:') == 0) {
                node.removeAttribute(attr.name);
                i--;
                _compilewx(node, data, attr);
            } else if (rules.text.test(attr.value)) {
                _compileAtt(node, data, attr);
            }
        }
    }
    var _isElementNode = function(node) {
        return node && node.nodeType == 1;
    }
    var _isTextNode = function(node) {
        return node && node.nodeType == 3;
    }
    var _getApp = function(url) {
        try {
            url = url.replace(window.location.origin, '');
            url = url.split('/');
            url[url.length - 1] = url[url.length - 1].split('?')[0].split('#')[0].split('.')[0];
            url = (url[url.length - 2] || 'home') + (url[url.length - 1] || 'index');
            var app = (new Function("return new " + url + '()'))();
            return app;
        } catch (error) {
            console.warn(error);
            return null;
        }

    }
    this.injection = function(app) {
        app.data = app.data || {};
        var page = pageCache[window.location.href];
        for (var key in app.data) {
            if (object.hasOwnProperty(key)) {
                page.app.data = app.data[key]
            }
        }
        app.data = page.app.data;
        app.setData = page.app.setData;
        page.app = app;
        return app;
    }
    _init();
})(Zepto);