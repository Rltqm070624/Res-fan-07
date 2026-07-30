(function () {
    var savedTheme = localStorage.getItem('rescene-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    var savedLang = localStorage.getItem('rescene-lang') || 'ko';
    document.documentElement.setAttribute('lang', savedLang);

    try {
        var path = window.location.pathname;
        var isRootPath = /\/$/.test(path);
        if (isRootPath) {
            document.documentElement.classList.add('show-landing');
        }
    } catch (e) {}
})();
