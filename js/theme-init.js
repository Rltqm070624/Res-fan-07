/* ==========================================================================
   ⭐️ 공용 테마 초기화 스크립트 — 모든 페이지 <head>에서 동일하게 사용
   - 반드시 렌더링 전에 실행돼야 깜빡임(FOUC)이 없으므로, 이 파일을
     <script src="..."> 형태로 <head> 안, CSS보다 먼저(또는 바로 뒤) 넣어주세요.
     (async/defer 절대 붙이지 말 것 — 동기 실행이어야 깜빡임이 없습니다)
   ========================================================================== */
(function () {
    var savedTheme = localStorage.getItem('rescene-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // 언어 속성도 같이 세팅 (lang 스위처가 없는 페이지에서도 <html lang="">은 맞춰줌)
    var savedLang = localStorage.getItem('rescene-lang') || 'ko';
    document.documentElement.setAttribute('lang', savedLang);

    // 루트 주소 웰컴 스플래시 (index.html 전용 — 다른 페이지에는 해당 요소가 없어 조용히 무시됨)
    // 주의: "index.html이 아니면 전부 켠다"가 아니라 "루트 경로(/)일 때만" 켜야 함.
    // 안 그러면 chart.html, goods.html 등 다른 페이지에서도 스크롤이 잠겨버림.
    try {
        var path = window.location.pathname;
        var isRootPath = /\/$/.test(path);
        var alreadySeen = sessionStorage.getItem('rescene-landing-seen') === '1';
        if (isRootPath && !alreadySeen) {
            document.documentElement.classList.add('show-landing');
        }
    } catch (e) {}
})();
