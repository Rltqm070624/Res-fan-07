/* ==========================================================================
   RESCENE ARCHIVE - 다국어(KOR / ENG / 日本語) 처리
   - </body> 바로 앞, 기존 <script> 블록보다 "뒤에" 넣어주세요.
   ========================================================================== */
(function () {
    'use strict';

    /* ----------------------------------------------------------------------
       1. UI 고정 문구 사전
       ---------------------------------------------------------------------- */
    var DICT = {
        ko: {
            followJourney: '발자취 따라가기 ➔',
            goodsDesc: '리센느의 공식 굿즈 실시간 재고 및 품절 유무를 확인하세요.',
            goodsBtn: '굿즈 스토어 바로가기 ➔',
            menuClose: '창 닫기',
            menuSkip: '영상 스킵하기',
            menuDetail: '발자취 더 확인하기',
            walkAgain: '걸어온 길을 다시 한 번 걸어 볼까요?',
            themeTitle: '테마 변경',
            calendarTitle: '캘린더',
            loading: '데이터 로딩중...',
            chartWaiting: '데이터 수집 중입니다.',
            noSchedule: '등록된 일정이 없습니다.',
            timelineSoon: '상세 연혁 타임라인 페이지 연결 준비 중입니다.',
            date: function (y, m, d) { return y + '년 ' + m + '월 ' + d + '일'; }
        },
        en: {
            followJourney: 'Follow their journey ➔',
            goodsDesc: 'Check real-time stock and sold-out status for official RESCENE merch.',
            goodsBtn: 'Go to store ➔',
            menuClose: 'Close',
            menuSkip: 'Skip video',
            menuDetail: 'View full history',
            walkAgain: 'Shall we walk this path once more?',
            themeTitle: 'Change theme',
            calendarTitle: 'Calendar',
            loading: 'Loading data...',
            chartWaiting: 'Collecting chart data.',
            noSchedule: 'No scheduled events.',
            timelineSoon: 'The full timeline page is coming soon.',
            date: function (y, m, d) {
                var M = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
                return M[Number(m) - 1] + ' ' + d + ', ' + y;
            }
        },
        ja: {
            followJourney: '歩みをたどる ➔',
            goodsDesc: 'RESCENE公式グッズの在庫・完売状況をリアルタイムで確認できます。',
            goodsBtn: 'ストアへ ➔',
            menuClose: '閉じる',
            menuSkip: '映像をスキップ',
            menuDetail: '歩みをもっと見る',
            walkAgain: '歩んできた道を、もう一度歩いてみませんか？',
            themeTitle: 'テーマ変更',
            calendarTitle: 'カレンダー',
            loading: 'データ読み込み中...',
            chartWaiting: 'データを収集しています。',
            noSchedule: '登録された予定はありません。',
            timelineSoon: '詳細な年表ページは準備中です。',
            date: function (y, m, d) { return y + '年' + m + '月' + d + '日'; }
        }
    };

    /* ----------------------------------------------------------------------
       2. 발자취(historyData) 번역
          - 순서가 historyData 배열과 1:1로 맞아야 합니다.
          - 영문은 가속 구간에서도 읽히도록 일부러 짧게 의역했습니다.
       ---------------------------------------------------------------------- */
    var HISTORY = {
        ko: [
            'DEBUT SHOWCASE LIVE',
            '싱글 1집 《Re:Scene》 발매 (데뷔)',
            '코스모폴리탄 코리아 5월호 화보',
            '미니 1집 《SCENEDROME》 발매',
            '프리티스킨, 형지엘리트 광고 모델',
            '캐릭터 라이선싱 페어 홍보대사',
            '미니 2집 《Glow Up》 발매',
            '한국청소년연맹 홍보대사',
            'BEAUTY+ 5월호 화보',
            '싱글 2집 《Dearest》 발매',
            '미니 3집 《Lip Bomb》 발매',
            'I-SHA, 넥슨, CU 등 다수 브랜드 콜라보',
            '경상남도 거제시 홍보대사',
            '앳스타일 6월호 화보',
            '화보 MIIM (원이, 미나미)',
            '경기도 수원시 홍보대사',
            '경상북도 경주시 홍보대사',
            '경기도 고양시 홍보대사',
            "리메이크 싱글 'Pretty Girl' 발매",
            '멜론 1위 소감 라이브',
            '저스트 메이크업 IN TOKYO 2027 홍보대사',
            "'Pretty Girl' 첫 음악방송 1위 (더쇼)",
            '전남광주통합특별시 섬의 날 홍보대사',
            'MBC 아시안게임 중계방송 홍보대사',
            "'Pretty Girl' 첫 지상파 1위 (음악중심)",
            '하퍼스 바자 코리아 8월호 화보'
        ],
        en: [
            'DEBUT SHOWCASE LIVE',
            '1st Single 《Re:Scene》 — Debut',
            'Cosmopolitan Korea, May Issue',
            '1st Mini Album 《SCENEDROME》',
            'Pretty Skin & Hyungji Elite Ad Model',
            'Character Licensing Fair Ambassador',
            '2nd Mini Album 《Glow Up》',
            'Korea Youth Association Ambassador',
            'BEAUTY+ May Issue',
            '2nd Single 《Dearest》',
            '3rd Mini Album 《Lip Bomb》',
            'I-SHA, Nexon, CU & More Collabs',
            'Geoje City Ambassador',
            '@star1 June Issue',
            'MIIM Photoshoot (Woni, Minami)',
            'Suwon City Ambassador',
            'Gyeongju City Ambassador',
            'Goyang City Ambassador',
            "Remake Single 'Pretty Girl'",
            'Melon No.1 — Thank You Live',
            'Just Makeup IN TOKYO 2027 Ambassador',
            'First Music Show Win (The Show)',
            'Island Day Ambassador',
            'MBC Asian Games Broadcast Ambassador',
            'First Terrestrial TV Win (Music Core)',
            "Harper's BAZAAR Korea, August Issue"
        ],
        ja: [
            'DEBUT SHOWCASE LIVE',
            '1stシングル《Re:Scene》リリース（デビュー）',
            'コスモポリタン韓国 5月号',
            '1stミニアルバム《SCENEDROME》',
            'Pretty Skin・ヒョンジエリート 広告モデル',
            'キャラクターライセンシングフェア 広報大使',
            '2ndミニアルバム《Glow Up》',
            '韓国青少年連盟 広報大使',
            'BEAUTY+ 5月号',
            '2ndシングル《Dearest》',
            '3rdミニアルバム《Lip Bomb》',
            'I-SHA・ネクソン・CU など多数コラボ',
            '巨済市 広報大使',
            '@star1 6月号',
            'MIIM 写真集（ウォニ・ミナミ）',
            '水原市 広報大使',
            '慶州市 広報大使',
            '高陽市 広報大使',
            'リメイクシングル「Pretty Girl」',
            'Melon 1位 お礼ライブ',
            'ジャストメイクアップ IN TOKYO 2027 広報大使',
            '初の音楽番組1位（THE SHOW）',
            '島の日 広報大使',
            'MBCアジア大会中継 広報大使',
            '初の地上波1位（音楽中心）',
            'ハーパーズ バザー韓国 8月号'
        ]
    };

    /* ----------------------------------------------------------------------
       3. 상태
       ---------------------------------------------------------------------- */
    var LANGS = ['ko', 'en', 'ja'];
    var LABELS = { ko: 'KOR', en: 'ENG', ja: '日本語' };
    var current = localStorage.getItem('rescene-lang') || 'ko';
    if (LANGS.indexOf(current) === -1) current = 'ko';

    // 다른 스크립트에서 t('키') 로 꺼내 쓸 수 있게 전역 노출
    window.t = function (key) {
        var pack = DICT[current] || DICT.ko;
        return pack[key] !== undefined ? pack[key] : DICT.ko[key];
    };
    window.tDate = function (y, m, d) { return (DICT[current] || DICT.ko).date(y, m, d); };
    window.getLang = function () { return current; };

    /* ----------------------------------------------------------------------
       4. 적용
       ---------------------------------------------------------------------- */
    // 아이콘(svg)은 두고 텍스트만 교체
    function setLabel(el, text) {
        if (!el) return;
        for (var i = el.childNodes.length - 1; i >= 0; i--) {
            var n = el.childNodes[i];
            if (n.nodeType === 3 && n.textContent.trim() !== '') {
                n.textContent = (el.querySelector('svg') ? ' ' : '') + text;
                return;
            }
        }
        el.appendChild(document.createTextNode(' ' + text));
    }

    function setAttrText(sel, attr, key) {
        document.querySelectorAll(sel).forEach(function (el) {
            el.setAttribute(attr, window.t(key));
        });
    }

    function applyStatic() {
        setLabel(document.querySelector('.history-text-link'), window.t('followJourney'));
        setLabel(document.querySelector('.gb-left p'), window.t('goodsDesc'));
        setLabel(document.querySelector('.gb-btn'), window.t('goodsBtn'));
        setLabel(document.querySelector('.timeline-link-text'), window.t('walkAgain'));

        var menu = document.querySelectorAll('#historyDropdown button');
        if (menu.length >= 3) {
            setLabel(menu[0], window.t('menuClose'));
            setLabel(menu[1], window.t('menuSkip'));
            setLabel(menu[2], window.t('menuDetail'));
        }

        setAttrText('#themeToggleBtn', 'title', 'themeTitle');
        setAttrText('.cal-icon-btn, .mobile-cal-btn', 'title', 'calendarTitle');

        var timeEl = document.getElementById('currentTime');
        if (timeEl && /로딩|Loading|読み込み/.test(timeEl.innerText)) {
            timeEl.innerText = window.t('loading');
        }
    }

    // historyData 배열의 title을 현재 언어로 덮어씀 → 기존 재생 코드는 손댈 필요 없음
    function applyHistory() {
        if (typeof historyData === 'undefined' || !HISTORY[current]) return;
        historyData.forEach(function (item, i) {
            if (HISTORY[current][i]) item.title = HISTORY[current][i];
        });
    }

    function updateButtons() {
        document.querySelectorAll('.lang-switcher button').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-lang') === current);
        });
    }

    window.setLang = function (lang) {
        if (LANGS.indexOf(lang) === -1 || lang === current) return;
        current = lang;
        localStorage.setItem('rescene-lang', lang);
        document.documentElement.setAttribute('lang', lang);
        applyStatic();
        applyHistory();
        updateButtons();
        document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
    };

    /* ----------------------------------------------------------------------
       5. 스위처 버튼 생성
       ---------------------------------------------------------------------- */
    function buildSwitcher() {
        if (document.querySelector('.lang-switcher')) return;
        var box = document.createElement('div');
        box.className = 'lang-switcher';
        box.setAttribute('role', 'group');
        box.setAttribute('aria-label', 'Language');

        LANGS.forEach(function (lang) {
            var b = document.createElement('button');
            b.type = 'button';
            b.setAttribute('data-lang', lang);
            b.textContent = LABELS[lang];
            b.addEventListener('click', function () { window.setLang(lang); });
            box.appendChild(b);
        });
        document.body.appendChild(box);
    }

    /* ----------------------------------------------------------------------
       6. 초기화
       ---------------------------------------------------------------------- */
    function init() {
        document.documentElement.setAttribute('lang', current);
        buildSwitcher();
        applyStatic();
        applyHistory();
        updateButtons();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
