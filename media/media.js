/* ==========================================================================
   ⭐️ MEDIA ARCHIVE 페이지 — 검색 + 태그 필터 + 정렬 + 더보기(페이지네이션) + 재생
   - MEDIA_CATEGORIES, ytThumb, escapeHtml, escapeAttr 는 js/contents.js 에 정의됨
   ========================================================================== */

let mediaActiveTag = '전체';
let mediaSort = 'new';
let mediaSearchTerm = '';
let mediaVisibleCount = 24;
const MEDIA_PAGE_SIZE = 24;

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
    const list = document.getElementById('mediaFilterList');
    if (!list) return;
    const all = mediaGetAllItems();
    const counts = {};
    all.forEach(i => { counts[i.tagLabel] = (counts[i.tagLabel] || 0) + 1; });

    const entries = [{ label: '전체', color: null, count: all.length }].concat(
        MEDIA_CATEGORIES.map(c => ({ label: c.label, color: c.color, count: counts[c.label] || 0 }))
    );

    list.innerHTML = entries.map(t => {
        const active = t.label === mediaActiveTag;
        const dot = t.color ? `<span class="mf-dot" style="background:${t.color};"></span>` : `<span class="mf-dot mf-dot-all"></span>`;
        return `<li><button type="button" class="mf-item${active ? ' active' : ''}" onclick="mediaSetTag('${t.label}')">${dot}<span class="mf-label">${t.label}</span><span class="mf-count">${t.count}</span></button></li>`;
    }).join('');
}

function mediaSetTag(label) {
    mediaActiveTag = label;
    mediaVisibleCount = MEDIA_PAGE_SIZE;
    mediaRenderTagRow();
    mediaApplyFilters();
}

function mediaSetSort(sort) {
    mediaSort = sort;
    document.querySelectorAll('#mediaSortRow .ms-btn').forEach(b => b.classList.toggle('active', b.dataset.sort === sort));
    mediaApplyFilters();
}

function mediaApplyFilters() {
    mediaSearchTerm = (document.getElementById('mediaSearch').value || '').trim().toLowerCase();
    mediaVisibleCount = MEDIA_PAGE_SIZE;
    mediaRenderGrid();
}

function mediaGetFiltered() {
    let list = mediaGetAllItems();
    if (mediaActiveTag !== '전체') list = list.filter(i => i.tagLabel === mediaActiveTag);
    if (mediaSearchTerm) {
        list = list.filter(i => ((i.title || '') + ' ' + (i.sub || '')).toLowerCase().includes(mediaSearchTerm));
    }
    list.sort((a, b) => mediaSort === 'new' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
    return list;
}

function mediaCardHtml(item) {
    return `<div class="media-card">
        <div class="media-card-thumb" data-vid="${item.vid}" data-title="${escapeAttr(item.title)}" onclick="mediaPlayCard(this)">
            <img src="${ytThumb(item.vid)}" alt="${escapeAttr(item.title)}" loading="lazy" onerror="this.closest('.media-card').style.display='none'">
            <button type="button" class="mc-play" aria-label="재생"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>
            <span class="media-card-tag" style="background:${item.tagColor}e6;">${escapeHtml(item.tagLabel)}</span>
        </div>
        <div class="media-card-info">
            <div class="mc-title">${escapeHtml(item.title)}</div>
            <div class="mc-sub">${item.sub ? escapeHtml(item.sub) + ' · ' : ''}${item.date}</div>
        </div>
    </div>`;
}

function mediaRenderGrid() {
    const grid = document.getElementById('mediaGrid');
    const loadMoreWrap = document.querySelector('.media-loadmore-wrap');
    if (!grid) return;

    const filtered = mediaGetFiltered();
    if (!filtered.length) {
        grid.innerHTML = '<div class="media-empty">검색 결과가 없어요.</div>';
        if (loadMoreWrap) loadMoreWrap.style.display = 'none';
        return;
    }

    const visible = filtered.slice(0, mediaVisibleCount);
    grid.innerHTML = visible.map(mediaCardHtml).join('');

    if (loadMoreWrap) loadMoreWrap.style.display = (filtered.length > mediaVisibleCount) ? 'flex' : 'none';
}

function mediaLoadMore() {
    mediaVisibleCount += MEDIA_PAGE_SIZE;
    mediaRenderGrid();
}

function mediaPlayCard(el) {
    const vid = el.dataset.vid;
    const title = el.dataset.title || '';
    const np = document.getElementById('mediaNowPlaying');
    const npMedia = document.getElementById('mediaNpMedia');
    const npTitle = document.getElementById('mediaNpTitle');
    const npSub = document.getElementById('mediaNpSub');
    if (!np || !npMedia) return;

    npMedia.innerHTML = `<iframe src="https://www.youtube.com/embed/${vid}?autoplay=1" title="${escapeAttr(title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    if (npTitle) npTitle.textContent = title;
    if (npSub) npSub.textContent = '';
    np.classList.add('show');
    np.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function mediaClosePlayer() {
    const np = document.getElementById('mediaNowPlaying');
    const npMedia = document.getElementById('mediaNpMedia');
    if (np) np.classList.remove('show');
    if (npMedia) npMedia.innerHTML = '';
}

window.addEventListener('DOMContentLoaded', () => {
    mediaInitTagFromQuery();
    mediaRenderTagRow();
    mediaRenderGrid();
    const badge = document.getElementById('mediaCountBadge');
    if (badge) badge.innerHTML = `총 <b>${mediaGetAllItems().length}</b>개`;
});
