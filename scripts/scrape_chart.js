/* ⭐️ 멀티 플랫폼 음원 차트 스크래퍼
   원본 참고: https://github.com/adam-yam/SCENE-FLIX (crawlers/crawl_chart.py) 를 Node.js로 이식.
   멜론/지니/바이브/벅스/FLO/유튜브뮤직(kworb)/스포티파이(kworb)에서 RESCENE 곡을 찾아
   chart/chart_data.json 으로 저장한다. */
import fs from 'fs';
import * as cheerio from 'cheerio';

const OUTPUT_PATH = 'chart/chart_data.json';
const ARTIST_KEYWORDS = ['rescene', '리센느'];

const COMMON_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G991N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
};

function isRescene(artistName) {
    if (!artistName) return false;
    const lowered = String(artistName).toLowerCase();
    return ARTIST_KEYWORDS.some(k => lowered.includes(k));
}

function normalizeTitle(title) {
    if (!title) return '';
    let t = String(title).toLowerCase();
    t = t.replace(/\(.*?\)/g, '');
    t = t.replace(/[^\w가-힣]+/g, '');
    return t.trim();
}

async function safeJson(url, opts) {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

async function fetchMelon() {
    try {
        const data = await safeJson('https://m2.melon.com/m6/chart/ent/songChartList.json', {
            headers: { ...COMMON_HEADERS, Referer: 'https://www.melon.com/' }
        });
        const songList = data?.response?.SONGLIST || [];
        const results = [];
        for (const item of songList) {
            const artistList = item.ARTISTLIST || [];
            const artistName = decodeURIComponent(artistList[0]?.ARTISTNAME || 'Unknown');
            if (!isRescene(artistName)) continue;
            results.push({
                songName: decodeURIComponent(item.SONGNAME || ''),
                artistName,
                albumImageUrl: decodeURIComponent(item.ALBUMIMGPATH || ''),
                rank: item.CURRANK != null ? Number(item.CURRANK) : null,
                previousRank: item.PASTRANK ? Number(item.PASTRANK) : null
            });
        }
        return results;
    } catch (e) { console.error('[melon] 실패:', e.message); return []; }
}

async function fetchGenie() {
    try {
        const data = await safeJson('https://app.genie.co.kr/chart/j_RealTimeRankSongList.json?pg=1&pgsize=100', {
            headers: { ...COMMON_HEADERS, Referer: 'https://www.genie.co.kr/' }
        });
        const items = data?.DataSet?.DATA || [];
        const results = [];
        for (const item of items) {
            const artistName = decodeURIComponent(item.ARTIST_NAME || '');
            if (!isRescene(artistName)) continue;
            results.push({
                songName: decodeURIComponent(item.SONG_NAME || ''),
                artistName,
                albumImageUrl: decodeURIComponent(item.ALBUM_IMG_PATH || ''),
                rank: item.RANK_NO != null ? Number(item.RANK_NO) : null,
                previousRank: item.PRE_RANK_NO ? Number(item.PRE_RANK_NO) : null
            });
        }
        return results;
    } catch (e) { console.error('[genie] 실패:', e.message); return []; }
}

async function fetchVibe() {
    try {
        const data = await safeJson('https://apis.naver.com/vibeWeb/musicapiweb/vibe/v1/chart/track/total?start=1&display=100', {
            headers: { ...COMMON_HEADERS, Referer: 'https://vibe.naver.com/', Origin: 'https://vibe.naver.com', Accept: 'application/json, text/plain, */*' }
        });
        const tracks = data?.response?.result?.chart?.items?.tracks || [];
        const results = [];
        for (const track of tracks) {
            const artists = track.artists || [];
            const artistName = artists.map(a => a.artistName || '').join(', ');
            if (!isRescene(artistName)) continue;
            const rankInfo = track.rank || {};
            const currentRank = rankInfo.currentRank;
            const variation = rankInfo.rankVariation;
            const previousRank = (currentRank != null && variation != null) ? currentRank - variation : null;
            results.push({
                songName: track.trackTitle || '',
                artistName,
                albumImageUrl: track.album?.imageUrl || '',
                rank: currentRank,
                previousRank
            });
        }
        return results;
    } catch (e) { console.error('[vibe] 실패:', e.message); return []; }
}

async function fetchBugs() {
    try {
        const form = new URLSearchParams({ meta_type: 'track', period_tp: 'realtime', svc_type: '20151', size: '100' });
        const res = await fetch('https://m.bugs.co.kr/api/getChartTrack', {
            method: 'POST',
            headers: { ...COMMON_HEADERS, Referer: 'https://music.bugs.co.kr/', 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form
        });
        const data = await res.json();
        const tracks = data.list || [];
        const results = [];
        for (const track of tracks) {
            const artists = track.artists || [];
            const artistName = artists.map(a => a.artist_nm || '').join(', ');
            if (!isRescene(artistName)) continue;
            const rankInfo = track.list_attr || {};
            const imagePath = track.album?.image?.path || '';
            results.push({
                songName: track.track_title || '',
                artistName,
                albumImageUrl: imagePath ? `https://image.bugsm.co.kr/album/images/350${imagePath}` : '',
                rank: rankInfo.rank ?? null,
                previousRank: rankInfo.rank_last ?? null
            });
        }
        return results;
    } catch (e) { console.error('[bugs] 실패:', e.message); return []; }
}

// FLO 앱이 내부적으로 쓰는 비공식 차트 API. 로그인 필요 없음
async function fetchFlo() {
    try {
        const data = await safeJson('https://api.music-flo.com/display/v1/browser/chart/1/list?mixYn=N', {
            headers: { 'User-Agent': 'okhttp/4.9.2', 'x-gm-app-name': 'FLO', 'x-gm-app-version': '' }
        });
        const tracks = data?.data?.trackList || [];
        const results = [];
        tracks.forEach((item, index) => {
            const artistName = item.representationArtist?.name || '';
            if (!isRescene(artistName)) return;
            const rank = index + 1;
            const rankBadge = item.rank?.rankBadge;
            const previousRank = rankBadge != null ? Number(rankBadge) + rank : null;
            let imageUrl = item.album?.imgList?.[0]?.url || '';
            if (imageUrl) imageUrl = imageUrl.replace(/\/dims\/resize\/(\d+)x(\d+)/, '/dims/resize/600x600');
            results.push({ songName: item.name || '', artistName, albumImageUrl: imageUrl, rank, previousRank });
        });
        return results;
    } catch (e) { console.error('[flo] 실패:', e.message); return []; }
}

function parsePreviousRank(rank, change) {
    change = (change || '').trim();
    if (['', '=', 'nan'].includes(change)) return rank;
    if (['RE', 'NEW'].includes(change)) return null;
    const n = parseInt(change, 10);
    return Number.isNaN(n) ? null : rank + n;
}

// 유튜브뮤직/스포티파이는 직접 크롤링이 불안정해서, kworb.net이 정리해둔 표를 대신 사용
async function fetchKworbTable(url, artistFirst) {
    try {
        const res = await fetch(url, { headers: COMMON_HEADERS });
        const html = await res.text();
        const $ = cheerio.load(html);
        const table = $('table').first();
        const results = [];
        table.find('tbody tr').each((_, tr) => {
            const cells = $(tr).find('td');
            if (cells.length < 3) return;
            const rank = parseInt($(cells[0]).text().trim(), 10);
            const change = $(cells[1]).text().trim();
            const cell = $(cells[2]).text().trim();
            if (!isRescene(cell) || Number.isNaN(rank)) return;
            const parts = cell.split(' - ');
            if (parts.length < 2) return;
            const artistName = parts[0].trim();
            let songName = parts.slice(1).join(' - ').trim();
            songName = songName.replace(/\s*\(w\/.*?\)\s*$/, '').trim();
            results.push({ songName, artistName, albumImageUrl: '', rank, previousRank: parsePreviousRank(rank, change) });
        });
        return results;
    } catch (e) { console.error(`[kworb ${url}] 실패:`, e.message); return []; }
}

const fetchYoutubeMusic = () => fetchKworbTable('https://kworb.net/youtube/insights/kr.html');
const fetchSpotify = () => fetchKworbTable('https://kworb.net/spotify/country/kr_daily.html');

const PLATFORM_FETCHERS = {
    melon: fetchMelon,
    genie: fetchGenie,
    vibe: fetchVibe,
    bugs: fetchBugs,
    flo: fetchFlo,
    youtube_music: fetchYoutubeMusic,
    spotify: fetchSpotify
};

function mergePlatformResults(platformResults) {
    const order = ['melon', 'genie', 'vibe', 'bugs', 'flo', 'youtube_music', 'spotify'];
    const merged = {};
    for (const platform of order) {
        for (const entry of platformResults[platform] || []) {
            const key = normalizeTitle(entry.songName);
            if (!key) continue;
            if (!merged[key]) {
                merged[key] = { songName: entry.songName, artistName: entry.artistName, albumImageUrl: entry.albumImageUrl || '', ranks: {} };
            }
            if (!merged[key].albumImageUrl && entry.albumImageUrl) merged[key].albumImageUrl = entry.albumImageUrl;
            merged[key].ranks[platform] = { rank: entry.rank ?? null, previousRank: entry.previousRank ?? null };
        }
    }
    const songs = Object.values(merged);
    songs.sort((a, b) => {
        const ranksA = Object.values(a.ranks).map(v => v.rank).filter(r => r != null);
        const ranksB = Object.values(b.ranks).map(v => v.rank).filter(r => r != null);
        if (ranksA.length !== ranksB.length) return ranksB.length - ranksA.length;
        return (ranksA.length ? Math.min(...ranksA) : 9999) - (ranksB.length ? Math.min(...ranksB) : 9999);
    });
    return songs;
}

// 앨범 이미지가 없는 곡(바이브/스포티파이/유튜브뮤직)은 iTunes -> Deezer 순서로 채워 넣음 (둘 다 API 키 불필요)
async function fetchAlbumImageItunes(artistName, songName) {
    try {
        const params = new URLSearchParams({ term: `${artistName} ${songName}`, entity: 'song', limit: '1' });
        const data = await safeJson(`https://itunes.apple.com/search?${params}`);
        const artwork = data.results?.[0]?.artworkUrl100;
        return artwork ? artwork.replace('100x100bb', '600x600bb') : '';
    } catch (e) { return ''; }
}

async function fetchAlbumImageDeezer(artistName, songName) {
    try {
        const params = new URLSearchParams({ q: `${artistName} ${songName}` });
        const data = await safeJson(`https://api.deezer.com/search?${params}`);
        const album = data.data?.[0]?.album;
        return album?.cover_xl || album?.cover_big || '';
    } catch (e) { return ''; }
}

async function fillMissingAlbumImages(songs) {
    for (const song of songs) {
        if (song.albumImageUrl) continue;
        let image = await fetchAlbumImageItunes(song.artistName, song.songName);
        if (!image) image = await fetchAlbumImageDeezer(song.artistName, song.songName);
        if (image) song.albumImageUrl = image;
    }
    return songs;
}

async function run() {
    const platformResults = {};
    for (const [name, fetcher] of Object.entries(PLATFORM_FETCHERS)) {
        platformResults[name] = await fetcher();
        console.log(`[${name}] ${platformResults[name].length}곡 발견`);
    }

    let songs = mergePlatformResults(platformResults);
    songs = await fillMissingAlbumImages(songs);

    const output = {
        updatedAt: new Date().toISOString(),
        platforms: Object.keys(PLATFORM_FETCHERS),
        songs
    };

    fs.mkdirSync('chart', { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    console.log(`총 ${songs.length}곡을 ${OUTPUT_PATH}에 저장했습니다.`);
}

run().catch(e => { console.error('[scrape_chart] 실패:', e); process.exit(1); });
