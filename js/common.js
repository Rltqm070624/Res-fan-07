/* ==========================================================================
   ⭐️ 전 페이지 공용 스크립트
   - index.html / member/member.html / goods/goods.html / discography/discography.html
     에서 공통으로 불러와요.
   - 로드 순서: schedule-data.js → common.js
   - 하위 폴더(member/goods/discography)에서 쓸 때는 이 스크립트를 불러오기 전에
     `const SITE_ROOT = "../";` 를 선언해주세요. (루트 index.html은 "" 그대로)
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
updateThemeIcon(document.documentElement.getAttribute('data-theme') || 'dark');

/* ---- 캘린더 팝업 (로딩 스켈레톤 포함) ---- */
let currentCalYear = 2026;
let currentCalMonth = 7;

function changeMonth(delta) {
    currentCalMonth += delta;
    if (currentCalMonth > 12) { currentCalMonth = 1; currentCalYear++; }
    else if (currentCalMonth < 1) { currentCalMonth = 12; currentCalYear--; }
    renderCalendarWithSkeleton();
}

function renderCalendarSkeleton() {
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;
    let html = '';
    for (let i = 0; i < 35; i++) { html += `<div class="day-cell skeleton" style="border-radius:12px;"></div>`; }
    calendarDays.innerHTML = html;
}
function renderCalendarWithSkeleton() {
    renderCalendarSkeleton();
    setTimeout(renderCalendar, 260);
}

function renderCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;
    document.getElementById('calendarMonthText').innerText = `${currentCalYear}. ${String(currentCalMonth).padStart(2, '0')}`;
    const firstDayIndex = new Date(currentCalYear, currentCalMonth - 1, 1).getDay();
    const lastDate = new Date(currentCalYear, currentCalMonth, 0).getDate();

    let html = '';
    for (let i = 0; i < firstDayIndex; i++) { html += `<div class="day-cell empty"></div>`; }
    for (let i = 1; i <= lastDate; i++) {
        const dateKey = `${currentCalYear}-${String(currentCalMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const data = (typeof scheduleDB !== 'undefined') ? scheduleDB[dateKey] : null;
        const hasEvent = data ? 'has-event' : '';
        let eventsHtml = '';

        if (data && data.items) {
            data.items.forEach(item => {
                let dotColor = item.color ? item.color : 'var(--c-accent)';
                eventsHtml += `
                    <div class="cal-event-row">
                        <div class="cal-dot" style="background: ${dotColor}; box-shadow: 0 0 6px ${dotColor}60;"></div>
                        <div class="cal-event-time" style="color: ${dotColor};">${item.time}</div>
                        <div class="cal-event-title">${item.title}</div>
                    </div>
                `;
            });
        }

        html += `<div class="day-cell ${hasEvent}" onclick="openModal('${currentCalYear}', '${currentCalMonth}', '${i}', '${dateKey}')">
                    <span class="day-number">${i}</span>
                    <div class="cell-event-list">${eventsHtml}</div>
                 </div>`;
    }
    calendarDays.innerHTML = html;
}

function openCalendarPopup() {
    document.getElementById('calendarPopupModal').classList.add('active');
    document.getElementById('calPopupBackdrop').classList.add('active');
    document.body.style.overflow = 'hidden';
    renderCalendarWithSkeleton();
}
function closeCalendarPopup() {
    document.getElementById('calendarPopupModal').classList.remove('active');
    document.getElementById('calPopupBackdrop').classList.remove('active');
    document.body.style.overflow = 'auto';
}

/* ---- 스케줄 상세 정보 모달 (우측 슬라이드) ---- */
function openModal(year, month, day, dateKey) {
    document.getElementById('modalDateTitle').innerText = `${year}년 ${month}월 ${day}일`;
    const data = (typeof scheduleDB !== 'undefined') ? scheduleDB[dateKey] : null;
    let scheduleHtml = '';

    if (data && data.items) {
        scheduleHtml += `<div class="schedule-detail-card"><div class="sd-body">`;
        data.items.forEach(item => {
            let dotColor = item.color ? item.color : 'var(--c-accent)';
            scheduleHtml += `
                <div class="sd-row">
                    <div class="sd-dot" style="background: ${dotColor}; box-shadow: 0 0 8px ${dotColor}60;"></div>
                    <div class="sd-time" style="color: ${dotColor};">${item.time}</div>
                    <div class="sd-title">${item.title}</div>
                </div>
            `;
            if (item.image) {
                scheduleHtml += `
                    <div class="sd-img-wrapper">
                        <img src="${SITE_ROOT}${item.image}" alt="${item.title}" onerror="this.style.display='none'">
                    </div>
                `;
            }
        });
        scheduleHtml += `</div></div>`;
    } else {
        scheduleHtml = `<div class="schedule-detail-empty">등록된 일정이 없습니다.</div>`;
    }

    document.getElementById('modalScheduleText').innerHTML = scheduleHtml;
    document.getElementById('scheduleModal').classList.add('active');
    document.getElementById('modalBackdrop').classList.add('active');
}

function closeModal() {
    document.getElementById('scheduleModal').classList.remove('active');
    document.getElementById('modalBackdrop').classList.remove('active');
    if (!document.getElementById('calendarPopupModal').classList.contains('active')) {
        document.body.style.overflow = 'auto';
    }
}

/* ---- 스크롤 reveal 애니메이션 (공통) ---- */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}
