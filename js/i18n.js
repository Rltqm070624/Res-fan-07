/* ==========================================================================
   RESCENE ARCHIVE - 다국어 자동 번역 엔진 (새로고침 없음)
   ========================================================================== */
(function () {
    'use strict';

    var LANGS = ['ko', 'en', 'ja'];
    var LABELS = { ko: 'KOR', en: 'ENG', ja: '日本語' };
    var current = localStorage.getItem('rescene-lang') || 'ko';
    if (LANGS.indexOf(current) === -1) current = 'ko';

    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({
            pageLanguage: 'ko',
            includedLanguages: 'ko,en,ja',
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
        }, 'google_translate_element');
    };

    var gtScript = document.createElement('script');
    gtScript.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.head.appendChild(gtScript);

    window.addEventListener('DOMContentLoaded', function() {
        if (!document.getElementById('google_translate_element')) {
            var gtDiv = document.createElement('div');
            gtDiv.id = 'google_translate_element';
            gtDiv.style.display = 'none'; 
            document.body.appendChild(gtDiv);
        }
        updateButtons();
    });

    function updateButtons() {
        document.querySelectorAll('.lang-switcher button').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-lang') === current);
        });
    }

    // ⭐️ 새로고침 없이 구글 번역기의 숨겨진 셀렉트 박스를 강제로 변경하는 로직
    window.setLang = function (lang) {
        if (LANGS.indexOf(lang) === -1 || lang === current) return;
        
        current = lang;
        localStorage.setItem('rescene-lang', lang);
        document.documentElement.setAttribute('lang', lang);
        updateButtons();

        var selectEl = document.querySelector('.goog-te-combo');
        if (selectEl) {
            selectEl.value = lang;
            selectEl.dispatchEvent(new Event('change')); // 변경 이벤트 강제 발생
        } else {
            // 번역기가 미처 로드되기 전 클릭했을 때의 예외 처리 (이때만 쿠키굽고 새로고침)
            var gtLang = (lang === 'ko') ? 'ko' : lang; 
            document.cookie = "googtrans=/ko/" + gtLang + "; path=/; domain=" + window.location.hostname;
            document.cookie = "googtrans=/ko/" + gtLang + "; path=/;";
            window.location.reload();
        }
    };

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
