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

function authHeader() {
    const access = process.env.ARCHIVE_ORG_ACCESS_KEY;
    const secret = process.env.ARCHIVE_ORG_SECRET_KEY;
    if (!access || !secret) {
        throw new Error(
            'ARCHIVE_ORG_ACCESS_KEY / ARCHIVE_ORG_SECRET_KEY 환경변수가 없습니다. ' +
            'https://archive.org/account/s3.php 에서 무료로 발급받아 GitHub Secrets에 등록해주세요.'
        );
    }
    return `LOW ${access}:${secret}`;
}

/**
 * SPN2 캡처 요청 제출. 성공 시 job_id를 반환한다.
 */
async function submitCapture(targetUrl, timeoutMs) {
    const res = await fetch('https://web.archive.org/save', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': authHeader(),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            url: targetUrl,
            skip_first_archive: '1', // "이게 첫 캡처인지" 조회를 생략해서 속도를 높임
            js_behavior_timeout: '0', // 서버사이드 렌더 위키라 JS 실행 대기가 불필요함
        }),
        signal: AbortSignal.timeout(timeoutMs),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.job_id) {
        throw new Error(`캡처 요청 실패: HTTP ${res.status} ${data ? JSON.stringify(data) : ''}`);
    }
    return data.job_id;
}

/**
 * job_id 상태를 완료될 때까지 폴링한다. 성공 시 새 스냅샷의 타임스탬프를 반환한다.
 */
async function pollCaptureStatus(jobId, { deadlineMs, intervalMs = 5000 }) {
    const deadline = Date.now() + deadlineMs;
    while (Date.now() < deadline) {
        const res = await fetch(`https://web.archive.org/save/status/${jobId}`, {
            headers: { 'Accept': 'application/json', 'Authorization': authHeader() },
            signal: AbortSignal.timeout(15000),
        });
        const data = await res.json().catch(() => null);

        if (data?.status === 'success') {
            return data.timestamp;
        }
        if (data?.status === 'error') {
            throw new Error(`캡처 실패: ${data.status_ext || 'unknown'} ${data.message || ''}`.trim());
        }
        // status === 'pending' (또는 파싱 실패) -> 계속 대기
        await new Promise(r => setTimeout(r, intervalMs));
    }
    throw new Error(`${deadlineMs}ms 동안 캡처가 완료되지 않았습니다 (job_id: ${jobId})`);
}

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
 * Wayback Machine(SPN2 인증 API)을 통해 "지금 막 새로 캡처된" HTML을 가져온다.
 * 실패 시에만 기존(오래된) 스냅샷으로 대체하며, 이 경우 로그에 경고를 명확히 남긴다.
 *
 * @param {string} targetUrl - 원본(namu.wiki) URL
 * @param {object} opts
 * @param {number} opts.captureDeadlineMs - 캡처 완료 대기 최대 시간 (기본 90초)
 * @param {number} opts.requestTimeoutMs - 개별 요청 타임아웃 (기본 30초)
 * @returns {Promise<string>} HTML 본문
 */
export async function fetchHtmlViaWayback(targetUrl, opts = {}) {
    const captureDeadlineMs = opts.captureDeadlineMs ?? 90000;
    const requestTimeoutMs = opts.requestTimeoutMs ?? 30000;

    let timestamp = null;
    let isFresh = false;

    try {
        const jobId = await withRetry(
            () => submitCapture(targetUrl, requestTimeoutMs),
            { label: 'SPN2 캡처 요청' }
        );
        console.log(`[wayback] 캡처 작업 시작: job_id=${jobId}`);
        timestamp = await pollCaptureStatus(jobId, { deadlineMs: captureDeadlineMs });
        isFresh = true;
        console.log(`[wayback] ✅ 새 아카이빙 성공 (방금 캡처됨): ${timestamp}`);
    } catch (e) {
        console.warn(`[wayback] 새 캡처 실패 (${e.message}), 기존 스냅샷으로 대체 시도합니다.`);
    }

    if (!timestamp) {
        try {
            timestamp = await withRetry(
                () => getLatestSnapshotTimestamp(targetUrl, requestTimeoutMs),
                { label: 'Availability API' }
            );
            if (timestamp) {
                console.warn(`[wayback] ⚠️ 최신 데이터 아님! 기존 스냅샷으로 대체합니다: ${timestamp}`);
            }
        } catch (e) {
            console.warn(`[wayback] 기존 스냅샷 조회도 실패: ${e.message}`);
        }
    }

    if (!timestamp) {
        throw new Error('Wayback Machine에서 스냅샷을 얻지 못했습니다 (새 캡처/기존 스냅샷 모두 실패).');
    }

    // "id_" 접미사: Wayback 툴바/링크 재작성이 없는 원본 그대로의 HTML
    const rawUrl = `https://web.archive.org/web/${timestamp}id_/${targetUrl}`;
    const res = await fetch(rawUrl, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(requestTimeoutMs),
    });

    if (!res.ok) {
        throw new Error(`Wayback 원본 페이지 요청 실패: HTTP ${res.status} (${rawUrl})`);
    }

    if (!isFresh) {
        console.warn('[wayback] ⚠️ 이번 실행 결과는 최신 정보가 아닐 수 있습니다 (오래된 스냅샷 사용).');
    }

    return await res.text();
}
