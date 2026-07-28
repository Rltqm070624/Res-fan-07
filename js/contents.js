/* ==========================================================================
   ⭐️ RESCENE CONTENTS — 홈 미리보기 가로 스크롤 + 전체보기 모달 (검색/멤버 필터/그리드/인라인 재생)
   - 데이터는 js/contents_data.js 의 CONTENTS_DATA 배열 사용 (날짜 최신순 정렬됨)
   - 여기서는 화면에 그리는 로직만 담당
   ========================================================================== */
const CONTENTS_MEMBERS = ["원이", "리브", "미나미", "메이", "제나"];
let contentsActiveMember = "전체";
let contentsSearchTerm = "";

function ytThumb(vid) { return `https://img.youtube.com/vi/${vid}/hqdefault.jpg`; }

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function contentsCardHtml(item) {
    return `<div class="contents-card" onclick="openContentsPlayerByVid('${item.vid}')">
        <div class="contents-thumb">
            <img src="${ytThumb(item.vid)}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.closest('.contents-card').style.display='none'">
            <div class="cc-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
        </div>
        <div class="contents-meta">
            <div class="cc-title">${escapeHtml(item.title)}</div>
            <div class="cc-sub">${escapeHtml(item.channel)} · ${item.date}</div>
        </div>
    </div>`;
}

/* ---- 홈 화면 미리보기 (가로 스크롤, 최신 12개) ---- */
function renderContentsPreview() {
    const wrap = document.getElementById('contentsScroll');
    if (!wrap || typeof CONTENTS_DATA === 'undefined') return;
    let html = CONTENTS_DATA.slice(0, 12).map(contentsCardHtml).join('');
    html += `<a class="contents-card contents-more" href="javascript:void(0)" onclick="openContentsModal()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18l6-6-6-6"/></svg>
        <span>콘텐츠<br>전체보기</span>
    </a>`;
    wrap.innerHTML = html;
    if (typeof enableDragScroll === 'function') enableDragScroll(wrap);
}

/* ---- 전체보기 모달: 검색 + 멤버 필터 + 그리드 ---- */
function renderContentsFilters() {
    const row = document.getElementById('contentsFilterRow');
    if (!row) return;
    const all = ["전체"].concat(CONTENTS_MEMBERS);
    row.innerHTML = all.map(m =>
        `<button type="button" class="cf-chip${m === contentsActiveMember ? ' active' : ''}" onclick="setContentsMemberFilter('${m}')">${m}</button>`
    ).join('');
}

function setContentsMemberFilter(member) {
    contentsActiveMember = member;
    renderContentsFilters();
    renderContentsGrid();
}

function filterContents() {
    const input = document.getElementById('contentsSearch');
    contentsSearchTerm = (input ? input.value : '').trim().toLowerCase();
    renderContentsGrid();
}

function getFilteredContents() {
    if (typeof CONTENTS_DATA === 'undefined') return [];
    return CONTENTS_DATA.filter(item => {
        const matchesMember = contentsActiveMember === '전체' || item.cast === '전원' || item.cast.includes(contentsActiveMember);
        if (!matchesMember) return false;
        if (!contentsSearchTerm) return true;
        const hay = (item.title + ' ' + item.channel).toLowerCase();
        return hay.includes(contentsSearchTerm);
    });
}

function renderContentsGrid() {
    const grid = document.getElementById('contentsGrid');
    if (!grid) return;
    const list = getFilteredContents();
    grid.innerHTML = list.length
        ? list.map(contentsCardHtml).join('')
        : `<div class="contents-empty">검색 결과가 없어요.</div>`;
}

function openContentsModal() {
    const modal = document.getElementById('contentsModal');
    const backdrop = document.getElementById('contentsModalBackdrop');
    if (!modal || !backdrop) return;
    renderContentsFilters();
    renderContentsGrid();
    modal.classList.add('active');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeContentsModal() {
    const modal = document.getElementById('contentsModal');
    const backdrop = document.getElementById('contentsModalBackdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = 'auto';
    closeContentsPlayer();
}

/* ---- 인라인 플레이어 (그리드 위에 겹쳐서 재생, 뒤로가기로 그리드 복귀) ---- */
function openContentsPlayerByVid(vid) {
    if (typeof CONTENTS_DATA === 'undefined') return;
    const item = CONTENTS_DATA.find(i => i.vid === vid);
    if (!item) return;

    // 홈 미리보기에서 바로 클릭한 경우 모달을 먼저 열어줌
    const modal = document.getElementById('contentsModal');
    if (modal && !modal.classList.contains('active')) openContentsModal();

    const media = document.getElementById('contentsPlayerMedia');
    const title = document.getElementById('contentsPlayerTitle');
    const meta = document.getElementById('contentsPlayerMeta');
    if (media) media.innerHTML = `<iframe src="https://www.youtube.com/embed/${item.vid}?autoplay=1" title="${escapeHtml(item.title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    if (title) title.textContent = item.title;
    if (meta) meta.textContent = `${item.channel} · ${item.date} · 출연: ${item.cast}`;

    const player = document.getElementById('contentsPlayer');
    if (player) player.classList.add('show');
}

function closeContentsPlayer() {
    const player = document.getElementById('contentsPlayer');
    const media = document.getElementById('contentsPlayerMedia');
    if (player) player.classList.remove('show');
    if (media) media.innerHTML = ''; // iframe 제거 = 재생 정지
}

window.addEventListener('DOMContentLoaded', () => {
    try { renderContentsPreview(); } catch (e) { console.error('renderContentsPreview 실패:', e); }
});
