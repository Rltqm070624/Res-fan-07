

function todoGetTodayKey() {
    // KST(UTC+9) 기준 날짜 문자열 (YYYY-MM-DD)
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 - now.getTimezoneOffset()) * 60000);
    return kst.toISOString().slice(0, 10);
}

function todoStorageKey() {
    return `rescene-todo-checks-${todoGetTodayKey()}`;
}

function todoLoadChecks() {
    try {
        const raw = localStorage.getItem(todoStorageKey());
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

function todoSaveChecks(checks) {
    try {
        localStorage.setItem(todoStorageKey(), JSON.stringify(checks));
    } catch (e) { /* 무시 */ }
}

let todoAllItems = [];
let todoChecks = {};

function todoToggle(id) {
    todoChecks[id] = !todoChecks[id];
    todoSaveChecks(todoChecks);
    todoUpdateItemUI(id);
    todoUpdateProgress();
}

function todoUpdateItemUI(id) {
    const el = document.querySelector(`.todo-item[data-id="${id}"]`);
    if (el) el.classList.toggle('checked', !!todoChecks[id]);
}

function todoUpdateProgress() {
    const total = todoAllItems.length;
    const done = todoAllItems.filter(it => todoChecks[it.id]).length;
    const countEl = document.getElementById('todoProgressCount');
    const fillEl = document.getElementById('todoProgressFill');
    if (countEl) countEl.textContent = `${done} / ${total}`;
    if (fillEl) fillEl.style.width = total ? `${Math.round((done / total) * 100)}%` : '0%';
}

function todoResetChecks() {
    if (!confirm('오늘 체크한 항목을 전부 초기화할까요?')) return;
    todoChecks = {};
    todoSaveChecks(todoChecks);
    document.querySelectorAll('.todo-item.checked').forEach(el => el.classList.remove('checked'));
    todoUpdateProgress();
}

function todoEscapeHtml(str) {
    return String(str || '').replace(/[&<>'"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[m]));
}

function todoItemHtml(item) {
    const checked = !!todoChecks[item.id];
    const linksHtml = (item.links || []).map(l =>
        `<a href="${todoEscapeHtml(l.url)}" target="_blank" rel="noopener">${todoEscapeHtml(l.label)} →</a>`
    ).join('');
    return `
    <div class="todo-item${checked ? ' checked' : ''}" data-id="${todoEscapeHtml(item.id)}">
        <button type="button" class="todo-check-btn" aria-label="완료 체크" onclick="todoToggle('${todoEscapeHtml(item.id)}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </button>
        <div class="todo-item-body" onclick="todoToggle('${todoEscapeHtml(item.id)}')" style="cursor:pointer;">
            <div class="todo-item-head">
                <span class="todo-item-title">${todoEscapeHtml(item.title)}</span>
                ${item.badge ? `<span class="todo-item-badge">${todoEscapeHtml(item.badge)}</span>` : ''}
            </div>
            ${item.desc ? `<p class="todo-item-desc">${todoEscapeHtml(item.desc)}</p>` : ''}
        </div>
    </div>
    ${linksHtml ? `<div class="todo-item-links" style="margin:-4px 0 0 36px;">${linksHtml}</div>` : ''}`;
}

function todoRenderCategories(data) {
    const wrap = document.getElementById('todoCategoryList');
    if (!wrap) return;

    const categories = (data && data.categories) || [];
    todoAllItems = [];
    categories.forEach(cat => (cat.items || []).forEach(it => todoAllItems.push(it)));

    if (!todoAllItems.length) {
        wrap.innerHTML = `<div class="todo-empty">오늘은 아직 등록된 할 일이 없어요. js/todo_data.json을 채워주세요.</div>`;
        todoUpdateProgress();
        return;
    }

    wrap.innerHTML = categories.map(cat => {
        if (!cat.items || !cat.items.length) return '';
        return `
        <div class="todo-category">
            <div class="todo-category-head">
                <span class="todo-category-name">${todoEscapeHtml(cat.label)}</span>
                <span class="todo-category-count">${cat.items.length}개</span>
            </div>
            <div class="todo-item-list">
                ${cat.items.map(todoItemHtml).join('')}
            </div>
        </div>`;
    }).join('');

    const updatedEl = document.getElementById('todoUpdated');
    if (updatedEl && data.updated) updatedEl.textContent = `${data.updated} 기준`;

    todoUpdateProgress();
}

async function todoInit() {
    todoChecks = todoLoadChecks();
    try {
        const res = await fetch('todo_data.json?t=' + Date.now());
        const data = await res.json();
        todoRenderCategories(data);
    } catch (e) {
        console.error('오늘의 할 일 데이터를 불러오지 못했어요', e);
        const wrap = document.getElementById('todoCategoryList');
        if (wrap) wrap.innerHTML = `<div class="todo-empty">할 일 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.</div>`;
    }
}

window.addEventListener('DOMContentLoaded', todoInit);
