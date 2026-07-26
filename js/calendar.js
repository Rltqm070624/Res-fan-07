let currentCalYear = 2026; 
let currentCalMonth = 7;
let scheduleDB = {}; 

async function loadScheduleData() {
    try {
        // GitHub Action이 6시간마다 만들어두는 안전한 JSON 파일을 가져옴
        const response = await fetch('schedule_data.json?t=' + new Date().getTime());
        scheduleDB = await response.json();
    } catch (error) {
        console.warn("스케줄 데이터를 불러오는 데 실패했습니다.", error);
    }
    renderCalendar();
}

function changeMonth(delta) { 
    currentCalMonth += delta; 
    if(currentCalMonth > 12) { currentCalMonth = 1; currentCalYear++; } 
    else if(currentCalMonth < 1) { currentCalMonth = 12; currentCalYear--; } 
    
    // ⭐️ 버튼 누를 때마다 서버 통신 X -> 렌더링만 0.01초만에 다시 함
    renderCalendar(); 
}

function renderCalendar() { 
    const calendarDays = document.getElementById('calendarDays'); 
    document.getElementById('calendarMonthText').innerText = `${currentCalYear}. ${String(currentCalMonth).padStart(2, '0')}`; 
    const firstDayIndex = new Date(currentCalYear, currentCalMonth - 1, 1).getDay(); 
    const lastDate = new Date(currentCalYear, currentCalMonth, 0).getDate(); 
    
    let html = ''; 
    for (let i = 0; i < firstDayIndex; i++) { html += `<div class="day-cell empty"></div>`; } 
    for (let i = 1; i <= lastDate; i++) { 
        const dateKey = `${currentCalYear}-${String(currentCalMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`; 
        const data = scheduleDB[dateKey]; 
        const hasEvent = data && data.items && data.items.length > 0 ? 'has-event' : ''; 
        
        let eventsHtml = ''; 
        if (data && data.items) { 
            data.items.forEach(item => { 
                let dotColor = item.color ? item.color : 'var(--c-accent)'; 
                eventsHtml += `<div class="cal-event-row"><div class="cal-dot" style="background: ${dotColor}; box-shadow: 0 0 6px ${dotColor}60;"></div><div class="cal-event-time" style="color: ${dotColor};">${item.time}</div><div class="cal-event-title">${item.title}</div></div>`; 
            }); 
        } 
        html += `<div class="day-cell ${hasEvent}" onclick="openModal('${currentCalYear}', '${currentCalMonth}', '${i}', '${dateKey}')"><span class="day-number">${i}</span><div class="cell-event-list">${eventsHtml}</div></div>`; 
    } 
    calendarDays.innerHTML = html; 
}

function openCalendarPopup() { 
    document.getElementById('calendarPopupModal').classList.add('active'); 
    document.getElementById('calPopupBackdrop').classList.add('active'); 
    document.body.style.overflow = 'hidden'; 
}

function closeCalendarPopup() { 
    document.getElementById('calendarPopupModal').classList.remove('active'); 
    document.getElementById('calPopupBackdrop').classList.remove('active'); 
    document.body.style.overflow = 'auto'; 
}

function openModal(year, month, day, dateKey) {
    const dateTitle = (typeof tDate === 'function') ? tDate(year, month, day) : `${year}년 ${month}월 ${day}일`;
    document.getElementById('modalDateTitle').innerText = dateTitle;
    
    const data = scheduleDB[dateKey]; let scheduleHtml = '';
    if (data && data.items && data.items.length > 0) {
        scheduleHtml += `<div class="schedule-detail-card"><div class="sd-body">`;
        data.items.forEach(item => { 
            let dotColor = item.color ? item.color : 'var(--c-accent)'; 
            scheduleHtml += `<div class="sd-row"><div class="sd-dot" style="background: ${dotColor}; box-shadow: 0 0 8px ${dotColor}60;"></div><div class="sd-time" style="color: ${dotColor};">${item.time}</div><div class="sd-title">${item.title}</div></div>`; 
            if (item.image) { scheduleHtml += `<div class="sd-img-wrapper"><img src="${item.image}" alt="${item.title}" onerror="this.style.display='none'"></div>`; } 
        });
        scheduleHtml += `</div></div>`;
    } else {
        const emptyMsg = (typeof t === 'function') ? t('noSchedule') : '등록된 일정이 없습니다.';
        scheduleHtml = `<div class="schedule-detail-empty">${emptyMsg}</div>`;
    }
    document.getElementById('modalScheduleText').innerHTML = scheduleHtml;
    document.getElementById('scheduleModal').classList.add('active');
    document.getElementById('modalBackdrop').classList.add('active');
}

function closeModal() { 
    document.getElementById('scheduleModal').classList.remove('active'); 
    document.getElementById('modalBackdrop').classList.remove('active'); 
    if(!document.getElementById('calendarPopupModal').classList.contains('active')){ document.body.style.overflow = 'auto'; } 
}

// 초기 렌더링 시 안전한 JSON 파일 불러오기
window.addEventListener('DOMContentLoaded', () => { 
    loadScheduleData(); 
});
