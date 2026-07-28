/* ==========================================================================
   ⭐️ 전 페이지 공용 스크립트 (다크모드 / 모바일 메뉴 / 캘린더-스케줄)
   - index.html / member/member.html / goods/goods.html 에서 공통으로 불러와요.
   - 하위 폴더(member/goods)에서 쓸 때는 이 스크립트를 불러오기 전에
     `var SITE_ROOT = "../";` 를 선언해주세요. (루트 index.html은 안 적어도 됨)
   - 이 파일 하나만 고치면 모든 페이지에 반영됩니다. (다른 곳에 복붙 금지!)
   ========================================================================== */
if (typeof SITE_ROOT === 'undefined') { var SITE_ROOT = ''; }

/* ---- 모바일 햄버거 메뉴 ---- */
function toggleMobileMenu() {
    document.getElementById('hamburgerBtn').classList.toggle('active');
    document.getElementById('mobileMenuPanel').classList.toggle('active');
    document.getElementById('mobileMenuBackdrop').classList.toggle('active');
    document.body.style.overflow = document.getElementById('mobileMenuPanel').classList.contains('active') ? 'hidden' : 'auto';
}

/* ---- 다크 / 화이트 모드 토글 ---- */
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
    updateThemeIcon(next);
}
window.addEventListener('DOMContentLoaded', () => { updateThemeIcon(document.documentElement.getAttribute('data-theme') || 'dark'); });

/* ---- 스크롤 reveal 애니메이션 (공통) ---- */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal, .slow-reveal').forEach(el => revealObserver.observe(el));

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ---- 스케줄 데이터 로드 & 캘린더 팝업 ---- */
let scheduleDB = {};
let currentCalYear = new Date().getFullYear();
let currentCalMonth = new Date().getMonth() + 1;
const colorMap = { "broadcast": "#7e57c2", "fansign": "#ec407a", "event": "#66bb6a", "concert": "#26c6da", "radio": "#ffa726", "notice": "#78909c" };

async function fetchScheduleData() {
    try {
        const response = await fetch(SITE_ROOT + 'js/schedule_data.json?t=' + new Date().getTime());
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
    // ⭐️ index.html에만 있는 '오늘의 일정' 위젯 — 있으면 같이 갱신
    if (typeof renderTodaySchedule === 'function') renderTodaySchedule();
}

function renderCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;
    const monthText = document.getElementById('calendarMonthText');
    if (monthText) monthText.innerText = `${currentCalYear}. ${String(currentCalMonth).padStart(2, '0')}`;
    const firstDayIndex = new Date(currentCalYear, currentCalMonth - 1, 1).getDay(), lastDate = new Date(currentCalYear, currentCalMonth, 0).getDate();
    let html = '';
    for (let i = 0; i < firstDayIndex; i++) { html += `<div class="day-cell empty"></div>`; }
    for (let i = 1; i <= lastDate; i++) {
        const dateKey = `${currentCalYear}-${String(currentCalMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const data = scheduleDB[dateKey]; const hasEvent = data && data.items && data.items.length > 0 ? 'has-event' : '';
        let eventsHtml = '';
        if (data && data.items) {
            const MAX_VISIBLE = 2;
            data.items.slice(0, MAX_VISIBLE).forEach(item => {
                let dotColor = item.color ? item.color : 'var(--c-accent)';
                eventsHtml += `<div class="cal-chip" style="color: ${dotColor};">${item.title}</div>`;
            });
            if (data.items.length > MAX_VISIBLE) {
                eventsHtml += `<div class="cal-event-more">+${data.items.length - MAX_VISIBLE}개 더</div>`;
            }
        }
        html += `<div class="day-cell ${hasEvent}" onclick="openModal('${currentCalYear}', '${currentCalMonth}', '${i}', '${dateKey}')"><span class="day-number">${i}</span><div class="cell-event-list">${eventsHtml}</div></div>`;
    }
    for (let i = 0; i < (42 - (firstDayIndex + lastDate)); i++) { html += `<div class="day-cell empty"></div>`; }
    calendarDays.innerHTML = html;
}

function changeMonth(delta) {
    currentCalMonth += delta;
    if (currentCalMonth > 12) { currentCalMonth = 1; currentCalYear++; } else if (currentCalMonth < 1) { currentCalMonth = 12; currentCalYear--; }
    renderCalendar();
}

function openCalendarPopup() {
    const modal = document.getElementById('calendarPopupModal'), backdrop = document.getElementById('calPopupBackdrop');
    if (modal && backdrop) { modal.classList.add('active'); backdrop.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeCalendarPopup() {
    const modal = document.getElementById('calendarPopupModal'), backdrop = document.getElementById('calPopupBackdrop'), detailModal = document.getElementById('scheduleModal');
    if (modal) { modal.classList.remove('active'); modal.classList.remove('split-active'); }
    if (backdrop) backdrop.classList.remove('active'); if (detailModal) detailModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function openModal(year, month, day, dateKey) {
    const calWrapper = document.getElementById('calendarPopupModal');
    if (calWrapper && window.innerWidth >= 1050) calWrapper.classList.add('split-active');

    const dateTitle = window.tDate ? window.tDate(year, String(month).padStart(2, '0'), String(day).padStart(2, '0')) : `${year}년 ${month}월 ${day}일`;
    const data = scheduleDB[dateKey];
    const typeLabelMap = window.t ? window.t('scheduleTypes') : { broadcast: "방송", fansign: "팬사인회", event: "행사", concert: "공연", radio: "라디오", notice: "공지" };
    const timeLabel = window.t ? window.t('timeLabel') : '시간';
    const timeTbd = window.t ? window.t('timeTbd') : '시간 미정';

    let scheduleHtml = `<div class="elegant-date-header">${dateTitle}</div>`;

    if (data && data.items && data.items.length > 0) {
        data.items.forEach(item => {
            let dotColor = item.color ? item.color : 'var(--c-accent)';
            let label = typeLabelMap[item.type] || item.type || '일정';
            let time = item.time ? item.time : timeTbd;
            scheduleHtml += `<div class="ec-card"><span class="ec-badge" style="background-color: ${dotColor}; box-shadow: 0 4px 12px ${dotColor}40;">${label}</span><div class="ec-body"><div class="ec-meta"><div class="ec-meta-row"><span class="ec-meta-label">${timeLabel}</span><span class="ec-meta-val">${time}</span></div></div><h2 class="ec-title">${item.title}</h2>`;
            if (item.image) scheduleHtml += `<div class="ec-img-wrapper"><img src="${SITE_ROOT}${item.image}" alt="${item.title}" onerror="this.style.display='none'"></div>`;
            scheduleHtml += `</div></div>`;
        });
    } else {
        const emptyMsg = window.t ? window.t('noSchedule') : '등록된 일정이 없습니다.';
        scheduleHtml += `<div class="schedule-detail-empty">${emptyMsg}</div>`;
    }

    const textEl = document.getElementById('modalScheduleText'); if (textEl) textEl.innerHTML = scheduleHtml;
    const scheduleModal = document.getElementById('scheduleModal'), backdrop = document.getElementById('modalBackdrop');
    if (scheduleModal) scheduleModal.classList.add('active'); if (backdrop) backdrop.classList.add('active');

    // ⭐️ CSS만으로 안 먹히는 경우를 대비해 JS로 직접 높이를 계산해서 강제 지정 (데스크탑 분할 뷰에서만)
    if (scheduleModal && textEl && window.innerWidth >= 1050) {
        requestAnimationFrame(() => {
            const contentHeight = textEl.scrollHeight;
            const finalHeight = Math.min(Math.max(contentHeight, 200), window.innerHeight * 0.85);
            scheduleModal.style.setProperty('height', finalHeight + 'px', 'important');
        });
    } else if (scheduleModal) {
        scheduleModal.style.removeProperty('height');
    }
}

function closeModal() {
    const scheduleModal = document.getElementById('scheduleModal'), backdrop = document.getElementById('modalBackdrop'), calModal = document.getElementById('calendarPopupModal');
    if (scheduleModal) scheduleModal.classList.remove('active'); if (backdrop) backdrop.classList.remove('active'); if (calModal) calModal.classList.remove('split-active');
}

window.addEventListener('DOMContentLoaded', () => { fetchScheduleData(); initSheetDrag(); });

/* ---- 모바일 바텀시트: 핸들 드래그해서 아래로 내리면 닫힘 ---- */
function initSheetDrag() {
    const sheet = document.getElementById('scheduleModal');
    const handle = document.getElementById('scheduleSheetHandle');
    if (!sheet || !handle) return;

    let startY = 0, deltaY = 0, dragging = false;
    const DISMISS_THRESHOLD = 110;

    handle.addEventListener('touchstart', (e) => {
        if (window.innerWidth >= 1050) return;
        dragging = true; startY = e.touches[0].clientY; deltaY = 0;
        sheet.classList.add('dragging');
    }, { passive: true });

    handle.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        deltaY = Math.max(0, e.touches[0].clientY - startY);
        sheet.style.transform = `translateY(${deltaY}px)`;
    }, { passive: true });

    const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        sheet.classList.remove('dragging');
        sheet.style.transform = '';
        if (deltaY > DISMISS_THRESHOLD) closeModal();
        deltaY = 0;
    };
    handle.addEventListener('touchend', endDrag);
    handle.addEventListener('touchcancel', endDrag);
}
