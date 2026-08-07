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
        let fetchedEvents;
        if (rawData && Array.isArray(rawData.events)) {
            fetchedEvents = rawData.events;
        } else {
            const currentYear = new Date().getFullYear().toString();
            let filteredDB = {};
            for (const dateKey in rawData) {
                if (dateKey.startsWith(currentYear)) {
                    filteredDB[dateKey] = rawData[dateKey];
                }
            }
            const output = Object.keys(filteredDB).length > 0 ? filteredDB : rawData;
            // 옛날 형태({날짜: {...}})는 이벤트 배열로 변환
            fetchedEvents = Object.keys(output).map(dateKey => Object.assign({ date: dateKey }, output[dateKey]));
        }


        let existingEvents = [];
        try {
            const existingRaw = fs.readFileSync(filePath, 'utf-8');
            const existingJson = JSON.parse(existingRaw);
            if (existingJson && Array.isArray(existingJson.events)) existingEvents = existingJson.events;
        } catch (e) {
            // 기존 파일이 없거나 파싱 실패해도 무시하고 새 데이터로 진행
        }

        const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const pastEvents = existingEvents.filter(ev => ev.date && ev.date < todayKey);

        // 오늘/이후 구간은 새로 받아온 데이터로 교체하되, 혹시 겹치는 항목은 제목+날짜 기준으로 중복 제거
        const seen = new Set(pastEvents.map(ev => `${ev.date}__${ev.title}`));
        const mergedFuture = [];
        fetchedEvents.forEach(ev => {
            if (!ev || !ev.date) return;
            const key = `${ev.date}__${ev.title}`;
            if (seen.has(key)) return;
            seen.add(key);
            mergedFuture.push(ev);
        });

        const mergedEvents = pastEvents.concat(mergedFuture).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        const output = { updated: new Date().toISOString(), events: mergedEvents };

        fs.writeFileSync(filePath, JSON.stringify(output, null, 2), 'utf-8');
        console.log(`✅ 스케줄 데이터 연동 완료! (${filePath}) — 과거 ${pastEvents.length}건 보존, 신규/예정 ${mergedFuture.length}건 갱신`);

    } catch (error) {
        console.error("데이터 가져오기 실패:", error.message);
        process.exitCode = 1;
    }
}

fetchSchedules();
