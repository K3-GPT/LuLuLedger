/* ============================================================
   小账本 · Web UI  —  前端逻辑  (v4.0)
   ============================================================ */

// ─── 全局状态 ───
const state = {
    transactions: [],
    categories: { expense: [], income: [], meta: {}, cn: {} },
    currentPage: 'home',
    currentType: 'Expense',
    currentSplit: 'single',
    charts: {},
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth() + 1,
    calendarData: {},
    currentBg: null,
    bgOpacity: 0.3,
    bgBlur: 0,
    emojiTarget: null, // 'expense' | 'income' — 哪个分类在选图标
    selectedEmoji: '✨',
    settings: { modalBlur: 40, cardBlur: 20, sidebarBlur: 40, glassShine: 50, glowSize: 600, glowOpacity: 22 },
};

// ─── 标语库 ───
const GREETINGS = [
    '今天也要好好生活 ✦', '每笔记录都是生活的注脚 📝', '理财从记账开始 💰',
    '把每一笔小快乐都记下来 🌸', '今天花了多少？来看看 🧐', '理性消费，快乐生活 🎯',
    '记录让生活更有温度 ☀️', '你的财务小管家已上线 🤖', '每一天都值得被认真记录 ✨',
    '花钱也是一种艺术 🎨', '存钱罐在悄悄变满 🫙', '今天也要元气满满 🌈',
];

// ─── Emoji 图标库（超大合集） ───
const EMOJI_LIST = [
    // 食物
    '🍜','🍲','🍛','🍝','🍕','🍔','🍟','🌮','🍣','🍱','🥟','🍚','🍙','🍘','🥮','🍡','🍧','🍨','🍦','🎂','🍰','🧁','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🥤','🧃','🍺','🍻','🥂','🍷','🍸','🍹','🧋','☕','🫖','🍵',
    // 交通
    '🚌','🚇','🚄','🚅','🚆','🚗','🚕','🚙','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🛵','🚲','🛴','🛹','🚀','✈️','🛩️','🚁','⛵','🚤','🛸',
    // 购物
    '🛍️','🛒','💳','💰','💎','👑','👜','👛','👝','🎒','👓','🕶️','👔','👕','👖','👗','👘','👙','👠','👡','👢','🥿','🎩','🧢','🧣','🧤','🧦',
    // 娱乐
    '🎧','🎵','🎶','🎤','🎸','🎹','🥁','🎺','🎻','🎬','🎮','🕹️','🎯','🎲','🎳','🎰','🎪','🎭','🎨','🖌️','📷','📸','🎬',
    // 学习
    '📚','📖','📝','✏️','🖊️','🖋️','📐','📏','🧮','💻','🖥️','📱','⌨️','🖱️','💡','🔬','🔭','🧪','🧫','🧬',
    // 健康
    '💊','💉','🩺','🩹','🏥','🌡️','🧬','💪','🏃','🧘','⚽','🏀','🏈','⚾','🎾','🏐','🏓','🏸','🥊','🎿','⛷️','🏂','🏋️',
    // 自然/动物
    '🌸','🌺','🌻','🌹','🌷','🌼','💐','🌿','🍀','🍁','🍂','🍃','🌲','🌳','🌴','🌵','🌾','🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵',
    // 天气/星空
    '☀️','🌤️','⛅','🌥️','☁️','🌦️','🌧️','⛈️','🌩️','🌪️','🌫️','🌬️','❄️','☃️','⛄','🌙','🌛','🌜','⭐','🌟','💫','✨','🔥','💧','🌊',
    // 心形/表情
    '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💕','💞','💓','💗','💖','💘','💝','💟','😊','😄','🥰','😘','🤗','🤩','😎','🥳','😸','💖',
    // 物品
    '🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪','🕌','🕍','⛩️','🕋','⛲','⛺','🌁','🌃','🏙️','🌄','🌅','🌆','🌇','🌉',
    // 符号
    '✦','✧','◇','◆','○','●','□','■','△','▽','★','☆','♦','♠','♣','♥','⚡','💫','🔥','💧','🍀','🎀','🎁','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫','🏷️',
    // 其他
    '🔮','🪄','🧸','🪆','🎎','🎏','🎐','🧧','🎀','🎊','🎉','🎈','🏮','🪅','🧩','🎮','🕹️','🎰','🎲','♟️','🎯','🎳','🎪','🎭','🪗','🪘','🧿','🪬','🪫',
];

// ─── 纯色预设 ───
const PRESET_COLORS = [
    { name: '薰衣草', css: 'linear-gradient(135deg, #E8E0F8 0%, #F0E6FF 50%, #E6F0FF 100%)' },
    { name: '日落橘', css: 'linear-gradient(135deg, #FFE8D6 0%, #FFD6C4 50%, #FFF0E6 100%)' },
    { name: '薄荷绿', css: 'linear-gradient(135deg, #E0F5EE 0%, #D0EFE6 50%, #E8F8F2 100%)' },
    { name: '樱花粉', css: 'linear-gradient(135deg, #FFE8F0 0%, #FFD6E8 50%, #FFF0F6 100%)' },
    { name: '星空蓝', css: 'linear-gradient(135deg, #E0E8FF 0%, #D0D8F8 50%, #E8ECFF 100%)' },
];

// ─── 工具函数 ───
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const money = (v) => `¥${Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function toast(text, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = text;
    $('#toastContainer').appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

async function api(path, options = {}) {
    const res = await fetch(`/api${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    return res.json();
}

// ─── 初始化 ───
document.addEventListener('DOMContentLoaded', async () => {
    initDate();
    randomGreeting();
    await loadCategories();
    await loadBgSettings();
    await loadSettings();
    await refreshAll();
    bindEvents();
});

function initDate() {
    const now = new Date();
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const str = `${now.getFullYear()} / ${String(now.getMonth() + 1).padStart(2, '0')} / ${String(now.getDate()).padStart(2, '0')}  ·  星期${days[now.getDay()]}`;
    $('#topbarDate').textContent = str;
    const today = now.toISOString().slice(0, 10);
    if ($('#dailyDate')) $('#dailyDate').value = today;
}

function randomGreeting() {
    const el = $('#greetingText');
    if (el) el.textContent = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

// ─── 设置管理 ───
function loadSettings() {
    const saved = localStorage.getItem('financeSettings');
    if (saved) {
        try { Object.assign(state.settings, JSON.parse(saved)); } catch(e) {}
    }
    applySettings();
}

function applySettings() {
    const s = state.settings;
    document.documentElement.style.setProperty('--glass-blur', s.cardBlur + 'px');
    document.documentElement.style.setProperty('--glass-blur-heavy', s.sidebarBlur + 'px');
    const glow = $('#mouseGlow');
    if (glow) {
        glow.style.width = s.glowSize + 'px';
        glow.style.height = s.glowSize + 'px';
        glow.style.background = `radial-gradient(circle, rgba(200,182,255,${s.glowOpacity/100}) 0%, rgba(200,182,255,${s.glowOpacity/300}) 35%, transparent 70%)`;
    }
    // 填充滑块值
    const ids = ['setModalBlur','setCardBlur','setSidebarBlur','setGlassShine','setGlowSize','setGlowOpacity'];
    const keys = ['modalBlur','cardBlur','sidebarBlur','glassShine','glowSize','glowOpacity'];
    ids.forEach((id, i) => {
        const el = $(`#${id}`);
        if (el) el.value = s[keys[i]];
    });
    updateSettingsLabels();
    // 弹窗玻璃
    $$('.modal').forEach(m => {
        m.style.backdropFilter = `blur(${s.modalBlur}px) saturate(1.8)`;
        m.style.webkitBackdropFilter = `blur(${s.modalBlur}px) saturate(1.8)`;
    });
}

function updateSettingsLabels() {
    const s = state.settings;
    if ($('#setModalBlurLabel')) $('#setModalBlurLabel').textContent = s.modalBlur + 'px';
    if ($('#setCardBlurLabel')) $('#setCardBlurLabel').textContent = s.cardBlur + 'px';
    if ($('#setSidebarBlurLabel')) $('#setSidebarBlurLabel').textContent = s.sidebarBlur + 'px';
    if ($('#setGlassShineLabel')) $('#setGlassShineLabel').textContent = s.glassShine + '%';
    if ($('#setGlowSizeLabel')) $('#setGlowSizeLabel').textContent = s.glowSize + 'px';
    if ($('#setGlowOpacityLabel')) $('#setGlowOpacityLabel').textContent = s.glowOpacity + '%';
}

function saveSettings() {
    localStorage.setItem('financeSettings', JSON.stringify(state.settings));
}

// ─── 加载分类 ───
async function loadCategories() {
    state.categories = await api('/categories');
    populateCategorySelect();
    populateLocationList();
}

function populateCategorySelect() {
    const sel = $('#inputCategory');
    sel.innerHTML = '';
    const list = state.currentType === 'Income' ? state.categories.income : state.categories.expense;
    const cn = state.categories.cn;
    list.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cn[cat] || cat;
        sel.appendChild(opt);
    });
    // 自定义选项
    const custom = document.createElement('option');
    custom.value = '__custom__';
    custom.textContent = '自定义…';
    sel.appendChild(custom);
}

async function populateLocationList() {
    const locations = await api('/locations');
    const dl = $('#locationList');
    if (dl) { dl.innerHTML = ''; locations.forEach(loc => { const o = document.createElement('option'); o.value = loc; dl.appendChild(o); }); }
    const lSel = $('#locationSelect');
    if (lSel) { lSel.innerHTML = '<option value="">选择地点</option>'; locations.forEach(loc => { const o = document.createElement('option'); o.value = loc; o.textContent = loc; lSel.appendChild(o); }); }
}

// ─── 刷新 ───
async function refreshAll() {
    state.transactions = await api('/transactions');
    updateStats();
    renderRecent();
    if (state.currentPage === 'daily') { loadDaily(); loadCalendar(); }
    if (state.currentPage === 'location') loadLocation();
    if (state.currentPage === 'summary') loadSummary();
    if (state.currentPage === 'charts') loadCharts();
}

async function updateStats() {
    const s = await api('/stats');
    $('#statBalance').textContent = money(s.balance);
    $('#statExpense').textContent = money(s.total_expense);
    $('#statIncome').textContent = money(s.total_income);
    $('#statMonth').textContent = money(s.month_expense);
    const now = new Date();
    $('#statMonthLabel').textContent = `${now.getFullYear()}年${now.getMonth() + 1}月 · 点击查看明细 →`;
}

// ─── 渲染记录 ───
function renderRecent() {
    const list = $('#recentList');
    const records = state.transactions.slice(0, 15);
    if (!records.length) {
        list.innerHTML = '<div class="empty-state"><span class="empty-icon">🌷</span><p class="empty-title">还没有记录呀</p><p class="empty-sub">从左边记下今天的第一笔花费吧</p></div>';
        return;
    }
    list.innerHTML = records.map((t, i) => renderItem(t, i)).join('');
}

function renderItem(t, index, showDelete = false) {
    const meta = state.categories.meta[t.category] || { icon: '✨', color: '#8B79D9', bg: '#EEE9FF' };
    const cnCat = state.categories.cn[t.category] || t.category;
    const desc = t.description || cnCat;
    const parts = [t.date.slice(5, 10), cnCat];
    if (t.location) parts.push(t.location);
    if (t.split_type === 'aa') parts.push(`AA×${t.participants}`);
    const amount = t.split_type === 'aa' ? t.amount / (t.participants || 1) : t.amount;
    const sign = t.type === 'Income' ? '+' : '-';
    const cls = t.type === 'Income' ? 'income' : 'expense';
    return `<div class="tx-item"><div class="tx-icon" style="background:${meta.bg};color:${meta.color}">${meta.icon}</div><div class="tx-body"><div class="tx-title">${escHtml(desc)}</div><div class="tx-meta">${parts.join('  ·  ')}</div></div><div class="tx-amount ${cls}">${sign}${money(amount)}</div>${showDelete ? `<button class="tx-delete" onclick="deleteTx(${index})" title="删除">🗑</button>` : ''}</div>`;
}

function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

async function deleteTx(index) {
    if (!confirm('确定要删除这笔记录吗？')) return;
    const res = await api(`/transactions/${index}`, { method: 'DELETE' });
    if (res.ok) { toast('已删除 ✨'); await refreshAll(); if ($('#modalAllRecords').classList.contains('open')) loadAllRecords(); }
    else toast(res.error || '删除失败', 'error');
}

// ─── 添加记录 ───
async function addTransaction() {
    const amount = parseFloat($('#inputAmount').value);
    if (!amount || amount <= 0) { toast('请输入大于 0 的金额', 'error'); return; }
    const splitType = state.currentSplit;
    let participants = 1;
    if (state.currentType === 'Expense' && splitType === 'aa') {
        participants = parseInt($('#inputParticipants').value) || 2;
        if (participants < 2) { toast('AA 分摊至少需要 2 人', 'error'); return; }
    }
    let category = $('#inputCategory').value;
    if (category === '__custom__') {
        const custom = $('#inputCustomCategory').value.trim();
        if (!custom) { toast('请输入自定义分类名称', 'error'); return; }
        category = custom;
    }
    const data = { type: state.currentType, category, amount, description: $('#inputDesc').value.trim(), location: $('#inputLocation').value.trim(), split_type: state.currentType === 'Expense' ? splitType : 'single', participants: state.currentType === 'Expense' ? participants : 1 };
    const res = await api('/transactions', { method: 'POST', body: JSON.stringify(data) });
    if (res.ok) { toast('已保存 ✨'); resetForm(); await refreshAll(); await populateLocationList(); }
    else toast(res.error || '保存失败', 'error');
}

function resetForm() {
    $('#inputAmount').value = ''; $('#inputDesc').value = ''; $('#inputLocation').value = '';
    $('#inputParticipants').value = '2'; $('#inputCustomCategory').value = '';
    $('#inputCustomCategory').style.display = 'none';
    $('#autoDetectHint').textContent = ''; $('#autoDetectHint').classList.remove('visible');
    setSegmentValue('splitSegment', 'single'); state.currentSplit = 'single';
    $('#participantsField').style.display = 'none';
    setSegmentValue('typeSegment', 'Expense'); state.currentType = 'Expense';
    updateSplitVisibility(); populateCategorySelect();
}

// ─── 导航 ───
function switchPage(page) {
    state.currentPage = page;
    $$('.nav-btn[data-page]').forEach(btn => btn.classList.toggle('active', btn.dataset.page === page));
    $$('.page').forEach(p => p.classList.remove('active'));
    const target = $(`#page${capitalize(page)}`);
    if (target) target.classList.add('active');
    if (page === 'daily') { loadDaily(); loadCalendar(); }
    if (page === 'location') loadLocation();
    if (page === 'summary') loadSummary();
    if (page === 'charts') loadCharts();
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ─── 分段控制 ───
function initSegment(containerId, onChange) {
    const c = $(`#${containerId}`); if (!c) return;
    c.querySelectorAll('.seg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            c.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (onChange) onChange(btn.dataset.value);
        });
    });
}
function setSegmentValue(id, val) {
    const c = $(`#${id}`); if (!c) return;
    c.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.value === val));
}

function updateSplitVisibility() {
    const isIncome = state.currentType === 'Income';
    $('#splitField').style.display = isIncome ? 'none' : 'block';
    if (isIncome) { state.currentSplit = 'single'; $('#participantsField').style.display = 'none'; }
}

// ─── 自动分类 ───
let detectTimer = null;
async function onDescInput() {
    const desc = $('#inputDesc').value.trim();
    const hint = $('#autoDetectHint');
    if (!desc) { hint.textContent = ''; hint.classList.remove('visible'); return; }
    clearTimeout(detectTimer);
    detectTimer = setTimeout(async () => {
        const res = await api('/detect-category', { method: 'POST', body: JSON.stringify({ description: desc }) });
        if (res.category) {
            const sel = $('#inputCategory');
            if (Array.from(sel.options).some(o => o.value === res.category)) sel.value = res.category;
            hint.textContent = `✨ 已自动识别为「${res.label}」`;
            hint.classList.add('visible');
        } else { hint.textContent = ''; hint.classList.remove('visible'); }
    }, 500);
}

// ─── 筛选页 ───
async function openFilterPage(filterType) {
    const titles = { 'Expense': { title: '全部支出', sub: '所有已记录的支出明细' }, 'Income': { title: '全部收入', sub: '所有已记录的收入明细' }, 'month': { title: '本月支出', sub: `${new Date().getFullYear()}年${new Date().getMonth() + 1}月支出明细` } };
    const info = titles[filterType] || { title: '筛选结果', sub: '' };
    $('#filterTitle').textContent = info.title;
    $('#filterSubtitle').textContent = info.sub;
    let url = '/transactions/filter?';
    if (filterType === 'Expense' || filterType === 'Income') url += `type=${filterType}`;
    else if (filterType === 'month') url += `type=Expense&month=${new Date().toISOString().slice(0, 7)}`;
    const records = await api(url);
    const total = records.reduce((s, t) => s + t.amount, 0);
    $('#filterTotal').textContent = `共 ${records.length} 条 · 合计 ${money(total)}`;
    const list = $('#filterList');
    if (!records.length) list.innerHTML = '<div class="empty-state"><span class="empty-icon">📋</span><p class="empty-title">暂无记录</p></div>';
    else list.innerHTML = records.map(t => { const idx = state.transactions.findIndex(tr => tr.date === t.date && tr.amount === t.amount && tr.description === t.description); return renderItem(t, idx >= 0 ? idx : 0, true); }).join('');
    $$('.page').forEach(p => p.classList.remove('active'));
    $('#pageFilter').classList.add('active');
}

// ─── 每日明细 ───
async function loadDaily() {
    const date = $('#dailyDate').value; if (!date) return;
    const txs = state.transactions.filter(t => t.date.startsWith(date));
    const expenses = txs.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
    const incomes = txs.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
    $('#dailyTotal').textContent = `支出 ${money(expenses)}   ·   收入 ${money(incomes)}`;
    const list = $('#dailyList');
    if (!txs.length) list.innerHTML = '<div class="empty-state"><span class="empty-icon">🌙</span><p class="empty-title">这一天还没有记账</p></div>';
    else list.innerHTML = txs.slice().reverse().map(t => renderItem(t, state.transactions.indexOf(t))).join('');
}

// ─── 日历 ───
async function loadCalendar() {
    const ym = `${state.calendarYear}-${String(state.calendarMonth).padStart(2, '0')}`;
    state.calendarData = await api(`/calendar/${ym}`);
    renderCalendar();
}

function renderCalendar() {
    const y = state.calendarYear, m = state.calendarMonth;
    const today = new Date(), todayStr = today.toISOString().slice(0, 10);
    $('#calendarTitle').textContent = `${y} 年 ${String(m).padStart(2, '0')} 月`;
    const grid = $('#calendarGrid'); grid.innerHTML = '';
    ['一','二','三','四','五','六','日'].forEach(w => { const el = document.createElement('div'); el.className = 'cal-weekday'; el.textContent = w; grid.appendChild(el); });
    const offset = (new Date(y, m - 1, 1).getDay() || 7) - 1;
    for (let i = 0; i < offset; i++) { const el = document.createElement('div'); el.className = 'cal-day empty'; grid.appendChild(el); }
    const daysInMonth = new Date(y, m, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const data = state.calendarData[dateKey];
        const el = document.createElement('div'); el.className = 'cal-day';
        if (dateKey === todayStr) el.classList.add('today');
        if (data && data.count > 0) {
            el.classList.add('has-data');
            el.classList.add(data.income >= data.expense ? 'income-gt' : 'expense-gt');
            el.innerHTML = `<span>${d}</span><span class="cal-count">${data.count}笔</span>`;
        } else el.innerHTML = `<span>${d}</span>`;
        el.addEventListener('click', () => { $('#dailyDate').value = dateKey; loadDaily(); });
        grid.appendChild(el);
    }
}

// ─── 旅行地点 ───
async function loadLocation() {
    const loc = $('#locationSelect').value;
    if (!loc) { $('#locationTotal').textContent = ''; $('#locationList2').innerHTML = '<div class="empty-state"><span class="empty-icon">🌿</span><p class="empty-title">请选择一个地点</p></div>'; return; }
    const txs = state.transactions.filter(t => t.location === loc);
    const total = txs.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
    $('#locationTotal').textContent = `地点支出 ${money(total)}`;
    const list = $('#locationList2');
    if (!txs.length) list.innerHTML = '<div class="empty-state"><span class="empty-icon">🌿</span><p class="empty-title">这个地点暂时没有记录</p></div>';
    else list.innerHTML = txs.slice().reverse().map(t => renderItem(t, state.transactions.indexOf(t))).join('');
}

// ─── 消费分析 ───
let currentSummaryView = 'category';
async function loadSummary() {
    const data = await api(`/summary/${currentSummaryView}`);
    const total = data.reduce((s, d) => s + d.amount, 0);
    $('#summaryTotal').textContent = `总支出 ${money(total)}`;
    const grid = $('#summaryGrid');
    if (!data.length) { grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><span class="empty-icon">✦</span><p class="empty-title">还没有足够的数据</p></div>'; return; }
    const max = data[0]?.amount || 1;
    grid.innerHTML = data.map(d => {
        const pct = total > 0 ? (d.amount / total * 100) : 0;
        const label = currentSummaryView === 'category' ? d.label : d.name;
        return `<div class="summary-item glass-card"><div class="summary-item-name">${escHtml(label)}</div><div class="summary-item-amount">${money(d.amount)}</div><span class="summary-item-pct">${pct.toFixed(1)}%</span><div class="summary-bar-track"><div class="summary-bar-fill" style="width:${d.amount / max * 100}%"></div></div></div>`;
    }).join('');
}

// ─── 图表 ───
async function loadCharts() {
    const expenses = state.transactions.filter(t => t.type === 'Expense');
    const catData = {}; expenses.forEach(t => { const l = state.categories.cn[t.category] || t.category; catData[l] = (catData[l] || 0) + t.amount; });
    const colors = ['#8B79D9','#EFA7C8','#9CC8F3','#78CFA9','#F2BA73','#E7839B','#B8A0E8','#FFB6D9'];
    destroyChart('chartCategory');
    const c1 = $('#chartCategory');
    if (c1) state.charts.chartCategory = new Chart(c1, { type: 'doughnut', data: { labels: Object.keys(catData), datasets: [{ data: Object.values(catData), backgroundColor: colors.slice(0, Object.keys(catData).length), borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)', hoverOffset: 8 }] }, options: { responsive: true, maintainAspectRatio: true, cutout: '55%', plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } } }, animation: { duration: 1200 } } });
    const ti = state.transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
    const te = expenses.reduce((s, t) => s + t.amount, 0);
    destroyChart('chartIncomeExpense');
    const c2 = $('#chartIncomeExpense');
    if (c2) state.charts.chartIncomeExpense = new Chart(c2, { type: 'bar', data: { labels: ['收入','支出'], datasets: [{ data: [ti, te], backgroundColor: ['rgba(120,207,169,0.7)','rgba(231,131,155,0.7)'], borderColor: ['#78CFA9','#E7839B'], borderWidth: 2, borderRadius: 12, borderSkipped: false }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(139,121,217,0.06)' }, ticks: { callback: v => `¥${v.toLocaleString()}` } }, x: { grid: { display: false } } } } });
    const dayData = {}; expenses.forEach(t => { const day = t.date.slice(0,10); dayData[day] = (dayData[day]||0) + t.amount; });
    const days = Object.keys(dayData).sort().slice(-30);
    destroyChart('chartTrend');
    const c3 = $('#chartTrend');
    if (c3) state.charts.chartTrend = new Chart(c3, { type: 'line', data: { labels: days.map(d => d.slice(5)), datasets: [{ label: '每日支出', data: days.map(d => dayData[d]), borderColor: '#8B79D9', backgroundColor: 'rgba(139,121,217,0.08)', fill: true, tension: 0.4, pointBackgroundColor: '#8B79D9', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 5 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(139,121,217,0.06)' }, ticks: { callback: v => `¥${v.toLocaleString()}` } }, x: { grid: { display: false } } } } });
}
function destroyChart(id) { if (state.charts[id]) { state.charts[id].destroy(); state.charts[id] = null; } }

// ─── 弹窗 ───
async function loadAllRecords() {
    const list = $('#allRecordsList');
    const txs = state.transactions;
    if (!txs.length) list.innerHTML = '<div class="empty-state"><span class="empty-icon">🌷</span><p class="empty-title">还没有记录</p></div>';
    else list.innerHTML = txs.slice(0, 200).map((t, i) => renderItem(t, i, true)).join('');
}

// ─── 分类管理 ───
async function openCategoryModal() {
    state.categories = await api('/categories');
    renderCategoryLists();
    $('#modalCategories').classList.add('open');
}
function renderCategoryLists() {
    const { expense, income, meta, cn } = state.categories;
    const defaults = ['Food','Transportation','Entertainment','Shopping','Bills','Healthcare','Education','Salary','Freelance','Investment','Gift'];
    $('#expenseCatList').innerHTML = expense.map(cat => {
        const m = meta[cat] || { icon: '✨' }; const label = cn[cat] || cat;
        return `<div class="cat-tag"><span class="cat-icon">${m.icon}</span><span class="cat-name">${label}</span><div class="cat-actions"><button onclick="editCategoryIcon('${cat}')" title="改图标">✏</button>${!defaults.includes(cat) ? `<button class="btn-cat-delete" onclick="deleteCategory('${cat}')" title="删">✕</button>` : ''}</div></div>`;
    }).join('');
    $('#incomeCatList').innerHTML = income.map(cat => {
        const m = meta[cat] || { icon: '✨' }; const label = cn[cat] || cat;
        return `<div class="cat-tag"><span class="cat-icon">${m.icon}</span><span class="cat-name">${label}</span><div class="cat-actions"><button onclick="editCategoryIcon('${cat}')" title="改图标">✏</button>${!defaults.includes(cat) ? `<button class="btn-cat-delete" onclick="deleteCategory('${cat}')" title="删">✕</button>` : ''}</div></div>`;
    }).join('');
}
async function addCategory(type) {
    const prefix = type === 'expense' ? 'Expense' : 'Income';
    const cnName = $(`#new${prefix}CatCN`).value.trim();
    const icon = type === 'expense' ? state.selectedEmoji : state.selectedEmoji;
    if (!cnName) { toast('请输入分类名称', 'error'); return; }
    const res = await api('/categories', { method: 'POST', body: JSON.stringify({ type, cn_name: cnName, icon }) });
    if (res.ok) { toast('分类已添加 ✨'); $(`#new${prefix}CatCN`).value = ''; state.categories = await api('/categories'); renderCategoryLists(); populateCategorySelect(); }
    else toast(res.error || '添加失败', 'error');
}
async function editCategoryIcon(cat) {
    openEmojiPicker(async (emoji) => {
        await api(`/categories/${encodeURIComponent(cat)}`, { method: 'PUT', body: JSON.stringify({ icon: emoji }) });
        state.categories = await api('/categories'); renderCategoryLists();
    });
}
async function deleteCategory(cat) {
    if (!confirm(`确定删除「${state.categories.cn[cat] || cat}」？`)) return;
    const res = await api(`/categories/${encodeURIComponent(cat)}`, { method: 'DELETE' });
    if (res.ok) { toast('已删除'); state.categories = await api('/categories'); renderCategoryLists(); populateCategorySelect(); }
    else toast(res.error || '删除失败', 'error');
}

// ─── Emoji 选择器 ───
function openEmojiPicker(callback) {
    state.emojiCallback = callback;
    renderEmojiGrid(EMOJI_LIST);
    $('#modalEmoji').classList.add('open');
}
function renderEmojiGrid(list) {
    const grid = $('#emojiGrid');
    grid.innerHTML = list.map(e => `<div class="emoji-item" data-emoji="${e}">${e}</div>`).join('');
    grid.querySelectorAll('.emoji-item').forEach(el => {
        el.addEventListener('click', () => {
            const emoji = el.dataset.emoji;
            if (state.emojiCallback) state.emojiCallback(emoji);
            $('#modalEmoji').classList.remove('open');
        });
    });
}

// ─── 地点管理 ───
async function openLocationModal() { renderLocationManageList(await api('/locations')); $('#modalLocations').classList.add('open'); }
function renderLocationManageList(locations) {
    const list = $('#locationManageList');
    if (!locations.length) { list.innerHTML = '<p style="color:var(--muted);font-size:0.82rem">暂无地点</p>'; return; }
    list.innerHTML = locations.map(loc => `<div class="cat-tag"><span class="cat-icon">📍</span><span class="cat-name">${escHtml(loc)}</span><div class="cat-actions"><button onclick="editLocation('${escHtml(loc)}')" title="编辑">✏</button><button class="btn-cat-delete" onclick="deleteLocation('${escHtml(loc)}')" title="删除">✕</button></div></div>`).join('');
}
async function addLocation() {
    const name = $('#newLocationName').value.trim(); if (!name) { toast('请输入地点', 'error'); return; }
    await api('/locations', { method: 'POST', body: JSON.stringify({ name }) });
    toast('已添加 📍'); $('#newLocationName').value = ''; renderLocationManageList(await api('/locations')); populateLocationList();
}
async function editLocation(old) { const n = prompt('修改地点', old); if (!n || n.trim() === old) return; await api(`/locations/${encodeURIComponent(old)}`, { method: 'PUT', body: JSON.stringify({ name: n.trim() }) }); toast('已更新 📍'); renderLocationManageList(await api('/locations')); populateLocationList(); await refreshAll(); }
async function deleteLocation(name) { if (!confirm(`删除「${name}」？`)) return; await api(`/locations/${encodeURIComponent(name)}`, { method: 'DELETE' }); toast('已删除'); renderLocationManageList(await api('/locations')); populateLocationList(); }

// ─── 背景管理 ───
async function loadBgSettings() {
    const saved = localStorage.getItem('financeBg');
    if (saved) { try { const c = JSON.parse(saved); state.currentBg = c.filename || null; state.bgOpacity = c.opacity ?? 0.3; state.bgBlur = c.blur ?? 0; } catch(e){} }
    const savedColor = localStorage.getItem('financeBgColor');
    if (savedColor) state.currentBgColor = savedColor;
    applyBg();
    // 加载品牌头像
    const avatar = localStorage.getItem('financeBrandAvatar');
    if (avatar) { const icon = $('#brandIcon'); if (icon) { icon.style.display = 'none'; const img = document.createElement('img'); img.src = avatar; icon.parentElement.insertBefore(img, icon); } }
}
function applyBg() {
    const el = $('#bgCustom');
    if (state.currentBg) {
        if (state.currentBg.startsWith('data:') || state.currentBg.startsWith('url(')) {
            el.style.background = state.currentBg;
        } else {
            el.style.background = `url(/api/backgrounds/${state.currentBg})`;
        }
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.style.opacity = state.bgOpacity;
        el.style.filter = `blur(${state.bgBlur}px)`;
    } else if (state.currentBgColor) {
        el.style.background = state.currentBgColor;
        el.style.backgroundSize = 'cover';
        el.style.opacity = state.bgOpacity;
        el.style.filter = `blur(${state.bgBlur}px)`;
    } else {
        el.style.background = 'none'; el.style.opacity = '0';
    }
    const op = $('#bgOpacity'), bl = $('#bgBlur');
    if (op) { op.value = state.bgOpacity * 100; $('#bgOpacityLabel').textContent = Math.round(state.bgOpacity * 100) + '%'; }
    if (bl) { bl.value = state.bgBlur; $('#bgBlurLabel').textContent = state.bgBlur + 'px'; }
}
function saveBgSettings() { localStorage.setItem('financeBg', JSON.stringify({ filename: state.currentBg, opacity: state.bgOpacity, blur: state.bgBlur })); }

async function openBgModal() {
    const files = await api('/backgrounds');
    renderBgGrid(files);
    renderPresetColors();
    // 初始位置居中
    const modal = $('#modalBgInner');
    modal.style.left = '50%'; modal.style.top = '50%'; modal.style.transform = 'translate(-50%, -50%)';
    $('#modalBg').classList.add('open');
}
function renderBgGrid(files) {
    const grid = $('#bgGrid');
    if (!files.length) { grid.innerHTML = '<p style="color:var(--muted);font-size:0.82rem;grid-column:1/-1">还没有图片，上传一张试试 🖼</p>'; return; }
    grid.innerHTML = files.map(f => `<div class="bg-preview-item ${state.currentBg === f ? 'active' : ''}" data-file="${f}"><img src="/api/backgrounds/${f}" alt=""><button class="bg-delete-btn" onclick="event.stopPropagation();deleteBg('${f}')">✕</button></div>`).join('');
    grid.querySelectorAll('.bg-preview-item').forEach(item => { item.addEventListener('click', () => { state.currentBg = item.dataset.file; state.currentBgColor = null; localStorage.removeItem('financeBgColor'); saveBgSettings(); applyBg(); openBgModal(); }); });
}
function renderPresetColors() {
    const container = $('#presetColors');
    container.innerHTML = PRESET_COLORS.map((c, i) => `<div class="preset-color-btn ${state.currentBgColor === c.css ? 'active' : ''}" data-idx="${i}" style="background:${c.css}" title="${c.name}"></div>`).join('');
    container.querySelectorAll('.preset-color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.currentBgColor = PRESET_COLORS[parseInt(btn.dataset.idx)].css;
            state.currentBg = null;
            localStorage.setItem('financeBgColor', state.currentBgColor);
            saveBgSettings(); applyBg(); renderPresetColors();
        });
    });
}
async function uploadBg() { $('#fileBgUpload').click(); }
async function handleBgUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/backgrounds', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.ok) { toast('已上传 🖼'); state.currentBg = data.filename; state.currentBgColor = null; localStorage.removeItem('financeBgColor'); saveBgSettings(); applyBg(); openBgModal(); }
    else toast(data.error || '上传失败', 'error');
    e.target.value = '';
}
async function deleteBg(f) { if (!confirm('删除这张图片？')) return; await api(`/backgrounds/${f}`, { method: 'DELETE' }); if (state.currentBg === f) { state.currentBg = null; saveBgSettings(); applyBg(); } toast('已删除'); openBgModal(); }
function clearBg() { state.currentBg = null; state.currentBgColor = null; localStorage.removeItem('financeBgColor'); saveBgSettings(); applyBg(); openBgModal(); toast('背景已清除'); }

// ─── 可拖动弹窗 ───
function makeDraggable(handle, container) {
    let isDragging = false, startX, startY, startLeft, startTop;
    handle.addEventListener('mousedown', (e) => {
        if (e.target.closest('.btn-close')) return;
        isDragging = true;
        const rect = container.getBoundingClientRect();
        startX = e.clientX; startY = e.clientY;
        startLeft = rect.left; startTop = rect.top;
        container.style.transform = 'none';
        container.style.left = startLeft + 'px';
        container.style.top = startTop + 'px';
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', onDragEnd);
    });
    function onDrag(e) {
        if (!isDragging) return;
        container.style.left = (startLeft + e.clientX - startX) + 'px';
        container.style.top = (startTop + e.clientY - startY) + 'px';
    }
    function onDragEnd() { isDragging = false; document.removeEventListener('mousemove', onDrag); document.removeEventListener('mouseup', onDragEnd); }
}

// ─── 事件绑定 ───
function bindEvents() {
    // 鼠标光晕
    const glow = $('#mouseGlow');
    document.addEventListener('mousemove', (e) => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; if (!glow.classList.contains('visible')) glow.classList.add('visible'); });
    document.addEventListener('mouseleave', () => glow.classList.remove('visible'));

    // 可拖动
    makeDraggable($('#modalBgHandle'), $('#modalBgInner'));

    // 导航
    $$('.nav-btn[data-page]').forEach(btn => btn.addEventListener('click', () => switchPage(btn.dataset.page)));
    initSegment('typeSegment', (v) => { state.currentType = v; populateCategorySelect(); updateSplitVisibility(); });
    initSegment('splitSegment', (v) => { state.currentSplit = v; $('#participantsField').style.display = v === 'aa' ? 'block' : 'none'; });
    initSegment('summarySegment', (v) => { currentSummaryView = v; loadSummary(); });

    $('#btnAdd').addEventListener('click', addTransaction);
    $('#inputAmount').addEventListener('keydown', e => { if (e.key === 'Enter') addTransaction(); });
    $('#inputDesc').addEventListener('keydown', e => { if (e.key === 'Enter') addTransaction(); });
    $('#inputDesc').addEventListener('input', onDescInput);
    $('#btnDailyQuery').addEventListener('click', loadDaily);
    $('#dailyDate').addEventListener('change', loadDaily);
    $('#btnLocationQuery').addEventListener('click', loadLocation);
    $('#locationSelect').addEventListener('change', loadLocation);
    $('#btnExport').addEventListener('click', () => { window.location.href = '/api/export'; });
    $('#btnViewAll').addEventListener('click', async () => { await loadAllRecords(); $('#modalAllRecords').classList.add('open'); });
    $$('.stat-clickable').forEach(card => card.addEventListener('click', () => { const f = card.dataset.filter; if (f !== 'balance') openFilterPage(f); }));
    $('#btnBackFilter').addEventListener('click', () => { $$('.page').forEach(p => p.classList.remove('active')); $('#pageHome').classList.add('active'); state.currentPage = 'home'; });

    // 日历
    $('#btnCalPrev').addEventListener('click', () => { state.calendarMonth--; if (state.calendarMonth < 1) { state.calendarMonth = 12; state.calendarYear--; } loadCalendar(); });
    $('#btnCalNext').addEventListener('click', () => { state.calendarMonth++; if (state.calendarMonth > 12) { state.calendarMonth = 1; state.calendarYear++; } loadCalendar(); });
    $('#btnCalToday').addEventListener('click', () => { const n = new Date(); state.calendarYear = n.getFullYear(); state.calendarMonth = n.getMonth() + 1; $('#dailyDate').value = n.toISOString().slice(0, 10); loadCalendar(); loadDaily(); });

    // 分类
    $('#btnManageCategories').addEventListener('click', openCategoryModal);
    $('#btnAddExpenseCat').addEventListener('click', () => addCategory('expense'));
    $('#btnAddIncomeCat').addEventListener('click', () => addCategory('income'));
    $('#pickExpenseIcon').addEventListener('click', () => { state.emojiTarget = 'expense'; openEmojiPicker(emoji => { $('#pickExpenseIcon').textContent = emoji; state.selectedEmoji = emoji; }); });
    $('#pickIncomeIcon').addEventListener('click', () => { state.emojiTarget = 'income'; openEmojiPicker(emoji => { $('#pickIncomeIcon').textContent = emoji; state.selectedEmoji = emoji; }); });

    // 地点
    $('#btnManageLocations').addEventListener('click', openLocationModal);
    $('#btnAddLocation').addEventListener('click', addLocation);

    // 导入
    $('#btnImportCSV').addEventListener('click', () => $('#fileImportCSV').click());
    $('#fileImportCSV').addEventListener('change', async (e) => {
        const file = e.target.files[0]; if (!file) return;
        const fd = new FormData(); fd.append('file', file);
        const res = await fetch('/api/import', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.ok) { toast(`导入成功 · ${data.imported} 条${data.skipped > 0 ? `，跳过 ${data.skipped}` : ''} ✨`); await refreshAll(); await populateLocationList(); }
        else toast(data.error || '导入失败', 'error');
        e.target.value = '';
    });

    // 背景
    $('#btnManageBg').addEventListener('click', openBgModal);
    $('#btnCloseBgModal').addEventListener('click', () => $('#modalBg').classList.remove('open'));
    $('#btnUploadBg').addEventListener('click', uploadBg);
    $('#fileBgUpload').addEventListener('change', handleBgUpload);
    $('#btnClearBg').addEventListener('click', clearBg);
    // 滑块拖动时隐藏弹窗实时预览
    ['bgOpacity','bgBlur'].forEach(id => {
        const el = $(`#${id}`);
        el.addEventListener('mousedown', () => { $('#modalBg').style.opacity = '0.3'; });
        el.addEventListener('mouseup', () => { $('#modalBg').style.opacity = '1'; });
        el.addEventListener('input', (e) => {
            if (id === 'bgOpacity') state.bgOpacity = e.target.value / 100;
            else state.bgBlur = parseInt(e.target.value);
            applyBg(); saveBgSettings();
        });
    });

    // 品牌头像
    $('#brandAvatar').addEventListener('click', () => $('#fileBrandAvatar').click());
    $('#fileBrandAvatar').addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            localStorage.setItem('financeBrandAvatar', dataUrl);
            const icon = $('#brandIcon'); icon.style.display = 'none';
            let img = icon.parentElement.querySelector('img');
            if (!img) { img = document.createElement('img'); icon.parentElement.insertBefore(img, icon); }
            img.src = dataUrl;
            toast('头像已更新 ✨');
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    });

    // 设置
    $('#btnSettings').addEventListener('click', () => { applySettings(); $('#modalSettings').classList.add('open'); });
    $('#btnCloseSettingsModal').addEventListener('click', () => $('#modalSettings').classList.remove('open'));
    const settingKeys = ['setModalBlur','setCardBlur','setSidebarBlur','setGlassShine','setGlowSize','setGlowOpacity'];
    const stateKeys = ['modalBlur','cardBlur','sidebarBlur','glassShine','glowSize','glowOpacity'];
    settingKeys.forEach((id, i) => {
        $(`#${id}`).addEventListener('input', (e) => {
            state.settings[stateKeys[i]] = parseInt(e.target.value);
            applySettings(); saveSettings();
        });
    });
    $('#btnResetSettings').addEventListener('click', () => {
        state.settings = { modalBlur: 40, cardBlur: 20, sidebarBlur: 40, glassShine: 50, glowSize: 600, glowOpacity: 22 };
        applySettings(); saveSettings();
        toast('已恢复默认设置');
    });

    // Emoji 搜索
    $('#emojiSearch').addEventListener('input', (e) => {
        const q = e.target.value.trim().toLowerCase();
        if (!q) renderEmojiGrid(EMOJI_LIST);
        else renderEmojiGrid(EMOJI_LIST.filter(em => em.includes(q)));
    });
    $('#btnUploadCustomIcon').addEventListener('click', () => $('#fileCustomIcon').click());
    $('#fileCustomIcon').addEventListener('change', async (e) => {
        const file = e.target.files[0]; if (!file) return;
        const fd = new FormData(); fd.append('file', file);
        const res = await fetch('/api/icons', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.ok) { toast('图标已上传'); if (state.emojiCallback) state.emojiCallback(`/api/icons/${data.filename}`); $('#modalEmoji').classList.remove('open'); }
        else toast(data.error || '上传失败', 'error');
        e.target.value = '';
    });
    $('#btnCloseEmojiModal').addEventListener('click', () => $('#modalEmoji').classList.remove('open'));

    // 关闭弹窗
    $('#btnCloseModal').addEventListener('click', () => $('#modalAllRecords').classList.remove('open'));
    $('#btnCloseCatModal').addEventListener('click', () => $('#modalCategories').classList.remove('open'));
    $('#btnCloseLocModal').addEventListener('click', () => $('#modalLocations').classList.remove('open'));
    $$('.modal-overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal-overlay').forEach(o => o.classList.remove('open')); });

    updateSplitVisibility();
}