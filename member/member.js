let memberActiveKey = 'woni';
let memberActiveEra = null; /* 카드 홀더는 기본적으로 빈 상태 — 클릭해서 골라야 채워짐 */

function renderMemberSelector() {
    const row = document.getElementById('memberSelectorRow');
    if (!row) return;
    row.innerHTML = MEMBER_DATA.map(m => `
        <button type="button" class="mem-chip${m.key === memberActiveKey ? ' active' : ''}" style="--mem-color:${m.color};" onclick="setActiveMember('${m.key}')">
            <span class="mem-chip-name">${m.nameKo}</span>
        </button>`).join('');
}

function setActiveMember(key) {
    if (key === memberActiveKey) return;
    memberActiveKey = key;
    memberActiveEra = null;
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

    document.getElementById('memberPageTitleKo').textContent = m.nameKo;
    document.getElementById('memberPageTitleEn').textContent = m.nameEn;
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
    const emptyState = document.getElementById('memberCardEmpty');
    const slotState = document.getElementById('memberCardSlot');
    const era = memberActiveEra ? MEMBER_ERAS.find(x => x.key === memberActiveEra) : null;

    /* 카드를 아직 고르지 않았으면 홀더를 빈 상태로 유지 (기본값) */
    if (!m || !era) {
        if (emptyState) emptyState.style.display = 'flex';
        if (slotState) slotState.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (slotState) slotState.style.display = 'flex';

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

function openEraModal() {
    if (!memberActiveEra) return; /* 빈 홀더 상태에서는 확대할 이미지가 없음 */
    const previewImg = document.getElementById('memberEraPreviewImg');
    const previewLabel = document.getElementById('memberEraPreviewLabel');
    const modalImg = document.getElementById('memEraModalImg');
    const modalLabel = document.getElementById('memEraModalLabel');
    const modal = document.getElementById('memEraModal');
    const backdrop = document.getElementById('memEraModalBackdrop');
    if (!previewImg || !modal) return;
    if (modalImg) modalImg.src = previewImg.src;
    if (modalLabel) modalLabel.textContent = previewLabel ? previewLabel.textContent : '';
    modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeEraModal() {
    const modal = document.getElementById('memEraModal');
    const backdrop = document.getElementById('memEraModalBackdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
}

window.addEventListener('DOMContentLoaded', () => {
    renderMemberSelector();
    renderMemberDetail();
});
