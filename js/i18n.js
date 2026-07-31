(function () {
    'use strict';

    var LANGS = ['ko', 'en', 'ja', 'zh'];
    var LABELS = { ko: 'KOR', en: 'ENG', ja: '日本語', zh: '中文' };
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
            officialSites: "공식 사이트",
            trackList: "TRACK LIST",
            audioLink: "음원",
            noLink: "등록된 링크가 없습니다",

            navHome: "HOME", navMembers: "MEMBERS", navCharts: "CHARTS", navSchedule: "SCHEDULE",
            navGoods: "GOODS", navNews: "NEWS", navFanchant: "응원법", navMedia: "영상 모음", langLabel: "언어",
            newsTitle: "RESCENE <span>NEWS</span>", newsSub: "구글·네이버·다음 등에서 모은 리센느 관련 기사입니다.", newsEmpty: "아직 등록된 기사가 없습니다.",

            heroWelcome: "리센느 비공식 팬 아카이브에 오신 것을 환영합니다.",
            heroEnter: "바로가기 →",

            sectionWith: "WITH <span>RESCENE</span>",
            historySubtitle: "지금까지 걸어 온 길을 같이 걸어 볼까요?",
            sectionArchive: "RESCENE <span>ARCHIVE</span>",
            profilePhoto: "PROFILE PHOTO",
            albumLabel: "ALBUM",
            youtubeCollect: "YOUTUBE <span>모아보기</span>",
            seeMore: "더보기 →",
            sectionAwards: "AWARDS & <span>AMBASSADOR</span>",
            musicShowTitle: "음악 방송 및 시상식",
            adsAmbassadorTitle: "광고 · 홍보대사",
            fullHistory: "전체 히스토리 보기 →",
            sectionToday: "TODAY'S <span>SCHEDULE</span>",

            chartTitle: "MUSIC <span>CHARTS</span>",
            fanchantTitle: "FAN<span>CHANT</span>",
            fanchantHint: "굵게 표시된 부분을 다같이 외쳐주세요 🎤",
            fanchantSelectHint: "왼쪽에서 곡을 선택해주세요",
            fanchantEmptyTitle: "아직 등록된 응원법이 없어요.",
            fanchantEmptySub: "준비되는 대로 곡별 응원법을 채워넣을 예정이에요!",
            mediaTitle: "MEDIA <span>ARCHIVE</span>",
            mediaSub: "리센느 유튜브 모아보기",
            merchTitle: "OFFICIAL <span>MERCH</span>",

            memberBirthday: "BIRTHDAY", memberPosition: "POSITION", memberMbti: "MBTI",
            memberSpecialty: "SPECIALTY", memberHobby: "HOBBY", memberPhotoArchive: "PHOTO <span>ARCHIVE</span>",

            searchPlaceholder: "제목 · 채널 검색",
            sortNewest: "최신순", sortOldest: "오래된순", sortNameAsc: "가나다순", sortNameDesc: "역순",
            mediaAllDone: "모든 영상을 다 봤어요.",
            prevVideo: "이전 영상", nextVideo: "다음 영상", playlist: "재생목록"
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
            officialSites: "Official",
            trackList: "TRACK LIST",
            audioLink: "Audio",
            noLink: "No link available",

            navHome: "HOME", navMembers: "MEMBERS", navCharts: "CHARTS", navSchedule: "SCHEDULE",
            navGoods: "GOODS", navNews: "NEWS", navFanchant: "FANCHANT", navMedia: "MEDIA", langLabel: "Language",
            newsTitle: "RESCENE <span>NEWS</span>", newsSub: "RESCENE news gathered from Google, Naver, and Daum.", newsEmpty: "No articles yet.",

            heroWelcome: "Welcome to the unofficial RESCENE fan archive.",
            heroEnter: "Enter →",

            sectionWith: "WITH <span>RESCENE</span>",
            historySubtitle: "Shall we walk through the journey together?",
            sectionArchive: "RESCENE <span>ARCHIVE</span>",
            profilePhoto: "PROFILE PHOTO",
            albumLabel: "ALBUM",
            youtubeCollect: "YOUTUBE <span>Highlights</span>",
            seeMore: "See more →",
            sectionAwards: "AWARDS & <span>AMBASSADOR</span>",
            musicShowTitle: "Music Shows & Awards",
            adsAmbassadorTitle: "Ads · Ambassador",
            fullHistory: "View full history →",
            sectionToday: "TODAY'S <span>SCHEDULE</span>",

            chartTitle: "MUSIC <span>CHARTS</span>",
            fanchantTitle: "FAN<span>CHANT</span>",
            fanchantHint: "Shout the bold parts together! 🎤",
            fanchantSelectHint: "Select a song from the list",
            fanchantEmptyTitle: "No fanchants registered yet.",
            fanchantEmptySub: "We'll add fanchants for each song as they're ready!",
            mediaTitle: "MEDIA <span>ARCHIVE</span>",
            mediaSub: "RESCENE YouTube collection",
            merchTitle: "OFFICIAL <span>MERCH</span>",

            memberBirthday: "BIRTHDAY", memberPosition: "POSITION", memberMbti: "MBTI",
            memberSpecialty: "SPECIALTY", memberHobby: "HOBBY", memberPhotoArchive: "PHOTO <span>ARCHIVE</span>",

            searchPlaceholder: "Search title · channel",
            sortNewest: "Newest", sortOldest: "Oldest", sortNameAsc: "A–Z", sortNameDesc: "Z–A",
            mediaAllDone: "You've watched everything.",
            prevVideo: "Previous", nextVideo: "Next", playlist: "Playlist"
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
            officialSites: "公式サイト",
            trackList: "TRACK LIST",
            audioLink: "音源",
            noLink: "登録されたリンクがありません",

            navHome: "HOME", navMembers: "MEMBERS", navCharts: "CHARTS", navSchedule: "SCHEDULE",
            navGoods: "GOODS", navNews: "NEWS", navFanchant: "応援法", navMedia: "動画まとめ", langLabel: "言語",
            newsTitle: "RESCENE <span>NEWS</span>", newsSub: "Google・Naver・Daumなどで集めたRESCENE関連ニュースです。", newsEmpty: "まだ登録された記事がありません。",

            heroWelcome: "RESCENE非公式ファンアーカイブへようこそ。",
            heroEnter: "入る →",

            sectionWith: "WITH <span>RESCENE</span>",
            historySubtitle: "これまで歩んできた道を一緒に振り返ってみましょうか？",
            sectionArchive: "RESCENE <span>ARCHIVE</span>",
            profilePhoto: "PROFILE PHOTO",
            albumLabel: "ALBUM",
            youtubeCollect: "YOUTUBE <span>まとめ</span>",
            seeMore: "もっと見る →",
            sectionAwards: "AWARDS & <span>AMBASSADOR</span>",
            musicShowTitle: "音楽番組と表彰式",
            adsAmbassadorTitle: "広告・広報大使",
            fullHistory: "全履歴を見る →",
            sectionToday: "TODAY'S <span>SCHEDULE</span>",

            chartTitle: "MUSIC <span>CHARTS</span>",
            fanchantTitle: "FAN<span>CHANT</span>",
            fanchantHint: "太字部分をみんなで叫んでください 🎤",
            fanchantSelectHint: "左のリストから曲を選んでください",
            fanchantEmptyTitle: "まだ登録された応援法がありません。",
            fanchantEmptySub: "準備が整い次第、曲ごとの応援法を追加していきます！",
            mediaTitle: "MEDIA <span>ARCHIVE</span>",
            mediaSub: "RESCENE YouTubeまとめ",
            merchTitle: "OFFICIAL <span>MERCH</span>",

            memberBirthday: "BIRTHDAY", memberPosition: "POSITION", memberMbti: "MBTI",
            memberSpecialty: "SPECIALTY", memberHobby: "HOBBY", memberPhotoArchive: "PHOTO <span>ARCHIVE</span>",

            searchPlaceholder: "タイトル・チャンネル検索",
            sortNewest: "新しい順", sortOldest: "古い順", sortNameAsc: "あいうえお順", sortNameDesc: "逆順",
            mediaAllDone: "すべての動画を見終わりました。",
            prevVideo: "前の動画", nextVideo: "次の動画", playlist: "再生リスト"
        },
        zh: {
            weekdays: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
            scheduleTypes: { broadcast: "播出", fansign: "粉丝签名会", event: "活动", concert: "演出", radio: "电台", notice: "公告" },
            status: { upcoming: "即将开始", live: "直播中", ended: "已结束" },
            timeLabel: "时间",
            timeTbd: "时间待定",
            noSchedule: "暂无日程安排。",
            upcomingView: "查看近期日程",
            chartWaiting: "正在获取榜单数据…",
            shortsMore: "在YouTube上<br>查看更多 #RESCENE",
            footerDisclaimer: "本网站是粉丝自发运营的非官方粉丝页面。<br>所有版权归属艺人RESCENE及所属公司THE MUZE Entertainment，与其官方无关，特此说明。",
            officialSites: "官方网站",
            trackList: "TRACK LIST",
            audioLink: "音源",
            noLink: "暂无相关链接",

            navHome: "首页", navMembers: "成员", navCharts: "榜单", navSchedule: "日程",
            navGoods: "周边", navNews: "新闻", navFanchant: "应援口号", navMedia: "视频合集", langLabel: "语言",
            newsTitle: "RESCENE <span>新闻</span>", newsSub: "从谷歌、Naver、Daum等收集的RESCENE相关新闻。", newsEmpty: "暂无收录的新闻。",

            heroWelcome: "欢迎来到RESCENE非官方粉丝档案站。",
            heroEnter: "进入 →",

            sectionWith: "WITH <span>RESCENE</span>",
            historySubtitle: "要不要一起回顾走过的这段旅程？",
            sectionArchive: "RESCENE <span>档案</span>",
            profilePhoto: "PROFILE PHOTO",
            albumLabel: "专辑",
            youtubeCollect: "YOUTUBE <span>合集</span>",
            seeMore: "查看更多 →",
            sectionAwards: "获奖 & <span>代言</span>",
            musicShowTitle: "音乐节目与颁奖典礼",
            adsAmbassadorTitle: "广告 · 代言",
            fullHistory: "查看全部记录 →",
            sectionToday: "今日 <span>日程</span>",

            chartTitle: "音源 <span>榜单</span>",
            fanchantTitle: "应援 <span>口号</span>",
            fanchantHint: "请大家一起大声喊出加粗的部分 🎤",
            fanchantSelectHint: "请从左侧列表选择歌曲",
            fanchantEmptyTitle: "暂未收录应援口号。",
            fanchantEmptySub: "准备好后会陆续补充各首歌曲的应援口号！",
            mediaTitle: "视频 <span>合集</span>",
            mediaSub: "RESCENE YouTube合集",
            merchTitle: "官方 <span>周边</span>",

            memberBirthday: "生日", memberPosition: "位置", memberMbti: "MBTI",
            memberSpecialty: "特长", memberHobby: "爱好", memberPhotoArchive: "照片 <span>档案</span>",

            searchPlaceholder: "搜索标题 · 频道",
            sortNewest: "最新", sortOldest: "最早", sortNameAsc: "A-Z", sortNameDesc: "Z-A",
            mediaAllDone: "已浏览全部视频。",
            prevVideo: "上一个", nextVideo: "下一个", playlist: "播放列表"
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
        if (current === 'zh') return y + '年' + m + '月' + d + '日';
        return y + '년 ' + m + '월 ' + d + '일';
    };

    function updateWeekdayHeaders() {
        var wds = window.t('weekdays');
        document.querySelectorAll('[data-wd]').forEach(function (el) {
            var i = parseInt(el.getAttribute('data-wd'), 10);
            if (wds && wds[i] !== undefined) el.textContent = wds[i];
        });
    }

    function applyStaticTexts() {
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            var val = window.t(key);
            if (val !== undefined) el.innerHTML = val;
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-placeholder');
            var val = window.t(key);
            if (val !== undefined) el.setAttribute('placeholder', val);
        });
        updateWeekdayHeaders();

        // 네비게이션/푸터는 JS로 매번 새로 그려지므로, 렌더 함수가 있으면 다시 호출해서 반영
        if (typeof window.__lastNavArgs !== 'undefined' && typeof renderSiteNav === 'function') {
            renderSiteNav.apply(null, window.__lastNavArgs);
        }
        if (typeof window.__lastFooterArgs !== 'undefined' && typeof renderSiteFooter === 'function') {
            renderSiteFooter.apply(null, window.__lastFooterArgs);
        }
    }

    function refreshDynamicSections() {
        // 이미 화면에 그려진 동적 영역들 재렌더링 (내부적으로 window.t를 다시 읽어감)
        if (typeof renderTodaySchedule === 'function') renderTodaySchedule();
        if (typeof renderCalendar === 'function') renderCalendar();
        if (typeof mediaRenderTagRow === 'function') mediaRenderTagRow();
        if (typeof renderFcList === 'function') renderFcList();
    }

    function updateButtons() {
        document.querySelectorAll('.lang-switcher button, .lang-accordion-item').forEach(function (b) {
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

    // ⭐️ 예전엔 여기서 언어 스위처가 없는 페이지에 자동으로 하나 만들어 붙였는데,
    // js/layout.js의 renderSiteNav(..., { lang: true/false }) 옵션과 충돌해서
    // lang:false로 꺼둔 페이지(goods/chart/member/media)에도 계속 떠 있었음.
    // → 자동 생성 없애고, nav 안에 있는 스위처(lang:true인 페이지)만 사용하도록 정리.

    window.addEventListener('DOMContentLoaded', function () {
        document.documentElement.setAttribute('lang', current);
        updateButtons();
        applyStaticTexts();
        // 최초 로드시 동적 영역은 각 페이지 스크립트가 로드된 뒤 알아서 window.t를 읽어가므로 별도 호출 불필요
    });
})();
