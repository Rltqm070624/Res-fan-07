/* ==========================================================================
   RESCENE ARCHIVE - 다국어 자동 번역 엔진 (Google Translate 연동)
   ========================================================================== */
(function () {
    'use strict';

    var LANGS = ['ko', 'en', 'ja'];
    var LABELS = { ko: 'KOR', en: 'ENG', ja: '日本語' };
    var current = localStorage.getItem('rescene-lang') || 'ko';
    if (LANGS.indexOf(current) === -1) current = 'ko';

    // 1. 구글 자동 번역기 초기화 세팅
    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({
            pageLanguage: 'ko',
            includedLanguages: 'ko,en,ja',
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
        }, 'google_translate_element');
    };

    // 2. 구글 번역 스크립트 동적 로드
    var gtScript = document.createElement('script');
    gtScript.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.head.appendChild(gtScript);

    // 3. 번역기가 작동할 투명 컨테이너 생성
    window.addEventListener('DOMContentLoaded', function() {
        if (!document.getElementById('google_translate_element')) {
            var gtDiv = document.createElement('div');
            gtDiv.id = 'google_translate_element';
            gtDiv.style.display = 'none'; // 화면에 구글 마크 안 보이게 숨김
            document.body.appendChild(gtDiv);
        }
        updateButtons();
    });

    // 버튼 활성화 UI 업데이트
    function updateButtons() {
        document.querySelectorAll('.lang-switcher button').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-lang') === current);
        });
    }

    // 4. 언어 변경 시 구글 번역 쿠키를 굽고 페이지 새로고침하여 즉시 자동 번역 적용
    window.setLang = function (lang) {
        if (LANGS.indexOf(lang) === -1 || lang === current) return;
        
        current = lang;
        localStorage.setItem('rescene-lang', lang);
        document.documentElement.setAttribute('lang', lang);
        
        // 구글 번역 쿠키 설정 (/ko/en 이면 영어로 번역, /ko/ko 이면 원본 유지)
        var gtLang = (lang === 'ko') ? 'ko' : lang; 
        document.cookie = "googtrans=/ko/" + gtLang + "; path=/; domain=" + window.location.hostname;
        document.cookie = "googtrans=/ko/" + gtLang + "; path=/;";
        
        // 새로고침 시 번역기가 전체 페이지 텍스트를 스캔하여 자동 번역함
        window.location.reload();
    };

    // 혹시 모를 에러를 대비한 빈 함수 (이전 코드 호환성 유지)
    window.t = function () { return ''; };
    window.tDate = function (y, m, d) { return ''; };
    window.getLang = function () { return current; };

    // 언어 스위처 UI 그리기
    function buildSwitcher() {
        if (document.querySelector('.lang-switcher')) return;
        var box = document.createElement('div');
        box.className = 'lang-switcher'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Language');
        LANGS.forEach(function (lang) {
            var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-lang', lang); b.textContent = LABELS[lang];
            b.addEventListener('click', function () { window.setLang(lang); });
            box.appendChild(b);
        });
        document.body.appendChild(box);
    }

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', buildSwitcher); } 
    else { buildSwitcher(); updateButtons(); }
})();
