import fs from 'fs';

async function fetchSchedules() {
    // ⭐️ 주소를 직접 노출하지 않고, 깃허브에 숨겨둔 환경변수를 불러옵니다.
    const targetUrl = process.env.SECRET_DATA_URL;
    const filePath = 'schedule_data.json';

    if (!targetUrl) {
        console.error("숨겨진 URL을 찾을 수 없습니다. GitHub Secrets 설정을 확인해주세요.");
        return;
    }

    try {
        console.log("데이터를 조용히 가져오는 중...");
        const response = await fetch(targetUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rawData = await response.json();
        const currentYear = new Date().getFullYear().toString(); 
        
        let filteredDB = {};
        
        for (const dateKey in rawData) {
            if (dateKey.startsWith(currentYear)) {
                filteredDB[dateKey] = rawData[dateKey];
            }
        }

        if (Object.keys(filteredDB).length === 0) {
            console.log("데이터 구조 차이로 원본 데이터를 통째로 저장합니다.");
            filteredDB = rawData;
        }

        fs.writeFileSync(filePath, JSON.stringify(filteredDB, null, 2), 'utf-8');
        console.log(`✅ ${currentYear}년도 스케줄 데이터 무사히 연동 완료!`);
        
    } catch (error) {
        console.error("데이터 가져오기 실패:", error.message);
    }
}

fetchSchedules();
