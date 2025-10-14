from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time
import json
from datetime import datetime
import requests
from urllib.parse import quote
import re
import random

class StealthCoupangRankChecker:
    def __init__(self):
        self.driver = None
        self.setup_driver()
        
    def setup_driver(self):
        """스텔스 모드 Chrome 드라이버 설정"""
        print("Setting up Stealth Chrome driver...")
        
        chrome_options = Options()
        
        # 스텔스 모드 설정
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # 봇 감지 우회 설정
        chrome_options.add_argument("--disable-web-security")
        chrome_options.add_argument("--allow-running-insecure-content")
        chrome_options.add_argument("--disable-features=VizDisplayCompositor")
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-plugins")
        chrome_options.add_argument("--disable-images")
        chrome_options.add_argument("--disable-javascript")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-first-run")
        chrome_options.add_argument("--no-default-browser-check")
        chrome_options.add_argument("--disable-default-apps")
        chrome_options.add_argument("--disable-popup-blocking")
        chrome_options.add_argument("--disable-translate")
        chrome_options.add_argument("--disable-background-timer-throttling")
        chrome_options.add_argument("--disable-renderer-backgrounding")
        chrome_options.add_argument("--disable-backgrounding-occluded-windows")
        chrome_options.add_argument("--disable-client-side-phishing-detection")
        chrome_options.add_argument("--disable-sync")
        chrome_options.add_argument("--disable-features=TranslateUI")
        chrome_options.add_argument("--disable-ipc-flooding-protection")
        
        # User-Agent 랜덤화
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
        ]
        selected_ua = random.choice(user_agents)
        chrome_options.add_argument(f"--user-agent={selected_ua}")
        
        # 헤드리스 모드 비활성화 (브라우저 보이기)
        # chrome_options.add_argument("--headless")
        
        try:
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # 자동화 감지 방지 스크립트
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.driver.execute_script("Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]})")
            self.driver.execute_script("Object.defineProperty(navigator, 'languages', {get: () => ['ko-KR', 'ko', 'en-US', 'en']})")
            
            # 페이지 로드 타임아웃 설정
            self.driver.set_page_load_timeout(60)
            self.driver.implicitly_wait(10)
            
            print("Stealth Chrome driver setup completed")
            
        except Exception as e:
            print(f"Stealth Chrome driver setup failed: {e}")
            raise
    
    def get_current_ip(self):
        """현재 IP 정보 확인"""
        try:
            response = requests.get('https://ipinfo.io/json', timeout=10)
            ip_info = response.json()
            print(f"Current IP: {ip_info.get('ip')}")
            print(f"ISP: {ip_info.get('org')}")
            return ip_info
        except Exception as e:
            print(f"IP check failed: {e}")
            return None
    
    def random_delay(self, min_seconds=1, max_seconds=3):
        """랜덤 지연"""
        delay = random.uniform(min_seconds, max_seconds)
        time.sleep(delay)
    
    def search_products_with_stealth(self, keyword):
        """스텔스 모드로 상품 검색"""
        print(f"\nSearching for: {keyword} (Stealth Mode)")
        
        try:
            # 1단계: 쿠팡 메인 페이지 접속
            print("Step 1: Accessing Coupang main page...")
            self.driver.get("https://www.coupang.com")
            self.random_delay(3, 5)
            
            # 페이지 로딩 확인
            page_title = self.driver.title
            print(f"Main page title: {page_title}")
            
            # 2단계: 검색창 찾기 및 검색
            print("Step 2: Finding search box...")
            search_selectors = [
                "input[name='q']",
                "#headerSearchKeyword",
                ".search-input",
                "input[type='search']",
                "input[placeholder*='검색']"
            ]
            
            search_box = None
            for selector in search_selectors:
                try:
                    search_box = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                    )
                    print(f"Found search box with selector: {selector}")
                    break
                except:
                    continue
            
            if search_box:
                # 검색어 입력
                print("Step 3: Entering search keyword...")
                search_box.clear()
                self.random_delay(0.5, 1)
                
                # 타이핑 시뮬레이션
                for char in keyword:
                    search_box.send_keys(char)
                    time.sleep(random.uniform(0.05, 0.15))
                
                self.random_delay(1, 2)
                
                # 검색 실행
                print("Step 4: Executing search...")
                try:
                    search_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
                    search_button.click()
                except:
                    from selenium.webdriver.common.keys import Keys
                    search_box.send_keys(Keys.RETURN)
                
                self.random_delay(3, 5)
            else:
                # 검색창을 찾을 수 없으면 직접 URL로 이동
                print("Search box not found, using direct URL...")
                search_url = f"https://www.coupang.com/np/search?q={quote(keyword)}"
                self.driver.get(search_url)
                self.random_delay(5, 8)
            
            # 3단계: 검색 결과 확인
            print("Step 5: Checking search results...")
            current_url = self.driver.current_url
            print(f"Current URL: {current_url}")
            
            page_title = self.driver.title
            print(f"Search page title: {page_title}")
            
            # 페이지 소스 길이 확인
            page_source = self.driver.page_source
            print(f"Page source length: {len(page_source)} characters")
            
            # 4단계: 상품 정보 추출
            print("Step 6: Extracting product information...")
            products = self.extract_product_info(page_source)
            return products
            
        except Exception as e:
            print(f"Stealth search failed: {e}")
            return []
    
    def extract_product_info(self, page_source):
        """검색 결과에서 상품 정보 추출"""
        products = []
        
        try:
            # 상품 링크 패턴
            product_pattern = r'/products/(\d+)'
            product_ids = re.findall(product_pattern, page_source)
            
            # 상품 제목 패턴 (여러 패턴 시도)
            title_patterns = [
                r'<dt class="name">.*?<a[^>]*>([^<]+)</a>',
                r'<a[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)</a>',
                r'data-product-id="[^"]*"[^>]*>([^<]+)</a>',
                r'<span class="name">([^<]+)</span>',
                r'<div class="name">([^<]+)</div>',
                r'<h3[^>]*>([^<]+)</h3>',
                r'<h4[^>]*>([^<]+)</h4>'
            ]
            
            titles = []
            for pattern in title_patterns:
                found_titles = re.findall(pattern, page_source, re.DOTALL)
                if found_titles:
                    titles = found_titles
                    print(f"Found {len(titles)} titles with pattern: {pattern}")
                    break
            
            # 가격 패턴 (여러 패턴 시도)
            price_patterns = [
                r'<strong class="price-value">([^<]+)</strong>',
                r'<span class="price-value">([^<]+)</span>',
                r'data-price="([^"]*)"',
                r'<em class="price-value">([^<]+)</em>',
                r'<div class="price-value">([^<]+)</div>',
                r'<span class="price">([^<]+)</span>',
                r'<strong class="price">([^<]+)</strong>'
            ]
            
            prices = []
            for pattern in price_patterns:
                found_prices = re.findall(pattern, page_source)
                if found_prices:
                    prices = found_prices
                    print(f"Found {len(prices)} prices with pattern: {pattern}")
                    break
            
            # 리뷰 수 패턴
            review_patterns = [
                r'<span class="rating-total-count">\(([^)]+)\)</span>',
                r'<em class="rating-total-count">\(([^)]+)\)</em>',
                r'<div class="rating-total-count">\(([^)]+)\)</div>',
                r'<span class="review-count">([^<]+)</span>',
                r'<em class="review-count">([^<]+)</em>'
            ]
            
            reviews = []
            for pattern in review_patterns:
                found_reviews = re.findall(pattern, page_source)
                if found_reviews:
                    reviews = found_reviews
                    print(f"Found {len(reviews)} reviews with pattern: {pattern}")
                    break
            
            print(f"Found {len(product_ids)} product IDs")
            print(f"Found {len(titles)} titles")
            print(f"Found {len(prices)} prices")
            print(f"Found {len(reviews)} reviews")
            
            # 상품 정보 조합
            max_items = min(len(product_ids), len(titles), len(prices))
            
            for i in range(max_items):
                product_info = {
                    'rank': i + 1,
                    'product_id': product_ids[i],
                    'title': titles[i].strip() if i < len(titles) else 'N/A',
                    'price': prices[i].strip() if i < len(prices) else 'N/A',
                    'reviews': reviews[i].strip() if i < len(reviews) else '0',
                    'timestamp': datetime.now().isoformat()
                }
                
                products.append(product_info)
            
            return products
            
        except Exception as e:
            print(f"Error extracting product info: {e}")
            return []
    
    def check_rank(self, keyword):
        """순위 체크 실행"""
        print(f"\nRank check started: {keyword}")
        
        # IP 확인
        self.get_current_ip()
        
        # 상품 검색
        products = self.search_products_with_stealth(keyword)
        
        if not products:
            print("No products found.")
            return None
        
        # 결과 출력
        print(f"\nSearch results (Total {len(products)} products):")
        print("-" * 80)
        print(f"{'Rank':<4} {'Product ID':<12} {'Title':<40} {'Price':<10} {'Reviews':<8}")
        print("-" * 80)
        
        for product in products[:20]:  # 상위 20개만 표시
            title = product['title'][:37] + "..." if len(product['title']) > 40 else product['title']
            print(f"{product['rank']:<4} {product['product_id']:<12} {title:<40} {product['price']:<10} {product['reviews']:<8}")
        
        return products
    
    def save_rank_data(self, keyword, products, filename=None):
        """순위 데이터 저장"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"stealth_rank_data_{keyword}_{timestamp}.json"
        
        data = {
            'keyword': keyword,
            'timestamp': datetime.now().isoformat(),
            'total_products': len(products),
            'products': products
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Rank data saved: {filename}")
        return filename
    
    def close(self):
        """브라우저 종료"""
        if self.driver:
            self.driver.quit()
            print("Stealth browser closed")

def main():
    """메인 실행 함수"""
    print("Stealth Coupang Rank Checker System")
    print("=" * 60)
    
    checker = StealthCoupangRankChecker()
    
    try:
        # 테스트 키워드들
        test_keywords = [
            "mouse",
            "keyboard"
        ]
        
        for keyword in test_keywords:
            try:
                # 순위 체크
                products = checker.check_rank(keyword)
                
                if products:
                    # 데이터 저장
                    checker.save_rank_data(keyword, products)
                
                print("\n" + "="*60)
                time.sleep(10)  # 키워드 간 대기 (봇 감지 방지)
                
            except Exception as e:
                print(f"Error searching {keyword}: {e}")
                continue
        
        print("Stealth rank check completed!")
        
    finally:
        # 브라우저 종료
        checker.close()

if __name__ == "__main__":
    main()










