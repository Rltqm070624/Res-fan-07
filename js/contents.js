function ytThumb(vid) { return `https://img.youtube.com/vi/${vid}/hqdefault.jpg`; }

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
}

/* 카테고리 정의: 다른 페이지(media.html)에서도 그대로 재사용 */
const MEDIA_CATEGORIES = [
    {
        key: 'contents', label: '컨텐츠', color: '#9AA6FF',
        getItems: () => (typeof CONTENTS_DATA !== 'undefined' ? CONTENTS_DATA : [])
            .map(i => ({ date: i.date, title: i.title, sub: i.channel, vid: i.vid }))
    },
    {
        key: 'album', label: '음반 활동 컨텐츠', color: '#26c6da',
        getItems: () => (typeof ALBUM_CONTENT_DATA !== 'undefined' ? ALBUM_CONTENT_DATA : [])
            .map(i => ({ date: i.date, title: i.title, sub: '', vid: i.vid }))
    },
    {
        key: 'musicshow', label: '음악 방송', color: '#7e57c2',
        getItems: () => (typeof MUSIC_SHOW_DATA !== 'undefined' ? MUSIC_SHOW_DATA : [])
            .map(i => ({ date: i.date, title: `${i.program} · ${i.song}`, sub: i.broadcaster, program: i.program, vid: i.vid }))
    },
    {
        key: 'live', label: '라이브 방송', color: '#ec407a',
        getItems: () => (typeof LIVE_DATA !== 'undefined' ? LIVE_DATA : [])
            .map(i => ({ date: i.date, title: i.title, sub: i.cast, vid: i.vid }))
    },
    {
        key: 'event', label: '공연 및 행사', color: '#66bb6a',
        getItems: () => (typeof EVENT_DATA !== 'undefined' ? EVENT_DATA : [])
            .map(i => ({ date: i.date, title: i.title, sub: '', vid: i.vid }))
    }
];

function renderLatestMedia() {
    const grid = document.getElementById('latestMediaGrid');
    if (!grid) return;

    let html = '';
    MEDIA_CATEGORIES.forEach(cat => {
        const items = cat.getItems();
        if (!items.length) return;
        const latest = items.slice().sort((a, b) => b.date.localeCompare(a.date))[0];

        html += `
        <div class="media-cat-block">
            <div class="media-cat-tag" style="color:${cat.color}; border-color:${cat.color}66;">${cat.label}</div>
            <div class="media-cat-thumb" data-vid="${latest.vid}" data-title="${escapeAttr(latest.title)}" data-sub="${escapeAttr(latest.sub || '')}" data-date="${escapeAttr(latest.date || '')}" onclick="playMediaCardEl(this)">
                <img src="${ytThumb(latest.vid)}" alt="${escapeAttr(latest.title)}" loading="lazy">
                <button type="button" class="mc-play" aria-label="재생"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>
            </div>
            <div class="media-cat-info">
                <div class="mc-title">${escapeHtml(latest.title)}</div>
                <div class="mc-sub">${latest.sub ? escapeHtml(latest.sub) + ' · ' : ''}${latest.date}</div>
            </div>
        </div>`;
    });

    grid.innerHTML = html || '<div class="media-empty">등록된 영상이 없어요.</div>';
}

/* ---------------------------------------------------
   ⭐️ 홈 화면 풀영상 재생 모달 (media.html의 영상 모달과 동일한 구조/스타일 재사용)
--------------------------------------------------- */
let homeMmPlaylist = [];
let homeMmIndex = -1;
let homeMmExpanded = false;

function playMediaCardEl(el) {
    // 현재 그리드에 렌더링된 카드들을 순서대로 재생목록으로 사용 (이전/다음 탐색 가능하게)
    const grid = document.getElementById('latestMediaGrid');
    const cards = grid ? Array.from(grid.querySelectorAll('.media-cat-thumb')) : [el];
    homeMmPlaylist = cards.map(c => ({
        vid: c.dataset.vid,
        title: c.dataset.title || '',
        sub: c.dataset.sub || '',
        date: c.dataset.date || ''
    }));
    const idx = Math.max(0, cards.indexOf(el));
    homeOpenModalAt(idx);
}

function homeOpenModalAt(idx) {
    const modal = document.getElementById('mediaModal');
    const backdrop = document.getElementById('mediaModalBackdrop');
    if (!modal) return;
    modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
    homeMmSetExpanded(false);
    renderHomeMmPlaylist();
    homeLoadMmVideo(idx);
}

function homeLoadMmVideo(index) {
    const item = homeMmPlaylist[index];
    if (!item) return;
    homeMmIndex = index;
    const modalMedia = document.getElementById('mediaModalMedia');
    const modalTitle = document.getElementById('mediaModalTitle');
    const modalDate = document.getElementById('mediaModalDate');
    if (modalMedia) modalMedia.innerHTML = `<iframe src="https://www.youtube.com/embed/${item.vid}?autoplay=1" title="${escapeAttr(item.title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    if (modalTitle) modalTitle.textContent = item.title;
    if (modalDate) modalDate.textContent = item.sub ? `${item.sub} · ${item.date}` : (item.date || '');
    homeUpdateMmNavButtons();
    homeHighlightMmPlaylistActive();
}

function homeUpdateMmNavButtons() {
    const prevBtn = document.getElementById('mediaPrevBtn');
    const nextBtn = document.getElementById('mediaNextBtn');
    if (prevBtn) prevBtn.disabled = homeMmIndex <= 0;
    if (nextBtn) nextBtn.disabled = homeMmIndex >= homeMmPlaylist.length - 1;
}

function mediaPrev() { if (homeMmIndex > 0) homeLoadMmVideo(homeMmIndex - 1); }
function mediaNext() { if (homeMmIndex < homeMmPlaylist.length - 1) homeLoadMmVideo(homeMmIndex + 1); }

function renderHomeMmPlaylist() {
    const listEl = document.getElementById('mmPlaylistList');
    const countEl = document.getElementById('mmPlaylistCount');
    if (countEl) countEl.textContent = homeMmPlaylist.length;
    if (!listEl) return;
    listEl.innerHTML = homeMmPlaylist.map((item, i) => `
        <li class="mm-playlist-item" data-idx="${i}" onclick="homeLoadMmVideo(${i})">
            <span class="mm-playlist-index">${i + 1}</span>
            <div class="mm-playlist-thumb"><img src="${ytThumb(item.vid)}" alt="" loading="lazy"></div>
            <div class="mm-playlist-info">
                <div class="mm-playlist-title">${escapeHtml(item.title)}</div>
                <div class="mm-playlist-date">${item.sub ? escapeHtml(item.sub) + ' · ' : ''}${item.date}</div>
            </div>
        </li>`).join('');
}

function homeHighlightMmPlaylistActive() {
    const listEl = document.getElementById('mmPlaylistList');
    if (!listEl) return;
    listEl.querySelectorAll('.mm-playlist-item').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.idx, 10) === homeMmIndex);
    });
    const activeEl = listEl.querySelector('.mm-playlist-item.active');
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function homeMmSetExpanded(state) {
    homeMmExpanded = state;
    const panel = document.getElementById('mediaModalPlaylist');
    if (panel) panel.classList.toggle('expanded', state);
}
function mmToggleExpanded() { homeMmSetExpanded(!homeMmExpanded); }

function mediaClosePlayer() {
    const modal = document.getElementById('mediaModal');
    const backdrop = document.getElementById('mediaModalBackdrop');
    const modalMedia = document.getElementById('mediaModalMedia');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    if (modalMedia) modalMedia.innerHTML = '';
    document.body.style.overflow = '';
}

// 재생목록 드래그(펼치기/접기) — media.js의 동작과 동일
(function initHomeMmDrag() {
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
        const delta = startY - endY;
        if (!moved) { mmToggleExpanded(); return; }
        if (delta > 20) homeMmSetExpanded(true);
        else if (delta < -20) homeMmSetExpanded(false);
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
    try { renderLatestMedia(); } catch (e) { console.error('renderLatestMedia 실패:', e); }
});
