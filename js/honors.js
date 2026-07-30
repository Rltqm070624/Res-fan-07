function logoImg(key, size) {
    size = size || 22;
    const file = AWARDS_LOGOS[key];
    if (!file) return '';
    return `<img src="${AWARDS_LOGO_PATH}${file}" alt="" class="honors-logo" style="height:${size}px;" onerror="this.style.display='none'">`;
}

/* 곡 제목으로 실제 앨범 커버 이미지를 찾아 미리보기에 사용 (main.js의 ALBUMS 배열 재사용) */
function findAlbumCover(songName) {
    if (typeof ALBUMS === 'undefined' || !songName) return null;
    const target = songName.trim().toLowerCase();
    for (const album of ALBUMS) {
        if (album.tracks && album.tracks.some(t => t.name && t.name.trim().toLowerCase() === target)) {
            return album.image;
        }
    }
    return null;
}

const AD_TYPE_COLOR = { '홍보대사': '#9AA6FF', '화보': '#ec407a', '콜라보': '#26c6da', '광고': '#66bb6a' };

/* 패널 상단의 장황한 문구("○○ 히스토리 (총 N건)") 대신 쓰는 절제된 스탯 배지 */
function panelStat(value, label) {
    return `<div class="honors-panel-top"><span class="honors-stat-pill"><span class="stat-num">${value}</span><span class="stat-label">${label}</span></span></div>`;
}

/* 문자열 끝의 괄호를 분리해 배지로 쓰기 위한 파서 — "타이틀 (카테고리)" -> { main, tag } */
function splitTrailingParen(str) {
    if (!str) return { main: '', tag: null };
    const m = str.trim().match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (m) return { main: m[1].trim(), tag: m[2].trim() };
    return { main: str.trim(), tag: null };
}
/* "~2028.05.21" / "2025.12.31" 같은 기간/기한 표기인지 판별 */
function isPeriodLike(str) {
    return /^~?\d{4}[.\-]\d{2}([.\-]\d{2})?/.test((str || '').trim());
}
function bindHonorsTabs(root) {
    const tabs = root.querySelectorAll('.honors-tab');
    const panels = root.querySelectorAll('.honors-tab-panel');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panel = root.querySelector(`.honors-tab-panel[data-panel="${tab.dataset.target}"]`);
            if (panel) panel.classList.add('active');
        });
    });
}

function renderHonorsPreview() {
    const list = document.getElementById('awardsPreviewList');
    if (list) {
        list.innerHTML = MUSIC_SHOW_WINS.slice(-3).reverse().map((w, i) => {
            return `
            <li>
                <span class="h-rank">0${i + 1}</span>
                <div class="h-thumb-wrap">${logoImg(w.logo, 28)}</div>
                <div class="h-info">
                    <span class="h-name">${w.program} · ${w.song}</span>
                    <span class="h-badge">${w.notes[0].split(' (')[0]}</span>
                </div>
                <span class="h-date">${w.date}</span>
            </li>`;
        }).join('');
    }

    const adsWrap = document.getElementById('adsPreviewChips');
    if (adsWrap) {
        const latestAds = AD_TIMELINE.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
        adsWrap.innerHTML = latestAds.map((a, i) => `
            <li>
                <span class="h-rank">0${i + 1}</span>
                ${a.img
                    ? `<div class="h-thumb-wrap"><img class="h-thumb" src="images/ad/${a.img}" alt="" onerror="this.parentElement.outerHTML='<div class=\\'h-type-wrap\\'><span class=\\'h-type-tile\\' style=\\'background:${AD_TYPE_COLOR[a.type]};\\'>${a.type}</span></div>'"></div>`
                    : `<div class="h-type-wrap"><span class="h-type-tile" style="background:${AD_TYPE_COLOR[a.type]};">${a.type}</span></div>`}
                <div class="h-info">
                    <span class="h-name">${a.title}</span>
                    ${a.note ? `<span class="h-note">${a.note.split(' (')[0]}</span>` : ''}
                </div>
                <span class="h-date">${a.date}</span>
            </li>`).join('');
    }
}

function openAwardsHistoryModal() {
    const title = document.getElementById('honorsHistoryTitle');
    if (title) title.textContent = '음악방송 1위 히스토리';
    const body = document.getElementById('awardsHistoryBody');
    if (body) {
        let html = `<div class="honors-tabbar">
            <button class="honors-tab active" data-target="cum">프로그램별 순위</button>
            <button class="honors-tab" data-target="dated">날짜별 히스토리</button>
            <button class="honors-tab" data-target="ceremony">시상식</button>
        </div>
        <div class="honors-tab-panels">
            <div class="honors-tab-panel active" data-panel="cum">
                <div class="honors-cum-list">`;
        const maxWins = Math.max(1, ...MUSIC_SHOW_CUMULATIVE.map(c => c.wins));
        MUSIC_SHOW_CUMULATIVE.slice().sort((a, b) => b.wins - a.wins).forEach((c, i) => {
            html += `<div class="cum-row">
                <span class="cum-rank">${String(i + 1).padStart(2, '0')}</span>
                <span class="cum-logo-wrap">${logoImg(c.logo, 20)}</span>
                <span class="cum-program">${c.program}</span>
                <span class="cum-bar-track"><span class="cum-bar-fill" style="width:${(c.wins / maxWins) * 100}%;"></span></span>
                <span class="cum-wins">${c.wins}<em>회</em></span>
            </div>`;
        });
        html += `</div>
            </div>
            <div class="honors-tab-panel" data-panel="dated">
                <ul class="honors-timeline honors-timeline-song">`;
        MUSIC_SHOW_WINS.slice().reverse().forEach((w, i) => {
            html += `<li>
                <span class="ht-index">${String(i + 1).padStart(2, '0')}</span>
                <div class="ht-body">
                    <div class="ht-head">
                        <span class="ht-logo-wrap">${logoImg(w.logo, 22)}</span>
                        <span class="ht-program">${w.program}</span>
                        <span class="ht-divider">|</span>
                        <span class="ht-song-inline">${w.song}</span>
                        <span class="h-tag">${w.crown}</span>
                        <span class="ht-date">${w.date}</span>
                    </div>
                    <ul class="ht-notes">${w.notes.map(n => `<li>${n}</li>`).join('')}</ul>
                </div>
            </li>`;
        });
        html += `</ul>
            </div>
            <div class="honors-tab-panel" data-panel="ceremony">
                <ul class="honors-timeline">`;
        CEREMONY_AWARDS.slice().reverse().forEach((c, i) => {
            html += `<li>
                <span class="ht-index">${String(i + 1).padStart(2, '0')}</span>
                <div class="ht-body">
                    <div class="ht-head">${logoImg(c.logo, 24)}<span class="ht-program">${c.name}</span><span class="ht-date">${c.date}</span></div>
                    <div class="ht-song">${c.award}</div>
                    ${c.note ? `<ul class="ht-notes"><li>${c.note}</li></ul>` : ''}
                </div>
            </li>`;
        });
        html += '</ul></div></div>';
        body.innerHTML = html;
        bindHonorsTabs(body);
    }
    openGenericHistoryModal();
}

function openAdsHistoryModal() {
    const title = document.getElementById('honorsHistoryTitle');
    if (title) title.textContent = '광고 · 콜라보 · 화보 히스토리';
    const body = document.getElementById('awardsHistoryBody');
    if (body) {
        const categories = ['광고', '화보', '홍보대사', '콜라보'];
        const fmtDate = d => `${d.slice(0,4)}.${d.slice(5,7)}`;

        let html = `<div class="ads-banner"><img src="images/ad/ber.webp" alt="" onerror="this.parentElement.style.display='none'"></div>`;
        html += '<div class="honors-tabbar">';
        categories.forEach((cat, i) => {
            html += `<button class="honors-tab${i === 0 ? ' active' : ''}" data-target="cat${i}">${cat}</button>`;
        });
        html += '</div><div class="honors-tab-panels">';
        categories.forEach((cat, i) => {
            const items = AD_TIMELINE.filter(a => a.type === cat).slice().sort((a, b) => b.date.localeCompare(a.date));
            html += `<div class="honors-tab-panel${i === 0 ? ' active' : ''}" data-panel="cat${i}">
                <ul class="ad-timeline">`;
            items.forEach((a, idx) => {
                const titleParts = splitTrailingParen(a.title);
                const noteParts = splitTrailingParen(a.note);
                let notePart = '';
                let periodPart = '';
                if (noteParts.tag) {
                    notePart = noteParts.main;
                    periodPart = noteParts.tag;
                } else if (isPeriodLike(noteParts.main)) {
                    periodPart = noteParts.main;
                } else {
                    notePart = noteParts.main;
                }
                const side = idx % 2 === 0 ? 'side-left' : 'side-right';
                const thumbHtml = a.img ? `<div class="ad-tl-thumb"><img src="images/ad/${a.img}" alt="" onerror="this.parentElement.style.display='none'"></div>` : '';
                html += `<li class="ad-tl-item ${side}">
                    <div class="ad-tl-node"></div>
                    <div class="ad-tl-card${thumbHtml ? ' has-thumb' : ''}">
                        ${thumbHtml}
                        <div class="ad-tl-body">
                            <span class="ad-tl-date">${fmtDate(a.date)}</span>
                            <div class="ad-tl-title">${titleParts.main}${titleParts.tag ? `<span class="ad-tl-tag">${titleParts.tag}</span>` : ''}</div>
                            ${notePart ? `<div class="ad-tl-note">${notePart}</div>` : ''}
                            ${periodPart ? `<div class="ad-tl-period">${periodPart}</div>` : ''}
                        </div>
                    </div>
                </li>`;
            });
            html += '</ul></div>';
        });
        html += '</div>';
        body.innerHTML = html;
        bindHonorsTabs(body);
    }
    openGenericHistoryModal();
}

function openGenericHistoryModal() {
    const modal = document.getElementById('honorsHistoryModal');
    const backdrop = document.getElementById('honorsHistoryBackdrop');
    if (modal && backdrop) {
        modal.classList.add('active'); backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}
function closeHonorsHistoryModal() {
    const modal = document.getElementById('honorsHistoryModal');
    const backdrop = document.getElementById('honorsHistoryBackdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = 'auto';
}

window.addEventListener('DOMContentLoaded', () => {
    try { renderHonorsPreview(); } catch (e) { console.error(e); }
});
