import fs from 'fs';
import * as cheerio from 'cheerio';
import { fetchHtmlViaCurlCffi } from './lib/fetchWithCurlCffi.js';

const OUTPUT_PATH = 'js/music_show_data.js';
const SOURCE_URL = 'https://namu.wiki/w/RESCENE/%EC%9D%8C%EC%95%85%20%EB%B0%A9%EC%86%A1';

function ytIdFromUrl(url) {
    if (!url) return null;
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0] || null;
        if (u.searchParams.has('v')) return u.searchParams.get('v') || null;
    } catch (e) { }
    return null;
}

async function fetchHtml(url) {
    // namu.wiki가 Node의 기본 fetch를 TLS 지문 단계에서 차단하는 경우가 있어
    // Chrome의 TLS/JA3 지문을 흉내 내는 curl_cffi(Python)를 서브프로세스로 호출한다.
    return await fetchHtmlViaCurlCffi(url);
}

function parseMusicShowPage(html) {
    const $ = cheerio.load(html);
    const rows = [];

    $('table').each((_, tableEl) => {
        const table = $(tableEl);
        const headerText = table.find('tr').first().text();
        if (!headerText.includes('날짜') || !headerText.includes('방송사')) return;

        let lastSong = null;
        let lastYear = null;

        table.find('tr').each((__, tr) => {
            const $tr = $(tr);
            const rowText = $tr.text().trim();

            const yearOnly = rowText.match(/^(\d{4})년$/);
            if (yearOnly) { lastYear = yearOnly[1]; return; }

            const dateMatch = rowText.match(/(\d{2})\/(\d{2})/);
            if (!dateMatch) return;
            if (!lastYear) return;
            const [, mm, dd] = dateMatch;

            const songBold = $tr.find('b, strong').first().text().trim();
            if (songBold) lastSong = songBold;

            const ytHref = $tr.find('a[href*="youtu.be"], a[href*="youtube.com/watch"]').attr('href');
            const vid = ytIdFromUrl(ytHref);
            if (!vid) return;

            const linkTexts = $tr.find('a').map((i, a) => $(a).text().trim()).get().filter(Boolean);
            const nonIconLinks = linkTexts.filter(t => t && !/유튜브|네이버|아이콘|편집/.test(t));
            const broadcaster = nonIconLinks[0] || '';
            const program = nonIconLinks[1] || nonIconLinks[0] || '';

            rows.push({
                date: `${lastYear}-${mm}-${dd}`,
                broadcaster,
                program,
                song: lastSong || '',
                vid
            });
        });
    });

    return rows;
}

function loadExisting() {
    try {
        const raw = fs.readFileSync(OUTPUT_PATH, 'utf8');
        const jsonStr = raw.replace('const MUSIC_SHOW_DATA = ', '').replace(/;\s*$/, '');
        return JSON.parse(jsonStr);
    } catch (e) {
        console.warn(`⚠️ 기존 ${OUTPUT_PATH}를 읽지 못했습니다. 새로 만듭니다.`);
        return [];
    }
}

async function main() {
    console.log(`데이터 가져오는 중: ${SOURCE_URL}`);
    const html = await fetchHtml(SOURCE_URL);

    if (html.includes('IP 우회 수단') && !html.includes('방송 영상')) {
        console.error('❌ IP 차단으로 페이지 본문을 받지 못한 것으로 보입니다. 로컬 환경에서 다시 시도해주세요.');
        process.exit(1);
    }

    const scraped = parseMusicShowPage(html);
    console.log(`파싱된 항목: ${scraped.length}개`);
    if (scraped.length === 0) {
        console.error('❌ 파싱된 데이터가 없습니다. 페이지 구조가 바뀌었을 수 있습니다.');
        process.exit(1);
    }

    const existing = loadExisting();
    const existingKeys = new Set(existing.map(i => `${i.date}|${i.vid}`));

    const newItems = scraped.filter(i => !existingKeys.has(`${i.date}|${i.vid}`));

    if (newItems.length === 0) {
        console.log('ℹ️ 새로 추가할 항목이 없습니다. 기존 파일을 그대로 둡니다 (덮어쓰기 없음).');
        return;
    }

    const result = [...existing, ...newItems].sort((a, b) => b.date.localeCompare(a.date));
    fs.writeFileSync(OUTPUT_PATH, `const MUSIC_SHOW_DATA = ${JSON.stringify(result)};\n`);
    console.log(`✅ 새 항목 ${newItems.length}개 추가 (기존 ${existing.length}개 + 신규 ${newItems.length}개 = 총 ${result.length}개) → ${OUTPUT_PATH}`);
}

main().catch(err => {
    console.error('스크래핑 실패:', err);
    process.exit(1);
});
