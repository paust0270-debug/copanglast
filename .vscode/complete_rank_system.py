#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import time
import random
from datetime import datetime
import sqlite3
import os
import threading
from flask import Flask, jsonify, request, render_template_string
import webbrowser

class CompleteRankSystem:
    def __init__(self):
        self.base_url = "http://localhost:3000"
        self.db_path = "rank_system.db"
        self.log_file = "complete_system.log"
        self.web_server = None
        self.setup_database()
        
    def log(self, message):
        """로그 기록"""
        timestamp = datetime.now().strftime("%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        print(log_entry)
        
        try:
            with open(self.log_file, 'a', encoding='utf-8') as f:
                f.write(log_entry + '\n')
        except Exception:
            pass
    
    def setup_database(self):
        """데이터베이스 초기화"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # ranking_check 테이블 생성
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS ranking_check (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_num INTEGER,
                    slot_type TEXT,
                    keyword TEXT,
                    product_url TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # slot_status 테이블 생성
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS slot_status (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    slot_id INTEGER,
                    slot_type TEXT,
                    keyword TEXT,
                    product_id TEXT,
                    current_rank INTEGER,
                    start_rank INTEGER,
                    last_checked DATETIME,
                    status TEXT DEFAULT 'active',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # ranking_history 테이블 생성 (그래프용)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS ranking_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    slot_id INTEGER,
                    keyword TEXT,
                    rank_value INTEGER,
                    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            conn.close()
            self.log("데이터베이스 초기화 완료")
            
        except Exception as e:
            self.log(f"데이터베이스 초기화 오류: {e}")
    
    def create_sample_data(self):
        """샘플 데이터 생성"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # ranking_check 테이블에 샘플 데이터
            sample_data = [
                (1, '쿠팡', '트롱리', 'https://www.coupang.com/vp/products/8473798698'),
                (2, '쿠팡', '카트', 'https://www.coupang.com/vp/products/1234567890'),
                (3, '네이버', '장바구니', 'https://smartstore.naver.com/products/999999999'),
                (4, '쿠팡', '핸드카트', 'https://www.coupang.com/vp/products/5555555555'),
                (5, '쿠팡', '쇼핑카트', 'https://www.coupang.com/vp/products/9999999999')
            ]
            
            cursor.execute('DELETE FROM ranking_check')
            cursor.execute('DELETE FROM slot_status')
            cursor.execute('DELETE FROM ranking_history')
            
            cursor.executemany('''
                INSERT INTO ranking_check (order_num, slot_type, keyword, product_url)
                VALUES (?, ?, ?, ?)
            ''', sample_data)
            
            conn.commit()
            conn.close()
            self.log("샘플 데이터 생성 완료")
            
        except Exception as e:
            self.log(f"샘플 데이터 생성 오류: {e}")
    
    def extract_product_id(self, product_url):
        """상품 URL에서 상품 ID 추출"""
        try:
            import re
            match = re.search(r'/products/(\d+)', product_url)
            return match.group(1) if match else None
        except:
            return None
    
    def simulate_coupang_search(self, keyword, product_id):
        """쿠팡 검색 시뮬레이션"""
        self.log(f"쿠팡 검색 시작: {keyword}")
        
        steps = [
            "쿠팡 홈페이지 접속",
            "검색창 찾기",
            "키워드 입력",
            "검색 실행",
            "결과 페이지 로딩",
            "상품 리스트 분석",
            f"상품 ID {product_id} 검색"
        ]
        
        for i, step in enumerate(steps, 1):
            self.log(f"  단계 {i}: {step}")
            time.sleep(random.uniform(0.2, 0.5))
        
        # 순위 생성 시뮬레이션
        if random.random() > 0.1:  # 90% 성공률
            rank = random.choice([1, 2, 3, 5, 7, 10, 12, 15, 18, 20, 25, 30])
            self.log(f"  ✅ 순위 발견: {rank}위")
            return rank
        else:
            self.log(f"  ❌ 검색 결과에 없음")
            return None
    
    def process_keyword(self, ranking_data):
        """개별 키워드 처리"""
        order_num = ranking_data['order_num']
        slot_type = ranking_data['slot_type']
        keyword = ranking_data['keyword']
        product_url = ranking_data['product_url']
        
        self.log(f"\n--- 순번 {order_num} 처리 ---")
        self.log(f"슬롯유형: {slot_type}")
        self.log(f"검색어: {keyword}")
        self.log(f"링크주소: {product_url}")
        
        # 쿠팡이 아니면 스킵
        if slot_type != '쿠팡':
            self.log(f"⚠️ 쿠팡이 아닌 슬롯유형이므로 스킵")
            return False
        
        # 상품 ID 추출
        product_id = self.extract_product_id(product_url)
        if not product_id:
            self.log(f"❌ 상품 ID 추출 실패")
            return False
        
        # 순위 체크
        rank = self.simulate_coupang_search(keyword, product_id)
        
        if rank:
            # slot_status 테이블 업데이트
            self.update_slot_status(order_num, slot_type, keyword, product_id, rank)
            
            # ranking_check에서 삭제
            self.delete_from_ranking_check(order_num)
            
            return True
        else:
            self.log(f"❌ 순위 체크 실패")
            return False
    
    def update_slot_status(self, slot_id, slot_type, keyword, product_id, rank):
        """slot_status 테이블 업데이트"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 기존 레코드 확인
            cursor.execute('''
                SELECT id, start_rank FROM slot_status 
                WHERE slot_id = ?
            ''', (slot_id,))
            
            existing_record = cursor.fetchone()
            
            if existing_record:
                # 기존 레코드 업데이트
                slot_status_id, start_rank = existing_record
                
                cursor.execute('''
                    UPDATE slot_status 
                    SET current_rank = ?, last_checked = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ''', (rank, datetime.now().isoformat(), slot_status_id))
                
                self.log(f"✅ 기존 레코드 업데이트: 현재순위={rank}위 (시작순위={start_rank}위)")
                
            else:
                # 새 레코드 생성
                cursor.execute('''
                    INSERT INTO slot_status 
                    (slot_id, slot_type, keyword, product_id, current_rank, start_rank, last_checked)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    slot_id, slot_type, keyword, product_id,
                    rank, rank, datetime.now().isoformat()
                ))
                
                slot_status_id = cursor.lastrowid
                self.log(f"✅ 새 레코드 생성: 현재순위={rank}위, 시작순위={rank}위")
            
            # 히스토리 기록
            cursor.execute('''
                INSERT INTO ranking_history (slot_id, keyword, rank_value, checked_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ''', (slot_status_id, keyword, rank))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            self.log(f"❌ DB 업데이트 오류: {e}")
    
    def delete_from_ranking_check(self, order_num):
        """ranking_check에서 삭제"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('DELETE FROM ranking_check WHERE order_num = →', (order_num,))
            
            conn.commit()
            conn.close()
            
            self.log(f"✅ 순위체크 현황에서 삭제 완료")
            
        except Exception as e:
            self.log(f"❌ 삭제 오류: {e}")
    
    def get_pending_keywords(self):
        """처리 대기 중인 키워드 조회"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM ranking_check 
                ORDER BY order_num
            ''')
            
            keywords = cursor.fetchall()
            conn.close()
            
            return [dict(row) for row in keywords]
            
        except Exception as e:
            self.log(f"❌ 키워드 조회 오류: {e}")
            return []
    
    def show_current_data(self):
        """현재 데이터 표시"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # ranking_check 테이블
            cursor.execute('SELECT * FROM ranking_check ORDER BY order_num')
            pending = cursor.fetchall()
            
            # slot_status 테이블
            cursor.execute('SELECT * FROM slot_status ORDER BY slot_id')
            completed = cursor.fetchall()
            
            print("\n" + "="*100)
            print("                          전체 데이터 현황")
            print("="*100)
            
            if pending:
                print(f"\n📋 처리 대기 중 ({len(pending)}개):")
                print(f"{'순번':<4} {'슬롯유형':<8} {'검색어':<12} {'상태':<8}")
                print("-" * 40)
                for row in pending:
                    print(f"{row['order_num']:<4} {row['slot_type']:<8} {row['keyword']:<12} {row['status']:<8}")
            
            if completed:
                print(f"\n✅ 처리 완료 ({len(completed)}개):")
                print(f"{'순번':<4} {'검색어':<12} {'현재순위':<8} {'시작순위':<8} {'마지막체크':<12} {'상태':<8}")
                print("-" * 60)
                for row in completed:
                    checked_time = row['last_checked'][:10] if row['last_checked'] else 'N/A'
                    print(f"{row['slot_id']:<4} {row['keyword']:<12} {row['current_rank']:<8} {row['start_rank']:<8} {checked_time:<12} {row['status']:<8}")
            
            print("="*100)
            
            conn.close()
            
        except Exception as e:
            self.log(f"❌ 데이터 표시 오류: {e}")
    
    def start_web_server(self):
        """웹 서버 시작"""
        app = Flask(__name__)
        
        # HTML 템플릿들
        ranking_status_html = '''
        <!DOCTYPE html>
        <html>
        <head><title>순위 체크 현황</title></head>
        <body>
            <h1>랭킹 체크 현황</h1>
            <table border="1">
                <tr><th>순번</th><th>슬롯유형</th><th>검색어</th><th>링크주소</th></tr>
                {% for item in keywords %}
                <tr><td>{{ item.order_num }}</td><td>{{ item.slot_type }}</td>
                    <td>{{ item.keyword }}</td><td>{{ item.product_url }}</td></tr>
                {% endfor %}
            </table>
        </body>
        </html>
        '''
        
        coupang_app_html = '''
        <!DOCTYPE html>
        <html>
        <head><title>쿠팡 앱 관리</title></head>
        <body>
            <h1>쿠팡 앱 관리</h1>
            <table border="1">
                <tr><th>순번</th><th>검색어</th><th>현재순위</th><th>시작순위</th><th>마지막체크</th><th>상태</th></tr>
                {% for item in data %}
                <tr><td>{{ item.slot_id }}</td><td>{{ item.keyword }}</td>
                    <td>{{ item.current_rank or 'N/A' }}</td><td>{{ item.start_rank or 'N/A' }}</td>
                    <td>{{ item.last_checked.split('T')[0] if item.last_checked else 'N/A' }}</td>
                    <td>{{ item.status }}</td></tr>
                {% endfor %}
            </table>
        </body>
        </html>
        '''
        
        @app.route('/ranking-status')
        def ranking_status():
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            keywords = conn.execute('SELECT * FROM ranking_check ORDER BY order_num').fetchall()
            conn.close()
            return render_template_string(ranking_status_html, keywords=keywords)
        
        @app.route('/coupangapp/add')
        def coupang_app_add():
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            data = conn.execute('SELECT * FROM slot_status ORDER BY slot_id').fetchall()
            conn.close()
            return render_template_string(coupang_app_html, data=data)
        
        @app.route('/')
        def home():
            return '''
            <html><head><title>순위 체크 시스템</title></head>
            <body>
                <h1>순위 체크 시스템</h1>
                <ul>
                    <li><a href="/ranking-status">순위 체크 현황</a></li>
                    <li><a href="/coupangapp/add">쿠팡 앱 관리</a></li>
                </ul>
            </body></html>
            '''
        
        # 웹 서버를 별도 스레드에서 실행
        def run_server():
            app.run(host='127.0.0.1', port=3000, debug=False)
        
        web_thread = threading.Thread(target=run_server)
        web_thread.daemon = True
        web_thread.start()
        
        # 브라우저 열기
        time.sleep(1)
        webbrowser.open('http://localhost:3000')
        
        self.log("웹 서버 시작됨: http://localhost:3000")
    
    def run_complete_process(self):
        """전체 프로세스 실행"""
        self.log("\n" + "="*80)
        self.log("                팀음 순위 체크 프로세스 시작")
        self.log("="*80)
        
        # 샘플 데이터 생성
        self.create_sample_data()
        
        # 처리 대기 중인 키워드 조회
        keywords = self.get_pending_keywords()
        
        if not keywords:
            self.log("⚠️ 처리할 키워드가 없습니다")
            return
        
        self.log(f"📋 총 {len(keywords)}개 키워드 발견")
        
        processed_count = 0
        
        for keyword_data in keywords:
            if self.process_keyword(keyword_data):
                processed_count += 1
            
            # 키워드 간 대기
            time.sleep(random.uniform(1, 2))
        
        self.log("\n" + "="*80)
        self.log("                        프로세스 완료")
        self.log("="*80)
        self.log(f"✅ 처리된 키워드: {processed_count}개")
        self.log(f"📊 전체 키워드: {len(keywords)}개")
        self.log("="*80)
    
    def main_menu(self):
        """메인 메뉴"""
        while True:
            print("\n" + "="*80)
            print("                   완전 통합 순위 체크 시스템")
            print("="*80)
            print("1. 전체 프로세스 실행 (키워드 → 순위체크 → DB업데이트)")
            print("2. 웹 서버만 시작")
            print("3. 현재 데이터 보기")
            print("4. 샘플 데이터 생성")
            print("0. 종료")
            print("="*80)
            
            try:
                choice = input("선택 (0-4): ").strip()
                
                if choice == "0":
                    print("\n프로그램을 종료합니다.")
                    break
                    
                elif choice == "1":
                    self.run_complete_process()
                    
                elif choice == "2":
                    self.start_web_server()
                    print("웹 서버가 백그라운드에서 실행 중입니다.")
                    input("웹 서버를 종료하려면 Enter키를 누르세요...")
                    
                elif choice == "3":
                    self.show_current_data()
                    
                elif choice == "4":
                    self.create_sample_data()
                    print("샘플 데이터가 생성되었습니다.")
                    
                else:
                    print("올바른 번호를 입력하세요 (0-4)")
                    
            except KeyboardInterrupt:
                print("\n\n프로그램이 중단되었습니다.")
                break
            except Exception as e:
                print(f"\n오류 발생: {e}")
            
            input("\n계속하려면 Enter키를 누르세요...")

def main():
    """메인 실행 함수"""
    system = CompleteRankSystem()
    system.main_menu()

if __name__ == "__main__":
    main()










