/* =========================================
   공통 유틸리티
   ⭐️ 다크모드 / 햄버거메뉴 / reveal 애니메이션 / 캘린더-스케줄은
      js/common.js 로 옮겨졌습니다. (모든 페이지 공용, 여기서 중복 정의 금지)
========================================= */
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
// ⭐️ 모달 안에서 좌우로 드래그(스와이프)하면 다음/이전 항목으로 이동
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

    // 터치(모바일)
    el.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        startX = e.touches[0].clientX; startY = e.touches[0].clientY; tracking = true;
    }, { passive: true });
    el.addEventListener('touchend', (e) => {
        if (!tracking) return;
        finish(e.changedTouches[0].clientX - startX, e.changedTouches[0].clientY - startY);
    }, { passive: true });

    // 마우스(데스크탑) — 이미지/닫기 버튼 클릭은 그대로 동작하도록 살짝만 움직였을 땐 클릭으로 취급
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
});


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

function renderTodayMonthSchedule() {
    const colA = document.getElementById('todayScrollColA');
    const colB = document.getElementById('todayScrollColB');
    const titleEl = document.getElementById('todayMonthTitle');
    const countEl = document.getElementById('todayMonthCount');
    if (!colA || !colB) return;

    const now = new Date();
    const year = now.getFullYear(), month = now.getMonth() + 1;
    const weekdays = window.t ? window.t('weekdays') : ["일", "월", "화", "수", "목", "금", "토"];
    const typeLabelMap = window.t ? window.t('scheduleTypes') : {};
    if (titleEl) titleEl.textContent = `${year}년 ${month}월`;

    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const keys = Object.keys(scheduleDB).filter(k => k.startsWith(monthKey)).sort();

    let totalCount = 0;
    const groups = [];
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
        groups.push({
            count: data.items.length,
            html: `<div class="tm-group${isToday ? ' is-today' : ''}">
                <div class="tm-group-date${dow === 0 ? ' sun' : (dow === 6 ? ' sat' : '')}">
                    <span class="tm-day">${d.getDate()}</span><span class="tm-dow">${weekdays[dow]}</span>
                </div>
                <div class="tm-group-items">${itemsHtml}</div>
            </div>`
        });
    });

    if (countEl) countEl.textContent = totalCount ? `${totalCount}개` : '';

    if (!groups.length) {
        const emptyMsg = window.t ? window.t('noSchedule') : '등록된 일정이 없습니다.';
        colA.innerHTML = `<div class="tm-empty">${emptyMsg}</div>`;
        colB.innerHTML = '';
        return;
    }

    // ⭐️ 일정 개수 기준으로 좌/우 컬럼에 균형있게 분배 (그룹 단위 유지)
    let sumA = 0, sumB = 0, htmlA = '', htmlB = '';
    groups.forEach(g => {
        if (sumA <= sumB) { htmlA += g.html; sumA += g.count; }
        else { htmlB += g.html; sumB += g.count; }
    });
    colA.innerHTML = htmlA;
    colB.innerHTML = htmlB;
}
setInterval(renderTodayMonthSchedule, 60000);

/* =========================================
   콘텐츠(아카이브 & 앨범, 쇼츠) 그리기
========================================= */
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

    // ⭐️ archive.html 전용 — 전체 프로필 사진 그리드 (있으면 채움)
    const fullProfileGrid = document.getElementById('fullProfileGrid');
    if (fullProfileGrid) {
        let fhtml = '';
        for (let i = 1; i <= 10; i++) {
            fhtml += `<div class="profile-item" onclick="openImageModal('images/profile/${i}.jpg', ${i})"><img src="images/profile/${i}.jpg" alt="RESCENE profile ${i}" loading="lazy" onerror="this.closest('.profile-item').style.display='none'"><span class="pf-index">NO. ${String(i).padStart(2, '0')}</span></div>`;
        }
        fullProfileGrid.innerHTML = fhtml;
    }

    // ⭐️ 앨범 커버/순서/트랙 정보 (아래 renderAlbumGrid 참고)
    try { renderAlbumGrid(); } catch (e) { console.error('renderAlbumGrid 실패:', e); }
}

// ⭐️ 마우스로 좌우 드래그해서 넘겨볼 수 있게 (터치는 브라우저가 기본으로 지원)
function enableDragScroll(el) {
    if (!el) return;
    el.style.scrollBehavior = 'auto'; // CSS의 scroll-behavior:smooth가 JS 애니메이션과 충돌해서 안 움직이던 문제 수정
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
    // 트랙패드는 deltaX/deltaY 비율이 매 이벤트마다 미세하게 흔들려서, 매번 다시 판단하면
    // "세로 스크롤 → 가로 스크롤 → 세로 스크롤..."로 뒤집히며 끊기는(드드득) 느낌이 남.
    // → 한 번의 연속 제스처 동안은 처음 판단한 방향을 그대로 유지(락)하고,
    //   잠깐(120ms) 멈추면 다음 제스처에서 다시 판단하도록 함.
    let wheelLockDirection = null;
    let wheelLockTimer = null;
    el.addEventListener('wheel', (e) => {
        clearTimeout(wheelLockTimer);
        wheelLockTimer = setTimeout(() => { wheelLockDirection = null; wheelTarget = null; }, 120);

        if (wheelLockDirection === null) {
            wheelLockDirection = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? 'vertical' : 'horizontal';
        }
        if (wheelLockDirection !== 'vertical') return; // 이미 가로 스크롤 제스처면 네이티브 동작에 맡김

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

/* =========================================
   ⭐️ 앨범 데이터 + 앨범 상세 모달 (MV / 트랙리스트 / 음원 링크)
   - 앨범 순서 · 파일명 · 수록곡 · 링크는 "앨범 모음.txt" 기준으로 정리됨
   - main.js 안에 직접 포함 (별도 스크립트 태그 의존성 제거)
========================================= */
const ALBUMS = [{"title": "YoYo", "image": "yoyo.jpg", "tracks": [{"name": "YoYo", "isTitle": true, "mv": "uDYy2UyO1X4", "links": []}]}, {"title": "Re:Scene", "image": "uhuh.jpg", "tracks": [{"name": "UhUh", "isTitle": true, "mv": "zpSejlkSXLA", "links": []}, {"name": "YoYo", "isTitle": false, "mv": "uDYy2UyO1X4", "links": []}]}, {"title": "Counting Star (더 매직스타 X RESCENE (리센느))", "image": "Counting Start.jpg", "tracks": [{"name": "Counting Star", "isTitle": true, "mv": null, "links": []}, {"name": "Counting Star (Inst.)", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "mBAEnI5kjdI"}, {"label": "첫 팬콘", "vid": "AzJepX0ujq0"}]}]}, {"title": "YoYo (Japanese Version)", "image": "yoyo japan.jpg", "tracks": [{"name": "YoYo (Japanese Version)", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "Lle0xkhk_9M"}]}]}, {"title": "SCENEDROME", "image": "SCENEDROME.jpg", "tracks": [{"name": "Lucky you", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "0UMsSFysM8o"}]}, {"name": "Love Attack", "isTitle": true, "mv": "9XttLI0oH0I", "links": [{"label": "존박 ver.", "vid": "y1SL3LBCGWg"}, {"label": "인기가요 20240901 방송분", "vid": "Hv1wQ6nlpNE"}, {"label": "엠카운트다운 260618 방송분", "vid": "ajhEFz1zNMQ"}]}, {"name": "New World", "isTitle": false, "mv": "QNXeGm-Wkms", "links": [{"label": "심플리 케이팝", "vid": "WwGF_sqjH6c"}]}, {"name": "Pinball", "isTitle": true, "mv": "B8JJ8RNM-60", "links": []}]}, {"title": "UhUh (Japanese Version)", "image": "uhuh japan.jpg", "tracks": [{"name": "UhUh (Japanese Version)", "isTitle": true, "mv": null, "links": [{"label": "음원", "vid": "YcDYrBJ3yjw"}, {"label": "TV-LIVE 20250528 방송분", "vid": "JRdVfTgwlrQ"}]}]}, {"title": "Glow Up", "image": "Glowup.jpg", "tracks": [{"name": "CRASH", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "_ivLUJ3R62U"}, {"label": "케이팝-잇", "vid": "8kRucJDItlQ"}]}, {"name": "Glow Up", "isTitle": true, "mv": "h0xUtrb_JBc", "links": [{"label": "Performance ver.", "vid": "WQuoPINWLU8"}, {"label": "엠카운트다운 250206 방송분", "vid": "FYdghnUJx-Y"}, {"label": "뮤직뱅크 250214 방송분", "vid": "r3I9kJGcn3g"}, {"label": "인기가요 250302 방송분", "vid": "bQ24gSDbMqY"}]}, {"name": "Going On", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "SIre1awR938"}]}, {"name": "In my lotion", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "rm3yX5-vusA"}, {"label": "쇼 챔피언 250305 방송분", "vid": "DqVwDLWg3ek"}]}, {"name": "Cotton Candy", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "Y8dkJXZmT5M"}, {"label": "??? 250215 직캠", "vid": "pQs7iZS0xoE"}]}]}, {"title": "Glow Up (English Version)", "image": "Glowup eng.jpg", "tracks": [{"name": "Glow Up (English Version)", "isTitle": true, "mv": null, "links": [{"label": "음원", "vid": "a5_b7KfG15Y"}]}]}, {"title": "남주의 첫날밤을 가져버렸다 OST Part. 1", "image": "namju.jpg", "tracks": [{"name": "밤밤밤", "isTitle": true, "mv": "AfiBC_VR2K4", "links": [{"label": "음원", "vid": "UcIt0TBe8pg"}, {"label": "Fancam 250907 직캠", "vid": "FmJ35OQches"}]}]}, {"title": "Dearest", "image": "dejavu.jpg", "tracks": [{"name": "Deja vu", "isTitle": true, "mv": "ZbO9PBdFRdc", "links": [{"label": "엠카운트다운 250703 방송분", "vid": "jciMWQgUVCA"}, {"label": "엠카운트다운 250710 방송분", "vid": "vQBtHJVbNeM"}, {"label": "뮤직뱅크 250714 방송분", "vid": "fW8CXaBau-U"}, {"label": "뮤직뱅크 250711 방송분", "vid": "JdYC0Jomkbs"}, {"label": "쇼챔피언 260715 방송분", "vid": "PqpmFwNjDHg"}, {"label": "교차편집", "vid": "AXdH0rWOXDg"}, {"label": "교차편집", "vid": "K7YYvqVFXn8"}]}, {"name": "Mood", "isTitle": false, "mv": "v5we0mJpoDM", "links": []}]}, {"title": "Dearest (Speed Up Version)", "image": "dejavu.jpg", "tracks": [{"name": "Deja vu (Speed Up Version)", "isTitle": true, "mv": null, "links": [{"label": "음원", "vid": "PJqWbyNPcqw"}]}, {"name": "Mood (Speed Up Version)", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "VtRqBzYte2g"}]}]}, {"title": "남주의 첫날밤을 가져버렷다 OST Special", "image": "namju2.jpg", "tracks": [{"name": "밤밤밤", "isTitle": true, "mv": "AfiBC_VR2K4", "links": [{"label": "음원", "vid": "UcIt0TBe8pg"}, {"label": "Fancam 250907 직캠", "vid": "FmJ35OQches"}]}]}, {"title": "고백주파수 (첫사랑 엔딩 X RESCENE (리센느))", "image": "go.jpg", "tracks": [{"name": "고백주파수", "isTitle": true, "mv": null, "links": [{"label": "음원", "vid": "39gg4Su8MI8"}, {"label": "Clip", "vid": "Ihsh9VRZLlo"}]}, {"name": "고백주파수 (Inst.)", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "4as776eLYH8"}]}]}, {"title": "lip bomb", "image": "lip bomb.jpg", "tracks": [{"name": "Heart Drop", "isTitle": true, "mv": "ByX8EZq8500", "links": [{"label": "Performance ver.", "vid": "638f3ttCR20"}, {"label": "뮤직뱅크 251121 방송분", "vid": "2SKGgezncCI"}, {"label": "THE SHOW 251111 방송분", "vid": "dDi-0BaW_8Y"}, {"label": "쇼챔피언 251112 방송분", "vid": "ORiKYmHPVmk"}, {"label": "The Artist Canvas", "vid": "WgDRLNgzztU"}, {"label": "녹음 비하인드", "vid": "doGCcKx9F1Q"}]}, {"name": "Bloom", "isTitle": true, "mv": "MC6-82GRK5I", "links": [{"label": "Performance ver.", "vid": "_zzAi5x0cXc"}, {"label": "THE SHOW 251213 방송분", "vid": "uCCV5qK0TBM"}, {"label": "음악중심 251220 방송분", "vid": "4ADSzlm18hY"}, {"label": "뮤직뱅크 251128 방송분", "vid": "G-zlWrcj7DU"}, {"label": "it's Live", "vid": "tf84FgQgi80"}, {"label": "원더케이", "vid": "kjvlrGs5f7c"}]}, {"name": "Love Echo", "isTitle": false, "mv": null, "links": [{"label": "SHOWCASE", "vid": "rAR6A_y3P68"}, {"label": "FANPOPTY 260721 방송분", "vid": "DONLx6eS-e0"}, {"label": "FANPOPTY FANCAM 260721 직캠", "vid": "TBgpliSowjI"}]}, {"name": "Hello XO", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "jVKfnPIkTwY"}]}, {"name": "MVP", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "TF2y-wSc2ss"}, {"label": "Christmas ver.", "vid": "qhLDO3nIYfc"}, {"label": "Live Performance", "vid": "lviLSHBntGQ"}, {"label": "직캠 260122", "vid": "4gwhiaF9zvA"}]}]}, {"title": "Pinball (Japanese Ver.)", "image": "pinball japan.jpg", "tracks": [{"name": "Pinball (Japanese Ver.)", "isTitle": true, "mv": null, "links": [{"label": "음원", "vid": "Cz-msuk8oqM"}, {"label": "Kcon 260508 직캠", "vid": "tXI20ksglDM"}]}]}, {"title": "RESCENE X ???", "image": "busy.jpg", "tracks": [{"name": "Busy Boy", "isTitle": true, "mv": "MMvTKa3BmXo", "links": [{"label": "Performance ver.", "vid": "ewubELWBMaE"}, {"label": "음원", "vid": "c70TkZH7fr0"}, {"label": "음악중심 260228 방송분", "vid": "bEkXlmGstIo"}, {"label": "쇼챔피언 260304 방송분", "vid": "j1YF0S3CKtw"}, {"label": "인기가요 260301 방송분", "vid": "5HwxTQouI-0"}]}, {"name": "Busy Boy (Inst.)", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "1gvTKPTYLE8"}]}]}, {"title": "Music from THE SPECIALS", "image": "musicfrom.jpg", "tracks": [{"name": "Higher", "isTitle": false, "mv": null, "links": [{"label": "음원", "vid": "HlR_f2gHxoo"}]}]}, {"title": "Busy Boy (Galantis Remix)", "image": "busy_2.jpg", "tracks": [{"name": "Busy Boy (Galantis Remix)", "isTitle": true, "mv": null, "links": [{"label": "음원", "vid": "tSCde4Aa2lg"}]}]}, {"title": "Runaway", "image": "run.jpg", "tracks": [{"name": "Runaway", "isTitle": true, "mv": "rsZwrTNklos", "links": [{"label": "엠카운트다운 260409 방송분", "vid": "qt2FvoXRw1U"}, {"label": "it's Live", "vid": "aDHmmrfizIE"}, {"label": "음악중심 260411 방송분", "vid": "F9hbFUr-SmU"}, {"label": "엠카운트다운 260416 방송분", "vid": "VB_vtps_wus"}, {"label": "인기가요 260419 방송분", "vid": "ZoWGyFHTXbI"}, {"label": "교차편집", "vid": "OkZVMQlXpDw"}]}]}, {"title": "Pretty Girl - Special Single", "image": "pretty.jpg", "tracks": [{"name": "Pretty Girl", "isTitle": true, "mv": "qZlu2j2SiBA", "links": [{"label": "음악중심 260718 방송분", "vid": "mafe6aEH16k"}, {"label": "엠카운트다운 260709 방송분", "vid": "Esd-KkxROxA"}, {"label": "뮤직뱅크 260710 방송분", "vid": "3ctIKKzrA9M"}, {"label": "음악중심 260711 방송분", "vid": "j4LlqGxOr2E"}, {"label": "뮤직뱅크 260717 방송분", "vid": "0dWn9wtFr54"}, {"label": "인기가요 260719 방송분", "vid": "eK-anMCLuiI"}, {"label": "음악중심 260718 방송분", "vid": "4s5TkXahA8g"}]}]}];

let currentAlbumIdx = 0;

function renderAlbumGrid() {
    const albumWrap = document.getElementById('albumScroll');
    if (albumWrap) {
        let ahtml = '';
        const PREVIEW_COUNT = 7;
        ALBUMS.slice(0, PREVIEW_COUNT).forEach(function (album, idx) {
            // ⭐️ 이미지가 안 뜰 경우 조용히 숨기지 않고 눈에 보이게 표시 (원인 파악 쉽게)
            ahtml += `<div class="profile-item album-cover-item" onclick="openAlbumModal(${idx})"><img src="images/${album.image}" alt="${album.title}" loading="lazy" onerror="console.error('앨범 이미지 로드 실패:', this.src); this.closest('.profile-item').classList.add('img-broken'); this.style.display='none';"><span class="album-broken-label">이미지 없음<br>${album.image}</span></div>`;
        });
        ahtml += `<a class="profile-item archive-more-tile" href="archive.html#album"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18l6-6-6-6"/></svg><span>전체보기</span></a>`;
        albumWrap.innerHTML = `<div class="profile-track album-track">${ahtml}</div>`;
    }

    // ⭐️ archive.html 전용 — 전체 앨범 그리드 (있으면 채움)
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

    // MV가 없어도 음원/방송분 등 링크가 있으면 그 영상을 그대로 재생 (음원 버튼 박스 제거)
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

/* ==========================================================================
   ⭐️ WITH RESCENE — 같은 자리에서 문구 → 벚꽃 → 발자취(추후 타임라인) 전환
   ========================================================================== */
let wrPlayed = false;
function playWithRescene() {
    if (wrPlayed) return;
    wrPlayed = true;

    const section = document.getElementById('historySection');
    const text = document.getElementById('wrText');
    const next = document.getElementById('wrNext');
    if (!section || !text || !next) return;

    section.classList.add('wr-playing');

    // 1. WITH RESCENE 문구가 천천히 사라짐
    text.classList.add('wr-hide');

    // 2. (임시) 발자취 준비중 안내 — 추후 마일스톤 타임라인으로 교체 예정
    setTimeout(() => { next.classList.add('show'); }, 2200);
}
