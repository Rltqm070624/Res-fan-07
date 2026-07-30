const CHART_PLATFORMS = [
    { key: 'melon', label: 'MELON', color: '#00CD3C' },
    { key: 'youtube_music', label: 'YT Music', color: '#FF0000' },
    { key: 'spotify', label: 'SPOTIFY', color: '#1DB954' },
    { key: 'genie', label: 'GENIE', color: '#1E7DE0' },
    { key: 'flo', label: 'FLO', color: '#6A3FE0' },
    { key: 'bugs', label: 'BUGS', color: '#E4322E' },
    { key: 'vibe', label: 'VIBE', color: '#7B5CF0' }
];

function chartEsc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function chartRankPillHtml(platform, rankInfo) {
    if (!rankInfo || rankInfo.rank == null) {
        return `<div class="chart-rank-pill out"><span class="plat" style="color:${platform.color};">${platform.label}</span><span class="rankval">-</span></div>`;
    }
    const rank = rankInfo.rank;
    const prev = rankInfo.previousRank;
    let deltaHtml;
    if (prev == null) deltaHtml = '<span class="delta new">NEW</span>';
    else if (prev === rank) deltaHtml = '<span class="delta same">-</span>';
    else if (prev > rank) deltaHtml = `<span class="delta up">▲${prev - rank}</span>`;
    else deltaHtml = `<span class="delta down">▼${rank - prev}</span>`;
    return `<div class="chart-rank-pill"><span class="plat" style="color:${platform.color};">${platform.label}</span><span class="rankval">${rank}</span>${deltaHtml}</div>`;
}

function renderChartLegend() {
    const el = document.getElementById('chartLegend');
    if (!el) return;
    el.innerHTML = CHART_PLATFORMS.map(p => `<span class="chart-legend-item"><span class="dot" style="background:${p.color};"></span>${p.label}</span>`).join('');
}

function renderChartGrid(data) {
    const list = document.getElementById('chartList');
    if (!list) return;
    const songs = (data && data.songs) || [];
    if (!songs.length) {
        list.innerHTML = '<div class="chart-empty"><div class="ico">🎵</div><p>차트 정보를 불러올 수 없습니다.</p></div>';
        return;
    }
    const noThumb = '<div class="chart-thumb-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>';
    list.innerHTML = songs.map(song => {
        const thumb = song.albumImageUrl ? `<img class="chart-thumb" src="${chartEsc(song.albumImageUrl)}" alt="" loading="lazy">` : noThumb;
        const ranks = song.ranks || {};
        const pills = CHART_PLATFORMS.map(p => chartRankPillHtml(p, ranks[p.key])).join('');
        return `<div class="chart-card">
            ${thumb}
            <div class="chart-info">
                <div class="chart-song-title">${chartEsc(song.songName)}</div>
                <div class="chart-song-artist">${chartEsc(song.artistName)}</div>
            </div>
            <div class="chart-ranks">${pills}</div>
        </div>`;
    }).join('');
}

async function fetchSongCharts() {
    renderChartLegend();
    try {
        const response = await fetch('chart_data.json?t=' + Date.now());
        const data = await response.json();
        const timeEl = document.getElementById('currentTime');
        if (timeEl && data.updatedAt) {
            const d = new Date(data.updatedAt);
            timeEl.innerText = '업데이트: ' + d.toLocaleString('ko-KR');
        }
        renderChartGrid(data);
    } catch (e) {
        console.log('차트 데이터 로딩 실패', e);
        const list = document.getElementById('chartList');
        if (list) list.innerHTML = '<div class="chart-empty"><div class="ico">🎵</div><p>차트 업데이트를 대기 중입니다.</p></div>';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    try { fetchSongCharts(); } catch (e) { console.error('fetchSongCharts 실패:', e); }
    setInterval(fetchSongCharts, 60000);
});
