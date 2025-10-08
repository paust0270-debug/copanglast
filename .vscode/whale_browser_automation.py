import time
import subprocess
import psutil
import os
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
from pathlib import Path

class WhaleBrowserAutomation:
    def __init__(self, profile_path=None):
        self.profile_path = profile_path or self.get_whale_profile_path()
        self.driver = None
        
    def get_whale_profile_path(self):
        """Whale 프로파일 경로 생성"""
        profile_dir = Path("WhaleProfileCp")
        profile_dir.mkdir(exist_ok=True)
        return str(profile_dir)
    
    def setup_whale_driver(self):
        """Whale 브라우저 드라이버 설정"""
        chrome_options = Options()
        
        # 임시로 일반 Chrome으로 설정 (실제 Whale 드라이버 사용시 변경 필요)
        chrome_options.add_argument('--disable-web-security')
        chrome_options.add_argument('--disable-features=VizDisplayCompositor')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # 헤드리스 모드 해제 (디버깅용)
        # chrome_options.add_argument('--headless')
        
        try:
            # ChromeDriver 자동 설치 및 설정
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            return True
        except Exception as e:
            print(f"Driver setup failed: {e}")
            return False
    
    def search_coupang_product(self, keyword, target_url):
        """쿠팡에서 상품 검색하고 순위 확인"""
        try:
            # 쿠팡 메인 페이지로 이동
            self.driver.get("https://www.coupang.com")
            time.sleep(5)
            
            # 검색창 찾기 및 키워드 입력
            search_box = self.find_search_box()
            if search_box:
                search_box.clear()
                search_box.send_keys(keyword)
                search_box.send_keys(Keys.RETURN)
                
                time.sleep(3)
                
                # 검색 결과에서 순위 찾기
                rank = self.find_product_rank(target_url)
                return rank
            
            return None
            
        except Exception as e:
            print(f"Search error: {e}")
            return None
    
    def find_search_box(self):
        """검색창 찾기"""
        selectors = [
            "input[name='q']",
            "input[placeholder*='검색']",
            "input[placeholder*='search']",
            ".search-input",
            "#query",
            "#search-bar input"
        ]
        
        for selector in selectors:
            try:
                element = WebDriverWait(self.driver, 5).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
                return element
            except TimeoutException:
                continue
        
        return None
    
    def find_product_rank(self, target_url):
        """검색 결과에서 특정 상품의 순위 찾기"""
        try:
            # 상품 리스트 대기
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.ID, "productList"))
            )
            
            # 상품 ID 추출
            product_id = self.extract_product_id(target_url)
            if not product_id:
                return None
            
            # 상품 리스트에서 해당 ID 찾기
            product_items = self.driver.find_elements(By.CSS_SELECTOR, "li.search-product")
            
            for index, item in enumerate(product_items, 1):
                try:
                    link_element = item.find_element(By.CSS_SELECTOR, "a.search-product-link")
                    href = link_element.get_attribute("href")
                    
                    if product_id in href:
                        return index
                        
                except NoSuchElementException:
                    continue
            
            return None
            
        except TimeoutException:
            print("Product list not found")
            return None
        except Exception as e:
            print(f"Find rank error: {e}")
            return None
    
    def extract_product_id(self, url):
        """URL에서 상품 ID 추출"""
        import re
        match = re.search(r'/products/(\d+)', url)
        return match.group(1) if match else None
    
    def close_browser(self):
        """브라우저 종료"""
        if self.driver:
            self.driver.quit()
            self.driver = None
            
class CoupanRankCheckerWithWhale:
    def __init__(self):
        self.automation = WhaleBrowserAutomation()
        self.setup_files()
        
    def setup_files(self):
        """필요한 파일들 설정"""
        # ADB 툴이 있는 경우 복사
        adb_files = ['adb.exe', 'AdbWinApi.dll', 'AdbWinUsbApi.dll']
        source_dir = Path(r"C:\Users\qkrwn\Desktop\zero_rank_20250723-01")
        
        for file in adb_files:
            source_file = source_dir / file
            if source_file.exists():
                import shutil
                shutil.copy2(source_file, file)
                print(f"Copied {file}")
    
    def check_rank(self, keyword_data):
        """순위 체크 메인 함수"""
        keyword = keyword_data.get('search', '')
        target_url = keyword_data.get('url', '')
        
        print(f"Checking rank for: {keyword}")
        print(f"Target URL: {target_url}")
        
        # Whale 브라우저 설정
        if not self.automation.setup_whale_driver():
            print("Failed to setup browser driver")
            return None
        
        try:
            # 검색 및 순위 확인
            rank = self.automation.search_coupang_product(keyword, target_url)
            
            if rank:
                print(f"✅ Product found at rank: {rank}")
            else:
                print(f"❌ Product not found in search results")
                rank = 0  # 검색되지 않음
            
            return rank
            
        except Exception as e:
            print(f"Rank check error: {e}")
            return None
        finally:
            # 브라우저 종료
            self.automation.close_browser()
    
    def simulate_prevention_bypass(self):
        """쿠팡 봇 탐지 우회 시뮬레이션"""
        # 실제 구현에서는 다음과 같은 방법들을 사용할 수 있습니다:
        # 1. 여러 프로파일 사용
        # 2. 프록시 로테이션
        # 3. 타임 딜레이 랜덤화
        # 4. 마우스 움직임 시뮬레이션
        # 5. 웹 드라이버 패치
        
        print("Simulating bot detection bypass...")
        
        # 랜덤 딜레이
        import random
        delay = random.uniform(3, 8)
        time.sleep(delay)
        
        # 사용자 에이전트 설정
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
        
        selected_ua = random.choice(user_agents)
        print(f"Using User Agent: {selected_ua[:50]}...")

def main():
    """테스트 실행"""
    checker = CoupanRankCheckerWithWhale()
    
    # 테스트 데이터
    test_keyword = {
        'search': '트롤리',
        'url': 'https://www.coupang.com/vp/products/8473798698?itemId=24519876305&vendorItemId=89369126187'
    }
    
    rank = checker.check_rank(test_keyword)
    print(f"Final result: Rank {rank}")

if __name__ == "__main__":
    main()
