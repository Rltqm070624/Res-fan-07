/* ==========================================================================
   ⭐️ MEMBERS 페이지 — 멤버 선택 + 프로필 히어로 + 정보 카드 + 포토 아카이브(연도별 화보)
   - MEMBER_DATA / MEMBER_ERAS 는 js/member_data.js 에 정의됨
   ========================================================================== */
let memberActiveKey = 'woni';
let memberActiveEra = 'prettygirl';

function renderMemberSelector() {
    const row = document.getElementById('memberSelectorRow');
    if (!row) return;
    row.innerHTML = MEMBER_DATA.map(m => `
        <button type="button" class="mem-chip${m.key === memberActiveKey ? ' active' : ''}" style="--mem-color:${m.color};" onclick="setActiveMember('${m.key}')">
            <span class="mem-chip-photo"><img src="../images/profile/${m.key}/debut.webp" alt="${m.nameKo}" loading="lazy" onerror="this.style.display='none'"></span>
            <span class="mem-chip-name">${m.nameKo}</span>
        </button>`).join('');
}

function setActiveMember(key) {
    if (key === memberActiveKey) return;
    memberActiveKey = key;
    memberActiveEra = 'prettygirl';
    renderMemberSelector();
    renderMemberDetail();
}

function renderMemberDetail() {
    const m = MEMBER_DATA.find(x => x.key === memberActiveKey);
    if (!m) return;

    const heroImg = document.getElementById('memberHeroImg');
    if (heroImg) {
        heroImg.src = `../images/profile/${m.key}/prettygirl.webp`;
        heroImg.onerror = function () { this.onerror = null; this.src = `../images/profile/${m.key}/debut.webp`; };
    }
    const signImg = document.getElementById('memberSign');
    if (signImg) { signImg.src = `../images/profile/${m.key}/sign.svg`; signImg.style.display = ''; signImg.onerror = function () { this.style.display = 'none'; }; }

    document.getElementById('memberNameKo').textContent = m.nameKo;
    document.getElementById('memberNameEn').textContent = m.nameEn;
    document.getElementById('memberIntro').textContent = m.intro;
    document.getElementById('memberBday').textContent = m.birthday;
    document.getElementById('memberPosition').textContent = m.position;
    document.getElementById('memberMbti').textContent = m.mbti;
    document.getElementById('memberSpecialty').textContent = m.specialty;
    document.getElementById('memberHobby').textContent = m.hobby;

    const panel = document.querySelector('.mem-detail-panel');
    if (panel) panel.style.setProperty('--mem-active-color', m.color);

    const eraRow = document.getElementById('memberEraRow');
    if (eraRow) {
        eraRow.innerHTML = MEMBER_ERAS.map(e => `
            <div class="mem-era-item${e.key === memberActiveEra ? ' active' : ''}" data-era="${e.key}" onclick="setActiveEra('${e.key}')">
                <div class="mem-era-thumb"><img src="../images/profile/${m.key}/${e.key}.webp" alt="${e.label}" loading="lazy" onerror="this.closest('.mem-era-item').style.display='none'"></div>
                <span class="mem-era-label">${e.label}</span>
            </div>`).join('');
    }

    updateEraPreview();
}

function updateEraPreview() {
    const m = MEMBER_DATA.find(x => x.key === memberActiveKey);
    const era = MEMBER_ERAS.find(x => x.key === memberActiveEra);
    if (!m || !era) return;
    const previewImg = document.getElementById('memberEraPreviewImg');
    const previewLabel = document.getElementById('memberEraPreviewLabel');
    if (previewImg) {
        previewImg.onerror = function () { this.onerror = null; this.src = `../images/profile/${m.key}/debut.webp`; };
        previewImg.src = `../images/profile/${m.key}/${era.key}.webp`;
    }
    if (previewLabel) previewLabel.textContent = era.label;
}

function setActiveEra(eraKey) {
    memberActiveEra = eraKey;
    document.querySelectorAll('.mem-era-item').forEach(el => {
        el.classList.toggle('active', el.dataset.era === eraKey);
    });
    updateEraPreview();
}

window.addEventListener('DOMContentLoaded', () => {
    renderMemberSelector();
    renderMemberDetail();
});
