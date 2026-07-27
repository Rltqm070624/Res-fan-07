/* ==========================================================================
   RESCENE ARCHIVE - 자체 번역 엔진 (Google Translate 미사용)
   - 크롬/구글 번역기에 의존하지 않고, 미리 준비된 한/영/일 사전으로
     텍스트를 그 자리에서 즉시 교체합니다. 새로고침 없음, 실시간 API 호출 없음.
   - 새 문구를 번역에 포함시키고 싶으면:
     1) 고정 문구(HTML에 항상 있는 텍스트) → 해당 요소에 data-i18n="키" 추가 후
        아래 TRANSLATIONS.ko/en/ja 에 같은 키로 문구 등록
     2) JS가 동적으로 만드는 텍스트 → window.t('키') 로 불러와 쓰기
   ========================================================================== */
(function () {
    'use strict';

    var LANGS = ['ko', 'en', 'ja'];
    var LABELS = { ko: 'KOR', en: 'ENG', ja: '日本語' };
    var current = localStorage.getItem('rescene-lang') || 'ko';
    if (LANGS.indexOf(current) === -1) current = 'ko';

    var TRANSLATIONS = {
        ko: {
            weekdays: ["일", "월", "화", "수", "목", "금", "토"],
            scheduleTypes: { broadcast: "방송", fansign: "팬사인회", event: "행사", concert: "공연", radio: "라디오", notice: "공지" },
            status: { upcoming: "예정", live: "LIVE", ended: "종료" },
            timeLabel: "시간",
            timeTbd: "시간 미정",
            noSchedule: "등록된 일정이 없습니다.",
            upcomingView: "다가오는 일정 보기",
            chartWaiting: "데이터 수집 중입니다.",
            shortsMore: "유튜브에서<br>#리센느 더보기",
            footerDisclaimer: "해당 홈페이지는 팬이 자발적으로 운영하는 비공식 팬 페이지입니다.<br>모든 저작권은 아티스트 RESCENE, 소속사 THE MUZE Entertainment에게 있으며 공식 관계가 없음을 알려드립니다.",
            trackList: "TRACK LIST",
            audioLink: "음원",
            noLink: "등록된 링크가 없습니다"
        },
        en: {
            weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            scheduleTypes: { broadcast: "Broadcast", fansign: "Fan Sign", event: "Event", concert: "Concert", radio: "Radio", notice: "Notice" },
            status: { upcoming: "Upcoming", live: "LIVE", ended: "Ended" },
            timeLabel: "Time",
            timeTbd: "Time TBD",
            noSchedule: "No schedule for this date.",
            upcomingView: "View upcoming schedule",
            chartWaiting: "Fetching chart data…",
            shortsMore: "See more #RESCENE<br>on YouTube",
            footerDisclaimer: "This site is an unofficial fan page run voluntarily by a fan.<br>All rights belong to RESCENE and THE MUZE Entertainment. This site has no official affiliation with either.",
            trackList: "TRACK LIST",
            audioLink: "Audio",
            noLink: "No link available"
        },
        ja: {
            weekdays: ["日", "月", "火", "水", "木", "金", "土"],
            scheduleTypes: { broadcast: "放送", fansign: "ファンサイン会", event: "イベント", concert: "コンサート", radio: "ラジオ", notice: "お知らせ" },
            status: { upcoming: "予定", live: "LIVE", ended: "終了" },
            timeLabel: "時間",
            timeTbd: "時間未定",
            noSchedule: "登録されたスケジュールがありません。",
            upcomingView: "近日のスケジュールを見る",
            chartWaiting: "データ収集中です。",
            shortsMore: "YouTubeで<br>#RESCENE をもっと見る",
            footerDisclaimer: "当サイトはファンが自発的に運営する非公式ファンページです。<br>すべての著作権はアーティストRESCENE、所属事務所THE MUZE Entertainmentに帰属し、公式な関係はないことをお知らせします。",
            trackList: "TRACK LIST",
            audioLink: "音源",
            noLink: "登録されたリンクがありません"
        }
    };

    window.t = function (key) {
        var dict = TRANSLATIONS[current] || TRANSLATIONS.ko;
        return (key in dict) ? dict[key] : TRANSLATIONS.ko[key];
    };

    window.tDate = function (year, month, day) {
        var y = String(year), m = String(month).replace(/^0/, ''), d = String(day).replace(/^0/, '');
        if (current === 'en') {
            var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            return MONTHS[parseInt(m, 10) - 1] + ' ' + d + ', ' + y;
        }
        if (current === 'ja') return y + '年' + m + '月' + d + '日';
        return y + '년 ' + m + '월 ' + d + '일';
    };

    function applyStaticTexts() {
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            var val = window.t(key);
            if (val !== undefined) el.innerHTML = val;
        });
    }

    function refreshDynamicSections() {
        // 이미 화면에 그려진 동적 영역들 재렌더링 (내부적으로 window.t를 다시 읽어감)
        if (typeof renderTodaySchedule === 'function') renderTodaySchedule();
        if (typeof renderCalendar === 'function') renderCalendar();
    }

    function updateButtons() {
        document.querySelectorAll('.lang-switcher button').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-lang') === current);
        });
    }

    window.setLang = function (lang) {
        if (LANGS.indexOf(lang) === -1) return;
        current = lang;
        localStorage.setItem('rescene-lang', lang);
        document.documentElement.setAttribute('lang', lang);
        updateButtons();
        applyStaticTexts();
        refreshDynamicSections();
    };

    function buildSwitcher() {
        if (document.querySelector('.lang-switcher')) return;
        var box = document.createElement('div');
        box.className = 'lang-switcher notranslate'; box.setAttribute('translate', 'no');
        box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Language');
        LANGS.forEach(function (lang) {
            var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-lang', lang); b.textContent = LABELS[lang];
            b.addEventListener('click', function () { window.setLang(lang); });
            box.appendChild(b);
        });
        document.body.appendChild(box);
    }

    window.addEventListener('DOMContentLoaded', function () {
        buildSwitcher();
        updateButtons();
        applyStaticTexts();
        // 최초 로드시 동적 영역은 각 페이지 스크립트가 로드된 뒤 알아서 window.t를 읽어가므로 별도 호출 불필요
    });
})();
