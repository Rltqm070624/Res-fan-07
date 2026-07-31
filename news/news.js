function nwEscape(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderNewsGrid() {
    const grid = document.getElementById('newsGrid');
    const empty = document.getElementById('newsEmpty');
    if (!grid || typeof NEWS_DATA === 'undefined') return;

    if (!NEWS_DATA.length) {
        grid.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';

    // 최신 기사가 위로 오도록 날짜 내림차순 정렬
    const sorted = [...NEWS_DATA].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    grid.innerHTML = sorted.map(n => `
        <a class="news-card" href="${nwEscape(n.url)}" target="_blank" rel="noopener noreferrer">
            <div class="news-card-meta">
                <span class="news-card-source">${nwEscape(n.source || '')}</span>
                <span class="news-card-dot"></span>
                <span>${nwEscape(n.date || '')}</span>
            </div>
            <h3 class="news-card-title">${nwEscape(n.title || '')}</h3>
            <p class="news-card-summary">${nwEscape(n.summary || '')}</p>
            <span class="news-card-link">기사 보러가기 →</span>
        </a>
    `).join('');
}

window.addEventListener('DOMContentLoaded', () => {
    try { renderNewsGrid(); } catch (e) { console.error('뉴스 렌더링 실패:', e); }
});
