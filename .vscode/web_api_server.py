#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, jsonify, request, render_template_string
import sqlite3
from datetime import datetime
import json

app = Flask(__name__)

# HTML 템플릿
RANKING_STATUS_HTML = '''
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>순위 체크 현황</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .coupang { background-color: #fff3e6; }
        .naver { background-color: #f0f8ff; }
    </style>
</head>
<body>
    <h1>랭킹 체크 현황</h1>
    <table>
        <tr>
            <th>순번</th>
            <th>슬롯유형</th>
            <th>검색어</th>
            <th>링크주소</th>
        </tr>
        {% for item in keywords %}
        <tr class="{{ 'coupang' if item.slot_type == '쿠팡' else 'naver' }}">
            <td>{{ item.order }}</td>
            <td>{{ item.slot_type }}</td>
            <td>{{ item.keyword }}</td>
            <td>{{ item.product_url }}</td>
        </tr>
        {% endfor %}
    </table>
</body>
</html>
'''

COUPANG_APP_HTML = '''
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>쿠팡 앱 관리</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .clickable { cursor: pointer; color: blue; }
        .clickable:hover { background-color: #e6f3ff; }
    </style>
</head>
<body>
    <h1>쿠팡 앱 관리</h1>
    <table>
        <tr>
            <th>순번</th>
            <th>검색어</th>
            <th>현재순위</th>
            <th>시작순위</th>
            <th>마지막체크</th>
            <th>차트보기</th>
        </tr>
        {% for item in slot_status %}
        <tr>
            <td>{{ item.slot_id }}</td>
            <td>{{ item.keyword }}</td>
            <td>{{ item.current_rank or 'N/A' }}</td>
            <td>{{ item.start_rank or 'N/A' }}</td>
            <td>{{ item.last_checked.split('T')[0] if item.last_checked else 'N/A' }}</td>
            <td><a href="/chart/{{ item.id }}" class="clickable">차트 보기</a></td>
        </tr>
        {% endfor %}
    </table>
</body>
</html>
'''

CHART_HTML = '''
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>순위 변화 차트</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        #chart-container { width: 80%; height: 400px; margin: 20px auto; }
    </style>
</head>
<body>
    <h1>순위 변화 차트 - {{ keyword }}</h1>
    <div id="chart-container">
        <canvas id="rankChart"></canvas>
    </div>
    
    <script>
        const ctx = document.getElementById('rankChart').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: {{ chart_data.labels | tojson }},
                datasets: [{
                    label: '순위 변화',
                    data: {{ chart_data.ranks | tojson }},
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        reverse: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '순위 (낮을수록 좋음)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '날짜'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: '{{ keyword }} 상품 순위 변화'
                    }
                }
            }
        });
    </script>
</body>
</html>
'''

def get_db_connection():
    """데이터베이스 연결"""
    conn = sqlite3.connect('slot_status.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/ranking-status')
def ranking_status():
    """순위 체크 현황 페이지"""
    keywords_data = [
        {'order': 1, 'slot_type': '쿠팡', 'keyword': '트롱리', 'product_url': 'https://www.coupang.com/vp/products/8473798698'},
        {'order': 2, 'slot_type': '쿠팡', 'keyword': '카트', 'product_url': 'https://www.coupang.com/vp/products/1234567890'},
        {'order': 3, 'slot_type': '네이버', 'keyword': '장바구니', 'product_url': 'https://smartstore.naver.com/products/999999999'},
        {'order': 4, 'slot_type': '쿠팡', 'keyword': '핸드카트', 'product_url': 'https://www.coupang.com/vp/products/5555555555'},
        {'order': 5, 'slot_type': '쿠팡', 'keyword': '쇼핑카트', 'product_url': 'https://www.coupang.com/vp/products/9999999999'}
    ]
    
    return render_template_string(RANKING_STATUS_HTML, keywords=keywords_data)

@app.route('/coupangapp/add')
def coupang_app_add():
    """쿠팡 앱 관리 페이지"""
    conn = get_db_connection()
    slot_status = conn.execute('''
        SELECT * FROM slot_status 
        ORDER BY slot_id
    ''').fetchall()
    conn.close()
    
    return render_template_string(COUPANG_APP_HTML, slot_status=slot_status)

@app.route('/chart/<int:slot_id>')
def show_chart(slot_id):
    """순위 변화 차트"""
    conn = get_db_connection()
    
    # 슬롯 정보 조회
    slot_info = conn.execute('''
        SELECT keyword, current_rank FROM slot_status WHERE id = ?
    ''', (slot_id,)).fetchone()
    
    if not slot_info:
        return "슬롯을 찾을 수 없습니다", 404
    
    # 히스토리 데이터 조회
    history_data = conn.execute('''
        SELECT rank_value, checked_at 
        FROM ranking_check_history 
        WHERE slot_id = ?
        ORDER BY checked_at
    ''', (slot_id,)).fetchall()
    
    conn.close()
    
    # 차트 데이터 준비
    labels = []
    ranks = []
    
    for data in history_data:
        labels.append(data['checked_at'][:10])  # 날짜만
        ranks.append(data['rank_value'])
    
    chart_data = {
        'labels': labels,
        'ranks': ranks
    }
    
    return render_template_string(CHART_HTML, 
                                keyword=slot_info['keyword'], 
                                chart_data=chart_data)

@app.route('/api/keywords')
def api_keywords():
    """키워드 API"""
    return jsonify([
        {'id': 1, 'keyword': '트롱리', 'url': 'https://www.coupang.com/vp/products/8473798698'},
        {'id': 2, 'keyword': '카트', 'url': 'https://www.coupang.com/vp/products/1234567890'},
        {'id': 3, 'keyword': '핸드카트', 'url': 'https://www.coupang.com/vp/products/5555555555'},
        {'id': 4, 'keyword': '쇼핑카트', 'url': 'https://www.coupang.com/vp/products/9999999999'}
    ])

@app.route('/api/slot-status/<int:slot_id>', methods=['PUT'])
def update_slot_status_api(slot_id):
    """슬롯 상태 업데이트 API"""
    data = request.get_json()
    
    connection = get_db_connection()
    
    try:
        connection.execute('''
            UPDATE slot_status 
            SET current_rank = ?, updated_at = CURRENT_TIMESTAMP
            WHERE slot_id = ?
        ''', (data.get('current_rank'), slot_id))
        
        # 히스토리 기록
        connection.execute('''
            INSERT INTO ranking_check_history (slot_id, keyword, rank_value)
            SELECT ?, keyword, ? FROM slot_status WHERE slot_id = ?
        ''', (slot_id, data.get('current_rank'), slot_id))
        
        connection.commit()
        return jsonify({'success': True, 'message': '업데이트 완료'})
        
    except Exception as e:
        connection.rollback()
        return jsonify({'success': False, 'error': str(e)})
    finally:
        connection.close()

@app.route('/api/slot-status')
def get_slot_status():
    """슬롯 상태 조회 API"""
    conn = get_db_connection()
    status_data = conn.execute('''
        SELECT slot_id, keyword, current_rank, start_rank, last_checked
        FROM slot_status 
        ORDER BY slot_id
    ''').fetchall()
    
    result = []
    for row in status_data:
        result.append({
            'slot_id': row['slot_id'],
            'keyword': row['keyword'],
            'current_rank': row['current_rank'],
            'start_rank': row['start_rank'],
            'last_checked': row['last_checked']
        })
    
    conn.close()
    return jsonify(result)

@app.route('/')
def home():
    """메인 페이지"""
    return '''
    <html>
    <head><title>순위 체크 시스템</title></head>
    <body>
        <h1>순위 체크 시스템 API 서버</h1>
        <ul>
            <li><a href="/ranking-status">순위 체크 현황</a></li>
            <li><a href="/coupangapp/add">쿠팡 앱 관리</a></li>
            <li><a href="/api/keywords">키워드 API</a></li>
            <li><a href="/api/slot-status">슬롯 상태 API</a></li>
        </ul>
    </body>
    </html>
    '''

if __name__ == '__main__':
    print("="*60)
    print("           순위 체크 웹 API 서버 v1.0")
    print("="*60)
    print("서버 시작 중...")
    print("http://localhost:3000 으로 접속하세요")
    print("="*60)
    
    app.run(host='0.0.0.0', port=3000, debug=True)










