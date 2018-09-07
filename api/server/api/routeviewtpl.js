const root = __dirname.substring(0, __dirname.length - 15);
const template = require('art-template');
const jsdom = require("jsdom");
template.defaults.root = root + (global.env == 'prod' ? '\\dist' : '');
template.defaults.debug = true;
template.defaults.bail = true;
template.defaults.cache = true;
template.defaults.minimize = true;
template.defaults.rules.unshift({
    test: /<script type=("|')text\/html("|')[^>]*>([\w\W]*?)<\/script>/,
    use: function(match) {
        return {
            output: 'raw',
            code: JSON.stringify(match + '')
        }
    }
});
template.defaults.extname = ".html";
template.defaults.minimize = true;
template.defaults.htmlMinifierOptions = {
    collapseWhitespace: true,
    removeComments: true,
    collapseBooleanAttributes: true,
    removeAttributeQuotes: false,
    processScripts: ['text/html'],
    minifyCSS: true,
    minifyJS: true,
    ignoreCustomFragments: []
};

function pagefilter(html) {
    var ret = html.match(/<body[^>]*>([\w\W]*?)<\/body>/);
    const dom = new jsdom.JSDOM(ret && ret[0] || html);
    const doc = dom.window.document;
    var c = doc.querySelector(".page");
    if(!c)throw("页面没有 .page 类");
    var view = c.outerHTML;
    if (ret && ret[0]) {
        html = html.replace(ret[0], doc.body.outerHTML.replace(view, '<page></page>'));
    } else {
        html = doc.documentElement.outerHTML.replace(view, '<page></page>');
    }
    return { html: html, view: view };
}
module.exports = function(viewurl) {
    var html = template.defaults.loader(template.defaults.resolveFilename(viewurl, template.defaults), template.defaults);
    if (html.indexOf('<body>') == -1) {
        var blocks = html.match(/{{block [^>]*}}([\w\W]*?){{\/block}}/g);
        var content = html;
        var view = '';
        var footer = "";
        for (var i = 0; blocks && i < blocks.length; i++) {
            if (blocks[i].indexOf("{{block 'footer'}}") > -1) {
                footer = blocks[i];
            } else {
                view += blocks[i];
            }
            content = content.replace(blocks[i], '');
        }
        view+=footer;
        html = "{{extend '" + (viewurl.indexOf('pages/') == -1 ? 'pages/' : '../') + "share/layout.html'}}" + view + "{{block 'content'}}" + content + "{{/block}}";
    }
    var page = pagefilter(html);
    html = template.render(page.html, {}, {
        filename: viewurl
    });
    return html.replace('<page></page>', page.view);
};