/* ============================================================
   小账本 · Web UI  —  前端逻辑
   ============================================================ */

// ─── 全局状态 ───
const state = {
    transactions: [],
    categories: { expense: [], income: [], meta: {}, cn: {} },
    currentPage: 'home',
    currentType: 'Expense',
    currentSplit: 'single',
    charts: {},
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
    // 设置日期输入默认值
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
    list.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = state.categories.cn[cat] || cat;
        sel.appendChild(opt);
    });
}

async function populateLocationList() {
    const locations = await api('/locations');
    const dl = $('#locationList');
    dl.innerHTML = '';
    locations.forEach(loc => {
        const opt = document.createElement('option');
        opt.value = loc;
        dl.appendChild(opt);
    });
    // 地点页面的 select
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
    if (state.currentPage === 'daily') loadDaily();
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
    $('#statMonthLabel').textContent = `${now.getFullYear()}年${now.getMonth() + 1}月`;
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
        // 如果弹窗开着，刷新弹窗
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
    if (splitType === 'aa') {
        participants = parseInt($('#inputParticipants').value) || 2;
        if (participants < 2) {
            toast('AA 分摊至少需要 2 人', 'error');
            return;
        }
    }

    const data = {
        type: state.currentType,
        category: $('#inputCategory').value,
        amount,
        description: $('#inputDesc').value.trim(),
        location: $('#inputLocation').value.trim(),
        split_type: splitType,
        participants,
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
    setSegmentValue('splitSegment', 'single');
    state.currentSplit = 'single';
    $('#participantsField').style.display = 'none';
    setSegmentValue('typeSegment', 'Expense');
    state.currentType = 'Expense';
    populateCategorySelect();
}

// ─── 页面导航 ───
function switchPage(page) {
    state.currentPage = page;
    // 更新导航按钮
    $$('.nav-btn[data-page]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
    // 切换页面
    $$('.page').forEach(p => p.classList.remove('active'));
    const target = $(`#page${capitalize(page)}`);
    if (target) target.classList.add('active');
    // 加载页面数据
    if (page === 'daily') loadDaily();
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
    list.innerHTML = txs.reverse().map((t, i) => renderItem(t, state.transactions.indexOf(t))).join('');
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
    list.innerHTML = txs.reverse().map(t => renderItem(t, state.transactions.indexOf(t))).join('');
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

    // 1. 类别饼图
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
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { size: 12 } } },
                },
                animation: { animateRotate: true, duration: 1200 },
            }
        });
    }

    // 2. 收入vs支出柱状图
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
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(139,121,217,0.06)' },
                        ticks: { callback: v => `¥${v.toLocaleString()}`, font: { size: 11 } },
                    },
                    x: { grid: { display: false }, ticks: { font: { size: 13, weight: 'bold' } } },
                },
                animation: { duration: 1000 },
            }
        });
    }

    // 3. 每日趋势折线图
    const dayData = {};
    expenses.forEach(t => {
        const day = t.date.slice(0, 10);
        dayData[day] = (dayData[day] || 0) + t.amount;
    });
    const sortedDays = Object.keys(dayData).sort().slice(-30); // 最近30天

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
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(139,121,217,0.06)' },
                        ticks: { callback: v => `¥${v.toLocaleString()}`, font: { size: 11 } },
                    },
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
    $('#inputAmount').addEventListener('keydown', e => {
        if (e.key === 'Enter') addTransaction();
    });
    $('#inputDesc').addEventListener('keydown', e => {
        if (e.key === 'Enter') addTransaction();
    });

    // 每日查询
    $('#btnDailyQuery').addEventListener('click', loadDaily);
    $('#dailyDate').addEventListener('change', loadDaily);

    // 地点查询
    $('#btnLocationQuery').addEventListener('click', loadLocation);
    $('#locationSelect').addEventListener('change', loadLocation);

    // 导出
    $('#btnExport').addEventListener('click', () => {
        window.location.href = '/api/export';
    });

    // 查看全部
    $('#btnViewAll').addEventListener('click', async () => {
        await loadAllRecords();
        $('#modalAllRecords').classList.add('open');
    });

    // 关闭弹窗
    $('#btnCloseModal').addEventListener('click', () => {
        $('#modalAllRecords').classList.remove('open');
    });
    $('#modalAllRecords').addEventListener('click', (e) => {
        if (e.target === $('#modalAllRecords')) {
            $('#modalAllRecords').classList.remove('open');
        }
    });

    // ESC 关闭弹窗
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            $('#modalAllRecords').classList.remove('open');
        }
    });
}