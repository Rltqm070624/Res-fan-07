function safeEscape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, match => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[match]);
}
function safeThumb(vid) {
    return typeof ytThumb === 'function' ? ytThumb(vid) : `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
}

// ⭐️ 데이터 및 제어 변수 초기화
let mediaActiveTag = '전체';
let mediaActiveSub = '전체'; 
let mediaActiveDetails = new Set();
let mediaYearClicked = false; // 년도가 클릭되어야 하위 메뉴가 열리게 하는 플래그
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

// ⭐️ 멤버 전역 필터링용 매핑
const memberAlias = {
    '원이': ['원이', 'wonee'],
    '리브': ['리브', 'liv'],
    '미나미': ['미나미', 'minami'],
    '메이': ['메이', 'mei'],
    '제나': ['제나', 'zena']
};

function mediaGetContentBrand(item) {
    if (item.vid && MEDIA_AD_VID_BRAND_MAP[item.vid]) return MEDIA_AD_VID_BRAND_MAP[item.vid];
    const title = item.title || '';
    const hit = MEDIA_AD_BRAND_KEYWORDS.find(kw => title.includes(kw));
    if (hit) return hit;
    const channel = item.sub || item.channel;
    return channel && channel !== '유튜브 채널' ? channel : '기타';
}

// ⭐️ "전원" 삭제 및 "멤버" 가상 카테고리 추가
const MEDIA_SUBFILTERS = {
    '멤버': {
        year: (items) => [...new Set(items.map(i => (i.date||'').slice(0, 4)))].filter(Boolean).sort().reverse(),
        sub: { getOptions: () => ['원이', '리브', '미나미', '메이', '제나'] }
    },
    '컨텐츠': {
        year: (items) => [...new Set(items.map(i => (i.date||'').slice(0, 4)))].filter(Boolean).sort().reverse(),
        sub: { getOptions: (items) => [...new Set(items.map(mediaGetContentBrand))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'ko')) }
    },
    '음반 활동 컨텐츠': {
        year: (items) => [...new Set(items.map(i => (i.date||'').slice(0, 4)))].filter(Boolean).sort().reverse()
    },
    '음악 방송': {
        year: (items) => [...new Set(items.map(i => (i.date||'').slice(0, 4)))].filter(Boolean).sort().reverse(),
        sub: { getOptions: (items) => [...new Set(items.map(i => i.program).filter(Boolean))] }
    },
    '라이브 방송': {
        year: (items) => [...new Set(items.map(i => (i.date||'').slice(0, 4)))].filter(Boolean).sort().reverse(),
        sub: { getOptions: () => ['원이', '리브', '미나미', '메이', '제나'] }
    },
    '공연 및 행사': {
        year: (items) => [...new Set(items.map(i => (i.date||'').slice(0, 4)))].filter(Boolean).sort().reverse()
    }
};

function mediaGetAllItems() {
    if (typeof MEDIA_CATEGORIES === 'undefined') return [];
    let all = [];
    MEDIA_CATEGORIES.forEach(cat => {
        cat.getItems().forEach(item => all.push(Object.assign({ tagKey: cat.key, tagLabel: cat.label, tagColor: cat.color }, item)));
    });
    return all;
}

// -----------------------------------------------------
// 1. 사이드바 (단일 선택 기반 렌더링)
// -----------------------------------------------------
function mediaInitTagFromQuery() {
    if (typeof MEDIA_CATEGORIES === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tagKey = params.get('tag');
    if (tagKey) {
        const found = MEDIA_CATEGORIES.find(c => c.key === tagKey);
        if (found) mediaActiveTag = found.label;
    }
}

function mediaRenderTagRow() {
    const row = document.getElementById('mediaTagRow');
    if (!row || typeof MEDIA_CATEGORIES === 'undefined') return;
    
    const all = ['전체', '멤버'].concat(MEDIA_CATEGORIES.map(c => c.label));
    row.innerHTML = all.map(label => {
        const active = label === mediaActiveTag;
        return `<button type="button" class="ms-item${active ? ' active' : ''}" onclick="mediaSetTag('${safeEscape(label)}')">
            <span>${safeEscape(label)}</span>
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
    
    let itemsInTag = mediaGetAllItems();
    if (mediaActiveTag !== '전체' && mediaActiveTag !== '멤버') {
        itemsInTag = itemsInTag.filter(i => i.tagLabel === mediaActiveTag);
    }
    
    const options = ['전체'].concat(cfg.year(itemsInTag));
    wrap.classList.remove('is-hidden');
    
    col.innerHTML = options.map(opt =>
        `<button type="button" class="ms-item${opt === mediaActiveSub ? ' active' : ''}" onclick="mediaSetSub('${safeEscape(opt)}')">
            <span>${opt === '전체' ? '전체' : safeEscape(opt) + '년'}</span>
        </button>`
    ).join('');
    
    mediaRenderSubCol();
}

function mediaRenderSubCol() {
    const col = document.getElementById('mediaSubCol');
    const wrap = document.getElementById('mediaSubColWrap');
    if (!col || !wrap) return;
    
    const cfg = MEDIA_SUBFILTERS[mediaActiveTag];
    
    // ⭐️ 조건: 카테고리가 없거나 옵션이 없거나, 년도를 누르지 않은 상태면 숨김
    if (!cfg || !cfg.sub || !mediaYearClicked) { 
        wrap.classList.add('is-hidden');
        return; 
    }

    let itemsInYear = mediaGetAllItems();
    if (mediaActiveTag !== '전체' && mediaActiveTag !== '멤버') {
        itemsInYear = itemsInYear.filter(i => i.tagLabel === mediaActiveTag);
    }
    if (mediaActiveSub !== '전체') {
        itemsInYear = itemsInYear.filter(i => (i.date||'').slice(0, 4) === mediaActiveSub);
    }

    const options = ['전체'].concat(cfg.sub.getOptions(itemsInYear));
    wrap.classList.remove('is-hidden');
    
    col.innerHTML = options.map(opt => {
        // 사이드바 UI 상에서의 활성화 여부
        const isActive = (opt === '전체' && mediaActiveDetails.size === 0) || mediaActiveDetails.has(opt);
        
        // ⭐️ 사이드바에서는 "단일 선택" (mediaSetDetailFromSidebar 사용)
        return `<button type="button" class="ms-item${isActive ? ' active' : ''}" onclick="mediaSetDetailFromSidebar('${safeEscape(opt)}')">
            <span>${safeEscape(opt)}</span>
        </button>`;
    }).join('');
}

// -----------------------------------------------------
// 2. 필터 제어 함수 (순차적 열림 및 전역 유지)
// -----------------------------------------------------
function mediaSetTag(label) {
    if (mediaActiveTag === label) {
        if (label !== '전체') {
            // 한 번 더 누르면 리셋(전체로 이동)
            mediaActiveTag = '전체';
            mediaActiveSub = '전체';
            mediaYearClicked = false;
        }
    } else {
        mediaActiveTag = label;
        mediaActiveSub = '전체';
        mediaYearClicked = false; // 카테고리만 누르면 년도까지만 열리게 제어
    }
    // ⭐️ 의도적 생략: mediaActiveDetails.clear() 를 하지 않음으로써 전역 필터(제나 등)를 타 카테고리에서도 유지함
    mediaRenderTagRow();
    mediaApplyFilters();
    if(typeof mediaRenderDrawer === 'function') mediaRenderDrawer();
}

function mediaSetSub(sub) {
    if (mediaActiveSub === sub) {
        if (sub === '전체') {
            // 전체를 다시 누르면 하위 탭 열기/닫기 토글
            mediaYearClicked = !mediaYearClicked;
        } else {
            // 특정 년도를 다시 누르면 닫힘(전체로 이동)
            mediaActiveSub = '전체';
            mediaYearClicked = false;
        }
    } else {
        mediaActiveSub = sub;
        mediaYearClicked = true; // 특정 년도 클릭 시 하위 탭 강제 열림
    }
    mediaRenderYearCol();
    mediaApplyFilters();
    if(typeof mediaRenderDrawer === 'function') mediaRenderDrawer();
}

// ⭐️ 사이드바 전용 (중복 클릭 방지 단일 선택 로직)
function mediaSetDetailFromSidebar(detail) {
    if (detail === '전체') {
        mediaActiveDetails.clear();
    } else {
        mediaActiveDetails.clear(); // 기존 항목 모두 삭제
        mediaActiveDetails.add(detail); // 하나만 추가
    }
    mediaRenderSubCol();
    mediaApplyFilters();
    if(typeof mediaRenderDrawer === 'function') mediaRenderDrawer();
}

// ⭐️ 서랍(Drawer) 전용 다중 선택 로직
function mediaToggleDetail(detail) {
    if (detail === '전체') {
        mediaActiveDetails.clear();
    } else {
        if (mediaActiveDetails.has(detail)) mediaActiveDetails.delete(detail);
        else mediaActiveDetails.add(detail);
    }
    mediaRenderSubCol();
    mediaApplyFilters();
    if(typeof mediaRenderDrawer === 'function') mediaRenderDrawer();
}

// -----------------------------------------------------
// 3. 서랍 (Drawer)
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
    if (typeof MEDIA_CATEGORIES === 'undefined') return;
    
    // 카테고리 목록
    const catBox = document.getElementById('afdCategoryChips');
    const catCount = document.getElementById('afdCatCount');
    const categories = ['전체', '멤버'].concat(MEDIA_CATEGORIES.map(c => c.label));
    
    catBox.innerHTML = categories.map(cat => `
        <button class="afd-chip ${cat === mediaActiveTag ? 'active' : ''}" onclick="mediaSetTag('${safeEscape(cat)}'); mediaRenderDrawer();">
            ${cat === mediaActiveTag ? checkSVG : ''} ${safeEscape(cat)}
        </button>
    `).join('');
    catCount.textContent = `${categories.length}개 항목`;

    // 현재 활성화된 모든 필터 내역
    const activeBox = document.getElementById('afdActiveChips');
    let actives = [];
    if (mediaActiveTag !== '전체') actives.push({ type: 'tag', label: mediaActiveTag });
    if (mediaActiveSub !== '전체') actives.push({ type: 'year', label: mediaActiveSub + '년' });
    mediaActiveDetails.forEach(d => actives.push({ type: 'detail', label: d, val: d }));
    
    activeBox.innerHTML = actives.length ? actives.map(a => `
        <button class="afd-chip closeable" onclick="mediaRemoveActiveFilter('${a.type}', '${safeEscape(a.val || '')}')">
            ${safeEscape(a.label)} ${closeSVG}
        </button>
    `).join('') : '<span style="font-size:13px; color:var(--text-muted);">활성화된 필터 없음</span>';

    // 해당 카테고리 주제 목록 (다중 선택 가능)
    const topicBox = document.getElementById('afdTopicChips');
    const topicCount = document.getElementById('afdTopicCount');
    const cfg = MEDIA_SUBFILTERS[mediaActiveTag];
    
    if (cfg && cfg.sub) {
        let itemsInYear = mediaGetAllItems();
        if (mediaActiveTag !== '전체' && mediaActiveTag !== '멤버') {
            itemsInYear = itemsInYear.filter(i => i.tagLabel === mediaActiveTag);
        }
        if (mediaActiveSub !== '전체') {
            itemsInYear = itemsInYear.filter(i => (i.date||'').slice(0, 4) === mediaActiveSub);
        }
        const options = cfg.sub.getOptions(itemsInYear);
        
        topicBox.innerHTML = options.map(opt => `
            <button class="afd-chip ${mediaActiveDetails.has(opt) ? 'active' : ''}" onclick="mediaToggleDetail('${safeEscape(opt)}'); mediaRenderDrawer();">
                ${mediaActiveDetails.has(opt) ? checkSVG : ''} ${safeEscape(opt)}
            </button>
        `).join('');
        topicCount.innerHTML = `선택됨 <b style="color:#3b82f6;">${mediaActiveDetails.size}</b> / ${options.length}`;
    } else {
        topicBox.innerHTML = '<span style="font-size:13px; color:var(--text-muted);">해당 카테고리에는 관련 주제가 없습니다.</span>';
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
    mediaYearClicked = false;
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
// 4. 검색, 전역 필터 적용, 렌더링
// -----------------------------------------------------
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
    
    // ⭐️ 1. 카테고리 필터 ('멤버' 카테고리는 별도로 이름 필터링 진행)
    if (mediaActiveTag !== '전체') {
        if (mediaActiveTag === '멤버') {
            list = list.filter(i => {
                const text = ((i.title || '') + ' ' + (i.sub || '')).toLowerCase();
                const allAliases = Object.values(memberAlias).flat().concat('전원');
                return allAliases.some(a => text.includes(a));
            });
        } else {
            list = list.filter(i => i.tagLabel === mediaActiveTag);
        }
    }

    // ⭐️ 2. 연도 필터
    if (mediaActiveSub !== '전체') {
        list = list.filter(i => (i.date || '').startsWith(mediaActiveSub));
    }
    
    // ⭐️ 3. 전역 세부 항목 필터 (카테고리를 넘나들어도 적용됨)
    if (mediaActiveDetails.size > 0) {
        list = list.filter(i => {
            const brand = mediaGetContentBrand(i);
            const prog = i.program || '';
            const text = ((i.title || '') + ' ' + (i.sub || '')).toLowerCase();
            
            return Array.from(mediaActiveDetails).some(d => {
                const lowerD = d.toLowerCase();
                let matched = brand === d || prog === d || text.includes(lowerD);
                // 멤버 이름 별칭 지원 (예: '제나' 선택 시 'ZENA'도 포함되게 함)
                if (!matched && memberAlias[d]) {
                    matched = memberAlias[d].some(alias => text.includes(alias));
                }
                return matched;
            });
        });
    }

    // ⭐️ 4. 직접 검색
    if (mediaSearchTerm) {
        list = list.filter(i => ((i.title || '') + ' ' + (i.sub || '')).toLowerCase().includes(mediaSearchTerm));
    }

    // ⭐️ 5. 정렬
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
            <img src="${safeThumb(item.vid)}" alt="${safeEscape(title)}" loading="lazy" onerror="this.closest('.media-card').style.display='none'">
            <button type="button" class="mc-play" aria-label="재생"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>
            <span class="media-card-tag" style="background:${badgeColor};">${safeEscape(item.tagLabel)}</span>
        </div>
        <div class="media-card-info">
            <div class="mc-title">${safeEscape(title)}</div>
            <div class="mc-sub">${item.sub ? safeEscape(item.sub) + ' · ' : ''}${item.date}</div>
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

// -----------------------------------------------------
// 5. 모달 제어
// -----------------------------------------------------
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
    if (modalMedia) modalMedia.innerHTML = `<iframe src="https://www.youtube.com/embed/${item.vid}?autoplay=1" title="${safeEscape(title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    if (modalTitle) modalTitle.textContent = title;
    if (modalDate) modalDate.textContent = item.sub ? `${safeEscape(item.sub)} · ${item.date}` : (item.date || '');
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
            <div class="mm-playlist-thumb"><img src="${safeThumb(item.vid)}" alt="" loading="lazy"></div>
            <div class="mm-playlist-info">
                <div class="mm-playlist-title">${safeEscape(title)}</div>
                <div class="mm-playlist-date">${item.sub ? safeEscape(item.sub) + ' · ' : ''}${item.date}</div>
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

// 초기 실행 및 오류 캡처
window.addEventListener('DOMContentLoaded', () => {
    try {
        mediaInitTagFromQuery();
        mediaRenderTagRow();
        mediaRenderGrid(true);
        mediaSetupInfiniteScroll();
    } catch (e) {
        console.error("Initialization error:", e);
        const grid = document.getElementById('mediaGrid');
        if (grid) grid.innerHTML = `<div style="grid-column:1/-1; color:#ff4d6d; font-size:14px; padding:40px; background:var(--bg-surface); border-radius:12px;">
            <b>[스크립트 에러 발생]</b><br><br>${e.message}
        </div>`;
    }
});
