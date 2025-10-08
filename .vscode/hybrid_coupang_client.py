# hybrid_coupang_client.py
import requests
import json
import time
import hashlib
import os
from urllib.parse import urlencode

class HybridCoupangClient:
    def __init__(self):
        self.base_url = "https://www.coupang.com"
        self.api_base_url = "https://www.coupang.com/np"
        
        self.session = requests.Session()
        self.device_id = self.generate_device_id()
        self.session_token = None
        
        # 모바일 IP 환경에서 PC 웹 API 호출을 위한 헤더 설정
        self.setup_hybrid_headers()
        
        # 캡처된 API 정보 로드
        self.load_captured_apis()
    
    def generate_device_id(self):
        """디바이스 ID 생성"""
        import platform
        import getpass
        
        system_info = f"{platform.node()}-{getpass.getuser()}-{time.time()}"
        device_hash = hashlib.sha256(system_info.encode()).hexdigest()
        return device_hash[:32].upper()
    
    def setup_hybrid_headers(self):
        """하이브리드 환경 헤더 설정 (모바일 IP + PC 웹)"""
        self.session.headers.update({
            # PC 웹 브라우저 User-Agent (모바일 IP에서 사용)
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            
            # PC 웹 브라우저 헤더
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            
            # PC 웹 브라우저 보안 헤더
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            
            # 쿠팡 PC 웹 특화 헤더
            'Origin': 'https://www.coupang.com',
            'Referer': 'https://www.coupang.com/',
            
            # 모바일 IP 환경 식별 (선택적)
            'X-Forwarded-For': '175.223.22.132',
            'X-Real-IP': '175.223.22.132'
        })
    
    def load_captured_apis(self):
        """캡처된 API 정보 로드"""
        try:
            with open('analyzed_ranking_apis.json', 'r', encoding='utf-8') as f:
                self.captured_apis = json.load(f)
                print(f"✅ {len(self.captured_apis)}개의 API 정보 로드됨")
        except FileNotFoundError:
            print("⚠️ 캡처된 API 파일이 없습니다. 기본 PC 웹 API 사용")
            self.captured_apis = self.get_default_pc_apis()
    
    def get_default_pc_apis(self):
        """기본 PC 웹 API 정보"""
        return [
            {
                'name': 'PC 웹 검색 API',
                'url': f'{self.api_base_url}/search',
                'method': 'GET',
                'required_params': {
                    'q': {'type': 'required', 'description': '검색어'},
                    'page': {'type': 'optional', 'description': '페이지 번호'},
                    'size': {'type': 'optional', 'description': '페이지당 항목 수'}
                }
            },
            {
                'name': 'PC 웹 카테고리 API',
                'url': f'{self.api_base_url}/categories',
                'method': 'GET',
                'required_params': {
                    'categoryId': {'type': 'required', 'description': '카테고리 ID'},
                    'page': {'type': 'optional', 'description': '페이지 번호'}
                }
            }
        ]
    
    def verify_mobile_ip(self):
        """모바일 IP 확인"""
        try:
            response = requests.get('https://ipinfo.io/json', timeout=10)
            ip_info = response.json()
            
            print(f"📍 현재 IP: {ip_info.get('ip')}")
            print(f"🏢 ISP: {ip_info.get('org')}")
            print(f"🌍 지역: {ip_info.get('city')}, {ip_info.get('country')}")
            
            # 모바일 통신사 IP인지 확인
            mobile_isps = ['KT', 'SKT', 'LG U+', 'SK Telecom']
            is_mobile = any(isp in ip_info.get('org', '') for isp in mobile_isps)
            
            if is_mobile:
                print("✅ 모바일 IP 확인됨")
                return True
            else:
                print("⚠️ 모바일 IP가 아닐 수 있습니다")
                return False
                
        except Exception as e:
            print(f"❌ IP 확인 실패: {e}")
            return False
    
    def test_connection(self):
        """연결 테스트"""
        print("🔍 하이브리드 연결 테스트...")
        
        # 모바일 IP 확인
        if not self.verify_mobile_ip():
            print("⚠️ 모바일 IP가 아닙니다")
        
        # 쿠팡 PC 웹 연결 테스트
        test_urls = [
            'https://www.coupang.com',
            'https://www.coupang.com/np/search?q=무선마우스'
        ]
        
        for url in test_urls:
            try:
                start_time = time.time()
                response = self.session.get(url, timeout=10)
                end_time = time.time()
                
                response_time = round((end_time - start_time) * 1000, 2)
                
                if response.status_code == 200:
                    print(f"✅ {url}: {response.status_code} ({response_time}ms)")
                else:
                    print(f"⚠️ {url}: {response.status_code} ({response_time}ms)")
                    
            except Exception as e:
                print(f"❌ {url}: 연결 실패 - {e}")
    
    def get_ranking_data(self, api_name=None, **params):
        """순위 데이터 조회"""
        if not self.captured_apis:
            print("❌ 사용 가능한 API가 없습니다")
            return None
        
        # API 선택
        if api_name:
            selected_api = None
            for api in self.captured_apis:
                if api_name in api.get('name', ''):
                    selected_api = api
                    break
            
            if not selected_api:
                print(f"❌ '{api_name}' API를 찾을 수 없습니다")
                return None
        else:
            # 첫 번째 API 사용
            selected_api = self.captured_apis[0]
        
        print(f"🎯 API 사용: {selected_api['name']}")
        print(f"📡 URL: {selected_api['url']}")
        
        try:
            # 요청 파라미터 준비
            request_params = {}
            for key, value in params.items():
                if key in selected_api.get('required_params', {}):
                    request_params[key] = value
            
            # API 호출
            if selected_api['method'] == 'GET':
                response = self.session.get(
                    selected_api['url'],
                    params=request_params,
                    timeout=30
                )
            else:
                response = self.session.post(
                    selected_api['url'],
                    json=request_params,
                    timeout=30
                )
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"✅ API 호출 성공: {len(str(data))} bytes")
                    return data
                except:
                    print(f"⚠️ JSON 파싱 실패, HTML 응답: {len(response.text)} bytes")
                    return response.text
            else:
                print(f"❌ API 호출 실패: {response.status_code}")
                print(f"응답: {response.text[:500]}")
                return None
                
        except Exception as e:
            print(f"❌ API 호출 중 오류: {e}")
            return None
    
    def search_products(self, keyword, page=1, size=60):
        """상품 검색"""
        print(f"🔍 상품 검색: {keyword} (페이지 {page})")
        
        search_data = self.get_ranking_data(
            api_name='검색',
            q=keyword,
            page=page,
            size=size
        )
        
        if not search_data:
            return None
        
        # HTML 응답인 경우 파싱
        if isinstance(search_data, str):
            return self.parse_html_search_results(search_data)
        
        # JSON 응답인 경우
        return self.parse_json_search_results(search_data)
    
    def parse_html_search_results(self, html_content):
        """HTML 검색 결과 파싱"""
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
            products = []
            
            # 상품 링크 찾기
            product_links = soup.find_all('a', href=lambda x: x and '/products/' in x)
            
            for i, link in enumerate(product_links[:60]):  # 최대 60개
                href = link.get('href', '')
                product_id = self.extract_product_id(href)
                
                if product_id:
                    product_info = {
                        'rank': i + 1,
                        'product_id': product_id,
                        'url': href if href.startswith('http') else f"https://www.coupang.com{href}",
                        'title': link.get_text(strip=True)[:100]  # 제목 일부
                    }
                    products.append(product_info)
            
            print(f"📦 HTML에서 {len(products)}개 상품 추출")
            return products
            
        except ImportError:
            print("⚠️ BeautifulSoup이 설치되지 않았습니다. pip install beautifulsoup4")
            return None
        except Exception as e:
            print(f"❌ HTML 파싱 실패: {e}")
            return None
    
    def parse_json_search_results(self, json_data):
        """JSON 검색 결과 파싱"""
        try:
            products = []
            
            # 다양한 JSON 구조 처리
            product_keys = ['productList', 'products', 'items', 'data', 'results']
            
            for key in product_keys:
                if key in json_data:
                    product_list = json_data[key]
                    if isinstance(product_list, list):
                        for i, product in enumerate(product_list):
                            product_info = {
                                'rank': i + 1,
                                'product_id': product.get('productId', product.get('id', '')),
                                'title': product.get('title', product.get('name', '')),
                                'price': product.get('price', ''),
                                'url': product.get('url', '')
                            }
                            products.append(product_info)
                        break
            
            print(f"📦 JSON에서 {len(products)}개 상품 추출")
            return products
            
        except Exception as e:
            print(f"❌ JSON 파싱 실패: {e}")
            return None
    
    def extract_product_id(self, url):
        """URL에서 상품 ID 추출"""
        import re
        
        # /products/123456 패턴 찾기
        match = re.search(r'/products/(\d+)', url)
        if match:
            return match.group(1)
        
        return None
    
    def find_product_rank(self, keyword, product_id, max_pages=5):
        """특정 상품의 순위 찾기"""
        print(f"🔍 상품 순위 검색: {keyword} - {product_id}")
        
        for page in range(1, max_pages + 1):
            print(f"📄 {page}페이지 검색 중...")
            
            # 검색 실행
            products = self.search_products(keyword, page=page)
            
            if not products:
                print(f"⚠️ {page}페이지에서 상품을 찾을 수 없습니다")
                continue
            
            # 해당 상품 찾기
            for product in products:
                if product.get('product_id') == str(product_id):
                    rank = (page - 1) * 60 + product.get('rank', 0)
                    print(f"🎉 상품 발견! 순위: {rank}위")
                    return {
                        'rank': rank,
                        'page': page,
                        'product': product
                    }
            
            print(f"📋 {page}페이지: {len(products)}개 상품 확인, 대상 상품 없음")
        
        print(f"❌ {max_pages}페이지 내에서 상품을 찾을 수 없습니다")
        return None

def main():
    """메인 실행 함수"""
    print("🚀 하이브리드 쿠팡 클라이언트 시작 (모바일 IP + PC 웹)")
    
    # 클라이언트 초기화
    client = HybridCoupangClient()
    
    # 연결 테스트
    client.test_connection()
    
    # 사용 가능한 API 목록 출력
    print("\n📋 사용 가능한 API:")
    for i, api in enumerate(client.captured_apis, 1):
        print(f"{i}. {api['name']}")
        print(f"   URL: {api['url']}")
        print(f"   파라미터: {list(api.get('required_params', {}).keys())}")
        print()
    
    # 테스트 검색
    print("🔍 테스트 검색 실행...")
    test_products = client.search_products('무선마우스', page=1, size=20)
    
    if test_products:
        print("✅ 테스트 검색 성공!")
        print(f"추출된 상품 수: {len(test_products)}")
        
        if test_products:
            print("첫 번째 상품 정보:")
            first_product = test_products[0]
            for key, value in first_product.items():
                print(f"  {key}: {value}")
    else:
        print("❌ 테스트 검색 실패")

if __name__ == "__main__":
    main()










