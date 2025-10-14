from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.firefox.options import Options
from webdriver_manager.firefox import GeckoDriverManager
import time
import json
from datetime import datetime
import requests
from urllib.parse import quote
import re

class FirefoxCoupangRankChecker:
    def __init__(self):
        self.driver = None
        self.setup_driver()
        
    def setup_driver(self):
        """Firefox 드라이버 설정"""
        print("Setting up Firefox driver...")
        
        firefox_options = Options()
        
        # HTTP/2 비활성화 및 프로토콜 관련 설정
        firefox_options.set_preference("network.http.http2.enabled", False)
        firefox_options.set_preference("network.http.spdy.enabled", False)
        firefox_options.set_preference("network.http.spdy.enabled.http2", False)
        firefox_options.set_preference("network.http.spdy.enabled.v3-1", False)
        firefox_options.set_preference("network.http.spdy.enabled.v3", False)
        firefox_options.set_preference("network.http.spdy.enabled.v2", False)
        
        # 기타 설정
        firefox_options.set_preference("dom.webdriver.enabled", False)
        firefox_options.set_preference("useAutomationExtension", False)
        firefox_options.set_preference("general.useragent.override", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0")
        
        # 이미지 로딩 비활성화 (속도 향상)
        firefox_options.set_preference("permissions.default.image", 2)
        firefox_options.set_preference("permissions.default.stylesheet", 2)
        
        # JavaScript 비활성화 (필요시)
        # firefox_options.set_preference("javascript.enabled", False)
        
        # 자동화 감지 방지
        firefox_options.set_preference("dom.webnotifications.enabled", False)
        firefox_options.set_preference("media.volume_scale", "0.0")
        
        try:
            service = Service(GeckoDriverManager().install())
            self.driver = webdriver.Firefox(service=service, options=firefox_options)
            
            # 페이지 로드 타임아웃 설정
            self.driver.set_page_load_timeout(60)
            self.driver.implicitly_wait(10)
            
            print("Firefox driver setup completed")
            
        except Exception as e:
            print(f"Firefox driver setup failed: {e}")
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
    
    def search_products_direct_url(self, keyword):
        """직접 검색 URL로 상품 검색"""
        print(f"\nSearching for: {keyword}")
        
        try:
            # 검색 URL로 직접 이동
            search_url = f"https://www.coupang.com/np/search?q={quote(keyword)}"
            print(f"Direct URL: {search_url}")
            
            # 페이지 로드
            self.driver.get(search_url)
            time.sleep(5)  # 페이지 로딩 대기
            
            # 페이지 제목 확인
            page_title = self.driver.title
            print(f"Page title: {page_title}")
            
            # 현재 URL 확인
            current_url = self.driver.current_url
            print(f"Current URL: {current_url}")
            
            # 페이지 소스 길이 확인
            page_source = self.driver.page_source
            print(f"Page source length: {len(page_source)} characters")
            
            # 상품 정보 추출
            products = self.extract_product_info(page_source)
            return products
            
        except Exception as e:
            print(f"Search failed: {e}")
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
                r'<span class="name">([^<]+)</span>'
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
                r'<em class="price-value">([^<]+)</em>'
            ]
            
            prices = []
            for pattern in price_patterns:
                found_prices = re.findall(pattern, page_source)
                if found_prices:
                    prices = found_prices
                    print(f"Found {len(prices)} prices with pattern: {pattern}")
                    break
            
            # 리뷰 수 패턴
            review_pattern = r'<span class="rating-total-count">\(([^)]+)\)</span>'
            reviews = re.findall(review_pattern, page_source)
            
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
        products = self.search_products_direct_url(keyword)
        
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
            filename = f"firefox_rank_data_{keyword}_{timestamp}.json"
        
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
            print("Firefox browser closed")

def main():
    """메인 실행 함수"""
    print("Firefox Coupang Rank Checker System")
    print("=" * 60)
    
    checker = FirefoxCoupangRankChecker()
    
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
                time.sleep(5)  # 키워드 간 대기
                
            except Exception as e:
                print(f"Error searching {keyword}: {e}")
                continue
        
        print("Firefox rank check completed!")
        
    finally:
        # 브라우저 종료
        checker.close()

if __name__ == "__main__":
    main()










