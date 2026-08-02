import 'dotenv/config';
import fs from 'fs';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const OUTPUT_PATH = 'js/shorts_data.js';
const TAGS = [
    { key: 'rescene', label: '리센느', query: '리센느 RESCENE shorts' },
    { key: 'woni',    label: '원이',   query: '리센느 원이 shorts' },
    { key: 'liv',     label: '리브',   query: '리센느 리브 shorts' },
    { key: 'minami',  label: '미나미', query: '리센느 미나미 shorts' },
    { key: 'may',     label: '메이',   query: '리센느 메이 shorts' },
    { key: 'zena',    label: '제나',   query: '리센느 제나 shorts' }
];

const MEMBER_ALIASES = {
    woni: ['원이'],
    liv: ['리브'],
    minami: ['미나미'],
    may: ['메이'],
    zena: ['제나']
};

const REQUIRED_KEYWORDS = ['리센느', 'rescene', 'RESCENE'];

function parseISODuration(iso) {
    const m = String(iso || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return 9999;
    const h = parseInt(m[1] || 0, 10);
    const min = parseInt(m[2] || 0, 10);
    const s = parseInt(m[3] || 0, 10);
    return h * 3600 + min * 60 + s;
}

function containsRescene(text) {
    const t = String(text || '');
    return REQUIRED_KEYWORDS.some(kw => t.toLowerCase().includes(kw.toLowerCase()));
}

async function fetchJson(url) {
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) {
        console.warn(`⚠️ API 오류: ${data.error.message} (code ${data.error.code})`);
        return null;
    }
    return data;
}

async function searchShortsForTag(tag) {
    const searchUrl =
        `https://www.googleapis.com/youtube/v3/search` +
        `?part=snippet&type=video&videoDuration=short&order=date&maxResults=20` +
        `&q=${encodeURIComponent(tag.query)}&key=${YOUTUBE_API_KEY}`;

    const searchData = await fetchJson(searchUrl);
    if (!searchData || !searchData.items || !searchData.items.length) return [];

    const ids = searchData.items.map(i => i.id && i.id.videoId).filter(Boolean);
    if (!ids.length) return [];

    // search.list의 videoDuration=short는 "4분 미만"만 보장하므로,
    // videos.list로 실제 재생시간(60초 이하)까지 재확인한다.
    const detailUrl =
        `https://www.googleapis.com/youtube/v3/videos` +
        `?part=contentDetails,snippet&id=${ids.join(',')}&key=${YOUTUBE_API_KEY}`;

    const detailData = await fetchJson(detailUrl);
    if (!detailData || !detailData.items) return [];

    return detailData.items
        .filter(v => parseISODuration(v.contentDetails.duration) <= 60)
        .filter(v => containsRescene(v.snippet.title) || containsRescene(v.snippet.description))
        .map(v => {
            const text = `${v.snippet.title} ${v.snippet.description}`;
            const tagSet = new Set([tag.key]);
            Object.entries(MEMBER_ALIASES).forEach(([memberKey, aliases]) => {
                if (aliases.some(a => text.includes(a))) tagSet.add(memberKey);
            });
            return {
                vid: v.id,
                title: v.snippet.title,
                channel: v.snippet.channelTitle,
                date: (v.snippet.publishedAt || '').slice(0, 10),
                tags: Array.from(tagSet)
            };
        });
}

function dedupe(items) {
    const map = new Map();
    for (const item of items) {
        if (!map.has(item.vid)) {
            map.set(item.vid, item);
        } else {
            const existing = map.get(item.vid);
            existing.tags = Array.from(new Set([...existing.tags, ...item.tags]));
        }
    }
    return Array.from(map.values());
}

async function main() {
    if (!YOUTUBE_API_KEY) {
        console.error('❌ YOUTUBE_API_KEY가 설정되지 않았습니다.');
        console.error('   로컬: 프로젝트 루트에 .env 파일을 만들고 YOUTUBE_API_KEY=발급받은키 를 적어주세요.');
        console.error('   GitHub Actions: 레포 Settings > Secrets and variables > Actions 에서 YOUTUBE_API_KEY를 등록해주세요.');
        process.exit(1);
    }

    let all = [];
    for (const tag of TAGS) {
        console.log(`"#${tag.label}" 쇼츠 검색 중...`);
        const items = await searchShortsForTag(tag);
        console.log(`  → ${items.length}건 발견`);
        all = all.concat(items);
        await new Promise(r => setTimeout(r, 300)); // 쿼터 배려용 딜레이
    }

    all = dedupe(all);
    all.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    const fileContent =
        `/* ⭐️ RESCENE SHORTS 데이터 — scripts/scrape_shorts.js 로 자동 생성됨 (${new Date().toISOString()}) */\n\n` +
        `const SHORTS_DATA = ${JSON.stringify(all, null, 4)};\n`;

    fs.mkdirSync('js', { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, fileContent, 'utf-8');
    console.log(`✅ 완료: ${all.length}건을 ${OUTPUT_PATH} 에 저장했습니다.`);
}

main().catch(err => {
    console.error('쇼츠 수집 중 오류 발생:', err);
    process.exit(1);
});
