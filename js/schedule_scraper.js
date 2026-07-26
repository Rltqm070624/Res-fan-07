import fs from 'fs';

async function fetchSchedules() {
    const targetUrl = process.env.SECRET_DATA_URL;
    const filePath = 'js/schedule_data.json';

    if (!targetUrl) {
        console.error("SECRET_DATA_URL이 비어있습니다. GitHub Secrets 설정을 확인해주세요.");
        process.exitCode = 1;
        return;
    }

    try {
        console.log("데이터를 가져오는 중...");
        const response = await fetch(targetUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawData = await response.json();

        // rawData가 { events: [...] } 형태면 그대로 사용,
        // 아니면(날짜를 key로 갖는 옛날 형태면) 그 해만 걸러서 사용
        let output;
        if (rawData && Array.isArray(rawData.events)) {
            output = rawData;
        } else {
            const currentYear = new Date().getFullYear().toString();
            let filteredDB = {};
            for (const dateKey in rawData) {
                if (dateKey.startsWith(currentYear)) {
                    filteredDB[dateKey] = rawData[dateKey];
                }
            }
            output = Object.keys(filteredDB).length > 0 ? filteredDB : rawData;
        }

        fs.writeFileSync(filePath, JSON.stringify(output, null, 2), 'utf-8');
        console.log(`✅ 스케줄 데이터 연동 완료! (${filePath})`);

    } catch (error) {
        console.error("데이터 가져오기 실패:", error.message);
        process.exitCode = 1;
    }
}

fetchSchedules();
