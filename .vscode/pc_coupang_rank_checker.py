import requests
from bs4 import BeautifulSoup
import json
import time
from datetime import datetime
import re
from urllib.parse import quote
import random

class PCCoupangRankChecker:
    def __init__(self):
        self.session = requests.Session()
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
        }
        self.session.headers.update(self.headers)
        
        # 세션 설정
        self.session.max_redirects = 5
        self.session.timeout = 30
        
    def search_products(self, keyword):
        """쿠팡에서 상품 검색"""
        print(f"Searching for: {keyword}")
        
        try:
            # 검색 URL 생성
            encoded_keyword = quote(keyword)
            search_url = f"https://www.coupang.com/np/search?q={encoded_keyword}"
            
            print(f"Search URL: {search_url}")
            
            # 요청 전 랜덤 대기 (봇 탐지 방지)
            time.sleep(random.uniform(2, 5))
            
            # 검색 요청 (재시도 로직 포함)
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    print(f"Attempt {attempt + 1}/{max_retries}")
                    response = self.session.get(search_url, timeout=30)
                    response.raise_for_status()
                    break
                except Exception as e:
                    print(f"Attempt {attempt + 1} failed: {e}")
                    if attempt < max_retries - 1:
                        time.sleep(random.uniform(3, 6))
                        continue
                    else:
                        raise e
            
            print(f"Response status: {response.status_code}")
            print(f"Response length: {len(response.text)}")
            
            # HTML 파싱
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 상품 정보 추출
            products = self.extract_products_from_html(soup, keyword)
            
            return products
            
        except Exception as e:
            print(f"Search failed: {e}")
            return []
    
    def extract_products_from_html(self, soup, keyword):
        """HTML에서 상품 정보 추출"""
        products = []
        
        try:
            # 상품 리스트 찾기
            product_list = soup.find('ul', {'id': 'productList'})
            if not product_list:
                print("Product list not found")
                return []
            
            # 개별 상품들 찾기
            product_items = product_list.find_all('li', class_='search-product')
            
            print(f"Found {len(product_items)} product items")
            
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
            
        except Exception as e:
            print(f"Error extracting products: {e}")
            return []
    
    def parse_product_item(self, item, rank, keyword):
        """개별 상품 정보 파싱"""
        try:
            # 상품 링크
            link_elem = item.find('a', class_='search-product-link')
            product_url = ""
            if link_elem:
                product_url = "https://www.coupang.com" + link_elem.get('href', '')
            
            # 상품 ID 추출 (URL에서)
            product_id = ""
            if product_url:
                match = re.search(r'/products/(\d+)', product_url)
                if match:
                    product_id = match.group(1)
            
            # 상품 제목
            title_elem = item.find('div', class_='name')
            title = ""
            if title_elem:
                title = title_elem.get_text(strip=True)
            
            # 가격
            price_elem = item.find('strong', class_='price-value')
            price = "N/A"
            if price_elem:
                price = price_elem.get_text(strip=True)
            
            # 리뷰 수
            review_elem = item.find('span', class_='rating-total-count')
            reviews = "0"
            if review_elem:
                review_text = review_elem.get_text(strip=True)
                # 괄호 안의 숫자 추출
                match = re.search(r'\((\d+)\)', review_text)
                if match:
                    reviews = match.group(1)
            
            # 평점
            rating_elem = item.find('em', class_='rating')
            rating = "0"
            if rating_elem:
                rating = rating_elem.get_text(strip=True)
            
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
            filename = f"pc_rank_data_{keyword}_{timestamp}.json"
        
        data = {
            'keyword': keyword,
            'timestamp': datetime.now().isoformat(),
            'total_products': len(products),
            'products': products,
            'method': 'PC_WEB_SCRAPING'
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

def main():
    """메인 실행 함수"""
    print("PC Coupang Rank Checker System")
    print("=" * 70)
    
    checker = PCCoupangRankChecker()
    
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
        
        print("\nPC Coupang rank check completed!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
