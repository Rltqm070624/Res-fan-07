let currentCalYear = new Date().getFullYear(); 
let currentCalMonth = new Date().getMonth() + 1;
let scheduleDB = {}; 

const colorMap = { 
    "broadcast": "#7e57c2", 
    "fansign": "#ec407a",   
    "event": "#66bb6a",     
    "concert": "#26c6da",   
    "radio": "#ffa726",     
    "notice": "#78909c"     
};

async function loadScheduleData() {
    try {
        const response = await fetch('js/schedule_data.json?t=' + new Date().getTime());
        const rawData = await response.json();
        
        scheduleDB = {}; 

        if (rawData && rawData.events && Array.isArray(rawData.events)) {
            rawData.events.forEach(ev => {
                const dateKey = ev.date;
                if (!dateKey) return;
                
                if (!scheduleDB[dateKey]) {
                    scheduleDB[dateKey] = { items: [] };
                }
                
                scheduleDB[dateKey].items.push({
                    time: ev.time || "",
                    title: ev.title,
                    color: colorMap[ev.type] || "var(--c-accent)",
                    image: ""
                });
            });
        }
    } catch (error) {
        console.warn("스케줄 데이터를 불러오는 데 실패했습니다.", error);
    }
    renderCalendar();
}

function changeMonth(delta) { 
    currentCalMonth += delta; 
    if(currentCalMonth > 12) { currentCalMonth = 1; currentCalYear++; } 
    else if(currentCalMonth < 1) { currentCalMonth = 12; currentCalYear--; } 
    
    renderCalendar(); 
}

function renderCalendar() { 
    const calendarDays = document.getElementById('calendarDays'); 
    if (!calendarDays) return; // ⭐️ 달력 HTML을 못 찾으면 뻗지 않고 그냥 멈춤 (에러 방지)
    
    calendarDays.style.gridTemplateRows = 'repeat(6, 1fr)';

    const monthText = document.getElementById('calendarMonthText');
    if(monthText) monthText.innerText = `${currentCalYear}. ${String(currentCalMonth).padStart(2, '0')}`; 
    
    const firstDayIndex = new Date(currentCalYear, currentCalMonth - 1, 1).getDay(); 
    const lastDate = new Date(currentCalYear, currentCalMonth, 0).getDate(); 
    
    let html = ''; 
    for (let i = 0; i < firstDayIndex; i++) { 
        html += `<div class="day-cell empty"></div>`; 
    } 
    
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

    const totalCells = firstDayIndex + lastDate;
    const remainingCells = 42 - totalCells;
    for (let i = 0; i < remainingCells; i++) {
        html += `<div class="day-cell empty"></div>`;
    }

    calendarDays.innerHTML = html; 
}

function openCalendarPopup() { 
    const modal = document.getElementById('calendarPopupModal');
    const backdrop = document.getElementById('calPopupBackdrop');
    // ⭐️ 모달창 HTML이 존재하는지 무조건 확인하고 염
    if(modal && backdrop) {
        modal.classList.add('active'); 
        backdrop.classList.add('active'); 
        document.body.style.overflow = 'hidden'; 
    } else {
        console.error("모달창 HTML 요소를 찾을 수 없습니다! index.html을 확인하세요.");
    }
}

function closeCalendarPopup() { 
    const modal = document.getElementById('calendarPopupModal');
    const backdrop = document.getElementById('calPopupBackdrop');
    if(modal) modal.classList.remove('active'); 
    if(backdrop) backdrop.classList.remove('active'); 
    document.body.style.overflow = 'auto'; 
}

function openModal(year, month, day, dateKey) {
    const dateTitle = (typeof tDate === 'function') ? tDate(year, month, day) : `${year}년 ${month}월 ${day}일`;
    const titleEl = document.getElementById('modalDateTitle');
    if(titleEl) titleEl.innerText = dateTitle;
    
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
    
    const textEl = document.getElementById('modalScheduleText');
    if(textEl) textEl.innerHTML = scheduleHtml;
    
    const scheduleModal = document.getElementById('scheduleModal');
    const backdrop = document.getElementById('modalBackdrop');
    if(scheduleModal) scheduleModal.classList.add('active');
    if(backdrop) backdrop.classList.add('active');
}

function closeModal() { 
    const scheduleModal = document.getElementById('scheduleModal');
    const backdrop = document.getElementById('modalBackdrop');
    const calModal = document.getElementById('calendarPopupModal');
    
    if(scheduleModal) scheduleModal.classList.remove('active'); 
    if(backdrop) backdrop.classList.remove('active'); 
    if(calModal && !calModal.classList.contains('active')){ document.body.style.overflow = 'auto'; } 
}

// ⭐️ HTML 뼈대가 완전히 다 그려진 후에만 실행되도록 보호
window.addEventListener('DOMContentLoaded', () => { 
    loadScheduleData(); 
});

// ⭐️ 브라우저가 함수를 못 찾는 어이없는 상황을 막기 위해 윈도우 전역에 강제로 박아버림
window.openCalendarPopup = openCalendarPopup;
window.closeCalendarPopup = closeCalendarPopup;
window.changeMonth = changeMonth;
window.openModal = openModal;
window.closeModal = closeModal;
