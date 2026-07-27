/* =========================================
   공통 유틸리티
========================================= */
function scrollToSection(id) { document.getElementById(id).scrollIntoView({ behavior: 'smooth' }); }
function toggleMobileMenu() {
    document.getElementById('hamburgerBtn').classList.toggle('active');
    document.getElementById('mobileMenuPanel').classList.toggle('active');
    document.getElementById('mobileMenuBackdrop').classList.toggle('active');
    document.body.style.overflow = document.getElementById('mobileMenuPanel').classList.contains('active') ? 'hidden' : 'auto';
}
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('rescene-theme', next);
    updateThemeIcon(next);
}

const sunIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
const moonIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

function updateThemeIcon(theme) { 
    const btn = document.getElementById('themeToggleBtn'); 
    if (btn) btn.innerHTML = (theme === 'dark') ? sunIcon : moonIcon; 
}
window.addEventListener('DOMContentLoaded', () => { updateThemeIcon(document.documentElement.getAttribute('data-theme') || 'dark'); });

const observer = new IntersectionObserver((entries) => { entries.forEach(e => { if(e.isIntersecting) { e.target.classList.add('active'); } }); }, { threshold: 0.15 });
document.querySelectorAll('.reveal, .slow-reveal').forEach(el => observer.observe(el));

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
   스케줄 캘린더 및 오늘의 일정
========================================= */
let scheduleDB = {};
let currentCalYear = new Date().getFullYear(); 
let currentCalMonth = new Date().getMonth() + 1; 

const colorMap = { "broadcast": "#7e57c2", "fansign": "#ec407a", "event": "#66bb6a", "concert": "#26c6da", "radio": "#ffa726", "notice": "#78909c" };

async function fetchScheduleData() {
    try {
        const response = await fetch('js/schedule_data.json?t=' + new Date().getTime());
        const rawData = await response.json();
        scheduleDB = {}; 
        if (rawData && rawData.events) {
            rawData.events.forEach(ev => {
                if (!ev.date) return;
                if (!scheduleDB[ev.date]) { scheduleDB[ev.date] = { items: [] }; }
                scheduleDB[ev.date].items.push({
                    time: ev.time || "", title: ev.title, type: ev.type || "",
                    color: colorMap[ev.type] || "var(--c-accent)", image: ""
                });
            });
        }
    } catch (error) { console.warn("스케줄 데이터 로드 실패", error); }
    renderCalendar();
    renderTodaySchedule();
}

function getTodayKey() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
function getItemStatus(timeStr) {
    if (!timeStr || !timeStr.includes(':')) return { key: 'upcoming', label: '예정' };
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date(); const eventMin = h * 60 + m; const nowMin = now.getHours() * 60 + now.getMinutes();
    if (Math.abs(nowMin - eventMin) <= 30) return { key: 'live', label: 'LIVE' };
    if (nowMin > eventMin) return { key: 'ended', label: '종료' };
    return { key: 'upcoming', label: '예정' };
}

let __todayHtmlCache = null;
function renderTodaySchedule() {
    const grid = document.getElementById('todayScheduleGrid');
    if (!grid) return;

    const data  = scheduleDB[getTodayKey()];
    const items = data && data.items ? data.items : [];
    let html;
    
    if (items.length === 0) {
        html = `<div class="today-empty-card"><div class="mark"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg></div><p>오늘은 등록된 일정이 없습니다.</p><button type="button" onclick="openCalendarPopup()">다가오는 일정 보기</button></div>`;
    } else {
        html = items.map(item => {
            const status = getItemStatus(item.time), label = item.type || '일정';
            const timeHtml = item.time ? item.time : `<span class="tbd">시간 미정</span>`;
            const statusHtml = status.key === 'live' ? `<span class="today-status is-live"><span class="live-dot"></span>${status.label}</span>` : `<span class="today-status">${status.label}</span>`;
            return `<article class="today-card is-${status.key}" style="--accent-color:${item.color};"><div class="today-card-top"><span class="today-time">${timeHtml}</span>${statusHtml}</div><h3 class="today-title">${item.title}</h3><div class="today-card-foot"><span class="today-type"><span class="today-type-dot"></span>${label}</span></div></article>`;
        }).join('');
    }
    if (html === __todayHtmlCache) return;
    __todayHtmlCache = html; grid.innerHTML = html;
}
setInterval(renderTodaySchedule, 60000);

function renderCalendar() { 
    const calendarDays = document.getElementById('calendarDays'); 
    if (!calendarDays) return;
    const monthText = document.getElementById('calendarMonthText');
    if(monthText) monthText.innerText = `${currentCalYear}. ${String(currentCalMonth).padStart(2, '0')}`; 
    const firstDayIndex = new Date(currentCalYear, currentCalMonth - 1, 1).getDay(), lastDate = new Date(currentCalYear, currentCalMonth, 0).getDate(); 
    let html = ''; 
    for (let i = 0; i < firstDayIndex; i++) { html += `<div class="day-cell empty"></div>`; } 
    for (let i = 1; i <= lastDate; i++) { 
        const dateKey = `${currentCalYear}-${String(currentCalMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`; 
        const data = scheduleDB[dateKey]; const hasEvent = data && data.items && data.items.length > 0 ? 'has-event' : ''; 
        let eventsHtml = ''; 
        if (data && data.items) { 
            data.items.forEach(item => { 
                let dotColor = item.color ? item.color : 'var(--c-accent)'; 
                eventsHtml += `<div class="cal-event-row"><div class="cal-dot" style="background: ${dotColor}; box-shadow: 0 0 6px ${dotColor}60;"></div><div class="cal-event-time" style="color: ${dotColor};">${item.time}</div><div class="cal-event-title">${item.title}</div></div>`; 
            }); 
        } 
        html += `<div class="day-cell ${hasEvent}" onclick="openModal('${currentCalYear}', '${currentCalMonth}', '${i}', '${dateKey}')"><span class="day-number">${i}</span><div class="cell-event-list">${eventsHtml}</div></div>`; 
    } 
    for (let i = 0; i < (42 - (firstDayIndex + lastDate)); i++) { html += `<div class="day-cell empty"></div>`; }
    calendarDays.innerHTML = html; 
}

function changeMonth(delta) { 
    currentCalMonth += delta; 
    if(currentCalMonth > 12) { currentCalMonth = 1; currentCalYear++; } else if(currentCalMonth < 1) { currentCalMonth = 12; currentCalYear--; } 
    renderCalendar(); 
}

function openCalendarPopup() { 
    const modal = document.getElementById('calendarPopupModal'), backdrop = document.getElementById('calPopupBackdrop');
    if(modal && backdrop) { modal.classList.add('active'); backdrop.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeCalendarPopup() { 
    const modal = document.getElementById('calendarPopupModal'), backdrop = document.getElementById('calPopupBackdrop'), detailModal = document.getElementById('scheduleModal');
    if(modal) { modal.classList.remove('active'); modal.classList.remove('split-active'); }
    if(backdrop) backdrop.classList.remove('active'); if(detailModal) detailModal.classList.remove('active');
    document.body.style.overflow = 'auto'; 
}

function openModal(year, month, day, dateKey) {
    const calWrapper = document.getElementById('calendarPopupModal');
    if (calWrapper && window.innerWidth > 1000) calWrapper.classList.add('split-active'); 

    const dateTitle = `${year}년 ${month}월 ${day}일`; const data = scheduleDB[dateKey]; 
    let scheduleHtml = `<div class="elegant-date-header">${dateTitle}</div>`;
    
    if (data && data.items && data.items.length > 0) {
        data.items.forEach(item => { 
            let dotColor = item.color ? item.color : 'var(--c-accent)'; let label = item.type || '일정'; let time = item.time ? item.time : '시간 미정';
            scheduleHtml += `<div class="ec-card"><span class="ec-badge" style="background-color: ${dotColor}; box-shadow: 0 4px 12px ${dotColor}40;">${label}</span><h2 class="ec-title">${item.title}</h2><div class="ec-meta"><div class="ec-meta-row"><span class="ec-meta-label">시간</span><span class="ec-meta-val">${time}</span></div></div>`;
            if (item.image) scheduleHtml += `<div class="ec-img-wrapper"><img src="${item.image}" alt="${item.title}" onerror="this.style.display='none'"></div>`; 
            scheduleHtml += `</div>`;
        });
    } else { scheduleHtml += `<div class="schedule-detail-empty">등록된 일정이 없습니다.</div>`; }
    
    const textEl = document.getElementById('modalScheduleText'); if(textEl) textEl.innerHTML = scheduleHtml;
    const scheduleModal = document.getElementById('scheduleModal'), backdrop = document.getElementById('modalBackdrop');
    if(scheduleModal) scheduleModal.classList.add('active'); if(backdrop) backdrop.classList.add('active');
}

function closeModal() { 
    const scheduleModal = document.getElementById('scheduleModal'), backdrop = document.getElementById('modalBackdrop'), calModal = document.getElementById('calendarPopupModal');
    if(scheduleModal) scheduleModal.classList.remove('active'); if(backdrop) backdrop.classList.remove('active'); if(calModal) calModal.classList.remove('split-active'); 
}


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
        
        const wrapper = document.getElementById('tickerWrapper');
        if(wrapper) {
            wrapper.innerHTML = tickerHtml || `<div class="ticker-item"><div style="color:#666; font-size:13px;">데이터 수집 중입니다.</div></div>`;
            clearInterval(tickerInterval);
            if (validCount > 1) {
                let cIdx = 0;
                tickerInterval = setInterval(() => { cIdx = (cIdx + 1) % validCount; wrapper.style.transform = `translateY(-${cIdx * 56}px)`; }, 4000); 
            }
        }
    } catch (e) { console.log("차트 대기 중"); }
}

/* =========================================
   ⭐️ 콘텐츠(아카이브 & 앨범, 쇼츠) 그리기
========================================= */
function renderProfileArchive() {
    // 1. PROFILE PHOTO 영역 렌더링 (1번~10번 이미지)
    const profileWrap = document.getElementById('profileScroll'); 
    if (profileWrap) {
        let phtml = '';
        for (let i = 1; i <= 10; i++) {
            phtml += `<div class="profile-item" onclick="openImageModal('images/profile/${i}.jpg')"><img src="images/profile/${i}.jpg" alt="RESCENE profile ${i}" loading="lazy" onerror="this.closest('.profile-item').style.display='none'"><span class="pf-index">NO. ${String(i).padStart(2, '0')}</span></div>`;
        }
        profileWrap.innerHTML = `<div class="profile-track">${phtml}${phtml}</div>`;
    }

    // 2. ALBUM 영역 렌더링 (요청하신 20개 이미지 배열 순회)
    const albumWrap = document.getElementById('albumScroll');
    if (albumWrap) {
        const albumImages = [
            "Counting Start.jpg", "Glowup eng.jpg", "Glowup.jpg", "SCENEDROME.jpg", 
            "boryung.jpg", "bugs.jpg", "busy.jpg", "busy_2.jpg", "dejavu.jpg", 
            "go.jpg", "lip bomb.jpg", "namju.jpg", "namju2.jpg", "pinball japan.jpg", 
            "pretty.jpg", "run.jpg", "uhuh japan.jpg", "uhuh.jpg", "yoyo japan.jpg", "yoyo.jpg"
        ];
        let ahtml = '';
        albumImages.forEach(function(imgName) {
            ahtml += `<div class="profile-item" onclick="openImageModal('images/${imgName}')"><img src="images/${imgName}" alt="${imgName}" loading="lazy" onerror="this.closest('.profile-item').style.display='none'"></div>`;
        });
        albumWrap.innerHTML = `<div class="profile-track">${ahtml}${ahtml}</div>`;
    }
}

function renderShortsGallery() {
    const wrap = document.getElementById('shortsScroll'); if (!wrap) return;
    const shortsIds = ["jgaWSOXyH_o", "v6n4XQdX6_8", "dOllJ26kfIY"];
    let html = shortsIds.map(id => `<a class="shorts-card" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener"><img src="https://img.youtube.com/vi/${id}/hqdefault.jpg" alt="RESCENE video" loading="lazy"><div class="sc-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div></a>`).join('');
    html += `<a class="shorts-card shorts-more" href="https://www.youtube.com/results?search_query=%23%EB%A6%AC%EC%84%BC%EB%8A%90" target="_blank" rel="noopener"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18l6-6-6-6"/></svg><span>유튜브에서<br>#리센느 더보기</span></a>`;
    wrap.innerHTML = html;
}

// 발자취 데이터는 기존과 동일
const historyData = [
    { date: "2024. 03. 26", title: "DEBUT SHOWCASE LIVE", vid: "jgaWSOXyH_o", timeIndex: 0 }, 
    { date: "2024. 03. 26", title: "싱글 1집 《Re:Scene》 발매 (데뷔)", timeIndex: 5 }, 
    { date: "2024. 05", title: "코스모폴리탄 코리아 5월호 화보", timeIndex: 7 }
];
let slotTimer; let seqTimeouts = []; let progressInterval;
const TOTAL_DURATION_MS = 38000; let currentElapsedMs = 0;

function clearHistorySequence() {
    clearInterval(slotTimer); clearInterval(progressInterval);
    seqTimeouts.forEach(clearTimeout); seqTimeouts = []; currentElapsedMs = 0;
    const yt = document.getElementById('historyYoutubeBg'), bg = document.getElementById('historyModalBg');
    const dateEl = document.getElementById('seqDate'), titleEl = document.getElementById('seqTitle');
    const btnEl = document.querySelector('.timeline-link-text'), progressBar = document.getElementById('historyProgressBar');
    if(yt) yt.src = ""; if(bg) { bg.style.transition = "none"; bg.classList.remove('show'); }
    if(dateEl) { dateEl.style.transition = "none"; dateEl.style.opacity = 1; dateEl.classList.remove('counting'); dateEl.innerText = ""; }
    if(titleEl) { titleEl.style.transition = ""; titleEl.style.transform = ""; titleEl.style.opacity = ""; titleEl.classList.remove('show'); }
    if(btnEl) btnEl.classList.remove('show'); if(progressBar) progressBar.style.width = '0%';
}

function startHistorySequence(skipToMs = 0) {
    clearHistorySequence(); 
    const dateEl = document.getElementById('seqDate'), titleEl = document.getElementById('seqTitle');
    const bg = document.getElementById('historyModalBg'), yt = document.getElementById('historyYoutubeBg');
    dateEl.classList.add('counting'); dateEl.style.transition = "none"; dateEl.innerText = "0000. 01. 01";
    seqTimeouts.push(setTimeout(() => {
        dateEl.classList.remove('counting'); dateEl.style.opacity = 0;
        seqTimeouts.push(setTimeout(() => {
            dateEl.innerText = "2024. 03. 26"; titleEl.innerHTML = "DEBUT SHOWCASE LIVE";
            titleEl.style.transition = "opacity 2s ease, transform 2s ease"; titleEl.style.opacity = 1; titleEl.classList.add('show');
            yt.src = `https://www.youtube.com/embed/jgaWSOXyH_o?autoplay=1&mute=1&controls=0&loop=1&playlist=jgaWSOXyH_o&playsinline=1&modestbranding=1`;
            bg.style.transition = "opacity 2s ease"; bg.classList.add('show');
        }, 1000));
    }, 3000));
}

function seekTimeline(event) { } function jumpToTime(ms) { } function skipHistorySequence() { clearHistorySequence(); }
function openHistoryModal() { document.getElementById('historyModal').classList.add('active'); document.getElementById('historyBackdrop').classList.add('active'); document.body.style.overflow = 'hidden'; startHistorySequence(); }
function closeHistoryModal() { document.getElementById('historyModal').classList.remove('active'); document.getElementById('historyBackdrop').classList.remove('active'); document.body.style.overflow = 'auto'; clearHistorySequence(); }
function openDetailedTimeline() { alert('상세 연혁 타임라인 페이지 연결 준비 중입니다.'); }
function toggleHistoryMenu() { document.getElementById('historyDropdown').classList.toggle('active'); }

window.addEventListener('DOMContentLoaded', () => { 
    fetchScheduleData(); 
    renderProfileArchive();
    renderShortsGallery();
    fetchSongCharts();
    setInterval(fetchSongCharts, 60000);
});
