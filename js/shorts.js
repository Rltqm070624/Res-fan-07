/* ⭐️ RESCENE SHORTS 렌더링 & 필터 & 모달 로직
   - 홈(index.html) 하단 "YOUTUBE SHORTS" 섹션 (가로 스크롤 + 상단 필터 칩)
   - media.html "쇼츠" 탭 (풀영상 탭과 동일하게 좌측 CATEGORY 사이드바 + 그리드)
   두 화면 모두 클릭 시 세로(9:16) 모달로 재생됩니다. */

const SHORTS_TAG_META = [
    { key: 'all',     label: '전체',   color: 'var(--c-accent)' },
    { key: 'rescene', label: '리센느', color: 'var(--c-accent)' },
    { key: 'woni',    label: '원이',   color: '#f4c95d' },
    { key: 'liv',     label: '리브',   color: '#6ec6ff' },
    { key: 'minami',  label: '미나미', color: '#2b99c4' },
    { key: 'may',     label: '메이',   color: '#ecd25b' },
    { key: 'zena',    label: '제나',   color: '#ff6b6b' }
];

// 화면(홈/미디어탭)별로 현재 선택된 필터와, 필터링된 목록을 각각 기억해둠
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

/* ---------------------------------------------------
   필터 UI — 홈: 상단 칩 / media.html: 좌측 CATEGORY 사이드바(풀영상 탭과 동일한 형태)
--------------------------------------------------- */
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

/* ---------------------------------------------------
   카드 HTML — 클릭하면 인라인 재생이 아니라 세로 모달을 엶
--------------------------------------------------- */
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

/* ---------------------------------------------------
   홈 화면: 가로 스크롤 줄 (최신순 최대 16개)
--------------------------------------------------- */
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

/* ---------------------------------------------------
   media.html 쇼츠 탭: 전체 그리드
--------------------------------------------------- */
function shRenderGrid(containerId, scope) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    const all = shGetAll().slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    let filtered = shFilterByTag(all, shState[scope]);

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

/* ---------------------------------------------------
   ⭐️ 쇼츠 재생 모달 (풀영상 모달과 동일 크기, 좌: 영상 / 우: 재생목록) — 홈/미디어 공용
--------------------------------------------------- */
let shModalScope = null;
let shModalIndex = -1;

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

    const media = document.getElementById('shModalMediaBox');
    const title = document.getElementById('shModalTitle');
    const sub = document.getElementById('shModalSub');
    if (media) {
        media.innerHTML = `<iframe src="https://www.youtube.com/embed/${item.vid}?autoplay=1"
            title="${shEscapeAttr(item.title)}" frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen></iframe>`;
    }
    if (title) title.textContent = item.title;
    if (sub) sub.textContent = `${item.channel ? item.channel + ' · ' : ''}${item.date || ''}`;

    const prevBtn = document.getElementById('shModalPrevBtn');
    const nextBtn = document.getElementById('shModalNextBtn');
    if (prevBtn) prevBtn.disabled = shModalIndex <= 0;
    if (nextBtn) nextBtn.disabled = shModalIndex >= list.length - 1;
    shModalHighlightPlaylistActive();
}

function shModalPrev() { if (shModalIndex > 0) shModalLoad(shModalIndex - 1); }
function shModalNext() {
    const list = shListCache[shModalScope] || [];
    if (shModalIndex < list.length - 1) shModalLoad(shModalIndex + 1);
}

function shModalClose() {
    const modal = document.getElementById('shModal');
    const backdrop = document.getElementById('shModalBackdrop');
    const media = document.getElementById('shModalMediaBox');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    if (media) media.innerHTML = '';
    document.body.style.overflow = '';
}

// 모바일: 영상 위에서 위/아래로 드래그(스와이프)하면 다음/이전 쇼츠로 이동
(function initShModalSwipe() {
    let startY = 0, dragging = false;
    function pointY(e) { return e.touches ? e.touches[0].clientY : e.clientY; }
    function onStart(e) { dragging = true; startY = pointY(e); }
    function onEnd(e) {
        if (!dragging) return;
        dragging = false;
        const endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        const delta = startY - endY; // 양수 = 위로 스와이프
        if (Math.abs(delta) < 40) return; // 살짝 스크롤/탭한 건 무시
        if (delta > 0) shModalNext(); else shModalPrev();
    }
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.sh-modal-media').forEach(el => {
            el.addEventListener('touchstart', onStart, { passive: true });
            el.addEventListener('touchend', onEnd);
        });
    });
})();

/* ---------------------------------------------------
   media.html 전용: 풀영상 / 쇼츠 탭 전환
--------------------------------------------------- */
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
        // 홈 화면(index.html)에만 존재하는 요소들
        if (document.getElementById('shHomeGrid')) {
            shRenderFilterChips('shHomeFilterRow', 'home');
            shRenderRow('shHomeGrid', 'home');
        }
        // media.html에만 존재하는 요소들
        if (document.getElementById('shMediaGrid')) {
            shRenderTagCol('shMediaTagCol', 'media');
            shRenderGrid('shMediaGrid', 'media');
            shInitMediaViewFromQuery();
        }
    } catch (e) {
        console.error('쇼츠 렌더링 실패:', e);
    }
});
