import { fetchNamuDoc, parseSimpleTable, tableKind, sortByDateDesc, dedupe, mergeAppendOnlyNew } from '../js-tools/wi_scraper.js';

async function run() {
    const $ = await fetchNamuDoc('RESCENE/%EB%9D%BC%EC%9D%B4%EB%B8%8C%20%EB%B0%A9%EC%86%A1');
    let rows = [];
    let lastCast = '전원';

    $('table').each((_, el) => {
        // 라이브 방송 표는 날짜 | 제목 | 출연 멤버 | 비고 순서 (3번째 칸이 출연자)
        const kind = tableKind($, el);
        if (kind !== 'simple') return;

        const parsed = parseSimpleTable($, el, ($$, tr, cells) => {
            const castText = cells.length >= 3 ? cells.eq(2).text().trim() : '';
            if (castText) lastCast = castText.replace(/\[\d+\]/g, '').trim();
            return { cast: lastCast };
        });
        parsed.forEach(r => rows.push({ date: r.date, title: r.title, cast: r.cast, vid: r.vid }));
    });

    rows = dedupe(sortByDateDesc(rows));
    console.log(`[scrape_live] 나무위키에서 확인한 전체 항목: ${rows.length}건`);
    if (!rows.length) { console.error('결과가 비어 있어 기존 파일은 그대로 둡니다.'); process.exit(1); }

    const result = mergeAppendOnlyNew('js/live_data.js', 'LIVE_DATA', rows, r => r.vid);
    console.log(`[scrape_live] LIVE_DATA: ${result.mode === "full_resync" ? "전체 재동기화" : "새 항목 " + result.added + "건 추가"} (총 ${result.total}건)`);
}

run().catch(e => { console.error('[scrape_live] 실패:', e); process.exit(1); });
