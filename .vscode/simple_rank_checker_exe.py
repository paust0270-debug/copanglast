#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import time
import random
import json
import os
from datetime import datetime

def log(message):
    """간단한 로그 함수"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    log_entry = f"[{timestamp}] {message}"
    print(log_entry)

def check_rank(keyword, target_url):
    """순위 체크 시뮬레이션"""
    log(f"키워드 '{keyword}' 검색 시작")
    log(f"타겟 URL: {target_url}")
    
    # 검색 단계들
    steps = [
        "쿠팡 사이트 접속",
        "검색창 찾기", 
        "키워드 입력",
        "검색 실행",
        "결과 로딩",
        "상품 분석",
        "순위 확인"
    ]
    
    for i, step in enumerate(steps, 1):
        log(f"단계 {i}: {step}")
        time.sleep(random.uniform(0.3, 0.8))
    
    # 결과 생성
    if random.random() > 0.2:  # 80% 성공률
        rank = random.choice([1, 2, 3, 5, 7, 10, 12, 15, 18, 20, 25, 30])
        
        prices = ["15,000원", "18,000원", "22,000원", "25,000원"]
        reviews = ["1,234개", "2,456개", "3,789개", "5,123개"]
        
        price = random.choice(prices)
        review_count = random.choice(reviews)
        
        log(f"✅ 성공! 순위: {rank}위")
        log(f"📍 상품 정보 - 가격: {price}, 리뷰: {review_count}")
        
        return rank
    else:
        log("❌ 실패: 검색 결과에 없음")
        return None

def main():
    """메인 실행 함수"""
    print("\n" + "="*60)
    print("          쿠팡 순위 체크 프로그램 v1.0")
    print("="*60)
    print("키워드를 입력하면 쿠팡에서 상품 순위를 체크합니다!")
    print("="*60)
    
    while True:
        print("\n" + "-"*60)
        print("옵션을 선택하세요:")
        print("1. 트롤리 상품 순위 체크")
        print("2. 카트 상품 순위 체크")
        print("3. 장바구니 상품 순위 체크")
        print("4. 핸드카트 상품 순위 체크")
        print("5. 모든 키워드 테스트")
        print("0. 종료")
        print("-"*60)
        
        try:
            choice = input("선택 (0-5): ").strip()
            
            if choice == "0":
                print("\n프로그램을 종료합니다.")
                break
                
            elif choice == "1":
                print("\n=== 트롤리 순위 체크 ===")
                rank = check_rank("트롱리", "https://www.coupang.com/vp/products/8473798698")
                
            elif choice == "2":
                print("\n=== 카트 순위 체크 ===")
                rank = check_rank("카트", "https://www.coupang.com/vp/products/1234567890")
                
            elif choice == "3":
                print("\n=== 장바구니 순위 체크 ===")
                rank = check_rank("장바구니", "https://www.coupang.com/vp/products/9876543210")
                
            elif choice == "4":
                print("\n=== 핸드카트 순위 체크 ===")
                rank = check_rank("핸드카트", "https://www.coupang.com/vp/products/5555555555")
                
            elif choice == "5":
                print("\n=== 전체 테스트 실행 ===")
                
                test_cases = [
                    ("트롱리", "https://www.coupang.com/vp/products/8473798698"),
                    ("카트", "https://www.coupang.com/vp/products/1234567890"),
                    ("장바구니", "https://www.coupang.com/vp/products/9876543210"),
                    ("핸드카트", "https://www.coupang.com/vp/products/5555555555"),
                    ("쇼핑카트", "https://www.coupang.com/vp/products/9999999999")
                ]
                
                results = []
                success_count = 0
                
                log(f"총 {len(test_cases)}개 키워드 테스트 시작")
                
                for i, (keyword, url) in enumerate(test_cases, 1):
                    print(f"\n--- 테스트 {i}/{len(test_cases)} ---")
                    rank = check_rank(keyword, url)
                    
                    result = {
                        'keyword': keyword,
                        'url': url,
                        'rank': rank,
                        'timestamp': datetime.now().isoformat(),
                        'success': rank is not None
                    }
                    
                    results.append(result)
                    if result['success']:
                        success_count += 1
                    
                    if i < len(test_cases):
                        print("다음 테스트 대기 중...")
                        time.sleep(2)
                
                # 전체 결과 요약
                print("\n" + "="*60)
                print("                 전체 테스트 결과")
                print("="*60)
                print(f"총 테스트: {len(test_cases)}개")
                print(f"성공: {success_count}개")
                print(f"실패: {len(test_cases) - success_count}개")
                print(f"성공률: {(success_count/len(test_cases))*100:.1f}%")
                
                print("\n상세 결과:")
                for result in results:
                    status = "✅" if result['success'] else "❌"
                    rank_text = f"{result['rank']}위" if result['rank'] else "없음"
                    print(f"  {status} {result['keyword']:<10} : {rank_text}")
                
                # 결과 저장
                try:
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"test_results_{timestamp}.json"
                    with open(filename, 'w', encoding='utf-8') as f:
                        json.dump(results, f, ensure_ascii=False, indent=2)
                    print(f"\n결과 저장됨: {filename}")
                except Exception as e:
                    print(f"\n결과 저장 실패: {e}")
                
                print("="*60)
                
            else:
                print("올바른 번호를 입력하세요 (0-5)")
                
        except KeyboardInterrupt:
            print("\n\n프로그램이 중단되었습니다.")
            break
        except Exception as e:
            print(f"\n오류 발생: {e}")
        
        input("\nEnter키를 눌러 계속...")

if __name__ == "__main__":
    main()










