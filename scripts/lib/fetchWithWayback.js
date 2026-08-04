const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

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

    const contentLocation = res.headers.get('content-location');
    const candidate = contentLocation || res.url;
    const m = candidate.match(/\/web\/(\d{1,14})\b/);
    return m ? m[1] : null;
}

async function getLatestSnapshotTimestamp(targetUrl, timeoutMs) {
    const apiUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(apiUrl, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.archived_snapshots?.closest?.timestamp || null;
}

export async function fetchHtmlViaWayback(targetUrl, opts = {}) {
    const timeoutMs = opts.timeoutMs ?? 60000;

    let timestamp = null;
    try {
        timestamp = await triggerSave(targetUrl, timeoutMs);
        if (timestamp) console.log(`[wayback] 새 아카이빙 성공: ${timestamp}`);
    } catch (e) {
        console.warn(`[wayback] 새 아카이빙 요청 실패 (${e.message}), 기존 스냅샷으로 대체 시도합니다.`);
    }

    if (!timestamp) {
        timestamp = await getLatestSnapshotTimestamp(targetUrl, timeoutMs);
        if (timestamp) console.log(`[wayback] 기존 스냅샷 사용: ${timestamp}`);
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
