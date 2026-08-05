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
            navGoods: "GOODS", navNews: "NEWS", navFanchant: "응원법", navMedia: "영상 모음",
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
            musicShowTitle: "음악방송",
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
            memberSpecialty: "NICKNAME", memberHobby: "SNS", memberPhotoArchive: "PHOTO <span>ARCHIVE</span>",

            searchPlaceholder: "제목 · 채널 검색",
            sortNewest: "최신순", sortOldest: "오래된순", sortNameAsc: "가나다순", sortNameDesc: "역순",
            mediaAllDone: "모든 영상을 다 봤어요.",
            prevVideo: "이전 영상", nextVideo: "다음 영상", playlist: "재생목록",

            filterLabel: "필터", categoryFilter: "카테고리 필터", itemsCountSuffix: "개 항목",
            detailSearch: "상세 검색", deselectable: "선택 해제 가능", relatedTopics: "관련 주제 선택",
            selectedCountLabel: "선택됨", popularSort: "많이 나온순", alphaSort: "가나다순",
            resetBtn: "초기화", resetAllBtn: "전체 초기화", applyBtn: "적용하기", noActiveFilters: "활성화된 필터 없음",
            noRelatedTopics: "해당 카테고리에는 관련 주제가 없습니다.", noChosungResults: "해당 자음으로 시작하는 항목이 없습니다.",
            searchResultsLabel: "검색결과", noSearchResults: "검색 결과가 없어요.",
            liveNow: "LIVE", subtitlesLabel: "자막", categoryAll: "전체"
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
            navGoods: "GOODS", navNews: "NEWS", navFanchant: "FANCHANT", navMedia: "MEDIA",
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
            musicShowTitle: "Music Shows",
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
            memberSpecialty: "NICKNAME", memberHobby: "SNS", memberPhotoArchive: "PHOTO <span>ARCHIVE</span>",

            searchPlaceholder: "Search title · channel",
            sortNewest: "Newest", sortOldest: "Oldest", sortNameAsc: "A–Z", sortNameDesc: "Z–A",
            mediaAllDone: "You've watched everything.",
            prevVideo: "Previous", nextVideo: "Next", playlist: "Playlist",

            filterLabel: "Filter", categoryFilter: "Category Filter", itemsCountSuffix: " items",
            detailSearch: "Detail Search", deselectable: "Deselectable", relatedTopics: "Related Topics",
            selectedCountLabel: "Selected", popularSort: "Most Videos", alphaSort: "A–Z",
            resetBtn: "Reset", resetAllBtn: "Clear All", applyBtn: "Apply", noActiveFilters: "No active filters",
            noRelatedTopics: "No related topics for this category.", noChosungResults: "No items start with this letter.",
            searchResultsLabel: "Results", noSearchResults: "No results found.",
            liveNow: "LIVE", subtitlesLabel: "Subtitles", categoryAll: "All"
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
            navGoods: "GOODS", navNews: "NEWS", navFanchant: "応援法", navMedia: "動画まとめ",
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
            musicShowTitle: "音楽番組",
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
            memberSpecialty: "NICKNAME", memberHobby: "SNS", memberPhotoArchive: "PHOTO <span>ARCHIVE</span>",

            searchPlaceholder: "タイトル・チャンネル検索",
            sortNewest: "新しい順", sortOldest: "古い順", sortNameAsc: "あいうえお順", sortNameDesc: "逆順",
            mediaAllDone: "すべての動画を見終わりました。",
            prevVideo: "前の動画", nextVideo: "次の動画", playlist: "再生リスト",

            filterLabel: "フィルター", categoryFilter: "カテゴリーフィルター", itemsCountSuffix: "件",
            detailSearch: "詳細検索", deselectable: "選択解除可能", relatedTopics: "関連トピック選択",
            selectedCountLabel: "選択済み", popularSort: "投稿数順", alphaSort: "五十音順",
            resetBtn: "リセット", resetAllBtn: "全てリセット", applyBtn: "適用する", noActiveFilters: "適用中のフィルターはありません",
            noRelatedTopics: "このカテゴリーには関連トピックがありません。", noChosungResults: "この文字で始まる項目はありません。",
            searchResultsLabel: "検索結果", noSearchResults: "検索結果がありません。",
            liveNow: "LIVE", subtitlesLabel: "字幕", categoryAll: "すべて"
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
            navGoods: "周边", navNews: "新闻", navFanchant: "应援口号", navMedia: "视频合集",
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
            musicShowTitle: "音乐节目",
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
            memberSpecialty: "昵称", memberHobby: "SNS", memberPhotoArchive: "照片 <span>档案</span>",

            searchPlaceholder: "搜索标题 · 频道",
            sortNewest: "最新", sortOldest: "最早", sortNameAsc: "A-Z", sortNameDesc: "Z-A",
            mediaAllDone: "已浏览全部视频。",
            prevVideo: "上一个", nextVideo: "下一个", playlist: "播放列表",

            filterLabel: "筛选", categoryFilter: "分类筛选", itemsCountSuffix: "项",
            detailSearch: "详细搜索", deselectable: "可取消选择", relatedTopics: "选择相关主题",
            selectedCountLabel: "已选择", popularSort: "按数量排序", alphaSort: "按字母排序",
            resetBtn: "重置", resetAllBtn: "全部重置", applyBtn: "应用", noActiveFilters: "没有已启用的筛选",
            noRelatedTopics: "该分类下没有相关主题。", noChosungResults: "没有以该字母开头的项目。",
            searchResultsLabel: "搜索结果", noSearchResults: "没有搜索结果。",
            liveNow: "LIVE", subtitlesLabel: "字幕", categoryAll: "全部"
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
        document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-aria-label');
            var val = window.t(key);
            if (val !== undefined) el.setAttribute('aria-label', val);
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
        document.querySelectorAll('.lang-switcher-mobile button, .lang-accordion-item').forEach(function (b) {
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

    window.addEventListener('DOMContentLoaded', function () {
        document.documentElement.setAttribute('lang', current);
        updateButtons();
        applyStaticTexts();
    });
})();
