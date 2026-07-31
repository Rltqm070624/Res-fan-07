let mediaActiveTag = '전체';
let mediaActiveSub = '전체'; 
let mediaActiveSub2 = '전체'; 
let mediaSortField = 'date'; 
let mediaSortDir = 'desc';   
let mediaSearchTerm = '';
let mediaVisibleCount = 24;
const MEDIA_PAGE_SIZE = 24;

const MEDIA_AD_BRAND_KEYWORDS = [
    '서든어택', '카사베르디', '엘리트', 'CU', '도미노피자', '나랑드', 'I-SHA', 'Wish I-GIRL',
    'WINDANDSEA', 'WIND AND SEA', '프리티스킨', '김씨네과일', 'KREAM', '티오더', 'FC모바일', 'FC 모바일'
];
const MEDIA_AD_VID_BRAND_MAP = {
    '_RQjePTZ6EQ': '엘리트',
    '9i1cbplzxQM': '카사베르디',
    'rxoGhCuz_4w': '카사베르디',
    'hmF6PVJBhrc': '서든어택',
    'Fwq84AVqJ9k': 'FC모바일',
    'gaJlFzkZBNE': 'FC모바일'
};

function mediaGetContentBrand(item) {
    if (item.vid && MEDIA_AD_VID_BRAND_MAP[item.vid]) return MEDIA_AD_VID_BRAND_MAP[item.vid];
    const title = item.title || '';
    const hit = MEDIA_AD_BRAND_KEYWORDS.find(kw => title.includes(kw));
    if (hit) return hit;
    const channel = item.sub || item.channel;
    return channel && channel !== '유튜브 채널' ? channel : '기타';
}

const MEDIA_SUBFILTERS = {
    '컨텐츠': {
        year: (items) => [...new Set(items.map(i => (i.date||'').slice(0, 4)))].filter(Boolean).sort().reverse(),
        sub: {
            getOptions: (items) => [...new Set(items.map(mediaGetContentBrand))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'ko')),
            match: (item, sub2) => mediaGetContentBrand(item) === sub2
        }
    },
    '음반 활동 컨텐츠': {
        year: (items) => [...new Set(items.map(i => (i.date||'').slice(0, 4)))].filter(Boolean).sort().reverse()
    },
    '음악 방송': {
        year: (items) => [...new Set(items.map(i => (i.date||'').slice(0, 4)))].filter(Boolean).sort().reverse(),
        sub: {
            getOptions: (items) => [...new Set(items.map(i => i.program).filter(Boolean))],
            match: (item, sub2) => item.program === sub2
        }
    },
    '라이브 방송': {
        year: (items) => [...new Set(items.map(i => (i.date||'').slice(0, 4)))].filter(Boolean).sort().reverse(),
        sub: {
            getOptions: () => ['원이', '리브', '미나미', '메이', '제나'],
            match: (item, sub2) => item.sub === '전원' || (item.sub || '').includes(sub2)
        }
    },
    '공연 및 행사': {
        year: (items) => [...new Set(items.map(i => (i.date||'').slice(0, 4)))].filter(Boolean).sort().reverse()
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
        return `<button type="button" class="mf-row${active ? ' active' : ''}" ${style} onclick="mediaSetTag('${t.label}')">
            <span>${t.label}</span>
        </button>`;
    }).join('');
    mediaRenderYearCol();
}

function mediaRenderYearCol() {
    const col = document.getElementById('mediaYearCol');
    const wrap = document.getElementById('mediaYearColWrap');
    if (!col || !wrap) return;
    const cfg = MEDIA_SUBFILTERS[mediaActiveTag];
    
    // ⭐️ 레이아웃 유지를 위해 아예 삭제하지 않고 is-hidden 클래스로 제어
    if (!cfg) {
        wrap.classList.add('is-hidden');
        col.innerHTML = '';
        mediaRenderSubCol();
        return;
    }
    
    const itemsInTag = mediaGetAllItems().filter(i => i.tagLabel === mediaActiveTag);
    const options = ['전체'].concat(cfg.year(itemsInTag));
    wrap.classList.remove('is-hidden');
    
    col.innerHTML = options.map(opt =>
        `<button type="button" class="mf-row${opt === mediaActiveSub ? ' active' : ''}" onclick="mediaSetSub('${opt}')">
            <span>${opt === '전체' ? '전체' : opt + '년'}</span>
        </button>`
    ).join('');
    
    mediaRenderSubCol();
}

function mediaRenderSubCol() {
    const col = document.getElementById('mediaSubCol');
    const wrap = document.getElementById('mediaSubColWrap');
    if (!col || !wrap) return;
    const cfg = MEDIA_SUBFILTERS[mediaActiveTag];
    
    // ⭐️ 레이아웃 유지 (투명화)
    if (!cfg || !cfg.sub) { 
        wrap.classList.add('is-hidden');
        col.innerHTML = ''; 
        return; 
    }

    let itemsInYear = mediaGetAllItems().filter(i => i.tagLabel === mediaActiveTag);
    if (mediaActiveSub !== '전체') itemsInYear = itemsInYear.filter(i => (i.date||'').slice(0, 4) === mediaActiveSub);

    const options = ['전체'].concat(cfg.sub.getOptions(itemsInYear));
    wrap.classList.remove('is-hidden');
    
    // ⭐️ 수많은 항목을 렌더링하기 위해 드롭다운(Select) 형태로 렌더링
    col.innerHTML = `<select class="mf-select" onchange="mediaSetSub2(this.value)">
        ${options.map(opt => `<option value="${opt}" ${opt === mediaActiveSub2 ? 'selected' : ''}>${opt}</option>`).join('')}
    </select>`;
}

function mediaSetTag(label) {
    if (label === mediaActiveTag) return;
    mediaActiveTag = label;
    mediaActiveSub = '전체';
    mediaActiveSub2 = '전체';
    mediaRenderTagRow();
    mediaApplyFilters();
}

function mediaSetSub(sub) {
    mediaActiveSub = sub;
    mediaActiveSub2 = '전체';
    mediaRenderYearCol();
    mediaApplyFilters();
}

function mediaSetSub2(sub2) {
    mediaActiveSub2 = sub2;
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
    if (cfg) {
        if (mediaActiveSub !== '전체') {
            list = list.filter(i => (i.date || '').startsWith(mediaActiveSub));
        }
        if (cfg.sub && mediaActiveSub2 !== '전체') {
            list = list.filter(i => cfg.sub.match(i, mediaActiveSub2));
        }
    }

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
        list.sort((a, b) => mediaSortDir === 'desc' ? (b.date||'').localeCompare(a.date||'') : (a.date||'').localeCompare(b.date||''));
    }
    return list;
}

function mediaCardTitle(item) {
    if (item.tagLabel === '음악 방송' && mediaActiveSub2 !== '전체' && item.program) {
        return item.title.replace(`${item.program} · `, '');
    }
    return item.title;
}

function mediaCardHtml(item, idx) {
    const title = mediaCardTitle(item);
    let badgeColor = item.tagColor || 'var(--text-primary)';
    
    return `<div class="media-card">
        <div class="media-card-thumb" data-index="${idx}" onclick="mediaPlayCard(this)">
            <img src="${ytThumb(item.vid)}" alt="${escapeAttr(title)}" loading="lazy" onerror="this.closest('.media-card').style.display='none'">
            <button type="button" class="mc-play" aria-label="재생"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>
            <span class="media-card-tag" style="background:${badgeColor};">${escapeHtml(item.tagLabel)}</span>
        </div>
        <div class="media-card-info">
            <div class="mc-title">${escapeHtml(title)}</div>
            <div class="mc-sub">${item.sub ? escapeHtml(item.sub) + ' · ' : ''}${item.date}</div>
        </div>
    </div>`;
}

function mediaRenderGrid(reset) {
    const grid = document.getElementById('mediaGrid');
    const endMsg = document.getElementById('mediaEndMessage');
    if (!grid) return;

    const filtered = mediaGetFiltered();

    const countBadge = document.getElementById('mediaCountBadge');
    if (countBadge) countBadge.innerHTML = `검색결과 <b>${filtered.length}</b>개`;

    if (!filtered.length) {
        grid.innerHTML = '<div class="media-empty">검색 결과가 없어요.</div>';
        if (endMsg) endMsg.style.display = 'none';
        return;
    }

    if (reset) grid.innerHTML = '';
    const start = reset ? 0 : grid.querySelectorAll('.media-card').length;
    const end = Math.min(mediaVisibleCount, filtered.length);
    
    if (start < end) {
        const slice = filtered.slice(start, end);
        grid.insertAdjacentHTML('beforeend', slice.map((item, i) => mediaCardHtml(item, start + i)).join(''));
    }

    if (endMsg) endMsg.style.display = (mediaVisibleCount >= filtered.length) ? 'block' : 'none';
}

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
        const delta = startY - endY;
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
    mediaRenderGrid(true);
    mediaSetupInfiniteScroll();
});
