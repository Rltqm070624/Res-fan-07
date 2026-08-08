function safeThumb(vid) {
    return typeof ytThumb === 'function' ? ytThumb(vid) : `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
}

let mediaActiveTag = '전체';
let mediaActiveSub = '전체'; 
let mediaActiveDetails = new Set();
let mediaYearClicked = false;
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
// 1. 사이드바
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
        return `<button type="button" class="ms-item${active ? ' active' : ''}" onclick="mediaSetTag('${escapeHtml(label)}')">
            <span>${escapeHtml(label)}</span>
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
        `<button type="button" class="ms-item${opt === mediaActiveSub ? ' active' : ''}" onclick="mediaSetSub('${escapeHtml(opt)}')">
            <span>${opt === '전체' ? '전체' : escapeHtml(opt) + '년'}</span>
        </button>`
    ).join('');
    
    mediaRenderSubCol();
}

function mediaRenderSubCol() {
    const col = document.getElementById('mediaSubCol');
    const wrap = document.getElementById('mediaSubColWrap');
    if (!col || !wrap) return;
    
    const cfg = MEDIA_SUBFILTERS[mediaActiveTag];
    
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
        const isActive = (opt === '전체' && mediaActiveDetails.size === 0) || mediaActiveDetails.has(opt);
        return `<button type="button" class="ms-item${isActive ? ' active' : ''}" onclick="mediaSetDetailFromSidebar('${escapeHtml(opt)}')">
            <span>${escapeHtml(opt)}</span>
        </button>`;
    }).join('');
}

function mediaSetTag(label) {
    if (mediaActiveTag === label) {
        if (label !== '전체') {
            mediaActiveTag = '전체';
            mediaActiveSub = '전체';
            mediaYearClicked = false;
        }
    } else {
        mediaActiveTag = label;
        mediaActiveSub = '전체';
        mediaYearClicked = false;
    }
    mediaTopicChosungFilter = '전체';
    mediaRenderTagRow();
    mediaApplyFilters();
    if(typeof mediaRenderDrawer === 'function') mediaRenderDrawer();
}

function mediaSetSub(sub) {
    if (mediaActiveSub === sub) {
        if (sub === '전체') {
            mediaYearClicked = !mediaYearClicked;
        } else {
            mediaActiveSub = '전체';
            mediaYearClicked = false;
        }
    } else {
        mediaActiveSub = sub;
        mediaYearClicked = true; 
    }
    mediaRenderYearCol();
    mediaApplyFilters();
    if(typeof mediaRenderDrawer === 'function') mediaRenderDrawer();
}

function mediaSetDetailFromSidebar(detail) {
    if (detail === '전체') {
        mediaActiveDetails.clear();
    } else {
        mediaActiveDetails.clear();
        mediaActiveDetails.add(detail);
    }
    mediaRenderSubCol();
    mediaApplyFilters();
    if(typeof mediaRenderDrawer === 'function') mediaRenderDrawer();
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

// ⭐️ 드래그를 통해 닫을 때 Transform(위치이동값)을 깔끔히 초기화하기 위한 로직 추가
function closeAdvFilter() {
    const drawer = document.getElementById('advFilterDrawer');
    if (drawer) {
        drawer.classList.remove('active');
        // 모바일 바텀시트가 자연스럽게 닫힌 후 transform 초기화
        setTimeout(() => { drawer.style.transform = ''; }, 400); 
    }
    const backdrop = document.getElementById('advFilterBackdrop');
    if(backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
}

function mediaRenderDrawer() {
    if (typeof MEDIA_CATEGORIES === 'undefined') return;
    
    const catBox = document.getElementById('afdCategoryChips');
    const catCount = document.getElementById('afdCatCount');
    const categories = ['전체', '멤버'].concat(MEDIA_CATEGORIES.map(c => c.label));
    
    catBox.innerHTML = categories.map(cat => `
        <button class="afd-chip ${cat === mediaActiveTag ? 'active' : ''}" onclick="mediaSetTag('${escapeHtml(cat)}'); mediaRenderDrawer();">
            ${cat === mediaActiveTag ? checkSVG : ''} ${escapeHtml(cat)}
        </button>
    `).join('');
    catCount.textContent = `${categories.length}${window.t ? window.t('itemsCountSuffix') : '개 항목'}`;

    const activeBox = document.getElementById('afdActiveChips');
    let actives = [];
    if (mediaActiveTag !== '전체') actives.push({ type: 'tag', label: mediaActiveTag });
    if (mediaActiveSub !== '전체') actives.push({ type: 'year', label: mediaActiveSub + '년' });
    mediaActiveDetails.forEach(d => actives.push({ type: 'detail', label: d, val: d }));
    
    activeBox.innerHTML = actives.length ? actives.map(a => `
        <button class="afd-chip closeable" onclick="mediaRemoveActiveFilter('${a.type}', '${escapeHtml(a.val || '')}')">
            ${escapeHtml(a.label)} ${closeSVG}
        </button>
    `).join('') : `<span style="font-size:13px; color:var(--text-muted);">${window.t ? window.t('noActiveFilters') : '활성화된 필터 없음'}</span>`;

    const topicBox = document.getElementById('afdTopicChips');
    const topicCount = document.getElementById('afdTopicCount');
    const topicToolbar = document.getElementById('afdTopicToolbar');
    const chosungRow = document.getElementById('afdChosungRow');
    const cfg = MEDIA_SUBFILTERS[mediaActiveTag];
    
    if (cfg && cfg.sub) {
        let itemsInYear = mediaGetAllItems();
        if (mediaActiveTag !== '전체' && mediaActiveTag !== '멤버') {
            itemsInYear = itemsInYear.filter(i => i.tagLabel === mediaActiveTag);
        }
        if (mediaActiveSub !== '전체') {
            itemsInYear = itemsInYear.filter(i => (i.date||'').slice(0, 4) === mediaActiveSub);
        }
        const rawOptions = cfg.sub.getOptions(itemsInYear);

        // ⭐️ 이름을 몰라도 훑어볼 수 있도록: 항목별 영상 개수를 세어 "많이 나온순"을 기본값으로 제공
        const counted = rawOptions.map(opt => ({
            label: opt,
            count: mediaCountForDetail(itemsInYear, opt),
            cho: mediaGetChosungKey(opt),
            en: mediaGetEnKey(opt)
        }));

        const showToolbarAndIndex = counted.length > 8;
        if (topicToolbar) topicToolbar.style.display = showToolbarAndIndex ? '' : 'none';

        if (mediaTopicSortMode === 'alpha') {
            counted.sort((a, b) => a.label.localeCompare(b.label, 'ko'));
        } else if (mediaTopicSortMode === 'en') {
            counted.sort((a, b) => a.label.localeCompare(b.label, 'en'));
        } else {
            counted.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ko'));
        }

        // 인덱스 바 (가나다순=ㄱㄴㄷ, 영문순=A-Z) — CSS 로드 실패 대비, style.display도 직접 지정
        const indexField = mediaTopicSortMode === 'en' ? 'en' : 'cho';
        const indexKeyList = mediaTopicSortMode === 'en' ? MEDIA_EN_KEYS : MEDIA_CHOSUNG_KEYS;
        if (chosungRow) {
            if (showToolbarAndIndex && (mediaTopicSortMode === 'alpha' || mediaTopicSortMode === 'en')) {
                const presentKeys = new Set(counted.map(o => o[indexField]));
                const keys = ['전체'].concat(indexKeyList.filter(k => presentKeys.has(k)));
                chosungRow.innerHTML = keys.map(k => {
                    const isActive = k === mediaTopicChosungFilter;
                    const displayLabel = k === '#' ? '기타' : k;
                    const style = `height:34px;min-width:34px;padding:0 10px;border-radius:8px;border:1px solid ${isActive ? 'var(--c-accent)' : 'rgba(120,120,120,0.28)'};font-family:inherit;font-size:12.5px;font-weight:700;cursor:pointer;background:${isActive ? 'var(--c-accent)' : 'transparent'};color:${isActive ? '#fff' : '#666'};`;
                    return `<button type="button" class="afd-cho-btn ${isActive ? 'active' : ''}" onclick="mediaSetTopicChosung('${k}')" style="${style}">${displayLabel}</button>`;
                }).join('');
                chosungRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';
                chosungRow.classList.remove('is-hidden');
            } else {
                chosungRow.classList.add('is-hidden');
                chosungRow.style.display = 'none';
                chosungRow.innerHTML = '';
            }
        }

        let visible = counted;
        if ((mediaTopicSortMode === 'alpha' || mediaTopicSortMode === 'en') && mediaTopicChosungFilter !== '전체') {
            visible = counted.filter(o => o[indexField] === mediaTopicChosungFilter);
        }

        topicBox.innerHTML = visible.length ? visible.map(o => `
            <button class="afd-chip ${mediaActiveDetails.has(o.label) ? 'active' : ''}" onclick="mediaToggleDetail('${escapeHtml(o.label)}'); mediaRenderDrawer();">
                ${mediaActiveDetails.has(o.label) ? checkSVG : ''} ${escapeHtml(o.label)} <span class="afd-chip-count" style="font-size:11px;font-weight:700;color:#8a8a8a;background:rgba(120,120,120,0.14);border-radius:999px;padding:1px 7px;margin-left:2px;">${o.count}</span>
            </button>
        `).join('') : `<span style="font-size:13px; color:var(--text-muted);">${window.t ? window.t('noChosungResults') : '해당 자음으로 시작하는 항목이 없습니다.'}</span>`;

        topicCount.innerHTML = `${window.t ? window.t('selectedCountLabel') : '선택됨'} <b style="color:var(--c-accent);">${mediaActiveDetails.size}</b> / ${rawOptions.length}`;
    } else {
        if (topicToolbar) topicToolbar.style.display = 'none';
        if (chosungRow) { chosungRow.classList.add('is-hidden'); chosungRow.innerHTML = ''; }
        topicBox.innerHTML = `<span style="font-size:13px; color:var(--text-muted);">${window.t ? window.t('noRelatedTopics') : '해당 카테고리에는 관련 주제가 없습니다.'}</span>`;
        topicCount.textContent = '';
    }
}

// ⭐️ mediaApplyFilters와 동일한 매칭 로직으로 항목별 영상 개수를 계산 (검색 없이도 "인기순"으로 훑어보기 위함)
function mediaCountForDetail(items, d) {
    const lowerD = (d || '').toLowerCase();
    return items.filter(i => {
        const brand = mediaGetContentBrand(i);
        const prog = i.program || '';
        const text = ((i.title || '') + ' ' + (i.sub || '')).toLowerCase();
        let matched = brand === d || prog === d || text.includes(lowerD);
        if (!matched && memberAlias[d]) matched = memberAlias[d].some(alias => text.includes(alias));
        return matched;
    }).length;
}

// ⭐️ 자음 인덱스(연락처 앱 방식): 이름을 몰라도 초성만 보고 눌러서 바로 좁혀볼 수 있게 함
const MEDIA_CHO_LIST = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const MEDIA_CHO_BASE_MAP = { 'ㄲ':'ㄱ', 'ㄸ':'ㄷ', 'ㅃ':'ㅂ', 'ㅆ':'ㅅ', 'ㅉ':'ㅈ' };
const MEDIA_CHOSUNG_KEYS = ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ','#'];

function mediaGetChosungKey(str) {
    if (!str) return '#';
    const ch = str.trim().charAt(0);
    const code = ch.charCodeAt(0) - 0xAC00;
    if (code >= 0 && code <= 11171) {
        const cho = MEDIA_CHO_LIST[Math.floor(code / 588)];
        return MEDIA_CHO_BASE_MAP[cho] || cho;
    }
    return '#';
}

// ⭐️ 영문순 정렬용: 첫 글자가 알파벳이면 대문자로, 아니면(한글/숫자/기호 등) '#'(=기타)
function mediaGetEnKey(str) {
    if (!str) return '#';
    const ch = str.trim().charAt(0).toUpperCase();
    return (ch >= 'A' && ch <= 'Z') ? ch : '#';
}
const MEDIA_EN_KEYS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','#'];

let mediaTopicSortMode = 'popular'; // 'popular' | 'alpha'
let mediaTopicChosungFilter = '전체';

function mediaSetTopicSortMode(mode) {
    mediaTopicSortMode = mode;
    mediaTopicChosungFilter = '전체';
    const popBtn = document.getElementById('afdSortPopular');
    const alphaBtn = document.getElementById('afdSortAlpha');
    const enBtn = document.getElementById('afdSortEn');
    if (popBtn) popBtn.classList.toggle('active', mode === 'popular');
    if (alphaBtn) alphaBtn.classList.toggle('active', mode === 'alpha');
    if (enBtn) enBtn.classList.toggle('active', mode === 'en');
    mediaRenderDrawer();
}

function mediaSetTopicChosung(key) {
    mediaTopicChosungFilter = key;
    mediaRenderDrawer();
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

    if (mediaActiveSub !== '전체') {
        list = list.filter(i => (i.date || '').startsWith(mediaActiveSub));
    }
    
    if (mediaActiveDetails.size > 0) {
        list = list.filter(i => {
            const brand = mediaGetContentBrand(i);
            const prog = i.program || '';
            const text = ((i.title || '') + ' ' + (i.sub || '')).toLowerCase();
            
            return Array.from(mediaActiveDetails).some(d => {
                const lowerD = d.toLowerCase();
                let matched = brand === d || prog === d || text.includes(lowerD);
                if (!matched && memberAlias[d]) {
                    matched = memberAlias[d].some(alias => text.includes(alias));
                }
                return matched;
            });
        });
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
            <img src="${safeThumb(item.vid)}" alt="${escapeHtml(title)}" loading="lazy" onerror="this.closest('.media-card').style.display='none'">
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
    if (countBadge) countBadge.innerHTML = `${window.t ? window.t('searchResultsLabel') : '검색결과'} <b>${filtered.length}</b>${window.t ? window.t('itemsCountSuffix') : '개'}`;

    if (!filtered.length) {
        grid.innerHTML = `<div class="media-empty">${window.t ? window.t('noSearchResults') : '검색 결과가 없어요.'}</div>`;
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
// 5. 영상 모달 및 바텀시트(Drawer) 터치 드래그 로직
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
    if (modalMedia) modalMedia.innerHTML = `<iframe src="https://www.youtube.com/embed/${item.vid}?autoplay=1" title="${escapeHtml(title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    if (modalTitle) modalTitle.textContent = title;
    if (modalDate) modalDate.textContent = item.sub ? `${escapeHtml(item.sub)} · ${item.date}` : (item.date || '');
    updateMmNavButtons();
    highlightMmPlaylistActive();

    mmSetupExtras(item);
    mmSwitchSideTab('playlist');
}

// -----------------------------------------------------
// 풀영상 모달 - 댓글 / 원본보기 / 공유 / 실시간채팅
// -----------------------------------------------------
let mmActiveSideTab = 'playlist';

function mmCurrentItem() {
    return mmPlaylist[mmIndex] || null;
}

function mmSwitchSideTab(tab) {
    mmActiveSideTab = tab;
    const map = {
        playlist: ['mmTabPlaylistBtn', 'mmPlaylistList'],
        comments: ['mmTabCommentsBtn', 'mmCommentPanel'],
        chat:     ['mmTabChatBtn', 'mmLiveChatPanel']
    };
    Object.keys(map).forEach(key => {
        const [btnId, panelId] = map[key];
        const btn = document.getElementById(btnId);
        const panel = document.getElementById(panelId);
        if (btn) btn.classList.toggle('active', key === tab);
        if (panel) panel.style.display = (key === tab) ? (key === 'playlist' ? '' : 'flex') : 'none';
    });

    const item = mmCurrentItem();
    if (!item) return;

    if (tab === 'comments') mmLoadComments(mmGetCommentOrder());
    if (tab === 'chat' && typeof veRenderLiveChat === 'function') veRenderLiveChat('mmLiveChatPanel', item.vid);
}

function mmGetCommentOrder() {
    return typeof veGetCommentOrder === 'function' ? veGetCommentOrder('mmCommentList') : 'relevance';
}

function mmLoadComments(order) {
    const item = mmCurrentItem();
    if (!item || typeof veLoadComments !== 'function') return;

    const bar = document.getElementById('mmCommentSortBar');
    if (bar) {
        if (!bar.querySelector('.ve-comment-sortbar')) {
            bar.innerHTML = veCommentSortBarHtml('mmCommentList', 'mmSetCommentOrder');
        }
        veUpdateSortBar(bar, order);
    }

    veLoadComments({
        vid: item.vid,
        listId: 'mmCommentList',
        order: order,
        onCount: (n) => {
            const countEl = document.getElementById('mmCommentCount');
            if (countEl) countEl.textContent = n;
        }
    });
}

function mmSetCommentOrder(order) {
    mmLoadComments(order);
}

function mmSetupExtras(item) {
    const bar = document.getElementById('mediaModalActions');
    if (bar && typeof veRenderActionBar === 'function') {
        bar.dataset.title = item.title || mediaCardTitle(item) || '';
        veRenderActionBar('mediaModalActions', item.vid, bar.dataset.title);
    }
    if (typeof veResetComments === 'function') veResetComments('mmCommentList');
    if (typeof veClearLiveChat === 'function') veClearLiveChat('mmLiveChatPanel');

    const chatBtn = document.getElementById('mmTabChatBtn');
    if (chatBtn) {
        chatBtn.classList.add('is-hidden');
        if (typeof veCheckLive === 'function') {
            veCheckLive(item.vid, !!item.isLive).then(isLive => {
                const cur = mmCurrentItem();
                if (!cur || cur.vid !== item.vid) return;
                chatBtn.classList.toggle('is-hidden', !isLive);
            });
        }
    }
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
    const countTabEl = document.getElementById('mmPlaylistCountTab');
    if (countEl) countEl.textContent = mmPlaylist.length;
    if (countTabEl) countTabEl.textContent = mmPlaylist.length;
    if (!listEl) return;
    listEl.innerHTML = mmPlaylist.map((item, i) => {
        const title = mediaCardTitle(item);
        return `<li class="mm-playlist-item" data-idx="${i}" onclick="loadMmVideo(${i})">
            <span class="mm-playlist-index">${i + 1}</span>
            <div class="mm-playlist-thumb"><img src="${safeThumb(item.vid)}" alt="" loading="lazy"></div>
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
    if (typeof veClearLiveChat === 'function') veClearLiveChat('mmLiveChatPanel');
    document.body.style.overflow = '';
}

// 영상 플레이리스트 드래그 로직
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

// ⭐️ 필터 드로어 가로 폭 조절 (오른쪽 테두리 전체 어디서든 드래그 가능, PC 전용) ⭐️
function initFilterDrawerResize(drawerId, handleId) {
    document.addEventListener('DOMContentLoaded', () => {
        const drawer = document.getElementById(drawerId);
        const handle = document.getElementById(handleId);
        if (!drawer || !handle) return;

        const MIN_W = 320, MAX_W = 640;
        let startX = 0, startWidth = 0, resizing = false;

        function pointX(e) { return e.touches ? e.touches[0].clientX : e.clientX; }

        function onStart(e) {
            if (window.innerWidth <= 1000) return; // 모바일(바텀시트)에서는 동작 안 함
            resizing = true;
            startX = pointX(e);
            startWidth = drawer.getBoundingClientRect().width;
            handle.classList.add('is-dragging');
            document.body.style.userSelect = 'none';
        }

        function onMove(e) {
            if (!resizing) return;
            const dx = pointX(e) - startX;
            const newWidth = Math.min(MAX_W, Math.max(MIN_W, startWidth + dx));
            drawer.style.width = newWidth + 'px';
        }

        function onEnd() {
            if (!resizing) return;
            resizing = false;
            handle.classList.remove('is-dragging');
            document.body.style.userSelect = '';
        }

        handle.addEventListener('mousedown', onStart);
        handle.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchend', onEnd);
    });
}
initFilterDrawerResize('advFilterDrawer', 'afdResizeHandle');
initFilterDrawerResize('shAdvFilterDrawer', 'shAfdResizeHandle');

// ⭐️ 모바일 바텀시트(Drawer) 스와이프 다운 닫기 로직 ⭐️
function initFilterDrawerDrag(drawerId, closeFn) {
    document.addEventListener('DOMContentLoaded', () => {
        const drawer = document.getElementById(drawerId);
        // 사용자가 터치할 수 있는 넓은 영역 (헤더 전체)
        const handleArea = drawer ? drawer.querySelector('.afd-header') : null; 
        if (!drawer || !handleArea) return;

        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        function onStart(e) {
            // PC 화면(1000px 초과)에서는 작동하지 않음
            if (window.innerWidth > 1000) return; 
            startY = e.touches ? e.touches[0].clientY : e.clientY;
            isDragging = true;
            // 부드러운 드래그를 위해 트랜지션 해제
            drawer.style.transition = 'none'; 
        }

        function onMove(e) {
            if (!isDragging) return;
            currentY = e.touches ? e.touches[0].clientY : e.clientY;
            const diff = currentY - startY;
            
            // 아래로 끌어내릴 때만 모달 이동 허용
            if (diff > 0) {
                drawer.style.transform = `translateY(${diff}px)`;
            }
        }

        function onEnd(e) {
            if (!isDragging) return;
            isDragging = false;
            // 드래그 종료 시 다시 애니메이션 복구
            drawer.style.transition = 'bottom 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s ease';
            
            const diff = currentY - startY;
            // 80px 이상 끌어내렸으면 닫기 함수 호출
            if (diff > 80) { 
                closeFn();
            } else { 
                // 조금 끌다 말았으면 원위치
                drawer.style.transform = `translateY(0)`;
            }
        }

        // 터치 이벤트 리스너 부착
        handleArea.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onEnd);
    });
}
initFilterDrawerDrag('advFilterDrawer', closeAdvFilter);
initFilterDrawerDrag('shAdvFilterDrawer', typeof shCloseAdvFilter === 'function' ? shCloseAdvFilter : function(){});

window.addEventListener('DOMContentLoaded', () => {
    try {
        mediaInitTagFromQuery();
        mediaRenderTagRow();
        mediaRenderGrid(true);
        mediaSetupInfiniteScroll();
    } catch (e) {
        console.error("Initialization error:", e);
    }
});
