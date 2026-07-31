const CHART_PLATFORMS = [
    { key: 'all', label: '종합' },
    { key: 'melon', label: '멜론' },
    { key: 'genie', label: '지니' },
    { key: 'vibe', label: '바이브' },
    { key: 'bugs', label: '벅스' },
    { key: 'flo', label: 'FLO' },
    { key: 'youtube_music', label: '유튜브뮤직' },
    { key: 'spotify', label: '스포티파이' }
];
function renderChartWave() {
    const wave = document.getElementById('chartWave');
    if (!wave) return;
    const BAR_COUNT = 56;
    let html = '';
    for (let i = 0; i < BAR_COUNT; i++) {
        const duration = (0.9 + Math.random() * 0.9).toFixed(2);
        const delay = (-Math.random() * 1.8).toFixed(2);
        html += `<span style="animation-duration:${duration}s; animation-delay:${delay}s;"></span>`;
    }
    wave.innerHTML = html;
}
window.addEventListener('DOMContentLoaded', renderChartWave);

const CHART_PLATFORM_DOT_COLOR = {
    melon: '#00CD3C', genie: '#1E7DE0', vibe: '#7B5CF0', bugs: '#E4322E',
    flo: '#6A3FE0', youtube_music: '#FF3B3B', spotify: '#1DB954'
};

const STREAM_SERVICE_LINKS = [
    { key: 'melon', label: '멜론', icon: 'melon.png', url: 'https://www.melon.com/artist/detail.htm?artistId=3709231' },
    { key: 'genie', label: '지니', icon: 'genie.png', url: 'https://www.genie.co.kr/detail/artistInfo?xxnm=82379125' },
    { key: 'vibe', label: '바이브', icon: 'vibe.png', url: 'https://vibe.naver.com/search?query=RESCENE' },
    { key: 'bugs', label: '벅스', icon: 'bugs.png', url: 'https://music.bugs.co.kr/artist/13624667' },
    { key: 'flo', label: 'FLO', icon: 'flo.png', url: 'https://www.music-flo.com/search/all?keyword=RESCENE' },
    { key: 'youtube_music', label: '유튜브뮤직', icon: 'youtube_music.png', url: 'https://music.youtube.com/search?q=RESCENE' },
    { key: 'spotify', label: '스포티파이', icon: 'spotify.png', url: 'https://open.spotify.com/search/RESCENE' }
];

function renderStreamLinks() {
    const el = document.getElementById('chartStreamLinks');
    if (!el) return;
    el.innerHTML = STREAM_SERVICE_LINKS.map(s =>
        `<a href="${s.url}" target="_blank" rel="noopener" title="${s.label}에서 듣기"><img src="../images/music/${s.icon}" alt="${s.label}" onerror="this.parentElement.style.display='none'"></a>`
    ).join('');
}

let chartActivePlatform = 'all';
let CHART_DATA = { songs: [] };

function chartEsc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderChartTabs() {
    const el = document.getElementById('chartTabbar');
    if (!el) return;
    el.innerHTML = CHART_PLATFORMS.map(p =>
        `<button type="button" class="chart-tab${p.key === chartActivePlatform ? ' active' : ''}" onclick="chartSetPlatform('${p.key}')">${p.label}</button>`
    ).join('');
}

function chartSetPlatform(key) {
    chartActivePlatform = key;
    renderChartTabs();
    renderChartList();
}

/* 종합 탭 — 곡마다 순위 대신 '몇 개 플랫폼에 차트인했는지'를 점으로 보여주는 개요 뷰 */
function chartOverviewRowHtml(song, idx) {
    const noThumb = '<div class="chart-thumb-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>';
    const thumb = song.albumImageUrl ? `<img class="chart-thumb" src="${chartEsc(song.albumImageUrl)}" alt="" loading="lazy">` : noThumb;
    const ranks = song.ranks || {};
    const dots = CHART_PLATFORMS.filter(p => p.key !== 'all').map(p => {
        const on = ranks[p.key] && ranks[p.key].rank != null;
        return `<span class="chart-dot${on ? ' on' : ''}" style="${on ? `background:${CHART_PLATFORM_DOT_COLOR[p.key]};` : ''}" title="${p.label}${on ? ' ' + ranks[p.key].rank + '위' : ''}"></span>`;
    }).join('');
    const chartedCount = Object.values(ranks).filter(r => r && r.rank != null).length;
    return `<div class="chart-row">
        <span class="chart-row-idx">${String(idx + 1).padStart(2, '0')}</span>
        ${thumb}
        <div class="chart-row-info">
            <div class="chart-row-title">${chartEsc(song.songName)}</div>
            <div class="chart-row-artist">${chartEsc(song.artistName)}</div>
        </div>
        <div class="chart-dot-row">${dots}</div>
        <span class="chart-charted-count">${chartedCount}개 플랫폼</span>
    </div>`;
}

/* 개별 플랫폼 탭 — 그 플랫폼 기준 순위로 정렬한 클린한 랭킹 리스트 */
function chartPlatformRowHtml(song, rankInfo) {
    const noThumb = '<div class="chart-thumb-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>';
    const thumb = song.albumImageUrl ? `<img class="chart-thumb" src="${chartEsc(song.albumImageUrl)}" alt="" loading="lazy">` : noThumb;
    const rank = rankInfo.rank;
    const prev = rankInfo.previousRank;
    let deltaHtml;
    if (prev == null) deltaHtml = '<span class="chart-delta new">NEW</span>';
    else if (prev === rank) deltaHtml = '<span class="chart-delta same">–</span>';
    else if (prev > rank) deltaHtml = `<span class="chart-delta up">▲ ${prev - rank}</span>`;
    else deltaHtml = `<span class="chart-delta down">▼ ${rank - prev}</span>`;
    return `<div class="chart-row">
        <span class="chart-row-idx big">${rank}</span>
        ${thumb}
        <div class="chart-row-info">
            <div class="chart-row-title-line">
                <span class="chart-row-title">${chartEsc(song.songName)}</span>
                ${deltaHtml}
            </div>
            <div class="chart-row-artist">${chartEsc(song.artistName)}</div>
        </div>
    </div>`;
}

function renderChartList() {
    const list = document.getElementById('chartList');
    if (!list) return;
    const songs = CHART_DATA.songs || [];
    if (!songs.length) {
        list.innerHTML = '<div class="chart-empty"><div class="ico">🎵</div><p>차트 정보를 불러올 수 없습니다.</p></div>';
        return;
    }

    if (chartActivePlatform === 'all') {
        list.innerHTML = songs.map((song, idx) => chartOverviewRowHtml(song, idx)).join('');
        return;
    }

    const withRank = songs
        .filter(s => s.ranks && s.ranks[chartActivePlatform] && s.ranks[chartActivePlatform].rank != null)
        .sort((a, b) => a.ranks[chartActivePlatform].rank - b.ranks[chartActivePlatform].rank);

    if (!withRank.length) {
        list.innerHTML = '<div class="chart-empty"><div class="ico">📭</div><p>이 플랫폼에는 현재 차트인한 곡이 없어요.</p></div>';
        return;
    }
    list.innerHTML = withRank.map(song => chartPlatformRowHtml(song, song.ranks[chartActivePlatform])).join('');
}

async function fetchSongCharts() {
    renderChartTabs();
    renderStreamLinks();
    try {
        const response = await fetch('chart_data.json?t=' + Date.now());
        const data = await response.json();
        CHART_DATA = data;
        const timeEl = document.getElementById('currentTime');
        if (timeEl && data.updatedAt) {
            const d = new Date(data.updatedAt);
            timeEl.innerText = '업데이트: ' + d.toLocaleString('ko-KR');
        }
        renderChartList();
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
