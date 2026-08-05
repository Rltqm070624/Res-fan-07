function fcRenderLyrics(text) {
    return escapeHtml(text)
        .split('\n')
        .map(line => line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'))
        .join('<br>');
}

let fcActiveIndex = -1;

function renderFcList() {
    const wrap = document.getElementById('fcSongList');
    if (!wrap || typeof FANCHANT_DATA === 'undefined') return;

    if (!FANCHANT_DATA.length) {
        const t1 = window.t ? window.t('fanchantEmptyTitle') : '아직 등록된 응원법이 없어요.';
        const t2 = window.t ? window.t('fanchantEmptySub') : '준비되는 대로 곡별 응원법을 채워넣을 예정이에요!';
        wrap.innerHTML = `<div class="fc-empty-list">
            <div class="ico">🎤</div>
            <p>${t1}<br>${t2}</p>
        </div>`;
        return;
    }

    const groups = {};
    FANCHANT_DATA.forEach((s, i) => {
        const key = s.album || '기타';
        if (!groups[key]) groups[key] = [];
        groups[key].push({ ...s, _index: i });
    });

    let html = '';
    Object.keys(groups).forEach(album => {
        html += `<div class="fc-album-group">
            <div class="fc-album-title">${escapeHtml(album)}</div>
            <ul class="fc-song-items">`;
        groups[album].forEach(s => {
            html += `<li class="fc-song-item" data-index="${s._index}" onclick="showFcSong(${s._index})">${escapeHtml(s.song)}</li>`;
        });
        html += `</ul></div>`;
    });
    wrap.innerHTML = html;
}

function showFcSong(index) {
    const s = FANCHANT_DATA[index];
    if (!s) return;
    fcActiveIndex = index;

    document.querySelectorAll('.fc-song-item').forEach(el => {
        el.classList.toggle('active', Number(el.dataset.index) === index);
    });

    document.getElementById('fcEmpty').style.display = 'none';
    document.getElementById('fcDetailBody').style.display = 'flex';
    document.getElementById('fcAlbum').textContent = s.album || '';
    document.getElementById('fcSong').textContent = s.song || '';

    const videoWrap = document.getElementById('fcVideoWrap');
    if (s.vid) {
        videoWrap.style.display = '';
        videoWrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${s.vid}" title="${escapeHtml(s.song)} 응원법" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else {
        videoWrap.style.display = 'none';
        videoWrap.innerHTML = '';
    }

    const photo = document.getElementById('fcPhoto');
    if (s.image) { photo.src = s.image; photo.style.display = ''; photo.onerror = function () { this.style.display = 'none'; }; }
    else { photo.style.display = 'none'; }

    document.getElementById('fcLyrics').innerHTML = fcRenderLyrics(s.lyrics || '');
}

window.addEventListener('DOMContentLoaded', () => {
    try {
        renderFcList();
        if (typeof FANCHANT_DATA !== 'undefined' && FANCHANT_DATA.length) showFcSong(0);
    } catch (e) { console.error('응원법 렌더링 실패:', e); }
});
