from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from webdriver_manager.chrome import ChromeDriverManager
import time
import json
from datetime import datetime
import requests
import re
import random

class RealClickCoupangRankChecker:
    def __init__(self):
        self.driver = None
        self.setup_driver()
        
    def setup_driver(self):
        """실제 사용자처럼 보이는 Chrome 드라이버 설정"""
        print("Setting up Real Click Chrome driver...")
        
        chrome_options = Options()
        
        # 실제 사용자처럼 보이게 설정
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # 실제 사용자 User-Agent
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        
        # 브라우저 창 크기 설정 (실제 사용자처럼)
        chrome_options.add_argument("--window-size=1920,1080")
        
        # 헤드리스 모드 비활성화 (브라우저 보이기)
        # chrome_options.add_argument("--headless")
        
        try:
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # 자동화 감지 방지
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.driver.execute_script("Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]})")
            self.driver.execute_script("Object.defineProperty(navigator, 'languages', {get: () => ['ko-KR', 'ko', 'en-US', 'en']})")
            
            # 페이지 로드 타임아웃 설정
            self.driver.set_page_load_timeout(60)
            self.driver.implicitly_wait(10)
            
            print("Real Click Chrome driver setup completed")
            
        except Exception as e:
            print(f"Chrome driver setup failed: {e}")
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
    
    def human_like_delay(self, min_seconds=1, max_seconds=3):
        """사람처럼 랜덤 지연"""
        delay = random.uniform(min_seconds, max_seconds)
        time.sleep(delay)
    
    def human_like_typing(self, element, text):
        """사람처럼 타이핑"""
        for char in text:
            element.send_keys(char)
            time.sleep(random.uniform(0.05, 0.2))
    
    def human_like_scroll(self):
        """사람처럼 스크롤"""
        # 페이지 하단으로 스크롤
        self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        self.human_like_delay(1, 2)
        
        # 페이지 상단으로 스크롤
        self.driver.execute_script("window.scrollTo(0, 0);")
        self.human_like_delay(1, 2)
    
    def search_products_real_click(self, keyword):
        """실제 클릭으로 상품 검색"""
        print(f"\nSearching for: {keyword} (Real Click Mode)")
        
        try:
            # 1단계: 쿠팡 메인 페이지 접속
            print("Step 1: Opening Coupang main page...")
            self.driver.get("https://www.coupang.com")
            self.human_like_delay(3, 5)
            
            # 페이지 로딩 확인
            page_title = self.driver.title
            print(f"Main page title: {page_title}")
            
            # 2단계: 검색창 찾기
            print("Step 2: Looking for search box...")
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
                # 3단계: 검색창 클릭
                print("Step 3: Clicking search box...")
                ActionChains(self.driver).move_to_element(search_box).click().perform()
                self.human_like_delay(1, 2)
                
                # 4단계: 검색어 입력
                print("Step 4: Typing search keyword...")
                search_box.clear()
                self.human_like_delay(0.5, 1)
                
                # 사람처럼 타이핑
                self.human_like_typing(search_box, keyword)
                self.human_like_delay(1, 2)
                
                # 5단계: 검색 실행
                print("Step 5: Executing search...")
                try:
                    # 검색 버튼 찾기
                    search_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
                    ActionChains(self.driver).move_to_element(search_button).click().perform()
                except:
                    # 엔터키로 검색
                    search_box.send_keys(Keys.RETURN)
                
                self.human_like_delay(3, 5)
                
                # 6단계: 검색 결과 페이지 확인
                print("Step 6: Checking search results...")
                current_url = self.driver.current_url
                print(f"Current URL: {current_url}")
                
                page_title = self.driver.title
                print(f"Search page title: {page_title}")
                
                # 7단계: 사람처럼 스크롤
                print("Step 7: Scrolling like a human...")
                self.human_like_scroll()
                
                # 8단계: 상품 정보 추출
                print("Step 8: Extracting product information...")
                products = self.extract_product_info()
                return products
                
            else:
                print("Search box not found, trying direct URL...")
                # 검색창을 찾을 수 없으면 직접 URL로 이동
                search_url = f"https://www.coupang.com/np/search?q={keyword}"
                self.driver.get(search_url)
                self.human_like_delay(5, 8)
                
                # 사람처럼 스크롤
                self.human_like_scroll()
                
                # 상품 정보 추출
                products = self.extract_product_info()
                return products
            
        except Exception as e:
            print(f"Real click search failed: {e}")
            return []
    
    def extract_product_info(self):
        """검색 결과에서 상품 정보 추출"""
        products = []
        
        try:
            # 페이지 소스 가져오기
            page_source = self.driver.page_source
            
            # 상품 링크 패턴
            product_pattern = r'/products/(\d+)'
            product_ids = re.findall(product_pattern, page_source)
            
            # 상품 제목 패턴
            title_patterns = [
                r'<dt class="name">.*?<a[^>]*>([^<]+)</a>',
                r'<a[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)</a>',
                r'data-product-id="[^"]*"[^>]*>([^<]+)</a>',
                r'<span class="name">([^<]+)</span>',
                r'<div class="name">([^<]+)</div>'
            ]
            
            titles = []
            for pattern in title_patterns:
                found_titles = re.findall(pattern, page_source, re.DOTALL)
                if found_titles:
                    titles = found_titles
                    print(f"Found {len(titles)} titles with pattern: {pattern}")
                    break
            
            # 가격 패턴
            price_patterns = [
                r'<strong class="price-value">([^<]+)</strong>',
                r'<span class="price-value">([^<]+)</span>',
                r'data-price="([^"]*)"',
                r'<em class="price-value">([^<]+)</em>',
                r'<div class="price-value">([^<]+)</div>'
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
                r'<div class="rating-total-count">\(([^)]+)\)</div>'
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
        products = self.search_products_real_click(keyword)
        
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
            filename = f"real_click_rank_data_{keyword}_{timestamp}.json"
        
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
            print("Real Click browser closed")

def main():
    """메인 실행 함수"""
    print("Real Click Coupang Rank Checker System")
    print("=" * 60)
    
    checker = RealClickCoupangRankChecker()
    
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
                time.sleep(10)  # 키워드 간 대기
                
            except Exception as e:
                print(f"Error searching {keyword}: {e}")
                continue
        
        print("Real Click rank check completed!")
        
    finally:
        # 브라우저 종료
        checker.close()

if __name__ == "__main__":
    main()










