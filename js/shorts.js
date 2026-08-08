const SHORTS_TAG_META = [
    { key: 'all',     label: '전체',   color: 'var(--c-accent)' },
    { key: 'rescene', label: '리센느', color: 'var(--c-accent)' },
    { key: 'woni',    label: '원이',   color: '#f4c95d' },
    { key: 'liv',     label: '리브',   color: '#6ec6ff' },
    { key: 'minami',  label: '미나미', color: '#2b99c4' },
    { key: 'may',     label: '메이',   color: '#ecd25b' },
    { key: 'zena',    label: '제나',   color: '#ff6b6b' }
];

const shState = { home: 'all', media: 'all' };
const shListCache = { home: [], media: [] };
let shMediaSearchTerm = '';

function shEscapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function shEscapeAttr(str) { return shEscapeHtml(str).replace(/"/g, '&quot;'); }
function shThumb(vid) { return `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`; }

function shGetAll() {
    return typeof SHORTS_DATA !== 'undefined' ? SHORTS_DATA : [];
}

function shFilterByTag(list, tagKey) {
    if (!tagKey || tagKey === 'all') return list;
    return list.filter(item => Array.isArray(item.tags) && item.tags.includes(tagKey));
}

function shRenderFilterChips(containerId, scope) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = SHORTS_TAG_META.map(t => `
        <button type="button" class="sh-chip${shState[scope] === t.key ? ' active' : ''}"
            style="--sh-color:${t.color};" onclick="shSetFilter('${scope}', '${t.key}')">
            <span>#${shEscapeHtml(t.label)}</span>
        </button>
    `).join('');
}

function shRenderTagCol(containerId, scope) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = SHORTS_TAG_META.map(t => `
        <button type="button" class="ms-item${shState[scope] === t.key ? ' active' : ''}" onclick="shSetFilter('${scope}', '${t.key}')">
            <span>#${shEscapeHtml(t.label)}</span>
        </button>
    `).join('');
}

function shSetFilter(scope, key) {
    shState[scope] = key;
    if (scope === 'home') {
        shRenderFilterChips('shHomeFilterRow', 'home');
        shRenderRow('shHomeGrid', 'home');
    } else if (scope === 'media') {
        shRenderTagCol('shMediaTagCol', 'media');
        shRenderGrid('shMediaGrid', 'media');
    }
}

function shCardHtml(item, idx, scope) {
    return `
    <div class="sh-card" data-idx="${idx}" onclick="shModalOpen('${scope}', ${idx})">
        <div class="sh-card-thumb">
            <img src="${shThumb(item.vid)}" alt="${shEscapeAttr(item.title)}" loading="lazy"
                onerror="this.closest('.sh-card').style.display='none'">
            <button type="button" class="sh-play-btn" aria-label="재생">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
        </div>
        <div class="sh-card-info">
            <div class="sh-card-title">${shEscapeHtml(item.title)}</div>
            <div class="sh-card-sub">${item.channel ? shEscapeHtml(item.channel) + ' · ' : ''}${item.date || ''}</div>
        </div>
    </div>`;
}

function shRenderRow(containerId, scope) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    const all = shGetAll().slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const filtered = shFilterByTag(all, shState[scope]).slice(0, 16);
    shListCache[scope] = filtered;

    if (!filtered.length) {
        grid.innerHTML = '<div class="sh-empty">아직 등록된 쇼츠가 없어요.<br>scripts/scrape_shorts.js 를 실행해서 채워보세요.</div>';
        return;
    }
    grid.innerHTML = filtered.map((item, i) => shCardHtml(item, i, scope)).join('');
}

function shRenderGrid(containerId, scope) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    const all = shGetAll().slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    let filtered = shFilterByTag(all, shState[scope]);

    if (scope === 'media' && shChannelFilters.size) {
        filtered = filtered.filter(item => shChannelFilters.has(item.channel || '기타'));
    }

    if (scope === 'media' && shMediaSearchTerm) {
        const term = shMediaSearchTerm.toLowerCase();
        filtered = filtered.filter(item =>
            (item.title || '').toLowerCase().includes(term) ||
            (item.channel || '').toLowerCase().includes(term)
        );
    }

    shListCache[scope] = filtered;

    const countBadge = document.getElementById('shMediaCountBadge');
    if (countBadge) countBadge.innerHTML = `<b>${filtered.length}</b>개`;

    if (!filtered.length) {
        grid.innerHTML = '<div class="sh-empty">아직 등록된 쇼츠가 없어요.<br>scripts/scrape_shorts.js 를 실행해서 채워보세요.</div>';
        return;
    }
    grid.innerHTML = filtered.map((item, i) => shCardHtml(item, i, scope)).join('');
}

function shMediaApplyFilters() {
    const input = document.getElementById('shMediaSearch');
    shMediaSearchTerm = (input && input.value || '').trim();
    const clearBtn = document.getElementById('shMediaSearchClear');
    if (clearBtn) clearBtn.classList.toggle('show', !!shMediaSearchTerm);
    shRenderGrid('shMediaGrid', 'media');
}

function shMediaClearSearch() {
    const input = document.getElementById('shMediaSearch');
    if (input) input.value = '';
    shMediaApplyFilters();
}

let shModalScope = null;
let shModalIndex = -1;
let shPlayer = null;
let shYtApiReady = false;
let shYtApiLoading = false;
let shYtApiCallbacks = [];

let shSkipNextTapToggle = false;

function shEnsureYouTubeApi(cb) {
    if (shYtApiReady && window.YT && window.YT.Player) { cb(); return; }
    shYtApiCallbacks.push(cb);
    if (shYtApiLoading) return;
    shYtApiLoading = true;
    const prevReadyFn = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
        if (typeof prevReadyFn === 'function') prevReadyFn();
        shYtApiReady = true;
        shYtApiCallbacks.forEach(fn => fn());
        shYtApiCallbacks = [];
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    }
}

function shDestroyPlayer() {
    if (shPlayer && typeof shPlayer.destroy === 'function') {
        try { shPlayer.destroy(); } catch (e) { }
    }
    shPlayer = null;
}

function shTogglePlayPause() {
    if (!shPlayer || typeof shPlayer.getPlayerState !== 'function') return;
    const state = shPlayer.getPlayerState();
    if (state === 1) shPlayer.pauseVideo();
    else shPlayer.playVideo();
}

function shModalOpen(scope, idx) {
    shModalScope = scope;
    const modal = document.getElementById('shModal');
    const backdrop = document.getElementById('shModalBackdrop');
    if (!modal) return;
    modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
    shModalRenderPlaylist();
    shModalLoad(idx);
}

function shModalRenderPlaylist() {
    const list = shListCache[shModalScope] || [];
    const listEl = document.getElementById('shModalPlaylistList');
    const countEl = document.getElementById('shModalPlaylistCount');
    if (countEl) countEl.textContent = list.length;
    if (!listEl) return;
    listEl.innerHTML = list.map((item, i) => `
        <li class="mm-playlist-item" data-idx="${i}" onclick="shModalLoad(${i})">
            <span class="mm-playlist-index">${i + 1}</span>
            <div class="sh-modal-playlist-thumb"><img src="${shThumb(item.vid)}" alt="" loading="lazy"></div>
            <div class="mm-playlist-info">
                <div class="mm-playlist-title">${shEscapeHtml(item.title)}</div>
                <div class="mm-playlist-date">${item.channel ? shEscapeHtml(item.channel) + ' · ' : ''}${item.date || ''}</div>
            </div>
        </li>`).join('');
}

function shModalHighlightPlaylistActive() {
    const listEl = document.getElementById('shModalPlaylistList');
    if (!listEl) return;
    listEl.querySelectorAll('.mm-playlist-item').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.idx, 10) === shModalIndex);
    });
    const activeEl = listEl.querySelector('.mm-playlist-item.active');
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function shModalLoad(idx) {
    const list = shListCache[shModalScope] || [];
    const item = list[idx];
    if (!item) return;
    shModalIndex = idx;
    shSkipNextTapToggle = true;

    const media = document.getElementById('shModalMediaBox');
    const title = document.getElementById('shModalTitle');
    const sub = document.getElementById('shModalSub');

    shDestroyPlayer();
    if (media) {
        media.innerHTML = '<div id="shYtPlayer"></div><div class="sh-swipe-catcher" id="shSwipeCatcher"></div>';
        shAttachSwipeCatcher();
    }

    shEnsureYouTubeApi(() => {
        const modal = document.getElementById('shModal');
        if (!modal || !modal.classList.contains('active')) return;
        if (!document.getElementById('shYtPlayer')) return;
        const currentList = shListCache[shModalScope] || [];
        if (currentList[shModalIndex] !== item) return;
        shPlayer = new YT.Player('shYtPlayer', {
            videoId: item.vid,
            playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, controls: 0 }
        });
    });

    if (title) title.textContent = item.title;
    if (sub) sub.textContent = `${item.channel ? item.channel + ' · ' : ''}${item.date || ''}`;

    const prevBtn = document.getElementById('shModalPrevBtn');
    const nextBtn = document.getElementById('shModalNextBtn');
    if (prevBtn) prevBtn.disabled = shModalIndex <= 0;
    if (nextBtn) nextBtn.disabled = shModalIndex >= list.length - 1;
    shModalHighlightPlaylistActive();

    shCommentsLoadedForVid = null;
    shSetupExtras(item);
    shSwitchSideTab('playlist');
}

let shModalTransitioning = false;

function shModalPrev() {
    if (shModalIndex > 0) shModalTransitionTo(shModalIndex - 1, 'down');
}
function shModalNext() {
    const list = shListCache[shModalScope] || [];
    if (shModalIndex < list.length - 1) shModalTransitionTo(shModalIndex + 1, 'up');
}

function shModalTransitionTo(idx, direction) {
    if (shModalTransitioning) return;
    const box = document.getElementById('shModalMediaBox');
    if (!box) { shModalLoad(idx); return; }
    shModalTransitioning = true;

    const outY = direction === 'up' ? '-100%' : '100%';
    const inY = direction === 'up' ? '100%' : '-100%';

    box.style.transition = 'transform 0.26s cubic-bezier(0.4,0,1,1), opacity 0.22s ease';
    box.style.transform = `translateY(${outY})`;
    box.style.opacity = '0';

    setTimeout(() => {
        shModalLoad(idx);
        const newBox = document.getElementById('shModalMediaBox');
        if (!newBox) { shModalTransitioning = false; return; }
        newBox.style.transition = 'none';
        newBox.style.transform = `translateY(${inY})`;
        newBox.style.opacity = '0';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                newBox.style.transition = 'transform 0.34s cubic-bezier(0.16,1,0.3,1), opacity 0.28s ease';
                newBox.style.transform = 'translateY(0)';
                newBox.style.opacity = '1';
                setTimeout(() => { shModalTransitioning = false; }, 340);
            });
        });
    }, 260);
}

function shModalClose() {
    const modal = document.getElementById('shModal');
    const backdrop = document.getElementById('shModalBackdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    shDestroyPlayer();
    const media = document.getElementById('shModalMediaBox');
    if (media) media.innerHTML = '';
    if (typeof veClearLiveChat === 'function') veClearLiveChat('shLiveChatPanel');
    document.body.style.overflow = '';
}

function shAttachSwipeCatcher() {
    const catcher = document.getElementById('shSwipeCatcher');
    if (!catcher) return;
    let startX = 0, startY = 0, dragging = false, moved = false;
    const TAP_THRESHOLD = 10;
    const SWIPE_THRESHOLD = 60;

    function pointX(e) { return e.touches ? e.touches[0].clientX : e.clientX; }
    function pointY(e) { return e.touches ? e.touches[0].clientY : e.clientY; }

    function onDown(e) {
        if (shModalTransitioning) return;
        dragging = true;
        moved = false;
        startX = pointX(e);
        startY = pointY(e);
        const box = document.getElementById('shModalMediaBox');
        if (box) box.style.transition = 'none';
    }

    function onMove(e) {
        if (!dragging) return;
        const dx = pointX(e) - startX;
        const dy = pointY(e) - startY;
        if (Math.abs(dx) > TAP_THRESHOLD || Math.abs(dy) > TAP_THRESHOLD) moved = true;
        const box = document.getElementById('shModalMediaBox');
        if (box && Math.abs(dy) > Math.abs(dx)) {
            const clamped = Math.max(-120, Math.min(120, dy));
            box.style.transform = `translateY(${clamped * 0.4}px)`;
        }
    }

    function onUp(e) {
        if (!dragging) return;
        dragging = false;
        const endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        const dy = endY - startY;
        const box = document.getElementById('shModalMediaBox');

        if (!moved) {
            if (box) { box.style.transition = 'transform 0.25s cubic-bezier(0.22,1,0.36,1)'; box.style.transform = ''; }
            if (shSkipNextTapToggle) { shSkipNextTapToggle = false; return; }
            shTogglePlayPause();
            return;
        }
        if (dy < -SWIPE_THRESHOLD) {
            shModalNext();
        } else if (dy > SWIPE_THRESHOLD) {
            shModalPrev();
        } else if (box) {
            box.style.transition = 'transform 0.3s cubic-bezier(0.22,1,0.36,1)';
            box.style.transform = '';
        }
    }

    catcher.addEventListener('touchstart', onDown, { passive: true });
    catcher.addEventListener('touchmove', onMove, { passive: true });
    catcher.addEventListener('touchend', onUp);
    catcher.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
}

function mediaSetView(view) {
    document.querySelectorAll('.mv-tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
    const fullView = document.getElementById('mediaFullView');
    const shortsView = document.getElementById('mediaShortsView');
    if (fullView) fullView.style.display = view === 'full' ? '' : 'none';
    if (shortsView) shortsView.style.display = view === 'shorts' ? '' : 'none';

    if (view === 'shorts') {
        shRenderTagCol('shMediaTagCol', 'media');
        shRenderGrid('shMediaGrid', 'media');
    }
}

function shInitMediaViewFromQuery() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'shorts') mediaSetView('shorts');
}

window.addEventListener('DOMContentLoaded', () => {
    try {

        if (document.getElementById('shHomeGrid')) {
            shRenderFilterChips('shHomeFilterRow', 'home');
            shRenderRow('shHomeGrid', 'home');
        }

        if (document.getElementById('shMediaGrid')) {
            shRenderTagCol('shMediaTagCol', 'media');
            shRenderGrid('shMediaGrid', 'media');
            shInitMediaViewFromQuery();
        }

        document.querySelectorAll('.sh-row-wrapper').forEach(wrapper => {
            wrapper.addEventListener('wheel', (e) => {
                if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
                if (wrapper.scrollWidth <= wrapper.clientWidth) return;
                e.preventDefault();
                wrapper.scrollLeft += e.deltaY;
            }, { passive: false });
        });
    } catch (e) {
        console.error('쇼츠 렌더링 실패:', e);
    }
});

let shChannelFilters = new Set();
let shChannelSortMode = 'popular';
let shChannelChosung = '전체';

const SH_CHO_LIST = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const SH_CHO_BASE_MAP = { 'ㄲ':'ㄱ', 'ㄸ':'ㄷ', 'ㅃ':'ㅂ', 'ㅆ':'ㅅ', 'ㅉ':'ㅈ' };
const SH_CHOSUNG_KEYS = ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ','#'];
const SH_EN_KEYS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','#'];

function shGetChosungKey(str) {
    if (!str) return '#';
    const ch = str.trim().charAt(0);
    const code = ch.charCodeAt(0) - 0xAC00;
    if (code >= 0 && code <= 11171) {
        const cho = SH_CHO_LIST[Math.floor(code / 588)];
        return SH_CHO_BASE_MAP[cho] || cho;
    }
    return '#';
}
function shGetEnKey(str) {
    if (!str) return '#';
    const ch = str.trim().charAt(0).toUpperCase();
    return (ch >= 'A' && ch <= 'Z') ? ch : '#';
}

function shOpenAdvFilter() {
    const drawer = document.getElementById('shAdvFilterDrawer');
    const backdrop = document.getElementById('shAdvFilterBackdrop');
    if (!drawer) return;
    drawer.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
    shRenderDrawer();
}

function shCloseAdvFilter() {
    const drawer = document.getElementById('shAdvFilterDrawer');
    if (drawer) {
        drawer.classList.remove('active');
        setTimeout(() => { drawer.style.transform = ''; }, 400);
    }
    const backdrop = document.getElementById('shAdvFilterBackdrop');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
}

function shRenderDrawer() {

    const catBox = document.getElementById('shAfdCategoryChips');
    const catCount = document.getElementById('shAfdCatCount');
    if (catBox) {
        catBox.innerHTML = SHORTS_TAG_META.map(t => `
            <button class="afd-chip ${shState.media === t.key ? 'active' : ''}" onclick="shSetFilter('media','${t.key}'); shRenderDrawer();">
                ${shState.media === t.key ? checkSVG : ''} #${shEscapeHtml(t.label)}
            </button>
        `).join('');
    }
    if (catCount) catCount.textContent = `${SHORTS_TAG_META.length}${window.t ? window.t('itemsCountSuffix') : '개 항목'}`;

    const activeBox = document.getElementById('shAfdActiveChips');
    let actives = [];
    if (shState.media !== 'all') {
        const meta = SHORTS_TAG_META.find(t => t.key === shState.media);
        if (meta) actives.push({ type: 'tag', label: '#' + meta.label, val: meta.key });
    }
    shChannelFilters.forEach(c => actives.push({ type: 'channel', label: c, val: c }));
    if (activeBox) {
        activeBox.innerHTML = actives.length ? actives.map(a => `
            <button class="afd-chip closeable" onclick="shRemoveActiveFilter('${a.type}', '${shEscapeAttr(a.val)}')">
                ${shEscapeHtml(a.label)} ${closeSVG}
            </button>
        `).join('') : `<span style="font-size:13px; color:var(--text-muted);">활성화된 필터 없음</span>`;
    }

    const topicBox = document.getElementById('shAfdChannelChips');
    const topicCount = document.getElementById('shAfdChannelCount');
    const toolbar = document.getElementById('shAfdChannelToolbar');
    const chosungRow = document.getElementById('shAfdChosungRow');

    const base = shFilterByTag(shGetAll(), shState.media);
    const channelCounts = {};
    base.forEach(item => { const c = item.channel || '기타'; channelCounts[c] = (channelCounts[c] || 0) + 1; });
    let counted = Object.keys(channelCounts).map(c => ({ label: c, count: channelCounts[c], cho: shGetChosungKey(c), en: shGetEnKey(c) }));

    const showToolbarAndIndex = counted.length > 8;
    if (toolbar) toolbar.style.display = showToolbarAndIndex ? '' : 'none';

    if (shChannelSortMode === 'alpha') counted.sort((a, b) => a.label.localeCompare(b.label, 'ko'));
    else if (shChannelSortMode === 'en') counted.sort((a, b) => a.label.localeCompare(b.label, 'en'));
    else counted.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ko'));

    const indexField = shChannelSortMode === 'en' ? 'en' : 'cho';
    const indexKeyList = shChannelSortMode === 'en' ? SH_EN_KEYS : SH_CHOSUNG_KEYS;
    if (chosungRow) {
        if (showToolbarAndIndex && (shChannelSortMode === 'alpha' || shChannelSortMode === 'en')) {
            const presentKeys = new Set(counted.map(o => o[indexField]));
            const keys = ['전체'].concat(indexKeyList.filter(k => presentKeys.has(k)));
            chosungRow.innerHTML = keys.map(k => {
                const isActive = k === shChannelChosung;
                const displayLabel = k === '#' ? '기타' : k;
                return `<button type="button" class="afd-cho-btn ${isActive ? 'active' : ''}" onclick="shSetChannelChosung('${k}')">${displayLabel}</button>`;
            }).join('');
            chosungRow.classList.remove('is-hidden');
            chosungRow.style.display = 'flex';
        } else {
            chosungRow.classList.add('is-hidden');
            chosungRow.style.display = 'none';
            chosungRow.innerHTML = '';
        }
    }

    let visible = counted;
    if ((shChannelSortMode === 'alpha' || shChannelSortMode === 'en') && shChannelChosung !== '전체') {
        visible = counted.filter(o => o[indexField] === shChannelChosung);
    }

    if (topicBox) {
        topicBox.innerHTML = visible.length ? visible.map(o => `
            <button class="afd-chip ${shChannelFilters.has(o.label) ? 'active' : ''}" onclick="shToggleChannel('${shEscapeAttr(o.label)}'); shRenderDrawer(); shRenderGrid('shMediaGrid','media');">
                ${shChannelFilters.has(o.label) ? checkSVG : ''} ${shEscapeHtml(o.label)} <span class="afd-chip-count">${o.count}</span>
            </button>
        `).join('') : `<span style="font-size:13px; color:var(--text-muted);">해당 자음/영문으로 시작하는 채널이 없습니다.</span>`;
    }
    if (topicCount) topicCount.innerHTML = `선택됨 <b style="color:var(--c-accent);">${shChannelFilters.size}</b> / ${counted.length}`;
}

function shSetChannelSortMode(mode) {
    shChannelSortMode = mode;
    shChannelChosung = '전체';
    const popBtn = document.getElementById('shAfdSortPopular');
    const alphaBtn = document.getElementById('shAfdSortAlpha');
    const enBtn = document.getElementById('shAfdSortEn');
    if (popBtn) popBtn.classList.toggle('active', mode === 'popular');
    if (alphaBtn) alphaBtn.classList.toggle('active', mode === 'alpha');
    if (enBtn) enBtn.classList.toggle('active', mode === 'en');
    shRenderDrawer();
}
function shSetChannelChosung(key) { shChannelChosung = key; shRenderDrawer(); }

function shToggleChannel(channel) {
    if (shChannelFilters.has(channel)) shChannelFilters.delete(channel);
    else shChannelFilters.add(channel);
}

function shRemoveActiveFilter(type, val) {
    if (type === 'tag') shSetFilter('media', 'all');
    else if (type === 'channel') shToggleChannel(val);
    shRenderDrawer();
    shRenderGrid('shMediaGrid', 'media');
}

function shClearAllFilters() {
    shState.media = 'all';
    shChannelFilters.clear();
    shChannelChosung = '전체';
    shRenderTagCol('shMediaTagCol', 'media');
    shRenderDrawer();
    shRenderGrid('shMediaGrid', 'media');
}

let shActiveSideTab = 'playlist';
let shCommentsLoadedForVid = null;

function shSwitchSideTab(tab) {
    shActiveSideTab = tab;
    const map = {
        playlist: ['shTabPlaylistBtn', 'shModalPlaylistList'],
        comments: ['shTabCommentsBtn', 'shCommentPanel'],
        chat:     ['shTabChatBtn', 'shLiveChatPanel']
    };
    Object.keys(map).forEach(key => {
        const [btnId, panelId] = map[key];
        const btn = document.getElementById(btnId);
        const panel = document.getElementById(panelId);
        if (btn) btn.classList.toggle('active', key === tab);
        if (panel) panel.style.display = (key === tab) ? (key === 'playlist' ? '' : 'flex') : 'none';
    });

    const item = shCurrentItem();
    if (!item) return;

    if (tab === 'comments') shLoadComments(shGetCommentOrder());
    if (tab === 'chat' && typeof veRenderLiveChat === 'function') veRenderLiveChat('shLiveChatPanel', item.vid);
}

function shCurrentItem() {
    const list = shListCache[shModalScope] || [];
    return list[shModalIndex] || null;
}

function shOpenMobileSheet() {
    const panel = document.querySelector('.sh-modal-playlist');
    if (panel) panel.classList.add('mobile-open');
    shSwitchSideTab('comments');
}

function shCloseMobileSheet() {
    const panel = document.querySelector('.sh-modal-playlist');
    if (panel) panel.classList.remove('mobile-open');
}

function shCommentEscapeHtml(str) {
    return String(str || '').replace(/[&<>'"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[m]));
}

function shGetCommentOrder() {
    return typeof veGetCommentOrder === 'function' ? veGetCommentOrder('shCommentList') : 'relevance';
}

function shLoadComments(order) {
    const item = shCurrentItem();
    if (!item || typeof veLoadComments !== 'function') return;

    const bar = document.getElementById('shCommentSortBar');
    if (bar) {
        if (!bar.querySelector('.ve-comment-sortbar')) {
            bar.innerHTML = veCommentSortBarHtml('shCommentList', 'shSetCommentOrder');
        }
        veUpdateSortBar(bar, order);
    }

    veLoadComments({
        vid: item.vid,
        listId: 'shCommentList',
        order: order,
        onCount: (n) => {
            const countEl = document.getElementById('shModalCommentCount');
            const fabCountEl = document.getElementById('shMobileCommentCount');
            if (countEl) countEl.textContent = n;
            if (fabCountEl) fabCountEl.textContent = n;
        }
    });
}

function shSetCommentOrder(order) {
    shLoadComments(order);
}

function shFetchComments(vid) {
    shLoadComments(shGetCommentOrder());
}

function shSetupExtras(item) {
    const bar = document.getElementById('shModalActions');
    if (bar && typeof veRenderActionBar === 'function') {
        bar.dataset.title = item.title || '';
        veRenderActionBar('shModalActions', item.vid, item.title);
    }
    if (typeof veResetComments === 'function') veResetComments('shCommentList');
    if (typeof veClearLiveChat === 'function') veClearLiveChat('shLiveChatPanel');

    const chatBtn = document.getElementById('shTabChatBtn');
    if (chatBtn) {
        chatBtn.classList.add('is-hidden');
        if (typeof veCheckLive === 'function') {
            veCheckLive(item.vid, false).then(isLive => {
                const cur = shCurrentItem();
                if (!cur || cur.vid !== item.vid) return;
                chatBtn.classList.toggle('is-hidden', !isLive);
            });
        }
    }
}
