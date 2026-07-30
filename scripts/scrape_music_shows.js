import { fetchNamuDoc, parseMusicShowTable, tableKind, sortByDateDesc, dedupe, mergeAppendOnlyNew } from '../js-tools/wi_scraper.js';

async function run() {
    const $ = await fetchNamuDoc('RESCENE/%EC%9D%8C%EC%95%85%20%EB%B0%A9%EC%86%A1');
    let rows = [];

    $('table').each((_, el) => {
        if (tableKind($, el) !== 'musicshow') return;
        parseMusicShowTable($, el).forEach(r => rows.push(r));
    });

    rows = dedupe(sortByDateDesc(rows));
    console.log(`[scrape_music_shows] 확인한 전체 항목: ${rows.length}건`);
    if (!rows.length) { console.error('결과가 비어 있어 기존 파일은 그대로 둡니다.'); process.exit(1); }

    const result = mergeAppendOnlyNew('js/music_show_data.js', 'MUSIC_SHOW_DATA', rows, r => r.vid);
    console.log(`[scrape_music_shows] MUSIC_SHOW_DATA: 새 항목 ${result.added}건 추가 (총 ${result.total}건)`);
}

run().catch(e => { console.error('[scrape_music_shows] 실패:', e); process.exit(1); });
