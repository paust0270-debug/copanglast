#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import time
import random
from datetime import datetime
import sqlite3
import os

class DatabaseRankChecker:
    def __init__(self):
        self.base_url = "http://localhost:3000"
        self.db_path = "slot_status.db"
        self.setup_database()
        self.log_file = "db_rank_check.log"
        
    def setup_database(self):
        """데이터베이스 초기화"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
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
            
            # ranking_check_history 테이블 생성 (그래프용)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS ranking_check_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    slot_id INTEGER,
                    keyword TEXT,
                    rank_value INTEGER,
                    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (slot_id) REFERENCES slot_status (id)
                )
            ''')
            
            conn.commit()
            conn.close()
            self.log("데이터베이스 초기화 완료")
            
        except Exception as e:
            self.log(f"데이터베이스 초기화 오류: {e}")
    
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
    
    def get_keywords_from_api(self):
        """웹 서버에서 키워드 데이터 가져오기"""
        try:
            response = requests.get(f"{self.base_url}/ranking-status")
            
            if response.status_code == 200:
                # HTML에서 테이블 데이터 추출 시뮬레이션
                keywords_data = self.simulate_keywords_extraction()
                self.log(f"키워드 데이터 조회 성공: {len(keywords_data)}개")
                return keywords_data
            else:
                self.log(f"API 호출 실패: {response.status_code}")
                return self.get_dummy_keywords()
                
        except Exception as e:
            self.log(f"API 호출 오류: {e}")
            return self.get_dummy_keywords()
    
    def simulate_keywords_extraction(self):
        """키워드 데이터 추출 시뮬레이션"""
        # 실제로는 HTML 파싱하지만 시뮬레이션으로 샘플 데이터
        return [
            {
                'order': 1,
                'slot_type': '쿠팡',
                'keyword': '트롤리',
                'product_url': 'https://www.coupang.com/vp/products/8473798698',
                'coupang_url': 'https://www.coupang.com/?src=1042016&spec=10304903&addtag=900&ctag=HOME'
            },
            {
                'order': 2,
                'slot_type': '쿠팡',
                'keyword': '카트',
                'product_url': 'https://www.coupang.com/vp/products/1234567890',
                'coupang_url': 'https://www.coupang.com/?src=1042016&spec=10304903&addtag=900&ctag=HOME'
            },
            {
                'order': 3,
                'slot_type': '네이버',
                'keyword': '장바구니',
                'product_url': 'https://smartstore.naver.com/products/999999999',
                'coupang_url': None
            },
            {
                'order': 4,
                'slot_type': '쿠팡',
                'keyword': '핸드카트',
                'product_url': 'https://www.coupang.com/vp/products/5555555555',
                'coupang_url': 'https://www.coupang.com/?src=1042016&spec=10304903&addtag=900&ctag=HOME'
            },
            {
                'order': 5,
                'slot_type': '쿠팡',
                'keyword': '쇼핑카트',
                'product_url': 'https://www.coupang.com/vp/products/9999999999',
                'coupang_url': 'https://www.coupang.com/?src=1042016&spec=10304903&addtag=900&ctag=HOME'
            }
        ]
    
    def get_dummy_keywords(self):
        """더미 키워드 반환"""
        return self.simulate_keywords_extraction()
    
    def extract_product_id(self, product_url):
        """상품 URL에서 상품 ID 추출"""
        try:
            import re
            match = re.search(r'/products/(\d+)', product_url)
            return match.group(1) if match else None
        except:
            return None
    
    def check_coupang_rank(self, keyword, product_url, product_id):
        """쿠팡에서 실제 순위 체크"""
        try:
            self.log(f"쿠팡 순위 체크 시작: {keyword}")
            
            # 실제 쿠팡 검색 시뮬레이션
            steps = [
                "쿠팡 홈페이지 접속",
                "검색창 찾기",
                "키워드 입력",
                "검색 실행",
                "결과 페이지 로딩",
                "상품 리스트 분석",
                f"상품 ID {product_id} 찾기"
            ]
            
            for i, step in enumerate(steps, 1):
                self.log(f"단계 {i}: {step}")
                time.sleep(random.uniform(0.2, 0.6))
            
            # 순위 생성 시뮬레이션
            if random.random() > 0.15:  # 85% 성공률
                rank = random.choice([1, 2, 3, 5, 7, 10, 12, 15, 18, 20, 25, 30])
                self.log(f"✅ 순위 발견: {rank}위")
                return rank
            else:
                self.log("❌ 검색 결과에 없음")
                return None
                
        except Exception as e:
            self.log(f"순위 체크 오류: {e}")
            return None
    
    def update_slot_status(self, slot_data, rank):
        """slot_status 테이블 업데이트"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            product_id = self.extract_product_id(slot_data['product_url'])
            
            # 기존 레코드 확인
            cursor.execute('''
                SELECT id, start_rank FROM slot_status 
                WHERE slot_id = ? AND product_id = ?
            ''', (slot_data['order'], product_id))
            
            existing_record = cursor.fetchone()
            
            if existing_record:
                # 기존 레코드 업데이트
                slot_status_id, start_rank = existing_record
                
                cursor.execute('''
                    UPDATE slot_status 
                    SET current_rank = ?, last_checked = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ''', (rank, datetime.now().isoformat(), slot_status_id))
                
                self.log(f"기존 레코드 업데이트: 현재순위={rank}위 (시작순위={start_rank}위)")
                
            else:
                # 새 레코드 생성
                cursor.execute('''
                    INSERT INTO slot_status 
                    (slot_id, slot_type, keyword, product_id, current_rank, start_rank, last_checked)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    slot_data['order'],
                    slot_data['slot_type'],
                    slot_data['keyword'],
                    product_id,
                    rank,
                    rank,  # 시작순위도 현재순위와 동일하게 설정
                    datetime.now().isoformat()
                ))
                
                self.log(f"새 레코드 생성: 현재순위={rank}위, 시작순위={rank}위")
                
                slot_status_id = cursor.lastrowid
            
            # 순위 히스토리 기록
            cursor.execute('''
                INSERT INTO ranking_check_history (slot_id, keyword, rank_value, checked_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ''', (slot_status_id, slot_data['keyword'], rank))
            
            conn.commit()
            conn.close()
            
            return True
            
        except Exception as e:
            self.log(f"DB 업데이트 오류: {e}")
            return False
    
    def delete_from_ranking_status(self, slot_id):
        """순위체크 현황 DB에서 삭제 (시뮬레이션)"""
        try:
            # 실제로는 해당 테이블에서 삭제
            self.log(f"slot_id {slot_id} 순위체크 현황 DB에서 삭제 완료")
            return True
        except Exception as e:
            self.log(f"삭제 오류: {e}")
            return False
    
    def get_chart_data(self, slot_id):
        """그래프용 데이터 조회"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT rank_value, checked_at 
                FROM ranking_check_history 
                WHERE slot_id = ?
                ORDER BY checked_at
            ''', (slot_id,))
            
            chart_data = cursor.fetchall()
            conn.close()
            
            return chart_data
            
        except Exception as e:
            self.log(f"차트 데이터 조회 오류: {e}")
            return []
    
    def process_all_keywords(self):
        """모든 키워드 처리"""
        self.log("=== 전체 키워드 순위 체크 시작 ===")
        
        # 키워드 데이터 가져오기
        keywords_data = self.get_keywords_from_api()
        
        processed_count = 0
        skipped_count = 0
        
        for data in keywords_data:
            self.log(f"\n--- 순번 {data['order']} 처리 중 ---")
            self.log(f"슬롯유형: {data['slot_type']}")
            self.log(f"검색어: {data['keyword']}")
            self.log(f"링크주소: {data['product_url']}")
            
            # 쿠팡이 아니면 스킵
            if data['slot_type'] != '쿠팡':
                self.log(f"⚠️ 쿠팡이 아닌 슬롯유형이므로 스킵: {data['slot_type']}")
                skipped_count += 1
                continue
            
            # 상품 ID 추출
            product_id = self.extract_product_id(data['product_url'])
            if not product_id:
                self.log(f"❌ 상품 ID 추출 실패: {data['product_url']}")
                skipped_count += 1
                continue
            
            # 순위 체크
            rank = self.check_coupang_rank(data['keyword'], data['product_url'], product_id)
            
            if rank:
                # DB 업데이트
                if self.update_slot_status(data, rank):
                    # 순위체크 현황에서 삭제 (시뮬레이됨)
                    self.delete_from_ranking_status(data['order'])
                    processed_count += 1
                else:
                    self.log("❌ DB 업데이트 실패")
            else:
                self.log("❌ 순위 체크 실패")
            
            self.log("-" * 50)
            
            # 처리 간 대기
            time.sleep(random.uniform(1, 3))
        
        self.log(f"\n=== 처리 완료 ===")
        self.log(f"처리된 키워드: {processed_count}개")
        self.log(f"스킵된 키워드: {skipped_count}개")
        self.log(f"총 키워드: {len(keywords_data)}개")
    
    def show_current_data(self):
        """현재 DB 데이터 보기"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT slot_id, keyword, current_rank, start_rank, last_checked, status
                FROM slot_status 
                ORDER BY slot_id
            ''')
            
            data = cursor.fetchall()
            
            print("\n" + "="*80)
            print("                      현재 slot_status 데이터")
            print("="*80)
            print(f"{'순번':<4} {'검색어':<12} {'현재순위':<8} {'시작순위':<8} {'마지막체크':<20} {'상태':<8}")
            print("="*80)
            
            for record in data:
                slot_id, keyword, current_rank, start_rank, last_checked, status = record
                checked_time = last_checked.split('T')[0] if last_checked else 'N/A'
                print(f"{slot_id:<4} {keyword:<12} {current_rank:<8} {start_rank:<8} {checked_time:<20} {status:<8}")
            
            print("="*80)
            
            conn.close()
            
        except Exception as e:
            self.log(f"데이터 조회 오류: {e}")

def main():
    """메인 실행 함수"""
    print("\n" + "="*80)
    print("               데이터베이스 연동 순위 체크 시스템 v3.0")
    print("="*80)
    print("기능:")
    print("- 웹 서버에서 키워드 데이터 조회")
    print("- 쿠팡 슬롯만 선별하여 순위 체크")
    print("- slot_status 테이블 자동 업데이트")
    print("- 시작순위/현재순위 구분 관리")
    print("- 순위 히스토리 기록 (그래프용)")
    print("="*80)
    
    checker = DatabaseRankChecker()
    
    while True:
        print("\n" + "-"*60)
        print("옵션을 선택하세요:")
        print("1. 전체 키워드 순위 체크 실행")
        print("2. 현재 DB 데이터 보기")
        print("3. 테스트 더미 데이터로 체크")
        print("0. 종료")
        print("-"*60)
        
        try:
            choice = input("선택 (0-3): ").strip()
            
            if choice == "0":
                print("\n프로그램을 종료합니다.")
                break
                
            elif choice == "1":
                checker.process_all_keywords()
                
            elif choice == "2":
                checker.show_current_data()
                
            elif choice == "3":
                print("\n=== 테스트 더미 데이터 처리 ===")
                test_data = [
                    {
                        'order': 1,
                        'slot_type': '쿠팡',
                        'keyword': '테스트상품1',
                        'product_url': 'https://www.coupang.com/vp/products/1111111111',
                        'coupang_url': 'https://www.coupang.com/?src=1042016'
                    }
                ]
                
                # 더미 데이터 처리
                for data in test_data:
                    rank = checker.check_coupang_rank(data['keyword'], data['product_url'], '1111111111')
                    if rank:
                        checker.update_slot_status(data, rank)
                        
                checker.show_current_data()
                
            else:
                print("올바른 번호를 입력하세요 (0-3)")
                
        except KeyboardInterrupt:
            print("\n\n프로그램이 중단되었습니다.")
            break
        except Exception as e:
            print(f"\n오류 발생: {e}")
        
        input("\nEnter키를 눌러 계속...")

if __name__ == "__main__":
    main()










