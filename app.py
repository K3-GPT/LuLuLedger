"""
小账本 · Web UI  —  Flask 后端
================================
把原来的 Tkinter 桌面记账程序改为 Web 版本。
后端负责：读写 CSV、提供 API；前端负责：液态玻璃 UI。
"""

import csv
import os
from datetime import datetime
from collections import defaultdict
from flask import Flask, render_template, jsonify, request, send_file
import io

app = Flask(__name__)

# ─── 数据文件 ───────────────────────────────────────────────
CSV_FILE = os.path.join(os.path.dirname(__file__), 'transactions.csv')
CSV_FIELDS = ['date', 'type', 'category', 'amount', 'description',
              'location', 'split_type', 'participants']

CAT_CN = {
    'Food': '餐饮', 'Transportation': '交通', 'Entertainment': '娱乐',
    'Shopping': '购物', 'Bills': '账单', 'Healthcare': '健康',
    'Education': '学习', 'Other': '其他', 'Salary': '工资',
    'Freelance': '兼职', 'Investment': '理财', 'Gift': '礼物'
}

CATEGORY_META = {
    'Food':         {'icon': '🍜', 'color': '#EFA7C8', 'bg': '#FFF0F6'},
    'Transportation': {'icon': '🚌', 'color': '#9CC8F3', 'bg': '#EEF7FF'},
    'Entertainment':  {'icon': '🎧', 'color': '#8B79D9', 'bg': '#EEE9FF'},
    'Shopping':       {'icon': '🛍️', 'color': '#EFA7C8', 'bg': '#FFF0F6'},
    'Bills':          {'icon': '🧾', 'color': '#F2BA73', 'bg': '#FFF5E8'},
    'Healthcare':     {'icon': '💊', 'color': '#78CFA9', 'bg': '#ECFAF3'},
    'Education':      {'icon': '📚', 'color': '#9CC8F3', 'bg': '#EEF7FF'},
    'Other':          {'icon': '✨', 'color': '#8B79D9', 'bg': '#EEE9FF'},
    'Salary':         {'icon': '💵', 'color': '#78CFA9', 'bg': '#ECFAF3'},
    'Freelance':      {'icon': '💻', 'color': '#9CC8F3', 'bg': '#EEF7FF'},
    'Investment':     {'icon': '📈', 'color': '#8B79D9', 'bg': '#EEE9FF'},
    'Gift':           {'icon': '🎁', 'color': '#EFA7C8', 'bg': '#FFF0F6'},
}


# ─── 读写 CSV ──────────────────────────────────────────────
def load_transactions():
    """从 CSV 加载所有记录"""
    records = []
    if not os.path.exists(CSV_FILE):
        return records
    try:
        with open(CSV_FILE, 'r', encoding='utf-8-sig') as f:
            for row in csv.DictReader(f):
                try:
                    row['amount'] = float(row['amount'])
                except (ValueError, TypeError):
                    continue
                row.setdefault('location', '')
                row.setdefault('split_type', 'single')
                try:
                    row['participants'] = int(row.get('participants') or 1)
                except (TypeError, ValueError):
                    row['participants'] = 1
                records.append(row)
    except (OSError, csv.Error):
        pass
    return records


def save_transactions(records):
    """保存所有记录到 CSV"""
    with open(CSV_FILE, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for t in records:
            writer.writerow({k: t.get(k, '') for k in CSV_FIELDS})


# ─── 路由：页面 ─────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')


# ─── 路由：API ──────────────────────────────────────────────
@app.route('/api/transactions', methods=['GET'])
def api_list():
    """获取所有记录（最新在前，最多 500 条）"""
    records = load_transactions()
    return jsonify(records[-500:][::-1])


@app.route('/api/transactions', methods=['POST'])
def api_add():
    """新增一条记录"""
    data = request.get_json(force=True)

    # 验证金额
    try:
        amount = float(data.get('amount', 0))
        if amount <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({'error': '金额必须大于 0'}), 400

    transaction = {
        'date': datetime.now().strftime('%Y-%m-%d %H:%M'),
        'type': data.get('type', 'Expense'),
        'category': data.get('category', 'Other'),
        'amount': amount,
        'description': (data.get('description') or '').strip(),
        'location': (data.get('location') or '').strip(),
        'split_type': data.get('split_type', 'single'),
        'participants': int(data.get('participants', 1)),
    }

    records = load_transactions()
    records.append(transaction)
    save_transactions(records)
    return jsonify({'ok': True, 'transaction': transaction})


@app.route('/api/transactions/<int:index>', methods=['DELETE'])
def api_delete(index):
    """按索引删除记录（从最新到最旧排序后的索引）"""
    records = load_transactions()
    # 前端传的 index 是倒序的
    real_index = len(records) - 1 - index
    if 0 <= real_index < len(records):
        removed = records.pop(real_index)
        save_transactions(records)
        return jsonify({'ok': True, 'removed': removed})
    return jsonify({'error': '记录不存在'}), 404


@app.route('/api/stats', methods=['GET'])
def api_stats():
    """获取统计数据（首页仪表盘）"""
    records = load_transactions()
    income = sum(t['amount'] for t in records if t['type'] == 'Income')
    expense = sum(t['amount'] for t in records if t['type'] == 'Expense')
    balance = income - expense

    month_prefix = datetime.now().strftime('%Y-%m')
    month_expense = sum(t['amount'] for t in records
                        if t['type'] == 'Expense' and t['date'].startswith(month_prefix))
    month_income = sum(t['amount'] for t in records
                       if t['type'] == 'Income' and t['date'].startswith(month_prefix))

    return jsonify({
        'balance': balance,
        'total_income': income,
        'total_expense': expense,
        'month_expense': month_expense,
        'month_income': month_income,
        'record_count': len(records),
    })


@app.route('/api/summary/<view>', methods=['GET'])
def api_summary(view):
    """按 category / day / location 汇总支出"""
    records = load_transactions()
    expenses = [t for t in records if t['type'] == 'Expense']
    result = defaultdict(float)

    for t in expenses:
        if view == 'category':
            key = t['category']
        elif view == 'day':
            key = t['date'][:10]
        elif view == 'location':
            key = t.get('location') or '未标注地点'
        else:
            return jsonify({'error': '无效的 view 参数'}), 400
        result[key] += t['amount']

    # 排序
    sorted_result = sorted(result.items(), key=lambda x: x[1], reverse=True)
    return jsonify([{'name': k, 'amount': v, 'label': CAT_CN.get(k, k)} for k, v in sorted_result])


@app.route('/api/locations', methods=['GET'])
def api_locations():
    """获取所有地点列表"""
    records = load_transactions()
    locations = sorted({t.get('location', '') for t in records if t.get('location')})
    return jsonify(locations)


@app.route('/api/categories', methods=['GET'])
def api_categories():
    """获取分类元数据"""
    return jsonify({
        'expense': ['Food', 'Transportation', 'Entertainment', 'Shopping',
                     'Bills', 'Healthcare', 'Education', 'Other'],
        'income': ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
        'meta': CATEGORY_META,
        'cn': CAT_CN,
    })


@app.route('/api/export', methods=['GET'])
def api_export():
    """导出 CSV 文件"""
    records = load_transactions()
    if not records:
        return jsonify({'error': '没有记录可导出'}), 404

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=CSV_FIELDS)
    writer.writeheader()
    for t in records:
        writer.writerow({k: t.get(k, '') for k in CSV_FIELDS})

    mem = io.BytesIO()
    mem.write(output.getvalue().encode('utf-8-sig'))
    mem.seek(0)
    filename = f'小账本_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    return send_file(mem, mimetype='text/csv', as_attachment=True, download_name=filename)


# ─── 启动 ──────────────────────────────────────────────────
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)