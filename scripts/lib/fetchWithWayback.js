const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/**
 * archive.org 인프라가 종종 불안정해서(520/502/503 등) 몇 번은 재시도해볼 가치가 있다.
 */
async function withRetry(fn, { retries = 3, delayMs = 6000, label = '' } = {}) {
    let lastErr;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (e) {
            lastErr = e;
            console.warn(`[wayback] ${label} 시도 ${attempt}/${retries} 실패: ${e.message}`);
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, delayMs * attempt)); // 6s, 12s, 18s...
            }
        }
    }
    throw lastErr;
}

/**
 * Wayback Machine의 "Save Page Now"로 지금 시점 스냅샷을 새로 요청한다.
 * 인증(API 키) 없이도 되는 공개 엔드포인트지만, 과도한 요청 시 제한될 수 있다.
 * @returns {Promise<string|null>} 성공 시 타임스탬프(YYYYMMDDhhmmss), 실패 시 null
 */
async function triggerSave(targetUrl, timeoutMs) {
    const saveUrl = `https://web.archive.org/save/${targetUrl}`;
    const res = await fetch(saveUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
        throw new Error(`Save Page Now 요청 실패: HTTP ${res.status}`);
    }

    // Content-Location 헤더에 새 스냅샷 경로가 오는 경우가 많고,
    // 없으면 최종적으로 리다이렉트된 res.url에서 타임스탬프를 뽑는다.
    const contentLocation = res.headers.get('content-location');
    const candidate = contentLocation || res.url;
    const m = candidate.match(/\/web\/(\d{1,14})\b/);
    return m ? m[1] : null;
}

/**
 * 기존에 이미 저장돼 있는 가장 최근 스냅샷의 타임스탬프를 가져온다 (폴백용).
 * @returns {Promise<string|null>}
 */
async function getLatestSnapshotTimestamp(targetUrl, timeoutMs) {
    const apiUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(apiUrl, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
        throw new Error(`Availability API 요청 실패: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data?.archived_snapshots?.closest?.timestamp || null;
}

/**
 * Wayback Machine을 경유해 HTML을 가져온다.
 * namu.wiki를 직접 건드리지 않고 Internet Archive의 크롤러가 대신 접속하게 만들어,
 * GitHub Actions IP에 대한 Cloudflare 챌린지를 우회한다.
 *
 * @param {string} targetUrl - 원본(namu.wiki) URL
 * @param {object} opts
 * @param {number} opts.timeoutMs - 각 요청 타임아웃 (기본 60초)
 * @returns {Promise<string>} HTML 본문
 */
export async function fetchHtmlViaWayback(targetUrl, opts = {}) {
    const timeoutMs = opts.timeoutMs ?? 60000;

    let timestamp = null;
    try {
        timestamp = await withRetry(() => triggerSave(targetUrl, timeoutMs), { label: 'Save Page Now' });
        if (timestamp) console.log(`[wayback] 새 아카이빙 성공: ${timestamp}`);
    } catch (e) {
        console.warn(`[wayback] 새 아카이빙 요청 실패 (${e.message}), 기존 스냅샷으로 대체 시도합니다.`);
    }

    if (!timestamp) {
        try {
            timestamp = await withRetry(() => getLatestSnapshotTimestamp(targetUrl, timeoutMs), { label: 'Availability API' });
            if (timestamp) console.log(`[wayback] 기존 스냅샷 사용: ${timestamp}`);
        } catch (e) {
            console.warn(`[wayback] 기존 스냅샷 조회도 실패: ${e.message}`);
        }
    }

    if (!timestamp) {
        throw new Error('Wayback Machine에서 스냅샷을 얻지 못했습니다 (새 저장/기존 스냅샷 모두 없음).');
    }

    // "id_" 접미사: Wayback 툴바/링크 재작성이 없는 원본 그대로의 HTML
    const rawUrl = `https://web.archive.org/web/${timestamp}id_/${targetUrl}`;
    const res = await fetch(rawUrl, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
        throw new Error(`Wayback 원본 페이지 요청 실패: HTTP ${res.status} (${rawUrl})`);
    }

    return await res.text();
}
