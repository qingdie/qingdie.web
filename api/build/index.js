module.exports = new(function() {
    const crypto = require('crypto');
    const CleanCss = require('clean-css');
    const uglifyJs = require("uglify-js");
    // const purify = require("purify-css");
    const minify = require('html-minifier').minify;
    const fs = require('fs');
    const tpl = require('../server/api/routeviewtpl');
    var self = this;
    this.env = 'prod';
    this.root = __dirname.substring(0, __dirname.length - 10);
    this.root = this.root.indexOf('/') == 0 ? this.root : this.root.substring(2).replace(/\\/g, '/');
    this.inroot = this.root;
    this.outroot = this.root + '/dist';
    this.cdnhost = '';
    this.jsname = '/app.js';
    this.cssname = '/app.css';
    this.version = new Date().getTime();
    this.addver = true;
    this.jsreplace = ['debug:!0,version:"1.0.0"', 'debug:0,version:' + this.version];
    this.htmlCache = [];
    this.htmltxt = '';
    this.js = async (path, opt) => {
        var jss = await this.getjs(path, opt);
        var code = "";
        for (var j = 0; j < jss.length; j++) {
            console.log(jss[j]);
            if (this.env == 'prod') {
                var result = uglifyJs.minify([this.inroot + jss[j]], {
                    compress: {
                        drop_console: true
                    }
                });
                if (result.error) {
                    console.log('js压缩失败！', result.error);
                } else {
                    code += result.code;
                }
            } else {
                code += "\r\n" + fs.readFileSync(this.inroot + jss[j]);
            }
        }
        if (!fs.existsSync(self.outroot + path)) {
            fs.mkdirSync(self.outroot + path);
        }
        for (var i = 0; i < this.jsreplace.length; i += 2) {
            code = code.replace(this.jsreplace[i], this.jsreplace[i + 1]);
        }
        self.cdnhost && this.env == 'prod' && (code = code.replace('/script/html.json', self.cdnhost + '/script/html.json' + '?i=' + this.version));
        if (this.env == 'dev') {
            code += `\r\ndocument.write('<script src="/script/plugin/vconsole.min.js"></script>')`;
        }
        fs.writeFileSync(self.outroot + path + self.jsname, code, 'utf8');
    };
    this.getjs = async (path, opt) => {
        opt = this.jsoptcheck(path, opt);
        var jss = await this.getjsfiles([], path, opt);
        jss.sort(function(a, b) {
            a = opt.sort.indexOf(a);
            b = opt.sort.indexOf(b);
            return a > -1 && b > -1 ? a - b : b - a;
        });
        return jss;
    };
    this.md5 = async (file) => {
        var rs = fs.createReadStream(file);
        var hash = crypto.createHash('md5');
        rs.on('data', hash.update.bind(hash));
        return new Promise(function(cb) {
            rs.on('end', function() {
                cb(hash.digest('hex'));
            });
        });
    };
    this.jsoptcheck = function(path, opt) {
        opt.copy = opt.copy || [];
        opt.not = opt.not || [];
        opt.sort = opt.sort || [];
        if (opt.sort[0].indexOf(path) == 0) return opt;
        var i;
        for (i = 0; i < opt.copy.length; i++) {
            opt.copy[i] = path + opt.copy[i];
        }
        for (i = 0; i < opt.not.length; i++) {
            opt.not[i] = path + opt.not[i];
        }
        for (i = 0; i < opt.sort.length; i++) {
            opt.sort[i] = path + opt.sort[i];
        }
        return opt;
    };
    this.getjsfiles = async (jss, path, opt) => {
        var dirs = fs.readdirSync(this.inroot + path);
        for (var d in dirs) {
            if (dirs.hasOwnProperty(d)) {
                var fname = path + '/' + dirs[d];
                var stat = fs.lstatSync(this.inroot + fname);
                if (stat.isDirectory() == true) {
                    if (opt.copy.indexOf(fname) > -1) {
                        await this.copyddir(fname);
                    } else {
                        await this.getjsfiles(jss, fname, opt);
                    }
                } else {
                    if (opt.copy.indexOf(fname) > -1) {
                        await this.copyfile(path, fname);
                    } else if (opt.not.indexOf(fname) == -1) {
                        jss.push(fname);
                    }
                }
            }
        }
        return jss;
    };
    this.copyddir = async (path) => {
        if (fs.existsSync(this.inroot + path)) {
            this.checkoutddir(path);
            var dirs = fs.readdirSync(this.inroot + path);
            for (var d in dirs) {
                if (dirs.hasOwnProperty(d)) {
                    var fname = path + '/' + dirs[d];
                    var stat = fs.lstatSync(this.inroot + fname);
                    if (stat.isDirectory() == true) {
                        this.copyddir(fname);
                    } else {
                        fs.writeFileSync(this.outroot + fname, fs.readFileSync(this.inroot + fname));
                    }
                }
            }
        }
    };
    this.copyfile = async (path, fname) => {
        console.log(fname);
        this.checkoutddir(path);
        fs.writeFileSync(this.outroot + fname, fs.readFileSync(this.inroot + fname));
    };
    this.checkoutddir = function(path) {
        var paths = path.split('/');
        path = '';
        for (var i = 0; i < paths.length; i++) {
            if (paths[i]) {
                path += '/' + paths[i];
                if (!fs.existsSync(self.outroot + path)) {
                    fs.mkdirSync(self.outroot + path);
                }
            }
        }
    };
    this.css = async (path, opt) => {
        var source = await this.getcsssource(path, opt);
        var result = new CleanCss({
            rebase: false,
            inline: ['remote']
        }).minify(source);
        if (!fs.existsSync(self.outroot + path)) {
            fs.mkdirSync(self.outroot + path);
        }
        fs.writeFileSync(this.outroot + path + this.cssname, result.styles, 'utf8');
        return result.styles;
    };
    this.getcsssource = async (path, opt) => {
        console.log(path);
        var dirs = fs.readdirSync(this.inroot + path);
        var css = "";
        for (var d in dirs) {
            if (dirs.hasOwnProperty(d)) {
                var fname = path + '/' + dirs[d];
                var stat = fs.lstatSync(this.inroot + fname);
                if (stat.isDirectory() == true) {
                    css += await this.getcsssource(fname, opt);
                } else if (fname.indexOf('.css') > -1 && opt.copy.indexOf(fname) == -1) {
                    var txt = fs.readFileSync(this.inroot + fname, 'utf8');
                    var i = txt.indexOf('@import');
                    while (i > -1) {
                        txt = txt.substring(0, i) + txt.substring(txt.indexOf(')', i) + 1);
                        i = txt.indexOf('@import');
                    }
                    css += txt;
                } else {
                    await this.copyfile(path, fname);
                }
            }
        }
        return css;
    };
    this.html = async (opt) => {
        await this.htmlrootdir();
        await this.htmldir('/pages', opt || {});
        var cache = {};
        for (let index = 0; index < this.htmlCache.length; index++) {
            var body = /<body>([\w\W]*?)<\/body>/g.exec(this.htmlCache[index].html);
            self.htmltxt += body[1];
            cache[this.htmlCache[index].path.substring(this.inroot.length)] = body[1];
        };
        var js = 'window.Router.setPageCache(' + JSON.stringify(cache) + ')';
        fs.writeFileSync(self.outroot + '/script/html.json', js, 'utf8');
    };
    this.htmlrootdir = async (opt) => {
        var dirs = fs.readdirSync(this.inroot);
        for (var d in dirs) {
            if (dirs.hasOwnProperty(d)) {
                var fname = '/' + dirs[d];
                var stat = fs.lstatSync(this.inroot + fname);
                if (!stat.isDirectory() && fname.indexOf('.html') > -1) {
                    this.htmlfile(fname, opt);
                }
            }
        }
    };
    this.htmldir = async (pages, opt) => {
        var dirs = fs.readdirSync(this.inroot + pages);
        if (!fs.existsSync(self.outroot + pages)) {
            fs.mkdirSync(self.outroot + pages);
        }
        for (var d in dirs) {
            if (dirs.hasOwnProperty(d)) {
                var fname = pages + '/' + dirs[d];
                var stat = fs.lstatSync(this.inroot + fname);
                if (stat.isDirectory() == true) {
                    await this.htmldir(fname, opt);
                } else if (fname.indexOf('.html') > -1) {
                    this.htmlfile(fname, opt);
                }
            }
        }
    };
    this.htmlfile = function(name, opt) {
        console.log(name);
        var html = tpl(self.inroot + name);
        if (this.env == 'prod') {
            html = minify(html, {
                minifyCSS: true,
                minifyJS: true,
                removeComments: true,
                ignoreCustomFragments: [/{{([\w\W]*?)}}/],
                collapseBooleanAttributes: true,
                removeAttributeQuotes: false,
                processScripts: ['text/html'],
                collapseWhitespace: true
            });
        }
        self.cdnhost && this.env == 'prod' && (html = html.replace(/("|')\/(css|script|image|res)\//g, function(r) {
            return r.replace('/', self.cdnhost + '/');
        }));
        self.addver && (html = html.replace(this.cssname + '"', this.cssname + '?i=' + this.version + '"').replace(this.jsname + '"', this.jsname + '?i=' + this.version + '"'));
        fs.writeFileSync(self.outroot + name, html, 'utf8');
        name = name == '/index.html' ? '/' : name;
        self.htmlCache.push({
            path: self.inroot + name,
            html: html
        });
    };
    this.del = function(path) {
        if (fs.existsSync(this.outroot + path)) {
            var dirs = fs.readdirSync(this.outroot + path);
            for (var d in dirs) {
                if (dirs.hasOwnProperty(d)) {
                    var fname = path + '/' + dirs[d];
                    var stat = fs.lstatSync(this.outroot + fname);
                    if (stat.isDirectory() == true) {
                        this.del(fname);
                    } else {
                        fs.unlinkSync(this.outroot + fname);
                    }
                }
            }
            fs.rmdirSync(this.outroot + path);
        }
    };
    this.cssUnitReplace = function() {
        var fs = require('fs');
        var cfile = '../qingdie.singin.wxweb/css/temp.less';
        var css = fs.readFileSync(cfile) + '';
        css = css.replace(/ (-?\d+)(\.\d+)?rpx/g, function(a) {
            return ' ' + parseFloat(a.replace('rpx', '')) / 32 + 'rem';
        }).replace(/ .(-?\d+)(\.\d+)?rpx/g, function(a) {
            return ' ' + parseFloat(a.replace('rpx', '')) / 32 + 'rem';
        });
        fs.writeFileSync(cfile, css);
    };
})();