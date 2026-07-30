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
            const cover = findAlbumCover(w.song);
            const thumb = cover
                ? `<img src="images/${cover}" alt="" class="h-thumb" onerror="this.parentElement.innerHTML=''">`
                : logoImg(w.logo, 26);
            return `
            <li>
                <span class="h-rank">0${i + 1}</span>
                <div class="h-thumb-wrap">${thumb}</div>
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
                <div class="h-thumb-wrap"><span class="h-type-tile" style="background:${AD_TYPE_COLOR[a.type]};">${a.type.charAt(0)}</span></div>
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
                <p class="honors-panel-subtitle">음악방송별 누적 1위 횟수</p>
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
                <p class="honors-panel-subtitle">날짜별 1위 히스토리 (총 3관왕)</p>
                <ul class="honors-timeline">`;
        MUSIC_SHOW_WINS.slice().reverse().forEach((w, i) => {
            html += `<li>
                <span class="ht-index">${String(i + 1).padStart(2, '0')}</span>
                <div class="ht-body">
                    <div class="ht-head">${logoImg(w.logo, 24)}<span class="ht-program">${w.program}</span><span class="h-tag">${w.crown}</span><span class="ht-date">${w.date}</span></div>
                    <div class="ht-song">${w.song}</div>
                    <ul class="ht-notes">${w.notes.map(n => `<li>${n}</li>`).join('')}</ul>
                </div>
            </li>`;
        });
        html += `</ul>
            </div>
            <div class="honors-tab-panel" data-panel="ceremony">
                <p class="honors-panel-subtitle">시상식 수상 내역</p>
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
        const categories = ['홍보대사', '화보', '콜라보', '광고'];
        const fmtDate = d => `${d.slice(0,4)}.${d.slice(5,7)}`;

        let html = '<div class="honors-tabbar">';
        categories.forEach((cat, i) => {
            html += `<button class="honors-tab${i === 0 ? ' active' : ''}" data-target="cat${i}">${cat}</button>`;
        });
        html += '</div><div class="honors-tab-panels">';
        categories.forEach((cat, i) => {
            const items = AD_TIMELINE.filter(a => a.type === cat).slice().sort((a, b) => b.date.localeCompare(a.date));
            html += `<div class="honors-tab-panel${i === 0 ? ' active' : ''}" data-panel="cat${i}">
                <p class="honors-panel-subtitle">${cat} 히스토리 (총 ${items.length}건)</p>
                <div class="ad-row-list">`;
            items.forEach(a => {
                html += `<div class="ad-row">
                    <span class="ad-row-date">${fmtDate(a.date)}</span>
                    <span class="ad-row-main">
                        <span class="ad-row-title">${a.title}</span>
                        ${a.note ? `<span class="ad-row-note">${a.note}</span>` : ''}
                    </span>
                </div>`;
            });
            html += '</div></div>';
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
