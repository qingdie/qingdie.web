var jscss = require('./build/index');
var config = require('./config');
jscss.env = process.argv[2] || 'prod';
(async () => {
    jscss.del('');
    require('fs').mkdirSync(jscss.outroot);
    jscss.cdnhost = config.build.cdnhost;
    jscss.purify = config.build.css.purify;
    await jscss.js('/script', config.build.js);
    await jscss.html();
    await jscss.css('/css', config.build.css);
    for (let i = 0; i < config.build.copyddir.length; i++) {
        await jscss.copyddir(config.build.copyddir[i]);
    }
    console.log('压缩完成！');
})();