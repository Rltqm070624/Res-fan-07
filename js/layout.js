function renderSiteNav(activeKey, root, opts) {
    root = root || '';
    opts = opts || {};
    const isHome = activeKey === 'home';

    const NAV_LINKS = [
        { key: 'home', label: 'HOME', href: root + 'index.html' },
        { key: 'members', label: 'MEMBERS', href: root + 'member/member.html' },
        { key: 'charts', label: 'CHARTS', href: root + 'chart/chart.html' },
        { key: 'schedule', label: 'SCHEDULE',
          href: isHome ? 'javascript:void(0)' : root + 'index.html#todayScheduleSection',
          onclick: isHome ? "scrollToSection('todayScheduleSection')" : '' },
        { key: 'goods', label: 'GOODS', href: root + 'goods/goods.html' },
        { key: 'media', label: '영상 모음', href: root + 'media/media.html' },
    ];

    function linkHtml(link, extraClass) {
        const cls = link.key === activeKey ? (extraClass ? extraClass + ' active-nav' : 'active-nav') : (extraClass || '');
        const clsAttr = cls ? ` class="${cls}"` : '';
        const onclickAttr = link.onclick ? ` onclick="${link.onclick}"` : '';
        return `<li><a href="${link.href}"${clsAttr}${onclickAttr}>${link.label}</a></li>`;
    }

    const desktopLinks = NAV_LINKS.map(l => linkHtml(l)).join('');
    const mobileLinks = NAV_LINKS.map(l => linkHtml(l)).join('');

    const langSwitcherHtml = opts.lang ? `
            <div class="desktop-only-utils util-reset">
                <div class="lang-switcher lang-switcher-inline notranslate" translate="no" role="group" aria-label="Language">
                    <button type="button" class="lang-btn" data-lang="ko" onclick="setLang('ko')">KOR</button>
                    <button type="button" class="lang-btn" data-lang="en" onclick="setLang('en')">ENG</button>
                    <button type="button" class="lang-btn" data-lang="ja" onclick="setLang('ja')">日本語</button>
                </div>
            </div>
            <span class="desktop-only-utils nav-divider" aria-hidden="true"></span>` : '';

    const calBtnHtml = opts.calendar ? `
            <div class="desktop-only-utils util-reset">
                <button class="cal-icon-btn" onclick="openCalendarPopup()" title="Calendar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </button>
            </div>` : '';

    const mobileCalBtnHtml = opts.calendar ? `
            <button class="mobile-cal-btn" onclick="openCalendarPopup(); toggleMobileMenu();" title="Calendar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </button>` : '';

    const navHtml = `
    <nav class="top-nav">
        <div class="nav-brand notranslate" translate="no"><a href="${root}index.html" class="plain-link">RESCENE</a></div>
        <ul class="desktop-menu">${desktopLinks}</ul>
        <div class="nav-right">${langSwitcherHtml}
            <button class="theme-toggle-btn" id="themeToggleBtn" onclick="toggleTheme()" title="테마 변경"></button>
            <span class="desktop-only-utils nav-divider" aria-hidden="true"></span>${calBtnHtml}
            <button class="hamburger-btn" id="hamburgerBtn" onclick="toggleMobileMenu()" aria-label="메뉴 열기"><span></span><span></span><span></span></button>
        </div>
    </nav>

    <div class="mobile-menu-backdrop" id="mobileMenuBackdrop" onclick="toggleMobileMenu()"></div>
    <div class="mobile-menu-panel" id="mobileMenuPanel" style="display: flex; flex-direction: column;">
        <div class="mobile-top-utils">${mobileCalBtnHtml}
            <div class="mobile-sns-box">
                <a href="https://twitter.com/RESCENEofficial" target="_blank"><img src="${root}images/x.png" alt="X" onerror="this.style.display='none'"></a>
                <a href="https://www.instagram.com/rescene_official" target="_blank"><img src="${root}images/instagram.png" alt="IG" onerror="this.style.display='none'"></a>
                <a href="https://www.youtube.com/@RESCENE_official" target="_blank"><img src="${root}images/youtube.png" alt="YT" onerror="this.style.display='none'"></a>
            </div>
        </div>
        <ul class="mobile-menu-list">${mobileLinks}</ul>
        ${opts.lang ? `<div class="lang-switcher lang-switcher-mobile notranslate" translate="no" role="group" aria-label="Language" style="margin-top: auto; margin-bottom: 20px; display: flex; justify-content: center;">
            <button type="button" class="lang-btn" data-lang="ko" onclick="setLang('ko')">KOR</button>
            <button type="button" class="lang-btn" data-lang="en" onclick="setLang('en')">ENG</button>
            <button type="button" class="lang-btn" data-lang="ja" onclick="setLang('ja')">日本語</button>
        </div>` : ''}
    </div>`;

    const slot = document.getElementById('siteNavSlot');
    if (slot) slot.outerHTML = navHtml;
    if (typeof updateThemeIcon === 'function') updateThemeIcon(document.documentElement.getAttribute('data-theme') || 'dark');
}

function renderSiteFooter(root) {
    root = root || '';
    const footerHtml = `
    <footer class="global-footer">
        <div class="footer-sns">
            <a href="https://twitter.com/RESCENEofficial" target="_blank"><img src="${root}images/x.png" alt="X" class="sns-icon-sm" onerror="this.style.display='none'"></a>
            <a href="https://www.instagram.com/rescene_official" target="_blank"><img src="${root}images/instagram.png" alt="IG" onerror="this.style.display='none'"></a>
            <a href="https://www.youtube.com/@RESCENE_official" target="_blank"><img src="${root}images/youtube.png" alt="YT" onerror="this.style.display='none'"></a>
            <a href="https://www.tiktok.com/@rescene_official" target="_blank"><img src="${root}images/tiktok.png" alt="TT" onerror="this.style.display='none'"></a>
        </div>
        <p class="footer-disclaimer" data-i18n="footerDisclaimer">해당 홈페이지는 팬이 자발적으로 운영하는 비공식 팬 페이지입니다.<br>모든 저작권은 아티스트 RESCENE, 소속사 THE MUZE Entertainment에게 있으며 공식 관계가 없음을 알려드립니다.</p>
        <p>&copy; 2024 RESCENE ARCHIVE. All Rights Reserved.</p>
    </footer>`;

    const slot = document.getElementById('siteFooterSlot');
    if (slot) slot.outerHTML = footerHtml;
}

function renderCalendarWidgets() {
    const html = `
    <div class="modal-backdrop cal-backdrop" id="calPopupBackdrop" onclick="closeCalendarPopup()"></div>
    <div class="calendar-popup-wrapper" id="calendarPopupModal">
        <button class="popup-close-btn" onclick="closeCalendarPopup()" aria-label="닫기">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div class="calendar-header-controls">
            <button class="cal-btn" onclick="changeMonth(-1)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>
            <div class="calendar-title" id="calendarMonthText"></div>
            <button class="cal-btn" onclick="changeMonth(1)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></button>
        </div>
        <div class="calendar-grid"><div class="weekday" data-wd="0">SUN</div><div class="weekday" data-wd="1">MON</div><div class="weekday" data-wd="2">TUE</div><div class="weekday" data-wd="3">WED</div><div class="weekday" data-wd="4">THU</div><div class="weekday" data-wd="5">FRI</div><div class="weekday" data-wd="6">SAT</div></div>
        <div class="calendar-grid" id="calendarDays"></div>
        <div class="calendar-legend">
            <span class="legend-item"><span class="legend-dot" style="background:#7e57c2"></span>방송</span>
            <span class="legend-item"><span class="legend-dot" style="background:#ffa726"></span>라디오</span>
            <span class="legend-item"><span class="legend-dot" style="background:#66bb6a"></span>행사</span>
            <span class="legend-item"><span class="legend-dot" style="background:#ec407a"></span>팬사인회</span>
            <span class="legend-item"><span class="legend-dot" style="background:#26c6da"></span>공연</span>
            <span class="legend-item"><span class="legend-dot" style="background:#78909c"></span>공지</span>
        </div>
    </div>

    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal()"></div>
    <div class="modal-wrapper" id="scheduleModal">
        <div class="sheet-drag-handle" id="scheduleSheetHandle"></div>
        <button class="popup-close-btn" onclick="closeModal()" aria-label="닫기">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div id="modalScheduleText"></div>
    </div>`;

    const slot = document.getElementById('siteCalendarSlot');
    if (slot) slot.outerHTML = html;
}
