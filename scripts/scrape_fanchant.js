import fs from 'fs';
import { fetchNamuDoc, extractVideoId, mergeAppendOnlyNew } from '../js-tools/wi_scraper.js';

function htmlToLyricsText(html) {
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?(strong|b)[^>]*>/gi, m => m.startsWith('</') ? '**' : '**')
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
        .replace(/<img[\s\S]*?>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
        .split('\n').map(s => s.trim()).filter(Boolean).join('\n');
}

async function run() {
    const $ = await fetchNamuDoc('RESCENE/%EC%9D%91%EC%9B%90%EB%B2%95');
    const songs = [];

    let currentAlbum = '';
    let currentSong = '';

    $('h2,h3,h4,table').each((_, el) => {
        const $el = $(el);
        if (el.tagName && /^h[2-4]$/i.test(el.tagName)) {
            const text = $el.text().replace(/\[편집\]/, '').trim();
            if (/^\d+(\.\d+)*\.?\s/.test(text) || text) {
                // h2 -> 앨범명(《..》), h3 -> 곡명
                if (el.tagName.toLowerCase() === 'h2') { currentAlbum = text.replace(/^[\d.]+\s*/, ''); currentSong = ''; }
                else { currentSong = text.replace(/^[\d.]+\s*/, ''); }
            }
            return;
        }
        // table: 응원법 본문 (제목 행 + 영상 + 사진 + 가사)
        if (!currentSong) return;
        const $table = $(el);
        const tableText = $table.text();
        if (!/응원법/.test(tableText)) return; // 응원법 표만 처리

        const iframeSrc = $table.find('iframe').attr('src');
        const linkHref = $table.find('a[href*="youtu"]').first().attr('href');
        const vid = extractVideoId(iframeSrc || linkHref);

        const img = $table.find('img').filter((i, im) => {
            const src = $(im).attr('src') || '';
            return /i\.namu\.wiki/.test(src) && !/svg\+xml/.test(src);
        }).first().attr('src');

        const html = $table.html() || '';
        const lyrics = htmlToLyricsText(html);
        if (!lyrics) return;

        songs.push({
            album: currentAlbum,
            song: currentSong,
            vid: vid || null,
            image: img ? (img.startsWith('//') ? `https:${img}` : img) : null,
            lyrics
        });
    });

    console.log(`[scrape_fanchant] 확인한 전체 곡: ${songs.length}곡`);
    if (!songs.length) { console.error('결과가 비어 있어 기존 파일은 그대로 둡니다.'); process.exit(1); }

    fs.mkdirSync('fanchant', { recursive: true });
    const result = mergeAppendOnlyNew('fanchant/fanchant_data.js', 'FANCHANT_DATA', songs, r => `${r.album}__${r.song}`);
    console.log(`[scrape_fanchant] FANCHANT_DATA: 새 곡 ${result.added}건 추가 (총 ${result.total}곡)`);
}

run().catch(e => { console.error('[scrape_fanchant] 실패:', e); process.exit(1); });
