/* =========================================
   공통 유틸리티 & 테마(다크/라이트) 설정
========================================= */
function scrollToSection(id) { document.getElementById(id).scrollIntoView({ behavior: 'smooth' }); }
function toggleMobileMenu() {
    document.getElementById('hamburgerBtn').classList.toggle('active');
    document.getElementById('mobileMenuPanel').classList.toggle('active');
    document.getElementById('mobileMenuBackdrop').classList.toggle('active');
    document.body.style.overflow = document.getElementById('mobileMenuPanel').classList.contains('active') ? 'hidden' : 'auto';
}

// ⭐️ 누락되었던 다크모드/라이트모드 아이콘 복구
const sunIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
const moonIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

function updateThemeIcon(theme) { 
    const btn = document.getElementById('themeToggleBtn'); 
    if (btn) btn.innerHTML = (theme === 'dark') ? sunIcon : moonIcon; 
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('rescene-theme', next);
    updateThemeIcon(next); // 테마가 바뀔 때마다 아이콘 변경
}

// 초기 로딩 시 테마 아이콘 렌더링
window.addEventListener('DOMContentLoaded', () => {
    updateThemeIcon(document.documentElement.getAttribute('data-theme') || 'dark');
});

const observer = new IntersectionObserver((entries) => { 
    entries.forEach(e => { if(e.isIntersecting) { e.target.classList.add('active'); } }); 
}, { threshold: 0.15 });
document.querySelectorAll('.reveal, .slow-reveal').forEach(el => observer.observe(el));

// 데뷔 타이머
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
function openImageModal(src) {
    document.getElementById('fullSizeImage').src = src;
    document.getElementById('imageModal').classList.add('active');
    document.getElementById('imageModalBackdrop').classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeImageModal() {
    document.getElementById('imageModal').classList.remove('active');
    document.getElementById('imageModalBackdrop').classList.remove('active');
    document.body.style.overflow = 'auto';
}


/* =========================================
   발자취 시네마틱 모달 데이터 & 로직
========================================= */
const historyData = [
    { date: "2024. 03. 26", title: "DEBUT SHOWCASE LIVE", vid: "jgaWSOXyH_o", timeIndex: 0 }, 
    { date: "2024. 03. 26", title: "싱글 1집 《Re:Scene》 발매 (데뷔)", timeIndex: 5 }, 
    { date: "2024. 05", title: "코스모폴리탄 코리아 5월호 화보", timeIndex: 7 },
    { date: "2024. 08. 27", title: "미니 1집 《SCENEDROME》 발매", timeIndex: 9 },
    { date: "2025. 01", title: "프리티스킨, 형지엘리트 광고 모델", timeIndex: 11 },
    { date: "2025. 01", title: "캐릭터 라이선싱 페어 홍보대사", timeIndex: 12 },
    { date: "2025. 02. 05", title: "미니 2집 《Glow Up》 발매", timeIndex: 13 },
    { date: "2025. 02. 11", title: "한국청소년연맹 홍보대사", timeIndex: 14 },
    { date: "2025. 05", title: "BEAUTY+ 5월호 화보", timeIndex: 15 },
    { date: "2025. 07. 02", title: "싱글 2집 《Dearest》 발매", timeIndex: 16 },
    { date: "2025. 11. 25", title: "미니 3집 《Lip Bomb》 발매", timeIndex: 17 },
    { date: "2026. 01", title: "I-SHA, 넥슨, CU 등 다수 브랜드 콜라보", timeIndex: 18 },
    { date: "2026. 05. 22", title: "경상남도 거제시 홍보대사", timeIndex: 19 },
    { date: "2026. 06", title: "앳스타일 6월호 화보", timeIndex: 20 },
    { date: "2026. 06. 04", title: "화보 MIIM (원이, 미나미)", timeIndex: 21 },
    { date: "2026. 06. 24", title: "경기도 수원시 홍보대사", timeIndex: 22 },
    { date: "2026. 06. 29", title: "경상북도 경주시 홍보대사", timeIndex: 23 },
    { date: "2026. 07. 02", title: "경기도 고양시 홍보대사", timeIndex: 24 },
    { date: "2026. 07. 08", title: "리메이크 싱글 'Pretty Girl' 발매", timeIndex: 25 },
    { date: "2026. 07. 08", title: "멜론 1위 소감 라이브", vid: "v6n4XQdX6_8", timeIndex: 26 }, 
    { date: "2026. 07. 14", title: "저스트 메이크업 IN TOKYO 2027 홍보대사", timeIndex: 28 },
    { date: "2026. 07. 14", title: "'Pretty Girl' 첫 음악방송 1위 (더쇼)", vid: "dOllJ26kfIY", timeIndex: 29 }, 
    { date: "2026. 07. 21", title: "전남광주통합특별시 섬의 날 홍보대사", timeIndex: 35 },
    { date: "2026. 07. 23", title: "MBC 아시안게임 중계방송 홍보대사", timeIndex: 36 },
    { date: "2026. 07. 25", title: "'Pretty Girl' 첫 지상파 1위 (음악중심)", timeIndex: 37 },
    { date: "2026. 08", title: "하퍼스 바자 코리아 8월호 화보", timeIndex: 38 }
];
window.historyData = historyData;

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
    
    const dropdown = document.getElementById('historyDropdown'), menuBtn = document.getElementById('historyMenuBtn');
    if(dropdown) dropdown.classList.remove('active'); if(menuBtn) menuBtn.classList.remove('active');
}

function startProgressTracker(startFromMs = 0) {
    const progressBar = document.getElementById('historyProgressBar'), timeIndicator = document.getElementById('historyTimeIndicator');
    const startTime = Date.now() - startFromMs; currentElapsedMs = startFromMs;
    
    if (!progressBar) return;
    progressInterval = setInterval(() => {
        currentElapsedMs = Date.now() - startTime;
        let percent = (currentElapsedMs / TOTAL_DURATION_MS) * 100;
        if (percent > 100) percent = 100;
        progressBar.style.width = percent + '%';
        
        const currentSec = Math.floor(currentElapsedMs / 1000), totalSec = Math.floor(TOTAL_DURATION_MS / 1000);
        if (timeIndicator) timeIndicator.innerText = `${String(Math.floor(currentSec / 60)).padStart(2, '0')}:${String(currentSec % 60).padStart(2, '0')} / ${String(Math.floor(totalSec / 60)).padStart(2, '0')}:${String(totalSec % 60).padStart(2, '0')}`;
    }, 100);
}

function startHistorySequence(skipToMs = 0) {
    clearHistorySequence(); startProgressTracker(skipToMs);
    if (skipToMs > 0) { jumpToTime(skipToMs); return; }

    const dateEl = document.getElementById('seqDate'), titleEl = document.getElementById('seqTitle');
    const bg = document.getElementById('historyModalBg'), yt = document.getElementById('historyYoutubeBg');
    const chapterEl = document.getElementById('historyCurrentChapter');
    
    if (chapterEl) chapterEl.innerText = "DEBUT ARCHIVE";
    dateEl.classList.add('counting'); dateEl.style.transition = "none"; dateEl.innerText = "0000. 01. 01";
    
    const startTime = Date.now(), duration = 3000, targetDays = (2024 * 365) + (3 * 30) + 26; 
    
    seqTimeouts.push(setTimeout(() => {
        slotTimer = setInterval(() => {
            let elapsed = Date.now() - startTime;
            if (elapsed > duration) elapsed = duration;
            let currentDays = Math.floor(targetDays * (1 - Math.pow(1 - (elapsed / duration), 4)));
            let y = Math.floor(currentDays / 365); let rem = currentDays % 365;
            let m = Math.floor(rem / 30) + 1; let d = (rem % 30) + 1;
            
            if (elapsed === duration) { y = 2024; m = 3; d = 26; }
            dateEl.innerText = `${String(y).padStart(4, '0')}. ${String(m > 12 ? 12 : m).padStart(2, '0')}. ${String(d > 31 ? 31 : d).padStart(2, '0')}`;
            
            if (elapsed === duration) {
                clearInterval(slotTimer); dateEl.classList.remove('counting'); dateEl.style.transition = "opacity 0.3s ease"; dateEl.style.opacity = 1;
                seqTimeouts.push(setTimeout(() => {
                    dateEl.style.transition = "opacity 1s ease"; dateEl.style.opacity = 0;
                    seqTimeouts.push(setTimeout(() => {
                        dateEl.innerText = ""; titleEl.innerHTML = historyData[0].title;
                        titleEl.style.transition = "opacity 2s ease, transform 2s ease"; titleEl.style.opacity = 1; titleEl.classList.add('show');
                        yt.src = `https://www.youtube.com/embed/${historyData[0].vid}?autoplay=1&mute=1&controls=0&loop=1&playlist=${historyData[0].vid}&playsinline=1&modestbranding=1`;
                        bg.style.transition = "opacity 2s ease"; bg.classList.add('show');
                        
                        seqTimeouts.push(setTimeout(() => {
                            bg.classList.remove('show'); titleEl.style.transform = "translateY(0)"; titleEl.style.transition = "opacity 1.5s ease"; titleEl.style.opacity = 0;
                            seqTimeouts.push(setTimeout(() => { titleEl.classList.remove('show'); titleEl.style.transform = ""; playSequenceIdx(1); }, 1500)); 
                        }, 5000));
                    }, 1000)); 
                }, 2000));
            }
        }, 30);
    }, 100));
}

function playSequenceIdx(idx) {
    if(idx >= historyData.length) return; 
    const dateEl = document.getElementById('seqDate'), titleEl = document.getElementById('seqTitle');
    const bg = document.getElementById('historyModalBg'), yt = document.getElementById('historyYoutubeBg');
    const chapterEl = document.getElementById('historyCurrentChapter');
    const item = historyData[idx];

    if (chapterEl) chapterEl.innerText = item.date + " - " + item.title.replace(/<[^>]*>?/gm, '');

    if (idx === 1) {
        dateEl.innerText = item.date; titleEl.innerHTML = item.title;
        dateEl.style.transition = "none"; dateEl.style.opacity = 0; titleEl.style.transition = "none"; titleEl.style.opacity = 1; titleEl.classList.remove('show');
        void dateEl.offsetWidth; 
        dateEl.style.transition = "opacity 2s ease"; dateEl.style.opacity = 1; titleEl.style.transition = "opacity 2s ease, transform 2s ease"; titleEl.classList.add('show');
        
        seqTimeouts.push(setTimeout(() => {
            titleEl.style.transform = "translateY(0)"; titleEl.style.transition = "opacity 0.6s ease"; titleEl.style.opacity = 0;
            dateEl.style.transition = "opacity 0.6s ease"; dateEl.style.opacity = 0;
            seqTimeouts.push(setTimeout(() => { titleEl.classList.remove('show'); titleEl.style.transform = ""; titleEl.style.opacity = ""; playSequenceIdx(2); }, 600));
        }, 3000)); return;
    }

    if (idx === 19) {
        dateEl.innerText = item.date; dateEl.style.transition = "none"; dateEl.style.opacity = 1; 
        titleEl.classList.remove('show'); bg.classList.remove('show'); yt.src = "";
        
        seqTimeouts.push(setTimeout(() => {
            dateEl.style.transition = "opacity 1.5s ease"; dateEl.style.opacity = 0;
            seqTimeouts.push(setTimeout(() => {
                dateEl.innerText = ""; titleEl.innerHTML = item.title;
                titleEl.style.transition = "opacity 2s ease, transform 2s ease"; titleEl.style.opacity = 1; titleEl.classList.add('show');
                if (item.vid) { yt.src = `https://www.youtube.com/embed/${item.vid}?autoplay=1&mute=1&controls=0&loop=1&playlist=${item.vid}&playsinline=1&modestbranding=1`; bg.style.transition = "opacity 2s ease"; bg.classList.add('show'); }
                seqTimeouts.push(setTimeout(() => {
                    titleEl.style.transform = "translateY(0)"; titleEl.style.transition = "opacity 0.6s ease"; titleEl.style.opacity = 0; bg.classList.remove('show');
                    seqTimeouts.push(setTimeout(() => { titleEl.classList.remove('show'); titleEl.style.transform = ""; titleEl.style.opacity = ""; playSequenceIdx(21); }, 600)); 
                }, 10000));
            }, 1500)); 
        }, 2000)); return;
    }

    if (idx === 21) {
        dateEl.innerText = ""; dateEl.style.transition = "none"; dateEl.style.opacity = 0; titleEl.classList.remove('show'); bg.classList.remove('show'); yt.src = "";
        seqTimeouts.push(setTimeout(() => {
            dateEl.innerText = item.date; void dateEl.offsetWidth; 
            dateEl.style.transition = "opacity 2.5s ease"; dateEl.style.opacity = 1;
            seqTimeouts.push(setTimeout(() => {
                dateEl.style.transition = "opacity 1.5s ease"; dateEl.style.opacity = 0;
                seqTimeouts.push(setTimeout(() => {
                    dateEl.innerText = ""; titleEl.innerHTML = item.title;
                    titleEl.style.transition = "opacity 2s ease, transform 2s ease"; titleEl.style.opacity = 1; titleEl.classList.add('show');
                    if (item.vid) { yt.src = `https://www.youtube.com/embed/${item.vid}?autoplay=1&mute=1&controls=0&loop=1&playlist=${item.vid}&playsinline=1&modestbranding=1`; bg.style.transition = "opacity 2s ease"; bg.classList.add('show'); }
                    seqTimeouts.push(setTimeout(() => {
                        titleEl.style.transform = "translateY(0)"; titleEl.style.transition = "opacity 2.5s ease"; titleEl.style.opacity = 0; bg.style.transition = "opacity 2.5s ease"; bg.classList.remove('show');
                        seqTimeouts.push(setTimeout(() => {
                            titleEl.classList.remove('show'); titleEl.style.transform = ""; titleEl.style.opacity = ""; yt.src = "";
                            clearInterval(progressInterval); const progressBar = document.getElementById('historyProgressBar'); if (progressBar) progressBar.style.width = '100%';
                            seqTimeouts.push(setTimeout(() => { const endBtn = document.querySelector('.timeline-link-text'); if (endBtn) endBtn.classList.add('show'); }, 1500));
                        }, 2500));
                    }, 10000));
                }, 1500));
            }, 3000));
        }, 100)); return;
    }

    dateEl.style.transition = "none"; dateEl.style.opacity = 1; titleEl.style.transition = "none";
    dateEl.innerText = item.date; titleEl.innerHTML = item.title; titleEl.classList.add('show');

    if(item.vid) { yt.src = `https://www.youtube.com/embed/${item.vid}?autoplay=1&mute=1&controls=0&loop=1&playlist=${item.vid}&playsinline=1&modestbranding=1`; bg.style.transition = "none"; bg.classList.add('show'); } 
    else { bg.classList.remove('show'); yt.src = ""; }

    const langFactor = (typeof getLang === 'function' && getLang() !== 'ko') ? 1.35 : 1;
    let dur = 2000;
    if (idx >= 2 && idx <= 3) dur = 1000; else if (idx >= 4 && idx <= 7) dur = 500; else if (idx >= 8 && idx <= 12) dur = 200; else if (idx >= 13 && idx <= 18) dur = 100; else dur = 70;

    seqTimeouts.push(setTimeout(() => {
        titleEl.classList.remove('show'); dateEl.innerText = "";
        seqTimeouts.push(setTimeout(() => { playSequenceIdx(idx + 1); }, (dur < 200) ? 30 : 100));
    }, Math.round(dur * langFactor)));
}

function seekTimeline(event) {
    const container = document.getElementById('historyProgressContainer');
    const ratio = (event.clientX - container.getBoundingClientRect().left) / container.getBoundingClientRect().width;
    startHistorySequence(ratio * TOTAL_DURATION_MS);
}

function jumpToTime(ms) {
    clearHistorySequence(); startProgressTracker(ms);
    const dateEl = document.getElementById('seqDate'), titleEl = document.getElementById('seqTitle');
    const bg = document.getElementById('historyModalBg'), yt = document.getElementById('historyYoutubeBg');
    
    let targetIdx = 1; if (ms > 22000) targetIdx = 21; else if (ms > 15000) targetIdx = 19; else if (ms > 5000) targetIdx = 2; 
    
    const item = historyData[targetIdx];
    if (item) {
        dateEl.style.opacity = 1; dateEl.innerText = item.date; titleEl.innerHTML = item.title; titleEl.classList.add('show');
        if (item.vid) { yt.src = `https://www.youtube.com/embed/${item.vid}?autoplay=1&mute=1&controls=0&loop=1&playlist=${item.vid}&playsinline=1&modestbranding=1`; bg.classList.add('show'); }
        seqTimeouts.push(setTimeout(() => { playSequenceIdx(targetIdx + 1); }, 4000));
    }
}

function skipHistorySequence() {
    clearHistorySequence();
    const progressBar = document.getElementById('historyProgressBar'); if (progressBar) progressBar.style.width = '100%';
    const dropdown = document.getElementById('historyDropdown'), menuBtn = document.getElementById('historyMenuBtn');
    if(dropdown) dropdown.classList.remove('active'); if(menuBtn) menuBtn.classList.remove('active');
    const endBtn = document.querySelector('.timeline-link-text'); if (endBtn) endBtn.classList.add('show');
}

function openHistoryModal() { document.getElementById('historyModal').classList.add('active'); document.getElementById('historyBackdrop').classList.add('active'); document.body.style.overflow = 'hidden'; startHistorySequence(); }
function closeHistoryModal() { document.getElementById('historyModal').classList.remove('active'); document.getElementById('historyBackdrop').classList.remove('active'); document.body.style.overflow = 'auto'; clearHistorySequence(); }
function openDetailedTimeline() { alert(typeof t === 'function' ? t('timelineSoon') : '상세 연혁 타임라인 페이지 연결 준비 중입니다.'); }
function toggleHistoryMenu() { const btn = document.getElementById('historyMenuBtn'), dropdown = document.getElementById('historyDropdown'); btn.classList.toggle('active'); dropdown.classList.toggle('active'); }

document.addEventListener('click', function(event) {
    const container = document.querySelector('.modal-menu-container'), dropdown = document.getElementById('historyDropdown'), btn = document.getElementById('historyMenuBtn');
    if (container && !container.contains(event.target) && dropdown && dropdown.classList.contains('active')) { dropdown.classList.remove('active'); btn.classList.remove('active'); }
});


/* =========================================
   스케줄 캘린더 및 오늘의 일정 데이터 로직
========================================= */
let scheduleDB = {};
let currentCalYear = new Date().getFullYear(); 
let currentCalMonth = new Date().getMonth() + 1; 

const colorMap = { "broadcast": "#7e57c2", "fansign": "#ec407a", "event": "#66bb6a", "concert": "#26c6da", "radio": "#ffa726", "notice": "#78909c" };
const typeLabelMap = { broadcast: "방송", fansign: "팬사인회", event: "행사", concert: "공연", radio: "라디오", notice: "공지" };
const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

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
    const grid = document.getElementById('todayScheduleGrid'), sub  = document.getElementById('todayDateSub');
    if (!grid) return;
    const now = new Date();
    if (sub) sub.innerText = `${now.getFullYear()}. ${String(now.getMonth()+1).padStart(2,'0')}. ${String(now.getDate()).padStart(2,'0')} (${weekdayLabels[now.getDay()]})`;

    const data  = scheduleDB[getTodayKey()];
    const items = data && data.items ? data.items : [];
    let html;
    if (items.length === 0) {
        html = `<div class="today-empty-card"><div class="mark"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg></div><p>오늘은 등록된 일정이 없습니다.</p><button type="button" onclick="openCalendarPopup()">다가오는 일정 보기</button></div>`;
    } else {
        html = items.map(item => {
            const status = getItemStatus(item.time), label = typeLabelMap[item.type] || item.type || '일정';
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
            let dotColor = item.color ? item.color : 'var(--c-accent)'; let label = typeLabelMap[item.type] || item.type || '일정'; let time = item.time ? item.time : '시간 미정';
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
        
        const waitingMsg = (typeof t === 'function') ? t('chartWaiting') : '데이터 수집 중입니다.';
        const wrapper = document.getElementById('tickerWrapper');
        if(wrapper) {
            wrapper.innerHTML = tickerHtml || `<div class="ticker-item"><div style="color:#666; font-size:13px;">${waitingMsg}</div></div>`;
            clearInterval(tickerInterval);
            if (validCount > 1) {
                let cIdx = 0;
                tickerInterval = setInterval(() => { cIdx = (cIdx + 1) % validCount; wrapper.style.transform = `translateY(-${cIdx * 56}px)`; }, 4000); 
            }
        }
    } catch (e) { console.log("차트 대기 중"); }
}

/* =========================================
   콘텐츠(아카이브, 쇼츠) 그리기
========================================= */
function renderProfileArchive() {
    const wrap = document.getElementById('profileScroll'); if (!wrap) return;
    let html = '';
    for (let i = 1; i <= 10; i++) {
        html += `<div class="profile-item" onclick="openImageModal('images/profile/${i}.jpg')"><img src="images/profile/${i}.jpg" alt="RESCENE profile ${i}" loading="lazy" onerror="this.closest('.profile-item').style.display='none'"><span class="pf-index">NO. ${String(i).padStart(2, '0')}</span></div>`;
    }
    wrap.innerHTML = `<div class="profile-track">${html}${html}</div>`;
}

function renderShortsGallery() {
    const wrap = document.getElementById('shortsScroll'); if (!wrap) return;
    const shortsIds = ["jgaWSOXyH_o", "v6n4XQdX6_8", "dOllJ26kfIY"];
    let html = shortsIds.map(id => `<a class="shorts-card" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener"><img src="https://img.youtube.com/vi/${id}/hqdefault.jpg" alt="RESCENE video" loading="lazy"><div class="sc-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div></a>`).join('');
    html += `<a class="shorts-card shorts-more" href="https://www.youtube.com/results?search_query=%23%EB%A6%AC%EC%84%BC%EB%8A%90" target="_blank" rel="noopener"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18l6-6-6-6"/></svg><span>유튜브에서<br>#리센느 더보기</span></a>`;
    wrap.innerHTML = html;
}

// ⭐️ 모든 초기화 함수 실행
window.addEventListener('DOMContentLoaded', () => { 
    fetchScheduleData(); 
    renderProfileArchive();
    renderShortsGallery();
    fetchSongCharts();
    setInterval(fetchSongCharts, 60000);
});
