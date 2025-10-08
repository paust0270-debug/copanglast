import requests
import json
import time
import random
from datetime import datetime
import re
from urllib.parse import quote

class StealthCoupangChecker:
    def __init__(self):
        self.session = requests.Session()
        # 더 정교한 헤더 설정
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'DNT': '1',
            'Sec-CH-UA': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-CH-UA-Mobile': '?0',
            'Sec-CH-UA-Platform': '"Windows"'
        }
        self.session.headers.update(self.headers)
        
    def check_coupang_accessibility(self):
        """쿠팡 접근 가능성 확인"""
        print("Checking Coupang accessibility...")
        
        test_urls = [
            "https://www.coupang.com/",
            "https://www.coupang.com/np/search?q=test",
            "https://www.coupang.com/np/categories/sc"
        ]
        
        for url in test_urls:
            try:
                print(f"Testing: {url}")
                response = self.session.get(url, timeout=15)
                print(f"Status: {response.status_code}, Length: {len(response.text)}")
                
                if response.status_code == 200:
                    if len(response.text) > 10000:
                        print("✅ Access successful")
                        return True
                    else:
                        print("⚠️ Response too short (likely blocked)")
                else:
                    print(f"❌ HTTP Error: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Connection Error: {e}")
            
            time.sleep(random.uniform(2, 4))
        
        return False
    
    def search_with_sessions(self, keyword):
        """세션을 유지하면서 검색"""
        print(f"Searching with session management: {keyword}")
        
        try:
            # 1단계: 메인 페이지 방문 (쿠키 설정)
            print("Step 1: Visiting main page...")
            main_response = self.session.get("https://www.coupang.com/", timeout=30)
            if main_response.status_code != 200:
                print(f"Main page access failed: {main_response.status_code}")
                return []
            
            time.sleep(random.uniform(3, 5))
            
            # 2단계: 카테고리 페이지만 접근
            print("Step 2: Checking category page...")
            category_url = "https://www.coupang.com/np/categories/sc"
            category_response = self.session.get(category_url, timeout=30)
            print(f"Category page status: {category_response.status_code}")
            
            time.sleep(random.uniform(2, 4))
            
            # 3단계: 검색 시도
            print("Step 3: Attempting search...")
            search_url = f"https://www.coupang.com/np/search?q={quote(keyword)}"
            
            # 세션 헤더에 Referer 추가
            search_headers = dict(self.headers)
            search_headers['Referer'] = 'https://www.coupang.com/'
            
            search_response = self.session.get(search_url, headers=search_headers, timeout=30)
            
            print(f"Search response status: {search_response.status_code}")
            print(f"Search response length: {len(search_response.text)}")
            
            if search_response.status_code == 200:
                # 응답 내용 확인
                if "productList" in search_response.text or "search-product" in search_response.text:
                    print("✅ Search successful - found product content")
                    return self.parse_search_results(search_response.text, keyword)
                else:
                    print("⚠️ Search response doesn't contain product content")
                    # 응답 내용 일부 저장
                    with open(f"search_response_{keyword}.html", "w", encoding="utf-8") as f:
                        f.write(search_response.text)
                    print(f"Response saved to: search_response_{keyword}.html")
                    return []
            else:
                print(f"❌ Search failed: {search_response.status_code}")
                return []
                
        except Exception as e:
            print(f"Search failed: {e}")
            return []
    
    def parse_search_results(self, html_content, keyword):
        """검색 결과 파싱"""
        products = []
        
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # 상품 리스트 찾기
            product_list = soup.find('ul', {'id': 'productList'}) or soup.find('div', class_='search-product-list')
            
            if product_list:
                product_items = product_list.find_all('li', class_='search-product')
                print(f"Found {len(product_items)} product items")
                
                for i, item in enumerate(product_items[:20]):
                    try:
                        product_info = self.parse_product_item(item, i + 1, keyword)
                        if product_info:
                            products.append(product_info)
                    except Exception as e:
                        print(f"Error parsing product {i+1}: {e}")
                        continue
            else:
                print("Product list not found in response")
                
        except Exception as e:
            print(f"Error parsing results: {e}")
        
        return products
    
    def parse_product_item(self, item, rank, keyword):
        """개별 상품 정보 파싱"""
        try:
            # 상품 링크
            product_url = ""
            link_elem = item.find('a', class_='search-product-link')
            if link_elem:
                product_url = "https://www.coupang.com" + link_elem.get('href', '')
            
            # 상품 ID 추출
            product_id = ""
            if product_url:
                match = re.search(r'/products/(\d+)', product_url)
                if match:
                    product_id = match.group(1)
            
            # 상품 제목
            title = ""
            title_elem = item.find('div', class_='name')
            if title_elem:
                title = title_elem.get_text(strip=True)
            
            # 가격
            price = "N/A"
            price_elem = item.find('strong', class_='price-value')
            if price_elem:
                price = price_elem.get_text(strip=True)
            
            # 리뷰 수
            reviews = "0"
            review_elem = item.find('span', class_='rating-total-count')
            if review_elem:
                review_text = review_elem.get_text(strip=True)
                match = re.search(r'\((\d+)\)', review_text)
                if match:
                    reviews = match.group(1)
            
            # 평점
            rating = "0"
            rating_elem = item.find('em', class_='rating')
            if rating_elem:
                rating = rating_elem.get_text(strip=True)
            
            # 신뢰도 계산
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
        """신뢰도 계산"""
        if not title or not keyword:
            return 0.0
        
        title_lower = title.lower()
        keyword_lower = keyword.lower()
        
        confidence = 0.0
        
        if keyword_lower in title_lower:
            confidence += 0.5
            keyword_pos = title_lower.find(keyword_lower)
            if keyword_pos == 0:
                confidence += 0.3
            elif keyword_pos < len(title_lower) * 0.3:
                confidence += 0.2
            else:
                confidence += 0.1
        
        if title_lower == keyword_lower:
            confidence = 1.0
        
        return min(confidence, 1.0)
    
    def find_specific_product(self, products, target_url):
        """특정 제품 찾기"""
        if not target_url or not products:
            return None
        
        match = re.search(r'/products/(\d+)', target_url)
        if not match:
            return None
        
        target_product_id = match.group(1)
        
        for product in products:
            if product['product_id'] == target_product_id:
                return product
        
        return None
    
    def check_rank(self, keyboard, target_url):
        """순위 체크 메인 함수"""
        print(f"Keyword: {keyboard}")
        print(f"Target URL: {target_url}")
        
        # 1. 접근성 확인
        if not self.check_coupang_accessibility():
            print("❌ Coupang access blocked")
            return None
        
        print("✅ Coupang access confirmed")
        
        # 2. 검색 실행
        products = self.search_with_sessions(keyboard)
        
        if not products:
            print("❌ No products found in search results")
            return None
        
        # 3. 결과 출력
        print(f"\nSearch Results ({len(products)} products):")
        print("-" * 120)
        print(f"{'Rank':<4} {'Product ID':<12} {'Title':<50} {'Price':<12} {'Reviews':<8} {'Confidence':<10}")
        print("-" * 120)
        
        for product in products:
            title = product['title'][:47] + "..." if len(product['title']) > 50 else product['title']
            print(f"{product['rank']:<4} {product['product_id']:<12} {title:<50} {product['price']:<12} {product['reviews']:<8} {product['confidence']:<10.2f}")
        
        # 4. 타겟 제품 확인
        target_product = self.find_specific_product(products, target_url)
        
        if target_product:
            print(f"\n🎯 Target Product Found!")
            print(f"Rank: {target_product['rank']}")
            print(f"Title: {target_product['title']}")
            print(f"Price: {target_product['price']}")
            print(f"Reviews: {target_product['reviews']}")
            print(f"URL: {target_product['url']}")
        else:
            print(f"\n❌ Target product not found in top {len(products)} results")
        
        # 5. 데이터 저장
        self.save_results(keyboard, products, target_product)
        
        return products
    
    def save_results(self, keyboard, products, target_product):
        """결과 저장"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"stealth_results_{keyboard}_{timestamp}.json"
        
        data = {
            'keyword': keyboard,
            'timestamp': datetime.now().isoformat(),
            'total_products': len(products),
            'products': products,
            'target_product': target_product,
            'method': 'STEALTH_SESSION_MANAGEMENT'
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"\nResults saved: {filename}")

def main():
    print("Stealth Coupang Rank Checker")
    print("=" * 50)
    
    keyboard = "트롤리"
    target_url = "https://www.coupang.com/vp/products/8473798698?itemId=24519876305&vendorItemId=89369126187"
    
    checker = StealthCoupangChecker()
    result = checker.check_rank(keyboard, target_url)
    
    if result:
        print(f"\n✅ Successfully found {len(result)} products for '{keyboard}'")
    else:
        print(f"\n❌ Failed to retrieve products for '{keyboard}'")

if __name__ == "__main__":
    main()










