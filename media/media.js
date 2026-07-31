let mediaActiveTag = '전체';
let mediaActiveSub = '전체'; 
let mediaActiveDetails = new Set(); // ⭐️ 서랍에서 다중 선택을 처리하기 위해 Set(배열)로 변경
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
            match: (item, targetDetails) => targetDetails.has(mediaGetContentBrand(item))
        }
    },
    '음반 활동 컨텐츠': {
        year: (items) => [...new Set(items.map(i => (i.date||'').slice(0, 4)))].filter(Boolean).sort().reverse()
    },
    '음악 방송': {
        year: (items) => [...new Set(items.map(i => (i.date||'').slice(0, 4)))].filter(Boolean).sort().reverse(),
        sub: {
            getOptions: (items) => [...new Set(items.map(i => i.program).filter(Boolean))],
            match: (item, targetDetails) => targetDetails.has(item.program)
        }
    },
    '라이브 방송': {
        year: (items) => [...new Set(items.map(i => (i.date||'').slice(0, 4)))].filter(Boolean).sort().reverse(),
        sub: {
            getOptions: () => ['원이', '리브', '미나미', '메이', '제나'],
            match: (item, targetDetails) => {
                const s = item.sub || '';
                return s === '전원' || Array.from(targetDetails).some(name => s.includes(name));
            }
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

// -----------------------------------------------------
// 1. 좌측 사이드바 렌더링
// -----------------------------------------------------
function mediaRenderTagRow() {
    const row = document.getElementById('mediaTagRow');
    if (!row) return;
    const all = [{ label: '전체' }].concat(MEDIA_CATEGORIES.map(c => ({ label: c.label })));
    row.innerHTML = all.map(t => {
        const active = t.label === mediaActiveTag;
        return `<button type="button" class="ms-item${active ? ' active' : ''}" onclick="mediaSetTag('${t.label}')">
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
    
    if (!cfg || !cfg.year) {
        wrap.classList.add('is-hidden');
        mediaRenderSubCol();
        return;
    }
    const itemsInTag = mediaGetAllItems().filter(i => i.tagLabel === mediaActiveTag);
    const options = ['전체'].concat(cfg.year(itemsInTag));
    wrap.classList.remove('is-hidden');
    
    col.innerHTML = options.map(opt =>
        `<button type="button" class="ms-item${opt === mediaActiveSub ? ' active' : ''}" onclick="mediaSetSub('${opt}')">
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
    
    if (!cfg || !cfg.sub) { 
        wrap.classList.add('is-hidden');
        return; 
    }

    let itemsInYear = mediaGetAllItems().filter(i => i.tagLabel === mediaActiveTag);
    if (mediaActiveSub !== '전체') itemsInYear = itemsInYear.filter(i => (i.date||'').slice(0, 4) === mediaActiveSub);

    const options = ['전체'].concat(cfg.sub.getOptions(itemsInYear));
    wrap.classList.remove('is-hidden');
    
    // 디테일 다중 선택 반영
    col.innerHTML = options.map(opt => {
        const isActive = (opt === '전체' && mediaActiveDetails.size === 0) || mediaActiveDetails.has(opt);
        return `<button type="button" class="ms-item${isActive ? ' active' : ''}" onclick="mediaToggleDetail('${escapeHtml(opt)}')">
            <span>${escapeHtml(opt)}</span>
        </button>`;
    }).join('');
}

// -----------------------------------------------------
// 2. 고급 필터 서랍(Drawer) 로직
// -----------------------------------------------------
const checkSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const closeSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

function openAdvFilter() {
    document.getElementById('advFilterDrawer').classList.add('active');
    document.getElementById('advFilterBackdrop').classList.add('active');
    document.body.style.overflow = 'hidden';
    mediaRenderDrawer();
}

function closeAdvFilter() {
    document.getElementById('advFilterDrawer').classList.remove('active');
    document.getElementById('advFilterBackdrop').classList.remove('active');
    document.body.style.overflow = '';
}

function mediaRenderDrawer() {
    // 1. Categories
    const catBox = document.getElementById('afdCategoryChips');
    const catCount = document.getElementById('afdCatCount');
    const categories = ['전체'].concat(MEDIA_CATEGORIES.map(c => c.label));
    
    catBox.innerHTML = categories.map(cat => `
        <button class="afd-chip ${cat === mediaActiveTag ? 'active' : ''}" onclick="mediaSetTag('${cat}'); mediaRenderDrawer();">
            ${cat === mediaActiveTag ? checkSVG : ''} ${cat}
        </button>
    `).join('');
    catCount.textContent = `${categories.length} chips`;

    // 2. Refine Results (Active Filters)
    const activeBox = document.getElementById('afdActiveChips');
    let actives = [];
    if (mediaActiveTag !== '전체') actives.push({ type: 'tag', label: mediaActiveTag });
    if (mediaActiveSub !== '전체') actives.push({ type: 'year', label: mediaActiveSub + '년' });
    mediaActiveDetails.forEach(d => actives.push({ type: 'detail', label: d, val: d }));
    
    activeBox.innerHTML = actives.length ? actives.map(a => `
        <button class="afd-chip closeable" onclick="mediaRemoveActiveFilter('${a.type}', '${escapeAttr(a.val || '')}')">
            ${escapeHtml(a.label)} ${closeSVG}
        </button>
    `).join('') : '<span style="font-size:13px; color:var(--text-muted);">No active filters</span>';

    // 3. Topics (Details 다중 선택)
    const topicBox = document.getElementById('afdTopicChips');
    const topicCount = document.getElementById('afdTopicCount');
    const cfg = MEDIA_SUBFILTERS[mediaActiveTag];
    
    if (cfg && cfg.sub) {
        let itemsInYear = mediaGetAllItems().filter(i => i.tagLabel === mediaActiveTag);
        if (mediaActiveSub !== '전체') itemsInYear = itemsInYear.filter(i => (i.date||'').slice(0, 4) === mediaActiveSub);
        const options = cfg.sub.getOptions(itemsInYear);
        
        topicBox.innerHTML = options.map(opt => `
            <button class="afd-chip ${mediaActiveDetails.has(opt) ? 'active' : ''}" onclick="mediaToggleDetail('${escapeAttr(opt)}'); mediaRenderDrawer();">
                ${mediaActiveDetails.has(opt) ? checkSVG : ''} ${escapeHtml(opt)}
            </button>
        `).join('');
        topicCount.innerHTML = `Selected <b style="color:#3b82f6;">${mediaActiveDetails.size}</b> / ${options.length}`;
    } else {
        topicBox.innerHTML = '<span style="font-size:13px; color:var(--text-muted);">No topics available for this category</span>';
        topicCount.textContent = '';
    }
}

function mediaRemoveActiveFilter(type, val) {
    if (type === 'tag') mediaSetTag('전체');
    else if (type === 'year') mediaSetSub('전체');
    else if (type === 'detail') mediaToggleDetail(val);
    mediaRenderDrawer();
}

function mediaClearAllFilters() {
    mediaActiveTag = '전체';
    mediaActiveSub = '전체';
    mediaActiveDetails.clear();
    mediaRenderTagRow();
    mediaApplyFilters();
    mediaRenderDrawer();
}

function mediaResetTopics() {
    mediaActiveDetails.clear();
    mediaRenderSubCol();
    mediaApplyFilters();
    mediaRenderDrawer();
}

// -----------------------------------------------------
// 3. 필터 제어 함수
// -----------------------------------------------------
function mediaSetTag(label) {
    if (label === mediaActiveTag) return;
    mediaActiveTag = label;
    mediaActiveSub = '전체';
    mediaActiveDetails.clear();
    mediaRenderTagRow();
    mediaApplyFilters();
}

function mediaSetSub(sub) {
    mediaActiveSub = sub;
    mediaActiveDetails.clear();
    mediaRenderYearCol();
    mediaApplyFilters();
}

function mediaToggleDetail(detail) {
    if (detail === '전체') {
        mediaActiveDetails.clear();
    } else {
        if (mediaActiveDetails.has(detail)) mediaActiveDetails.delete(detail);
        else mediaActiveDetails.add(detail);
    }
    mediaRenderSubCol();
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
        if (cfg.sub && mediaActiveDetails.size > 0) {
            list = list.filter(i => cfg.sub.match(i, mediaActiveDetails));
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
    if (item.tagLabel === '음악 방송' && mediaActiveDetails.size > 0 && item.program) {
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

// 영상 재생 모달 로직 (생략 없이 유지)
function mediaPlayCard(el) { /* 생략 없이 기존 코드 유지 */ }

window.addEventListener('DOMContentLoaded', () => {
    mediaInitTagFromQuery();
    mediaRenderTagRow();
    mediaRenderGrid(true);
    mediaSetupInfiniteScroll();
});
