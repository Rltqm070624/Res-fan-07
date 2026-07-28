/* ==========================================================================
   ⭐️ 홈 "LATEST UPDATES" — 카테고리별 최신 영상 1개 + 더보기 (모달 없음, 클릭 시 그 자리에서 재생)
   - 데이터 소스: js/contents_data.js(CONTENTS_DATA), js/album_content_data.js(ALBUM_CONTENT_DATA),
     js/music_show_data.js(MUSIC_SHOW_DATA)
   - "더보기" → media/media.html?tag=카테고리 로 이동 (전체 목록 페이지)
   ========================================================================== */

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
            <div class="media-cat-thumb" data-vid="${latest.vid}" data-title="${escapeAttr(latest.title)}" onclick="playMediaCardEl(this)">
                <img src="${ytThumb(latest.vid)}" alt="${escapeAttr(latest.title)}" loading="lazy">
                <button type="button" class="mc-play" aria-label="재생"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>
            </div>
            <div class="media-cat-info">
                <div class="mc-title">${escapeHtml(latest.title)}</div>
                <div class="mc-sub">${latest.sub ? escapeHtml(latest.sub) + ' · ' : ''}${latest.date}</div>
            </div>
            <a class="media-cat-more" href="media/media.html?tag=${cat.key}">더보기 →</a>
        </div>`;
    });

    grid.innerHTML = html || '<div class="media-empty">등록된 영상이 없어요.</div>';
}

function playMediaCardEl(el) {
    if (el.classList.contains('is-playing')) return;
    const vid = el.dataset.vid;
    const title = el.dataset.title || '';
    el.classList.add('is-playing');
    el.innerHTML = `<iframe src="https://www.youtube.com/embed/${vid}?autoplay=1" title="${escapeAttr(title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
}

window.addEventListener('DOMContentLoaded', () => {
    try { renderLatestMedia(); } catch (e) { console.error('renderLatestMedia 실패:', e); }
});
