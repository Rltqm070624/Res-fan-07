function logoImg(key, size) {
    size = size || 22;
    const file = AWARDS_LOGOS[key];
    if (!file) return '';
    return `<img src="${AWARDS_LOGO_PATH}${file}" alt="" class="honors-logo" style="height:${size}px;" onerror="this.style.display='none'">`;
}

function renderHonorsPreview() {
    const list = document.getElementById('awardsPreviewList');
    if (list) {
        list.innerHTML = MUSIC_SHOW_WINS.slice(-3).reverse().map((w, i) => `
            <li>
                <span class="h-rank">0${i + 1}</span>
                <div class="h-info">
                    ${logoImg(w.logo, 20)}
                    <span class="h-name">${w.program} · ${w.song}</span>
                    <span class="h-badge">🏆 ${w.notes[0].split(' (')[0]}</span>
                </div>
                <span class="h-date">${w.date}</span>
            </li>`).join('');
    }
    
    const adsWrap = document.getElementById('adsPreviewChips');
    if (adsWrap) {
        const latestAds = AD_TIMELINE.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
        adsWrap.innerHTML = latestAds.map((a, i) => `
            <li>
                <span class="h-rank">0${i + 1}</span>
                <div class="h-info">
                    <span class="h-name">[${a.type}] ${a.title}</span>
                    ${a.note ? `<span class="h-note">- ${a.note.split(' (')[0]}</span>` : ''}
                </div>
                <span class="h-date">${a.date}</span>
            </li>`).join('');
    }
}

function openAwardsHistoryModal() {
    const body = document.getElementById('awardsHistoryBody');
    if (body) {
        let html = '<div class="honors-modal-block"><h4>날짜별 1위 히스토리 (총 3관왕)</h4><ul class="honors-timeline">';
        MUSIC_SHOW_WINS.slice().reverse().forEach(w => {
            html += `<li>
                <div class="ht-dot"></div>
                <div class="ht-body">
                    <div class="ht-head">${logoImg(w.logo, 24)}<span class="ht-program">${w.program}</span><span class="h-tag">${w.crown}</span><span class="ht-date">${w.date}</span></div>
                    <div class="ht-song">${w.song}</div>
                    <ul class="ht-notes">${w.notes.map(n => `<li>${n}</li>`).join('')}</ul>
                </div>
            </li>`;
        });
        html += '</ul></div>';

        html += '<div class="honors-modal-block"><h4>프로그램별 누적 1위</h4><div class="honors-cum-grid">';
        MUSIC_SHOW_CUMULATIVE.forEach(c => {
            html += `<div class="cum-card">${logoImg(c.logo, 26)}<span class="cum-program">${c.program}</span><span class="cum-wins">${c.wins}<em>회</em></span></div>`;
        });
        html += '</div></div>';

        html += '<div class="honors-modal-block"><h4>시상식</h4><ul class="honors-timeline">';
        CEREMONY_AWARDS.slice().reverse().forEach(c => {
            html += `<li>
                <div class="ht-dot"></div>
                <div class="ht-body">
                    <div class="ht-head">${logoImg(c.logo, 24)}<span class="ht-program">${c.name}</span><span class="ht-date">${c.date}</span></div>
                    <div class="ht-song">${c.award}</div>
                    ${c.note ? `<ul class="ht-notes"><li>${c.note}</li></ul>` : ''}
                </div>
            </li>`;
        });
        html += '</ul></div>';
        body.innerHTML = html;
    }
    openGenericHistoryModal();
}

function openAdsHistoryModal() {
    const body = document.getElementById('awardsHistoryBody');
    if (body) {
        const typeColor = { '홍보대사': '#9AA6FF', '화보': '#ec407a', '콜라보': '#26c6da', '광고': '#66bb6a' };
        let html = '<div class="honors-modal-block"><h4>광고 · 콜라보 · 화보 · 홍보대사</h4><ul class="honors-timeline ad-timeline">';
        AD_TIMELINE.slice().sort((a, b) => b.date.localeCompare(a.date)).forEach(a => {
            html += `<li>
                <div class="ht-dot" style="background:${typeColor[a.type]};"></div>
                <div class="ht-body">
                    <div class="ht-head"><span class="ad-type-badge" style="background:${typeColor[a.type]}26; color:${typeColor[a.type]};">${a.type}</span><span class="ht-date">${a.date.slice(0,4)}년${a.date.slice(5,7) !== '01' ? ' ' + parseInt(a.date.slice(5,7)) + '월' : ''}</span></div>
                    <div class="ht-song">${a.title}</div>
                    ${a.note ? `<ul class="ht-notes"><li>${a.note}</li></ul>` : ''}
                </div>
            </li>`;
        });
        html += '</ul></div>';
        body.innerHTML = html;
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
