import * as cheerio from 'cheerio';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 RESCENE-fan-archive-bot/1.0 (+https://github.com/Rltqm070624/Res-fan-07)';

export async function fetchNamuDoc(path) {
    const url = `https://namu.wiki/w/${path}`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`나무위키 요청 실패 (${res.status}): ${url}`);
    const html = await res.text();
    return cheerio.load(html);
}

export function extractVideoId(href) {
    if (!href) return null;
    try {
        const clean = href.startsWith('//') ? `https:${href}` : href;
        const u = new URL(clean, 'https://namu.wiki');
        if (u.hostname.includes('youtu.be')) return u.pathname.split('/').filter(Boolean)[0] || null;
        if (u.hostname.includes('youtube.com') || u.hostname.includes('youtube-nocookie.com')) {
            if (u.searchParams.get('v')) return u.searchParams.get('v');
            const m = u.pathname.match(/\/(?:shorts|live|embed)\/([\w-]{6,})/);
            if (m) return m[1];
        }
    } catch (e) { /* 무시하고 null 반환 */ }
    return null;
}

function isYearRow($, tr) {
    const cells = $(tr).find('td,th');
    if (cells.length !== 1) return false;
    const m = cells.first().text().trim().match(/^(\d{4})년?$/);
    return m ? Number(m[1]) : null;
}

function normalizeDate(text, year) {
    const m = text.match(/(\d{1,2})[.\/]\s*(\d{1,2})/);
    if (!m || !year) return null;
    const mm = String(m[1]).padStart(2, '0');
    const dd = String(m[2]).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
}


export function parseSimpleTable($, table, extraFields) {
    const rows = [];
    let year = null;
    let lastDate = null;

    $(table).find('tr').each((_, tr) => {
        const y = isYearRow($, tr);
        if (y) { year = y; return; }

        const cells = $(tr).find('td,th');
        if (cells.length < 2) return; // 헤더 행("일자","제목","링크")이나 빈 행은 스킵

        const dateText = cells.eq(0).text().trim();
        const parsedDate = normalizeDate(dateText, year);
        const date = parsedDate || lastDate; // 날짜가 비어있으면(rowspan) 직전 값 사용
        if (parsedDate) lastDate = parsedDate;
        if (!date) return; // 연도/날짜를 못 찾으면 이 행은 건너뜀 (헤더 등)

        let titleCell = cells.eq(1);
        let title = titleCell.text().trim();
        if (!title) return;

        let href = $(tr).find('a[href*="youtu"]').first().attr('href');
        const vid = extractVideoId(href);
        if (!vid) return;

        const row = { date, title, vid };
        if (extraFields) Object.assign(row, extraFields($, tr, cells) || {});
        rows.push(row);
    });

    return rows;
}


export function parseMusicShowTable($, table) {
    const rows = [];
    let year = null;
    let lastDate = null, lastBroadcaster = '', lastProgram = '', lastSong = '';

    $(table).find('tr').each((_, tr) => {
        const y = isYearRow($, tr);
        if (y) { year = y; return; }

        const $tr = $(tr);
        const cells = $tr.find('td,th');
        if (!cells.length) return;

        const rowText = $tr.text();
        const dateMatch = rowText.match(/^\s*(\d{1,2})[\/.](\d{1,2})/);
        const date = dateMatch ? normalizeDate(`${dateMatch[1]}.${dateMatch[2]}`, year) : lastDate;
        if (dateMatch && date) lastDate = date;
        if (!date) return;

        // 굵게 표시된 텍스트 = 활동곡명 (해당 행부터 다음에 굵은 텍스트가 나올 때까지 유지)
        const boldText = $tr.find('b,strong').map((i, el) => $(el).text().trim()).get().filter(Boolean).join(' ').trim();
        if (boldText) lastSong = boldText;

        // 방송사/프로그램: 셀 안의 링크 텍스트(로고 alt 텍스트 포함) 중 굵은 텍스트가 아닌 것들
        const linkTexts = cells.find('a').map((i, el) => $(el).text().replace(/\s+/g, ' ').trim()).get().filter(Boolean);
        if (linkTexts[0]) lastBroadcaster = linkTexts[0];
        if (linkTexts[1]) lastProgram = linkTexts[1];

        const href = $tr.find('a[href*="youtu"]').last().attr('href');
        const vid = extractVideoId(href);
        if (!vid || !lastSong) return; // 곡명을 아직 못 찾았거나(표 최상단 등) 링크가 없으면 스킵

        rows.push({ date, broadcaster: lastBroadcaster, program: lastProgram, song: lastSong, vid });
    });

    return rows;
}

/** 헤더 텍스트로 표 종류 판별 */
export function tableKind($, table) {
    const headText = $(table).find('tr').first().text();
    if (/방송사/.test(headText) && /프로그램/.test(headText)) return 'musicshow';
    if (/일자|날짜/.test(headText) && /제목/.test(headText)) return 'simple';
    return null;
}

/** 배열을 `const NAME = [...]` 형태의 JS 파일 내용으로 직렬화 */
export function toConstJs(varName, rows) {
    return `const ${varName} = ${JSON.stringify(rows)};\n`;
}

/** 날짜 내림차순 정렬 (최신이 먼저) */
export function sortByDateDesc(rows) {
    return rows.slice().sort((a, b) => b.date.localeCompare(a.date));
}

/** date+vid 기준 중복 제거 (같은 영상이 여러 표에 겹쳐 나오는 경우 대비) */
export function dedupe(rows) {
    const seen = new Set();
    return rows.filter(r => {
        const key = `${r.date}__${r.vid}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
