function renderCalendar() { 
    const calendarDays = document.getElementById('calendarDays'); 
    document.getElementById('calendarMonthText').innerText = `${currentCalYear}. ${String(currentCalMonth).padStart(2, '0')}`; 
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
