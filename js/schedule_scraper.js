import fs from 'fs';

async function fetchSchedules() {
    // ⭐️ 상대방 팬사이트의 Raw JSON 데이터 주소
    const targetUrl = 'https://raw.githubusercontent.com/Adam-yam/SCENE-FLIX/refs/heads/main/data/schedule.json';
    const filePath = 'schedule_data.json';

    try {
        console.log("데이터를 조용히 가져오는 중...");
        const response = await fetch(targetUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rawData = await response.json();
        
        // 코드가 실행되는 시점의 '올해 연도' 구하기 (예: 2026)
        const currentYear = new Date().getFullYear().toString(); 
        
        let filteredDB = {};
        
        // 상대방 데이터 구조에서 '올해(2026-)'로 시작하는 날짜 데이터만 필터링해서 담기
        for (const dateKey in rawData) {
            if (dateKey.startsWith(currentYear)) {
                filteredDB[dateKey] = rawData[dateKey];
            }
        }

        // 안전장치: 만약 상대방 JSON 구조가 달라서 필터링된 게 없다면 원본 통째로 저장
        if (Object.keys(filteredDB).length === 0) {
            console.log("데이터 구조 차이로 원본 데이터를 통째로 저장합니다.");
            filteredDB = rawData;
        }

        // 내 저장소에 JSON 파일로 예쁘게 덮어쓰기
        fs.writeFileSync(filePath, JSON.stringify(filteredDB, null, 2), 'utf-8');
        console.log(`✅ ${currentYear}년도 스케줄 데이터 무사히 연동 완료!`);
        
    } catch (error) {
        console.error("데이터 가져오기 실패:", error.message);
    }
}

fetchSchedules();
