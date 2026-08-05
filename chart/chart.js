const CHART_PLATFORMS = [
    { key: 'all', label: '종합' },
    { key: 'melon', label: 'Melon' },
    { key: 'genie', label: 'Geinie' },
    { key: 'vibe', label: 'VIBE' },
    { key: 'bugs', label: 'BUGS' },
    { key: 'flo', label: 'FLO' },
    { key: 'youtube_music', label: 'YOUTUBE MUSIC' },
    { key: 'spotify', label: 'SPOTIFTY' }
];
function renderChartWave() {
    const wave = document.getElementById('chartWave');
    if (!wave) return;
    const BAR_COUNT = 56; // 넓은 화면에서도 끊기지 않게 충분히 촘촘하게
    let html = '';
    for (let i = 0; i < BAR_COUNT; i++) {
        const duration = (0.9 + Math.random() * 0.9).toFixed(2); // 0.9s ~ 1.8s
        const delay = (-Math.random() * 1.8).toFixed(2); // 각자 다른 타이밍에서 시작 (음수 delay = 이미 진행중인 지점에서 시작)
        html += `<span style="animation-duration:${duration}s; animation-delay:${delay}s;"></span>`;
    }
    wave.innerHTML = html;
}
window.addEventListener('DOMContentLoaded', renderChartWave);

const CHART_PLATFORM_DOT_COLOR = {
    melon: '#00CD3C', genie: '#1E7DE0', vibe: '#7B5CF0', bugs: '#E4322E',
    flo: '#6A3FE0', youtube_music: '#FF3B3B', spotify: '#1DB954'
};

// ⭐️ 곡별 플랫폼 전용 링크는 따로 없어서, 각 플랫폼 검색 결과로 연결 (항상 유효한 방식)
function chartPlatformSearchUrl(key, query) {
    const q = encodeURIComponent(query);
    const urls = {
        melon: `https://www.melon.com/search/total/index.htm?q=${q}`,
        genie: `https://www.genie.co.kr/search/searchMain?query=${q}`,
        vibe: `https://vibe.naver.com/search?query=${q}`,
        bugs: `https://music.bugs.co.kr/search/integrated?q=${q}`,
        flo: `https://www.music-flo.com/search/more/track?keyword=${q}`,
        youtube_music: `https://music.youtube.com/search?q=${q}`,
        spotify: `https://open.spotify.com/search/${q}`
    };
    return urls[key] || '#';
}

let chartActivePlatform = 'all';
let CHART_DATA = { songs: [] };

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
    const thumb = song.albumImageUrl ? `<img class="chart-thumb" src="${escapeHtml(song.albumImageUrl)}" alt="" loading="lazy">` : noThumb;
    const ranks = song.ranks || {};
    const dots = CHART_PLATFORMS.filter(p => p.key !== 'all').map(p => {
        const on = ranks[p.key] && ranks[p.key].rank != null;
        return `<span class="chart-dot${on ? ' on' : ''}" style="${on ? `background:${CHART_PLATFORM_DOT_COLOR[p.key]};` : ''}" title="${p.label}${on ? ' ' + ranks[p.key].rank + '위' : ''}"></span>`;
    }).join('');
    const chartedCount = Object.values(ranks).filter(r => r && r.rank != null).length;
    const linksId = `plinks-${song.songId || idx}`.replace(/[^a-zA-Z0-9_-]/g, '');
    return `<div class="chart-row">
        <span class="chart-row-idx">${String(idx + 1).padStart(2, '0')}</span>
        ${thumb}
        <div class="chart-row-info">
            <div class="chart-row-title">${escapeHtml(song.songName)}</div>
            <div class="chart-row-artist">${escapeHtml(song.artistName)}</div>
        </div>
        <div class="chart-dot-row">${dots}</div>
        <span class="chart-charted-count">${chartedCount}개 플랫폼</span>
        <div class="chart-platform-wrap">
            <button type="button" class="chart-platform-btn" title="플랫폼 바로가기" aria-label="플랫폼 바로가기" onclick="chartTogglePlatformLinks(event, '${linksId}', ${escapeHtml(JSON.stringify(song.songName))}, ${escapeHtml(JSON.stringify(song.artistName))})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </button>
            <div class="chart-platform-pop" id="${linksId}"></div>
        </div>
    </div>`;
}

/* 개별 플랫폼 탭 — 그 플랫폼 기준 순위로 정렬한 클린한 랭킹 리스트 */
function chartPlatformRowHtml(song, rankInfo) {
    const noThumb = '<div class="chart-thumb-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>';
    const thumb = song.albumImageUrl ? `<img class="chart-thumb" src="${escapeHtml(song.albumImageUrl)}" alt="" loading="lazy">` : noThumb;
    const rank = rankInfo.rank;
    const prev = rankInfo.previousRank;
    let deltaHtml;
    if (prev == null) deltaHtml = '<span class="chart-delta new">NEW</span>';
    else if (prev === rank) deltaHtml = '<span class="chart-delta same">–</span>';
    else if (prev > rank) deltaHtml = `<span class="chart-delta up">▲ ${prev - rank}</span>`;
    else deltaHtml = `<span class="chart-delta down">▼ ${rank - prev}</span>`;
    const shareId = `share-${song.songId || rank}-${chartActivePlatform}`.replace(/[^a-zA-Z0-9_-]/g, '');
    return `<div class="chart-row">
        <span class="chart-row-idx big">${rank}</span>
        ${thumb}
        <div class="chart-row-info">
            <div class="chart-row-title-line">
                <span class="chart-row-title">${escapeHtml(song.songName)}</span>
                ${deltaHtml}
            </div>
            <div class="chart-row-artist">${escapeHtml(song.artistName)}</div>
        </div>
        <div class="chart-share-wrap">
            <button type="button" class="chart-share-btn" title="공유하기" aria-label="공유하기" onclick="chartToggleShare(event, '${shareId}', ${escapeHtml(JSON.stringify(song.songName))}, ${escapeHtml(JSON.stringify(song.artistName))})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"></line><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"></line></svg>
            </button>
            <div class="chart-share-pop" id="${shareId}"></div>
        </div>
    </div>`;
}

/* ⭐️ 공유하기 — 모바일은 OS 공유시트(카카오톡 포함 설치된 앱 전부 뜸)로 바로 열고,
   데스크톱은 카카오톡 / X / 링크복사 팝오버를 곡 행 옆에 띄움 */
let chartShareOpenId = null;

function chartShare(songName, artistName) {
    return {
        title: `${songName} - ${artistName} | RESCENE MUSIC CHARTS`,
        url: window.location.href
    };
}

function chartToggleShare(evt, id, songName, artistName) {
    evt.stopPropagation();
    const info = chartShare(songName, artistName);

    // 모바일 등 OS 공유시트를 지원하면 그걸로 바로 — 카카오톡이 설치돼 있으면 목록에 자동으로 뜸
    if (navigator.share) {
        navigator.share(info).catch(() => {});
        return;
    }

    const pop = document.getElementById(id);
    if (!pop) return;
    const willOpen = chartShareOpenId !== id;
    document.querySelectorAll('.chart-share-pop.open').forEach(el => el.classList.remove('open'));
    chartShareOpenId = willOpen ? id : null;
    if (!willOpen) return;

    const encodedUrl = encodeURIComponent(info.url);
    const encodedText = encodeURIComponent(info.title);
    pop.innerHTML = `
        <button type="button" onclick="chartShareKakao(${JSON.stringify(songName)}, ${JSON.stringify(artistName)})">
            <span class="dot" style="background:#FEE500;"></span>카카오톡으로 공유
        </button>
        <a href="https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}" target="_blank" rel="noopener">
            <span class="dot" style="background:#000;"></span>X로 공유
        </a>
        <button type="button" onclick="chartShareCopy(this, ${JSON.stringify(info.url)})">
            <span class="dot" style="background:var(--c-accent);"></span>링크 복사
        </button>
    `;
    pop.classList.add('open');
}

// ⭐️ 플랫폼 아이콘 바로가기 팝오버 — 공유버튼과 동일하게, 평소엔 숨겨두고 버튼 눌렀을 때만 펼침
let chartPlatformLinksOpenId = null;

function chartTogglePlatformLinks(evt, id, songName, artistName) {
    evt.stopPropagation();
    const pop = document.getElementById(id);
    if (!pop) return;
    const willOpen = chartPlatformLinksOpenId !== id;
    document.querySelectorAll('.chart-platform-pop.open').forEach(el => el.classList.remove('open'));
    document.querySelectorAll('.chart-share-pop.open').forEach(el => el.classList.remove('open'));
    chartPlatformLinksOpenId = willOpen ? id : null;
    if (!willOpen) return;

    const query = `${songName} ${artistName}`;
    pop.innerHTML = CHART_PLATFORMS.filter(p => p.key !== 'all').map(p => `
        <a href="${chartPlatformSearchUrl(p.key, query)}" target="_blank" rel="noopener" title="${p.label}에서 찾아보기">
            <img src="../images/music/${p.key}.png" alt="${p.label}" loading="lazy">
        </a>
    `).join('');
    pop.classList.add('open');
}

function chartShareKakao(songName, artistName) {
    const info = chartShare(songName, artistName);
    // 카카오 JS SDK가 연결돼 있으면(Kakao.init 완료) 정식 카카오톡 공유 카드로 전송
    if (window.Kakao && window.Kakao.isInitialized && window.Kakao.isInitialized()) {
        window.Kakao.Share.sendDefault({
            objectType: 'text',
            text: info.title,
            link: { mobileWebUrl: info.url, webUrl: info.url }
        });
        return;
    }
    // SDK 연결 전이면 링크만 복사해서 카카오톡에 직접 붙여넣도록 안내
    chartShareCopy(null, info.url, '카카오톡 SDK가 아직 연결되지 않아 링크를 복사했어요. 카카오톡 채팅방에 붙여넣어주세요!');
}

function chartShareCopy(btn, url, msg) {
    navigator.clipboard.writeText(url).then(() => {
        chartShowToast(msg || '링크를 복사했어요!');
    }).catch(() => {
        chartShowToast('복사에 실패했어요. 직접 주소창에서 복사해주세요.');
    });
    document.querySelectorAll('.chart-share-pop.open').forEach(el => el.classList.remove('open'));
    chartShareOpenId = null;
}

function chartShowToast(msg) {
    let toast = document.getElementById('chartToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'chartToast';
        toast.className = 'chart-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

document.addEventListener('click', (e) => {
    if (!chartShareOpenId) return;
    const openPop = document.getElementById(chartShareOpenId);
    if (openPop && !openPop.contains(e.target) && !e.target.closest('.chart-share-btn')) {
        openPop.classList.remove('open');
        chartShareOpenId = null;
    }
});
document.addEventListener('click', (e) => {
    if (!chartPlatformLinksOpenId) return;
    const openPop = document.getElementById(chartPlatformLinksOpenId);
    if (openPop && !openPop.contains(e.target) && !e.target.closest('.chart-platform-btn')) {
        openPop.classList.remove('open');
        chartPlatformLinksOpenId = null;
    }
});

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
