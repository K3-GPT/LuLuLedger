"""
小账本 · Web UI  —  Flask 后端 (v2)
======================================
新增功能：
  - 自定义分类 CRUD (新增/编辑/删除)
  - 自定义地点 CRUD
  - 备注自动识别分类
  - 日历标记数据 API (红绿配色)
  - 按日期筛选交易 API
"""

import csv
import os
import json
from datetime import datetime
from collections import defaultdict
from flask import Flask, render_template, jsonify, request, send_file
import io

app = Flask(__name__)

# ─── 数据文件 ───────────────────────────────────────────────
BASE_DIR = os.path.dirname(__file__)
CSV_FILE = os.path.join(BASE_DIR, 'transactions.csv')
CUSTOM_FILE = os.path.join(BASE_DIR, 'custom_data.json')
CSV_FIELDS = ['date', 'type', 'category', 'amount', 'description',
              'location', 'split_type', 'participants']

# ─── 默认分类 ───────────────────────────────────────────────
DEFAULT_EXPENSE_CATS = [
    'Food', 'Transportation', 'Entertainment', 'Shopping',
    'Bills', 'Healthcare', 'Education', 'Other'
]
DEFAULT_INCOME_CATS = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']

CAT_CN = {
    'Food': '餐饮', 'Transportation': '交通', 'Entertainment': '娱乐',
    'Shopping': '购物', 'Bills': '账单', 'Healthcare': '健康',
    'Education': '学习', 'Other': '其他', 'Salary': '工资',
    'Freelance': '兼职', 'Investment': '理财', 'Gift': '礼物'
}

CATEGORY_META = {
    'Food':           {'icon': '🍜', 'color': '#EFA7C8', 'bg': '#FFF0F6'},
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

# ─── 自动分类关键词映射 ─────────────────────────────────────
AUTO_CATEGORY_KEYWORDS = {
    'Food': ['吃', '餐', '饭', '火锅', '外卖', '奶茶', '咖啡', '早餐', '午餐', '晚餐',
             '零食', '烧烤', '面', '米', '菜', '蛋糕', '饮料', '水果', '食', '食堂',
             '麦当劳', '肯德基', '星巴克', '海底捞', '美团', '饿了么'],
    'Transportation': ['地铁', '公交', '打车', '滴滴', '出租', '高铁', '火车', '飞机',
                       '机票', '车票', '油费', '停车', '过路费', '通勤', '骑车', '单车'],
    'Entertainment': ['电影', '游戏', 'KTV', '唱歌', '演出', '门票', '旅游', '景点',
                      '门票', '剧本杀', '密室', '酒吧', '演唱会', '音乐', '视频', '会员'],
    'Shopping': ['买', '衣服', '鞋', '包', '化妆品', '护肤', '日用品', '超市',
                 '淘宝', '京东', '拼多多', '数码', '手机', '电脑', '耳机'],
    'Bills': ['电费', '水费', '燃气', '房租', '话费', '网费', '物业', '账单', '还款'],
    'Healthcare': ['医院', '药', '体检', '看病', '挂号', '牙', '眼镜', '保健'],
    'Education': ['书', '课程', '培训', '学费', '考试', '报名', '教材', '文具'],
}

# ─── 自定义数据管理 ──────────────────────────────────────────
def load_custom_data():
    """加载自定义分类和地点"""
    default = {
        'expense_categories': list(DEFAULT_EXPENSE_CATS),
        'income_categories': list(DEFAULT_INCOME_CATS),
        'cat_cn': dict(CAT_CN),
        'cat_meta': {},
        'locations': [],
    }
    if os.path.exists(CUSTOM_FILE):
        try:
            with open(CUSTOM_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # 合并默认值
                for k, v in default.items():
                    data.setdefault(k, v)
                return data
        except (OSError, json.JSONDecodeError):
            pass
    return default


def save_custom_data(data):
    """保存自定义数据"""
    with open(CUSTOM_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_all_meta():
    """获取所有分类的元数据（默认 + 自定义）"""
    meta = dict(CATEGORY_META)
    custom = load_custom_data()
    meta.update(custom.get('cat_meta', {}))
    return meta


def get_all_cn():
    """获取所有分类的中文名"""
    cn = dict(CAT_CN)
    custom = load_custom_data()
    cn.update(custom.get('cat_cn', {}))
    return cn


# ─── 自动分类识别 ────────────────────────────────────────────
def auto_detect_category(description):
    """根据备注内容自动识别分类"""
    if not description:
        return None
    desc = description.lower()
    for cat, keywords in AUTO_CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in desc:
                return cat
    return None


# ─── 读写 CSV ──────────────────────────────────────────────
def load_transactions():
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
    with open(CSV_FILE, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for t in records:
            writer.writerow({k: t.get(k, '') for k in CSV_FIELDS})


# ─── 路由：页面 ─────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')


# ─── API：交易记录 ──────────────────────────────────────────
@app.route('/api/transactions', methods=['GET'])
def api_list():
    records = load_transactions()
    return jsonify(records[-500:][::-1])


@app.route('/api/transactions', methods=['POST'])
def api_add():
    data = request.get_json(force=True)
    try:
        amount = float(data.get('amount', 0))
        if amount <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({'error': '金额必须大于 0'}), 400

    tx_type = data.get('type', 'Expense')
    split_type = 'single'
    participants = 1
    # 收入没有分摊方式
    if tx_type == 'Expense':
        split_type = data.get('split_type', 'single')
        participants = int(data.get('participants', 1))

    transaction = {
        'date': datetime.now().strftime('%Y-%m-%d %H:%M'),
        'type': tx_type,
        'category': data.get('category', 'Other'),
        'amount': amount,
        'description': (data.get('description') or '').strip(),
        'location': (data.get('location') or '').strip(),
        'split_type': split_type,
        'participants': participants,
    }

    records = load_transactions()
    records.append(transaction)
    save_transactions(records)
    return jsonify({'ok': True, 'transaction': transaction})


@app.route('/api/transactions/<int:index>', methods=['DELETE'])
def api_delete(index):
    records = load_transactions()
    real_index = len(records) - 1 - index
    if 0 <= real_index < len(records):
        removed = records.pop(real_index)
        save_transactions(records)
        return jsonify({'ok': True, 'removed': removed})
    return jsonify({'error': '记录不存在'}), 404


# ─── API：统计 ──────────────────────────────────────────────
@app.route('/api/stats', methods=['GET'])
def api_stats():
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


# ─── API：自动分类识别 ──────────────────────────────────────
@app.route('/api/detect-category', methods=['POST'])
def api_detect_category():
    data = request.get_json(force=True)
    desc = data.get('description', '')
    detected = auto_detect_category(desc)
    if detected:
        cn = get_all_cn()
        return jsonify({'category': detected, 'label': cn.get(detected, detected)})
    return jsonify({'category': None})


# ─── API：分类管理 ──────────────────────────────────────────
@app.route('/api/categories', methods=['GET'])
def api_categories():
    custom = load_custom_data()
    cn = get_all_cn()
    meta = get_all_meta()
    return jsonify({
        'expense': custom['expense_categories'],
        'income': custom['income_categories'],
        'meta': meta,
        'cn': cn,
    })


@app.route('/api/categories', methods=['POST'])
def api_add_category():
    """新增自定义分类"""
    data = request.get_json(force=True)
    name = (data.get('name') or '').strip()
    cat_type = data.get('type', 'expense')  # expense / income
    icon = data.get('icon', '✨')
    cn_name = (data.get('cn_name') or name).strip()

    if not name:
        return jsonify({'error': '分类名称不能为空'}), 400

    custom = load_custom_data()
    key = f'{cat_type}_categories'

    if name in custom[key]:
        return jsonify({'error': '分类已存在'}), 400

    custom[key].append(name)
    custom['cat_cn'][name] = cn_name
    custom['cat_meta'][name] = {
        'icon': icon,
        'color': '#8B79D9',
        'bg': '#EEE9FF',
    }
    save_custom_data(custom)
    return jsonify({'ok': True})


@app.route('/api/categories/<name>', methods=['PUT'])
def api_update_category(name):
    """编辑自定义分类"""
    data = request.get_json(force=True)
    new_cn = (data.get('cn_name') or '').strip()
    new_icon = data.get('icon', '').strip()

    custom = load_custom_data()

    if new_cn:
        custom['cat_cn'][name] = new_cn
    if new_icon:
        if name not in custom['cat_meta']:
            custom['cat_meta'][name] = {'icon': '✨', 'color': '#8B79D9', 'bg': '#EEE9FF'}
        custom['cat_meta'][name]['icon'] = new_icon

    save_custom_data(custom)
    return jsonify({'ok': True})


@app.route('/api/categories/<name>', methods=['DELETE'])
def api_delete_category(name):
    """删除自定义分类（内置分类不可删除，只能隐藏）"""
    custom = load_custom_data()

    removed = False
    for key in ['expense_categories', 'income_categories']:
        if name in custom[key]:
            # 内置分类不允许删除
            defaults = DEFAULT_EXPENSE_CATS + DEFAULT_INCOME_CATS
            if name in defaults and name != 'Other':
                return jsonify({'error': f'{name} 是内置分类，不能删除'}), 400
            custom[key].remove(name)
            removed = True

    if not removed:
        return jsonify({'error': '分类不存在'}), 404

    # 清理自定义元数据
    custom.get('cat_meta', {}).pop(name, None)
    custom.get('cat_cn', {}).pop(name, None)
    save_custom_data(custom)
    return jsonify({'ok': True})


# ─── API：地点管理 ──────────────────────────────────────────
@app.route('/api/locations', methods=['GET'])
def api_locations():
    """获取所有地点（交易中出现的 + 自定义的）"""
    records = load_transactions()
    custom = load_custom_data()
    from_tx = {t.get('location', '') for t in records if t.get('location')}
    all_locs = sorted(from_tx | set(custom.get('locations', [])))
    return jsonify(all_locs)


@app.route('/api/locations', methods=['POST'])
def api_add_location():
    """新增自定义地点"""
    data = request.get_json(force=True)
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': '地点名称不能为空'}), 400

    custom = load_custom_data()
    if name not in custom['locations']:
        custom['locations'].append(name)
        save_custom_data(custom)
    return jsonify({'ok': True})


@app.route('/api/locations/<name>', methods=['PUT'])
def api_update_location(name):
    """编辑地点名称"""
    data = request.get_json(force=True)
    new_name = (data.get('name') or '').strip()
    if not new_name:
        return jsonify({'error': '新名称不能为空'}), 400

    custom = load_custom_data()
    # 更新自定义列表
    if name in custom['locations']:
        idx = custom['locations'].index(name)
        custom['locations'][idx] = new_name
    # 更新所有交易记录中的地点
    records = load_transactions()
    changed = False
    for t in records:
        if t.get('location') == name:
            t['location'] = new_name
            changed = True
    if changed:
        save_transactions(records)
    save_custom_data(custom)
    return jsonify({'ok': True})


@app.route('/api/locations/<name>', methods=['DELETE'])
def api_delete_location(name):
    """删除自定义地点"""
    custom = load_custom_data()
    if name in custom['locations']:
        custom['locations'].remove(name)
        save_custom_data(custom)
    return jsonify({'ok': True})


# ─── API：日历标记数据 ──────────────────────────────────────
@app.route('/api/calendar/<year_month>', methods=['GET'])
def api_calendar(year_month):
    """
    返回指定月份每天的收支情况。
    格式: { "2026-09-01": { "income": 100, "expense": 50, "count": 2 }, ... }
    """
    records = load_transactions()
    day_data = {}
    for t in records:
        if not t['date'].startswith(year_month):
            continue
        day = t['date'][:10]
        if day not in day_data:
            day_data[day] = {'income': 0, 'expense': 0, 'count': 0}
        if t['type'] == 'Income':
            day_data[day]['income'] += t['amount']
        else:
            day_data[day]['expense'] += t['amount']
        day_data[day]['count'] += 1
    return jsonify(day_data)


# ─── API：按类型筛选交易 ────────────────────────────────────
@app.route('/api/transactions/filter', methods=['GET'])
def api_filter_transactions():
    """
    筛选交易记录。
    参数: type=Expense/Income, month=2026-09 (可选)
    """
    tx_type = request.args.get('type', '')
    month = request.args.get('month', '')

    records = load_transactions()
    if tx_type:
        records = [t for t in records if t['type'] == tx_type]
    if month:
        records = [t for t in records if t['date'].startswith(month)]

    return jsonify(records[::-1])


# ─── API：汇总分析 ──────────────────────────────────────────
@app.route('/api/summary/<view>', methods=['GET'])
def api_summary(view):
    records = load_transactions()
    expenses = [t for t in records if t['type'] == 'Expense']
    result = defaultdict(float)
    cn = get_all_cn()

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

    sorted_result = sorted(result.items(), key=lambda x: x[1], reverse=True)
    return jsonify([{'name': k, 'amount': v, 'label': cn.get(k, k)} for k, v in sorted_result])


# ─── API：导出 ──────────────────────────────────────────────
@app.route('/api/export', methods=['GET'])
def api_export():
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