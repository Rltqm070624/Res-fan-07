import { fetchNamuDoc, parseSimpleTable, tableKind, sortByDateDesc, dedupe, mergeAppendOnlyNew } from '../js-tools/wi_scraper.js';

async function run() {
    const $ = await fetchNamuDoc('RESCENE/%EA%B3%B5%EC%97%B0%20%EB%B0%8F%20%ED%96%89%EC%82%AC');
    let rows = [];

    $('table').each((_, el) => {
        if (tableKind($, el) !== 'simple') return;
        parseSimpleTable($, el).forEach(r => rows.push({ date: r.date, title: r.title, vid: r.vid }));
    });

    rows = dedupe(sortByDateDesc(rows));
    console.log(`[scrape_events] 전체 항목: ${rows.length}건`);
    if (!rows.length) { console.error('결과가 비어 있어 기존 파일은 그대로 둡니다.'); process.exit(1); }

    const result = mergeAppendOnlyNew('js/event_data.js', 'EVENT_DATA', rows, r => r.vid);
    console.log(`[scrape_events] EVENT_DATA: 새 항목 ${result.added}건 추가 (총 ${result.total}건)`);
}

run().catch(e => { console.error('[scrape_events] 실패:', e); process.exit(1); });
