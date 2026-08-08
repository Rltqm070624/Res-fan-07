let GOODS_DATA = {};
let goodsActiveCategory = '전체';
let goodsShowEnded = false; // 팬사인회 응모(종료) 카테고리는 기본적으로 접어둔다

const GOODS_CATEGORY_ORDER = ['전체', '앨범', '인형·키링', '응원봉', '콜라보 MD', '팬콘 MD', '기타', '팬사인회 응모 (종료)'];

async function loadGoodsData() {
    const grid = document.getElementById('goodsGrid');
    if (grid) grid.innerHTML = renderSkeletons(6);
    try {
        const res = await fetch('goods_data.json', { cache: 'no-store' });
        GOODS_DATA = await res.json();
    } catch (e) {
        console.error('굿즈 데이터 로드 실패:', e);
        GOODS_DATA = {};
    }
    renderGoodsSidebar();
    renderGoodsGrid();
}

function renderSkeletons(n) {
    let html = '';
    for (let i = 0; i < n; i++) {
        html += `<div class="goods-item">
            <div class="goods-img goods-skeleton-img skeleton-block"></div>
            <div class="goods-skeleton-line skeleton-block" style="width:70%;height:13px;margin-top:12px;"></div>
            <div class="goods-skeleton-line skeleton-block" style="width:40%;height:15px;margin-top:8px;"></div>
        </div>`;
    }
    return html;
}

function goodsCategoryCounts() {
    const counts = {};
    Object.values(GOODS_DATA).forEach(item => {
        counts[item.category] = (counts[item.category] || 0) + 1;
    });
    counts['전체'] = Object.keys(GOODS_DATA).length;
    return counts;
}

function renderGoodsSidebar() {
    const el = document.getElementById('goodsSidebar');
    if (!el) return;
    const counts = goodsCategoryCounts();
    const present = GOODS_CATEGORY_ORDER.filter(c => c === '전체' || counts[c]);
    el.innerHTML = present.map(cat => {
        const active = cat === goodsActiveCategory ? 'active' : '';
        return `<button type="button" class="goods-cat-btn ${active}" onclick="goodsSetCategory('${escapeHtml(cat)}')">
            ${escapeHtml(cat)} <span class="goods-cat-count">${counts[cat] || 0}</span>
        </button>`;
    }).join('');
}

function goodsSetCategory(cat) {
    goodsActiveCategory = cat;
    renderGoodsSidebar();
    renderGoodsGrid();
    window.scrollTo({ top: document.getElementById('goodsTop')?.offsetTop - 100 || 0, behavior: 'smooth' });
}

function goodsToggleEnded() {
    goodsShowEnded = !goodsShowEnded;
    renderGoodsGrid();
}

function goodsFilteredEntries() {
    let entries = Object.entries(GOODS_DATA);
    if (goodsActiveCategory !== '전체') {
        entries = entries.filter(([, v]) => v.category === goodsActiveCategory);
    } else if (!goodsShowEnded) {
        // 전체보기에서는 종료된 팬사인회 응모 상품은 기본적으로 숨김 (하단 토글로 펼침)
        entries = entries.filter(([, v]) => v.category !== '팬사인회 응모 (종료)');
    }
    return entries;
}

function goodsCheapestShop(item) {
    if (!item.cheapest) return null;
    return item.shops.find(s => s.shop === item.cheapest) || null;
}

function goodsCardHtml(id, item) {
    const cheapestShop = goodsCheapestShop(item);
    const priceText = cheapestShop && cheapestShop.price ? cheapestShop.price : '가격 확인중...';
    const soldoutCls = item.soldout ? 'is-soldout' : '';
    const badgesHtml = (item.badges || []).map(b => `<span class="goods-badge goods-badge-${b.replace(/\s+/g, '').toLowerCase()}">${escapeHtml(b)}</span>`).join('');

    const shopsSorted = [...item.shops].sort((a, b) => {
        // 재고 있는 곳 먼저, 그 다음 가격순
        if ((a.stock === 'available') !== (b.stock === 'available')) return a.stock === 'available' ? -1 : 1;
        return (a.priceNum ?? Infinity) - (b.priceNum ?? Infinity);
    });

    const stockListHtml = shopsSorted.map(s => {
        const isCheapest = s.shop === item.cheapest;
        const stockLabel = s.stock === 'soldout' ? '<span class="stock-num" style="color:#ff4757;">SOLD OUT</span>'
            : s.stock === 'unknown' ? '<span class="stock-num">확인중</span>'
            : '';
        return `<div class="stock-row ${isCheapest ? 'is-cheapest' : ''}">
            <span class="shop-name">${escapeHtml(s.label)}${isCheapest && !item.soldout ? '<span class="cheapest-badge">최저가</span>' : ''}</span>
            <span style="display:flex; align-items:center; gap:8px;">
                ${s.price ? `<span class="shop-price">${escapeHtml(s.price)}</span>` : ''}
                ${stockLabel}
                <a href="${s.url}" target="_blank" rel="noopener" class="buy-btn ${s.stock === 'soldout' ? 'sold-out' : ''}">${s.stock === 'soldout' ? '품절' : '구매'}</a>
            </span>
        </div>`;
    }).join('');

    const imgSrc = item.image || '../images/goods/_placeholder.jpg';

    return `<div class="goods-item" data-item="${id}">
        <div class="goods-img ${soldoutCls}">
            <div class="goods-badge-row">${badgesHtml}</div>
            <img src="${imgSrc}" alt="${escapeHtml(item.name)}" onerror="this.style.opacity=0;this.parentElement.classList.add('no-img');">
            <div class="soldout-stamp"><span>SOLD</span></div>
        </div>
        <div class="goods-name">${escapeHtml(item.name)}</div>
        <div class="goods-price-text">${escapeHtml(priceText)}</div>
        <div class="goods-stock-list">${stockListHtml}</div>
    </div>`;
}

function renderGoodsGrid() {
    const grid = document.getElementById('goodsGrid');
    const countEl = document.getElementById('goodsResultCount');
    if (!grid) return;
    const entries = goodsFilteredEntries();

    if (countEl) countEl.innerHTML = `총 <strong>${entries.length}</strong>개의 상품`;

    if (!entries.length) {
        grid.innerHTML = `<div class="goods-empty">등록된 상품이 없습니다.</div>`;
    } else {
        grid.innerHTML = entries.map(([id, item]) => goodsCardHtml(id, item)).join('');
    }

    const endedToggleEl = document.getElementById('goodsEndedToggle');
    if (endedToggleEl) {
        const endedCount = Object.values(GOODS_DATA).filter(v => v.category === '팬사인회 응모 (종료)').length;
        if (goodsActiveCategory === '전체' && endedCount > 0) {
            endedToggleEl.style.display = 'block';
            endedToggleEl.innerHTML = goodsShowEnded
                ? `<button type="button" onclick="goodsToggleEnded()">종료된 팬사인회 응모 상품(${endedCount}개) 숨기기 ↑</button>`
                : `<button type="button" onclick="goodsToggleEnded()">종료된 팬사인회 응모 상품(${endedCount}개) 더보기 ↓</button>`;
        } else {
            endedToggleEl.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', loadGoodsData);
