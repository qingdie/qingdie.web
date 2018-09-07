app = new(function() {
    window.addEventListener('routerInited', function(r) {
        console.log('渲染完成', new Date().getTime() - api.config.stStamp);
    }, false);
})();