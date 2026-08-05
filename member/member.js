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
    memberActiveEra = 'prettygirl'; // 멤버가 바뀔 때마다 최신 활동 사진으로 리셋
    renderMemberSelector();
    renderMemberDetail();
}

function renderMemberDetail() {
    const m = MEMBER_DATA.find(x => x.key === memberActiveKey);
    if (!m) return;

    const signImg = document.getElementById('memberSign');
    if (signImg) { 
        signImg.src = `../images/profile/${m.key}/sign.svg`; 
        signImg.style.display = ''; 
        signImg.onerror = function () { this.style.display = 'none'; }; 
    }

    document.getElementById('memberPageTitleKo').textContent = m.nameKo;
    document.getElementById('memberPageTitleEn').textContent = m.nameEn;
    document.getElementById('memberBday').textContent = m.birthday;

    const bdayBadge = document.getElementById('memberBdayBadge');
    if (bdayBadge) {
        const now = new Date();
        const mmdd = `${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
        bdayBadge.style.display = m.birthday.endsWith(mmdd) ? '' : 'none';
    }
    document.getElementById('memberPosition').textContent = m.position;
    document.getElementById('memberMbti').textContent = m.mbti;
    document.getElementById('memberSpecialty').textContent = m.nickname;
    document.getElementById('memberHobby').textContent = m.sns;

    // 멤버 고유 색상 CSS 변수 주입
    const panel = document.querySelector('.mem-detail-panel');
    if (panel) panel.style.setProperty('--mem-active-color', m.color);

    // 포토 아카이브 렌더링 — ⭐️ 왼쪽이 가장 최신 이미지가 오도록 최신순으로 뒤집어서 렌더링
    const eraRow = document.getElementById('memberEraRow');
    if (eraRow) {
        eraRow.innerHTML = MEMBER_ERAS.slice().reverse().map(e => `
            <div class="mem-era-item${e.key === memberActiveEra ? ' active' : ''}" data-era="${e.key}" onclick="setActiveEra('${e.key}')">
                <div class="mem-era-thumb"><img src="../images/profile/${m.key}/${e.key}.webp" alt="${e.label}" loading="lazy" onerror="this.closest('.mem-era-item').style.display='none'"></div>
                <span class="mem-era-label">${e.label}</span>
            </div>`).join('');
    }

    updateEraPreview();
}

/* 포토 아카이브에서 고른 이미지를 메인 히어로 자리에 자연스럽게 반영 */
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
        
        // 부드러운 페이드 인/아웃 효과
        setTimeout(() => {
            heroImg.src = nextSrc;
            heroImg.classList.remove('is-switching');
        }, 150);
    }
    // ⭐️ 메인 이미지 위 곡명 캡션은 표시하지 않음 (요청에 따라 제거)
}

function setActiveEra(eraKey) {
    memberActiveEra = eraKey;
    document.querySelectorAll('.mem-era-item').forEach(el => {
        el.classList.toggle('active', el.dataset.era === eraKey);
        
        // 선택된 아이템이 화면에 잘 보이도록 자동 스크롤 (가로 스크롤 대응)
        if (el.dataset.era === eraKey) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    });
    updateEraPreview();
}

/* 이미지 클릭 시 확대 모달 */
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

// ⭐️ 마우스 휠로 가로 스크롤 가능하게 해주는 UX 스크립트 (PC 사용자용)
function initHorizontalScroll() {
    const eraRail = document.getElementById('memberEraRow');
    if (eraRail) {
        eraRail.addEventListener('wheel', (e) => {
            // 위아래 휠 스크롤을 가로 스크롤로 변환
            if (e.deltaY !== 0) {
                e.preventDefault();
                eraRail.scrollLeft += e.deltaY * 2; // 스크롤 속도 조절
            }
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    renderMemberSelector();
    renderMemberDetail();
    initHorizontalScroll();
});
