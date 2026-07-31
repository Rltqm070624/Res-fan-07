let memberActiveKey = 'woni';
let memberActiveEra = 'prettygirl'; /* 기본으로 최신 포토를 히어로에 표시 */

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
    memberActiveEra = 'prettygirl';
    renderMemberSelector();
    renderMemberDetail();
}

function renderMemberDetail() {
    const m = MEMBER_DATA.find(x => x.key === memberActiveKey);
    if (!m) return;

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

/* 포토 아카이브에서 고른 이미지를 메인 히어로 자리에 바로 반영 */
function updateEraPreview() {
    const m = MEMBER_DATA.find(x => x.key === memberActiveKey);
    const era = MEMBER_ERAS.find(x => x.key === memberActiveEra) || MEMBER_ERAS[MEMBER_ERAS.length - 1];
    if (!m || !era) return;

    const heroImg = document.getElementById('memberHeroImg');
    const previewLabel = document.getElementById('memberEraPreviewLabel');
    if (heroImg) {
        heroImg.classList.add('is-switching');
        const nextSrc = `../images/profile/${m.key}/${era.key}.webp`;
        heroImg.onerror = function () { this.onerror = null; this.src = `../images/profile/${m.key}/debut.webp`; };
        setTimeout(() => {
            heroImg.src = nextSrc;
            heroImg.classList.remove('is-switching');
        }, 120);
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
    const heroImg = document.getElementById('memberHeroImg');
    const previewLabel = document.getElementById('memberEraPreviewLabel');
    const modalImg = document.getElementById('memEraModalImg');
    const modalLabel = document.getElementById('memEraModalLabel');
    const modal = document.getElementById('memEraModal');
    const backdrop = document.getElementById('memEraModalBackdrop');
    if (!heroImg || !modal) return;
    if (modalImg) modalImg.src = heroImg.src;
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
