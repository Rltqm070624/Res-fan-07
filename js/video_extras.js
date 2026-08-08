const VE_ORDER_LABEL = { relevance: '추천순', time: '최신순' };

function veEscape(str) {
    return String(str || '').replace(/[&<>'"]/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[m]));
}

function veWatchUrl(vid) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(vid)}`;
}

const veCommentState = {};
const veCommentTotalCache = {};

function veGetCommentOrder(panelId) {
    return (veCommentState[panelId] && veCommentState[panelId].order) || 'relevance';
}

function veResetComments(panelId) {
    if (veCommentState[panelId]) veCommentState[panelId].vid = null;
}

// commentThreads API는 한 번에 최대 50개까지만 내려주기 때문에,
// 유튜브 페이지와 동일한 "총 댓글 수"는 videos.statistics.commentCount에서 별도로 가져와야 한다.
async function veGetCommentTotal(vid) {
    if (vid in veCommentTotalCache) return veCommentTotalCache[vid];
    if (typeof YOUTUBE_API_KEY === 'undefined' || !YOUTUBE_API_KEY) return null;
    try {
        const url = `https://www.googleapis.com/youtube/v3/videos`
            + `?part=statistics&id=${encodeURIComponent(vid)}&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        const item = (data.items || [])[0];
        const raw = item && item.statistics && item.statistics.commentCount;
        veCommentTotalCache[vid] = (raw !== undefined && raw !== null) ? parseInt(raw, 10) : null;
    } catch (e) {
        veCommentTotalCache[vid] = null;
    }
    return veCommentTotalCache[vid];
}

function veCommentSortBarHtml(panelId, onChange) {
    const cur = veGetCommentOrder(panelId);
    return `<div class="ve-comment-sortbar" role="group" aria-label="댓글 정렬">
        ${['relevance', 'time'].map(o => `
            <button type="button" class="ve-sort-btn${cur === o ? ' active' : ''}"
                    data-order="${o}" onclick="${onChange}('${o}')">${VE_ORDER_LABEL[o]}</button>
        `).join('')}
    </div>`;
}

function veUpdateSortBar(barEl, order) {
    if (!barEl) return;
    barEl.querySelectorAll('.ve-sort-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.order === order);
    });
}

// 댓글은 처음엔 로딩 지연 없이 한 페이지(50개)만 빠르게 불러오고,
// 목록을 스크롤해서 바닥에 가까워지면 nextPageToken으로 다음 페이지를 이어서 불러온다.
const VE_COMMENT_PAGE_SIZE = 50;

function veCommentUrl(vid, order, pageToken) {
    return `https://www.googleapis.com/youtube/v3/commentThreads`
        + `?part=snippet&videoId=${encodeURIComponent(vid)}`
        + `&maxResults=${VE_COMMENT_PAGE_SIZE}&order=${order}&textFormat=plainText&key=${YOUTUBE_API_KEY}`
        + (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '');
}

function veCommentItemHtml(c) {
    return `
        <div class="sh-comment-item">
            <img class="sh-comment-avatar" src="${veEscape(c.authorProfileImageUrl)}" alt="" loading="lazy">
            <div class="sh-comment-body">
                <span class="sh-comment-author">${veEscape(c.authorDisplayName)}</span>
                <div class="sh-comment-bubble">${veEscape(c.textOriginal || c.textDisplay)}</div>
                <div class="sh-comment-meta">
                    <span class="sh-comment-like">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 21h4V9H2v12zm19-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L12.17 1 6.59 6.59C6.22 6.95 6 7.45 6 8v11c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
                        ${c.likeCount || 0}
                    </span>
                    <span class="ve-comment-date">${veFormatDate(c.publishedAt)}</span>
                </div>
            </div>
        </div>`;
}

// 목록 아래쪽으로 스크롤하면 다음 페이지를 이어서 불러온다.
function veAttachCommentScroll(listEl, listId) {
    if (listEl.dataset.veScrollBound === '1') return;
    listEl.dataset.veScrollBound = '1';
    listEl.addEventListener('scroll', () => {
        const nearBottom = listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - 120;
        if (nearBottom) veLoadMoreComments(listId);
    });
}

async function veLoadMoreComments(listId) {
    const state = veCommentState[listId];
    const listEl = document.getElementById(listId);
    if (!state || !listEl || !state.vid) return;
    if (state.loadingMore || state.exhausted || !state.nextPageToken) return;
    if (typeof YOUTUBE_API_KEY === 'undefined' || !YOUTUBE_API_KEY) return;

    state.loadingMore = true;
    const moreEl = document.createElement('div');
    moreEl.className = 'sh-comment-loading sh-comment-loading-more';
    moreEl.textContent = '댓글 더 불러오는 중...';
    listEl.appendChild(moreEl);

    try {
        const res = await fetch(veCommentUrl(state.vid, state.order, state.nextPageToken));
        const data = await res.json();

        const now = veCommentState[listId];
        const stillCurrent = now && now.vid === state.vid && now.order === state.order;
        if (moreEl.parentNode) moreEl.parentNode.removeChild(moreEl);
        if (!stillCurrent) return;

        if (!res.ok) { state.exhausted = true; return; }

        const items = (data.items || []).map(it => it.snippet.topLevelComment.snippet);
        items.forEach(c => listEl.insertAdjacentHTML('beforeend', veCommentItemHtml(c)));

        state.nextPageToken = data.nextPageToken || null;
        if (!state.nextPageToken) state.exhausted = true;
    } catch (e) {
        if (moreEl.parentNode) moreEl.parentNode.removeChild(moreEl);
        state.exhausted = true;
    } finally {
        state.loadingMore = false;
    }
}

async function veLoadComments(opts) {
    const { vid, listId, onCount } = opts;
    const order = opts.order || 'relevance';
    const listEl = document.getElementById(listId);
    if (!listEl || !vid) return;

    const prev = veCommentState[listId];
    if (!opts.force && prev && prev.vid === vid && prev.order === order) return;
    veCommentState[listId] = { vid, order, nextPageToken: null, loadingMore: false, exhausted: false };

    const setCount = (val) => { if (typeof onCount === 'function') onCount(val); };
    const openLink = `<a href="${veWatchUrl(vid)}" target="_blank" rel="noopener">유튜브에서 보기 →</a>`;

    if (typeof YOUTUBE_API_KEY === 'undefined' || !YOUTUBE_API_KEY) {
        listEl.innerHTML = `<div class="sh-comment-error">아직 댓글창 연동이 준비 중이에요.<br>${openLink}</div>`;
        setCount('');
        return;
    }

    listEl.innerHTML = `<div class="sh-comment-loading">댓글 불러오는 중...</div>`;
    setCount('');

    // 배지에는 (commentThreads 응답 개수가 아니라) 유튜브 페이지와 같은 실제 총 댓글 수를 표시.
    veGetCommentTotal(vid).then(total => {
        const now = veCommentState[listId];
        if (!now || now.vid !== vid) return;
        if (total != null) setCount(total);
    });

    try {
        const res = await fetch(veCommentUrl(vid, order));
        const data = await res.json();

        const now = veCommentState[listId];
        if (!now || now.vid !== vid || now.order !== order) return;

        if (!res.ok) {
            const reason = data && data.error && data.error.errors && data.error.errors[0] && data.error.errors[0].reason;
            let msg = '댓글을 불러오지 못했어요.';
            if (reason === 'commentsDisabled') msg = '이 영상은 댓글 기능이 꺼져 있어요.';
            else if (reason === 'quotaExceeded') msg = '오늘 댓글 조회 가능 횟수를 다 썼어요. 내일 다시 시도해주세요.';
            listEl.innerHTML = `<div class="sh-comment-error">${veEscape(msg)}<br>${openLink}</div>`;
            return;
        }

        const items = (data.items || []).map(it => it.snippet.topLevelComment.snippet);
        now.nextPageToken = data.nextPageToken || null;
        if (!now.nextPageToken) now.exhausted = true;

        if (!items.length) {
            listEl.innerHTML = `<div class="sh-comment-empty">아직 댓글이 없어요.</div>`;
            setCount(0);
            return;
        }

        listEl.innerHTML = items.map(veCommentItemHtml).join('');
        listEl.scrollTop = 0;
        veAttachCommentScroll(listEl, listId);
    } catch (e) {
        listEl.innerHTML = `<div class="sh-comment-error">댓글을 불러오는 중 오류가 났어요.<br>${openLink}</div>`;
    }
}

function veFormatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

const VE_SHARE_ICONS = [
    { key: 'kakao',     label: '카카오톡',   img: 'images/kakaotalk.png' },
    { key: 'x',         label: 'X',          img: 'images/x.png' },
    { key: 'instagram', label: 'Instagram',  img: 'images/instagram.png' }
];

function veActionBarHtml(vid, title) {
    const root = (typeof SITE_ROOT !== 'undefined' ? SITE_ROOT : '');
    const safeTitle = veEscape(title || '');
    const shareBtns = VE_SHARE_ICONS.map(s => `
        <button type="button" class="ve-share-btn" data-share="${s.key}"
                onclick="veShare('${s.key}', '${veEscape(vid)}', this)"
                aria-label="${s.label}로 공유" title="${s.label}로 공유">
            <img src="${root}${s.img}" alt="${s.label}" onerror="this.style.visibility='hidden'">
        </button>`).join('');

    return `
    <a class="ve-action-btn ve-origin-btn" href="${veWatchUrl(vid)}" target="_blank" rel="noopener" title="${safeTitle}">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.9 4.8 12 4.8 12 4.8s-5.9 0-7.6.4a2.8 2.8 0 0 0-2 2C2 8.9 2 12 2 12s0 3.1.4 4.8a2.8 2.8 0 0 0 2 2c1.7.4 7.6.4 7.6.4s5.9 0 7.6-.4a2.8 2.8 0 0 0 2-2C22 15.1 22 12 22 12s0-3.1-.4-4.8zM10.1 15.1V8.9l5.2 3.1-5.2 3.1z"/></svg>
        <span>원본 영상 보기</span>
    </a>
    <div class="ve-share-group">
        <span class="ve-share-label">공유</span>
        ${shareBtns}
        <button type="button" class="ve-share-btn ve-copy-btn" onclick="veShare('copy', '${veEscape(vid)}', this)" aria-label="링크 복사" title="링크 복사">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"></path><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"></path></svg>
        </button>
    </div>`;
}

function veRenderActionBar(containerId, vid, title) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = veActionBarHtml(vid, title);
}

function veToast(msg) {
    let el = document.getElementById('veToast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'veToast';
        el.className = 've-toast';
        document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(veToast._t);
    veToast._t = setTimeout(() => el.classList.remove('show'), 1900);
}

function veCopyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); resolve(); } catch (e) { reject(e); }
        document.body.removeChild(ta);
    });
}

function veShare(kind, vid, btnEl) {
    const url = veWatchUrl(vid);
    const title = (btnEl && btnEl.closest('.ve-action-bar')
        && btnEl.closest('.ve-action-bar').dataset.title) || 'RESCENE';

    if (kind === 'x') {
        const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        window.open(intent, '_blank', 'noopener,width=600,height=520');
        return;
    }

    if (kind === 'copy') {
        veCopyText(url).then(() => veToast('링크를 복사했어요.')).catch(() => veToast('복사에 실패했어요.'));
        return;
    }

    if (navigator.share) {
        navigator.share({ title, url }).catch(() => {  });
        return;
    }
    const nameMap = { kakao: '카카오톡', instagram: '인스타그램' };
    veCopyText(url)
        .then(() => veToast(`링크를 복사했어요. ${nameMap[kind] || ''}에 붙여넣어 주세요.`))
        .catch(() => veToast('복사에 실패했어요.'));
}

const veLiveCache = {};
const veLiveStatusCache = {}; // vid -> 'live' | 'ended' | 'none'

// 유튜브는 "진행 중인 라이브 채팅"과 "끝난 라이브의 채팅 다시보기"를 서로 다른 엔드포인트로 제공한다.
// 지금까지는 항상 live_chat(진행 중 전용)만 써서, 끝난 라이브/최초공개 영상에서
// "채팅을 사용할 수 없는 실시간 스트림입니다" 오류가 났었다. 종료된 영상은 live_chat_replay를 써야 한다.
function veLiveChatUrl(vid, status) {
    const path = status === 'live' ? 'live_chat' : 'live_chat_replay';
    return `https://www.youtube.com/${path}?v=${encodeURIComponent(vid)}&embed_domain=${encodeURIComponent(location.hostname)}`;
}

async function veGetLiveStatus(vid) {
    if (vid in veLiveStatusCache) return veLiveStatusCache[vid];
    if (typeof YOUTUBE_API_KEY === 'undefined' || !YOUTUBE_API_KEY) {
        veLiveStatusCache[vid] = 'none';
        return veLiveStatusCache[vid];
    }
    try {
        const url = `https://www.googleapis.com/youtube/v3/videos`
            + `?part=liveStreamingDetails&id=${encodeURIComponent(vid)}&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        const item = (data.items || [])[0];
        const details = item && item.liveStreamingDetails;
        if (!details) {
            veLiveStatusCache[vid] = 'none'; // 라이브/최초공개였던 적 없는 일반 영상
        } else if (details.activeLiveChatId) {
            veLiveStatusCache[vid] = 'live'; // 지금 진행 중이거나 곧 시작할 라이브
        } else {
            veLiveStatusCache[vid] = 'ended'; // 라이브 또는 최초공개였지만 이미 끝남 → 채팅 다시보기 대상
        }
    } catch (e) {
        veLiveStatusCache[vid] = 'none';
    }
    return veLiveStatusCache[vid];
}

// 채팅 탭을 보여줄지 말지 결정할 때 쓰는 하위 호환 함수 (라이브였던 적이 있으면 true)
async function veCheckLive(vid, fallbackIsLive) {
    if (vid in veLiveCache) return veLiveCache[vid];
    const status = await veGetLiveStatus(vid);
    veLiveCache[vid] = (status !== 'none') || !!fallbackIsLive;
    return veLiveCache[vid];
}

async function veRenderLiveChat(containerId, vid) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `<div class="sh-comment-loading">채팅 불러오는 중...</div>`;

    const status = await veGetLiveStatus(vid);
    // 화면이 바뀌었으면(다른 영상/탭 전환) 중단
    if (!el.isConnected) return;

    const src = veLiveChatUrl(vid, status);
    el.innerHTML = `<iframe class="ve-livechat-frame" src="${src}"
        frameborder="0" title="실시간 채팅"></iframe>
        <div class="ve-livechat-fallback">
            채팅이 보이지 않으면 <a href="${veWatchUrl(vid)}" target="_blank" rel="noopener">유튜브에서 바로 보기 →</a>
        </div>`;
}

function veClearLiveChat(containerId) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '';
}
