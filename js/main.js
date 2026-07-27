const debutDate = new Date("2024-03-26T18:00:00+09:00"); 
setInterval(() => {
    const diff = new Date() - debutDate;
    const dDayText = document.getElementById('dDayText');
    const timeFlowText = document.getElementById('timeFlowText');
    if (dDayText) dDayText.innerText = `D+${Math.floor(diff / (1000 * 60 * 60 * 24))}`;
    if (timeFlowText) timeFlowText.innerText = `${String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0')}:${String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, '0')}:${String(Math.floor((diff / 1000) % 60)).padStart(2, '0')}`;
}, 1000);

/* =========================================
   이미지 모달
========================================= */
function openImageModal(src) { document.getElementById('fullSizeImage').src = src; document.getElementById('imageModal').classList.add('active'); document.getElementById('imageModalBackdrop').classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeImageModal() { document.getElementById('imageModal').classList.remove('active'); document.getElementById('imageModalBackdrop').classList.remove('active'); document.body.style.overflow = 'auto'; }


/* =========================================
   오늘의 일정 (index.html 전용 위젯)
   ⭐️ scheduleDB / fetchScheduleData / 캘린더 렌더링은 js/common.js 참고
========================================= */
function getTodayKey() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
function getItemStatus(timeStr) {
    const statusDict = window.t ? window.t('status') : { upcoming: '예정', live: 'LIVE', ended: '종료' };
    if (!timeStr || !timeStr.includes(':')) return { key: 'upcoming', label: statusDict.upcoming || '예정' };
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date(); const eventMin = h * 60 + m; const nowMin = now.getHours() * 60 + now.getMinutes();
    if (Math.abs(nowMin - eventMin) <= 30) return { key: 'live', label: statusDict.live || 'LIVE' };
    if (nowMin > eventMin) return { key: 'ended', label: statusDict.ended || '종료' };
    return { key: 'upcoming', label: statusDict.upcoming || '예정' };
}

let __todayHtmlCache = null;
function renderTodaySchedule() {
    const grid = document.getElementById('todayScheduleGrid');
    const sub  = document.getElementById('todayDateSub');
    if (!grid) return;
    const now = new Date();
    const weekdays = window.t ? window.t('weekdays') : ["일", "월", "화", "수", "목", "금", "토"];
    if (sub) sub.innerText = `${now.getFullYear()}. ${String(now.getMonth()+1).padStart(2,'0')}. ${String(now.getDate()).padStart(2,'0')} (${weekdays[now.getDay()]})`;

    const items = scheduleDB[getTodayKey()]?.items || [];
    const typeLabelMap = window.t ? window.t('scheduleTypes') : {};
    const emptyMsg = window.t ? window.t('noSchedule') : '등록된 일정이 없습니다.';
    const viewMsg = window.t ? window.t('upcomingView') : '다가오는 일정 보기';

    let html = items.length === 0 
        ? `<div class="today-empty-card"><div class="mark"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg></div><p>${emptyMsg}</p><button type="button" onclick="openCalendarPopup()">${viewMsg}</button></div>`
        : items.map(item => {
            const status = getItemStatus(item.time), label = typeLabelMap[item.type] || item.type || '일정';
            const timeTbd = window.t ? window.t('timeTbd') : '시간 미정';
            const timeHtml = item.time ? item.time : `<span class="tbd">${timeTbd}</span>`;
            const statusHtml = status.key === 'live' ? `<span class="today-status is-live"><span class="live-dot"></span>${status.label}</span>` : `<span class="today-status">${status.label}</span>`;
            return `<article class="today-card is-${status.key}" style="--accent-color:${item.color};"><div class="today-card-top"><span class="today-time">${timeHtml}</span>${statusHtml}</div><h3 class="today-title">${item.title}</h3><div class="today-card-foot"><span class="today-type"><span class="today-type-dot"></span>${label}</span></div></article>`;
        }).join('');
    if (html !== __todayHtmlCache) { grid.innerHTML = html; __todayHtmlCache = html; }
}
setInterval(renderTodaySchedule, 60000);

/* =========================================
   실시간 음원 차트 로직
========================================= */
let tickerInterval;
async function fetchSongCharts() {
    try {
        const response = await fetch('chart_data.json?t=' + new Date().getTime());
        const data = await response.json();
        const timeEl = document.getElementById('currentTime');
        if(timeEl) timeEl.innerText = (data.update_time || new Date().toLocaleTimeString('ko-KR'));
        
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
                if (platform === 'Melon') logoHtml = `<img src="images/melon.jpeg" alt="Melon" class="p-logo-img" onerror="this.style.display='none'">`;
                if (platform === 'Bugs') logoHtml = `<img src="images/bugs.jpg" alt="Bugs" class="p-logo-img" onerror="this.style.display='none'">`;
                tickerHtml += `<div class="ticker-item"><div class="ticker-platform">${logoHtml}</div><div class="ticker-songs">${songsHtml}</div></div>`;
            }
        });
        
        const waitingMsg = (typeof window.t === 'function') ? window.t('chartWaiting') : '데이터 수집 중입니다.';
        const wrapper = document.getElementById('tickerWrapper');
        if(wrapper) {
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
        if(wrapper) wrapper.innerHTML = `<div class="ticker-item"><div style="color:#666; font-size:13px;">차트 업데이트를 대기 중입니다.</div></div>`;
    }
}

/* =========================================
   콘텐츠(아카이브 & 앨범, 쇼츠) 그리기
========================================= */
function renderProfileArchive() {
    const profileWrap = document.getElementById('profileScroll'); 
    if (profileWrap) {
        let phtml = '';
        for (let i = 1; i <= 10; i++) {
            phtml += `<div class="profile-item" onclick="openImageModal('images/profile/${i}.jpg')"><img src="images/profile/${i}.jpg" alt="RESCENE profile ${i}" loading="lazy" onerror="this.closest('.profile-item').style.display='none'"><span class="pf-index">NO. ${String(i).padStart(2, '0')}</span></div>`;
        }
        profileWrap.innerHTML = `<div class="profile-track">${phtml}</div>`;
        enableDragScroll(profileWrap);
    }

    // ⭐️ 앨범 커버/순서/트랙 정보는 js/albums.js (앨범 모음.txt 기준) 참고
    if (typeof renderAlbumGrid === 'function') {
        try { renderAlbumGrid(); } catch (e) { console.error('renderAlbumGrid 실패:', e); }
    } else {
        console.warn('js/albums.js 가 로드되지 않았습니다. index.html의 <script src="js/albums.js"> 및 파일 존재 여부를 확인하세요.');
    }
}

// ⭐️ 마우스로 좌우 드래그해서 넘겨볼 수 있게 (터치는 브라우저가 기본으로 지원)
function enableDragScroll(el) {
    if (!el) return;
    let isDown = false, startX = 0, startScrollLeft = 0, moved = false;
    el.addEventListener('mousedown', (e) => {
        isDown = true; moved = false;
        el.classList.add('dragging');
        startX = e.pageX; startScrollLeft = el.scrollLeft;
    });
    window.addEventListener('mouseup', () => { isDown = false; el.classList.remove('dragging'); });
    el.addEventListener('mouseleave', () => { isDown = false; el.classList.remove('dragging'); });
    el.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const delta = e.pageX - startX;
        if (Math.abs(delta) > 5) moved = true;
        el.scrollLeft = startScrollLeft - delta;
    });
    // 드래그 후 클릭(이미지 확대)이 오작동하지 않도록, 실제로 움직였을 때만 클릭 막기
    el.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); } }, true);

    // ⭐️ 마우스 휠(위/아래)로도 좌우로 넘어가게 — 부드럽게 감속되는 애니메이션 적용
    let wheelTarget = null, wheelAnimating = false;
    function animateWheel() {
        if (wheelAnimating) return;
        wheelAnimating = true;
        (function step() {
            const diff = wheelTarget - el.scrollLeft;
            if (Math.abs(diff) < 0.5) { el.scrollLeft = wheelTarget; wheelAnimating = false; return; }
            el.scrollLeft += diff * 0.18;
            requestAnimationFrame(step);
        })();
    }
    el.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            const maxScroll = el.scrollWidth - el.clientWidth;
            if (wheelTarget === null) wheelTarget = el.scrollLeft;
            wheelTarget = Math.max(0, Math.min(maxScroll, wheelTarget + e.deltaY));
            animateWheel();
        }
    }, { passive: false });
}

function renderShortsGallery() {
    const wrap = document.getElementById('shortsScroll'); if (!wrap) return;
    const shortsIds = ["jgaWSOXyH_o", "v6n4XQdX6_8", "dOllJ26kfIY"];
    let html = shortsIds.map(id => `<a class="shorts-card" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener"><img src="https://img.youtube.com/vi/${id}/hqdefault.jpg" alt="RESCENE video" loading="lazy"><div class="sc-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div></a>`).join('');
    
    const moreText = window.t ? window.t('shortsMore') : '유튜브에서<br>#리센느 더보기';
    html += `<a class="shorts-card shorts-more" href="https://www.youtube.com/results?search_query=%23%EB%A6%AC%EC%84%BC%EB%8A%90" target="_blank" rel="noopener"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18l6-6-6-6"/></svg><span>${moreText}</span></a>`;
    wrap.innerHTML = html;
}

window.addEventListener('DOMContentLoaded', () => { 
    try { renderProfileArchive(); } catch (e) { console.error('renderProfileArchive 실패:', e); }
    try { renderShortsGallery(); } catch (e) { console.error('renderShortsGallery 실패:', e); }
    try { fetchSongCharts(); } catch (e) { console.error('fetchSongCharts 실패:', e); }
    setInterval(fetchSongCharts, 60000);
});
