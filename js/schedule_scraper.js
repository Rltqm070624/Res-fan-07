import fs from 'fs';

async function fetchSchedules() {
    let scheduleDB = {};
    const filePath = 'schedule_data.json';

    // 1. 기존에 저장된 데이터 불러오기 (과거 데이터를 날리지 않고 유지)
    if (fs.existsSync(filePath)) {
        try {
            const rawData = fs.readFileSync(filePath, 'utf-8');
            scheduleDB = JSON.parse(rawData);
        } catch (e) {
            console.error("기존 데이터 파싱 실패, 새로 시작합니다.");
        }
    }

    const colorMap = { 
        "방송": "#7e57c2", "팬사인회": "#ec407a", "행사": "#66bb6a", 
        "공연": "#26c6da", "라디오": "#ffa726", "공지": "#78909c" 
    };

    // 2. 현재 달력을 기준으로 '이번 달' 시작일과 종료일 계산
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0);
    const currentMonthLastDay = new Date(currentYear, currentMonth, 0);

    const formatUTC = (d, h, m, s) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(h).padStart(2, '0')}%3A${String(m).padStart(2, '0')}%3A${String(s).padStart(2, '0')}Z`;
    };

    const startAt = formatUTC(prevMonthLastDay, 15, 0, 0);
    const endAt = formatUTC(currentMonthLastDay, 14, 59, 59);
    const startAtForAllDay = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endAtForAllDay = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentMonthLastDay.getDate()).padStart(2, '0')}`;

    const apiUrl = `https://artist.mnetplus.world/svc/stg/rescene-official/space/api/v1/calendar?endAt=${endAt}&endAtForAllDay=${endAtForAllDay}&startAt=${startAt}&startAtForAllDay=${startAtForAllDay}`;

    try {
        const response = await fetch(apiUrl);
        if (response.ok) {
            const rawData = await response.json();
            const events = rawData.data || rawData.events || [];
            const eventList = Array.isArray(events) ? events : (events.calendar || events.items || []);

            // ⭐️ 핵심 로직: 이번 달 일정만 싹 비운 뒤 다시 채웁니다. (일정이 취소되거나 변경된 경우를 반영하기 위함)
            const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
            for (let key in scheduleDB) {
                if (key.startsWith(monthPrefix)) {
                    delete scheduleDB[key];
                }
            }

            eventList.forEach(ev => {
                const title = ev.title || ev.eventName || ev.name || "스케줄";
                const startTimeStr = ev.startAt || ev.startDate || ev.date;
                if (!startTimeStr) return;

                let category = "공지";
                if (ev.categoryType) category = ev.categoryType;
                else if (ev.scheduleCategory && ev.scheduleCategory.name) category = ev.scheduleCategory.name;

                const dateObj = new Date(startTimeStr);
                const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                const timeKey = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

                if (!scheduleDB[dateKey]) scheduleDB[dateKey] = { items: [] };
                
                const isExist = scheduleDB[dateKey].items.some(i => i.title === title && i.time === timeKey);
                if (!isExist) {
                    scheduleDB[dateKey].items.push({
                        time: timeKey,
                        title: title,
                        color: colorMap[category] || "var(--c-accent)",
                        image: ev.imageUrl || ""
                    });
                }
            });
        }
    } catch (error) {
        console.error(`Fetch Error:`, error.message);
    }

    // 3. 업데이트된 데이터를 다시 파일로 덮어쓰기
    fs.writeFileSync(filePath, JSON.stringify(scheduleDB, null, 2), 'utf-8');
    console.log("✅ 이번 달 스케줄 업데이트 완료 (과거 데이터는 유지됨!)");
}

fetchSchedules();
