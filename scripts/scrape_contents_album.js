import { fetchNamuDoc, parseSimpleTable, tableKind, sortByDateDesc, dedupe, mergeAppendOnlyNew } from '../js-tools/wi_scraper.js';

const OWN_CHANNEL_HEADING = '공식 유튜브 채널';
const PERSONAL_HEADING = '개인 채널';
const EXTERNAL_HEADING = '외부 채널';

async function run() {
    const $ = await fetchNamuDoc('RESCENE/%EC%BD%98%ED%85%90%EC%B8%A0');

    let mode = null; // 'own' | 'personal' | 'external' | null(아직 진입 전)
    let currentChannelHeading = ''; // 외부채널 소제목(있다면) → channel 필드 힌트로 사용

    const albumRows = [];
    const contentsRows = [];

    $('h1,h2,h3,h4,h5,h6,table').each((_, el) => {
        const $el = $(el);
        if (el.tagName && /^h[1-6]$/i.test(el.tagName)) {
            const text = $el.text().trim();
            if (text.includes(OWN_CHANNEL_HEADING)) { mode = 'own'; return; }
            if (text.includes(PERSONAL_HEADING)) { mode = 'personal'; return; }
            if (text.includes(EXTERNAL_HEADING)) { mode = 'external'; return; }
            // 개인/외부 채널 진입 이후에 나오는 소제목은 채널명일 가능성이 높음 (예: "Arirang Radio")
            if ((mode === 'personal' || mode === 'external') && text && !/^\d+(\.\d+)*\.?$/.test(text)) {
                currentChannelHeading = text.replace(/\[편집\]/, '').trim();
            }
            return;
        }
        // table
        if (!mode) return;
        if (tableKind($, el) !== 'simple') return;

        const rows = parseSimpleTable($, el);
        if (mode === 'own') {
            rows.forEach(r => albumRows.push({ date: r.date, title: r.title, vid: r.vid }));
        } else {
            rows.forEach(r => contentsRows.push({
                date: r.date,
                channel: currentChannelHeading || '유튜브 채널',
                title: r.title,
                cast: '전원', // 나무위키 표에는 출연자 구분이 없어 기본값으로 채움 — 필요 시 수동 보정
                vid: r.vid
            }));
        }
    });

    const album = dedupe(sortByDateDesc(albumRows));
    const contents = dedupe(sortByDateDesc(contentsRows));

    console.log(`[scrape_contents_album] 나무위키에서 확인한 전체 항목 — ALBUM: ${album.length}건, CONTENTS: ${contents.length}건`);
    if (!album.length && !contents.length) {
        console.error('스크래핑 결과가 비어 있습니다. 나무위키 문서 구조가 바뀌었을 수 있어요 — 기존 파일은 그대로 둡니다.');
        process.exit(1);
    }

    // ⭐️ 기존에 수동으로 넣어둔 항목은 절대 건드리지 않고, "새로 발견된 것만" 뒤에 추가
    const albumResult = mergeAppendOnlyNew('js/album_content_data.js', 'ALBUM_CONTENT_DATA', album, r => r.vid);
    const contentsResult = mergeAppendOnlyNew('js/contents_data.js', 'CONTENTS_DATA', contents, r => r.vid);
    console.log(`[scrape_contents_album] ALBUM_CONTENT_DATA: 새 항목 ${albumResult.added}건 추가 (총 ${albumResult.total}건)`);
    console.log(`[scrape_contents_album] CONTENTS_DATA: 새 항목 ${contentsResult.added}건 추가 (총 ${contentsResult.total}건)`);
}

run().catch(e => { console.error('[scrape_contents_album] 실패:', e); process.exit(1); });
