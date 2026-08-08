import fs from 'fs';

const FILE_PATH = 'js/schedule_data.json';

async function fetchSecretSourceEvents() {
    const targetUrl = process.env.SECRET_DATA_URL;
    if (!targetUrl) {
        console.error("SECRET_DATA_URL이 비어있습니다. GitHub Secrets 설정을 확인해주세요.");
        return [];
    }

    try {
        console.log("[SECRET_DATA_URL] 데이터를 가져오는 중...");
        const response = await fetch(targetUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rawData = await response.json();

        if (rawData && Array.isArray(rawData.events)) {
            return rawData.events;
        }
        const currentYear = new Date().getFullYear().toString();
        let filteredDB = {};
        for (const dateKey in rawData) {
            if (dateKey.startsWith(currentYear)) {
                filteredDB[dateKey] = rawData[dateKey];
            }
        }
        const output = Object.keys(filteredDB).length > 0 ? filteredDB : rawData;
        // 옛날 형태({날짜: {...}})는 이벤트 배열로 변환
        return Object.keys(output).map(dateKey => Object.assign({ date: dateKey }, output[dateKey]));
    } catch (error) {
        console.error("[SECRET_DATA_URL] 데이터 가져오기 실패:", error.message);
        return [];
    }
}
// -------------------------------------------------------------------------
const MNET_API_BASE = 'https://artist.mnetplus.world/svc/stg/rescene-official/space/api/v1/calendar';
const MNET_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const MNET_HEADERS = {
    'User-Agent': MNET_UA,
    'Accept': 'application/json',
    'Referer': 'https://artist.mnetplus.world/'
};
const DEBUT_YEAR = 2024;
const DEBUT_MONTH = 1;

const MNET_LABEL_MAP = {
    '공연': 'concert', '팬사인회': 'fansign', '음방': 'broadcast', '방송': 'broadcast',
    '예능': 'broadcast', '라디오': 'radio', '행사': 'event', '기념일': 'anniv', '공지': 'notice'
};
const MNET_TYPE_KEYWORDS = {
    broadcast: ['음방', '음악방송', 'inkigayo', '인기가요', '뮤직뱅크', 'music bank', 'show champion',
        '엠카운트다운', 'mcountdown', 'the show', '방송', '출연', '인터뷰', 'interview', '예능', '버라이어티', 'variety', '웹예능'],
    radio: ['라디오', 'radio'],
    concert: ['콘서트', 'concert', 'showcase', '쇼케이스', '팬미팅', 'fanmeeting', '공연', '페스티벌', 'festival', 'kcon'],
    fansign: ['팬사인', 'fansign', '사인회', '팬이벤트', '영상통화'],
    event: ['행사', '이벤트', 'event'],
    notice: ['공지', '안내', 'notice']
};

function mnetClassifyType(ev) {
    const labelName = (ev.label && ev.label.name) || '';
    if (MNET_LABEL_MAP[labelName]) return MNET_LABEL_MAP[labelName];
    const tl = (ev.title || '').toLowerCase();
    for (const type in MNET_TYPE_KEYWORDS) {
        if (MNET_TYPE_KEYWORDS[type].some(kw => tl.includes(kw))) return type;
    }
    return 'notice';
}

function mnetExtractDate(ev) {
    const raw = ev.allDay ? ev.startAtAllDay : (ev.startAt || ev.startAtAllDay || '');
    const m = String(raw || '').match(/(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function mnetExtractTime(ev) {
    if (ev.allDay) return '';
    const m = String(ev.startAt || '').match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!m) return '';
    try {
        const dtUtc = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
        const dtKst = new Date(dtUtc.getTime() + 9 * 60 * 60 * 1000);
        const hh = dtKst.getUTCHours(), mm = dtKst.getUTCMinutes();
        if (hh === 0 && mm === 0) return ''; // 자정(00:00)은 종일 일정으로 취급
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    } catch (e) {
        return '';
    }
}

function mnetBuildParams(year, month) {
    const startKst = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const startUtc = new Date(startKst.getTime() - 9 * 60 * 60 * 1000);
    const lastDay = new Date(Date.UTC(year, month, 0)); // 해당 달 마지막 날
    const endKst = new Date(Date.UTC(lastDay.getUTCFullYear(), lastDay.getUTCMonth(), lastDay.getUTCDate(), 23, 59, 59));
    const endUtc = new Date(endKst.getTime() - 9 * 60 * 60 * 1000);
    const iso = d => d.toISOString().replace(/\.\d{3}Z$/, 'Z');
    const pad2 = n => String(n).padStart(2, '0');
    return new URLSearchParams({
        startAt: iso(startUtc),
        startAtForAllDay: `${year}-${pad2(month)}-01`,
        endAt: iso(endUtc),
        endAtForAllDay: `${lastDay.getUTCFullYear()}-${pad2(lastDay.getUTCMonth() + 1)}-${pad2(lastDay.getUTCDate())}`
    });
}

async function fetchMnetMonth(year, month) {
    const params = mnetBuildParams(year, month);
    try {
        const res = await fetch(`${MNET_API_BASE}?${params.toString()}`, { headers: MNET_HEADERS });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const events = [];
        for (const ev of (data.events || [])) {
            const d = mnetExtractDate(ev);
            const title = (ev.title || '').trim();
            if (!d || !title) continue;
            const labelName = (ev.label && ev.label.name) || '';
            if (labelName === '기념일') continue; // 기념일은 스케줄이 아니므로 제외
            events.push({
                date: d,
                time: mnetExtractTime(ev),
                title,
                detail: '',
                type: mnetClassifyType(ev),
                source: 'mnetplus'
            });
        }
        console.log(`[MnetPlus] ${year}.${String(month).padStart(2, '0')} → ${events.length}건`);
        return { ok: true, events };
    } catch (e) {
        console.error(`[MnetPlus] ${year}.${String(month).padStart(2, '0')} 조회 실패:`, e.message);
        return { ok: false, events: [] };
    }
}

function monthKey(y, m) { return `${y}-${String(m).padStart(2, '0')}`; }
function nextMonth(y, m) { return m === 12 ? [y + 1, 1] : [y, m + 1]; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// mnetBackfill: { "2024-01": true, "2024-02": true, ... } 이미 채운 달 기록
async function fetchMnetEvents(mnetBackfill) {
    const today = new Date();
    const curY = today.getFullYear(), curM = today.getMonth() + 1;
    const [nextY, nextM] = nextMonth(curY, curM);

    // 이번 달 · 다음 달은 항상 다시 가져와 최신 정보로 갱신
    const alwaysRefreshKeys = new Set([monthKey(curY, curM), monthKey(nextY, nextM)]);

    const targets = [];
    let y = DEBUT_YEAR, m = DEBUT_MONTH;
    while (y < curY || (y === curY && m <= curM)) {
        targets.push([y, m]);
        [y, m] = nextMonth(y, m);
    }
    targets.push([nextY, nextM]);

    const monthsToFetch = targets.filter(([yy, mm]) => {
        const key = monthKey(yy, mm);
        return alwaysRefreshKeys.has(key) || !mnetBackfill[key];
    });

    let allEvents = [];
    for (const [yy, mm] of monthsToFetch) {
        const key = monthKey(yy, mm);
        const { ok, events } = await fetchMnetMonth(yy, mm);
        allEvents = allEvents.concat(events);
        // 성공한 달만 "완료"로 표시 (실패한 달은 다음 실행에서 재시도)
        if (ok) mnetBackfill[key] = true;
        await sleep(250); // API 과호출 방지
    }
    return allEvents;
}
async function main() {
    let existingEvents = [];
    let mnetBackfill = {};
    try {
        const existingRaw = fs.readFileSync(FILE_PATH, 'utf-8');
        const existingJson = JSON.parse(existingRaw);
        if (existingJson && Array.isArray(existingJson.events)) existingEvents = existingJson.events;
        if (existingJson && existingJson.mnetBackfill && typeof existingJson.mnetBackfill === 'object') {
            mnetBackfill = existingJson.mnetBackfill;
        }
    } catch (e) {
        // 기존 파일이 없거나 파싱 실패해도 무시하고 새 데이터로 진행
    }

    const secretEvents = await fetchSecretSourceEvents();
    const mnetEvents = await fetchMnetEvents(mnetBackfill);
    const fetchedEvents = secretEvents.concat(mnetEvents);

    const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const pastEvents = existingEvents.filter(ev => ev.date && ev.date < todayKey);

    const seen = new Set(pastEvents.map(ev => `${ev.date}__${ev.title}`));
    const mergedNew = [];
    fetchedEvents.forEach(ev => {
        if (!ev || !ev.date || !ev.title) return;
        const key = `${ev.date}__${ev.title}`;
        if (seen.has(key)) return;
        seen.add(key);
        mergedNew.push(ev);
    });

    const mergedEvents = pastEvents.concat(mergedNew).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const output = {
        updated: new Date().toISOString(),
        events: mergedEvents,
        mnetBackfill
    };

    fs.writeFileSync(FILE_PATH, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ 스케줄 데이터 연동 완료! (${FILE_PATH}) — 과거 ${pastEvents.length}건 보존, 신규/예정 ${mergedNew.length}건 갱신`);
}

main().catch(error => {
    console.error("데이터 가져오기 실패:", error.message);
    process.exitCode = 1;
});
