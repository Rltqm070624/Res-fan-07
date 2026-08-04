import fs from 'fs';
import * as cheerio from 'cheerio';
import { fetchHtmlViaCurlCffi } from './lib/fetchWithCurlCffi.js';

const SOURCE_URL = 'https://namu.wiki/w/RESCENE/%EC%BD%98%ED%85%90%EC%B8%A0';
const ALBUM_CONTENT_OUTPUT = 'js/album_content_data.js';
const CONTENTS_OUTPUT = 'js/contents_data.js';

function ytIdFromUrl(url) {
    if (!url) return null;
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0] || null;
        if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || null;
        if (u.searchParams.has('v')) return u.searchParams.get('v') || null;
    } catch (e) { }
    return null;
}

async function fetchHtml(url) {
    // namu.wiki가 Node의 기본 fetch를 TLS 지문 단계에서 차단하는 경우가 있어
    // Chrome의 TLS/JA3 지문을 흉내 내는 curl_cffi(Python)를 서브프로세스로 호출한다.
    return await fetchHtmlViaCurlCffi(url);
}

function parseContentsPage(html) {
    const $ = cheerio.load(html);
    const albumRows = [];
    const contentRows = [];

    let currentChannel = '';
    let underAlbumSection = false;

    const nodes = $('h3, h4, table').toArray();

    nodes.forEach(node => {
        const tag = node.tagName ? node.tagName.toLowerCase() : '';
        const $node = $(node);

        if (tag === 'h3' || tag === 'h4') {
            const text = $node.text().replace(/\[편집\]/g, '').replace(/^[\d.]+\s*/, '').trim();
            if (!text) return;
            if (tag === 'h3') {
                currentChannel = text;
                underAlbumSection = /음반\s*활동\s*콘텐츠/.test(text);
            } else if (underAlbumSection) {
                currentChannel = text;
            }
            return;
        }

        const headerText = $node.find('tr').first().text();
        if (!headerText.includes('일자') || !headerText.includes('제목')) return;

        let lastYear = null;
        let lastMM = null;
        let lastDD = null;

        $node.find('tr').each((_, tr) => {
            const $tr = $(tr);
            const rowText = $tr.text().trim();

            const yearOnly = rowText.match(/^(\d{4})년$/);
            if (yearOnly) { lastYear = yearOnly[1]; lastMM = null; lastDD = null; return; }

            const dateMatch = rowText.match(/(\d{1,2})\.\s*(\d{1,2})\.?/);
            if (dateMatch) {
                lastMM = dateMatch[1].padStart(2, '0');
                lastDD = dateMatch[2].padStart(2, '0');
            }
            if (!lastYear || !lastMM || !lastDD) return;

            const ytHref = $tr.find('a[href*="youtu.be"], a[href*="youtube.com/watch"], a[href*="youtube.com/shorts"]').attr('href');
            const vid = ytIdFromUrl(ytHref);
            if (!vid) return;

            const cells = $tr.find('td');
            let title = cells.length >= 2 ? $(cells[1]).text().trim() : '';
            if (!title && dateMatch) title = rowText.replace(dateMatch[0], '').replace(/유튜브\s*아이콘/g, '').trim();
            if (!title) return;

            const date = `${lastYear}-${lastMM}-${lastDD}`;
            if (underAlbumSection) {
                albumRows.push({ date, title, vid });
            } else {
                contentRows.push({ date, channel: currentChannel, title, cast: '전원', vid });
            }
        });
    });

    return { albumRows, contentRows };
}

function loadExistingArray(path, varName) {
    try {
        const raw = fs.readFileSync(path, 'utf8');
        const jsonStr = raw.replace(`const ${varName} = `, '').replace(/;\s*$/, '');
        return JSON.parse(jsonStr);
    } catch (e) {
        console.warn(`⚠️ 기존 ${path}를 읽지 못했습니다. 새로 만듭니다.`);
        return [];
    }
}

function mergeAndSave(path, varName, existing, scraped, keyFn) {
    const existingKeys = new Set(existing.map(keyFn));
    const newItems = scraped.filter(i => !existingKeys.has(keyFn(i)));

    if (newItems.length === 0) {
        console.log(`ℹ️ ${path}: 새로 추가할 항목이 없습니다. 기존 파일을 그대로 둡니다 (덮어쓰기 없음).`);
        return { written: false, added: 0, total: existing.length };
    }

    const result = [...existing, ...newItems].sort((a, b) => b.date.localeCompare(a.date));
    fs.writeFileSync(path, `const ${varName} = ${JSON.stringify(result)};\n`);
    return { written: true, added: newItems.length, total: result.length };
}

async function main() {
    console.log(`데이터 가져오는 중: ${SOURCE_URL}`);
    const html = await fetchHtml(SOURCE_URL);

    if (html.includes('IP 우회 수단') && !html.includes('음반 활동 콘텐츠')) {
        console.error('❌ IP 차단으로 페이지 본문을 받지 못한 것으로 보입니다. 로컬 환경에서 다시 시도해주세요.');
        process.exit(1);
    }

    const { albumRows, contentRows } = parseContentsPage(html);
    console.log(`음반 활동 콘텐츠: ${albumRows.length}개, 기타 콘텐츠: ${contentRows.length}개`);
    if (albumRows.length === 0 && contentRows.length === 0) {
        console.error('❌ 파싱된 데이터가 없습니다. 페이지 구조가 바뀌었을 수 있습니다.');
        process.exit(1);
    }

    const existingAlbum = loadExistingArray(ALBUM_CONTENT_OUTPUT, 'ALBUM_CONTENT_DATA');
    const albumResult = mergeAndSave(ALBUM_CONTENT_OUTPUT, 'ALBUM_CONTENT_DATA', existingAlbum, albumRows, i => `${i.date}|${i.vid}`);
    if (albumResult.written) console.log(`✅ ${ALBUM_CONTENT_OUTPUT}: 새 항목 ${albumResult.added}개 추가 (총 ${albumResult.total}개)`);

    const existingContents = loadExistingArray(CONTENTS_OUTPUT, 'CONTENTS_DATA');
    const contentsResult = mergeAndSave(CONTENTS_OUTPUT, 'CONTENTS_DATA', existingContents, contentRows, i => `${i.date}|${i.vid}`);
    if (contentsResult.written) console.log(`✅ ${CONTENTS_OUTPUT}: 새 항목 ${contentsResult.added}개 추가 (총 ${contentsResult.total}개)`);
}

main().catch(err => {
    console.error('스크래핑 실패:', err);
    process.exit(1);
});
