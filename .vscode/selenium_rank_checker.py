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

class SeleniumCoupangRankChecker:
    def __init__(self):
        self.driver = None
        self.setup_driver()
        
    def setup_driver(self):
        """Chrome 드라이버 설정"""
        print("Setting up Chrome driver...")
        
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # User-Agent 설정
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        
        # 헤드리스 모드 비활성화 (브라우저 보이기)
        # chrome_options.add_argument("--headless")
        
        try:
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # 자동화 감지 방지
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            print("Chrome driver setup completed")
            
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
    
    def search_products(self, keyword):
        """키워드로 상품 검색"""
        print(f"\nSearching for: {keyword}")
        
        try:
            # 쿠팡 메인 페이지 접속
            print("Navigating to Coupang...")
            self.driver.get("https://www.coupang.com")
            time.sleep(3)
            
            # 검색창 찾기 (여러 선택자 시도)
            search_box = None
            selectors = [
                "input[name='q']",
                "#headerSearchKeyword",
                ".search-input",
                "input[type='search']"
            ]
            
            for selector in selectors:
                try:
                    search_box = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                    )
                    print(f"Found search box with selector: {selector}")
                    break
                except:
                    continue
            
            if not search_box:
                print("Search box not found, trying direct URL...")
                # 검색 URL로 직접 이동
                from urllib.parse import quote
                search_url = f"https://www.coupang.com/np/search?q={quote(keyword)}"
                self.driver.get(search_url)
                time.sleep(5)
            else:
                # 검색어 입력
                search_box.clear()
                search_box.send_keys(keyword)
                time.sleep(1)
                
                # 검색 버튼 클릭
                try:
                    search_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
                    search_button.click()
                except:
                    # 엔터키로 검색
                    from selenium.webdriver.common.keys import Keys
                    search_box.send_keys(Keys.RETURN)
            
            # 검색 결과 페이지 로딩 대기
            print("Waiting for search results...")
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".search-product"))
            )
            
            time.sleep(3)  # 추가 로딩 대기
            
            # 상품 정보 추출
            products = self.extract_product_info()
            return products
            
        except Exception as e:
            print(f"Search failed: {e}")
            return []
    
    def extract_product_info(self):
        """검색 결과에서 상품 정보 추출"""
        products = []
        
        try:
            # 상품 리스트 찾기
            product_elements = self.driver.find_elements(By.CSS_SELECTOR, ".search-product")
            print(f"Found {len(product_elements)} products")
            
            for i, product in enumerate(product_elements[:20]):  # 상위 20개만
                try:
                    # 상품 링크에서 ID 추출
                    link_element = product.find_element(By.CSS_SELECTOR, "a")
                    href = link_element.get_attribute("href")
                    product_id = href.split("/products/")[-1] if "/products/" in href else "N/A"
                    
                    # 상품 제목
                    try:
                        title_element = product.find_element(By.CSS_SELECTOR, ".name")
                        title = title_element.text.strip()
                    except:
                        title = "N/A"
                    
                    # 가격
                    try:
                        price_element = product.find_element(By.CSS_SELECTOR, ".price-value")
                        price = price_element.text.strip()
                    except:
                        price = "N/A"
                    
                    # 리뷰 수
                    try:
                        review_element = product.find_element(By.CSS_SELECTOR, ".rating-total-count")
                        reviews = review_element.text.strip()
                    except:
                        reviews = "0"
                    
                    product_info = {
                        'rank': i + 1,
                        'product_id': product_id,
                        'title': title,
                        'price': price,
                        'reviews': reviews,
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    products.append(product_info)
                    
                except Exception as e:
                    print(f"Error extracting product {i+1}: {e}")
                    continue
            
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
        products = self.search_products(keyword)
        
        if not products:
            print("No products found.")
            return None
        
        # 결과 출력
        print(f"\nSearch results (Total {len(products)} products):")
        print("-" * 80)
        print(f"{'Rank':<4} {'Product ID':<12} {'Title':<40} {'Price':<10} {'Reviews':<8}")
        print("-" * 80)
        
        for product in products:
            title = product['title'][:37] + "..." if len(product['title']) > 40 else product['title']
            print(f"{product['rank']:<4} {product['product_id']:<12} {title:<40} {product['price']:<10} {product['reviews']:<8}")
        
        return products
    
    def save_rank_data(self, keyword, products, filename=None):
        """순위 데이터 저장"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"selenium_rank_data_{keyword}_{timestamp}.json"
        
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
            print("Browser closed")

def main():
    """메인 실행 함수"""
    print("Selenium Coupang Rank Checker System")
    print("=" * 50)
    
    checker = SeleniumCoupangRankChecker()
    
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
                
                print("\n" + "="*50)
                time.sleep(3)  # 키워드 간 대기
                
            except Exception as e:
                print(f"Error searching {keyword}: {e}")
                continue
        
        print("Selenium rank check completed!")
        
    finally:
        # 브라우저 종료
        checker.close()

if __name__ == "__main__":
    main()
