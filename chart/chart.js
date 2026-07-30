let tickerInterval;
async function fetchSongCharts() {
    try {
        const response = await fetch('../chart_data.json?t=' + new Date().getTime());
        const data = await response.json();
        const timeEl = document.getElementById('currentTime');
        if (timeEl) timeEl.innerText = (data.update_time || new Date().toLocaleTimeString('ko-KR'));

        let tickerHtml = ''; let validCount = 0;
        ["Melon", "Bugs", "Genie", "FLO", "VIBE"].forEach(platform => {
            let songsHtml = '';
            if (data.songs) {
                for (const songTitle in data.songs) {
                    const pd = data.songs[songTitle][platform];
                    if (pd) {
                        let rec = pd["실시간 (HOT100)"] || pd["실시간"] || pd["24시간"];
                        if (rec) {
                            let diffClass = 'diff-none'; let diffText = rec.diff;
                            if (diffText === 'NEW' || diffText === '0' || diffText === '유지' || diffText === '') diffText = '-';
                            if (diffText.includes('▲')) diffClass = 'diff-up'; else if (diffText.includes('▼')) diffClass = 'diff-down'; else if (diffText === 'NEW') diffClass = 'diff-new'; else if (diffText === '-') diffClass = 'diff-none';
                            songsHtml += `<div class="ticker-song-info"><span class="title">${songTitle}</span><span class="rank">${rec.rank}</span><span class="rank-diff ${diffClass}">${diffText}</span></div>`;
                        }
                    }
                }
            }
            if (songsHtml !== '') {
                validCount++;
                let logoHtml = `<span class="p-logo">${platform}</span>`;
                if (platform === 'Melon') logoHtml = `<img src="../images/melon.jpeg" alt="Melon" class="p-logo-img" onerror="this.style.display='none'">`;
                if (platform === 'Bugs') logoHtml = `<img src="../images/bugs.jpg" alt="Bugs" class="p-logo-img" onerror="this.style.display='none'">`;
                tickerHtml += `<div class="ticker-item"><div class="ticker-platform">${logoHtml}</div><div class="ticker-songs">${songsHtml}</div></div>`;
            }
        });

        const waitingMsg = (typeof window.t === 'function') ? window.t('chartWaiting') : '데이터 수집 중입니다.';
        const wrapper = document.getElementById('tickerWrapper');
        if (wrapper) {
            wrapper.innerHTML = tickerHtml || `<div class="ticker-item"><div style="color:#666; font-size:13px;">${waitingMsg}</div></div>`;
            clearInterval(tickerInterval);
            if (validCount > 1) {
                let cIdx = 0;
                tickerInterval = setInterval(() => { cIdx = (cIdx + 1) % validCount; wrapper.style.transform = `translateY(-${cIdx * 56}px)`; }, 4000);
            }
        }
    } catch (e) {
        console.log("차트 대기 중", e);
        const wrapper = document.getElementById('tickerWrapper');
        if (wrapper) wrapper.innerHTML = `<div class="ticker-item"><div style="color:#666; font-size:13px;">차트 업데이트를 대기 중입니다.</div></div>`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    try { fetchSongCharts(); } catch (e) { console.error('fetchSongCharts 실패:', e); }
    setInterval(fetchSongCharts, 60000);
});
