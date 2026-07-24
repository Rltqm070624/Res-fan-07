import { MelonChart } from 'melona';
import fs from 'fs';

function isRescene(artistName) {
    if (!artistName) return false;
    const target = String(artistName).toUpperCase();
    return target.includes('RESCENE') || target.includes('리센느');
}

async function scrapeCharts() {
    const finalData = {
        "Melon": { "실시간 (TOP 100)": [], "일간": [] },
        "Bugs": { "실시간": [], "일간": [] },
        "Genie": { "실시간": [], "일간": [] },
        "FLO": { "24시간": [] },
        "VIBE": { "실시간": [] },
        "Circle Chart": { "일간": [], "주간": [] },
        "Spotify KR": { "Daily": [] },
        "YouTube Music": { "일간": [] },
        "Apple Music": { "일간": [] },
        "Hanteo Chart": { "실시간": [] }
    };

    try {
        const melonChart = new MelonChart({ timeout: 15000 });
        const chart = await melonChart.getChart();
        const resceneSongs = chart.filter(song => isRescene(song.artist));

        finalData["Melon"]["실시간 (TOP 100)"] = resceneSongs.map(song => ({
            title: song.title,
            rank: song.rank,
            diff: "진입" 
        }));
    } catch (error) {
        console.error("Melon 에러:", error);
    }

    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kst = new Date(utc + (9 * 60 * 60 * 1000));
    
    const pad = num => String(num).padStart(2, '0');
    const updateTime = `${kst.getFullYear()}. ${pad(kst.getMonth() + 1)}. ${pad(kst.getDate())} ${pad(kst.getHours())}:${pad(kst.getMinutes())} 기준`;

    const output = { update_time: updateTime, charts: finalData };
    fs.writeFileSync('chart_data.json', JSON.stringify(output, null, 4), 'utf-8');
}

scrapeCharts();
