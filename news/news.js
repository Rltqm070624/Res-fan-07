/* 기사에 썸네일(image 필드)이 없으면, 출처 이름 첫 글자로 만든 컬러 블록을 대신 보여줌 */
function nwThumbHtml(n) {
    if (n.image) {
        return `<img src="${escapeHtml(n.image)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='${nwFallbackInitial(n.source)}'">`;
    }
    return nwFallbackInitial(n.source);
}
function nwFallbackInitial(source) {
    const ch = (source || 'N').trim().charAt(0);
    return `<div class="news-item-thumb-fallback">${escapeHtml(ch)}</div>`;
}

function renderNewsGrid() {
    const list = document.getElementById('newsGrid');
    const empty = document.getElementById('newsEmpty');
    if (!list || typeof NEWS_DATA === 'undefined') return;

    if (!NEWS_DATA.length) {
        list.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';

    // 최신 기사가 위로 오도록 날짜 내림차순 정렬
    const sorted = [...NEWS_DATA].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    list.innerHTML = sorted.map(n => `
        <a class="news-item" href="${escapeHtml(n.url)}" target="_blank" rel="noopener noreferrer">
            <div class="news-item-thumb">${nwThumbHtml(n)}</div>
            <div class="news-item-body">
                <div class="news-item-meta">
                    <span class="news-item-source">${escapeHtml(n.source || '')}</span>
                    <span class="news-item-dot"></span>
                    <span>${escapeHtml(n.date || '')}</span>
                </div>
                <h3 class="news-item-title">${escapeHtml(n.title || '')}</h3>
                <p class="news-item-summary">${escapeHtml(n.summary || '')}</p>
                <span class="news-item-link">기사 보러가기 →</span>
            </div>
        </a>
    `).join('');
}

window.addEventListener('DOMContentLoaded', () => {
    try { renderNewsGrid(); } catch (e) { console.error('뉴스 렌더링 실패:', e); }
});
