let mediaActiveTag = '전체';
let mediaActiveSub = '전체';
let mediaActiveSub2 = '전체';
let mediaSortField = 'date'; // 'date' | 'name'
let mediaSortDir = 'desc';   // 'desc' | 'asc'
let mediaSearchTerm = '';
let mediaVisibleCount = 24;
const MEDIA_PAGE_SIZE = 24;

// 대분류별 소분류(서브탭) 정의. 라이브 방송은 멤버(소분류) > 연도(세분류) 2단계까지 있음
const MEDIA_SUBFILTERS = {
    '음악 방송': {
        getOptions: (items) => [...new Set(items.map(i => i.program).filter(Boolean))],
        match: (item, sub) => item.program === sub
    },
    '라이브 방송': {
        getOptions: () => ['원이', '리브', '미나미', '메이', '제나'],
        match: (item, sub) => item.sub === '전원' || (item.sub || '').includes(sub),
        third: {
            getOptions: (items) => [...new Set(items.map(i => i.date.slice(0, 4)))].sort().reverse(),
            match: (item, sub2) => item.date.slice(0, 4) === sub2
        }
    },
    '공연 및 행사': {
        getOptions: (items) => [...new Set(items.map(i => i.date.slice(0, 4)))].sort().reverse(),
        match: (item, sub) => item.date.slice(0, 4) === sub
    }
};

function mediaGetAllItems() {
    let all = [];
    MEDIA_CATEGORIES.forEach(cat => {
        cat.getItems().forEach(item => all.push(Object.assign({ tagKey: cat.key, tagLabel: cat.label, tagColor: cat.color }, item)));
    });
    return all;
}

function mediaInitTagFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const tagKey = params.get('tag');
    if (tagKey) {
        const found = MEDIA_CATEGORIES.find(c => c.key === tagKey);
        if (found) mediaActiveTag = found.label;
    }
}

function mediaRenderTagRow() {
    const row = document.getElementById('mediaTagRow');
    if (!row) return;
    const all = [{ label: '전체', color: null }].concat(MEDIA_CATEGORIES.map(c => ({ label: c.label, color: c.color })));
    row.innerHTML = all.map(t => {
        const active = t.label === mediaActiveTag;
        const style = t.color ? `style="--chip-color:${t.color};"` : '';
        const hasSub = !!MEDIA_SUBFILTERS[t.label];
        const arrow = hasSub ? `<svg class="mt-chip-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>` : '';
        return `<button type="button" class="mt-chip${active ? ' active' : ''}" ${style} onclick="mediaSetTag('${t.label}')">${t.label}${arrow}</button>`;
    }).join('');
}

function mediaRenderSubtagRow() {
    const row = document.getElementById('mediaSubtagRow');
    if (!row) return;
    const cfg = MEDIA_SUBFILTERS[mediaActiveTag];
    if (!cfg) {
        row.innerHTML = '';
        mediaSetSubPanelOpen(false);
        mediaRenderSubtag2Row();
        return;
    }

    const itemsInTag = mediaGetAllItems().filter(i => i.tagLabel === mediaActiveTag);
    const options = ['전체'].concat(cfg.getOptions(itemsInTag));
    row.innerHTML = options.map(opt =>
        `<button type="button" class="mst-chip${opt === mediaActiveSub ? ' active' : ''}" onclick="mediaSetSub('${opt}')">${opt}</button>`
    ).join('');
    mediaRenderSubtag2Row();
    mediaSetSubPanelOpen(true);
}

function mediaRenderSubtag2Row() {
    const row = document.getElementById('mediaSubtag2Row');
    if (!row) return;
    const cfg = MEDIA_SUBFILTERS[mediaActiveTag];
    if (!cfg || !cfg.third) { row.innerHTML = ''; row.style.display = 'none'; mediaRefreshSubPanelHeight(); return; }

    // 소분류까지 적용된 상태에서 세분류(연도) 옵션 추출
    let itemsInSub = mediaGetAllItems().filter(i => i.tagLabel === mediaActiveTag);
    if (mediaActiveSub !== '전체') itemsInSub = itemsInSub.filter(i => cfg.match(i, mediaActiveSub));

    const options = ['전체'].concat(cfg.third.getOptions(itemsInSub));
    row.style.display = 'flex';
    row.innerHTML = options.map(opt =>
        `<button type="button" class="mst2-chip${opt === mediaActiveSub2 ? ' active' : ''}" onclick="mediaSetSub2('${opt}')">${opt}</button>`
    ).join('');
    mediaRefreshSubPanelHeight();
}

/* ⭐️ 하위 분류 트리 아코디언 — 대분류 클릭 시 아래로 펼쳐짐/접힘 */
function mediaSetSubPanelOpen(open) {
    const panel = document.getElementById('mediaSubPanel');
    if (!panel) return;
    if (open) {
        panel.classList.add('open');
        requestAnimationFrame(() => { panel.style.maxHeight = panel.scrollHeight + 'px'; });
    } else {
        panel.style.maxHeight = '0px';
        panel.classList.remove('open');
    }
}
function mediaRefreshSubPanelHeight() {
    const panel = document.getElementById('mediaSubPanel');
    if (!panel || !panel.classList.contains('open')) return;
    panel.style.maxHeight = panel.scrollHeight + 'px';
}
window.addEventListener('resize', () => mediaRefreshSubPanelHeight());

function mediaSetTag(label) {
    mediaActiveTag = label;
    mediaActiveSub = '전체';
    mediaActiveSub2 = '전체';
    mediaRenderTagRow();
    mediaRenderSubtagRow();
    mediaApplyFilters();
}

function mediaSetSub(sub) {
    mediaActiveSub = sub;
    mediaActiveSub2 = '전체';
    mediaRenderSubtagRow();
    mediaApplyFilters();
}

function mediaSetSub2(sub2) {
    mediaActiveSub2 = sub2;
    mediaRenderSubtag2Row();
    mediaApplyFilters();
}

function mediaSetSort(field, dir) {
    mediaSortField = field;
    mediaSortDir = dir;
    document.querySelectorAll('.msort-btn').forEach(b => b.classList.remove('active'));
    const id = field === 'date' ? (dir === 'desc' ? 'sortDateNew' : 'sortDateOld') : (dir === 'asc' ? 'sortNameAsc' : 'sortNameDesc');
    const btn = document.getElementById(id);
    if (btn) btn.classList.add('active');
    mediaApplyFilters();
}

function mediaClearSearch() {
    const input = document.getElementById('mediaSearch');
    if (input) input.value = '';
    mediaApplyFilters();
}

function mediaApplyFilters() {
    const input = document.getElementById('mediaSearch');
    mediaSearchTerm = (input && input.value || '').trim().toLowerCase();
    const clearBtn = document.getElementById('mediaSearchClear');
    if (clearBtn) clearBtn.classList.toggle('show', !!mediaSearchTerm);
    mediaVisibleCount = MEDIA_PAGE_SIZE;
    mediaRenderGrid(true);
}

function mediaGetFiltered() {
    let list = mediaGetAllItems();
    if (mediaActiveTag !== '전체') list = list.filter(i => i.tagLabel === mediaActiveTag);

    const cfg = MEDIA_SUBFILTERS[mediaActiveTag];
    if (cfg && mediaActiveSub !== '전체') list = list.filter(i => cfg.match(i, mediaActiveSub));
    if (cfg && cfg.third && mediaActiveSub2 !== '전체') list = list.filter(i => cfg.third.match(i, mediaActiveSub2));

    if (mediaSearchTerm) {
        list = list.filter(i => ((i.title || '') + ' ' + (i.sub || '')).toLowerCase().includes(mediaSearchTerm));
    }

    if (mediaSortField === 'name') {
        list.sort((a, b) => {
            const an = mediaCardTitle(a) || '';
            const bn = mediaCardTitle(b) || '';
            const cmp = an.localeCompare(bn, 'ko');
            return mediaSortDir === 'asc' ? cmp : -cmp;
        });
    } else {
        list.sort((a, b) => mediaSortDir === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
    }
    return list;
}

function mediaCardTitle(item) {
    // ⭐️ 음악방송에서 프로그램을 특정해서 골랐으면, 카드 제목엔 이미 아는 프로그램명 대신 곡명만
    if (item.tagLabel === '음악 방송' && mediaActiveSub !== '전체' && item.program) {
        return item.title.replace(`${item.program} · `, '');
    }
    return item.title;
}

function mediaCardHtml(item, idx) {
    const title = mediaCardTitle(item);
    return `<div class="media-card">
        <div class="media-card-thumb" data-index="${idx}" onclick="mediaPlayCard(this)">
            <img src="${ytThumb(item.vid)}" alt="${escapeAttr(title)}" loading="lazy" onerror="this.closest('.media-card').style.display='none'">
            <button type="button" class="mc-play" aria-label="재생"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>
            <span class="media-card-tag" style="background:${item.tagColor}e6;">${escapeHtml(item.tagLabel)}</span>
        </div>
        <div class="media-card-info">
            <div class="mc-title">${escapeHtml(title)}</div>
            <div class="mc-sub">${item.sub ? escapeHtml(item.sub) + ' · ' : ''}${item.date}</div>
        </div>
    </div>`;
}

function mediaUpdateResultCount(shown, total) {
    const el = document.getElementById('mediaResultCount');
    if (el) el.innerHTML = total ? `<b>${shown}</b> / ${total}개` : '';
}

function mediaRenderGrid(reset) {
    const grid = document.getElementById('mediaGrid');
    const endMsg = document.getElementById('mediaEndMessage');
    if (!grid) return;

    const filtered = mediaGetFiltered();

    if (!filtered.length) {
        grid.innerHTML = '<div class="media-empty">검색 결과가 없어요.</div>';
        if (endMsg) endMsg.style.display = 'none';
        mediaUpdateResultCount(0, 0);
        return;
    }

    if (reset) grid.innerHTML = '';
    const start = reset ? 0 : grid.querySelectorAll('.media-card').length;
    const end = Math.min(mediaVisibleCount, filtered.length);
    if (start < end) {
        const slice = filtered.slice(start, end);
        grid.insertAdjacentHTML('beforeend', slice.map((item, i) => mediaCardHtml(item, start + i)).join(''));
    }

    mediaUpdateResultCount(Math.min(mediaVisibleCount, filtered.length), filtered.length);
    if (endMsg) endMsg.style.display = (mediaVisibleCount >= filtered.length) ? 'block' : 'none';
}

/* ⭐️ 무한 스크롤 — 하단 감지 지점이 보이면 자동으로 다음 페이지 로드 (더 불러오기 버튼 없음) */
let mediaInfiniteObserver = null;
function mediaSetupInfiniteScroll() {
    const sentinel = document.getElementById('mediaSentinel');
    if (!sentinel || !('IntersectionObserver' in window)) return;
    mediaInfiniteObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const filtered = mediaGetFiltered();
            if (mediaVisibleCount >= filtered.length) return;
            mediaVisibleCount += MEDIA_PAGE_SIZE;
            mediaRenderGrid(false);
        });
    }, { rootMargin: '600px 0px' });
    mediaInfiniteObserver.observe(sentinel);
}

/* ==========================================================================
   ⭐️ 영상 재생 모달 — 제목/날짜 + 이전/다음 + 드래그 가능한 재생목록 시트
   ========================================================================== */
let mmPlaylist = [];
let mmIndex = -1;
let mmExpanded = false;

function mediaPlayCard(el) {
    const idx = parseInt(el.dataset.index, 10);
    mmPlaylist = mediaGetFiltered();
    mediaOpenModalAt(idx);
}

function mediaOpenModalAt(idx) {
    const modal = document.getElementById('mediaModal');
    const backdrop = document.getElementById('mediaModalBackdrop');
    if (!modal) return;
    modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
    mmSetExpanded(false);
    renderMmPlaylist();
    loadMmVideo(idx);
}

function loadMmVideo(index) {
    const item = mmPlaylist[index];
    if (!item) return;
    mmIndex = index;
    const modalMedia = document.getElementById('mediaModalMedia');
    const modalTitle = document.getElementById('mediaModalTitle');
    const modalDate = document.getElementById('mediaModalDate');
    const title = mediaCardTitle(item);
    if (modalMedia) modalMedia.innerHTML = `<iframe src="https://www.youtube.com/embed/${item.vid}?autoplay=1" title="${escapeAttr(title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    if (modalTitle) modalTitle.textContent = title;
    if (modalDate) modalDate.textContent = item.sub ? `${item.sub} · ${item.date}` : (item.date || '');
    updateMmNavButtons();
    highlightMmPlaylistActive();
}

function updateMmNavButtons() {
    const prevBtn = document.getElementById('mediaPrevBtn');
    const nextBtn = document.getElementById('mediaNextBtn');
    if (prevBtn) prevBtn.disabled = mmIndex <= 0;
    if (nextBtn) nextBtn.disabled = mmIndex >= mmPlaylist.length - 1;
}

function mediaPrev() { if (mmIndex > 0) loadMmVideo(mmIndex - 1); }
function mediaNext() { if (mmIndex < mmPlaylist.length - 1) loadMmVideo(mmIndex + 1); }

function renderMmPlaylist() {
    const listEl = document.getElementById('mmPlaylistList');
    const countEl = document.getElementById('mmPlaylistCount');
    if (countEl) countEl.textContent = mmPlaylist.length;
    if (!listEl) return;
    listEl.innerHTML = mmPlaylist.map((item, i) => {
        const title = mediaCardTitle(item);
        return `<li class="mm-playlist-item" data-idx="${i}" onclick="loadMmVideo(${i})">
            <span class="mm-playlist-index">${i + 1}</span>
            <div class="mm-playlist-thumb"><img src="${ytThumb(item.vid)}" alt="" loading="lazy"></div>
            <div class="mm-playlist-info">
                <div class="mm-playlist-title">${escapeHtml(title)}</div>
                <div class="mm-playlist-date">${item.sub ? escapeHtml(item.sub) + ' · ' : ''}${item.date}</div>
            </div>
        </li>`;
    }).join('');
}

function highlightMmPlaylistActive() {
    const listEl = document.getElementById('mmPlaylistList');
    if (!listEl) return;
    listEl.querySelectorAll('.mm-playlist-item').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.idx, 10) === mmIndex);
    });
    const activeEl = listEl.querySelector('.mm-playlist-item.active');
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function mmSetExpanded(state) {
    mmExpanded = state;
    const panel = document.getElementById('mediaModalPlaylist');
    if (panel) panel.classList.toggle('expanded', state);
}
function mmToggleExpanded() { mmSetExpanded(!mmExpanded); }

function mediaClosePlayer() {
    const modal = document.getElementById('mediaModal');
    const backdrop = document.getElementById('mediaModalBackdrop');
    const modalMedia = document.getElementById('mediaModalMedia');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    if (modalMedia) modalMedia.innerHTML = '';
    document.body.style.overflow = '';
}

/* 재생목록 시트 드래그 (마우스/터치 공용) — 위로 끌면 펼쳐지고, 아래로 끌면 접힘 */
(function initMmDrag() {
    let startY = 0, dragging = false, moved = false;
    function pointY(e) { return e.touches ? e.touches[0].clientY : e.clientY; }
    function onDown(e) { dragging = true; moved = false; startY = pointY(e); }
    function onMove(e) {
        if (!dragging) return;
        if (Math.abs(pointY(e) - startY) > 6) moved = true;
    }
    function onUp(e) {
        if (!dragging) return;
        dragging = false;
        const endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        const delta = startY - endY; // 양수 = 위로 드래그
        if (!moved) { mmToggleExpanded(); return; }
        if (delta > 20) mmSetExpanded(true);
        else if (delta < -20) mmSetExpanded(false);
    }
    document.addEventListener('DOMContentLoaded', () => {
        const handle = document.getElementById('mmDragHandle');
        if (!handle) return;
        handle.addEventListener('mousedown', onDown);
        handle.addEventListener('touchstart', onDown, { passive: true });
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchend', onUp);
    });
})();

window.addEventListener('DOMContentLoaded', () => {
    mediaInitTagFromQuery();
    mediaRenderTagRow();
    mediaRenderSubtagRow();
    mediaRenderGrid(true);
    mediaSetupInfiniteScroll();
    const badge = document.getElementById('mediaCountBadge');
    if (badge) badge.innerHTML = `총 <b>${mediaGetAllItems().length}</b>개`;
});
