/* ============================================================
   小账本 · Web UI  —  前端逻辑  (v3.1)
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
};

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
    await loadCategories();
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
}

async function populateLocationList() {
    const locations = await api('/locations');
    const dl = $('#locationList');
    if (dl) {
        dl.innerHTML = '';
        locations.forEach(loc => {
            const opt = document.createElement('option');
            opt.value = loc;
            dl.appendChild(opt);
        });
    }
    const lSel = $('#locationSelect');
    if (lSel) {
        lSel.innerHTML = '<option value="">选择地点</option>';
        locations.forEach(loc => {
            const opt = document.createElement('option');
            opt.value = loc;
            opt.textContent = loc;
            lSel.appendChild(opt);
        });
    }
}

// ─── 刷新所有数据 ───
async function refreshAll() {
    state.transactions = await api('/transactions');
    updateStats();
    renderRecent();
    if (state.currentPage === 'daily') { loadDaily(); loadCalendar(); }
    if (state.currentPage === 'location') loadLocation();
    if (state.currentPage === 'summary') loadSummary();
    if (state.currentPage === 'charts') loadCharts();
}

// ─── 更新统计卡片 ───
async function updateStats() {
    const s = await api('/stats');
    $('#statBalance').textContent = money(s.balance);
    $('#statExpense').textContent = money(s.total_expense);
    $('#statIncome').textContent = money(s.total_income);
    $('#statMonth').textContent = money(s.month_expense);
    const now = new Date();
    $('#statMonthLabel').textContent = `${now.getFullYear()}年${now.getMonth() + 1}月 · 点击查看明细 →`;
}

// ─── 渲染最近记录 ───
function renderRecent() {
    const list = $('#recentList');
    const records = state.transactions.slice(0, 15);
    if (!records.length) {
        list.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🌷</span>
                <p class="empty-title">还没有记录呀</p>
                <p class="empty-sub">从左边记下今天的第一笔花费吧</p>
            </div>`;
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

    return `
        <div class="tx-item" data-index="${index}">
            <div class="tx-icon" style="background:${meta.bg};color:${meta.color}">${meta.icon}</div>
            <div class="tx-body">
                <div class="tx-title">${escHtml(desc)}</div>
                <div class="tx-meta">${parts.join('  ·  ')}</div>
            </div>
            <div class="tx-amount ${cls}">${sign}${money(amount)}</div>
            ${showDelete ? `<button class="tx-delete" onclick="deleteTx(${index})" title="删除">🗑</button>` : ''}
        </div>`;
}

function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

// ─── 删除记录 ───
async function deleteTx(index) {
    if (!confirm('确定要删除这笔记录吗？')) return;
    const res = await api(`/transactions/${index}`, { method: 'DELETE' });
    if (res.ok) {
        toast('已删除 · 记录已移除 ✨');
        await refreshAll();
        if ($('#modalAllRecords').classList.contains('open')) loadAllRecords();
    } else {
        toast(res.error || '删除失败', 'error');
    }
}

// ─── 添加记录 ───
async function addTransaction() {
    const amount = parseFloat($('#inputAmount').value);
    if (!amount || amount <= 0) {
        toast('请输入大于 0 的金额', 'error');
        return;
    }

    const splitType = state.currentSplit;
    let participants = 1;
    if (state.currentType === 'Expense' && splitType === 'aa') {
        participants = parseInt($('#inputParticipants').value) || 2;
        if (participants < 2) {
            toast('AA 分摊至少需要 2 人', 'error');
            return;
        }
    }

    let category = $('#inputCategory').value;
    // 自定义分类
    if (category === '__custom__') {
        const custom = $('#inputCustomCategory').value.trim();
        if (!custom) {
            toast('请输入自定义分类名称', 'error');
            return;
        }
        category = custom;
    }

    const data = {
        type: state.currentType,
        category,
        amount,
        description: $('#inputDesc').value.trim(),
        location: $('#inputLocation').value.trim(),
        split_type: state.currentType === 'Expense' ? splitType : 'single',
        participants: state.currentType === 'Expense' ? participants : 1,
    };

    const res = await api('/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
    });

    if (res.ok) {
        toast('已保存 · 这笔账记好了 ✨');
        resetForm();
        await refreshAll();
        await populateLocationList();
    } else {
        toast(res.error || '保存失败', 'error');
    }
}

function resetForm() {
    $('#inputAmount').value = '';
    $('#inputDesc').value = '';
    $('#inputLocation').value = '';
    $('#inputParticipants').value = '2';
    $('#inputCustomCategory').value = '';
    $('#inputCustomCategory').style.display = 'none';
    $('#autoDetectHint').textContent = '';
    $('#autoDetectHint').classList.remove('visible');
    setSegmentValue('splitSegment', 'single');
    state.currentSplit = 'single';
    $('#participantsField').style.display = 'none';
    setSegmentValue('typeSegment', 'Expense');
    state.currentType = 'Expense';
    updateSplitVisibility();
    populateCategorySelect();
}

// ─── 页面导航 ───
function switchPage(page) {
    state.currentPage = page;
    $$('.nav-btn[data-page]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
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
    const container = $(`#${containerId}`);
    if (!container) return;
    container.querySelectorAll('.seg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (onChange) onChange(btn.dataset.value);
        });
    });
}

function setSegmentValue(containerId, value) {
    const container = $(`#${containerId}`);
    if (!container) return;
    container.querySelectorAll('.seg-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === value);
    });
}

// ─── 收入/支出切换时，分摊方式显隐 ───
function updateSplitVisibility() {
    const isIncome = state.currentType === 'Income';
    $('#splitField').style.display = isIncome ? 'none' : 'block';
    if (isIncome) {
        state.currentSplit = 'single';
        $('#participantsField').style.display = 'none';
    }
}

// ─── 自动分类识别 ───
let detectTimer = null;
async function onDescInput() {
    const desc = $('#inputDesc').value.trim();
    const hint = $('#autoDetectHint');
    if (!desc) {
        hint.textContent = '';
        hint.classList.remove('visible');
        return;
    }
    clearTimeout(detectTimer);
    detectTimer = setTimeout(async () => {
        const res = await api('/detect-category', {
            method: 'POST',
            body: JSON.stringify({ description: desc }),
        });
        if (res.category) {
            // 自动选中
            const sel = $('#inputCategory');
            const options = Array.from(sel.options).map(o => o.value);
            if (options.includes(res.category)) {
                sel.value = res.category;
            }
            hint.textContent = `✨ 已自动识别为「${res.label}」`;
            hint.classList.add('visible');
        } else {
            hint.textContent = '';
            hint.classList.remove('visible');
        }
    }, 500);
}

// ─── 统计卡片点击 → 筛选页面 ───
async function openFilterPage(filterType) {
    const titles = {
        'Expense': { title: '全部支出', sub: '所有已记录的支出明细' },
        'Income': { title: '全部收入', sub: '所有已记录的收入明细' },
        'month': { title: '本月支出', sub: `${new Date().getFullYear()}年${new Date().getMonth() + 1}月支出明细` },
    };
    const info = titles[filterType] || { title: '筛选结果', sub: '' };
    $('#filterTitle').textContent = info.title;
    $('#filterSubtitle').textContent = info.sub;

    let url = '/transactions/filter?';
    if (filterType === 'Expense' || filterType === 'Income') {
        url += `type=${filterType}`;
    } else if (filterType === 'month') {
        url += `type=Expense&month=${new Date().toISOString().slice(0, 7)}`;
    }

    const records = await api(url);
    const total = records.reduce((s, t) => s + t.amount, 0);
    $('#filterTotal').textContent = `共 ${records.length} 条 · 合计 ${money(total)}`;

    const list = $('#filterList');
    if (!records.length) {
        list.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📋</span>
                <p class="empty-title">暂无记录</p>
            </div>`;
    } else {
        list.innerHTML = records.map((t, i) => {
            // 找到在全局 transactions 中的真实索引
            const realIdx = state.transactions.findIndex(tr =>
                tr.date === t.date && tr.amount === t.amount && tr.description === t.description
            );
            return renderItem(t, realIdx >= 0 ? realIdx : 0, true);
        }).join('');
    }

    // 切换到筛选页面
    $$('.page').forEach(p => p.classList.remove('active'));
    $('#pageFilter').classList.add('active');
}

// ─── 每日明细 ───
async function loadDaily() {
    const date = $('#dailyDate').value;
    if (!date) return;
    const txs = state.transactions.filter(t => t.date.startsWith(date));
    const expenses = txs.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
    const incomes = txs.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
    $('#dailyTotal').textContent = `支出 ${money(expenses)}   ·   收入 ${money(incomes)}`;
    const list = $('#dailyList');
    if (!txs.length) {
        list.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🌙</span>
                <p class="empty-title">这一天还没有记账</p>
            </div>`;
        return;
    }
    list.innerHTML = txs.slice().reverse().map(t => renderItem(t, state.transactions.indexOf(t))).join('');
}

// ─── 日历组件 ───
async function loadCalendar() {
    const ym = `${state.calendarYear}-${String(state.calendarMonth).padStart(2, '0')}`;
    state.calendarData = await api(`/calendar/${ym}`);
    renderCalendar();
}

function renderCalendar() {
    const y = state.calendarYear;
    const m = state.calendarMonth;
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    $('#calendarTitle').textContent = `${y} 年 ${String(m).padStart(2, '0')} 月`;

    const grid = $('#calendarGrid');
    grid.innerHTML = '';

    // 星期头
    const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
    weekdays.forEach(w => {
        const el = document.createElement('div');
        el.className = 'cal-weekday';
        el.textContent = w;
        grid.appendChild(el);
    });

    // 计算本月第一天是星期几（0=周一）
    const firstDay = new Date(y, m - 1, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1; // 转换为周一起始
    const daysInMonth = new Date(y, m, 0).getDate();

    // 填充空白
    for (let i = 0; i < offset; i++) {
        const el = document.createElement('div');
        el.className = 'cal-day empty';
        grid.appendChild(el);
    }

    // 日期格子
    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const data = state.calendarData[dateKey];
        const el = document.createElement('div');
        el.className = 'cal-day';

        const isToday = dateKey === todayStr;
        if (isToday) el.classList.add('today');

        if (data && data.count > 0) {
            el.classList.add('has-data');
            if (data.income >= data.expense) {
                el.classList.add('income-gt');
            } else {
                el.classList.add('expense-gt');
            }
            el.innerHTML = `<span>${d}</span><span class="cal-count">${data.count}笔</span>`;
        } else {
            el.innerHTML = `<span>${d}</span>`;
        }

        el.addEventListener('click', () => {
            $('#dailyDate').value = dateKey;
            loadDaily();
        });

        grid.appendChild(el);
    }
}

// ─── 旅行地点 ───
async function loadLocation() {
    const loc = $('#locationSelect').value;
    if (!loc) {
        $('#locationTotal').textContent = '';
        $('#locationList2').innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🌿</span>
                <p class="empty-title">请选择一个地点</p>
            </div>`;
        return;
    }
    const txs = state.transactions.filter(t => t.location === loc);
    const total = txs.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
    $('#locationTotal').textContent = `地点支出 ${money(total)}`;
    const list = $('#locationList2');
    if (!txs.length) {
        list.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🌿</span>
                <p class="empty-title">这个地点暂时没有记录</p>
            </div>`;
        return;
    }
    list.innerHTML = txs.slice().reverse().map(t => renderItem(t, state.transactions.indexOf(t))).join('');
}

// ─── 消费分析 ───
let currentSummaryView = 'category';

async function loadSummary() {
    const data = await api(`/summary/${currentSummaryView}`);
    const total = data.reduce((s, d) => s + d.amount, 0);
    $('#summaryTotal').textContent = `总支出 ${money(total)}`;
    const grid = $('#summaryGrid');
    if (!data.length) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1">
                <span class="empty-icon">✦</span>
                <p class="empty-title">还没有足够的数据进行分析</p>
            </div>`;
        return;
    }
    const maxAmount = data[0]?.amount || 1;
    grid.innerHTML = data.map(d => {
        const pct = total > 0 ? (d.amount / total * 100) : 0;
        const barW = (d.amount / maxAmount * 100);
        const label = currentSummaryView === 'category' ? d.label : d.name;
        return `
            <div class="summary-item glass-card">
                <div class="summary-item-name">${escHtml(label)}</div>
                <div class="summary-item-amount">${money(d.amount)}</div>
                <span class="summary-item-pct">${pct.toFixed(1)}%</span>
                <div class="summary-bar-track">
                    <div class="summary-bar-fill" style="width:${barW}%"></div>
                </div>
            </div>`;
    }).join('');
}

// ─── 可视化图表 ───
async function loadCharts() {
    const expenses = state.transactions.filter(t => t.type === 'Expense');

    const catData = {};
    expenses.forEach(t => {
        const label = state.categories.cn[t.category] || t.category;
        catData[label] = (catData[label] || 0) + t.amount;
    });

    const pieColors = ['#8B79D9', '#EFA7C8', '#9CC8F3', '#78CFA9', '#F2BA73', '#E7839B', '#B8A0E8', '#FFB6D9'];

    destroyChart('chartCategory');
    const ctx1 = $('#chartCategory');
    if (ctx1) {
        state.charts.chartCategory = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: Object.keys(catData),
                datasets: [{
                    data: Object.values(catData),
                    backgroundColor: pieColors.slice(0, Object.keys(catData).length),
                    borderWidth: 3,
                    borderColor: 'rgba(255,255,255,0.8)',
                    hoverOffset: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '55%',
                plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { size: 12 } } } },
                animation: { animateRotate: true, duration: 1200 },
            }
        });
    }

    const totalIncome = state.transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);

    destroyChart('chartIncomeExpense');
    const ctx2 = $('#chartIncomeExpense');
    if (ctx2) {
        state.charts.chartIncomeExpense = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: ['收入', '支出'],
                datasets: [{
                    data: [totalIncome, totalExpense],
                    backgroundColor: ['rgba(120, 207, 169, 0.7)', 'rgba(231, 131, 155, 0.7)'],
                    borderColor: ['#78CFA9', '#E7839B'],
                    borderWidth: 2,
                    borderRadius: 12,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(139,121,217,0.06)' }, ticks: { callback: v => `¥${v.toLocaleString()}`, font: { size: 11 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 13, weight: 'bold' } } },
                },
                animation: { duration: 1000 },
            }
        });
    }

    const dayData = {};
    expenses.forEach(t => {
        const day = t.date.slice(0, 10);
        dayData[day] = (dayData[day] || 0) + t.amount;
    });
    const sortedDays = Object.keys(dayData).sort().slice(-30);

    destroyChart('chartTrend');
    const ctx3 = $('#chartTrend');
    if (ctx3) {
        state.charts.chartTrend = new Chart(ctx3, {
            type: 'line',
            data: {
                labels: sortedDays.map(d => d.slice(5)),
                datasets: [{
                    label: '每日支出',
                    data: sortedDays.map(d => dayData[d]),
                    borderColor: '#8B79D9',
                    backgroundColor: 'rgba(139, 121, 217, 0.08)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#8B79D9',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(139,121,217,0.06)' }, ticks: { callback: v => `¥${v.toLocaleString()}`, font: { size: 11 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                },
                animation: { duration: 1200 },
            }
        });
    }
}

function destroyChart(id) {
    if (state.charts[id]) {
        state.charts[id].destroy();
        state.charts[id] = null;
    }
}

// ─── 全部记录弹窗 ───
async function loadAllRecords() {
    const list = $('#allRecordsList');
    const txs = state.transactions;
    if (!txs.length) {
        list.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🌷</span>
                <p class="empty-title">还没有记录</p>
            </div>`;
        return;
    }
    list.innerHTML = txs.slice(0, 200).map((t, i) => renderItem(t, i, true)).join('');
}

// ─── 分类管理弹窗 ───
async function openCategoryModal() {
    state.categories = await api('/categories');
    renderCategoryLists();
    $('#modalCategories').classList.add('open');
}

function renderCategoryLists() {
    const { expense, income, meta, cn } = state.categories;

    // 支出分类
    const expList = $('#expenseCatList');
    expList.innerHTML = expense.map(cat => {
        const m = meta[cat] || { icon: '✨' };
        const label = cn[cat] || cat;
        const isDefault = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education'].includes(cat);
        return `
            <div class="cat-tag" data-cat="${cat}" data-type="expense">
                <span class="cat-icon">${m.icon}</span>
                <span class="cat-name">${cat}</span>
                <span class="cat-cn">${label}</span>
                <div class="cat-actions">
                    <button class="btn-cat-edit" onclick="editCategoryIcon('${cat}')" title="修改图标">✏</button>
                    ${!isDefault ? `<button class="btn-cat-delete" onclick="deleteCategory('${cat}')" title="删除">✕</button>` : ''}
                </div>
            </div>`;
    }).join('');

    // 收入分类
    const incList = $('#incomeCatList');
    incList.innerHTML = income.map(cat => {
        const m = meta[cat] || { icon: '✨' };
        const label = cn[cat] || cat;
        const isDefault = ['Salary', 'Freelance', 'Investment', 'Gift'].includes(cat);
        return `
            <div class="cat-tag" data-cat="${cat}" data-type="income">
                <span class="cat-icon">${m.icon}</span>
                <span class="cat-name">${cat}</span>
                <span class="cat-cn">${label}</span>
                <div class="cat-actions">
                    <button class="btn-cat-edit" onclick="editCategoryIcon('${cat}')" title="修改图标">✏</button>
                    ${!isDefault ? `<button class="btn-cat-delete" onclick="deleteCategory('${cat}')" title="删除">✕</button>` : ''}
                </div>
            </div>`;
    }).join('');
}

async function addCategory(type) {
    const prefix = type === 'expense' ? 'Expense' : 'Income';
    const name = $(`#new${prefix}CatName`).value.trim();
    const cnName = $(`#new${prefix}CatCN`).value.trim();
    const icon = $(`#new${prefix}CatIcon`).value.trim() || '✨';

    if (!name) { toast('请输入分类英文名', 'error'); return; }

    const res = await api('/categories', {
        method: 'POST',
        body: JSON.stringify({ name, type, cn_name: cnName || name, icon }),
    });

    if (res.ok) {
        toast('分类已添加 ✨');
        $(`#new${prefix}CatName`).value = '';
        $(`#new${prefix}CatCN`).value = '';
        $(`#new${prefix}CatIcon`).value = '';
        state.categories = await api('/categories');
        renderCategoryLists();
        populateCategorySelect();
    } else {
        toast(res.error || '添加失败', 'error');
    }
}

async function editCategoryIcon(cat) {
    const newIcon = prompt(`修改「${state.categories.cn[cat] || cat}」的图标（输入 emoji）`, state.categories.meta[cat]?.icon || '✨');
    if (newIcon === null) return;
    const res = await api(`/categories/${encodeURIComponent(cat)}`, {
        method: 'PUT',
        body: JSON.stringify({ icon: newIcon }),
    });
    if (res.ok) {
        toast('图标已更新 ✨');
        state.categories = await api('/categories');
        renderCategoryLists();
    }
}

async function deleteCategory(cat) {
    if (!confirm(`确定删除分类「${state.categories.cn[cat] || cat}」吗？`)) return;
    const res = await api(`/categories/${encodeURIComponent(cat)}`, { method: 'DELETE' });
    if (res.ok) {
        toast('分类已删除');
        state.categories = await api('/categories');
        renderCategoryLists();
        populateCategorySelect();
    } else {
        toast(res.error || '删除失败', 'error');
    }
}

// ─── 地点管理弹窗 ───
async function openLocationModal() {
    const locations = await api('/locations');
    renderLocationManageList(locations);
    $('#modalLocations').classList.add('open');
}

function renderLocationManageList(locations) {
    const list = $('#locationManageList');
    if (!locations.length) {
        list.innerHTML = '<p style="color:var(--muted);font-size:0.82rem">暂无地点记录</p>';
        return;
    }
    list.innerHTML = locations.map(loc => `
        <div class="cat-tag" data-loc="${escHtml(loc)}">
            <span class="cat-icon">📍</span>
            <span class="cat-name">${escHtml(loc)}</span>
            <div class="cat-actions">
                <button class="btn-cat-edit" onclick="editLocation('${escHtml(loc)}')" title="编辑">✏</button>
                <button class="btn-cat-delete" onclick="deleteLocation('${escHtml(loc)}')" title="删除">✕</button>
            </div>
        </div>`
    ).join('');
}

async function addLocation() {
    const name = $('#newLocationName').value.trim();
    if (!name) { toast('请输入地点名称', 'error'); return; }
    const res = await api('/locations', {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
    if (res.ok) {
        toast('地点已添加 📍');
        $('#newLocationName').value = '';
        const locations = await api('/locations');
        renderLocationManageList(locations);
        populateLocationList();
    }
}

async function editLocation(oldName) {
    const newName = prompt(`修改地点名称`, oldName);
    if (newName === null || newName.trim() === oldName) return;
    const res = await api(`/locations/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
        toast('地点已更新 📍');
        const locations = await api('/locations');
        renderLocationManageList(locations);
        populateLocationList();
        await refreshAll();
    }
}

async function deleteLocation(name) {
    if (!confirm(`确定删除地点「${name}」吗？`)) return;
    const res = await api(`/locations/${encodeURIComponent(name)}`, { method: 'DELETE' });
    if (res.ok) {
        toast('地点已删除');
        const locations = await api('/locations');
        renderLocationManageList(locations);
        populateLocationList();
    }
}

// ─── 事件绑定 ───
function bindEvents() {
    // 导航
    $$('.nav-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => switchPage(btn.dataset.page));
    });

    // 类型切换
    initSegment('typeSegment', (val) => {
        state.currentType = val;
        populateCategorySelect();
        updateSplitVisibility();
    });

    // 分摊切换
    initSegment('splitSegment', (val) => {
        state.currentSplit = val;
        $('#participantsField').style.display = val === 'aa' ? 'block' : 'none';
        if (val === 'aa' && (!$('#inputParticipants').value || $('#inputParticipants').value < 2)) {
            $('#inputParticipants').value = '2';
        }
    });

    // 分析视图切换
    initSegment('summarySegment', (val) => {
        currentSummaryView = val;
        loadSummary();
    });

    // 添加记录
    $('#btnAdd').addEventListener('click', addTransaction);

    // 回车提交
    $('#inputAmount').addEventListener('keydown', e => { if (e.key === 'Enter') addTransaction(); });
    $('#inputDesc').addEventListener('keydown', e => { if (e.key === 'Enter') addTransaction(); });

    // 备注自动分类
    $('#inputDesc').addEventListener('input', onDescInput);

    // 每日查询
    $('#btnDailyQuery').addEventListener('click', loadDaily);
    $('#dailyDate').addEventListener('change', loadDaily);

    // 地点查询
    $('#btnLocationQuery').addEventListener('click', loadLocation);
    $('#locationSelect').addEventListener('change', loadLocation);

    // 导出
    $('#btnExport').addEventListener('click', () => { window.location.href = '/api/export'; });

    // 查看全部
    $('#btnViewAll').addEventListener('click', async () => {
        await loadAllRecords();
        $('#modalAllRecords').classList.add('open');
    });

    // 统计卡片点击
    $$('.stat-clickable').forEach(card => {
        card.addEventListener('click', () => {
            const filter = card.dataset.filter;
            if (filter === 'balance') return; // 结余不可点击
            openFilterPage(filter);
        });
    });

    // 筛选页返回
    $('#btnBackFilter').addEventListener('click', () => {
        $$('.page').forEach(p => p.classList.remove('active'));
        $('#pageHome').classList.add('active');
        state.currentPage = 'home';
    });

    // 日历导航
    $('#btnCalPrev').addEventListener('click', () => {
        state.calendarMonth--;
        if (state.calendarMonth < 1) { state.calendarMonth = 12; state.calendarYear--; }
        loadCalendar();
    });
    $('#btnCalNext').addEventListener('click', () => {
        state.calendarMonth++;
        if (state.calendarMonth > 12) { state.calendarMonth = 1; state.calendarYear++; }
        loadCalendar();
    });
    $('#btnCalToday').addEventListener('click', () => {
        const now = new Date();
        state.calendarYear = now.getFullYear();
        state.calendarMonth = now.getMonth() + 1;
        $('#dailyDate').value = now.toISOString().slice(0, 10);
        loadCalendar();
        loadDaily();
    });

    // 分类管理
    $('#btnManageCategories').addEventListener('click', openCategoryModal);
    $('#btnAddExpenseCat').addEventListener('click', () => addCategory('expense'));
    $('#btnAddIncomeCat').addEventListener('click', () => addCategory('income'));

    // 地点管理
    $('#btnManageLocations').addEventListener('click', openLocationModal);
    $('#btnAddLocation').addEventListener('click', addLocation);

    // 关闭弹窗
    $('#btnCloseModal').addEventListener('click', () => $('#modalAllRecords').classList.remove('open'));
    $('#btnCloseCatModal').addEventListener('click', () => $('#modalCategories').classList.remove('open'));
    $('#btnCloseLocModal').addEventListener('click', () => $('#modalLocations').classList.remove('open'));

    // 点击遮罩关闭
    $$('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('open');
        });
    });

    // ESC 关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            $$('.modal-overlay').forEach(o => o.classList.remove('open'));
        }
    });

    // 初始化分摊可见性
    updateSplitVisibility();
}