from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import json
import time
import re
from datetime import datetime
import random

class SeleniumCoupangRankChecker:
    def __init__(self):
        self.driver = None
        self.setup_driver()
        
    def setup_driver(self):
        """Chrome 드라이버 설정"""
        chrome_options = Options()
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        
        # 헤드리스 모드 (필요시 주석 해제)
        # chrome_options.add_argument('--headless')
        
        # 추가 옵션들
        chrome_options.add_argument('--disable-web-security')
        chrome_options.add_argument('--allow-running-insecure-content')
        chrome_options.add_argument('--disable-extensions')
        chrome_options.add_argument('--disable-plugins')
        chrome_options.add_argument('--disable-images')
        
        try:
            # ChromeDriver 자동 설치 및 설정
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            print("Chrome driver initialized successfully")
        except Exception as e:
            print(f"Failed to initialize Chrome driver: {e}")
            raise e
    
    def search_products(self, keyword):
        """쿠팡에서 상품 검색"""
        print(f"Searching for: {keyword}")
        
        try:
            # 검색 URL 생성
            search_url = f"https://www.coupang.com/np/search?q={keyword}"
            
            print(f"Search URL: {search_url}")
            
            # 페이지 로드
            self.driver.get(search_url)
            
            # 페이지 로딩 대기
            time.sleep(random.uniform(3, 5))
            
            # 페이지 디버깅 정보
            print(f"Page title: {self.driver.title}")
            print(f"Current URL: {self.driver.current_url}")
            
            # 페이지 소스 일부 확인
            page_source = self.driver.page_source
            print(f"Page source length: {len(page_source)}")
            
            # 페이지 소스 저장 (디버깅용)
            with open(f"coupang_page_source_{keyword}.html", "w", encoding="utf-8") as f:
                f.write(page_source)
            print(f"Page source saved to: coupang_page_source_{keyword}.html")
            
            # 상품 정보 추출
            products = self.extract_products_from_page(keyword)
            
            return products
            
        except Exception as e:
            print(f"Search failed: {e}")
            return []
    
    def extract_products_from_page(self, keyword):
        """페이지에서 상품 정보 추출"""
        products = []
        
        try:
            # 상품 리스트 대기 (더 긴 대기 시간)
            wait = WebDriverWait(self.driver, 20)
            
            # 상품 리스트 찾기 (여러 선택자 시도)
            product_list = None
            selectors = [
                (By.ID, "productList"),
                (By.CSS_SELECTOR, "ul#productList"),
                (By.CSS_SELECTOR, ".search-product-list"),
                (By.CSS_SELECTOR, "ul[class*='product']")
            ]
            
            for selector_type, selector_value in selectors:
                try:
                    product_list = wait.until(
                        EC.presence_of_element_located((selector_type, selector_value))
                    )
                    print(f"Found product list with selector: {selector_value}")
                    break
                except TimeoutException:
                    continue
            
            if not product_list:
                print("Product list not found with any selector")
                return []
            
            # 개별 상품들 찾기 (여러 선택자 시도)
            product_items = []
            item_selectors = [
                "li.search-product",
                "li[class*='search-product']",
                "li[class*='product']",
                ".search-product",
                "li"
            ]
            
            for selector in item_selectors:
                product_items = product_list.find_elements(By.CSS_SELECTOR, selector)
                if product_items:
                    print(f"Found {len(product_items)} product items with selector: {selector}")
                    break
            
            if not product_items:
                print("No product items found")
                return []
            
            for i, item in enumerate(product_items[:20]):  # 최대 20개
                try:
                    product_info = self.parse_product_item(item, i + 1, keyword)
                    if product_info:
                        products.append(product_info)
                except Exception as e:
                    print(f"Error parsing product {i+1}: {e}")
                    continue
            
            print(f"Successfully parsed {len(products)} products")
            return products
            
        except TimeoutException:
            print("Timeout waiting for product list")
            return []
        except Exception as e:
            print(f"Error extracting products: {e}")
            return []
    
    def parse_product_item(self, item, rank, keyword):
        """개별 상품 정보 파싱"""
        try:
            # 상품 링크
            product_url = ""
            try:
                link_elem = item.find_element(By.CSS_SELECTOR, "a.search-product-link")
                product_url = "https://www.coupang.com" + link_elem.get_attribute('href')
            except NoSuchElementException:
                pass
            
            # 상품 ID 추출 (URL에서)
            product_id = ""
            if product_url:
                match = re.search(r'/products/(\d+)', product_url)
                if match:
                    product_id = match.group(1)
            
            # 상품 제목
            title = ""
            try:
                title_elem = item.find_element(By.CSS_SELECTOR, "div.name")
                title = title_elem.text.strip()
            except NoSuchElementException:
                pass
            
            # 가격
            price = "N/A"
            try:
                price_elem = item.find_element(By.CSS_SELECTOR, "strong.price-value")
                price = price_elem.text.strip()
            except NoSuchElementException:
                pass
            
            # 리뷰 수
            reviews = "0"
            try:
                review_elem = item.find_element(By.CSS_SELECTOR, "span.rating-total-count")
                review_text = review_elem.text.strip()
                # 괄호 안의 숫자 추출
                match = re.search(r'\((\d+)\)', review_text)
                if match:
                    reviews = match.group(1)
            except NoSuchElementException:
                pass
            
            # 평점
            rating = "0"
            try:
                rating_elem = item.find_element(By.CSS_SELECTOR, "em.rating")
                rating = rating_elem.text.strip()
            except NoSuchElementException:
                pass
            
            # 키워드 매칭 확인
            confidence = self.calculate_confidence(title, keyword)
            
            product_info = {
                'rank': rank,
                'product_id': product_id,
                'title': title,
                'price': price,
                'reviews': reviews,
                'rating': rating,
                'url': product_url,
                'confidence': confidence,
                'timestamp': datetime.now().isoformat()
            }
            
            return product_info
            
        except Exception as e:
            print(f"Error parsing product item: {e}")
            return None
    
    def calculate_confidence(self, title, keyword):
        """상품 제목과 키워드의 매칭 신뢰도 계산"""
        if not title or not keyword:
            return 0.0
        
        title_lower = title.lower()
        keyword_lower = keyword.lower()
        
        confidence = 0.0
        
        # 키워드가 제목에 포함되어 있으면 기본 점수
        if keyword_lower in title_lower:
            confidence += 0.5
            
            # 키워드 위치에 따른 추가 점수
            keyword_pos = title_lower.find(keyword_lower)
            if keyword_pos == 0:  # 제목 시작
                confidence += 0.3
            elif keyword_pos < len(title_lower) * 0.3:  # 앞쪽
                confidence += 0.2
            else:  # 뒤쪽
                confidence += 0.1
        
        # 정확한 매칭
        if title_lower == keyword_lower:
            confidence = 1.0
        
        return min(confidence, 1.0)
    
    def check_rank(self, keyword):
        """순위 체크 실행"""
        print(f"\nRank check started: {keyword}")
        
        try:
            # 상품 검색
            products = self.search_products(keyword)
            
            if not products:
                print("No products found.")
                return None
            
            # 결과 출력
            print(f"\nSearch results (Total {len(products)} products):")
            print("-" * 120)
            print(f"{'Rank':<4} {'Product ID':<12} {'Title':<50} {'Price':<12} {'Reviews':<8} {'Rating':<6} {'Confidence':<10}")
            print("-" * 120)
            
            for product in products:
                title = product['title'][:47] + "..." if len(product['title']) > 50 else product['title']
                print(f"{product['rank']:<4} {product['product_id']:<12} {title:<50} {product['price']:<12} {product['reviews']:<8} {product['rating']:<6} {product['confidence']:<10.2f}")
            
            return products
            
        except Exception as e:
            print(f"Error in rank check: {e}")
            return None
    
    def save_rank_data(self, keyword, products, filename=None):
        """순위 데이터 저장"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"selenium_rank_data_{keyword}_{timestamp}.json"
        
        data = {
            'keyword': keyword,
            'timestamp': datetime.now().isoformat(),
            'total_products': len(products),
            'products': products,
            'method': 'SELENIUM_WEB_SCRAPING'
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Rank data saved: {filename}")
        return filename
    
    def find_specific_product(self, products, target_url):
        """특정 URL의 상품 순위 찾기"""
        if not target_url or not products:
            return None
        
        # URL에서 상품 ID 추출
        match = re.search(r'/products/(\d+)', target_url)
        if not match:
            return None
        
        target_product_id = match.group(1)
        
        # 상품 목록에서 해당 ID 찾기
        for product in products:
            if product['product_id'] == target_product_id:
                return product
        
        return None
    
    def close(self):
        """드라이버 종료"""
        if self.driver:
            self.driver.quit()
            print("Driver closed")

def main():
    """메인 실행 함수"""
    print("Selenium Coupang Rank Checker System")
    print("=" * 70)
    
    checker = SeleniumCoupangRankChecker()
    
    try:
        # 테스트 키워드
        keyword = "트롤리"
        target_url = "https://www.coupang.com/vp/products/8473798698?itemId=24519876305&vendorItemId=89369126187"
        
        # 순위 체크
        products = checker.check_rank(keyword)
        
        if products:
            # 데이터 저장
            checker.save_rank_data(keyword, products)
            
            # 특정 상품 순위 찾기
            target_product = checker.find_specific_product(products, target_url)
            
            if target_product:
                print(f"\n🎯 Target Product Found!")
                print(f"Rank: {target_product['rank']}")
                print(f"Title: {target_product['title']}")
                print(f"Price: {target_product['price']}")
                print(f"Reviews: {target_product['reviews']}")
                print(f"Rating: {target_product['rating']}")
                print(f"URL: {target_product['url']}")
                print(f"Confidence: {target_product['confidence']:.2f}")
            else:
                print(f"\n❌ Target product not found in search results")
                print(f"Target URL: {target_url}")
                print("The product might not be in the top 20 results for this keyword.")
        
        print("\nSelenium Coupang rank check completed!")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        checker.close()

if __name__ == "__main__":
    main()
