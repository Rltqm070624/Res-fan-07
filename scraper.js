import { MelonChart } from 'melona';
import fs from 'fs';

// 트래킹할 리센느 곡 목록 (추후 신곡 발매 시 여기에 추가)
const TRACK_LIST = ["LOVE ATTACK", "Pretty Girl", "Deja Vu", "Runaway"];

function isRescene(artistName) {
    if (!artistName) return false;
    const target = String(artistName).toUpperCase();
    return target.includes('RESCENE') || target.includes('리센느');
}

// 순위 변동 계산 함수
function getDiffText(rank, lastRank) {
    if (!lastRank || lastRank === 0 || lastRank === 999) return "NEW";
    const diff = lastRank - rank;
    if (diff > 0) return `▲ ${diff}`; // 상승 (이전 순위가 더 컸음)
    if (diff < 0) return `▼ ${Math.abs(diff)}`; // 하락
    return "-"; // 변동 없음
}

// 벅스 차트 가져오기 함수 (bugs.py 로직 Node.js화)
async function getBugsChart(period = 'realtime') {
    const url = "https://m.bugs.co.kr/api/getChartTrack";
    const formData = new URLSearchParams();
    formData.append("period_tp", period); // realtime, day, week
    formData.append("svc_type", "20151"); // 20151: 전체
    formData.append("size", "100");

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });
        const data = await res.json();
        return data.list || [];
    } catch (error) {
        console.error(`Bugs ${period} 차트 에러:`, error);
        return [];
    }
}

async function scrapeCharts() {
    // 1. 곡별 기본 데이터 구조 뼈대 세팅
    const songsData = {};
    TRACK_LIST.forEach(title => {
        songsData[title] = {
            "Melon": { "실시간 (HOT100)": null, "일간": null, "주간": null, "월간": null },
            "Bugs": { "실시간": null, "일간": null },
            "Genie": { "실시간": null, "일간": null },
            // 필요한 플랫폼 계속 추가...
        };
    });

    // 2. Melon 크롤링
    try {
        const melonChart = new MelonChart({ timeout: 15000 });
        const chart = await melonChart.getChart();
        chart.forEach(song => {
            if (isRescene(song.artist) && songsData[song.title]) {
                songsData[song.title]["Melon"]["실시간 (HOT100)"] = {
                    rank: song.rank,
                    diff: "NEW" // 멜론 API 라이브러리가 이전 순위를 제공하면 함수로 처리 가능
                };
            }
        });
    } catch (error) {
        console.error("Melon 에러:", error);
    }

    // 3. Bugs 크롤링 (실시간)
    try {
        const bugsRealtime = await getBugsChart('realtime');
        bugsRealtime.forEach(item => {
            const title = item.track_title;
            const artist = item.artists[0]?.artist_nm;
            const rank = parseInt(item.list_attr.rank);
            const lastRank = parseInt(item.list_attr.rank_last);

            if (isRescene(artist) && songsData[title]) {
                songsData[title]["Bugs"]["실시간"] = {
                    rank: rank,
                    diff: getDiffText(rank, lastRank)
                };
            }
        });
    } catch (error) {
        console.error("Bugs 실시간 연동 에러:", error);
    }

    // 시간 생성
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kst = new Date(utc + (9 * 60 * 60 * 1000));
    
    const pad = num => String(num).padStart(2, '0');
    const updateTime = `${kst.getFullYear()}. ${pad(kst.getMonth() + 1)}. ${pad(kst.getDate())} ${pad(kst.getHours())}:${pad(kst.getMinutes())} 기준`;

    // JSON 출력
    const output = { update_time: updateTime, songs: songsData };
    fs.writeFileSync('chart_data.json', JSON.stringify(output, null, 4), 'utf-8');
}

scrapeCharts();
