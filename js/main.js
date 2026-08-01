const debutDate = new Date("2024-03-26T18:00:00+09:00"); 
setInterval(() => {
    const diff = new Date() - debutDate;
    const dDayText = document.getElementById('dDayText');
    const timeFlowText = document.getElementById('timeFlowText');
    if (dDayText) dDayText.innerText = `D+${Math.floor(diff / (1000 * 60 * 60 * 24))}`;
    if (timeFlowText) timeFlowText.innerText = `${String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0')}:${String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, '0')}:${String(Math.floor((diff / 1000) % 60)).padStart(2, '0')}`;
}, 1000);

let currentProfileIdx = 1;
const PROFILE_TOTAL = 10;
function openImageModal(src, idx) {
    if (typeof idx === 'number') currentProfileIdx = idx;
    document.getElementById('fullSizeImage').src = src; document.getElementById('imageModal').classList.add('active'); document.getElementById('imageModalBackdrop').classList.add('active'); document.body.style.overflow = 'hidden';
}
function closeImageModal() { if (suppressModalTap) return; document.getElementById('imageModal').classList.remove('active'); document.getElementById('imageModalBackdrop').classList.remove('active'); document.body.style.overflow = 'auto'; }
function navigateImageModal(delta) {
    currentProfileIdx += delta;
    if (currentProfileIdx < 1) currentProfileIdx = PROFILE_TOTAL;
    if (currentProfileIdx > PROFILE_TOTAL) currentProfileIdx = 1;
    const img = document.getElementById('fullSizeImage');
    if (img) img.src = `images/profile/${currentProfileIdx}.jpg`;
}
function navigateAlbumModal(delta) {
    let idx = currentAlbumIdx + delta;
    if (idx < 0) idx = ALBUMS.length - 1;
    if (idx >= ALBUMS.length) idx = 0;
    openAlbumModal(idx);
}
let suppressModalTap = false;
function enableModalSwipe(modalId, onSwipeLeft, onSwipeRight) {
    const el = document.getElementById(modalId);
    if (!el) return;
    let startX = 0, startY = 0, tracking = false;

    function finish(dx, dy) {
        tracking = false;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
            suppressModalTap = true;
            setTimeout(() => { suppressModalTap = false; }, 60);
            if (dx < 0) onSwipeLeft(); else onSwipeRight();
        }
    }

    el.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        startX = e.touches[0].clientX; startY = e.touches[0].clientY; tracking = true;
    }, { passive: true });
    el.addEventListener('touchend', (e) => {
        if (!tracking) return;
        finish(e.changedTouches[0].clientX - startX, e.changedTouches[0].clientY - startY);
    }, { passive: true });

    el.addEventListener('mousedown', (e) => {
        startX = e.clientX; startY = e.clientY; tracking = true;
    });
    window.addEventListener('mouseup', (e) => {
        if (!tracking) return;
        finish(e.clientX - startX, e.clientY - startY);
    });
}
window.addEventListener('DOMContentLoaded', () => {
    enableModalSwipe('imageModal', () => navigateImageModal(1), () => navigateImageModal(-1));
    enableModalSwipe('albumModal', () => navigateAlbumModal(1), () => navigateAlbumModal(-1));
    initCustomBg();
});

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
function renderAgendaList() {
    const list = document.getElementById('agendaList');
    if (!list) return;
    const titleEl = document.getElementById('agendaListTitle');
    const countEl = document.getElementById('agendaListCount');
    const weekdays = window.t ? window.t('weekdays') : ["일", "월", "화", "수", "목", "금", "토"];

    if (titleEl) titleEl.textContent = `${currentCalYear}년 ${currentCalMonth}월`;

    const keys = Object.keys(scheduleDB)
        .filter(k => k.startsWith(`${currentCalYear}-${String(currentCalMonth).padStart(2, '0')}`))
        .sort();

    let totalCount = 0;
    let html = '';
    keys.forEach(dateKey => {
        const data = scheduleDB[dateKey];
        if (!data || !data.items || !data.items.length) return;
        const d = new Date(dateKey);
        const dow = d.getDay();
        const groupClass = dow === 0 ? ' sun-group' : (dow === 6 ? ' sat-group' : '');
        const isToday = dateKey === getTodayKey() ? ' today-group' : '';
        totalCount += data.items.length;

        html += `<div class="agenda-group">
            <div class="agenda-group-date${groupClass}${isToday}">
                <div class="agenda-group-day-num">${d.getDate()}</div>
                <div class="agenda-group-day-info">
                    <span class="agenda-group-dow">${weekdays[dow]}</span>
                    <span class="agenda-group-month">${currentCalMonth}월</span>
                </div>
            </div>`;
        data.items.forEach(item => {
            html += `<div class="agenda-item" onclick="openCalendarPopup(); openModal('${currentCalYear}', '${currentCalMonth}', '${d.getDate()}', '${dateKey}')">
                <div class="agenda-item-bar" style="background:${item.color};"></div>
                <div class="agenda-item-body">
                    <div class="agenda-item-title">${item.title}</div>
                    <div class="agenda-item-meta">
                        <span class="agenda-item-time" style="color:${item.color};">${item.time || ''}</span>
                    </div>
                </div>
            </div>`;
        });
        html += `</div>`;
    });

    if (countEl) countEl.textContent = `${totalCount}개`;
    list.innerHTML = html || `<div class="agenda-list-empty">이번 달 등록된 일정이 없습니다.</div>`;
}

function renderTodayCalBanner() {
    const dowEl = document.getElementById('todayCalDow');
    const dayEl = document.getElementById('todayCalDayNum');
    const monthEl = document.getElementById('todayCalMonth');
    const dateSubEl = document.getElementById('todayDateSub');
    if (!dowEl || !dayEl || !monthEl) return;
    const now = new Date();
    const weekdays = window.t ? window.t('weekdays') : ["일", "월", "화", "수", "목", "금", "토"];
    dowEl.textContent = weekdays[now.getDay()];
    dayEl.textContent = now.getDate();
    monthEl.textContent = `${now.getFullYear()}. ${now.getMonth() + 1}`;
    if (dateSubEl) {
        const dateStr = window.tDate ? window.tDate(now.getFullYear(), now.getMonth() + 1, now.getDate()) : `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}`;
        dateSubEl.textContent = `${dateStr} (${weekdays[now.getDay()]})`;
    }
}

function renderTodaySchedule() {
    const grid = document.getElementById('todayScheduleGrid');
    if (!grid) return;
    renderTodayCalBanner();

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

function renderTodayMonthSchedule() {
    const colA = document.getElementById('todayScrollColA');
    const titleEl = document.getElementById('todayMonthTitle');
    const countEl = document.getElementById('todayMonthCount');
    if (!colA) return;

    const now = new Date();
    const year = now.getFullYear(), month = now.getMonth() + 1;
    const weekdays = window.t ? window.t('weekdays') : ["일", "월", "화", "수", "목", "금", "토"];
    const typeLabelMap = window.t ? window.t('scheduleTypes') : {};
    if (titleEl) titleEl.textContent = `${year}년 ${month}월`;

    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const keys = Object.keys(scheduleDB).filter(k => k.startsWith(monthKey)).sort();

    let totalCount = 0;
    let html = '';
    keys.forEach(dateKey => {
        const data = scheduleDB[dateKey];
        if (!data || !data.items || !data.items.length) return;
        const d = new Date(dateKey);
        const dow = d.getDay();
        totalCount += data.items.length;
        const isToday = dateKey === getTodayKey();
        const itemsHtml = data.items.map(item => {
            const label = typeLabelMap[item.type] || item.type || '일정';
            return `<div class="tm-item" onclick="openCalendarPopup(); openModal('${year}', '${month}', '${d.getDate()}', '${dateKey}')">
                <span class="tm-item-tag" style="background:${item.color};">${label}</span>
                <span class="tm-item-time">${item.time || ''}</span>
                <span class="tm-item-title">${item.title}</span>
            </div>`;
        }).join('');
        html += `<div class="tm-group${isToday ? ' is-today' : ''}">
            <div class="tm-group-date${dow === 0 ? ' sun' : (dow === 6 ? ' sat' : '')}">
                <span class="tm-day">${d.getDate()}</span><span class="tm-dow">${weekdays[dow]}</span>
            </div>
            <div class="tm-group-items">${itemsHtml}</div>
        </div>`;
    });

    if (countEl) countEl.textContent = totalCount ? `${totalCount}개` : '';

    if (!html) {
        const emptyMsg = window.t ? window.t('noSchedule') : '등록된 일정이 없습니다.';
        colA.innerHTML = `<div class="tm-empty">${emptyMsg}</div>`;
        return;
    }
    colA.innerHTML = html;
}
setInterval(renderTodayMonthSchedule, 60000);

let __didAutoScrollTodayCol = false;
function scrollTodayMonthColToToday() {
    if (__didAutoScrollTodayCol) return; 
    const colA = document.getElementById('todayScrollColA');
    const todayGroup = colA ? colA.querySelector('.tm-group.is-today') : null;
    if (!colA || !todayGroup) return;
    __didAutoScrollTodayCol = true;
    colA.scrollTop = Math.max(0, todayGroup.offsetTop - 8);
}

function renderProfileArchive() {
    const profileWrap = document.getElementById('profileScroll'); 
    if (profileWrap) {
        let phtml = '';
        const PREVIEW_COUNT = 7;
        for (let i = 1; i <= PREVIEW_COUNT; i++) {
            phtml += `<div class="profile-item" onclick="openImageModal('images/profile/${i}.jpg', ${i})"><img src="images/profile/${i}.jpg" alt="RESCENE profile ${i}" loading="lazy" onerror="this.closest('.profile-item').style.display='none'"><span class="pf-index">NO. ${String(i).padStart(2, '0')}</span></div>`;
        }
        phtml += `<a class="profile-item archive-more-tile" href="archive.html#profile"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18l6-6-6-6"/></svg><span>전체보기</span></a>`;
        profileWrap.innerHTML = `<div class="profile-track">${phtml}</div>`;
    }

    const fullProfileGrid = document.getElementById('fullProfileGrid');
    if (fullProfileGrid) {
        let fhtml = '';
        for (let i = 1; i <= 10; i++) {
            fhtml += `<div class="profile-item" onclick="openImageModal('images/profile/${i}.jpg', ${i})"><img src="images/profile/${i}.jpg" alt="RESCENE profile ${i}" loading="lazy" onerror="this.closest('.profile-item').style.display='none'"><span class="pf-index">NO. ${String(i).padStart(2, '0')}</span></div>`;
        }
        fullProfileGrid.innerHTML = fhtml;
    }

    try { renderAlbumGrid(); } catch (e) { console.error('renderAlbumGrid 실패:', e); }
}

function enableDragScroll(el) {
    if (!el) return;
    el.style.scrollBehavior = 'auto'; 
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

    el.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); } }, true);

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

    let wheelLockDirection = null;
    let wheelLockTimer = null;
    el.addEventListener('wheel', (e) => {
        clearTimeout(wheelLockTimer);
        wheelLockTimer = setTimeout(() => { wheelLockDirection = null; wheelTarget = null; }, 120);

        if (wheelLockDirection === null) {
            wheelLockDirection = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? 'vertical' : 'horizontal';
        }
        if (wheelLockDirection !== 'vertical') return; 

        e.preventDefault();
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (wheelTarget === null) wheelTarget = el.scrollLeft;
        wheelTarget = Math.max(0, Math.min(maxScroll, wheelTarget + e.deltaY));
        animateWheel();
    }, { passive: false });
}

window.addEventListener('DOMContentLoaded', () => { 
    try { renderProfileArchive(); } catch (e) { console.error('renderProfileArchive 실패:', e); }
});

const ALBUMS = [{"title": "YoYo", "image": "yoyo.jpg", "tracks": [{"name": "YoYo", "isTitle": true, "mv": "uDYy2UyO1X4", "links": []}]}, {"title": "Re:Scene", "image": "uhuh.jpg", "tracks": [{"name": "UhUh", "isTitle": true, "mv": "zpSejlkSXLA", "links": []}, {"name": "YoYo", "isTitle": false, "mv": "uDYy2UyO1X4", "links": []}]}, {"title": "Counting Star (더 매직스타 X RESCENE (리센느))", "image": "Counting Start.jpg", "tracks": [{"name": "Counting Star", "isTitle": true, "mv": null, "links": []}, {"name": "Counting Star (Inst.)", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "mBAEnI5kjdI"}, {"label": "첫 팬콘", "vid": "AzJepX0ujq0"}]}]}, {"title": "YoYo (Japanese Version)", "image": "yoyo japan.jpg", "tracks": [{"name": "YoYo (Japanese Version)", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "Lle0xkhk_9M"}]}]}, {"title": "SCENEDROME", "image": "SCENEDROME.jpg", "tracks": [{"name": "Lucky you", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "0UMsSFysM8o"}]}, {"name": "Love Attack", "isTitle": true, "mv": "9XttLI0oH0I", "links": [{"label": "존박 ver.", "vid": "y1SL3LBCGWg"}, {"label": "인기가요 20240901 방송분", "vid": "Hv1wQ6nlpNE"}, {"label": "엠카운트다운 260618 방송분", "vid": "ajhEFz1zNMQ"}]}, {"name": "New World", "isTitle": false, "mv": "QNXeGm-Wkms", "links": [{"label": "심플리 케이팝", "vid": "WwGF_sqjH6c"}]}, {"name": "Pinball", "isTitle": true, "mv": "B8JJ8RNM-60", "links": []}]}, {"title": "UhUh (Japanese Version)", "image": "uhuh japan.jpg", "tracks": [{"name": "UhUh (Japanese Version)", "isTitle": true, "mv": null, "links": [{"label": "음원", "vid": "YcDYrBJ3yjw"}, {"label": "TV-LIVE 20250528 방송분", "vid": "JRdVfTgwlrQ"}]}]}, {"title": "Glow Up", "image": "Glowup.jpg", "tracks": [{"name": "CRASH", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "_ivLUJ3R62U"}, {"label": "케이팝-잇", "vid": "8kRucJDItlQ"}]}, {"name": "Glow Up", "isTitle": true, "mv": "h0xUtrb_JBc", "links": [{"label": "Performance ver.", "vid": "WQuoPINWLU8"}, {"label": "엠카운트다운 250206 방송분", "vid": "FYdghnUJx-Y"}, {"label": "뮤직뱅크 250214 방송분", "vid": "r3I9kJGcn3g"}, {"label": "인기가요 250302 방송분", "vid": "bQ24gSDbMqY"}]}, {"name": "Going On", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "SIre1awR938"}]}, {"name": "In my lotion", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "rm3yX5-vusA"}, {"label": "쇼 챔피언 250305 방송분", "vid": "DqVwDLWg3ek"}]}, {"name": "Cotton Candy", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "Y8dkJXZmT5M"}, {"label": "??? 250215 직캠", "vid": "pQs7iZS0xoE"}]}]}, {"title": "Glow Up (English Version)", "image": "Glowup eng.jpg", "tracks": [{"name": "Glow Up (English Version)", "isTitle": true, "mv": null, "links": [{"label": "음원", "vid": "a5_b7KfG15Y"}]}]}, {"title": "남주의 첫날밤을 가져버렸다 OST Part. 1", "image": "namju.jpg", "tracks": [{"name": "밤밤밤", "isTitle": true, "mv": "AfiBC_VR2K4", "links": [{"label": "음원", "vid": "UcIt0TBe8pg"}, {"label": "Fancam 250907 직캠", "vid": "FmJ35OQches"}]}]}, {"title": "Dearest", "image": "dejavu.jpg", "tracks": [{"name": "Deja vu", "isTitle": true, "mv": "ZbO9PBdFRdc", "links": [{"label": "엠카운트다운 250703 방송분", "vid": "jciMWQgUVCA"}, {"label": "엠카운트다운 250710 방송분", "vid": "vQBtHJVbNeM"}, {"label": "뮤직뱅크 250714 방송분", "vid": "fW8CXaBau-U"}, {"label": "뮤직뱅크 250711 방송분", "vid": "JdYC0Jomkbs"}, {"label": "쇼챔피언 260715 방송분", "vid": "PqpmFwNjDHg"}, {"label": "교차편집", "vid": "AXdH0rWOXDg"}, {"label": "교차편집", "vid": "K7YYvqVFXn8"}]}, {"name": "Mood", "isTitle": false, "mv": "v5we0mJpoDM", "links": []}]}, {"title": "Dearest (Speed Up Version)", "image": "dejavu.jpg", "tracks": [{"name": "Deja vu (Speed Up Version)", "isTitle": true, "mv": null, "links": [{"label": "음원", "vid": "PJqWbyNPcqw"}]}, {"name": "Mood (Speed Up Version)", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "VtRqBzYte2g"}]}]}, {"title": "남주의 첫날밤을 가져버렷다 OST Special", "image": "namju2.jpg", "tracks": [{"name": "밤밤밤", "isTitle": true, "mv": "AfiBC_VR2K4", "links": [{"label": "음원", "vid": "UcIt0TBe8pg"}, {"label": "Fancam 250907 직캠", "vid": "FmJ35OQches"}]}]}, {"title": "고백주파수 (첫사랑 엔딩 X RESCENE (리센느))", "image": "go.jpg", "tracks": [{"name": "고백주파수", "isTitle": true, "mv": null, "links": [{"label": "음원", "vid": "39gg4Su8MI8"}, {"label": "Clip", "vid": "Ihsh9VRZLlo"}]}, {"name": "고백주파수 (Inst.)", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "4as776eLYH8"}]}]}, {"title": "lip bomb", "image": "lip bomb.jpg", "tracks": [{"name": "Heart Drop", "isTitle": true, "mv": "ByX8EZq8500", "links": [{"label": "Performance ver.", "vid": "638f3ttCR20"}, {"label": "뮤직뱅크 251121 방송분", "vid": "2SKGgezncCI"}, {"label": "THE SHOW 251111 방송분", "vid": "dDi-0BaW_8Y"}, {"label": "쇼챔피언 251112 방송분", "vid": "ORiKYmHPVmk"}, {"label": "The Artist Canvas", "vid": "WgDRLNgzztU"}, {"label": "녹음 비하인드", "vid": "doGCcKx9F1Q"}]}, {"name": "Bloom", "isTitle": true, "mv": "MC6-82GRK5I", "links": [{"label": "Performance ver.", "vid": "_zzAi5x0cXc"}, {"label": "THE SHOW 251213 방송분", "vid": "uCCV5qK0TBM"}, {"label": "음악중심 251220 방송분", "vid": "4ADSzlm18hY"}, {"label": "뮤직뱅크 251128 방송분", "vid": "G-zlWrcj7DU"}, {"label": "it's Live", "vid": "tf84FgQgi80"}, {"label": "원더케이", "vid": "kjvlrGs5f7c"}]}, {"name": "Love Echo", "isTitle": false, "mv": null, "links": [{"label": "SHOWCASE", "vid": "rAR6A_y3P68"}, {"label": "FANPOPTY 260721 방송분", "vid": "DONLx6eS-e0"}, {"label": "FANPOPTY FANCAM 260721 직캠", "vid": "TBgpliSowjI"}]}, {"name": "Hello XO", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "jVKfnPIkTwY"}]}, {"name": "MVP", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "TF2y-wSc2ss"}, {"label": "Christmas ver.", "vid": "qhLDO3nIYfc"}, {"label": "Live Performance", "vid": "lviLSHBntGQ"}, {"label": "직캠 260122", "vid": "4gwhiaF9zvA"}]}]}, {"title": "Pinball (Japanese Ver.)", "image": "pinball japan.jpg", "tracks": [{"name": "Pinball (Japanese Ver.)", "isTitle": true, "mv": null, "links": [{"label": "음원", "vid": "Cz-msuk8oqM"}, {"label": "Kcon 260508 직캠", "vid": "tXI20ksglDM"}]}]}, {"title": "RESCENE X ???", "image": "busy.jpg", "tracks": [{"name": "Busy Boy", "isTitle": true, "mv": "MMvTKa3BmXo", "links": [{"label": "Performance ver.", "vid": "ewubELWBMaE"}, {"label": "음원", "vid": "c70TkZH7fr0"}, {"label": "음악중심 260228 방송분", "vid": "bEkXlmGstIo"}, {"label": "쇼챔피언 260304 방송분", "vid": "j1YF0S3CKtw"}, {"label": "인기가요 260301 방송분", "vid": "5HwxTQouI-0"}]}, {"name": "Busy Boy (Inst.)", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "1gvTKPTYLE8"}]}]}, {"title": "Music from THE SPECIALS", "image": "musicfrom.jpg", "tracks": [{"name": "Higher", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "HlR_f2gHxoo"}]}]}, {"title": "Busy Boy (Galantis Remix)", "image": "busy_2.jpg", "tracks": [{"name": "Busy Boy (Galantis Remix)", "isTitle": true, "mv": null, "links": [{"label": "음원", "vid": "tSCde4Aa2lg"}]}]}, {"title": "Runaway", "image": "run.jpg", "tracks": [{"name": "Runaway", "isTitle": true, "mv": "rsZwrTNklos", "links": [{"label": "엠카운트다운 260409 방송분", "vid": "qt2FvoXRw1U"}, {"label": "it's Live", "vid": "aDHmmrfizIE"}, {"label": "음악중심 260411 방송분", "vid": "F9hbFUr-SmU"}, {"label": "엠카운트다운 260416 방송분", "vid": "VB_vtps_wus"}, {"label": "인기가요 260419 방송분", "vid": "ZoWGyFHTXbI"}, {"label": "교차편집", "vid": "OkZVMQlXpDw"}]}]}, {"title": "Pretty Girl - Special Single", "image": "pretty.jpg", "tracks": [{"name": "Pretty Girl", "isTitle": true, "mv": "qZlu2j2SiBA", "links": [{"label": "음악중심 260718 방송분", "vid": "mafe6aEH16k"}, {"label": "엠카운트다운 260709 방송분", "vid": "Esd-KkxROxA"}, {"label": "뮤직뱅크 260710 방송분", "vid": "3ctIKKzrA9M"}, {"label": "음악중심 260711 방송분", "vid": "j4LlqGxOr2E"}, {"label": "뮤직뱅크 260717 방송분", "vid": "0dWn9wtFr54"}, {"label": "인기가요 260719 방송분", "vid": "eK-anMCLuiI"}, {"label": "음악중심 260718 방송분", "vid": "4s5TkXahA8g"}]}]}];

let currentAlbumIdx = 0;

function renderAlbumGrid() {
    const albumWrap = document.getElementById('albumScroll');
    if (albumWrap) {
        let ahtml = '';
        const PREVIEW_COUNT = 7;
        ALBUMS.slice(0, PREVIEW_COUNT).forEach(function (album, idx) {
            ahtml += `<div class="profile-item album-cover-item" onclick="openAlbumModal(${idx})"><img src="images/${album.image}" alt="${album.title}" loading="lazy" onerror="console.error('앨범 이미지 로드 실패:', this.src); this.closest('.profile-item').classList.add('img-broken'); this.style.display='none';"><span class="album-broken-label">이미지 없음<br>${album.image}</span></div>`;
        });
        ahtml += `<a class="profile-item archive-more-tile" href="archive.html#album"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18l6-6-6-6"/></svg><span>전체보기</span></a>`;
        albumWrap.innerHTML = `<div class="profile-track album-track">${ahtml}</div>`;
    }

    const fullAlbumGrid = document.getElementById('fullAlbumGrid');
    if (fullAlbumGrid) {
        let fahtml = '';
        ALBUMS.forEach(function (album, idx) {
            fahtml += `<div class="profile-item album-cover-item" onclick="openAlbumModal(${idx})"><img src="images/${album.image}" alt="${album.title}" loading="lazy" onerror="this.closest('.profile-item').classList.add('img-broken'); this.style.display='none';"><span class="album-broken-label">이미지 없음<br>${album.image}</span></div>`;
        });
        fullAlbumGrid.innerHTML = fahtml;
    }
}

function pickTrack(album) {
    let idx = album.tracks.findIndex(t => t.isTitle && t.mv);
    if (idx === -1) idx = album.tracks.findIndex(t => t.mv);
    if (idx === -1) idx = album.tracks.findIndex(t => t.isTitle);
    if (idx === -1) idx = 0;
    return idx;
}

function openAlbumModal(idx) {
    currentAlbumIdx = idx;
    const album = ALBUMS[idx];
    if (!album) return;
    const titleEl = document.getElementById('albumModalTitle');
    const coverEl = document.getElementById('albumModalCover');
    if (coverEl) { coverEl.style.display = ''; coverEl.src = `images/${album.image}`; coverEl.alt = album.title; }
    const listEl = document.getElementById('albumTrackList');
    if (titleEl) titleEl.textContent = album.title;
    const labelEl = document.querySelector('.album-tracklist-label');
    if (labelEl) labelEl.textContent = window.t ? window.t('trackList') : 'TRACK LIST';
    if (listEl) {
        listEl.innerHTML = album.tracks.map((t, i) => `
            <div class="album-track-row${t.isTitle ? ' title-track' : ''}" data-idx="${i}" onclick="playAlbumTrack(${i})">
                <span class="album-track-num">${String(i + 1).padStart(2, '0')}</span>
                <span class="album-track-name">${t.name}${t.isTitle ? ' <span class="title-star">★</span>' : ''}</span>
            </div>`).join('');
    }
    playAlbumTrack(pickTrack(album));

    const modal = document.getElementById('albumModal');
    const backdrop = document.getElementById('albumModalBackdrop');
    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAlbumModal() {
    const modal = document.getElementById('albumModal');
    const backdrop = document.getElementById('albumModalBackdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = 'auto';
    const frame = document.getElementById('albumMvFrame');
    if (frame) frame.src = '';
}

function playAlbumTrack(trackIdx) {
    const album = ALBUMS[currentAlbumIdx];
    if (!album) return;
    const track = album.tracks[trackIdx];
    if (!track) return;

    document.querySelectorAll('.album-track-row').forEach(row => row.classList.remove('active'));
    const activeRow = document.querySelector(`.album-track-row[data-idx="${trackIdx}"]`);
    if (activeRow) activeRow.classList.add('active');

    const mediaWrap = document.getElementById('albumMediaWrap');
    if (!mediaWrap) return;

    const firstLink = track.links && track.links[0];
    const videoId = track.mv || (firstLink && firstLink.vid);

    if (videoId) {
        mediaWrap.innerHTML = `<iframe id="albumMvFrame" src="https://www.youtube.com/embed/${videoId}" title="${track.name}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else {
        const album2 = ALBUMS[currentAlbumIdx];
        const noLinkLabel = window.t ? window.t('noLink') : '등록된 링크가 없습니다';
        mediaWrap.innerHTML = `
            <div class="album-cover-fallback" style="background-image:url('images/${album2.image}')">
                <span class="album-audio-btn album-audio-btn-disabled">${noLinkLabel}</span>
            </div>`;
    }
}

let wrPlayed = false;
function playWithRescene() {
    if (wrPlayed) return;
    wrPlayed = true;

    const section = document.getElementById('historySection');
    const text = document.getElementById('wrText');
    const next = document.getElementById('wrNext');
    if (!section || !text || !next) return;

    section.classList.add('wr-playing');
    text.classList.add('wr-hide');
    setTimeout(() => { next.classList.add('show'); }, 2200);
}

function openBgSettings() {
    const sheet = document.getElementById('bgSettingsSheet');
    const backdrop = document.getElementById('bgSettingsBackdrop');
    if (sheet && backdrop) {
        sheet.classList.add('active');
        backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeBgSettings() {
    const sheet = document.getElementById('bgSettingsSheet');
    const backdrop = document.getElementById('bgSettingsBackdrop');
    if (sheet && backdrop) {
        sheet.classList.remove('active');
        backdrop.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

const BG_DEFAULT = { type: 'video', src: 'video/member.mp4' };
const BG_MEMBERS = [
    { key: 'woni', label: '원이' },
    { key: 'liv', label: '리브' },
    { key: 'minami', label: '미나미' },
    { key: 'may', label: '메이' },
    { key: 'zena', label: '제나' }
];
const BG_MEMBER_PHOTOS = ['yoyo', 'debut', 'rescene', 'scenedrome', 'glowup', 'dearest', 'heartdrop', 'lipbomb', 'runaway', 'prettygirl', 'sign'];
let bgActiveMemberTab = 'woni';

function bgOptionHtml(type, src, label) {
    const thumb = type === 'video'
        ? `<video src="${src}" muted loop playsinline preload="metadata"></video>`
        : `<img src="${src}" alt="${label || ''}" loading="lazy" onerror="this.closest('.bg-option').style.display='none'">`;
    return `<button type="button" class="bg-option" data-type="${type}" data-src="${src}" onclick="setCustomBg('${type}', '${src}')" title="${label || ''}">
        ${thumb}
        <span class="bg-option-check">적용완료</span>
    </button>`;
}

function renderBgOptionsAll() {
    const wrap = document.getElementById('bgOptionsAll');
    if (!wrap) return;
    let html = bgOptionHtml('video', BG_DEFAULT.src, '단체 영상');
    for (let i = 1; i <= 10; i++) {
        html += bgOptionHtml('image', `images/profile/${i}.jpg`, `프로필 ${i}`);
    }
    wrap.innerHTML = html;
    bgMarkActiveOptions();
}

function renderBgMemberTabs() {
    const row = document.getElementById('bgMemberRow');
    if (!row) return;
    row.innerHTML = BG_MEMBERS.map(m =>
        `<button type="button" class="bg-member-chip${m.key === bgActiveMemberTab ? ' active' : ''}" onclick="bgSetMember('${m.key}')">${m.label}</button>`
    ).join('');
}

function renderBgOptionsMember() {
    const wrap = document.getElementById('bgOptionsMember');
    if (!wrap) return;
    wrap.innerHTML = BG_MEMBER_PHOTOS.map(p => {
        const ext = p === 'sign' ? 'svg' : 'webp';
        return bgOptionHtml('image', `images/profile/${bgActiveMemberTab}/${p}.${ext}`, p);
    }).join('');
    bgMarkActiveOptions();
}

function bgSetMember(key) {
    bgActiveMemberTab = key;
    renderBgMemberTabs();
    renderBgOptionsMember();
}

function bgSetTab(tab) {
    document.querySelectorAll('.bg-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.bg-tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === tab));
}

function bgMarkActiveOptions() {
    const savedType = localStorage.getItem('rescene-bg-type') || BG_DEFAULT.type;
    const savedSrc = localStorage.getItem('rescene-bg-src') || BG_DEFAULT.src;
    document.querySelectorAll('.bg-option').forEach(el => {
        el.classList.toggle('active-bg', el.dataset.type === savedType && el.dataset.src === savedSrc);
    });
}

function setCustomBg(type, src) {
    const vid = document.getElementById('bgVideo');
    const img = document.getElementById('bgImage');
    if (!vid || !img) return;

    vid.style.opacity = '0';
    img.style.opacity = '0';

    setTimeout(() => {
        if (type === 'video') {
            vid.src = src;
            vid.style.display = 'block';
            img.style.display = 'none';
            vid.play().catch(() => {});
            requestAnimationFrame(() => { vid.style.opacity = '0.7'; });
        } else {
            img.src = src;
            img.style.display = 'block';
            vid.style.display = 'none';
            vid.pause();
            requestAnimationFrame(() => { img.style.opacity = '0.7'; });
        }
    }, 500);

    localStorage.setItem('rescene-bg-type', type);
    localStorage.setItem('rescene-bg-src', src);
    bgMarkActiveOptions();
}

function initCustomBg() {
    renderBgOptionsAll();
    renderBgMemberTabs();
    renderBgOptionsMember();

    const savedType = localStorage.getItem('rescene-bg-type');
    const savedSrc = localStorage.getItem('rescene-bg-src');
    if (savedType && savedSrc && (savedType !== BG_DEFAULT.type || savedSrc !== BG_DEFAULT.src)) {
        setCustomBg(savedType, savedSrc);
    }
}
