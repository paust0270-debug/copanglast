import requests
import time
import re
import json
from datetime import datetime
from urllib.parse import quote

class HybridCoupangRankChecker:
    def __init__(self):
        self.session = requests.Session()
        self.setup_headers()
        self.rank_data = []
        
    def setup_headers(self):
        """PC 웹 환경 헤더 설정"""
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Origin': 'https://www.coupang.com',
            'Referer': 'https://www.coupang.com/'
        })
    
    def get_current_ip(self):
        """현재 IP 정보 확인"""
        try:
            response = requests.get('https://ipinfo.io/json', timeout=10)
            ip_info = response.json()
            print(f"🌐 현재 IP: {ip_info.get('ip')}")
            print(f"📡 ISP: {ip_info.get('org')}")
            return ip_info
        except Exception as e:
            print(f"❌ IP 확인 실패: {e}")
            return None
    
    def search_products(self, keyword, max_pages=3):
        """키워드로 상품 검색 및 순위 정보 추출"""
        print(f"\n🔍 검색 키워드: {keyword}")
        all_products = []
        
        for page in range(1, max_pages + 1):
            try:
                # 쿠팡 검색 URL
                search_url = f"https://www.coupang.com/np/search?q={quote(keyword)}&page={page}"
                print(f"  📄 페이지 {page}: {search_url}")
                
                start_time = time.time()
                response = self.session.get(search_url, timeout=30)
                end_time = time.time()
                
                response_time = round((end_time - start_time) * 1000, 2)
                
                if response.status_code == 200:
                    print(f"  ✅ 성공: {response.status_code} ({response_time}ms)")
                    
                    # 상품 정보 추출
                    products = self.extract_product_info(response.text, page)
                    all_products.extend(products)
                    print(f"  📦 상품 {len(products)}개 발견")
                    
                else:
                    print(f"  ❌ 실패: {response.status_code}")
                    
            except Exception as e:
                print(f"  ❌ 오류: {e}")
            
            # 페이지 간 대기
            time.sleep(2)
        
        return all_products
    
    def extract_product_info(self, html_content, page):
        """HTML에서 상품 정보 추출"""
        products = []
        
        # 상품 링크 패턴
        product_pattern = r'/products/(\d+)'
        product_ids = re.findall(product_pattern, html_content)
        
        # 상품 제목 패턴
        title_pattern = r'<dt class="name">.*?<a[^>]*>([^<]+)</a>'
        titles = re.findall(title_pattern, html_content, re.DOTALL)
        
        # 가격 패턴
        price_pattern = r'<strong class="price-value">([^<]+)</strong>'
        prices = re.findall(price_pattern, html_content)
        
        # 리뷰 수 패턴
        review_pattern = r'<span class="rating-total-count">\(([^)]+)\)</span>'
        reviews = re.findall(review_pattern, html_content)
        
        # 상품 정보 조합
        max_items = min(len(product_ids), len(titles), len(prices))
        
        for i in range(max_items):
            rank = (page - 1) * 60 + i + 1  # 쿠팡은 페이지당 60개 상품
            
            product_info = {
                'rank': rank,
                'product_id': product_ids[i],
                'title': titles[i].strip() if i < len(titles) else 'N/A',
                'price': prices[i].strip() if i < len(prices) else 'N/A',
                'reviews': reviews[i].strip() if i < len(reviews) else '0',
                'page': page,
                'timestamp': datetime.now().isoformat()
            }
            
            products.append(product_info)
        
        return products
    
    def check_rank(self, keyword, target_product_id=None):
        """특정 키워드에서 상품 순위 확인"""
        print(f"\n🎯 순위 체크 시작: {keyword}")
        
        # IP 확인
        self.get_current_ip()
        
        # 상품 검색
        products = self.search_products(keyword)
        
        if not products:
            print("❌ 상품을 찾을 수 없습니다.")
            return None
        
        # 결과 출력
        print(f"\n📊 검색 결과 (총 {len(products)}개 상품):")
        print("-" * 80)
        print(f"{'순위':<4} {'상품ID':<12} {'제목':<40} {'가격':<10} {'리뷰':<8}")
        print("-" * 80)
        
        for product in products[:20]:  # 상위 20개만 표시
            title = product['title'][:37] + "..." if len(product['title']) > 40 else product['title']
            print(f"{product['rank']:<4} {product['product_id']:<12} {title:<40} {product['price']:<10} {product['reviews']:<8}")
        
        # 특정 상품 순위 찾기
        if target_product_id:
            target_rank = None
            for product in products:
                if product['product_id'] == target_product_id:
                    target_rank = product['rank']
                    break
            
            if target_rank:
                print(f"\n🎯 타겟 상품 순위: {target_rank}위")
                return target_rank
            else:
                print(f"\n❌ 타겟 상품을 찾을 수 없습니다.")
                return None
        
        return products
    
    def save_rank_data(self, keyword, products, filename=None):
        """순위 데이터 저장"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"rank_data_{keyword}_{timestamp}.json"
        
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

def main():
    """메인 실행 함수"""
    print("Hybrid Coupang Rank Checker System")
    print("=" * 50)
    
    checker = HybridCoupangRankChecker()
    
    # 테스트 키워드들
    test_keywords = [
        "무선마우스",
        "키보드",
        "모니터"
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
    
    print("Hybrid rank check completed!")

if __name__ == "__main__":
    main()
