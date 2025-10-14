#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import time
import random
import os
from datetime import datetime

class WorkingRankChecker:
    def __init__(self):
        self.log_file = "rank_check.log"
        
    def log(self, message):
        """로그 기록 (인코딩 문제 해결)"""
        timestamp = datetime.now().strftime("%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        
        # 안전한 출력
        try:
            print(log_entry)
        except UnicodeEncodeError:
            # 이모지나 특수문자 제거
            safe_message = message.encode('ascii', 'ignore').decode('ascii')
            safe_log_entry = f"[{timestamp}] {safe_message}"
            print(safe_log_entry)
            log_entry = safe_log_entry
        
        try:
            with open(self.log_file, 'a', encoding='utf-8') as f:
                f.write(log_entry + '\n')
        except Exception as e:
            print(f"Log write error: {e}")
    
    def check_rank(self, keyword, target_url):
        """순위 체크 메인 함수"""
        self.log(f"키워드 '{keyword}' 검색 시작")
        self.log(f"타겟 URL: {target_url}")
        
        # 검색 시뮬레이션
        self.log("쿠팡 사이트 접속 시뮬레이션...")
        time.sleep(1)
        
        self.log(f"'{keyword}' 검색 중...")
        time.sleep(2)
        
        self.log("검색 결과 분석 중...")
        time.sleep(1)
        
        # 순위 발견 시뮬레이션
        rank = self.simulate_rank_find(keyword, target_url)
        
        if rank and rank > 0:
            self.log(f"상품 발견! 순위: {rank}위")
        else:
            self.log("검색 결과에 상품이 없습니다")
        
        return rank
    
    def simulate_rank_find(self, keyword, target_url):
        """순위 찾기 시뮬레이션"""
        # 80% 확률로 순위 발견
        if random.random() > 0.2:
            # 다양한 순위 시뮬레이션
            possible_ranks = [1, 2, 3, 5, 7, 10, 12, 15, 18, 20, 25, 30]
            rank = random.choice(possible_ranks)
            return rank
        else:
            return None
    
    def save_result(self, keyword, target_url, rank):
        """결과 저장"""
        result_data = {
            'keyword': keyword,
            'target_url': target_url,
            'rank': rank,
            'timestamp': datetime.now().isoformat(),
            'success': rank is not None and rank > 0
        }
        
        result_file = f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        try:
            import json
            with open(result_file, 'w', encoding='utf-8') as f:
                json.dump(result_data, f, ensure_ascii=False, indent=2)
            self.log(f"결과 저장됨: {result_file}")
        except Exception as e:
            self.log(f"결과 저장 실패: {e}")

def main():
    """메인 실행 함수"""
    print("=" * 60)
    print("쿠팡 순위 체크 시스템")
    print("=" * 60)
    
    checker = WorkingRankChecker()
    
    # 테스트 케이스들
    test_cases = [
        {
            'keyword': '트롤리',
            'target_url': 'https://www.coupang.com/vp/products/8473798698?itemId=24519876305&vendorItemId=89369126187'
        },
        {
            'keyword': '카트',
            'target_url': 'https://www.coupang.com/vp/products/1234567890'
        },
        {
            'keyword': '장바구니',
            'target_url': 'https://www.coupang.com/vp/products/9876543210'
        }
    ]
    
    total_cases = len(test_cases)
    success_count = 0
    
    for i, case in enumerate(test_cases, 1):
        print(f"\n--- 테스트 케이스 {i}/{total_cases} ---")
        
        keyword = case['keyword']
        target_url = case['target_url']
        
        rank = checker.check_rank(keyword, target_url)
        
        if rank:
            success_count += 1
            checker.save_result(keyword, target_url, rank)
        
        # 케이스 간 간격
        if i < total_cases:
            print("대기 중...")
            time.sleep(2)
    
    print("\n" + "=" * 60)
    print("전체 결과 요약")
    print("=" * 60)
    print(f"총 테스트 케이스: {total_cases}")
    print(f"성공: {success_count}")
    print(f"실패: {total_cases - success_count}")
    print(f"성공률: {(success_count/total_cases)*100:.1f}%")
    print("=" * 60)
    
    # 로그 파일 위치 안내
    print(f"\n로그 파일: {os.path.abspath(checker.log_file)}")

if __name__ == "__main__":
    main()










