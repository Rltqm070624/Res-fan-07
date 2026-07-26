const fs = require('fs');

async function fetchSchedules() {
    let scheduleDB = {};
    const colorMap = { 
        "방송": "#7e57c2", "팬사인회": "#ec407a", "행사": "#66bb6a", 
        "공연": "#26c6da", "라디오": "#ffa726", "공지": "#78909c" 
    };

    // 2024년부터 2026년까지 넉넉하게 긁어옵니다. (안전하게 월별 순회 요청)
    for (let year = 2024; year <= 2026; year++) {
        for (let month = 1; month <= 12; month++) {
            const prevMonthLastDay = new Date(year, month - 1, 0);
            const currentMonthLastDay = new Date(year, month, 0);

            const formatUTC = (d, h, m, s) => {
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(h).padStart(2, '0')}%3A${String(m).padStart(2, '0')}%3A${String(s).padStart(2, '0')}Z`;
            };

            const startAt = formatUTC(prevMonthLastDay, 15, 0, 0);
            const endAt = formatUTC(currentMonthLastDay, 14, 59, 59);
            const startAtForAllDay = `${year}-${String(month).padStart(2, '0')}-01`;
            const endAtForAllDay = `${year}-${String(month).padStart(2, '0')}-${String(currentMonthLastDay.getDate()).padStart(2, '0')}`;

            const apiUrl = `https://artist.mnetplus.world/svc/stg/rescene-official/space/api/v1/calendar?endAt=${endAt}&endAtForAllDay=${endAtForAllDay}&startAt=${startAt}&startAtForAllDay=${startAtForAllDay}`;

            try {
                const response = await fetch(apiUrl);
                if (!response.ok) continue;
                const rawData = await response.json();
                
                const events = rawData.data || rawData.events || [];
                const eventList = Array.isArray(events) ? events : (events.calendar || events.items || []);

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
                    
                    // 중복 등록 방지
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
            } catch (error) {
                console.error(`[${year}-${month}] Fetch Error:`, error.message);
            }
        }
    }

    // 최종 데이터를 JSON 파일로 덮어쓰기
    fs.writeFileSync('schedule_data.json', JSON.stringify(scheduleDB, null, 2), 'utf-8');
    console.log("✅ 스케줄 데이터 업데이트 완료!");
}

fetchSchedules();
