#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import time
import random
import json
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import re
import os

class FinalCoupanChecker:
    def __init__(self):
        self.driver = None
        self.log_file = "final_rank_check.log"
        
    def log(self, message):
        """로그 기록"""
        timestamp = datetime.now().strftime("%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        
        try:
            print(log_entry)
        except UnicodeEncodeError:
            safe_message = message.encode('ascii', 'ignore').decode('ascii')
            safe_log_entry = f"[{timestamp}] {safe_message}"
            print(safe_log_entry)
            log_entry = safe_log_entry
        
        try:
            with open(self.log_file, 'a', encoding='utf-8') as f:
                f.write(log_entry + '\n')
        except Exception as e:
            print(f"Log write error: {e}")
    
    def setup_browser(self):
        """브라우저 설정 (실제 쿠팡 접근용)"""
        try:
            chrome_options = Options()
            
            # 봇 탐지 우회 설정
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            
            # User-Agent 설정
            chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            
            # 헤드리스 모드 (디버깅시 주석 해제하고 아래 사용)
            # chrome_options.add_argument('--headless')
            
            # 브라우저 창 크기
            chrome_options.add_argument('--window-size=1920,1080')
            
            # ChromeDriver 자동 설치
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # 웹드라이버 탐지 우회
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            self.log("브라우저 설정 완료")
            return True
            
        except Exception as e:
            self.log(f"브라우저 설정 실패: {e}")
            return False
    
    def check_real_coupang_rank(self, keyword, target_url):
        """실제 쿠팡에서 순위 체크"""
        if not self.setup_browser():
            return None
        
        try:
            # 쿠팡 메인 페이지로 이동
            self.log("쿠팡 사이트 접속 중...")
            self.driver.get("https://www.coupang.com")
            
            # 페이지 로딩 대기
            time.sleep(random.uniform(3, 5))
            
            # 검색창 찾기 및 키워드 입력
            self.log(f"'{keyword}' 검색 중...")
            
            search_selectors = [
                "input[name='q']",
                "input[placeholder*='검색']",
                "input[placeholder*='search']",
                ".search-input",
                "#query"
            ]
            
            search_box = None
            for selector in search_selectors:
                try:
                    search_box = WebDriverWait(self.driver, 5).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                    )
                    break
                except TimeoutException:
                    continue
            
            if not search_box:
                self.log("검색창을 찾을 수 없습니다")
                return None
            
            # 키워드 입력
            search_box.clear()
            search_box.send_keys(keyword)
            search_box.submit()
            
            # 검색 결과 대기
            self.log("검색 결과 로딩 대기...")
            time.sleep(random.uniform(3, 5))
            
            # 순위 확인
            rank = self.find_product_rank(target_url)
            
            if rank:
                self.log(f"상품 발견! 순위: {rank}위")
            else:
                self.log("검색 결과에 상품이 없습니다")
            
            return rank
            
        except Exception as e:
            self.log(f"쿠팡 검색 오류: {e}")
            return None
        
        finally:
            self.close_browser()
    
    def find_product_rank(self, target_url):
        """검색 결과에서 상품 순위 찾기"""
        try:
            # 상품 리스트 대기
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.ID, "productList"))
            )
            
            # 상품 ID 추출
            product_id = self.extract_product_id(target_url)
            if not product_id:
                return None
            
            # 상품 아이템들 찾기
            product_selectors = [
                "li.search-product",
                "li[class*='search-product']",
                "li[class*='product']"
            ]
            
            product_items = []
            for selector in product_selectors:
                product_items = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if product_items:
                    break
            
            self.log(f"총 {len(product_items)}개 상품 발견")
            
            # 타겟 상품 검색
            for index, item in enumerate(product_items, 1):
                try:
                    link_element = item.find_element(By.CSS_SELECTOR, "a.search-product-link")
                    href = link_element.get_attribute("href")
                    
                    if product_id in href:
                        # 상품 정보 추출
                        title = "상품명 추출 실패"
                        price = "가격 정보 없음"
                        
                        try:
                            title_elem = item.find_element(By.CSS_SELECTOR, ".name")
                            title = title_elem.text.strip()
                        except:
                            pass
                        
                        try:
                            price_elem = item.find_element(By.CSS_SELECTOR, ".price-value, .price")
                            price = price_elem.text.strip()
                        except:
                            pass
                        
                        self.log(f"상품 정보: {title[:50]}... 가격: {price}")
                        return index
                        
                except NoSuchElementException:
                    continue
            
            return None
            
        except TimeoutException:
            self.log("상품 리스트 로딩 시간 초과")
            return None
        except Exception as e:
            self.log(f"순위 찾기 오류: {e}")
            return None
    
    def extract_product_id(self, url):
        """URL에서 상품 ID 추출"""
        try:
            match = re.search(r'/products/(\d+)', url)
            return match.group(1) if match else None
        except:
            return None
    
    def close_browser(self):
        """브라우저 종료"""
        if self.driver:
            try:
                self.driver.quit()
                self.log("브라우저 종료")
            except:
                pass
            self.driver = None
    
    def run_tests(self):
        """테스트 실행"""
        test_cases = [
            {
                'keyword': '트롤리',
                'target_url': 'https://www.coupang.com/vp/products/8473798698?itemId=24519876305&vendorItemId=89369126187'
            }
        ]
        
        results = []
        
        for i, case in enumerate(test_cases, 1):
            print(f"\n--- 테스트 {i} ---")
            self.log(f"테스트 {i} 시작: {case['keyword']}")
            
            rank = self.check_real_coupang_rank(case['keyword'], case['target_url'])
            
            result = {
                'keyword': case['keyword'],
                'target_url': case['target_url'],
                'rank': rank,
                'timestamp': datetime.now().isoformat(),
                'success': rank is not None and rank > 0
            }
            
            results.append(result)
            
            # 결과 출력
            if result['success']:
                print(f"✅ 성공: {rank}위")
            else:
                print("❌ 실패")
            
            # 다음 테스트 전 대기
            if i < len(test_cases):
                time.sleep(random.uniform(5, 8))
        
        # 결과 저장
        self.save_all_results(results)
        return results
    
    def save_all_results(self, results):
        """모든 결과 저장"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        result_file = f"final_results_{timestamp}.json"
        
        try:
            with open(result_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
            self.log(f"결과 저장: {result_file}")
        except Exception as e:
            self.log(f"결과 저장 실패: {e}")

def main():
    """메인 실행"""
    print("=" * 70)
    print("최종 쿠팡 순위 체크 시스템")
    print("=" * 70)
    print("주의: 실제 웹사이트에 접근하여 검색을 수행합니다.")
    print("=" * 70)
    
    checker = FinalCoupanChecker()
    
    try:
        results = checker.run_tests()
        
        print("\n" + "=" * 70)
        print("최종 요약")
        print("=" * 70)
        
        success_count = sum(1 for r in results if r['success'])
        total_count = len(results)
        
        print(f"총 테스트: {total_count}")
        print(f"성공: {success_count}")
        print(f"실패: {total_count - success_count}")
        
        for result in results:
            status = "✅" if result['success'] else "❌"
            rank_text = f"{result['rank']}위" if result['rank'] else "없음"
            print(f"{status} {result['keyword']}: {rank_text}")
        
        print("=" * 70)
        
    except KeyboardInterrupt:
        print("\n사용자에 의해 중단됨")
    except Exception as e:
        print(f"오류 발생: {e}")
    finally:
        checker.close_browser()

if __name__ == "__main__":
    main()
